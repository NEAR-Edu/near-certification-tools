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
