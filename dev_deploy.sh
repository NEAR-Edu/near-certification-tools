#!/usr/bin/env bash

near dev-deploy \
  --wasmFile ./target/wasm32-unknown-unknown/release/near_certification_tools.wasm \
  "$@"

near call "$(<./neardev/dev-account)" new "$(<init_args.json)" --accountId "$(<./neardev/dev-account)"
