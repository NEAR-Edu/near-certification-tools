pub use init::CertificationContractInitOptions;
use near_contract_standards::non_fungible_token::{
    metadata::NFTContractMetadata, NonFungibleToken,
};
use near_contract_tools::{impl_ownership, ownership::Ownership, rbac::Rbac};
use near_sdk::{
    assert_one_yocto,
    borsh::{self, BorshDeserialize, BorshSerialize},
    collections::LazyOption,
    env,
    json_types::*,
    near_bindgen, require, AccountId, BorshStorageKey, PanicOnDefault, Promise,
};

mod init;
mod invalidate;
mod mint;
mod nft;
mod permissions;

#[derive(BorshSerialize, BorshStorageKey)]
pub enum Role {
    Issuer,
}

#[near_bindgen]
#[derive(PanicOnDefault, BorshDeserialize, BorshSerialize)]
pub struct CertificationContract {
    pub(crate) tokens: NonFungibleToken,
    pub(crate) metadata: LazyOption<NFTContractMetadata>,
    pub(crate) can_transfer: bool,
    pub(crate) can_invalidate: bool,
    pub(crate) ownership: Ownership,
    pub(crate) rbac: Rbac<Role>,
}

#[near_bindgen]
impl CertificationContract {
    pub(crate) fn assert_can_transfer(&self) {
        require!(self.can_transfer, "Certifications cannot be transferred");
    }

    pub(crate) fn assert_can_invalidate(&self) {
        require!(self.can_invalidate, "Certifications cannot be invalidated");
    }

    pub fn cert_can_transfer(&self) -> bool {
        self.can_transfer
    }

    pub fn cert_can_invalidate(&self) -> bool {
        self.can_invalidate
    }

    #[payable]
    pub fn set_metadata(&mut self, metadata: NFTContractMetadata) {
        // Force owner
        self.ownership.require_owner();
        // Force verification
        assert_one_yocto();

        self.metadata.set(&metadata);
    }

    pub fn get_max_withdrawal(&self) -> U128 {
        U128::from(env::account_balance() - env::storage_byte_cost() * env::storage_usage() as u128)
    }

    #[payable]
    pub fn withdraw(&mut self, amount: U128) -> Promise {
        // Force owner
        self.ownership.require_owner();
        // Force verification
        assert_one_yocto();

        let amount = amount.into();
        let max = self.get_max_withdrawal().into();

        require!(amount <= max, "Insufficient balance");

        Promise::new(self.ownership.owner.as_ref().unwrap().to_owned()).transfer(amount)
    }

    #[payable]
    pub fn withdraw_max(&mut self) -> Promise {
        self.withdraw(self.get_max_withdrawal())
    }
}

impl_ownership!(CertificationContract, ownership);
