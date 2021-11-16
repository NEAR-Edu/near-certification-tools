use crate::*;
use crate::contract::*;
use crate::utils::*;

#[near_bindgen]
impl CertificationContract {
    pub fn nft_mint(&mut self, token_id: TokenId, receiver_account_id: Option<AccountId>, token_metadata: TokenMetadata, certification_metadata: CertificationExtraMetadata) -> Token {
        // Force owner
        self.assert_owner();
        // Force verification
        assert_nonzero_deposit();

        // We are using the extra field for standard, type-safe custom metadata (not user-defined)
        require!(token_metadata.extra == None, "Specify extra metadata in certification_metadata parameter");

        let to_account_id = match receiver_account_id {
            Some(r) => r,
            None => self.tokens.owner_id.clone(),
        };
        let combined_metadata = TokenMetadata { extra: Some(certification_metadata.to_json()), ..token_metadata };
        // combined_metadata.extra = Some(certification_metadata.to_json());

        if certification_metadata.transferable {
            self.transferability.insert(&token_id);
        }

        self.tokens.internal_mint(token_id, to_account_id, Some(combined_metadata))
    }
}