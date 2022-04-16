// Inspired by https://github.com/mehtaphysical/near-js/blob/f1d12884f80cb556472a8109e822c25fdff3c077/packages/next-template-near/services/near.js
import type { NextApiResponse } from 'next';
import { KeyPair, Account, connect, ConnectConfig, Contract } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import { BrowserLocalStorageKeyStore, InMemoryKeyStore, KeyStore } from 'near-api-js/lib/key_stores';
import { IncomingHttpHeaders } from 'http';

const privateKey = process.env.ISSUING_AUTHORITY_PRIVATE_KEY || '';
export const apiKey = process.env.API_KEY || '';
// public vars:
const certificateContractName = process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_NAME || 'example-contract.testnet';
export const issuingAuthorityAccountId = process.env.NEXT_PUBLIC_ISSUING_AUTHORITY_ACCOUNT_ID || 'example-authority.testnet';
export const gas = process.env.NEXT_PUBLIC_GAS || 300000000000000;
export const networkId = process.env.NEXT_PUBLIC_NEAR_NETWORK_ID || 'testnet';
const nodeUrl = process.env.NEXT_PUBLIC_NEAR_NODE_URL || 'https://rpc.testnet.near.org';
const walletUrl = process.env.NEXT_PUBLIC_NEAR_WALLET_URL || 'https://wallet.testnet.near.org';
const helperUrl = process.env.NEXT_PUBLIC_NEAR_HELPER_URL || 'https://helper.testnet.near.org';
// const explorerUrl = process.env.NEXT_PUBLIC_NEAR_EXPLORER_URL || 'https://explorer.testnet.near.org';
console.log('public env vars', { certificateContractName, issuingAuthorityAccountId, gas });

export const HTTP_SUCCESS = 200;
export const HTTP_ERROR = 500;
const HTTP_UNAUTHORIZED = 401; // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401

export type AccountId = string;

export async function getNearConnection(keyStore?: KeyStore) {
  const config: ConnectConfig = {
    headers: {},
    networkId,
    keyStore, // optional if not signing transactions
    nodeUrl,
    walletUrl,
    helperUrl,
    // explorerUrl,
  };
  const near = await connect(config);
  return near;
}

async function getNearAccount(accountId: AccountId) {
  const keyPair = KeyPair.fromString(privateKey);
  const keyStore = new InMemoryKeyStore();
  keyStore.setKey(networkId, accountId, keyPair);
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
  return getNearAccountWithoutAccountIdOrKeyStore(keyStore);
}

export async function getNearAccountWithoutAccountIdOrKeyStoreForFrontend() {
  const keyStore = new BrowserLocalStorageKeyStore();
  console.log({ keyStore });
  return getNearAccountWithoutAccountIdOrKeyStore(keyStore);
}

export type NFT = Contract & {
  // https://stackoverflow.com/a/41385149/470749
  nft_mint: (args: any, gas: any, depositAmount: any) => Promise<any>; // TODO Add types
  cert_invalidate: (args: any, gas: any, depositAmount: any) => Promise<any>;
  nft_token: (args: any) => Promise<any>;
  nft_tokens_for_owner: (args: any) => Promise<any>;
};

export function getNftContractOfAccount(account: Account) {
  // TODO: Make `account` optional.
  const contract = new Contract(
    account, // the account object that is connecting
    certificateContractName,
    {
      viewMethods: ['nft_token', 'nft_tokens_for_owner'], // view methods do not change state but usually return a value
      changeMethods: ['nft_mint'], // change methods modify state
    },
  );
  return contract;
}

export async function getNftContract() {
  const account = await getNearAccount(issuingAuthorityAccountId);
  const contract = getNftContractOfAccount(account);
  return contract;
}

export function rejectAsUnauthorized(res: NextApiResponse<any>, headers: IncomingHttpHeaders) {
  const errorMsg = 'Unauthorized. Please provide the API key.';
  console.log({ errorMsg, headers });
  res.status(HTTP_UNAUTHORIZED).json({ status: 'error', message: errorMsg });
}
