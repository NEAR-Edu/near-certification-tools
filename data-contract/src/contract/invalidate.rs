use crate::contract::*;
use crate::event::*;
use crate::*;

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

        if let Some(ref trash_account) = self.trash_account.get() {
            let owner_id = self.tokens.owner_by_id.get(&token_id).unwrap();
            self.tokens
                .internal_transfer(&owner_id, trash_account, &token_id, None, None);
        }
    }
}
