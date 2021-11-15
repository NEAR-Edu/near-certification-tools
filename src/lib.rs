use std::collections::HashMap;

use near_contract_standards::{
    non_fungible_token::{
        core::{NonFungibleTokenCore, NonFungibleTokenResolver},
        metadata::{NFTContractMetadata, NonFungibleTokenMetadataProvider, TokenMetadata},
        NonFungibleToken,
        Token,
        TokenId,
    }
};
use near_sdk::{
    AccountId,
    assert_one_yocto,
    borsh::{self, BorshDeserialize, BorshSerialize},
    BorshStorageKey,
    collections::{LazyOption, UnorderedSet},
    env,
    json_types::*,
    near_bindgen,
    PanicOnDefault,
    Promise,
    PromiseOrValue,
    require,
    serde::{Deserialize, Serialize},
    serde_json,
};

use storage_key::StorageKey;

pub use crate::contract::CertificationContract;
use crate::metadata::CertificationExtraMetadata;

mod metadata;
mod storage_key;
mod contract;

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use near_contract_standards::non_fungible_token::metadata::NFT_METADATA_SPEC;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    use crate::contract::CertificationContract;

    use super::*;

    const MINT_STORAGE_COST: u128 = 5870000000000000000000;

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    fn sample_token_metadata() -> TokenMetadata {
        TokenMetadata {
            title: Some("Olympus Mons".into()),
            description: Some("The tallest mountain in the charted solar system".into()),
            media: None,
            media_hash: None,
            copies: Some(1u64),
            issued_at: None,
            expires_at: None,
            starts_at: None,
            updated_at: None,
            extra: None,
            reference: None,
            reference_hash: None,
        }
    }

    #[test]
    fn test_new() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());
        let contract = CertificationContract::new(accounts(1).into(), NFTContractMetadata {
            name: "Test Contract".to_string(),
            symbol: "XTC".to_string(),
            spec: NFT_METADATA_SPEC.to_string(),
            reference: None,
            reference_hash: None,
            base_uri: None,
            icon: None,
        });
        testing_env!(context.is_view(true).build());
        assert_eq!(contract.nft_token("1".to_string()), None);
        println!("{}", CertificationExtraMetadata {
            authority_account_id: None,
            authority_name: Some("Certificate Authority".to_string()),
            program_id: Some("PRG101".to_string()),
            program_name: Some("Test Program".to_string()),
            program_start_date: None,
            program_end_date: None,
            original_recipient_account_id: None,
            original_recipient_name: Some("John Doe".to_string()),
            transferable: false,
        }.to_json())
    }
}

