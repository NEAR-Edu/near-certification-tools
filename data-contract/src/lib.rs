pub use crate::contract::CertificationContract;

mod contract;
mod event;
mod metadata;
mod storage_key;
mod utils;

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use std::collections::HashMap;

    use near_contract_standards::non_fungible_token::{
        approval::NonFungibleTokenApproval,
        core::NonFungibleTokenCore,
        enumeration::NonFungibleTokenEnumeration,
        metadata::{NFTContractMetadata, TokenMetadata, NFT_METADATA_SPEC},
    };
    use near_sdk::{
        env,
        test_utils::{accounts, VMContextBuilder},
        testing_env, AccountId, Balance, StorageUsage,
    };

    use crate::{
        contract::{CertificationContract, CertificationContractInitOptions},
        metadata::CertificationExtraMetadata,
    };

    const MINT_MAX_COST: u128 = 20000000000000000000000;

    fn get_context(predecessor_account_id: AccountId) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .current_account_id(accounts(0))
            .account_balance(14500000000000000000000000)
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
            authority_id: Some("john_instructor.near".parse().unwrap()),
            authority_name: Some("John Instructor".into()),
            program: Some("TR101".into()),
            program_name: Some("White hat hacking with transferable certification".into()),
            program_link: Some("https://near.university".into()),
            program_start_date: None,
            program_end_date: None,
            original_recipient_id: Some("original_recipient.near".parse().unwrap()),
            original_recipient_name: Some("Original Recipient".into()),
            valid: true,
            memo: None,
        }
    }

    fn sample_metadata_certification_nontransferable() -> CertificationExtraMetadata {
        CertificationExtraMetadata {
            authority_id: Some("john_instructor.near".parse().unwrap()),
            authority_name: Some("John Instructor".to_string()),
            program: Some("NTR102".to_string()),
            program_name: Some("White hat hacking with nontransferable certification".to_string()),
            program_link: Some("https://near.university".into()),
            program_start_date: None,
            program_end_date: None,
            original_recipient_id: Some("original_recipient.near".parse().unwrap()),
            original_recipient_name: Some("Original Recipient".to_string()),
            valid: true,
            memo: None,
        }
    }

    #[derive(Debug)]
    struct EnvironmentState {
        storage: StorageUsage,
        balance: Balance,
    }

    fn environment_state() -> EnvironmentState {
        EnvironmentState {
            storage: env::storage_usage(),
            balance: env::account_balance(),
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
            (final_state.balance as i128 - initial_state.balance as i128) as f64
                / f64::powf(10f64, 24f64),
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
        let contract = CertificationContract::new(
            accounts(1).into(),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: false,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );
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
    fn init_transfer_invalidate() {
        let mut context = get_context(accounts(1));

        for i in 0..4usize {
            let can_transfer = (i & 0b1) != 0;
            let can_invalidate = (i & 0b10) != 0;

            testing_env!(context.is_view(false).build());
            let contract = CertificationContract::new(
                accounts(1).into(),
                sample_metadata_contract(),
                CertificationContractInitOptions {
                    can_transfer,
                    can_invalidate,
                    trash_account: Some("0".repeat(64).parse().unwrap()),
                },
            );

            testing_env!(context.is_view(true).build());
            assert_eq!(contract.cert_can_transfer(), can_transfer);
            assert_eq!(contract.cert_can_invalidate(), can_invalidate);
        }
    }

    fn init_contract(
        owner_id: AccountId,
        contract_metadata: NFTContractMetadata,
        init_options: CertificationContractInitOptions,
    ) -> (VMContextBuilder, CertificationContract) {
        let context = get_context(owner_id.clone());
        testing_env!(context.build());
        let contract = CertificationContract::new(owner_id, contract_metadata, init_options);

        (context, contract)
    }

    #[test]
    fn mint_can_transfer_true() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: true,
                can_invalidate: false,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

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
            None,
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
        assert_eq!(contract.cert_is_valid(token_id.clone()), true);

        println!("Token mint:");
        print_monitor(initial_storage);

        testing_env!(context.attached_deposit(1).build());

        contract.nft_transfer(accounts(1), token_id.clone(), None, None);

        let transferred_token = contract
            .nft_token(token_id.clone())
            .expect("Token exists after transfer");

        assert_eq!(transferred_token.token_id, token_id);
        assert_eq!(transferred_token.owner_id, accounts(1));
        assert_eq!(
            transferred_token.metadata.unwrap(),
            TokenMetadata {
                extra: Some(sample_metadata_certification_transferable().to_json()),
                ..sample_metadata_token()
            },
        );
    }

    #[test]
    #[should_panic(expected = "Certifications cannot be transferred")]
    fn mint_can_transfer_false() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: false,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

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
            None,
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
        assert_eq!(contract.cert_is_valid(token_id.clone()), true);

        print_monitor(initial_storage);

        // Test transferability
        testing_env!(context.attached_deposit(1).build());

        contract.nft_transfer(accounts(1), token_id.clone(), None, None);
    }

    #[test]
    fn mint_can_invalidate_true_to_trash() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: true,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

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
            None,
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
        assert_eq!(contract.cert_is_valid(token_id.clone()), true);

        print_monitor(initial_storage);

        // Test transferability
        testing_env!(context.attached_deposit(1).build());

        contract.cert_invalidate(token_id.clone(), None);

        let invalidated_token = contract
            .nft_token(token_id.clone())
            .expect("Token exists after invalidation");

        assert_eq!(contract.cert_is_valid(token_id.clone()), false);
        assert_eq!(invalidated_token.token_id, token_id);
        assert_eq!(invalidated_token.owner_id, "0".repeat(64).parse().unwrap());
        assert_eq!(
            invalidated_token.metadata.unwrap(),
            TokenMetadata {
                extra: Some(
                    CertificationExtraMetadata {
                        valid: false,
                        ..sample_metadata_certification_nontransferable()
                    }
                    .to_json()
                ),
                ..sample_metadata_token()
            },
        );
    }

    #[test]
    fn mint_can_invalidate_true_no_trash() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: true,
                trash_account: None,
            },
        );

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
            None,
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
        assert_eq!(contract.cert_is_valid(token_id.clone()), true);

        print_monitor(initial_storage);

        // Test transferability
        testing_env!(context.attached_deposit(1).build());

        contract.cert_invalidate(token_id.clone(), None);

        let invalidated_token = contract
            .nft_token(token_id.clone())
            .expect("Token exists after invalidation");

        assert_eq!(contract.cert_is_valid(token_id.clone()), false);
        assert_eq!(invalidated_token.token_id, token_id);
        assert_eq!(invalidated_token.owner_id, accounts(0));
        assert_eq!(
            invalidated_token.metadata.unwrap(),
            TokenMetadata {
                extra: Some(
                    CertificationExtraMetadata {
                        valid: false,
                        ..sample_metadata_certification_nontransferable()
                    }
                    .to_json()
                ),
                ..sample_metadata_token()
            },
        );
    }

    #[test]
    #[should_panic(expected = "Certifications cannot be invalidated")]
    fn mint_can_invalidate_false() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: false,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

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
            None,
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
        assert_eq!(contract.cert_is_valid(token_id.clone()), true);

        print_monitor(initial_storage);

        // Test transferability
        testing_env!(context.attached_deposit(1).build());

        contract.cert_invalidate(token_id.clone(), None);
    }

    #[test]
    fn test_approve() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: false,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_MAX_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(
            token_id.clone(),
            Some(accounts(0)),
            sample_metadata_token(),
            sample_metadata_certification_nontransferable(),
            None,
        );

        // alice approves bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(150000000000000000000)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_approve(token_id.clone(), accounts(1), None);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .account_balance(env::account_balance())
            .is_view(true)
            .attached_deposit(0)
            .build());
        assert!(contract.nft_is_approved(token_id.clone(), accounts(1), Some(1)));
    }

    #[test]
    fn test_revoke() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: false,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_MAX_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(
            token_id.clone(),
            Some(accounts(0)),
            sample_metadata_token(),
            sample_metadata_certification_nontransferable(),
            None,
        );

        // alice approves bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(150000000000000000000)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_approve(token_id.clone(), accounts(1), None);

        // alice revokes bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(1)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_revoke(token_id.clone(), accounts(1));
        testing_env!(context
            .storage_usage(env::storage_usage())
            .account_balance(env::account_balance())
            .is_view(true)
            .attached_deposit(0)
            .build());
        assert!(!contract.nft_is_approved(token_id.clone(), accounts(1), None));
    }

    #[test]
    fn test_revoke_all() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: false,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_MAX_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(
            token_id.clone(),
            Some(accounts(0)),
            sample_metadata_token(),
            sample_metadata_certification_nontransferable(),
            None,
        );

        // alice approves bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(150000000000000000000)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_approve(token_id.clone(), accounts(1), None);

        // alice revokes bob
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(1)
            .predecessor_account_id(accounts(0))
            .build());
        contract.nft_revoke_all(token_id.clone());
        testing_env!(context
            .storage_usage(env::storage_usage())
            .account_balance(env::account_balance())
            .is_view(true)
            .attached_deposit(0)
            .build());
        assert!(!contract.nft_is_approved(token_id.clone(), accounts(1), Some(1)));
    }

    #[test]
    fn test_delete() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: true,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_MAX_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(
            token_id.clone(),
            Some(accounts(0)),
            sample_metadata_token(),
            sample_metadata_certification_nontransferable(),
            None,
        );

        let token = contract.nft_token(token_id.clone());
        assert!(token.is_some());

        // delete certificate
        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(1)
            .predecessor_account_id(accounts(0))
            .build());
        contract.cert_delete(token_id.clone(), None);

        assert!(contract.nft_token(token_id.clone()).is_none());
        assert_eq!(
            Into::<u128>::into(contract.nft_supply_for_owner(accounts(0))),
            0
        );
        assert_eq!(Into::<u128>::into(contract.nft_total_supply()), 0);
    }

    #[test]
    fn test_withdraw() {
        let (mut context, mut contract) = init_contract(
            accounts(0),
            sample_metadata_contract(),
            CertificationContractInitOptions {
                can_transfer: false,
                can_invalidate: false,
                trash_account: Some("0".repeat(64).parse().unwrap()),
            },
        );

        let balance_0 = env::account_balance();
        let max_withdrawal_0 = contract.get_max_withdrawal().0;

        assert!(max_withdrawal_0 < balance_0);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(MINT_MAX_COST)
            .predecessor_account_id(accounts(0))
            .build());
        let token_id = "0".to_string();
        contract.nft_mint(
            token_id.clone(),
            Some(accounts(0)),
            sample_metadata_token(),
            sample_metadata_certification_nontransferable(),
            None,
        );

        let token = contract.nft_token(token_id.clone());
        assert!(token.is_some());

        let balance_1 = env::account_balance();
        let max_withdrawal_1 = contract.get_max_withdrawal().0;

        assert_eq!(
            max_withdrawal_0, max_withdrawal_1,
            "Maximum withdrawal should not change if no storage lockup has been freed",
        );
        assert!(balance_1 > balance_0);

        testing_env!(context
            .storage_usage(env::storage_usage())
            .attached_deposit(1)
            .predecessor_account_id(accounts(0))
            .build());
        contract.withdraw_max();
        assert_eq!(
            Into::<u128>::into(contract.get_max_withdrawal()),
            0,
            "Max withdrawal should be 0 after performing max withdrawal"
        );
        assert_eq!(
            env::account_balance(),
            balance_1 - max_withdrawal_1,
            "Balance should have decreased by withdrawal amount"
        );
    }
}
