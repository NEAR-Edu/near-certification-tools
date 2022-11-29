use std::net::SocketAddr;

use router::create_router;

#[tokio::main]
async fn main() -> errors::APIResult<()> {
    let router = create_router();

    let address = SocketAddr::from(([127, 0, 0, 1], 4000));
    println!("Server listening on {address}");

    match axum::Server::bind(&address)
        .serve(router.into_make_service())
        .await
    {
        Ok(_) => Ok(()),
        Err(error) => {
            eprintln!("{error:?}");
            Err(errors::APIError::ServerError)
        }
    }
}
