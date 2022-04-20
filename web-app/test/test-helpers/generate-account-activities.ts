import dayjs from 'dayjs';
import crypto from 'crypto'; // https://stackoverflow.com/a/27747377
import utc from 'dayjs/plugin/utc'; // https://day.js.org/docs/en/plugin/utc
import { convertStringDateToNanoseconds } from '../../helpers/time';

dayjs.extend(utc); // Use dayjs utc plugin to avoid parsing different dates depending on local timezone.

type ActivityData = {
  signer_account_id: string;
  account_activities: {
    included_in_block_timestamp: string;
    receipt_id: string;
  }[];
};

export default async function generateActivityData(data: ActivityData, startDate: string, endDate: string, timeUnit: any, interval: number) {
  const startDateDayJs = dayjs.utc(startDate);
  const endDateDayJs = dayjs.utc(endDate);
  const duration = endDateDayJs.diff(startDateDayJs, timeUnit); // Duration between startDate and endDate in timeUnit (i.e. days, hours,...)

  // add activity every value of interval in given timeUnit
  for (let i = interval; i < duration; i += interval) {
    const date = startDateDayJs.add(i, timeUnit).format('YYYY-MM-DDTHH:mm:ss+00:00');

    data.account_activities.push({
      included_in_block_timestamp: convertStringDateToNanoseconds(date),
      receipt_id: crypto.randomBytes(22.5).toString('hex'), // Match receipt_id length convention of 45 chars. Using randomBytes, resulting string is double the size of given bytes in length.
    });
  }
}
