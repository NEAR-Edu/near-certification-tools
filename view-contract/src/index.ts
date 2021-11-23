import { Context, logging, storage } from 'near-sdk-as';
import { ContractPromise, PersistentMap } from 'near-sdk-core';
import { CertificationMetadata, Token } from './metadata';
import { NftTokenArgs } from './NftTokenArgs';
import * as StorageKey from './StorageKey';
import { assertOwner } from './utils';
import { JSON } from 'assemblyscript-json';

const formatTemplateMap = new PersistentMap<string, string>(
  StorageKey.FORMAT_TEMPLATE_MAP,
);

export function init(ownerId: string, contractAddress: string): void {
  // Assert not initialized
  assert(
    storage.get<string>(StorageKey.INITIALIZATION) == null,
    'Already initialized',
  );

  storage.set<string>(StorageKey.INITIALIZATION, 'initialized');

  storage.set<string>(StorageKey.OWNER_ID, ownerId);
  storage.set<string>(StorageKey.CONTRACT_ADDRESS, contractAddress);
}

export function setContractAddress(contractAddress: string): void {
  assertOwner();
  oneYocto();

  storage.set<string>(StorageKey.CONTRACT_ADDRESS, contractAddress);
}

export function setFormatTemplate(format: string, template: string): void {
  assertOwner();
  oneYocto();

  formatTemplateMap.set(format, template);
}

@nearBindgen
class _viewThenCallbackArgs {
  constructor(public format: string) {}
}

export function view(tokenId: string, format: string): void {
  ContractPromise.create(
    storage.get<string>(StorageKey.CONTRACT_ADDRESS)!,
    'nft_token',
    new NftTokenArgs(tokenId),
    20000000000000,
  ).then(
    Context.contractName,
    '_viewThen',
    new _viewThenCallbackArgs(format),
    20000000000000,
  ).returnAsResult();
}

export function _viewThen(format: string): string {
  const results = ContractPromise.getResults();
  assert(results.length == 1, 'Callback only');

  const result = results[0];

  assert(result.succeeded, 'Promise failed');

  const token = decode<Token>(result.buffer);
  logging.log(token);
  const certification = JSON.parse(token.metadata.extra) as JSON.Obj;
  return certification.getString('authority_id')!.valueOf();
}
