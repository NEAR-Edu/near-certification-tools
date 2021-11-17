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
}

#[near_bindgen]
impl CertificationContract {
    pub(crate) fn assert_owner(&self) {
        require!(env::predecessor_account_id() == self.tokens.owner_id, "Unauthorized");
    }

    pub fn is_transferable(&self) -> bool {
        cfg!(transferable)
    }

    pub fn is_decertifiable(&self) -> bool {
        cfg!(decertifiable)
    }
}
