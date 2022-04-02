import dayjs from 'dayjs'; // https://day.js.org/en
import BN from 'bn.js'; // https://github.com/indutny/bn.js

// issued_at expects milliseconds since epoch as string
export default function convertStringDateToMilliseconds(iso8601DateTime: string): string {
  const moment = dayjs(iso8601DateTime); // https://day.js.org/docs/en/parse/string
  const unixSeconds = moment.unix();
  const nano = new BN(unixSeconds).mul(new BN(1_000));
  return nano.toString();
}
