/* eslint-disable canonical/filename-match-regex */
// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { type NextApiRequest, type NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import { type BufferType, type CanvasType, getSimpleStringFromParameter, parseFileName } from '../../../helpers/strings';
import { getNearAccountWithoutAccountIdOrKeyStoreForBackend, getNftContractOfAccount } from '../../../helpers/near';
import { height, populateCert, width } from '../../../helpers/certificate-designs';
import { addCacheHeader } from '../../../helpers/caching';
import { convertMillisecondsTimestampToFormattedDate } from '../../../helpers/time';
import { getExpiration } from '../../../helpers/expiration-date';
import { type ImageIngredients } from '../../../helpers/types';
import { type Token } from '../../../helpers/certificate';

export const HTTP_ERROR_CODE_MISSING = 404;
const CACHE_SECONDS = Number(process.env.DYNAMIC_CERT_IMAGE_GENERATION_CACHE_SECONDS) || 60 * 60 * 6;

async function generateImage(imageIngredients: ImageIngredients, canvasType: CanvasType, bufferType: BufferType = undefined) {
  const canvas = createCanvas(width, height, canvasType);

  await populateCert(canvas, imageIngredients);

  // Convert the Canvas to a buffer
  return bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
}

export async function fetchCertificateDetails(tokenId: string): Promise<ImageIngredients | null> {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForBackend();
  const contract = getNftContractOfAccount(account);
  const response = (await contract.nft_token({ token_id: tokenId })) as Required<Token> | null;

  if (!response) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention, camelcase
  const { extra, issued_at, title, description } = response.metadata as Required<typeof response['metadata']>;
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
    expiration = await getExpiration(accountName, issued_at);
  } catch (error) {
    console.error('Perhaps a certificate for the original_recipient_id could not be found or the public indexer query timed out.', error);
  }

  const date = convertMillisecondsTimestampToFormattedDate(issued_at);

  const programName = title;
  const programDescription = description;
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
