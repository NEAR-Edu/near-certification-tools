// https://dev.to/sudo_overflow/diy-generating-dynamic-images-on-the-fly-for-email-marketing-h51
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas } from 'canvas';
import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';
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
const expirationDays = 180; // Certificates expire after the first period of this many consecutive days of inactivity after issueDate.
const CACHE_SECONDS: number = Number(process.env.DYNAMIC_CERT_IMAGE_GENERATION_CACHE_SECONDS) || 60 * 60 * 6;

type CanvasTypeDef = 'pdf' | 'svg' | undefined;
type BufferTypeDef = 'image/png' | undefined;
type RawQueryResult = [
  {
    moment: string;
    diff_to_previous_activity: number;
    diff_from_last_activity_to_render_date: number;
    has_long_period_of_inactivity: boolean;
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

/**
 * // TODO: See important comment at getExpiration.
 * This query uses Common Table Expressions (CTE) to execute two separate queries conditionally, the second query being executed if the first query doesn't return any result.
 * https://www.postgresql.org/docs/9.1/queries-with.html
 * https://stackoverflow.com/a/68684814/10684149
 * // TODO: Should we switch to the "Simpler for a single returned row" approach at https://stackoverflow.com/a/68684814/470749?
 *
 * The first query (long_period_of_inactivity) checks whether the account has a period where it hasn't been active for >180 consecutive days after the issue date.
 * The second query (most_recent_activity) is run if no >180-day-inactivity period is found and returns the most recent activity date AND diff in days between "now"
 *  (render date) and account's last activity date.
 *
 * 1 day = 60 sec * 60 min * 24 hr = 86400 sec
 * included_in_block_timestamp uses nanoseconds so is divided by 1B when using TO_TIMESTAMP (which expects seconds).
 */
// eslint-disable-next-line max-lines-per-function
function getRawQuery(accountName: string, issuedAtUnixNano: number) {
  console.log({ accountName, issuedAtUnixNano, expirationDays });
  return Prisma.sql`
    WITH long_period_of_inactivity AS (
      SELECT 
      moment,
      diff_to_previous_activity,
      CAST(NULL AS int) AS diff_from_last_activity_to_render_date, /* The columns returned by each query must match */
      true AS has_long_period_of_inactivity
      FROM (
        SELECT *,
          ((EXTRACT(epoch FROM moment) - EXTRACT(epoch FROM lag(moment) over (ORDER BY moment))) / (60 * 60 * 24))::int
          AS diff_to_previous_activity
        FROM (
          SELECT TO_TIMESTAMP(R."included_in_block_timestamp"/1000000000) as moment
          FROM PUBLIC.RECEIPTS R
          LEFT OUTER JOIN PUBLIC.ACTION_RECEIPTS AR ON R.RECEIPT_ID = AR.RECEIPT_ID
          WHERE SIGNER_ACCOUNT_ID = ${accountName}
          AND R."included_in_block_timestamp" > ${issuedAtUnixNano}
        ) as account_activity_dates
      ) as account_activity_periods
      WHERE (diff_to_previous_activity > ${expirationDays})
      ORDER BY moment ASC
      LIMIT 1
      ), most_recent_activity AS (
      SELECT
      moment, 
      CAST(NULL AS int) AS diff_to_previous_activity, /* The columns returned by each query must match */
      ((EXTRACT(epoch FROM CURRENT_TIMESTAMP) - EXTRACT(epoch FROM moment)) / (60 * 60 * 24))::int 
		  AS diff_from_last_activity_to_render_date,
      false AS has_long_period_of_inactivity
      FROM (
        SELECT TO_TIMESTAMP(R."included_in_block_timestamp"/1000000000) as moment
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
}

/**
 * // TODO: We need to first get much clearer on the definition of expiration and create some test data for all the various scenarios. Then we can comment a summary here and fix
 * the implementation of this function and getRawQuery.
 *
 * If at least one >180-day period of inactivity after issueDate exists (has_long_period_of_inactivity === true):
 *   Expiration date = the beginning of the *first* such period + 180 days.
 * Otherwise, calculate diff (in days) between now (render date) and date of last activity.
 *   If this value (diff_from_last_activity_to_render_date) is >180;
 *     Certificate is expired. Expiration date = last activity + 180 days
 *   If this value (diff_from_last_activity_to_render_date) is <180;
 *     Certificate hasn't expired yet. Expiration date = last activity + 180 days
 */
async function getExpiration(accountName: string, issuedAt: string): Promise<string> {
  // Pulls from the public indexer. https://github.com/near/near-indexer-for-explorer#shared-public-access
  const issuedAtUnixNano = dayjs(issuedAt).unix() * 1000000000; // TODO: See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER and add a comment here and in JSDoc for functions that have a `number` argument for dates. Explain why it's safe to use floating point `number` type (if it is), or switch to a better approach and explain it.
  console.log({ issuedAt, issuedAtUnixNano, accountName });
  const rawQuery = getRawQuery(accountName, issuedAtUnixNano);
  // https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw
  const result: RawQueryResult = await prisma.$queryRaw<RawQueryResult>`${rawQuery}`;

  console.log('getExpiration query result', { result });

  const moment = dayjs(result[0].moment);

  if (result[0].has_long_period_of_inactivity) {
    return formatDate(moment.add(expirationDays, 'days'));
  } else {
    const daysToMomentOfExpiration = result[0].diff_to_previous_activity - expirationDays;
    return formatDate(moment.subtract(daysToMomentOfExpiration, 'days'));
  }
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
    // Caching is important especially because of getExpiration, which pulls from the public indexer database.
    res.send(imageBuffer);
  } else {
    res.status(HTTP_ERROR_CODE_MISSING).json({ error: `No certificate exists with this Token ID (${tokenId}).` });
  }
}
