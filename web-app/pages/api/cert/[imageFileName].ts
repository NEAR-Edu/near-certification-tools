// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import dayjs from 'dayjs';
import { getSimpleStringFromParam } from '../../../helpers/strings';
import { getNftContract, NFT } from '../mint-cert';
import { getNearAccountWithoutAccountIdOrKeyStoreForBackend } from '../../../helpers/near';
import { height, populateCert, width } from '../../../helpers/certificate-designs';
import prisma from '../../../helpers/prisma';
import { addCacheHeader } from '../../../helpers/caching';
import { formatDate } from '../../../helpers/time';

export const HTTP_ERROR_CODE_MISSING = 404;
const svg = 'svg';
const dot = '.';
const imagePng = 'image/png';
const expirationDays = 180;
const QUERY_DEFAULT_CELL_VALUE = 1234567890;
const CACHE_SECONDS: number = Number(process.env.DYNAMIC_CERT_IMAGE_GENERATION_CACHE_SECONDS) || 60 * 60 * 6;

type CanvasTypeDef = 'pdf' | 'svg' | undefined;
type BufferTypeDef = 'image/png' | undefined;
type RawQueryResult = [
  {
    moment: string;
    diff_to_previous: number;
    diff_from_last_activity_to_render_date: number;
  },
];

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

  await populateCert(canvas, details);

  // Convert the Canvas to a buffer
  const buffer = bufferType ? canvas.toBuffer(bufferType) : canvas.toBuffer();
  return buffer;
}

// eslint-disable-next-line max-lines-per-function
async function getExpiration(accountName: string, issuedAt: string): Promise<string> {
  // Pulls from the public indexer. https://github.com/near/near-indexer-for-explorer#shared-public-access

  // This query uses Common Table Expressions(CTE) to execute two separate queries;
  // the second query being executed if first query doesn't return any result.
  // https://www.postgresql.org/docs/9.1/queries-with.html
  // https://stackoverflow.com/a/68684814/10684149

  // First query checks If the account has a period where it hasn't been active for 180 days straight after the issue date (exluding the render date)
  // Second query is run if if no 180-day-inactivity period is found and returns most recent activity date
  // AND amount of days between account's last activity date and render date of certificate

  // Both queries produce the same temporary table, therefore all cell data types must match.
  // Both queries show a date in the moment column, but differ in diff_from_last_activity_to_render_date and diff_to_previous columns
  // To make a distinction between results, a 'password' is used which is 1234567890

  // If first query returns a result, diff_from_last_activity_to_render_date is set to show 1234567890
  // If second query returns a result, diff_to_previous is set to show 1234567890

  // Both diff_from_last_activity_to_render_date and diff_to_previous show days as integers
  // The 'password' used as 1234567890 days equals to 3382377.780822 years
  // Using this value should be fine for 3382377 years.

  const issuedAtUnixNano = dayjs(issuedAt).unix() * 1_000_000_000;
  console.log({ issuedAt, issuedAtUnixNano, accountName });
  // https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw
  const result: RawQueryResult = await prisma.$queryRaw<RawQueryResult>`
    WITH long_period_of_inactivity AS (
      SELECT 
      moment,
      diff_to_previous,
      123456 AS diff_from_last_activity_to_render_date
      FROM (
        SELECT *,
          /* 1 day = 60sec * 60min * 24h = 86400 sec*/
          ((EXTRACT(epoch FROM moment) - EXTRACT(epoch FROM lag(moment) over (ORDER BY moment))) / 86400)::int 
          AS diff_to_previous
        FROM (
          SELECT TO_TIMESTAMP(R."included_in_block_timestamp"/1000000000) as moment
          FROM PUBLIC.RECEIPTS R
            LEFT OUTER JOIN PUBLIC.ACTION_RECEIPTS AR ON R.RECEIPT_ID = AR.RECEIPT_ID
            WHERE SIGNER_ACCOUNT_ID = ${accountName}
            AND R."included_in_block_timestamp" > ${issuedAtUnixNano}
        ) as t1
      ) as t2
      WHERE (diff_to_previous > ${expirationDays})
      ORDER BY moment ASC
      LIMIT 1
      ), most_recent_activity AS (
        SELECT TO_TIMESTAMP(receipt."included_in_block_timestamp"/1000000000) as moment, 
        123456, 
        ((EXTRACT(epoch FROM CURRENT_TIMESTAMP) - EXTRACT(epoch FROM TO_TIMESTAMP(receipt."included_in_block_timestamp"/1000000000))) / 86400)::int 
		    AS diff_from_last_activity_to_render_date 
        FROM (
          SELECT *
          FROM PUBLIC.receipts R
          LEFT OUTER JOIN PUBLIC.ACTION_RECEIPTS AR ON R.RECEIPT_ID = AR.RECEIPT_ID
          WHERE SIGNER_ACCOUNT_ID = ${accountName}
          AND R."included_in_block_timestamp" > ${issuedAtUnixNano}
        ) as receipt
        WHERE NOT EXISTS (TABLE long_period_of_inactivity)
        ORDER BY moment DESC
        LIMIT 1
      )
    TABLE long_period_of_inactivity
    UNION ALL
    TABLE most_recent_activity`;

  console.log('getStartOfFirstLongPeriodOfInactivity', { result });

  /**
   * If the account doesn't have a period where it hasn't been active for 180 days straight after the issue date:
   * Days between last activity and render date is checked:
   * If this value is  >180; Certificate is expired. Expiration date = last activity + 180 days
   * If this value is <180; Expiration date = last activity + 180 days
   * Otherwise, if >180-day period of inactivity exist after issueDate, expiration = the beginning of the *first* such period + 180 days.
   */
  const moment = dayjs(result[0].moment);
  let expirationDate;

  if (result[0].diff_to_previous === QUERY_DEFAULT_CELL_VALUE) {
    if (result[0].diff_from_last_activity_to_render_date > expirationDays) {
      expirationDate = `Expired at ${formatDate(moment.add(expirationDays, 'days'))}`;
    } else {
      expirationDate = formatDate(moment.add(expirationDays, 'days'));
    }
  } else {
    // >180-day period of inactivity exists
    // moment is the end date of such period
    // Extract 180 from moment to get the exact days between inactivity day value and 180
    const daysToMomentOfExpiration = result[0].diff_to_previous - 180;
    // The difference is being subtracted from moment to get the specific date of expiration
    expirationDate = `Expired at ${formatDate(moment.subtract(daysToMomentOfExpiration, 'days'))}`;
  }

  return expirationDate;
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
      let expiration = null; // The UI (see `generateImage`) will need to gracefully handle this case when indexer service is unavailable.
      try {
        expiration = await getExpiration(accountName, metadata.issued_at);
      } catch (error) {
        console.error('Perhaps a certificate for the original_recipient_id could not be found or the public indexer query timed out.', error);
      }
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
