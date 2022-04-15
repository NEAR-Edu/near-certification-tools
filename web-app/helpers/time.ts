import { Decimal } from '@prisma/client/runtime';
import dayjs, { Dayjs } from 'dayjs'; // https://day.js.org/en
import utc from 'dayjs/plugin/utc'; // https://day.js.org/docs/en/plugin/utc
import BN from 'bn.js'; // https://github.com/indutny/bn.js

const defaultDateFormat = 'YYYY-MM-DD';
dayjs.extend(utc); // use dayjs utc plugin to avoid parsing different dates depending on local timezone. https://github.com/iamkun/dayjs/issues/1723#issuecomment-985246689

export function convertTimestampToDayjsMoment(timestamp: Decimal | number | string, denominator: number): Dayjs {
  // https://stackoverflow.com/questions/71024496/why-do-i-need-to-divide-the-timestamp-by-1-billion
  // https://discord.com/channels/828768337978195969/830348856561500167/940337682121359391
  const timestampNum = new BN(Number(timestamp)).div(new BN(denominator));
  const moment = dayjs.unix(timestampNum.toNumber()); // https://day.js.org/docs/en/parse/unix-timestamp
  return moment;
}

export function convertNanoTimestampDecimalToDayjsMoment(timestampDecimal: Decimal): Dayjs {
  // Jacob said "I think that's the same precision used internally by NEAR core to store timestamps, in nanoseconds".
  return convertTimestampToDayjsMoment(timestampDecimal, 1_000_000_000);
}

export function formatDate(dateTime: Dayjs) {
  // https://day.js.org/docs/en/display/format
  // https://github.com/iamkun/dayjs/issues/1723#issuecomment-985246689
  return dayjs.utc(dateTime).format(defaultDateFormat); // UTC (Coordinated Universal Time) to date string in defaultDateFormat (YYYY-MM-DD)
}

export function convertMillisecondsTimestampToFormattedDate(milliseconds: string) {
  const moment = convertTimestampToDayjsMoment(milliseconds, 1_000);
  return formatDate(moment);
}

export function isBeforeNow(dateTimeString: string): boolean {
  return dayjs(dateTimeString).isBefore(dayjs()); // https://day.js.org/docs/en/query/is-before
}

export function convertStringDateToOtherPrecision(iso8601DateTime: string, multiplier: BN): string {
  const moment = dayjs(iso8601DateTime); // https://day.js.org/docs/en/parse/string
  const unixSeconds = moment.unix();
  const result = new BN(unixSeconds).mul(new BN(multiplier));
  return result.toString();
}

export function convertStringDateToNanoseconds(iso8601DateTime: string): string {
  return convertStringDateToOtherPrecision(iso8601DateTime, new BN(1_000_000_000));
}

export function convertStringDateToMilliseconds(iso8601DateTime: string): string {
  return convertStringDateToOtherPrecision(iso8601DateTime, new BN(1000));
}
