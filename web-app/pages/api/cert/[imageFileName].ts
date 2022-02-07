// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import dayjs, { Dayjs } from 'dayjs';
import { getSimpleStringFromParam } from '../../../helpers/strings';
import { getNftContract, NFT } from '../mint-cert';
import { getNearAccountWithoutAccountIdOrKeyStoreForBackend } from '../../../helpers/near';
import { height, populateAnalystCert, populateDeveloperCert, width } from '../../../helpers/certificate-designs';
import prisma from '../../../helpers/prisma';
import { addCacheHeader } from '../../../helpers/caching';

const HTTP_ERROR_CODE_MISSING = 404;
const svg = 'svg';
const dot = '.';
const imagePng = 'image/png';
const expirationMonths = 6;
const CACHE_SECONDS: number = Number(process.env.DYNAMIC_CERT_IMAGE_GENERATION_CACHE_SECONDS) || 60 * 60 * 6;

type CanvasTypeDef = 'pdf' | 'svg' | undefined;
type BufferTypeDef = 'image/png' | undefined;

function formatDate(dateTime: Dayjs) {
  // https://day.js.org/docs/en/display/format
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm'); // TODO Check what time zone
}

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
  const { programCode } = details;
  // TODO: Add more programs

  const canvas = createCanvas(width, height, canvasType);

  switch (programCode) {
    case 'NCA':
      await populateAnalystCert(canvas, details);
      break;
    default:
      await populateDeveloperCert(canvas, details);
  }

  // Convert the Canvas to a buffer
  const buffer = bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
  return buffer;
}

async function getMostRecentActivityDateTime(accountName: string): Promise<Dayjs> {
  // TODO
  const result = await prisma.receipts.findFirst({
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
  });
  console.log({ accountName, result });
  const moment = dayjs(); // TODO remove
  // const timestamp: number = result?.included_in_block_timestamp;
  // const moment = timestamp ? dayjs(timestamp) : null;
  // console.log({ accountName, result, timestamp, moment });

  return moment;
}

async function getExpiration(accountName: string): Promise<string> {
  const recent = await getMostRecentActivityDateTime(accountName);
  return formatDate(recent.add(expirationMonths, 'months'));
}

async function fetchCertificateDetails(tokenId: string) {
  const account = await getNearAccountWithoutAccountIdOrKeyStoreForBackend();
  const contract = getNftContract(account);
  const response = await (contract as NFT).nft_token({ token_id: tokenId });
  if (response) {
    const { metadata } = response;
    const { extra } = metadata;
    const certificateMetadata = JSON.parse(extra);
    console.log({ contract, response, certificateMetadata });
    const accountName = certificateMetadata.original_recipient_id;
    const programCode = certificateMetadata.program;
    // const competencies = certificateMetadata.memo || metadata.description; // TODO: Do we definitely want to show competencies? Where will they be stored?
    const expiration = await getExpiration(accountName);
    const date = formatDate(metadata.issued_at);
    const programName = metadata.title;
    return {
      tokenId,
      date,
      programCode, // This will determine which background image gets used.
      programName,
      accountName,
      // competencies,
      expiration,
    };
  } else {
    return null;
  }
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
