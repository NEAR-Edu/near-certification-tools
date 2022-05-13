use crate::{
    contract::*,
    event::{CertificationEventLogData, CreateEventLog},
    metadata::CertificationExtraMetadata,
    utils::assert_nonzero_deposit,
};

use near_contract_standards::non_fungible_token::{metadata::TokenMetadata, Token, TokenId};
use near_sdk::{near_bindgen, require, AccountId};

#[near_bindgen]
impl CertificationContract {
    #[payable]
    pub fn nft_mint(
        &mut self,
        token_id: TokenId,
        receiver_account_id: Option<AccountId>,
        token_metadata: TokenMetadata,
        certification_metadata: CertificationExtraMetadata,
        memo: Option<String>,
    ) -> Token {
        // Access control
        self.rbac.require_role(&Role::Issuer);
        // Force verification
        assert_nonzero_deposit();

        // We are using the extra field for standard, type-safe custom metadata (not user-defined)
        require!(
            token_metadata.extra == None,
            "Specify extra metadata in certification_metadata parameter"
        );

        let to_account_id = match receiver_account_id {
            Some(r) => r,
            None => self.tokens.owner_id.clone(),
        };
        let combined_metadata = TokenMetadata {
            extra: Some(certification_metadata.to_json()),
            ..token_metadata
        };

        self.create_event_log(CertificationEventLogData::Issue {
            token_id: token_id.clone(),
            recipient_id: certification_metadata
                .original_recipient_id
                .unwrap_or_else(|| to_account_id.clone()),
            memo,
        })
        .emit();

        // internal_mint manages storage cost refunding
        self.tokens
            .internal_mint(token_id, to_account_id, Some(combined_metadata))
    }
}
