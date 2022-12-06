use crate::{contract::*, storage_key::StorageKey};
use near_contract_standards::non_fungible_token::{
    metadata::NFTContractMetadata, NonFungibleToken,
};
use near_sdk::{
    collections::LazyOption,
    env, near_bindgen, require,
    serde::{Deserialize, Serialize},
    AccountId,
};

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct CertificationContractInitOptions {
    pub can_transfer: bool,
    pub can_invalidate: bool,
}

#[near_bindgen]
impl CertificationContract {
    #[init]
    pub fn new(
        owner_id: AccountId,
        metadata: NFTContractMetadata,
        options: CertificationContractInitOptions,
    ) -> Self {
        // Only allow the contract to be initialized once
        require!(!env::state_exists(), "Already initialized");

        // Validate metadata parameter
        metadata.assert_valid();

        Self {
            tokens: NonFungibleToken::new(
                StorageKey::NonFungibleToken,
                owner_id.clone(),
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approval),
            ),
            metadata: LazyOption::new(StorageKey::Metadata, Some(&metadata)),
            can_transfer: options.can_transfer,
            can_invalidate: options.can_invalidate,
            ownership: Ownership::new(StorageKey::Ownership, owner_id),
            rbac: Rbac::new(StorageKey::Rbac),
        }
    }

    #[private]
    #[init(ignore_state)]
    pub fn migrate() -> Self {
        #[derive(BorshDeserialize)]
        struct OldSchema {
            pub tokens: NonFungibleToken,
            pub metadata: LazyOption<NFTContractMetadata>,
            pub can_transfer: bool,
            pub can_invalidate: bool,
        }

        let old: OldSchema = env::state_read().unwrap();

        let owner_id = old.tokens.owner_id.to_owned();

        Self {
            tokens: old.tokens,
            metadata: old.metadata,
            can_transfer: old.can_transfer,
            can_invalidate: old.can_invalidate,
            ownership: Ownership::new(StorageKey::Ownership, owner_id),
            rbac: Rbac::new(StorageKey::Rbac),
        }
    }
}
