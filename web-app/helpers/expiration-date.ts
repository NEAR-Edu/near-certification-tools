import dayjs from 'dayjs';
import BN from 'bn.js';
import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { formatDate } from './time';

const expirationDays = 180; // Certificates expire after the first period of this many consecutive days of inactivity after issueDate.
type RawQueryResult = [
  {
    moment: string;
    diff_to_previous_activity: number;
    diff_from_last_activity_to_render_date: number;
    has_long_period_of_inactivity: boolean;
  },
];

/**
 * issuedAtUnixNano is double casted in query because of Prisma template literal throwing 22P03 Error in DB
 * https://github.com/prisma/prisma/issues/10424
 * https://github.com/prisma/prisma/issues/5083
 * Double casting : https://github.com/prisma/prisma/issues/4647#issuecomment-939555602
 */
// eslint-disable-next-line max-lines-per-function
export function getRawQuery(accountName: string, issuedAtUnixNano: string) {
  // TODO: Add explanation of query
  // *issue_date* <-----------Query - 1-----------> *last_activtiy*  <-----------Query - 2 -----------> *now*
  return Prisma.sql`
    WITH long_period_of_inactivity AS (
      SELECT 
      moment,
      diff_to_previous_activity,
      true AS has_long_period_of_inactivity
      FROM (
        SELECT *,
          ((EXTRACT(epoch FROM moment) - EXTRACT(epoch FROM lag(moment) over (ORDER BY moment))) / 86400)::int /* 1 day = 60sec * 60min * 24h = 86400 sec*/
          AS diff_to_previous_activity
        FROM (
          SELECT TO_TIMESTAMP(R."included_in_block_timestamp"/1000000000) as moment
          FROM PUBLIC.RECEIPTS R
          LEFT OUTER JOIN PUBLIC.ACTION_RECEIPTS AR ON R.RECEIPT_ID = AR.RECEIPT_ID
          WHERE SIGNER_ACCOUNT_ID = ${accountName}
          AND R."included_in_block_timestamp" >= (${issuedAtUnixNano}::text)::numeric /*  double casting because of prisma template literal throwing 22P03 Error in DB */
        ) as account_activity_dates
      ) as account_activity_periods
      WHERE (diff_to_previous_activity > ${expirationDays})
      ORDER BY moment ASC
      LIMIT 1
      ), most_recent_activity AS (
      SELECT
      moment, 
      CAST(NULL AS int) AS diff_to_previous_activity, /*  to match column numbers in both queries  */
      false AS has_long_period_of_inactivity
      FROM (
        SELECT TO_TIMESTAMP(R."included_in_block_timestamp"/1000000000) as moment
        FROM PUBLIC.receipts R
        LEFT OUTER JOIN PUBLIC.ACTION_RECEIPTS AR ON R.RECEIPT_ID = AR.RECEIPT_ID
        WHERE SIGNER_ACCOUNT_ID = ${accountName}
        AND R."included_in_block_timestamp" >= (${issuedAtUnixNano}::text)::numeric /*  double casting because of prisma template literal throwing 22P03 Error in DB */
      ) as receipt
      WHERE NOT EXISTS (TABLE long_period_of_inactivity)
      ORDER BY moment DESC
      LIMIT 1
    )
    TABLE long_period_of_inactivity
    UNION ALL
    TABLE most_recent_activity`;
}

export async function getRawQueryResult(accountName: string, issuedAt: string) {
  /**
   * Calculates Unix Timestamp in nanoseconds.
   * Calculation is exceeding JS's MAX_SAFE_INTEGER value, making it unsafe to use Number type(floating point `number` type).
   * The Number type in JavaScript can only safely represent Number types below the MAX_SAFE_INTEGER value.
   * Integer values outside of MAX_SAFE_INTEGER value might cause lost of precision.
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER.
   * Therefore, we're using the bn.js library to solve this issue
   * (BigInt type could be used as well).
   */
  const issuedAtUnixNano = new BN(issuedAt).mul(new BN(1_000_000)).toString(); // Converts issued_at which is in milliseconds to nanoseconds, finally from BN instance to string type. Result can't be saved as numeric type because it is exceeding 53 bits.

  console.log({ issuedAt, issuedAtUnixNano, accountName });
  const rawQuery = getRawQuery(accountName, issuedAtUnixNano);
  // https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw
  const result: RawQueryResult = await prisma.$queryRaw<RawQueryResult>`${rawQuery}`;

  console.log('getExpiration query result', { result });
  return result;
}

export async function getExpiration(accountName: string, issuedAt: string): Promise<string> {
  // Pulls from the public indexer. https://github.com/near/near-indexer-for-explorer#shared-public-access
  /**
   * This query uses Common Table Expressions(CTE) to execute two separate queries conditionally;
   * the second query being executed if first query doesn't return any result.
   * https://www.postgresql.org/docs/9.1/queries-with.html
   * https://stackoverflow.com/a/68684814/10684149
   */
  /**
   * First query checks If the account has a period where it hasn't been active for 180 days straight after the issue date (exluding the render date)
   * Second query is run if no 180-day-inactivity period is found and returns most recent activity date
   * AND amount of days between account's last activity date - render date of certificate
   */
  const result = await getRawQueryResult(accountName, issuedAt);

  /**
   * If the account doesn't have a period where it hasn't been active for 180 days straight after the issue date:
   * Days between last activity and render date is checked:
   * If this value (diff_from_last_activity_to_render_date) is  >180;
   * -- Certificate is expired. Expiration date = last activity + 180 days
   * If this value (diff_from_last_activity_to_render_date) is <180;
   * -- Certificate hasn't expired yet. Expiration date = last activity + 180 days
   * Otherwise, if >180-day period of inactivity exist (has_long_period_of_inactivity === true) after issueDate,
   * -- Expiration date = the beginning of the *first* such period + 180 days.
   */
  const moment = dayjs(result[0].moment);

  if (result[0].has_long_period_of_inactivity) {
    /**
     * >180-day period of inactivity exists. Can be anything over 180.
     * moment is the end date of such period.
     * Extract 180 from inactivity period to get the exact days betwen moment and actual expiration date.
     */
    const daysToMomentOfExpiration = result[0].diff_to_previous_activity - expirationDays;

    /**
     * Subtract daysToMomentOfExpiration from moment to get the specific date of expiration.
     * This subtraction equals to (start of inactivity period + 180 days)
     */
    return formatDate(moment.subtract(daysToMomentOfExpiration, 'days'));
  } else {
    return formatDate(moment.add(expirationDays, 'days'));
  }
}
