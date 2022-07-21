export type Certificate = {
  metadata: {
    copies?: number;
    description?: string;
    expires_at?: string;
    extra?: string;
    issued_at?: string;
    media?: string;
    media_hash?: string;
    reference?: string;
    reference_hash?: string;
    starts_at?: string;
    title?: string;
    updated_at?: string;
  };
  owner_id: string;
  token_id: string;
};

export function isValid(cert: Certificate): boolean {
  try {
    const { extra } = cert.metadata;
    return !!(extra && JSON.parse(extra).valid);
  } catch {
    return false;
  }
}
