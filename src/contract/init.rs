use crate::*;
use crate::contract::*;

#[near_bindgen]
impl CertificationContract {
    #[init]
    pub fn new(owner_id: AccountId, metadata: NFTContractMetadata) -> Self {
        // Only allow the contract to be initialized once
        require!(!env::state_exists(), "Already initialized");

        // Validate metadata parameter
        metadata.assert_valid();

        Self {
            tokens: NonFungibleToken::new(
                StorageKey::NonFungibleToken,
                owner_id,
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approval),
            ),
            metadata: LazyOption::new(StorageKey::Metadata, Some(&metadata)),
            transferability: UnorderedSet::new(StorageKey::Transferability),
        }
    }
}