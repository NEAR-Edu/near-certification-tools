use axum::{
    debug_handler,
    extract::{Json, State},
    http::StatusCode,
};
use common::{SignerData, TGAS, YOCTO_NEAR};
use errors::APIResult;
use near_primitives::{
    transaction::{Action, FunctionCallAction},
    views::FinalExecutionStatus,
};

#[derive(serde::Deserialize)]
pub struct Payload {
    account_id: String,
}

async fn call_cert_invalidate(account_id: &str, signer_data: SignerData) -> APIResult<bool> {
    let tokens = common::get_tokens_for_owner(account_id).await?;

    let actions = tokens
        .into_iter()
        .map(|token| {
            let method_name = "cert_invalidate".to_string();
            let gas = 100 * TGAS;
            let deposit = YOCTO_NEAR;
            let args = serde_json::json!({"token_id": token.token_id})
                .to_string()
                .into_bytes();

            Action::FunctionCall(FunctionCallAction {
                method_name,
                args,
                gas,
                deposit,
            })
        })
        .collect();

    match common::send_transaction_to_certs(actions, signer_data)
        .await?
        .status
    {
        FinalExecutionStatus::SuccessValue(_) => Ok(true),
        FinalExecutionStatus::Failure(error) => Err(errors::APIError::InvalidateFailure {
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
    Json(Payload { account_id }): Json<Payload>,
) -> APIResult<(StatusCode, String)> {
    call_cert_invalidate(&account_id, signer_data).await?;

    Ok((StatusCode::OK, "Invalidation successfull.".to_string()))
}
