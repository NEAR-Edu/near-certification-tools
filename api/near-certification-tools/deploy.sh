#!/usr/bin/env bash

near deploy \
  --wasmFile ./target/wasm32-unknown-unknown/release/near_certification_tools.wasm \
  --accountId "$1" \
  --initFunction new \
  --initArgs "$(<init_args.json)"
