use near_sdk::{
    borsh::{self, BorshSerialize},
    BorshStorageKey,
};

#[derive(BorshSerialize, BorshStorageKey)]
pub enum StorageKey {
    NonFungibleToken,
    Metadata,
    TokenMetadata,
    Enumeration,
    Approval,
    Ownership,
    Rbac,
}
