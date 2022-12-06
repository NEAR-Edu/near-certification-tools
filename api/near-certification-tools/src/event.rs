use near_contract_standards::non_fungible_token::TokenId;
use near_sdk::{
    log,
    serde::{Deserialize, Serialize},
    serde_json, AccountId,
};

use crate::CertificationContract;

const EVENT_STANDARD: &'static str = "x-nearedu-cert";
const EVENT_VERSION: &'static str = "1.0.0";

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub(crate) struct EventLogData {
    standard: String,
    version: String,
    event: String,
    data: Option<String>,
}

impl EventLogData {
    pub fn to_log(&self) -> String {
        format!("EVENT_JSON:{}", serde_json::to_string(&self).unwrap())
    }

    pub fn emit(&self) {
        log!(self.to_log())
    }
}

pub(crate) trait CreateEventLog<T> {
    fn create_event_log(&self, with_data: T) -> EventLogData;
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub(crate) enum CertificationEventLogData {
    Issue {
        recipient_id: AccountId,
        token_id: TokenId,
        memo: Option<String>,
    },
    Invalidate {
        recipient_id: Option<AccountId>,
        token_id: TokenId,
        memo: Option<String>,
    },
}

impl CertificationEventLogData {
    fn name(&self) -> &str {
        match self {
            CertificationEventLogData::Issue { .. } => "cert_issue",
            CertificationEventLogData::Invalidate { .. } => "cert_invalidate",
        }
    }
}

impl CreateEventLog<CertificationEventLogData> for CertificationContract {
    fn create_event_log(&self, with_data: CertificationEventLogData) -> EventLogData {
        EventLogData {
            standard: EVENT_STANDARD.to_string(),
            version: EVENT_VERSION.to_string(),
            event: with_data.name().to_string(),
            data: Some(serde_json::to_string(&with_data).unwrap()),
        }
    }
}
