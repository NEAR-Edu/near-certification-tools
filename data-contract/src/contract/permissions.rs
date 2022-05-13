use near_sdk::near_bindgen;

use crate::contract::*;

#[near_bindgen]
impl CertificationContract {
    pub fn add_issuer(&mut self, account_id: AccountId) {
        self.ownership.require_owner();
        self.rbac.add_role(&account_id, &Role::Issuer);
    }

    pub fn remove_issuer(&mut self, account_id: AccountId) {
        self.ownership.require_owner();
        self.rbac.remove_role(&account_id, &Role::Issuer);
    }
}
