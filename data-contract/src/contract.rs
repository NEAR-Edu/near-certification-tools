pub use init::CertificationContractInitOptions;

use crate::*;

mod nft;
mod mint;
mod init;
mod invalidate;

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct CertificationContract {
    pub(crate) tokens: NonFungibleToken,
    pub(crate) metadata: LazyOption<NFTContractMetadata>,
    pub(crate) can_transfer: bool,
    pub(crate) can_invalidate: bool,
}

#[near_bindgen]
impl CertificationContract {
    pub fn owner_id(&self) -> AccountId {
        self.tokens.owner_id.clone()
    }

    pub(crate) fn assert_owner(&self) {
        require!(env::predecessor_account_id() == self.tokens.owner_id, "Unauthorized");
    }

    pub(crate) fn assert_can_transfer(&self) {
        require!(self.can_transfer, "Certifications cannot be transferred");
    }

    pub(crate) fn assert_can_invalidate(&self) {
        require!(self.can_invalidate, "Certifications cannot be invalidated");
    }

    pub fn cert_can_transfer(&self) -> bool {
        self.can_transfer
    }

    pub fn cert_can_invalidate(&self) -> bool {
        self.can_invalidate
    }

    pub fn set_metadata(&mut self, metadata: NFTContractMetadata) {
        self.assert_owner();

        self.metadata.set(&metadata);
    }
}
