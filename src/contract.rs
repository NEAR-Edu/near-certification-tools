pub use init::CertificationContractInitOptions;

use crate::*;

mod nft;
mod mint;
mod init;
mod decertify;

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct CertificationContract {
    pub(crate) tokens: NonFungibleToken,
    pub(crate) metadata: LazyOption<NFTContractMetadata>,
    pub(crate) transferable: bool,
    pub(crate) decertifiable: bool,
}

#[near_bindgen]
impl CertificationContract {
    pub fn owner_id(&self) -> AccountId {
        self.tokens.owner_id.clone()
    }

    pub(crate) fn assert_owner(&self) {
        require!(env::predecessor_account_id() == self.tokens.owner_id, "Unauthorized");
    }

    pub(crate) fn assert_transferable(&self) {
        require!(self.transferable, "Certifications cannot be transferred");
    }

    pub(crate) fn assert_decertifiable(&self) {
        require!(self.decertifiable, "Certifications cannot be decertified");
    }

    pub fn cert_allows_nft_transfer(&self) -> bool {
        self.transferable
    }

    pub fn cert_allows_decertification(&self) -> bool {
        self.decertifiable
    }
}
