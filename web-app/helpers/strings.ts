import * as crypto from 'crypto';
import { BinaryLike } from 'crypto';

export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export function getSimpleStringFromParam(paramValue: string | string[] | undefined) {
  if (paramValue) {
    return typeof paramValue === 'string' ? paramValue : paramValue[0];
  } else {
    return '';
  }
}

export function getImagePath(tokenId: string, extension = 'svg') {
  const url = `/api/cert/${tokenId}.${extension}`;
  return url;
}

export function getImageUrl(tokenId: string, extension = 'svg') {
  const url = `${baseUrl}${getImagePath(tokenId, extension)}`;
  return url;
}

export function getBase64Hash(data: BinaryLike) {
  const hash = crypto.createHash('sha256').update(data).digest('base64'); // https://nodejs.org/api/crypto.html https://stackoverflow.com/a/27970509/470749
  return hash;
}
