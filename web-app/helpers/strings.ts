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

export type CanvasType = 'pdf' | 'svg' | undefined;
export type BufferType = 'image/png' | undefined;
export type ContentType = 'image/svg+xml' | 'image/png';
const svg = 'svg';
const dot = '.';
const imagePng = 'image/png';

export function getTypesFromExtension(extension = svg): { contentType: ContentType; canvasType: CanvasType; bufferType: BufferType } {
  const isSvg = extension === svg;

  return {
    contentType: isSvg ? 'image/svg+xml' : imagePng,
    bufferType: isSvg ? undefined : imagePng,
    canvasType: isSvg ? svg : undefined,
  };
}

export function parseFileName(imageFileNameString: string): {
  tokenId: string;
  extension?: string;
} & ReturnType<typeof getTypesFromExtension> {
  const extension = imageFileNameString.split(dot).pop(); // https://stackoverflow.com/a/1203361/470749
  const lastIndex = imageFileNameString.lastIndexOf(`${dot}${extension}`); // https://stackoverflow.com/a/9323226/470749

  return { extension, tokenId: imageFileNameString.slice(0, Math.max(0, lastIndex)), ...getTypesFromExtension(extension) };
}
