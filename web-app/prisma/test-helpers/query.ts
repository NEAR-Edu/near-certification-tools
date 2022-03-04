import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
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
// eslint-disable-next-line max-lines-per-function
export function getRawQuery(accountName: string, issuedAtUnixNano: number) {
  return Prisma.sql`
    WITH long_period_of_inactivity AS (
      SELECT 
      moment,
      diff_to_previous_activity,
      CAST(NULL AS int) AS diff_from_last_activity_to_render_date, /*  to match column numbers in both queries  */
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
          AND R."included_in_block_timestamp" > ${issuedAtUnixNano}
        ) as account_activity_dates
      ) as account_activity_periods
      WHERE (diff_to_previous_activity > ${expirationDays})
      ORDER BY moment ASC
      LIMIT 1
      ), most_recent_activity AS (
      SELECT
      moment, 
      CAST(NULL AS int) AS diff_to_previous_activity, /*  to match column numbers in both queries  */
      ((EXTRACT(epoch FROM CURRENT_TIMESTAMP) - EXTRACT(epoch FROM moment)) / 86400)::int 
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

// eslint-disable-next-line max-lines-per-function
export async function getQueryResult(accountName: string, issuedAt: string): Promise<unknown> {
  const issuedAtUnixNano = dayjs(issuedAt).unix() * 1_000_000_000;

  const result: RawQueryResult = await prisma.$queryRaw<RawQueryResult>`
    WITH long_period_of_inactivity AS (
      SELECT 
      moment,
      diff_to_previous_activity,
      CAST(NULL AS int) AS diff_from_last_activity_to_render_date, /*  to match column numbers in both queries  */
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
          AND R."included_in_block_timestamp" > ${issuedAtUnixNano}
        ) as account_activity_dates
      ) as account_activity_periods
      WHERE (diff_to_previous_activity > ${expirationDays})
      ORDER BY moment ASC
      LIMIT 1
      ), most_recent_activity AS (
      SELECT
      moment, 
      CAST(NULL AS int) AS diff_to_previous_activity, /*  to match column numbers in both queries  */
      ((EXTRACT(epoch FROM CURRENT_TIMESTAMP) - EXTRACT(epoch FROM moment)) / 86400)::int 
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

  return result;
}
