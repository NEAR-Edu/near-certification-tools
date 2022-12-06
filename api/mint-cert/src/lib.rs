use axum::{
    self, debug_handler,
    extract::{Json, State},
};
use common::{SignerData, NEAR, TGAS};
use errors::APIResult;
use near_certification_tools::{CertificationExtraMetadata, MintNFT, Token, TokenMetadata};
use near_primitives::{
    transaction::{Action, FunctionCallAction},
    views::FinalExecutionStatus,
};

#[derive(serde::Deserialize)]
pub struct MintPayloadDetails {
    title: String,
    description: String,
    issued_at: String,
    authority_id: String,
    authority_name: String,
    program: String,
    program_name: String,
    program_link: String,
    program_start_date: String,
    program_end_date: String,
    original_recipient_id: String,
    original_recipient_name: String,
}

#[derive(serde::Deserialize)]
pub struct MintPayload {
    details: MintPayloadDetails,
}

impl From<MintPayload> for MintNFT {
    fn from(MintPayload { details }: MintPayload) -> MintNFT {
        let token_id = uuid::Uuid::new_v4().to_string().replace("-", "");

        MintNFT {
            receiver_account_id: Some(details.original_recipient_id.parse().unwrap()),
            certification_metadata: CertificationExtraMetadata {
                authority_id: Some(details.authority_id.parse().unwrap()),
                authority_name: Some(details.authority_name),
                program: Some(details.program),
                program_name: Some(details.program_name),
                program_link: Some(details.program_link),
                program_start_date: Some(details.program_start_date.parse::<u64>().unwrap().into()),
                program_end_date: Some(details.program_end_date.parse::<u64>().unwrap().into()),
                original_recipient_id: Some(details.original_recipient_id.parse().unwrap()),
                original_recipient_name: Some(details.original_recipient_name),
                memo: None,
                valid: true,
            },
            token_metadata: TokenMetadata {
                title: Some(details.title),
                description: Some(details.description),
                media: Some(format!(
                    "https://certificates.near.university/api/cert/{token_id}.svg"
                )),
                copies: Some(1),
                issued_at: Some(details.issued_at),
                media_hash: None,
                expires_at: None,
                starts_at: None,
                updated_at: None,
                extra: None,
                reference: None,
                reference_hash: None,
            },
            token_id,
            memo: None,
        }
    }
}

async fn call_mint(payload: MintNFT, signer_data: SignerData) -> APIResult<Token> {
    let method_name = "nft_mint".to_string();
    let gas = 100 * TGAS;
    let deposit = NEAR / 5;
    let args = serde_json::json!(payload).to_string().into_bytes();

    let function_call = Action::FunctionCall(FunctionCallAction {
        method_name,
        args,
        gas,
        deposit,
    });

    match common::send_transaction_to_certs(vec![function_call], signer_data)
        .await?
        .status
    {
        FinalExecutionStatus::SuccessValue(value) => common::deserialize_bytes(&value),
        FinalExecutionStatus::Failure(error) => Err(errors::APIError::MintFailure {
            message: error.to_string(),
        }),
        _ => Err(errors::APIError::MintFailure {
            message: "Transaction is not yet completed.".to_string(),
        }),
    }
}

#[debug_handler]
pub async fn handler(
    State(signer_data): State<SignerData>,
    Json(payload): Json<MintPayload>,
) -> APIResult<axum::Json<Token>> {
    Ok(axum::Json(call_mint(payload.into(), signer_data).await?))
}
