export type Certificate = {
  token_id: string;
  owner_id: string;
  metadata: {
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
