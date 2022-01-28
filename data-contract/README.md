# NEAR Certification Tools - Data Contract

This Rust contract provides the foundational data model for certifications, issuing standards-compliant NFTs.

# Design Rationale

A notable difference between the implementation of this contract and many other NFT projects is that all of the metadata
is stored on-chain. This is for the purpose of reducing overhead to client implementation, and also because storage on
NEAR is so darn cheap.

# Install Rust and Cargo
https://doc.rust-lang.org/cargo/getting-started/installation.html#install-rust-and-cargo
```bash
curl https://sh.rustup.rs -sSf | sh
```
You might want to close and reopen your IDE (e.g. VSC) and install any Rust-related extensions too.

# Build

```bash
$ ./build.sh
# If you get the error discussed at https://stackoverflow.com/a/70883283/470749, try first running:
rustup target add wasm32-unknown-unknown
```

# Deploy

Modify `init_args.json` file to fit your needs, particularly `owner_id`.

## Testnet

```bash
$ ./dev_deploy.sh
```

Any arguments are forwarded to `near dev-deploy` command.

For example, to deploy to a new dev address (ignoring a previously generated address in `neardev/`):

```bash
$ ./dev_deploy.sh --force
```

## Mainnet

```bash
$ ./deploy.sh ACCOUNT_ID
```

# Interactions

This contract implements the following standards:

* [NEP171 v1.0.0 - NFT Core](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/Core.md) (Only
  completely compliant if the `can_transfer` option is `true` during initialization.)
* [NEP177 v2.0.0 - NFT Metadata](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/Metadata.md)
* [NEP178 v1.0.0 - NFT Approval Managemenet](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/ApprovalManagement.md)
* [NEP181 v1.0.0 - NFT Enumeration](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/Enumeration.md)

This contract also serves as the de-facto standard for NEAR Edu Certification compatible contracts:

## Functions

### `owner_id`

Returns the account ID of the contract owner.

### `cert_can_transfer`

Returns `true` if the contract allows NFT certifications to be transferred after issue, and `false` otherwise. Note that
if NFT transfers are disallows, this causes the contract to be (technically) non-compliant with the NEP171 standard.

### `cert_can_invalidate`

Returns `true` if the contract owner is allowed to invalidate existing certifications by setting the `valid` property
to `false`. Note that invalidation does not delete an NFT or change its ownership.

### `cert_is_valid`

Returns `true` if a particular token's `valid` property is `true`, and `false` otherwise. Invalidated tokens will have
this property set to `false`.

### `cert_invalidate`

Owner-only. Sets the `valid` property to `false` for a particular token. Panics if the contract does not allow
invalidation.

### `nft_mint`

Owner-only; non-standard but well-known NFT minting function.

## Metadata

Additional metadata is stored in the `extra` field of the standard-compliant NFT metadata.
See [`src/metadata.rs`](src/metadata.rs).
The 'memo' field at the root (outer) level of [sample_mint.json](sample_mint.json) can be null because its value currently does not get used.

In token_metadata, 'title', 'description', and 'issued_at' are the only fields we will use.