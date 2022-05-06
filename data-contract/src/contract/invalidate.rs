use near_contract_standards::non_fungible_token::{
    events::NftBurn, metadata::TokenMetadata, TokenId,
};
use near_sdk::{assert_one_yocto, near_bindgen, serde_json};

use crate::{
    contract::*,
    event::{CertificationEventLogData, CreateEventLog},
    metadata::CertificationExtraMetadata,
};

#[near_bindgen]
impl CertificationContract {
    pub fn cert_is_valid(&self, token_id: TokenId) -> bool {
        serde_json::from_str::<CertificationExtraMetadata>(
            &self
                .tokens
                .token_metadata_by_id
                .as_ref()
                .unwrap()
                .get(&token_id)
                .unwrap()
                .extra
                .unwrap(),
        )
        .unwrap()
        .valid
    }

    #[payable]
    pub fn cert_invalidate(&mut self, token_id: TokenId, memo: Option<String>) {
        self.assert_can_invalidate();
        // Force owner only
        self.assert_owner();
        // Force verification
        assert_one_yocto();

        let lookup = self.tokens.token_metadata_by_id.as_mut().unwrap();

        let metadata = lookup.get(&token_id).expect("Token does not exist");

        let certification_metadata =
            serde_json::from_str::<CertificationExtraMetadata>(&metadata.extra.unwrap()).unwrap();

        let recipient_id = certification_metadata.original_recipient_id.clone();

        lookup.insert(
            &token_id,
            &TokenMetadata {
                extra: Some(
                    CertificationExtraMetadata {
                        valid: false,
                        ..certification_metadata
                    }
                    .to_json(),
                ),
                ..metadata
            },
        );

        self.create_event_log(CertificationEventLogData::Invalidate {
            token_id: token_id.to_owned(),
            recipient_id,
            memo,
        })
        .emit();
    }

    #[payable]
    pub fn cert_delete(&mut self, token_id: TokenId, memo: Option<String>) {
        // Disallow deletion if invalidation is disallowed (deletion is the stronger action)
        self.assert_can_invalidate();
        // Force owner only
        self.assert_owner();
        // Force verification
        assert_one_yocto();

        // Remove approval
        self.tokens.approvals_by_id.as_mut().map(|approvals_by_id| {
            approvals_by_id.remove(&token_id);
        });

        let owner_id = self.tokens.owner_by_id.get(&token_id).unwrap();

        // Remove enumeration
        self.tokens
            .tokens_per_owner
            .as_mut()
            .map(|tokens_per_owner| {
                tokens_per_owner.get(&owner_id).as_mut().map(|token_ids| {
                    token_ids.remove(&token_id);
                    if token_ids.len() == 0 {
                        tokens_per_owner.remove(&owner_id);
                    } else {
                        tokens_per_owner.insert(&owner_id, &token_ids);
                    }
                });
            });

        // Remove metadata
        self.tokens
            .token_metadata_by_id
            .as_mut()
            .map(|by_id| by_id.remove(&token_id));

        // Remove from owners map
        self.tokens.owner_by_id.remove(&token_id);

        // Emit NFT burn event
        NftBurn {
            owner_id: &owner_id,
            authorized_id: Some(&self.owner_id()),
            token_ids: &[&token_id],
            memo: memo.as_deref(),
        }
        .emit();
    }
}
