pub use init::CertificationContractInitOptions;

use crate::*;

mod init;
mod invalidate;
mod mint;
mod nft;

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct CertificationContract {
    pub(crate) tokens: NonFungibleToken,
    pub(crate) metadata: LazyOption<NFTContractMetadata>,
    pub(crate) can_transfer: bool,
    pub(crate) can_invalidate: bool,
    pub(crate) trash_account: LazyOption<AccountId>,
}

#[near_bindgen]
impl CertificationContract {
    pub fn owner_id(&self) -> AccountId {
        self.tokens.owner_id.clone()
    }

    pub(crate) fn assert_owner(&self) {
        require!(
            env::predecessor_account_id() == self.tokens.owner_id,
            "Unauthorized"
        ); // TODO: Improve this error message to give a hint about how to call the function successfully (and update the existing hint in the readme).
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

    #[payable]
    pub fn set_metadata(&mut self, metadata: NFTContractMetadata) {
        // Force owner
        self.assert_owner();
        // Force verification
        assert_one_yocto();

        self.metadata.set(&metadata);
    }
}
