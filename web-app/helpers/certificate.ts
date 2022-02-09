export type Certificate = any;

export function isValid(cert: Certificate): boolean {
  const extra = cert?.metadata?.extra;
  const certificateMetadata = JSON.parse(extra);
  return certificateMetadata?.valid;
}
