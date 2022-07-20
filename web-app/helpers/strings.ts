export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export function getSimpleStringFromParameter(parameterValue: string[] | string | undefined) {
  if (parameterValue) {
    return typeof parameterValue === 'string' ? parameterValue : parameterValue[0];
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
