use axum::extract::FromRef;
use errors::APIResult;
use near_certification_tools::Token;
use near_jsonrpc_client::{methods, JsonRpcClient};
use near_jsonrpc_primitives::types::query::QueryResponseKind;
use near_primitives::{
    hash::CryptoHash,
    transaction::{Action, Transaction},
    types::{BlockReference, FunctionArgs},
    views::{AccessKeyView, CallResult, FinalExecutionOutcomeView},
};

pub const TGAS: u64 = 100_000_000_000_000;
pub const NEAR: u128 = 1_000_000_000_000_000_000_000_000;
pub const YOCTO_NEAR: u128 = 1;

#[derive(Clone)]
pub struct SignerData {
    pub account_id: String,
    pub private_key: String,
}

#[derive(Clone, FromRef)]
pub struct AppData {
    pub signer_data: SignerData,
}

impl AppData {
    pub fn new() -> Self {
        let account_id = std::env::var("ISSUING_AUTHORITY_ACCOUNT_ID")
            .expect("No authority account ID in environment!");
        let private_key = std::env::var("ISSUING_AUTHORITY_PRIVATE_KEY")
            .expect("No authority private key in environment!");

        AppData {
            signer_data: SignerData {
                account_id,
                private_key,
            },
        }
    }
}

fn connect_rpc() -> JsonRpcClient {
    let rpc_url = std::env::var("RPC_URL").expect("Missing RPC URL!");

    JsonRpcClient::connect(&rpc_url)
}

pub async fn view_access_key(
    account_id: &str,
    private_key: &str,
) -> APIResult<(CryptoHash, AccessKeyView)> {
    let Ok(account_id) = account_id.parse() else {
        return Err(errors::APIError::AccountInvalid { account_id: account_id.to_string() });
    };

    let Ok(private_key) = private_key.parse() else {
        return Err(errors::APIError::PrivateKeyInvalid { private_key: private_key.to_string() });
    };

    let near_crypto::InMemorySigner {
        account_id,
        public_key,
        ..
    } = near_crypto::InMemorySigner::from_secret_key(account_id, private_key);

    let Ok(near_jsonrpc_primitives::types::query::RpcQueryResponse {
        kind, block_hash, ..
    }) = connect_rpc().call(
        methods::query::RpcQueryRequest {
            block_reference: BlockReference::latest(),
            request: near_primitives::views::QueryRequest::ViewAccessKey {
                account_id,
                public_key,
            },
        }
    ).await else {
        return Err(errors::APIError::ServerError);
    };

    let QueryResponseKind::AccessKey(access_key_view) = kind else {
        return Err(errors::APIError::ServerError);
    };

    Ok((block_hash, access_key_view))
}

pub async fn check_account_id(account_id: &str) -> APIResult<bool> {
    let Ok(account_id_parsed) = account_id.parse() else {
        return Err(errors::APIError::AccountInvalid { account_id: account_id.to_string() });
    };

    match connect_rpc()
        .call(methods::query::RpcQueryRequest {
            block_reference: BlockReference::latest(),
            request: near_primitives::views::QueryRequest::ViewAccount {
                account_id: account_id_parsed,
            },
        })
        .await
    {
        Ok(_) => Ok(true),
        Err(_) => Err(errors::APIError::AccountNotFound {
            account_id: account_id.parse().unwrap(),
        }),
    }
}

pub async fn get_tokens_for_owner(account_id: &str) -> APIResult<Vec<Token>> {
    let contract_id = "certificates.unv.near".parse().unwrap();
    let method_name = "nft_tokens_for_owner".to_string();
    let args = FunctionArgs::from(
        serde_json::json!({ "account_id": account_id })
            .to_string()
            .into_bytes(),
    );

    let Ok(near_jsonrpc_primitives::types::query::RpcQueryResponse {
        kind, ..
    }) = connect_rpc().call(methods::query::RpcQueryRequest {
        block_reference: BlockReference::latest(),
        request: near_primitives::views::QueryRequest::CallFunction {
            account_id: contract_id,
            method_name,
            args,
        },
    }).await else {
        return Err(errors::APIError::ServerError);
    };

    let QueryResponseKind::CallResult(CallResult{result, ..}) = kind else {
        return Err(errors::APIError::ServerError);
    };

    Ok(deserialize_bytes(&result)?)
}

pub async fn get_token(token_id: &str) -> APIResult<Token> {
    let account_id = "certificates.unv.near".parse().unwrap();
    let method_name = "nft_token".to_string();
    let args = FunctionArgs::from(
        serde_json::json!({ "token_id": token_id })
            .to_string()
            .into_bytes(),
    );

    let Ok(near_jsonrpc_primitives::types::query::RpcQueryResponse {
        kind, ..
    }) = connect_rpc().call(methods::query::RpcQueryRequest {
        block_reference: BlockReference::latest(),
        request: near_primitives::views::QueryRequest::CallFunction {
            account_id,
            method_name,
            args,
        },
    }).await else {
        return Err(errors::APIError::ServerError);
    };

    let QueryResponseKind::CallResult(CallResult{result, ..}) = kind else {
        return Err(errors::APIError::ServerError);
    };

    Ok(deserialize_bytes(&result)?)
}

pub async fn send_transaction_to_certs(
    actions: Vec<Action>,
    SignerData {
        account_id,
        private_key,
    }: SignerData,
) -> APIResult<FinalExecutionOutcomeView> {
    let (block_hash, access_key_view) = view_access_key(&account_id, &private_key).await?;

    let nonce = access_key_view.nonce + 1;

    let receiver_id = "certificates.unv.near".parse().unwrap();
    let signer = near_crypto::InMemorySigner::from_secret_key(
        account_id.parse().unwrap(),
        private_key.parse().unwrap(),
    );

    let transaction = Transaction {
        signer_id: signer.account_id.clone(),
        public_key: signer.public_key.clone(),
        nonce,
        receiver_id,
        block_hash,
        actions,
    };

    let request = methods::broadcast_tx_commit::RpcBroadcastTxCommitRequest {
        signed_transaction: transaction.sign(&signer),
    };

    match connect_rpc().call(request).await {
        Ok(res) => Ok(res),
        Err(error) => {
            println!("{error:?}");
            Err(errors::APIError::ServerError)
        }
    }
}

pub fn deserialize_bytes<'input_lifetime, Type>(bytes: &'input_lifetime [u8]) -> APIResult<Type>
where
    Type: serde::de::Deserialize<'input_lifetime>,
{
    match serde_json::from_slice(bytes) {
        Ok(result) => Ok(result),
        Err(_) => Err(errors::APIError::DeserializationError {
            string: match String::from_utf8(bytes.to_owned()) {
                Ok(string) => string,
                Err(_) => {
                    return Err(errors::APIError::ParseError {
                        bytes: bytes.to_owned(),
                    })
                }
            },
        }),
    }
}
