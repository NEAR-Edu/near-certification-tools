import { z } from 'zod';
import { getNearConnection } from './near';
import { getImageUrl } from './strings';
import { convertStringDateToNanoseconds } from './time';

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

/**
 *
 * @see https://nomicon.io/Standards/Tokens/NonFungibleToken/Metadata#interface
 */
export function buildTokenMetadata(tokenId: string, { title, description }: CertificateRequiredFields): TokenMetadata {
  return { copies: 1, description, issued_at: `${Date.now()}`, media: getImageUrl(tokenId), title }; // Jacob L, Ryan W, and Petar V just decided to omit media_hash (even though the NFT standard requires it) since `media` points to a URL that dynamically generates the image (and since these NFTs aren't transferrable anyway).
}

export function buildCertificationMetadata({
  authority_id,
  authority_name,
  program,
  program_name,
  program_link,
  program_start_date,
  program_end_date,
  original_recipient_id,
  original_recipient_name,
  memo,
}: CertificateRequiredFields): CertificationExtraMetadata {
  return {
    authority_id,
    authority_name,
    memo,
    original_recipient_id,
    original_recipient_name,
    program,
    program_name,
    program_link,
    program_start_date,
    program_end_date,
    valid: true,
  };
}

export function validate(details: unknown): CertificateRequiredFields {
  const nonEmptyString = () => z.string().min(1);
  const validAccountId = () => nonEmptyString().refine(async (id) => await checkAccountId(id), { message: 'Not a valid account ID' });
  const validDate = () =>
    nonEmptyString()
      .refine((date) => new Date(date), { message: 'Not a valid date string' })
      .transform(convertStringDateToNanoseconds);

  const validationSchema = z.object({
    title: nonEmptyString(),
    description: nonEmptyString(),
    authority_id: validAccountId(),
    authority_name: nonEmptyString(),
    program: nonEmptyString(),
    program_name: nonEmptyString(),
    program_link: nonEmptyString(),
    program_start_date: validDate(),
    program_end_date: validDate(),
    original_recipient_id: validAccountId(),
    original_recipient_name: nonEmptyString(),
    memo: z.string(),
  });

  const result = validationSchema.parse(details);

  return result;
}

export function isValid(cert: Required<Token>): boolean {
  try {
    const { extra } = cert.metadata;
    return !!(extra && JSON.parse(extra).valid);
  } catch {
    return false;
  }
}
