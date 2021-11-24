# NEAR Certification Tools - View Contract

This AssemblyScript contract provides a public interface for generating custom renderings of [certification metadata](../data-contract/).

# Build

## Debug

```txt
$ npm run build:debug
```

## Release

```txt
$ npm run build:release
```

# Test

```txt
$ npm run test
```

# Deploy

## Testnet

```txt
$ npm run dev-deploy [-- --force]
```

## Mainnet

*TODO*

# Interface

## `init`

Initialization function. Takes an owner account ID.

## `setFormatTemplate`

Owner-only, requires deposit of 1 yoctoNEAR. Sets the template string for a format.

### Template Syntax

Almost every field in the NEP-171, NEP-177, and Certification metadata standards are available to templates.

Replacement syntax is as follows:

```hbs
{namespace.identifier}
```

Fields in the NEP-171 and NEP-177 standards are available under the `token` namespace.

For example:

```hbs
{token.id} => replaced with the NEP-171 token ID
```

Fields in the [certification metadata standard](../data-contract/src/metadata.rs) are available under the `cert` namespace.

## `view`

Accepts a token metadata struct and a format identifier. Returns the rendered format template.
