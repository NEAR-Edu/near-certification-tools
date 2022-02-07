import { Decimal } from '@prisma/client/runtime';
import dayjs, { Dayjs } from 'dayjs';

export function convertTimestampDecimalToDayjsMoment(timestampDecimal: Decimal): Dayjs {
  // https://stackoverflow.com/questions/71024496/why-do-i-need-to-divide-the-timestamp-by-1-billion
  // https://discord.com/channels/828768337978195969/830348856561500167/940337682121359391
  const timestampNum = Number(timestampDecimal) / 1_000_000_000; // Jacob said "I think that's the same precision used internally by NEAR core to store timestamps, in nanoseconds".
  const moment = dayjs.unix(timestampNum); // https://day.js.org/docs/en/parse/unix-timestamp
  return moment;
}

export function formatDate(dateTime: Dayjs) {
  // https://day.js.org/docs/en/display/format
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm'); // TODO Check what time zone
}
