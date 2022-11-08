import { z } from 'zod';
import { getNearConnection } from './near';

export interface Token {
  token_id: string;
  owner_id: string;
  metadata?: TokenMetadata;
  approved_account_ids?: Record<string, number>;
}

export interface NFTMintArgs {
  token_id: string;
  receiver_account_id?: string;
  token_metadata: TokenMetadata;
  certification_metadata: CertificationExtraMetadata;
  memo?: string;
}

export interface CertificationExtraMetadata {
  authority_name?: string;
  authority_id?: string;
  program?: string;
  program_name?: string;
  program_link?: string;
  program_start_date?: string;
  program_end_date?: string;
  original_recipient_id?: string;
  original_recipient_name?: string;
  valid: boolean;
  memo?: string;
}

export interface TokenMetadata {
  title?: string;
  description?: string;
  media?: string;
  media_hash?: string;
  copies?: number;
  issued_at?: string;
  expires_at?: string;
  starts_at?: string;
  updated_at?: string;
  extra?: string;
  reference?: string;
  reference_hash?: string;
}

export type CertificateRequiredFields = Required<Omit<CertificationExtraMetadata, 'valid'> & Pick<TokenMetadata, 'title' | 'description'>>;

export async function checkAccountId(accountId: string): Promise<boolean> {
  try {
    const connection = await getNearConnection();
    const account = await connection.account(accountId);
    const state = await account.state();
    return !!state;
  } catch {
    return false;
  }
}

export function validate(details: unknown): details is CertificateRequiredFields {
  const nonEmptyString = () => z.string().min(1);

  z.object({
    title: nonEmptyString(),
    description: nonEmptyString(),
    authority_id: nonEmptyString().refine(async (id) => await checkAccountId(id), { message: 'Not a valid account ID' }),
    authority_name: nonEmptyString(),
    program: nonEmptyString(),
    program_name: nonEmptyString(),
    program_link: nonEmptyString(),
    program_start_date: nonEmptyString(),
    program_end_date: nonEmptyString(),
    original_recipient_id: nonEmptyString().refine(async (id) => await checkAccountId(id), { message: 'Not a valid account ID' }),
    original_recipient_name: nonEmptyString(),
  }).parse(details);

  return true;
}

export function isValid(cert: Required<Token>): boolean {
  try {
    const { extra } = cert.metadata;
    return !!(extra && JSON.parse(extra).valid);
  } catch {
    return false;
  }
}
