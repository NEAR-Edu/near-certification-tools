/* eslint-disable canonical/filename-match-regex */
// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { type NextApiRequest, type NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import { type BufferType, type CanvasType, getSimpleStringFromParameter, parseFileName } from '../../../helpers/strings';
import { height, populateCert, width } from '../../../helpers/certificate-designs';
import { addCacheHeader } from '../../../helpers/caching';
import { type ImageIngredients } from '../../../helpers/types';
import { convertMillisecondsTimestampToFormattedDate } from '../../../helpers/time';

export const HTTP_ERROR_CODE_MISSING = 404;
const CACHE_SECONDS = Number(process.env.DYNAMIC_CERT_IMAGE_GENERATION_CACHE_SECONDS) || 60 * 60 * 6;
const API_URL = process.env.API_URL ?? '//127.0.0.1:4000/';

export async function fetchCertificateDetails(tokenId: string): Promise<ImageIngredients | null> {
  const response = await fetch(`${API_URL}cert/${tokenId}`);
  if (response.status !== 200) {
    console.error(response.statusText);
    return null;
  }

  const ingredients = await response.json();

  return {
    accountName: ingredients.account_name,
    date: convertMillisecondsTimestampToFormattedDate(ingredients.date),
    expiration: ingredients.expiration,
    instructor: ingredients.instructor,
    programCode: ingredients.program_code,
    programDescription: ingredients.program_description,
    programName: ingredients.program_name,
    tokenId: ingredients.token_id,
  };
}

async function generateImage(imageIngredients: ImageIngredients, canvasType: CanvasType, bufferType: BufferType = undefined) {
  const canvas = createCanvas(width, height, canvasType);

  await populateCert(canvas, imageIngredients);

  // Convert the Canvas to a buffer
  return bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
}

export default async function handler(request: NextApiRequest, response: NextApiResponse<Buffer | { error: string }>) {
  // Grab payload from query.
  const imageFileNameString = getSimpleStringFromParameter(request.query.imageFileName);
  const { bufferType, contentType, canvasType, tokenId } = parseFileName(imageFileNameString);

  const imageIngredients = await fetchCertificateDetails(tokenId);
  if (imageIngredients) {
    const imageBuffer = await generateImage(imageIngredients, canvasType, bufferType);
    response.setHeader('Content-Type', contentType);
    addCacheHeader(response, CACHE_SECONDS);

    // Caching is important (especially if we have a getExpiration function that pulls from the public indexer database).
    response.send(imageBuffer);
  } else {
    response.status(HTTP_ERROR_CODE_MISSING).json({ error: `No certificate exists with this Token ID (${tokenId}).` });
  }
}
