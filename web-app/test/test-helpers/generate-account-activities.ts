import dayjs from 'dayjs';
import crypto from 'crypto';
import { convertStringDateToNanoseconds } from '../../helpers/time';

type ActivityData = {
  signer_account_id: string;
  account_activities: {
    included_in_block_timestamp: string;
    receipt_id: string;
  }[];
};

export default async function generateActivityData(data: ActivityData, startDate: string, endDate: string) {
  const duration = dayjs(endDate).diff(dayjs(startDate), 'days'); // amount of days between startDate and endDate

  // add activity every 5 days
  for (let i = 0; i < duration; i += 5) {
    data.account_activities.push({
      included_in_block_timestamp: convertStringDateToNanoseconds(dayjs(startDate).add(i, 'day').format('YYYY-MM-DDTHH:mm:ss+00:00')),
      receipt_id: crypto.randomBytes(45).toString('hex'),
    });
  }
}
