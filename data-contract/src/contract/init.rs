use crate::contract::*;
use crate::*;

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct CertificationContractInitOptions {
    pub can_transfer: bool,
    pub can_invalidate: bool,
    pub trash_account: Option<AccountId>,
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
                owner_id,
                Some(StorageKey::TokenMetadata),
                Some(StorageKey::Enumeration),
                Some(StorageKey::Approval),
            ),
            metadata: LazyOption::new(StorageKey::Metadata, Some(&metadata)),
            can_transfer: options.can_transfer,
            can_invalidate: options.can_invalidate,
            trash_account: LazyOption::new(
                StorageKey::TrashAccount,
                options.trash_account.as_ref(),
            ),
        }
    }
}
