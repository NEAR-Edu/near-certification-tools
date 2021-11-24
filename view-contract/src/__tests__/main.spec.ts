import { JSON } from 'assemblyscript-json';
import { storage, VMContext } from 'near-sdk-as';
import { PersistentMap, u128 } from 'near-sdk-core';
import { init, setFormatTemplate, view } from '..';
import { CertificationMetadata, Token, TokenMetadata } from '../metadata';
import * as StorageKey from '../StorageKey';

const ownerId = 'owner.near';

function createToken(id: string, owner_id: string): Token {
  const t = new Token();
  t.id = id;
  t.owner_id = owner_id;
  t.metadata = createTokenMetadata();

  return t;
}

function createTokenMetadata(): TokenMetadata {
  const t = new TokenMetadata();
  t.title = 'title';
  t.description = 'description';
  t.media = 'media';
  t.media_hash = 'media_hash';
  t.copies = 1;
  t.issued_at = 'issued_at';
  t.expires_at = 'expires_at';
  t.starts_at = 'starts_at';
  t.updated_at = 'updated_at';
  t.extra = JSON.from(createCertificationMetadata()).stringify();
  t.reference = 'reference';
  t.reference_hash = 'reference_hash';

  return t;
}

function createCertificationMetadata(): CertificationMetadata {
  const m = new CertificationMetadata();
  m.authority_name = 'authority_name';
  m.authority_id = 'authority_id';
  m.program = 'program';
  m.program_name = 'program_name';
  m.program_start_date = 10;
  m.program_end_date = 20;
  m.original_recipient_id = 'original_recipient_id';
  m.original_recipient_name = 'original_recipient_name';
  m.valid = true;
  m.memo = 'memo';

  return m;
}

describe('Certification viewer', () => {
  beforeEach(() => {
    init(ownerId);
  });

  it('initializes necessary storage keys', () => {
    expect(storage.get<string>(StorageKey.INITIALIZATION)).not.toBeFalsy();
    expect(storage.get<string>(StorageKey.OWNER_ID)).toBe(ownerId);
  });

  it('sets format templates', () => {
    VMContext.setPredecessor_account_id(ownerId);
    VMContext.setAttached_deposit(u128.One);
    setFormatTemplate('html', '<p>{token.id}</p>');
    expect(
      new PersistentMap<string, string>(StorageKey.FORMAT_TEMPLATE_MAP).getSome(
        'html',
      ),
    ).toBe('<p>{token.id}</p>');
  });

  it('formats tokens', () => {
    VMContext.setPredecessor_account_id(ownerId);
    VMContext.setAttached_deposit(u128.One);
    setFormatTemplate('html', '<p>{token.id}</p>');
    expect(view(createToken('1', 'token_owner'), 'html')).toBe('<p>1</p>');
    expect(() => view(createToken('1', 'token_owner'), 'unknown')).toThrow();
  });
});
