// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import { getBase64Hash, getSimpleStringFromParam } from '../../../helpers/strings';
import { getNearAccountWithoutAccountIdOrKeyStoreForBackend, getNftContractOfAccount, NFT } from '../../../helpers/near';
import { height, populateCert, width } from '../../../helpers/certificate-designs';
import { addCacheHeader } from '../../../helpers/caching';
import { convertMillisecondsTimestampToFormattedDate } from '../../../helpers/time';

export const HTTP_ERROR_CODE_MISSING = 404;
const svg = 'svg';
const dot = '.';
const imagePng = 'image/png';
const CACHE_SECONDS: number = Number(process.env.DYNAMIC_CERT_IMAGE_GENERATION_CACHE_SECONDS) || 60 * 60 * 6;

type CanvasTypeDef = 'pdf' | 'svg' | undefined;
type BufferTypeDef = 'image/png' | undefined;

export type ImageIngredients = {
  tokenId: string;
  date: string;
  programCode: string; // This will determine which background image gets used.
  programName: string;
  accountName: string;
  programDescription: string;
  instructor: string;
};

export function getTypesFromExtension(extension = svg) {
  const contentType = extension === svg ? 'image/svg+xml' : imagePng;
  const bufferType: BufferTypeDef = extension === svg ? undefined : imagePng;
  const canvasType: CanvasTypeDef = extension === svg ? svg : undefined;
  return { bufferType, contentType, canvasType };
}

function parseFileName(imageFileNameString: string) {
  const extension = imageFileNameString.split(dot).pop(); // https://stackoverflow.com/a/1203361/470749
  const { bufferType, contentType, canvasType } = getTypesFromExtension(extension);
  const lastIndex = imageFileNameString.lastIndexOf(`${dot}${extension}`); // https://stackoverflow.com/a/9323226/470749
  const tokenId = imageFileNameString.substring(0, lastIndex);
  return { extension, bufferType, contentType, canvasType, tokenId };
}

async function generateImage(imageIngredients: ImageIngredients, canvasType: CanvasTypeDef, bufferType: BufferTypeDef) {
  const canvas = createCanvas(width, height, canvasType);

  await populateCert(canvas, imageIngredients);

  // Convert the Canvas to a buffer
  const buffer = bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
  return buffer;
}

export async function fetchCertificateDetails(tokenId: string): Promise<ImageIngredients | null> {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForBackend();
  const contract = getNftContractOfAccount(account);
  const response = await (contract as NFT).nft_token({ token_id: tokenId });
  if (response) {
    const { metadata } = response;
    const { extra } = metadata;
    const certificateMetadata = JSON.parse(extra);
    console.log({ contract, response, certificateMetadata });
    // similar to isValid function but without re-running some of those lines
    if (certificateMetadata.valid) {
      const accountName = certificateMetadata.original_recipient_id;
      const programCode = certificateMetadata.program;
      const date = convertMillisecondsTimestampToFormattedDate(metadata.issued_at);
      const programName = metadata.title;
      const programDescription = metadata.description;
      const instructor = certificateMetadata.authority_id;
      return {
        // Field mappings here must stay in sync with getImageIngredientsFromCertificateRequiredFields.
        tokenId,
        date,
        programCode,
        programName,
        accountName,
        programDescription,
        instructor,
      };
    }
  }
  return null;
}

export async function getBase64ImageHash(imageIngredients: ImageIngredients, extension = svg) {
  const { bufferType, canvasType } = getTypesFromExtension(extension);
  const imageBuffer = await generateImage(imageIngredients, canvasType, bufferType);
  const hash = getBase64Hash(imageBuffer);
  console.log({ hash });
  return hash;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Buffer | { error: string }>) {
  // Grab payload from query.
  const { imageFileName } = req.query;
  const imageFileNameString = getSimpleStringFromParam(imageFileName);
  const { bufferType, contentType, canvasType, tokenId } = parseFileName(imageFileNameString);
  // console.log({ bufferType, contentType, canvasType, tokenId });
  const imageIngredients = await fetchCertificateDetails(tokenId);
  if (imageIngredients) {
    const imageBuffer = await generateImage(imageIngredients, canvasType, bufferType);
    res.setHeader('Content-Type', contentType);
    addCacheHeader(res, CACHE_SECONDS);
    // Caching is important (especially if we have a getExpiration function that pulls from the public indexer database).
    res.send(imageBuffer);
  } else {
    res.status(HTTP_ERROR_CODE_MISSING).json({ error: `No certificate exists with this Token ID (${tokenId}).` });
  }
}
