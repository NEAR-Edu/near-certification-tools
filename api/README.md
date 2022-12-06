# API

This workspace houses the smart contract which controls the NFT certificates 
which we issue in the (near-certification-tools)[./near-certification-tools]
package.

It also contains the API server for interacting with that contract - this
includes the following packages:

- (router)[./router] - This is the entry point to the API where the axum server
  gets instantiated and all the routes get combined.
- (common)[./common] - This is a collection of functions which most of the 
  routes share.
- (errors)[./errors] - This package containes the custom errors and error
  handling logic for the rest of the packages.
- (cert)[./cert] - This package is the handler for getting all the required
  information about a certificate needed for the image generation (done in
  the frontend). It queries the smart contract as well as the explorer
  database to calculate the expiration date for this particular certificate.
  **Note**: This is also the only route that doesn't require any auth.
- (mint-cert)[./mint-cert] - This package is the handler for minting a new
  certificate. It can only be performed by API key holders.
- (invalidate-all-certs-for-account)[./invalidate-all-certs-for-account] -
  This package is the handler for invalidating all certificates that are tied
  to a particular account. It can only be performed by API key holders.
- (invalidate-cert)[./invalidate-cert] - This package is the handler for
  invalidating a particular certificate. It can only be performed by API
  key holders.

The following environment variables are required in order for the API to
run, those are:

- `RPC_URL` - The URL of the RPC API to connect to (usually this is the
  mainnet URL: https://rpc.mainnet.near.org).
- `API_KEY` - The key to use as an authentication method for incoming
  requests.
- `CERTIFICATE_CONTRACT_ACCOUNT_ID` - The account ID of the contract
  which controls the certificate issuing/invalidating.
- `ISSUING_AUTHORITY_ACCOUNT_ID` - The account ID of the authorized
  issuer/invalidator of certificates.
- `ISSUING_AUTHORITY_PRIVATE_KEY` - The private key associated with the
  issuer/invalidator account.

You can run the API server by running the following command:

```shell
cargo run --package router
```

