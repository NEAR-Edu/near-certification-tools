use axum::{debug_handler, extract::Path, Json};
use errors::APIResult;

mod db;
mod query;

#[derive(serde::Deserialize, serde::Serialize)]
pub struct CertificateData {
    token_id: String,
    date: String,
    expiration: String,
    program_name: String,
    program_code: String,
    program_description: String,
    instructor: String,
    account_name: String,
}

#[derive(serde::Deserialize)]
struct CertificateExtraMetadata {
    authority_id: Option<String>,
    program: Option<String>,
    valid: bool,
}

async fn get_cert_data(token_id: &str) -> APIResult<CertificateData> {
    let token = common::get_token(token_id).await?;

    let Some(metadata) = token.metadata else {
        return Err(errors::APIError::NoMetadataError { token_id: token_id.to_string() });
    };

    let Some(issued_at) = metadata.issued_at else {
        return Err(errors::APIError::NoMetadataError { token_id: token_id.to_string() });
    };

    let account_name = token.owner_id.to_string();

    let expiration = db::get_expiration(&account_name, &issued_at.clone()).await?;

    let Some(extra_metadata) = metadata.extra else {
        return Err(errors::APIError::NoMetadataError { token_id: token_id.to_string() });
    };

    let Ok(extra_metadata) = serde_json::from_str::<CertificateExtraMetadata>(&extra_metadata) else {
        return Err(errors::APIError::ExtraMetadataInvalid { extra: extra_metadata.to_string() });
    };

    if !extra_metadata.valid {
        return Err(errors::APIError::CertificateInvalid {
            token_id: token_id.to_string(),
        });
    }

    let Some(program_code) = extra_metadata.program else {
        return Err(errors::APIError::NoMetadataError { token_id: token_id.to_string() });
    };

    let Some(program_name) = metadata.title else {
        return Err(errors::APIError::NoMetadataError { token_id: token_id.to_string() });
    };

    let Some(program_description) = metadata.description else {
        return Err(errors::APIError::NoMetadataError { token_id: token_id.to_string() });
    };

    let Some(instructor) = extra_metadata.authority_id else {
        return Err(errors::APIError::NoMetadataError { token_id: token_id.to_string() });
    };

    Ok(CertificateData {
        token_id: token.token_id,
        date: issued_at,
        expiration,
        account_name,
        instructor,
        program_name,
        program_code,
        program_description,
    })
}

#[debug_handler]
pub async fn handler(Path(token_id): Path<String>) -> APIResult<Json<CertificateData>> {
    Ok(Json(get_cert_data(&token_id).await?))
}
