use crate::*;

mod nft;
mod mint;
mod init;

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct CertificationContract {
    pub(crate) tokens: NonFungibleToken,
    pub(crate) metadata: LazyOption<NFTContractMetadata>,

    // Although transferability is indicated in the metadata extra field, it is duplicated here so
    // that every transfer attempt doesn't have to read and decode all of the metadata.
    pub(crate) transferability: UnorderedSet<TokenId>,
}

#[near_bindgen]
impl CertificationContract {
    pub(crate) fn assert_owner(&self) {
        require!(env::predecessor_account_id() == self.tokens.owner_id, "Unauthorized");
    }

    pub(crate) fn assert_transferable(&self, token_id: &TokenId) {
        require!(self.transferability.contains(token_id), "Certification does not exist or is not transferable");
    }

    pub fn is_transferable(&self, token_id: TokenId) -> bool {
        self.transferability.contains(&token_id)
    }
}
