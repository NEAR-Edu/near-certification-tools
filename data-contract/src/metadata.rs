use crate::*;

#[derive(Serialize, Deserialize, BorshDeserialize, BorshSerialize, PartialEq)]
#[serde(crate = "near_sdk::serde")]
pub struct CertificationExtraMetadata {
    /// Human-readable name of the certification issuing authority within the
    /// entity that owns the contract.
    ///
    /// For example, this could be the name of the instructor who taught a
    /// course that awards a certification.
    pub authority_name: Option<String>,

    /// NEAR account ID of the certification issuing authority.
    ///
    /// For example, this could be the account ID of the instructor who taught
    /// a course that awards a certification.
    pub authority_id: Option<AccountId>,

    /// Entity-specific (e.g. school, organization) unambiguous program
    /// identifier.
    ///
    /// For example: "CS101"
    pub program: Option<String>,

    /// Human-readable name of the program (e.g. course, class, internship) in
    /// which the recipient participated in order to receive a certification.
    ///
    /// For example: "Computer Science Fundamentals"
    pub program_name: Option<String>,

    /// Program start date timestamp, i.e. number of non-leap-nanoseconds since
    /// January 1, 1970 0:00:00 UTC.
    ///
    /// Compatible with `env::block_timestamp()`.
    pub program_start_date: Option<U64>,

    /// Program end date timestamp, i.e. number of non-leap-nanoseconds since
    /// January 1, 1970 0:00:00 UTC.
    ///
    /// Compatible with `env::block_timestamp()`.
    pub program_end_date: Option<U64>,

    /// NEAR account ID of the original recipient of this certification.
    pub original_recipient_id: Option<AccountId>,

    /// Human-readable name of the original recipient of this certification.
    ///
    /// For example: "John Doe", "The Goblin Slayer", "Steve"
    pub original_recipient_name: Option<String>,

    /// Certification is valid. Freshly issued certifications have
    /// `valid == true`; invalidation sets this value to `false`.
    pub valid: bool,

    /// Optional additional data
    pub memo: Option<String>,
}

impl CertificationExtraMetadata {
    pub(crate) fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_metadata() -> CertificationExtraMetadata {
        CertificationExtraMetadata {
            authority_id: Some("test_authority.near".parse().unwrap()),
            authority_name: Some("Test Authority".to_string()),
            program: Some("PRG101".to_string()),
            program_name: Some("Program Name".to_string()),
            program_start_date: None,
            program_end_date: None,
            original_recipient_id: Some("original_recipient.near".parse().unwrap()),
            original_recipient_name: Some("Original Recipient".to_string()),
            valid: true,
            memo: None,
        }
    }

    #[test]
    fn metadata_json_serialization_and_deserialization() {
        let metadata = test_metadata();
        let json_str = metadata.to_json();
        let deserialized = serde_json::from_str::<CertificationExtraMetadata>(&*json_str).unwrap();
        assert_eq!(deserialized.authority_name.as_ref().unwrap(), "Test Authority");
        assert_eq!(deserialized.authority_id.as_ref().unwrap().to_string(), "test_authority.near");
        assert_eq!(deserialized.program.as_ref().unwrap().to_string(), "PRG101");
        assert_eq!(deserialized.program_name.as_ref().unwrap().to_string(), "Program Name");
        assert!(deserialized.program_start_date.as_ref().is_none());
        assert!(deserialized.program_end_date.as_ref().is_none());
        assert_eq!(deserialized.original_recipient_id.as_ref().unwrap().to_string(), "original_recipient.near");
        assert_eq!(deserialized.original_recipient_name.as_ref().unwrap().to_string(), "Original Recipient");
        assert_eq!(deserialized.valid, true);
        assert!(deserialized.memo.as_ref().is_none());
    }
}
