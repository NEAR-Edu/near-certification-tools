import { JSON } from 'assemblyscript-json';
import 'near-sdk-bindgen';
import { PersistentMap, storage } from 'near-sdk-core';
import { Token } from './metadata';
import * as StorageKey from './StorageKey';
import { assertOwner } from './utils';

const formatTemplateMap = new PersistentMap<string, string>(
  StorageKey.FORMAT_TEMPLATE_MAP,
);

export function init(ownerId: string): void {
  // Assert not initialized
  assert(
    storage.get<string>(StorageKey.INITIALIZATION) == null,
    'Already initialized',
  );

  storage.set<string>(StorageKey.INITIALIZATION, 'initialized');

  storage.set<string>(StorageKey.OWNER_ID, ownerId);
}

export function setFormatTemplate(format: string, template: string): void {
  assertOwner();
  oneYocto();

  formatTemplateMap.set(format, template);
}

function getTemplate(format: string): string {
  return formatTemplateMap.getSome(format);
}

function jsonValString(obj: JSON.Obj, key: string): string {
  const x = obj.getValue(key);
  if (x == null) {
    return '';
  } else {
    return x.toString();
  }
}

function renderTemplate(token: Token, template: string): string {
  let rendered = template;

  // NEP-171 token data replacements
  // Closures not implemented in AS so can't do .forEach
  // Index signature types are... unfriendly as well, so we're just hardcoding everything
  // Ugly, I know
  {
    rendered = rendered.replaceAll('{token.id}', token.id);
    rendered = rendered.replaceAll('{token.owner_id}', token.owner_id);
  }

  // NEP-177 token metadata replacements
  {
    rendered = rendered.replaceAll('{token.title}', token.metadata.title);
    rendered = rendered.replaceAll('{token.description}', token.metadata.description);
    rendered = rendered.replaceAll('{token.media}', token.metadata.media);
    rendered = rendered.replaceAll('{token.media_hash}', token.metadata.media_hash);
    rendered = rendered.replaceAll('{token.copies}', token.metadata.copies.toString());
    rendered = rendered.replaceAll('{token.issued_at}', token.metadata.issued_at);
    rendered = rendered.replaceAll('{token.expires_at}', token.metadata.expires_at);
    rendered = rendered.replaceAll('{token.starts_at}', token.metadata.starts_at);
    rendered = rendered.replaceAll('{token.updated_at}', token.metadata.updated_at);
    rendered = rendered.replaceAll('{token.reference}', token.metadata.reference);
    rendered = rendered.replaceAll('{token.reference_hash}', token.metadata.reference_hash);
  }

  // Certification metadata replacements
  {
    const certification = JSON.parse(token.metadata.extra) as JSON.Obj;
    rendered = rendered.replaceAll('{cert.authority_name}', jsonValString(certification, 'authority_name'));
    rendered = rendered.replaceAll('{cert.authority_id}', jsonValString(certification, 'authority_id'));
    rendered = rendered.replaceAll('{cert.program}', jsonValString(certification, 'program'));
    rendered = rendered.replaceAll('{cert.program_name}', jsonValString(certification, 'program_name'));
    rendered = rendered.replaceAll('{cert.program_start_date}', jsonValString(certification, 'program_start_date'));
    rendered = rendered.replaceAll('{cert.program_end_date}', jsonValString(certification, 'program_end_date'));
    rendered = rendered.replaceAll('{cert.original_recipient_id}', jsonValString(certification, 'original_recipient_id'));
    rendered = rendered.replaceAll('{cert.original_recipient_name}', jsonValString(certification, 'original_recipient_name'));
    rendered = rendered.replaceAll('{cert.valid}', jsonValString(certification, 'valid'));
    rendered = rendered.replaceAll('{cert.memo}', jsonValString(certification, 'memo'));
  }

  return rendered;
}

export function view(token: Token, format: string): string {
  return renderTemplate(token, getTemplate(format));
}
