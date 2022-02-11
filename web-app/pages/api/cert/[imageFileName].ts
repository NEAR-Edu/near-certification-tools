/* eslint-disable max-lines-per-function */
// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import { Dayjs } from 'dayjs';
import { getSimpleStringFromParam } from '../../../helpers/strings';
import { getNftContract, NFT } from '../mint-cert';
import { getNearAccountWithoutAccountIdOrKeyStoreForBackend } from '../../../helpers/near';
import { height, populateDeveloperCert, width } from '../../../helpers/certificate-designs';
import prisma from '../../../helpers/prisma';
import { addCacheHeader } from '../../../helpers/caching';
import { convertTimestampDecimalToDayjsMoment, formatDate } from '../../../helpers/time';

export const HTTP_ERROR_CODE_MISSING = 404;
const svg = 'svg';
const dot = '.';
const imagePng = 'image/png';
const expirationMonths = 6;
const CACHE_SECONDS: number = Number(process.env.DYNAMIC_CERT_IMAGE_GENERATION_CACHE_SECONDS) || 60 * 60 * 6;

type CanvasTypeDef = 'pdf' | 'svg' | undefined;
type BufferTypeDef = 'image/png' | undefined;

function parseFileName(imageFileNameString: string) {
  const extension = imageFileNameString.split(dot).pop(); // https://stackoverflow.com/a/1203361/470749
  const contentType = extension === svg ? 'image/svg+xml' : imagePng;
  const bufferType: BufferTypeDef = extension === svg ? undefined : imagePng;
  const canvasType: CanvasTypeDef = extension === svg ? svg : undefined;
  const lastIndex = imageFileNameString.lastIndexOf(`${dot}${extension}`); // https://stackoverflow.com/a/9323226/470749
  const tokenId = imageFileNameString.substring(0, lastIndex);
  return { extension, bufferType, contentType, canvasType, tokenId };
}

async function generateImage(canvasType: CanvasTypeDef, bufferType: BufferTypeDef, details: any) {
  const canvas = createCanvas(width, height, canvasType);

  await populateDeveloperCert(canvas, details);

  // Convert the Canvas to a buffer
  const buffer = bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
  return buffer;
}

async function getMostRecentActivityDateTime(accountName: string): Promise<Dayjs> {
  // Pulls from the public indexer. https://github.com/near/near-indexer-for-explorer#shared-public-access
  /* This function includes an ugly temporary workaround. `findFirst` (instead of findMany with `take: 2`) should have worked but was causing a timeout.
     Apparently it's not Prisma's fault though.Even running a LIMIT 1 query in pgAdmin causes a timeout, surprisingly, even though a LIMIT 2 query does not.
     https://stackoverflow.com/questions/71026316/why-would-limit-2-queries-work-but-limit-1-always-times-out
     This is suspicious but seems unrelated to this repo. */
  try {
    const rows = await prisma.receipts.findMany({
      where: {
        action_receipts: {
          // https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting#filter-on-relations
          signer_account_id: {
            equals: accountName,
          },
        },
      },
      orderBy: {
        included_in_block_timestamp: 'desc',
      },
      take: 2, // see comment above about workaround
    });
    if (rows) {
      const result = rows[0]; // see comment above about workaround
      console.log({ accountName, result });
      const moment = convertTimestampDecimalToDayjsMoment(result.included_in_block_timestamp);
      console.log({ accountName, result, moment }, moment.format());
      return moment;
    }
  } catch (error) {
    console.error({ error });
  }

  throw new Error(
    'getMostRecentActivityDateTime did not produce a result. Perhaps a certificate for the original_recipient_id could not be found or the public indexer query timed out.',
  );
}

async function getExpiration(accountName: string): Promise<string> {
  const recent = await getMostRecentActivityDateTime(accountName);
  return formatDate(recent.add(expirationMonths, 'months'));
}

// eslint-disable-next-line max-lines-per-function
async function fetchCertificateDetails(tokenId: string) {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForBackend();
  const contract = getNftContract(account);
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
      const expiration = await getExpiration(accountName); // TODO: Wrap in try/catch blocks to handle when indexer service is unavailable.
      const date = formatDate(metadata.issued_at);
      const programName = metadata.title;
      const programDescription = metadata.description;
      const instructor = certificateMetadata.authority_id;
      return {
        tokenId,
        date,
        programCode, // This will determine which background image gets used.
        programName,
        accountName,
        expiration,
        programDescription,
        instructor,
      };
    }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Buffer | { error: string }>) {
  // Grab payload from query.
  const { imageFileName } = req.query;

  const imageFileNameString = getSimpleStringFromParam(imageFileName);
  const { bufferType, contentType, canvasType, tokenId } = parseFileName(imageFileNameString);
  console.log({ bufferType, contentType, canvasType, tokenId });
  const details = await fetchCertificateDetails(tokenId);
  if (details) {
    // Provide each piece of text to generateImage.
    const imageBuffer = await generateImage(canvasType, bufferType, details);
    res.setHeader('Content-Type', contentType);
    addCacheHeader(res, CACHE_SECONDS);
    // Caching is important especially because of getMostRecentActivityDateTime, which pulls from the public indexer database.
    res.send(imageBuffer);
  } else {
    res.status(HTTP_ERROR_CODE_MISSING).json({ error: `No certificate exists with this Token ID (${tokenId}).` });
  }
}
