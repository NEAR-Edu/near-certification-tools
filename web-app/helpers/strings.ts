import { randomUUID } from 'crypto';

export function generateUUIDForTokenId(): string {
  return randomUUID().replaceAll('-', '');
}

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export function getSimpleStringFromParameter(parameterValue: string[] | string | undefined) {
  return parameterValue ? (typeof parameterValue === 'string' ? parameterValue : parameterValue[0]) : '';
}

export function getImagePath(tokenId: string, extension = 'svg') {
  return `/api/cert/${tokenId}.${extension}`;
}

export function getImageUrl(tokenId: string, extension = 'svg') {
  return `${baseUrl}${getImagePath(tokenId, extension)}`;
}
