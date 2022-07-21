/* eslint-disable no-return-await */
// Inspired by https://github.com/mehtaphysical/near-js/blob/f1d12884f80cb556472a8109e822c25fdff3c077/packages/next-template-near/services/near.js
import { type NextApiResponse } from 'next';
import { type ConnectConfig, KeyPair, Account, connect, Contract } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import { type KeyStore, BrowserLocalStorageKeyStore, InMemoryKeyStore } from 'near-api-js/lib/key_stores';
import { type IncomingHttpHeaders } from 'http';
import { type NftMintResult } from './types';

const privateKey = process.env.ISSUING_AUTHORITY_PRIVATE_KEY ?? '';
export const apiKey = process.env.API_KEY ?? '';
// public vars:
const certificateContractName = process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_NAME ?? 'example-contract.testnet';
export const issuingAuthorityAccountId = process.env.NEXT_PUBLIC_ISSUING_AUTHORITY_ACCOUNT_ID ?? 'example-authority.testnet';
export const gas = process.env.NEXT_PUBLIC_GAS ?? 300_000_000_000_000;
export const networkId = process.env.NEXT_PUBLIC_NEAR_NETWORK_ID ?? 'testnet';
const nodeUrl = process.env.NEXT_PUBLIC_NEAR_NODE_URL ?? 'https://rpc.testnet.near.org';
const walletUrl = process.env.NEXT_PUBLIC_NEAR_WALLET_URL ?? 'https://wallet.testnet.near.org';
const helperUrl = process.env.NEXT_PUBLIC_NEAR_HELPER_URL ?? 'https://helper.testnet.near.org';
// const explorerUrl = process.env.NEXT_PUBLIC_NEAR_EXPLORER_URL || 'https://explorer.testnet.near.org';
console.log('public env vars', { certificateContractName, gas, issuingAuthorityAccountId });

export const HTTP_SUCCESS = 200;
export const HTTP_ERROR = 500;
const HTTP_UNAUTHORIZED = 401; // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401

export type AccountId = string;

export async function getNearConnection(keyStore?: KeyStore) {
  const config: ConnectConfig = {
    headers: {},
    helperUrl,
    keyStore,
    networkId,
    // optional if not signing transactions
    nodeUrl,
    walletUrl,
    // explorerUrl,
  };
  const near = await connect(config);
  return near;
}

async function getNearAccount(accountId: AccountId) {
  const keyPair = KeyPair.fromString(privateKey);
  const keyStore = new InMemoryKeyStore();
  await keyStore.setKey(networkId, accountId, keyPair);
  const near = await getNearConnection(keyStore);
  return new Account(near.connection, accountId);
}

export async function getNearAccountWithoutAccountIdOrKeyStore(keyStore: KeyStore) {
  const near = await getNearConnection(keyStore);
  const accountId: AccountId = ''; // TODO Why would account_id be required for a simple `near view` call? Clearly it's allowed to be empty.
  return new Account(near.connection, accountId);
}

export async function getNearAccountWithoutAccountIdOrKeyStoreForBackend() {
  const keyStore = new InMemoryKeyStore();
  return await getNearAccountWithoutAccountIdOrKeyStore(keyStore);
}

export async function getNearAccountWithoutAccountIdOrKeyStoreForFrontend() {
  const keyStore = new BrowserLocalStorageKeyStore();
  console.log({ keyStore });
  return await getNearAccountWithoutAccountIdOrKeyStore(keyStore);
}

export type NFT = Contract & {
  // TODO Add types
  cert_invalidate: (args: any, gas: any, depositAmount: any) => Promise<any>;
  // https://stackoverflow.com/a/41385149/470749
  nft_mint: (args: any, gas: any, depositAmount: any) => Promise<NftMintResult>;
  nft_token: (args: any) => Promise<any>;
  nft_tokens_for_owner: (args: any) => Promise<any>;
};

export function getNftContractOfAccount(account: Account) {
  // TODO: Make `account` optional.
  const contract = new Contract(
    account, // the account object that is connecting
    certificateContractName,
    {
      // view methods do not change state but usually return a value
      changeMethods: ['nft_mint', 'cert_invalidate', 'cert_delete'],
      viewMethods: ['nft_token', 'nft_tokens_for_owner'], // change methods modify state
    },
  );
  return contract;
}

export async function getNftContract() {
  const account = await getNearAccount(issuingAuthorityAccountId);
  const contract = getNftContractOfAccount(account);
  return contract;
}

export function rejectAsUnauthorized(response: NextApiResponse<any>, headers: IncomingHttpHeaders) {
  const errorMessage = 'Unauthorized. Please provide the API key.';
  console.log({ errorMsg: errorMessage, headers });
  response.status(HTTP_UNAUTHORIZED).json({ message: errorMessage, status: 'error' });
}
