import { Context, storage } from 'near-sdk-as';
import * as StorageKey from './StorageKey';

export function assertOwner(): void {
  assert(
    storage.get<string>(StorageKey.OWNER_ID) == Context.predecessor,
    'Owner only',
  );
}
