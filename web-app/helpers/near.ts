// Inspired by https://github.com/mehtaphysical/near-js/blob/f1d12884f80cb556472a8109e822c25fdff3c077/packages/next-template-near/services/near.js
import { KeyPair, Account, connect, ConnectConfig } from 'near-api-js'; // https://github.com/near/near-api-js/blob/master/examples/quick-reference.md
import { BrowserLocalStorageKeyStore, InMemoryKeyStore, KeyStore } from 'near-api-js/lib/key_stores';

const networkId = process.env.NEXT_PUBLIC_NEAR_NETWORK_ID || 'testnet';
const nodeUrl = process.env.NEXT_PUBLIC_NEAR_NODE_URL || 'https://rpc.testnet.near.org';
const walletUrl = process.env.NEXT_PUBLIC_NEAR_WALLET_URL || 'https://wallet.testnet.near.org';
const helperUrl = process.env.NEXT_PUBLIC_NEAR_HELPER_URL || 'https://helper.testnet.near.org';
// const explorerUrl = process.env.NEXT_PUBLIC_NEAR_EXPLORER_URL || 'https://explorer.testnet.near.org';

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

export async function getNearAccount(accountId: string, privateKey: string) {
  const keyPair = KeyPair.fromString(privateKey);
  const keyStore = new InMemoryKeyStore();
  keyStore.setKey(networkId, accountId, keyPair);
  const near = await getNearConnection(keyStore);
  return new Account(near.connection, accountId);
}

// export async function getNearAccountWithoutKeyStore(accountId: string) {
//   const keyStore = new InMemoryKeyStore(); // TODO Why would keyStore be required? Clearly it's allowed to be empty.
//   const near = await getNearConnection(keyStore);
//   return new Account(near.connection, accountId);
// }

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
