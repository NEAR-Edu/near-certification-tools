# NEAR Certification Tools

This project is a collection of smart contracts and a web interface to view and manage NEP171-compatible NFT certification tokens.

# Build

```text
$ ./build.sh
```

# Deploy

Modify `init_args.json` file to fit your needs, particularly `owner_id`.

## Testnet

```text
$ ./dev_deploy.sh
```

## Mainnet

```text
$ ./deploy.sh ACCOUNT_ID
```

# Interactions

This contract implements the following standards:

* [NEP171 v1.0.0 - NFT Core](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/Core.md) (Only completely compliant if the `transferable` option is `true` during initialization.)
* [NEP177 v2.0.0 - NFT Metadata](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/Metadata.md)
* [NEP178 v1.0.0 - NFT Approval Managemenet](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/ApprovalManagement.md)
* [NEP181 v1.0.0 - NFT Enumeration](https://github.com/near/NEPs/blob/master/specs/Standards/NonFungibleToken/Enumeration.md)

This contract also serves as the de-facto standard for NEAR Edu Certification compatible contracts:

## Functions

### `owner_id`

Returns the account ID of the contract owner.

### `cert_allows_nft_transfer`

Returns `true` if the contract allows NFT certifications to be transferred after issue, and `false` otherwise. Note that if NFT transfers are disallows, this causes the contract to be (technically) non-compliant with the NEP171 standard.

### `cert_allows_invalidation`

Returns `true` if the contract owner is allowed to invalidate  existing certifications by setting the `valid` property to `false`. Note that invalidation does not delete an NFT or change its ownership.

### `cert_is_valid`

Returns `true` if a particular token's `valid` property is `true`, and `false` otherwise. Invalidated tokens will have this property set to `false`.

### `cert_invalidate`

Owner-only. Sets the `valid` property to `false` for a particular token. Panics if the contract does not allow invalidation.

### `nft_mint`

Owner-only; non-standard but well-known NFT minting function.

## Metadata

Additional metadata is stored in the `extra` field of the standard-compliant NFT metadata. See [`src/metadata.rs`](src/metadata.rs).
