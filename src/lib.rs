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
    Balance,
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
    StorageUsage,
};

use storage_key::StorageKey;

pub use crate::contract::CertificationContract;
use crate::metadata::CertificationExtraMetadata;

mod metadata;
mod storage_key;
mod contract;
mod utils;

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use near_contract_standards::non_fungible_token::metadata::NFT_METADATA_SPEC;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    use crate::contract::CertificationContract;

    use super::*;

    const MINT_MAX_COST: u128 = 20000000000000000000000;

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .signer_account_id(predecessor_account_id.clone())
            .predecessor_account_id(predecessor_account_id);
        builder
    }

    fn sample_metadata_contract() -> NFTContractMetadata {
        NFTContractMetadata {
            name: "Organization Certification Issuer".to_string(),
            symbol: "XOCI".to_string(),
            spec: NFT_METADATA_SPEC.to_string(),
            reference: None,
            reference_hash: None,
            base_uri: None,
            icon: None,
        }
    }

    fn sample_metadata_token() -> TokenMetadata {
        TokenMetadata {
            title: Some("Certified White Hat Hacker".into()),
            description: Some("This certifies that the recipient has fulfilled Organization, Inc.'s requirements as a white hat hacker.".into()),
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

    fn sample_metadata_certification_transferable() -> CertificationExtraMetadata {
        CertificationExtraMetadata {
            authority_account_id: Some("john_instructor.near".parse().unwrap()),
            authority_name: Some("John Instructor".into()),
            program_id: None, //Some("TR101".into()),
            program_name: None,// Some("White hat hacking with transferable certification".into()),
            program_start_date: None,
            program_end_date: None,
            original_recipient_account_id: Some("original_recipient.near".parse().unwrap()),
            original_recipient_name: Some("Original Recipient".into()),
            transferable: true,
        }
    }

    fn sample_metadata_certification_nontransferable() -> CertificationExtraMetadata {
        CertificationExtraMetadata {
            authority_account_id: Some("john_instructor.near".parse().unwrap()),
            authority_name: Some("John Instructor".to_string()),
            program_id: None, //Some("NTR102".to_string()),
            program_name: None, //Some("White hat hacking with nontransferable certification".to_string()),
            program_start_date: None,
            program_end_date: None,
            original_recipient_account_id: Some("original_recipient.near".parse().unwrap()),
            original_recipient_name: Some("Original Recipient".to_string()),
            transferable: false,
        }
    }

    #[derive(Debug)]
    struct EnvironmentState {
        storage: StorageUsage,
        balance: Balance,
        locked_balance: Balance,
    }

    fn environment_state() -> EnvironmentState {
        EnvironmentState {
            storage: env::storage_usage(),
            balance: env::account_balance(),
            locked_balance: env::account_locked_balance(),
        }
    }

    fn start_monitor() -> EnvironmentState {
        let initial = environment_state();
        println!("Initial state: {:?}", &initial);
        initial
    }

    fn print_monitor(initial_state: EnvironmentState) {
        let final_state = environment_state();
        println!("Final state: {:?}", &final_state);

        let delta_bytes = final_state.storage - initial_state.storage;
        let yocto_cost = delta_bytes as u128 * env::storage_byte_cost();

        println!(
            "Balance delta: {} yNEAR ({} NEAR)",
            final_state.balance as i128 - initial_state.balance as i128,
            (final_state.balance as i128 - initial_state.balance as i128) as f64 / f64::powf(10f64, 24f64),
        );
        println!(
            "Storage delta: {}kB, cost: {} yNEAR ({} NEAR)",
            delta_bytes as f64 / 1000f64,
            yocto_cost,
            (yocto_cost as f64) / f64::powf(10f64, 24f64),
        );
    }

    #[test]
    fn new() {
        let mut context = get_context(accounts(1));
        testing_env!(context.build());
        let contract = CertificationContract::new(accounts(1).into(), sample_metadata_contract());
        testing_env!(context.is_view(true).build());
        assert_eq!(contract.nft_token("1".to_string()), None);
    }

    #[test]
    #[should_panic(expected = "The contract is not initialized")]
    fn uninitialized_default() {
        let context = get_context(accounts(1));
        testing_env!(context.build());
        let _contract = CertificationContract::default();
    }

    #[test]
    fn mint_transferable() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = CertificationContract::new(accounts(0).into(), sample_metadata_contract());

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_MAX_COST)
            .predecessor_account_id(accounts(0))
            .build());

        let initial_storage = start_monitor();

        let token_id = "0".to_string();
        let token = contract.nft_mint(
            token_id.clone(),
            accounts(0).into(),
            sample_metadata_token(),
            sample_metadata_certification_transferable(),
        );
        assert_eq!(token.token_id, token_id);
        assert_eq!(token.owner_id, accounts(0));
        assert_eq!(
            token.metadata.unwrap(),
            TokenMetadata {
                extra: Some(sample_metadata_certification_transferable().to_json()),
                ..sample_metadata_token()
            },
        );
        assert_eq!(token.approved_account_ids.unwrap(), HashMap::new());
        assert_eq!(contract.transferability.contains(&token_id), true, "Token is transferable");

        print_monitor(initial_storage);
    }

    #[test]
    fn mint_nontransferable() {
        let mut context = get_context(accounts(0));
        testing_env!(context.build());
        let mut contract = CertificationContract::new(accounts(0).into(), sample_metadata_contract());

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_MAX_COST)
            .predecessor_account_id(accounts(0))
            .build());

        let initial_storage = start_monitor();

        let token_id = "0".to_string();
        let token = contract.nft_mint(
            token_id.clone(),
            accounts(0).into(),
            sample_metadata_token(),
            sample_metadata_certification_nontransferable(),
        );
        assert_eq!(token.token_id, token_id);
        assert_eq!(token.owner_id, accounts(0));
        assert_eq!(
            token.metadata.unwrap(),
            TokenMetadata {
                extra: Some(sample_metadata_certification_nontransferable().to_json()),
                ..sample_metadata_token()
            },
        );
        assert_eq!(token.approved_account_ids.unwrap(), HashMap::new());
        assert_eq!(contract.transferability.contains(&token_id), false, "Token is not transferable");

        print_monitor(initial_storage);
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
