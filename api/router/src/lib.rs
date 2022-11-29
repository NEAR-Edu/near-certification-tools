use axum::{
    http::Request,
    middleware::{self, Next},
    response::Response,
    routing::{delete, get, post},
};
use errors::APIResult;

async fn authorize<B>(request: Request<B>, next: Next<B>) -> APIResult<Response> {
    let Some(x_api_key_header) = request.headers().get("x-api-key") else {
        return Err(errors::APIError::Unauthorized);
    };

    let Ok(x_api_key) = x_api_key_header.to_str() else {
        return Err(errors::APIError::Unauthorized);
    };

    let api_key = std::env::var("API_KEY").expect("Missing API key!");

    if api_key == x_api_key {
        Ok(next.run(request).await)
    } else {
        Err(errors::APIError::Unauthorized)
    }
}

pub fn create_router() -> axum::Router {
    let auth_middleware = middleware::from_fn(authorize);

    axum::Router::new()
        .route(
            "/mint-cert",
            post(mint_cert::handler).layer(auth_middleware.clone()),
        )
        .route(
            "/invalidate-all-certs-for-account",
            delete(invalidate_all_certs_for_account::handler).layer(auth_middleware.clone()),
        )
        .route(
            "/invalidate-cert",
            delete(invalidate_cert::handler).layer(auth_middleware),
        )
        .route("/cert/:token_id", get(cert::handler))
        .with_state(common::AppData::new())
}
