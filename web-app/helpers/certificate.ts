export type Certificate = {
  token_id: string;
  owner_id: string;
  metadata: {
    title: string | null;
    description: string | null;
    media: string | null;
    media_hash: string | null;
    copies: number | null;
    issued_at: string | null;
    expires_at: string | null;
    starts_at: string | null;
    updated_at: string | null;
    extra: string | null;
    reference: string | null;
    reference_hash: string | null;
  };
};

export function isValid(cert: Certificate): boolean {
  try {
    const extra = cert?.metadata.extra;
    return !!(extra && JSON.parse(extra).valid);
  } catch (_) {
    return false;
  }
}
