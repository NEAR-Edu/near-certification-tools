pub use anyhow;
use axum::response::IntoResponse;

#[derive(thiserror::Error, Debug, serde::Serialize)]
pub enum APIError {
    #[error("Invalid account ID provided. {account_id:?} does not exist.")]
    AccountNotFound {
        account_id: near_primitives::types::AccountId,
    },
    #[error("Invalid account ID provided. {account_id} did not pass validation.")]
    AccountInvalid { account_id: String },
    #[error("Invalid private key provided. {private_key} did not pass validation.")]
    PrivateKeyInvalid { private_key: String },
    #[error("Minting the certificate failed with error: {message}.")]
    MintFailure { message: String },
    #[error("Invalidating the certificate failed with error: {message}.")]
    InvalidateFailure { message: String },
    #[error("Error parsing bytes: {bytes:?}.")]
    ParseError { bytes: Vec<u8> },
    #[error("Error deserializing string: {string}.")]
    DeserializationError { string: String },
    #[error("No metadata for token with ID: {token_id}.")]
    NoMetadataError { token_id: String },
    #[error("Extra metadata is invalid: {extra}.")]
    ExtraMetadataInvalid { extra: String },
    #[error("Couldn't connect to database: {database_url}")]
    DBConnectionError { database_url: String },
    #[error("Error executing query.")]
    DBQueryExecutionError,
    #[error("Certificate with ID: {token_id} is invalid.")]
    CertificateInvalid { token_id: String },
    #[error("Unauthorized request.")]
    Unauthorized,
    #[error("Something unexpected went wrong.")]
    ServerError,
}

impl IntoResponse for APIError {
    fn into_response(self) -> axum::response::Response {
        let status_code = match self {
            APIError::Unauthorized => axum::http::StatusCode::UNAUTHORIZED,
            _ => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        };

        (status_code, format!("{self}")).into_response()
    }
}

pub type APIResult<SuccessValue> = Result<SuccessValue, APIError>;
