import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // https://day.js.org/docs/en/plugin/utc
import BN from 'bn.js';
import { Prisma } from '@prisma/client';
import prisma from './prisma';

dayjs.extend(utc); // use dayjs utc plugin to avoid parsing different dates depending on local timezone. https://github.com/iamkun/dayjs/issues/1723#issuecomment-985246689

const expirationDays = 180; // Certificates expire after the first period of this many consecutive days of inactivity after issueDate.
type RawQueryResult = [
  {
    // If account has had any inactivity period over 180 days, moment is the start date of such period
    // If account did not have any long (>=180 days) inactivity period, moment is the most recent activity date
    diff_to_next_activity: number;
    moment: string; // Number of days of inactivity if long (>=180 days) inactivity period is present for given account
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
  // Pulls from the public indexer. https://github.com/near/near-indexer-for-explorer#shared-public-access
  /**
   * This query uses Common Table Expressions(CTE) to execute two separate queries conditionally;
   * the second query being executed if first query doesn't return any result.
   * https://www.postgresql.org/docs/9.1/queries-with.html
   * https://stackoverflow.com/a/68684814/10684149
   */
  /**
   * ---- QUERY 1 ----
   * First query checks if the account has a period where it hasn't been active for 180 days straight after the issue date
   * IMPORTANT: When a certificate is issued to an account, it does not appear as a transaction on the account's transaction history.
   * Therefore, the period between the first mainnet activity and issue date needs to be checked as well whether it exceeds 180 days, or not.
   *
   * This is done by:
   * 1. Calculating the difference between account's first activity after issue date and the issue date.
   * 2. Retrieving account activities after the issue date and checking differences between these dates in days.
   *
   * Since it is important to detect the FIRST occurance of a >180-day period,
   * only in case such period is present:
   * -- 1. if difference between (first activity - issue date) > 180, moment is the issue date
   * -- 2. if difference between (first activity - issue date) < 180, moment is the first occurence of >180-day period after the first activity
   *
   * -- Example result:
   * [
   * {
   * moment: '2019-08-03T00:00:00+00:00', // The beginning of the *first* such period (moment) + 180 days
   * diff_to_next_activity: 214 // Either (first activity - issue date) or any other period where >180-day inacitivity is present, in days
   * }
   * ]
   *
   * ---- QUERY 2 ----
   * Second query is run if no 180-day-inactivity period is found and returns most recent activity date
   *
   * -- Example result:
   * [
   * {
   * moment: '2022-04-07T16:25:59+00:00', // Most recent activity
   * diff_to_next_activity: null // null, since no >180-day period was found
   * }
   * ]
   *
   * BOTH queries are set up to return the desired date in a column called 'moment'.
   */

  // *issue_date* <-----------Query - 1-----------> *last_activtiy*  <-----------Query - 2 -----------> *now (render date)*

  return Prisma.sql`
  /* <--- START OF FIRST QUERY ---> */
  WITH long_period_of_inactivity AS (
    (SELECT 
    case
      when days_between_issue_date_and_first_activity >= ${expirationDays} then TO_TIMESTAMP((${issuedAtUnixNano}::text)::numeric/1000000000) /* return issue date as moment if days_between_issue_date_and_first_activity > 180 */
      else moment /* else, return the start date of first occurance of >=180 day inactivity period if present */
    end as moment,
    case
      when days_between_issue_date_and_first_activity >= ${expirationDays} then days_between_issue_date_and_first_activity /* if first activity - issue date exceeds 180 days, return the difference in days */
      else diff_to_next_activity /* else, return the days between start of inactivity period and the next activity date */
    end as diff_to_next_activity
    FROM(
    SELECT *,
    ((EXTRACT(epoch FROM first_activity) - (${issuedAtUnixNano}::text)::numeric/1000000000 ) / 86400)::int AS days_between_issue_date_and_first_activity
      FROM (
        SELECT *,
          ((EXTRACT(epoch FROM moment_of_activity) - EXTRACT(epoch FROM lag(moment_of_activity) over (ORDER BY moment_of_activity))) / 86400)::int /* 1 day = 60sec * 60min * 24h = 86400 sec*/
          AS diff_to_next_activity,
          LAG(moment_of_activity) OVER (ORDER BY moment_of_activity ) AS moment,
          FIRST_VALUE(moment_of_activity) 
          OVER(
            ORDER BY moment_of_activity
          ) first_activity
        FROM (
          SELECT TO_TIMESTAMP(R."included_in_block_timestamp"/1000000000) as moment_of_activity
          FROM PUBLIC.RECEIPTS R
          LEFT OUTER JOIN PUBLIC.ACTION_RECEIPTS AR ON R.RECEIPT_ID = AR.RECEIPT_ID
          WHERE SIGNER_ACCOUNT_ID = ${accountName}
          AND R."included_in_block_timestamp" >= (${issuedAtUnixNano}::text)::numeric /*  double casting because of prisma template literal throwing 22P03 Error in DB */
        ) as account_activity_dates
      ) as account_activity_periods
    ) as account_activity_periods_with_first_activity
    WHERE (diff_to_next_activity > ${expirationDays}) OR (days_between_issue_date_and_first_activity > ${expirationDays})
    ORDER BY moment ASC
    LIMIT 1)
    /* <--- END OF FIRST QUERY ---> */

    /* <--- START OF SECOND QUERY, IN CASE FIRST QUERY DOESN'T MATCH CONDITIONS ---> */
    ), most_recent_activity AS (
    SELECT
    moment, /* moment refers to the most recent activity date of account */
    CAST(NULL AS int) AS diff_to_next_activity /*  to match column numbers in both queries  */
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
  /* <--- END OF SECOND QUERY ---> */

  /* <--- BINDING CTEs WITH UNION ALL. IF FIRST QUERY (long_period_of_inactivity) DOESN'T RETURN ANY RESULT, RUN SECOND QUERY (most_recent_activity) ---> */
  TABLE long_period_of_inactivity
  UNION ALL
  TABLE most_recent_activity`;
}

export async function getRawQueryResult(accountName: string, issuedAt: string): Promise<RawQueryResult> {
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

  console.log({ accountName, issuedAt, issuedAtUnixNano });
  const rawQuery = getRawQuery(accountName, issuedAtUnixNano);
  // https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw
  const result: RawQueryResult = await prisma.$queryRaw<RawQueryResult>`${rawQuery}`;

  console.log('getExpiration query result', { result });
  return result;
}

/**
 * @returns {string} result of formatDate (i.e. uses 'YYYY-MM-DD') of the expiration date
 */
export async function getExpiration(accountName: string, issuedAt: string): Promise<string> {
  const expiration = await getRawQueryResult(accountName, issuedAt);
  console.log({ result: expiration });

  /**
   * If the account doesn't have a period where it hasn't been active for 180 days straight after the issue date:
   * Days between last activity and render date is checked:
   * -- Expiration date = last activity (moment) + 180 days
   * Otherwise, if >180-day period of inactivity exists after issueDate,
   * -- Expiration date = the beginning of the *first* such period (moment) + 180 days
   * If query doesn't return any result:
   * -- return expiration date as issue date + 180 days
   */

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const moment = expiration.length ? dayjs.utc(expiration[0].moment) : dayjs.utc(Number.parseInt(issuedAt, 10)); // https://github.com/iamkun/dayjs/issues/1723#issuecomment-985246689

  return moment.add(expirationDays, 'days').format('YYYY-MM-DDTHH:mm:ss+00:00');
}