// #[cfg(all(test, not(target_arch = "wasm32")))]
// mod tests {
//     use near_sdk::test_utils::{accounts, VMContextBuilder};
//     use near_sdk::testing_env;
//
//     use super::*;
//
//     const MINT_STORAGE_COST: u128 = 5870000000000000000000;
//
//     fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
//         let mut builder = VMContextBuilder::new();
//         builder
//             .current_account_id(accounts(0))
//             .signer_account_id(predecessor_account_id.clone())
//             .predecessor_account_id(predecessor_account_id);
//         builder
//     }
//
//     fn sample_token_metadata() -> TokenMetadata {
//         TokenMetadata {
//             title: Some("Olympus Mons".into()),
//             description: Some("The tallest mountain in the charted solar system".into()),
//             media: None,
//             media_hash: None,
//             copies: Some(1u64),
//             issued_at: None,
//             expires_at: None,
//             starts_at: None,
//             updated_at: None,
//             extra: None,
//             reference: None,
//             reference_hash: None,
//         }
//     }
//
//     #[ignore]
//     #[test]
//     fn test_new() {
//         // let mut context = get_context(accounts(1));
//         // testing_env!(context.build());
//         // let contract = Contract::new_default_meta(accounts(1).into());
//         // testing_env!(context.is_view(true).build());
//         // assert_eq!(contract.nft_token("1".to_string()), None);
//     }
//
//     #[test]
//     #[should_panic(expected = "The contract is not initialized")]
//     fn test_default() {
//         let context = get_context(accounts(1));
//         testing_env!(context.build());
//         let _contract = Contract::default();
//     }
//
//     #[ignore]
//     #[test]
//     fn test_mint() {
//         let mut context = get_context(accounts(0));
//         testing_env!(context.build());
//         let mut contract = Contract::new_default_meta(accounts(0).into());
//
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(MINT_STORAGE_COST)
//             .predecessor_account_id(accounts(0))
//             .build());
//
//         let token_id = "0".to_string();
//         let token = contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());
//         assert_eq!(token.token_id, token_id);
//         assert_eq!(token.owner_id, accounts(0));
//         assert_eq!(token.metadata.unwrap(), sample_token_metadata());
//         assert_eq!(token.approved_account_ids.unwrap(), HashMap::new());
//     }
//
//     #[ignore]
//     #[test]
//     fn test_transfer() {
//         let mut context = get_context(accounts(0));
//         testing_env!(context.build());
//         let mut contract = Contract::new_default_meta(accounts(0).into());
//
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(MINT_STORAGE_COST)
//             .predecessor_account_id(accounts(0))
//             .build());
//         let token_id = "0".to_string();
//         contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());
//
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(1)
//             .predecessor_account_id(accounts(0))
//             .build());
//         contract.nft_transfer(accounts(1), token_id.clone(), None, None);
//
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .account_balance(env::account_balance())
//             .is_view(true)
//             .attached_deposit(0)
//             .build());
//         if let Some(token) = contract.nft_token(token_id.clone()) {
//             assert_eq!(token.token_id, token_id);
//             assert_eq!(token.owner_id, accounts(1));
//             assert_eq!(token.metadata.unwrap(), sample_token_metadata());
//             assert_eq!(token.approved_account_ids.unwrap(), HashMap::new());
//         } else {
//             panic!("token not correctly created, or not found by nft_token");
//         }
//     }
//
//     #[ignore]
//     #[test]
//     fn test_approve() {
//         let mut context = get_context(accounts(0));
//         testing_env!(context.build());
//         let mut contract = Contract::new_default_meta(accounts(0).into());
//
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(MINT_STORAGE_COST)
//             .predecessor_account_id(accounts(0))
//             .build());
//         let token_id = "0".to_string();
//         contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());
//
//         // alice approves bob
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(150000000000000000000)
//             .predecessor_account_id(accounts(0))
//             .build());
//         contract.nft_approve(token_id.clone(), accounts(1), None);
//
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .account_balance(env::account_balance())
//             .is_view(true)
//             .attached_deposit(0)
//             .build());
//         assert!(contract.nft_is_approved(token_id.clone(), accounts(1), Some(1)));
//     }
//
//     #[ignore]
//     #[test]
//     fn test_revoke() {
//         let mut context = get_context(accounts(0));
//         testing_env!(context.build());
//         let mut contract = Contract::new_default_meta(accounts(0).into());
//
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(MINT_STORAGE_COST)
//             .predecessor_account_id(accounts(0))
//             .build());
//         let token_id = "0".to_string();
//         contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());
//
//         // alice approves bob
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(150000000000000000000)
//             .predecessor_account_id(accounts(0))
//             .build());
//         contract.nft_approve(token_id.clone(), accounts(1), None);
//
//         // alice revokes bob
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(1)
//             .predecessor_account_id(accounts(0))
//             .build());
//         contract.nft_revoke(token_id.clone(), accounts(1));
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .account_balance(env::account_balance())
//             .is_view(true)
//             .attached_deposit(0)
//             .build());
//         assert!(!contract.nft_is_approved(token_id.clone(), accounts(1), None));
//     }
//
//     #[ignore]
//     #[test]
//     fn test_revoke_all() {
//         let mut context = get_context(accounts(0));
//         testing_env!(context.build());
//         let mut contract = Contract::new_default_meta(accounts(0).into());
//
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(MINT_STORAGE_COST)
//             .predecessor_account_id(accounts(0))
//             .build());
//         let token_id = "0".to_string();
//         contract.nft_mint(token_id.clone(), accounts(0), sample_token_metadata());
//
//         // alice approves bob
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(150000000000000000000)
//             .predecessor_account_id(accounts(0))
//             .build());
//         contract.nft_approve(token_id.clone(), accounts(1), None);
//
//         // alice revokes bob
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .attached_deposit(1)
//             .predecessor_account_id(accounts(0))
//             .build());
//         contract.nft_revoke_all(token_id.clone());
//         testing_env!(context
//             .storage_usage(env::storage_usage())
//             .account_balance(env::account_balance())
//             .is_view(true)
//             .attached_deposit(0)
//             .build());
//         assert!(!contract.nft_is_approved(token_id.clone(), accounts(1), Some(1)));
//     }
// }
