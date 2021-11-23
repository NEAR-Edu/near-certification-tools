@nearBindgen
export class Token {
  id: string;
  owner_id: string;
  metadata: TokenMetadata;
}

@nearBindgen
export class TokenMetadata {
  title: string;
  description: string;
  media: string;
  media_hash: string;
  copies: u32;
  issued_at: string;
  expires_at: string;
  starts_at: string;
  updated_at: string;
  extra: string;
  reference: string;
  reference_hash: string;
}

@nearBindgen
export class CertificationMetadata {
  authority_name: string;
  authority_id: string;
  program: string;
  program_name: string;
  program_start_date: u64;
  program_end_date: u64;
  original_recipient_id: string;
  original_recipient_name: string;
  valid: bool;
  memo: string;
}
