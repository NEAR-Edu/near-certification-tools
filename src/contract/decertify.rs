use near_contract_standards::non_fungible_token::approval::NonFungibleTokenApproval;

use crate::*;
use crate::StorageKey::TokenMetadata;

impl CertificationContract {
    pub fn decertify(&mut self, token_id: &TokenId) {
        let initial_storage_usage = env::storage_usage();
        // Force owner only
        self.assert_owner();
        // Force verification
        assert_one_yocto();

        let metadata = self.tokens.token_metadata_by_id
            .unwrap()
            .get(token_id)
            .expect("Token does not exist");

        let certification_metadata: CertificationExtraMetadata = serde_json::from_str(&metadata.extra.unwrap()).unwrap();

        self.tokens.token_metadata_by_id.unwrap().insert(token_id, &TokenMetadata {
            extra: Some(CertificationExtraMetadata {
                active: false,
                ..certification_metadata
            }.to_json()),
            ..metadata
        });

        refund_deposit(env::storage_usage() - initial_storage_usage);
    }
}