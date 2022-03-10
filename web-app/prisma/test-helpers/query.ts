import dayjs from 'dayjs';
import BN from 'bn.js';
import prisma from '../../helpers/prisma';

type RawQueryResult = [
  {
    moment: string;
    diff_to_previous_activity: number;
    diff_from_last_activity_to_render_date: number;
    has_long_period_of_inactivity: boolean;
  },
];

const expirationDays = 180;

/**
 * issuedAtUnixNano is double casted in query because of Prisma template literal throwing 22P03 Error in DB
 * https://github.com/prisma/prisma/issues/10424
 * https://github.com/prisma/prisma/issues/5083
 * Double casting : https://github.com/prisma/prisma/issues/4647#issuecomment-939555602
 */
// eslint-disable-next-line max-lines-per-function
export default async function getQueryResult(accountName: string, issuedAt: string): Promise<unknown> {
  /**
   * Calculates Unix Timestamp in nanoseconds.
   * Calculation is exceeding JS's MAX_SAFE_INTEGER value, making it unsafe to use Number type(floating point `number` type).
   * The Number type in JavaScript can only safely represent integers below the MAX_SAFE_INTEGER value.
   * Integer values outside of MAX_SAFE_INTEGER value might cause lost of precision.
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER.
   * Therefore, we're using the bn.js library to solve this issue
   * (BigInt type could be used as well).
   */
  const issuedAtUnixNano = new BN(dayjs(issuedAt).unix()).mul(new BN(1_000_000_000)).toString(); // Converts Unix Timestamp in seconds to nanoseconds, finally from BN instance to string type. Result can't be saved as numeric type because it is exceeding 53 bits.

  const result: RawQueryResult = await prisma.$queryRaw<RawQueryResult>`
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
          AND R."included_in_block_timestamp" > (${issuedAtUnixNano}::text)::numeric /*  double casting because of prisma string template throwing 22P03 Error in DB */
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
        AND R."included_in_block_timestamp" > (${issuedAtUnixNano}::text)::numeric /*  double casting because of prisma string template throwing 22P03 Error in DB */
      ) as receipt
      WHERE NOT EXISTS (TABLE long_period_of_inactivity)
      ORDER BY moment DESC
      LIMIT 1
    )
    TABLE long_period_of_inactivity
    UNION ALL
    TABLE most_recent_activity`;

  return result;
}
