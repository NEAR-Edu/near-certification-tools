/* eslint-disable canonical/filename-match-regex */
// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { type NextApiRequest, type NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import { getSimpleStringFromParameter } from '../../../helpers/strings';
import { getNearAccountWithoutAccountIdOrKeyStoreForBackend, getNftContractOfAccount } from '../../../helpers/near';
import { height, populateCert, width } from '../../../helpers/certificate-designs';
import { addCacheHeader } from '../../../helpers/caching';
import { convertMillisecondsTimestampToFormattedDate } from '../../../helpers/time';
import { getExpiration } from '../../../helpers/expiration-date';
import { type ImageIngredients } from '../../../helpers/types';
import { type Token } from '../../../helpers/certificate';

export const HTTP_ERROR_CODE_MISSING = 404;
const svg = 'svg';
const dot = '.';
const imagePng = 'image/png';
const CACHE_SECONDS: number = Number(process.env.DYNAMIC_CERT_IMAGE_GENERATION_CACHE_SECONDS) || 60 * 60 * 6;

type CanvasType = 'pdf' | 'svg' | undefined;
type BufferType = 'image/png' | undefined;

export function getTypesFromExtension(extension = svg) {
  const contentType = extension === svg ? 'image/svg+xml' : imagePng;
  const bufferType: BufferType = extension === svg ? undefined : imagePng;
  const canvasType: CanvasType = extension === svg ? svg : undefined;
  return { bufferType, canvasType, contentType };
}

function parseFileName(imageFileNameString: string) {
  const extension = imageFileNameString.split(dot).pop(); // https://stackoverflow.com/a/1203361/470749
  const { bufferType, contentType, canvasType } = getTypesFromExtension(extension);
  const lastIndex = imageFileNameString.lastIndexOf(`${dot}${extension}`); // https://stackoverflow.com/a/9323226/470749
  const tokenId = imageFileNameString.slice(0, Math.max(0, lastIndex));
  return { bufferType, canvasType, contentType, extension, tokenId };
}

async function generateImage(imageIngredients: ImageIngredients, canvasType: CanvasType, bufferType: BufferType) {
  const canvas = createCanvas(width, height, canvasType);

  await populateCert(canvas, imageIngredients);

  // Convert the Canvas to a buffer
  const buffer = bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
  return buffer;
}

// eslint-disable-next-line max-lines-per-function
export async function fetchCertificateDetails(tokenId: string): Promise<ImageIngredients | null> {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForBackend();
  const contract = getNftContractOfAccount(account);
  const response = (await contract.nft_token({ token_id: tokenId })) as Required<Token> | null;

  if (!response) {
    return null;
  }

  const metadata = response.metadata as Required<typeof response['metadata']>;
  const { extra } = metadata;
  const certificateMetadata = JSON.parse(extra);
  console.log({ certificateMetadata, contract, response });
  // similar to isValid function but without re-running some of those lines
  if (!certificateMetadata.valid) {
    return null;
  }

  const accountName = certificateMetadata.original_recipient_id;
  const programCode = certificateMetadata.program;
  let expiration = ''; // The UI (see `populateCert`) will need to gracefully handle this case when indexer service is unavailable.
  try {
    expiration = await getExpiration(accountName, metadata.issued_at);
  } catch (error) {
    console.error('Perhaps a certificate for the original_recipient_id could not be found or the public indexer query timed out.', error);
  }

  const date = convertMillisecondsTimestampToFormattedDate(metadata.issued_at);

  const programName = metadata.title;
  const programDescription = metadata.description;
  const instructor = certificateMetadata.authority_id;

  // Field mappings here must stay in sync with getImageIngredientsFromCertificateRequiredFields.
  return {
    accountName,
    date,
    expiration,
    instructor,
    programCode,
    programDescription,
    programName,
    tokenId,
  };
}

export default async function handler(request: NextApiRequest, response: NextApiResponse<Buffer | { error: string }>) {
  // Grab payload from query.
  const { imageFileName } = request.query;
  const imageFileNameString = getSimpleStringFromParameter(imageFileName);
  const { bufferType, contentType, canvasType, tokenId } = parseFileName(imageFileNameString);
  // console.log({ bufferType, contentType, canvasType, tokenId });
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
