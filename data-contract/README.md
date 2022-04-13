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
./build.sh
# If you get the error discussed at https://stackoverflow.com/a/70883283/470749, try first running:
rustup target add wasm32-unknown-unknown
```

# Deploy

Modify `init_args.json` file to fit your needs, particularly `owner_id`.

The `metadata.name` field is what will be the section header of the [Collectibles tab of Wallet](https://wallet.testnet.near.org/?tab=collectibles). It seems reasonable for this to say "NEAR University".

It might be worth reviewing the Metadata standard: https://nomicon.io/Standards/NonFungibleToken/Metadata#interface but many fields are probably fine as `null`.

You might want something in the `icon` field so that it looks nice in a wallet. The `icon` field controls which image is used at the contract level. See the note in the above Nomicon page about using an optimized SVG in the data URL. https://npm.runkit.com/mini-svg-data-uri looks useful.  

The Collectibles tab of Wallet lists out NFTs nested within groups, where each group is a contract (and displays its name and icon as mentioned above). Then each NFT within the group has its own name and icon, but its icon is defined in `token_metadata.media`. See [sample_mint.json](sample_mint.json).

## Testnet

```bash
NEAR_ENV=testnet near login
./dev_deploy.sh
```

Any arguments are forwarded to `near dev-deploy` command.

For example, to deploy to a new dev address (ignoring a previously generated address in `neardev/`):

```bash
./dev_deploy.sh --force
```

## Mainnet (initial deployment)

```bash
NEAR_ENV=mainnet ./deploy.sh ACCOUNT_ID
```

## Mainnet (if you need to redeploy, overwriting the original contract)

Temporarily delete the `--initFunction new \` line from `deploy.sh` and then run the command as mentioned above.

There is also a `set_metadata` function available if we want to edit contract metadata without redeploying. See [this commit](https://github.com/NEAR-Edu/near-certification-tools/commit/a60e2f339c8e17b72af1d74d0b844c85348abf1a).

# Interactions

This contract implements the following standards:

- [NEP171 v1.0.0 - NFT Core](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/Core.md) (Only
  completely compliant if the `can_transfer` option is `true` during initialization.)
- [NEP177 v2.0.0 - NFT Metadata](https://github.com/near/NEPs/blob/cde5f56688bb74bfd01b38b9c8492c0e37c404be/specs/Standards/NonFungibleToken/Metadata.md)
- [NEP178 v1.0.0 - NFT Approval Managemenet](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/ApprovalManagement.md)
- [NEP181 v1.0.0 - NFT Enumeration](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/Enumeration.md)

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

In `token_metadata`, 'title', 'description', and 'issued_at' are the only fields we will use.

Please ensure that the value for `program` in `certification_metadata` matches the prefix of one of the SVG files in `web-app/public/certificate-backgrounds/`.

---

## Example Interactions

### View certificate metadata

After deploying a contract, such as via `./dev-deploy.sh`, you can view certificate metadata by running something like `NEAR_ENV=testnet near view <contract ID> nft_metadata`. Example:

```bash
NEAR_ENV=testnet near view dev-1643292007908-55838431863482 nft_metadata
```

### Issue a certificate

You can now issue a certificate by running something like `NEAR_ENV=testnet near call <the contract ID> nft_mint '<a JSON payload similar to as shown in sample_mint.json>' --account-id <whichever account you logged in as>.testnet --deposit 0.2 --gas 300000000000000`. Example:

```bash
NEAR_ENV=testnet near call dev-1643292007908-55838431863482 nft_mint "$(<./data-contract/sample_mint.json)" --account-id ryancwalsh.testnet --deposit 0.2 --gas 300000000000000
```

### View Certificate

Then you can view those details of that certificate on the blockchain by running something like `NEAR_ENV=testnet near view <contract ID> nft_token '{"token_id": "<token ID>"}'`. Example:

```bash
NEAR_ENV=testnet near view dev-1643292007908-55838431863482 nft_token '{"token_id": "103216412112497cb6c193152a27c49a"}'
```

### View all NFTs (from this contract) owned by an account

Run something like `NEAR_ENV=testnet near view <the contract ID> nft_tokens_for_owner '{"account_id": "<the account ID>"}'`. See https://nomicon.io/Standards/NonFungibleToken/Enumeration.html#interface . `from_index` defaults to 0 and `limit` defaults to unlimited. Example:

```bash
NEAR_ENV=testnet near view dev-1643292007908-55838431863482 nft_tokens_for_owner '{"account_id": "hatchet.testnet"}'
```

### Invalidate a cert

Run something like `NEAR_ENV=testnet near call <the contract ID> cert_invalidate '{ "token_id": "<some token ID>"}' --account-id <whichever account you logged in as>.testnet --depositYocto 1 --gas 300000000000000`. Example:

```bash
NEAR_ENV=testnet near call dev-1643292007908-55838431863482 cert_invalidate '{ "token_id": "303216412112497cb6c193152a27c49c"}' --account-id ryancwalsh.testnet --depositYocto 1 --gas 300000000000000
```

---

# Notes about versions, standards, datetime types and formats, etc

There are 3 levels of metadata in this smart contract: the NFT contract level, the NFT token itself, and the CertificationExtraMetadata (which is specific to this project).

`data-contract/Cargo.toml` currently says `near-contract-standards = "4.0.0-pre.4"`.

`.cargo/registry/src/github.com-1ecc6299db9ec823/near-contract-standards-4.0.0-pre.4/src/non_fungible_token/metadata.rs` (or whichever file gets pulled in based on Cargo.toml) then defines NFT_METADATA_SPEC; take note of this version value. 

The "metadata" part of `data-contract/init_args.json` complies with the standard the defines NFTs: NEP171 (TODO: specify which version here).
We must manually set its "spec" field value to match the value of NFT_METADATA_SPEC.

The token_metadata part of `data-contract/sample_mint.json` complies with standard NEP177 (TODO: specify which version here). Jacob and Ryan are not sure which version we're using (probably 1.0.0). We think its date fields (issued_at, expires_at, starts_at, updated_at) expect strings of milliseconds. https://discord.com/channels/490367152054992913/542945453533036544/958832442121277440 (https://github.com/near/NEPs/blob/ca5f5a70e7ca2214d38723c756f9b5ae5c3b5e9d/specs/Standards/NonFungibleToken/Metadata.md had contradicting instructions.)

`web-app/pages/api/sample_api_payload.json` expects null or a string of format ISO 8601 (see https://day.js.org/docs/en/parse/string) for program_start_date and program_end_date. Our API endpoint then converts them to a string of nanoseconds.

# Errors

If you get `Smart contract panicked: Unauthorized` when trying to mint an NFT, check what you used for `owner_id` in `init_args.json` and whether you used that in the `--account-id` argument of the CLI call.