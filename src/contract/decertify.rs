use crate::*;
use crate::event::{CertificationEventLogData, CreateEventLog};

impl CertificationContract {
    pub fn decertify(&mut self, token_id: TokenId, memo: Option<String>) {
        // Force owner only
        self.assert_owner();
        // Force verification
        assert_one_yocto();

        let lookup = self.tokens.token_metadata_by_id.as_mut().unwrap();

        let metadata = lookup
            .get(&token_id)
            .expect("Token does not exist");

        let certification_metadata = serde_json::from_str::<CertificationExtraMetadata>(&metadata.extra.unwrap()).unwrap();

        let recipient_id = certification_metadata.original_recipient_id.clone();

        lookup
            .insert(&token_id, &TokenMetadata {
                extra: Some(CertificationExtraMetadata {
                    active: false,
                    ..certification_metadata
                }.to_json()),
                ..metadata
            });

        self.create_event_log(CertificationEventLogData::Decertify {
            token_id,
            recipient_id,
            memo,
        }).emit();
    }
}