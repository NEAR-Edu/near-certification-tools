import dayjs from 'dayjs';
import prisma from '../../helpers/prisma';
import { getRawQuery } from './query';
import { formatDate } from '../../helpers/time';

const expirationDays = 180;

type RawQueryResult = [
  {
    moment: string;
    diff_to_previous_activity: number;
    diff_from_last_activity_to_render_date: number;
    has_long_period_of_inactivity: boolean;
  },
];

export default async function getExpiration(accountName: string, issuedAt: string): Promise<string> {
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
  const issuedAtUnixNano = dayjs(issuedAt).unix() * 1_000_000_000; // TODO: See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER and add a comment here and in JSDoc for functions that have a `number` argument for dates. Explain why it's safe to use floating point `number` type (if it is), or switch to a better approach and explain it.
  console.log({ issuedAt, issuedAtUnixNano, accountName });
  const rawQuery = getRawQuery(accountName, issuedAtUnixNano);
  // https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#queryraw
  const result: RawQueryResult = await prisma.$queryRaw<RawQueryResult>`${rawQuery}`;

  console.log('getExpiration query result', { result });

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
