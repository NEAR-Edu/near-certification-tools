import dayjs from 'dayjs';
import crypto from 'crypto'; // https://stackoverflow.com/a/27747377
import utc from 'dayjs/plugin/utc'; // https://day.js.org/docs/en/plugin/utc
import { convertStringDateToNanoseconds } from '../../helpers/time';

dayjs.extend(utc);

type ActivityData = {
  signer_account_id: string;
  account_activities: {
    included_in_block_timestamp: string;
    receipt_id: string;
  }[];
};

// TODO: change startDate and endDate format to YYYY-MM-DDTHH:mm:ss+00:00
export default async function generateActivityData(data: ActivityData, startDate: string, endDate: string) {
  const startDateDayJs = dayjs.utc(startDate);
  const endDateDayJs = dayjs.utc(endDate);
  const duration = endDateDayJs.diff(startDateDayJs, 'days'); // amount of days between startDate and endDate

  // add activity every 5 days
  for (let i = 0; i < duration; i += 5) {
    data.account_activities.push({
      included_in_block_timestamp: convertStringDateToNanoseconds(startDateDayJs.add(i, 'day').format('YYYY-MM-DDTHH:mm:ss+00:00')),
      receipt_id: crypto.randomBytes(45).toString('hex'),
    });
  }
}
