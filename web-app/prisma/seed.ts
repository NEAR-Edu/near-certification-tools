// @ts-nocheck
// Disabling TypeScript checking for this file since it's only seeding. https://stackoverflow.com/a/51774725/470749
import dayjs from 'dayjs';
import client from '../test/test-helpers/client';
import { convertStringDateToNanoseconds } from '../helpers/time';
import generateActivityData from '../test/test-helpers/generate-account-activities';

// TODO: refactor comments

type SeedData = {
  account_activities: {
    included_in_block_timestamp: string;
    receipt_id: string;
  };
  signer_account_id: string;
};

async function seedForAccount(data: SeedData): Promise<void> {
  // Seed DB with sally.testnet data
  // create receipts and action_receipts for sally.testnet
  const receipts: Promise[] = [];
  const actionReceipts: Promise[] = [];

  /* eslint-disable camelcase, @typescript-eslint/naming-convention */
  // eslint-disable-next-line no-restricted-syntax
  for (const { included_in_block_timestamp, receipt_id } of data.account_activities) {
    receipts.push(
      client.receipts.upsert({
        create: {
          included_in_block_timestamp,
          receipt_id,
        },
        update: {
          included_in_block_timestamp,
        },
        where: { receipt_id },
      }),
    );

    actionReceipts.push(
      client.action_receipts.upsert({
        create: {
          receipt_id,
          signer_account_id: dataSally.signer_account_id,
        },
        update: {},
        where: { receipt_id },
      }),
    );
  }
  /* eslint-enable camelcase, @typescript-eslint/naming-convention */

  await Promise.all([Promise.all(receipts), Promise.all(actionReceipts)]);
}

// eslint-disable-next-line max-lines-per-function
async function main() {
  // * Seed file is structured according to the order of test cases in '../test/__tests__/expiration-date.test.ts'*

  // ########### START OF SEEDING DATA FOR sally.testnet ###########
  // -- Test Case 1 --
  // ACCOUNT: sally.testnet
  /**
   * Sally’s certificate was issued_at 2021-03-02T12:35:46+00:00,
   * She had no mainnet activitiy for 296 days (i.e. >180-days of inactivity)
   * Her last mainnet activity was on 2021-12-23T09:46:39+00:00
   * and she hasn’t been active since 2021-12-23T09:46:39+00:00
   */

  // sally.testnet data
  const dataSally = {
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-12-23T09:46:39+00:00'), // 296 days have passed since issue date, which was on 2021-03-02T12:35:46+00:00. moment = issue date. When getExpiration is called, query will return issue date as moment. Issuing a cert to an account is not an action recorded on account's mainnet transaction history and therefore cannot be directly reached from account activity data, also the reason for not being seeded here.
        receipt_id: 'Wt4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUoic',
      },
    ],
    signer_account_id: 'sally.testnet',
  };

  // Seed DB with sally.testnet data
  // create receipts and action_receipts for sally.testnet
  await seedForAccount(dataSally);
  // ########### END OF SEEDING DATA FOR sally.testnet ###########

  // ###########
  // Note: Test Case 2 (Account: patricia.testnet) does not rquire seeding data since account did not have had any activity after issue date.
  // ###########

  // ########### START OF SEEDING DATA FOR steve.testnet ###########
  // -- Test Case 3 --
  // ACCOUNT: steve.testnet
  /**
   * Steve's cert was issued_at 2021-01-05T11:15:09+00:00
   * He had frequent mainnet activity for a couple of months (through 2021-03-16T20:08:59+00:00)
   * but then no mainnet activity for 204 days (i.e. >180-days of inactivity)
   * and then had some more mainnet activity.
   * His last mainnet activity was on 2022-03-05T09:46:39+00:00
   * But none of that activity after his 180+ days of inactivity matters because his certificate should have expired 180 days after the
   * beginning of the *first* long period of inactivity (>=180 days).
   */

  // steve.testnet data
  const dataSteve = {
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-05T09:46:39+00:00'), // Most recent mainnet activity
        receipt_id: 'st4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUost',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-10-06T22:10:05+00:00'), // 204 days have passed since previous activity which was on 2021-03-16T20:08:59+00:00
        receipt_id: 'st02R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHast',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-03-16T20:08:59+00:00'), // moment (start date of long inactivity period)
        receipt_id: 'st02R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
    ],
    signer_account_id: 'steve.testnet',
  };

  // Create activities between dates where the account was frequently active according to the scenario.
  // Steve had frequent activity for a couple of months after issue date (2021-01-05T11:15:09+00:00) through 2021-03-16T20:08:59+00:00
  await generateActivityData(dataSteve, '2021-01-05T11:15:09+00:00', '2021-03-16T20:08:59+00:00', 'days', 5);
  // and more activity after 2021-10-06T22:10:05+00:00 through 2022—03—0509:46:39+00:00
  await generateActivityData(dataSteve, '2021-10-06T22:10:05+00:00', '2022—03—0509:46:39+00:00', 'days', 5);

  // Seed DB with steve.testnet data
  // create receipts and action_receipts for steve.testnet
  await seedForAccount(dataSteve);
  // ########### END OF SEEDING DATA FOR steve.testnet ###########

  // ######### START OF SEEDING DATA FOR bob.testnet #########
  // -- Test Case 4 --
  // ACCOUNT: bob.testnet
  /**
   * Bob's certificate was issued_at 2018-10-01T00:00:00+00:00,
   * he has not had any mainnet activity for 365 days (i.e. >180-days of inactivity)
   * then had frequent mainnet activity for a couple of years (through 2021-05-07T13:20:37+00:00)
   * then again no mainnet activity for 184 days
   * then, had frequent mainnet activity for a couple of months (through 2022-03-04T13:20:37+00:00)
   * His last mainnet activity was on 2022-03-04T13:20:37+00:00
   */

  // bob.testnet data
  const dataBob = {
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-04T13:20:37+00:00'), // Most recent mainnet activity
        receipt_id: 'UkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-11-07T13:20:37+00:00'), // 184 days have passed since previous activity which was on 2021-05-07T13:20:37+00:00
        receipt_id: 'RkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-05-07T13:20:37+00:00'),
        receipt_id: 'QkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2019-10-01T00:00:00+00:00'), // 365 days have passed since issue date, which was on 2018-10-01T00:00:00+00:00. moment = issue date. When getExpiration is called, query will return issue date as moment. Issuing a cert to an account is not an action recorded on account's mainnet transaction history and therefore cannot be directly reached from account activity data, also the reason for not being seeded here.
        receipt_id: 'FkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
    ],
    signer_account_id: 'bob.testnet',
  };

  // Create activities between dates where the account was frequently active according to the scenario.
  // Bob had frequent activity for a couple of years after 2019-10-01T13:20:37+00:00 through 2021-05-07T13:22:15+00:00
  await generateActivityData(dataBob, '2019-10-01T13:20:37+00:00', '2021-05-07T13:22:15+00:00', 'days', 5);
  // then again had frequent activity for a couple of months after 2021-11-07T13:13:12+00:00 through 2022-03-04T18:20:55+00:00
  await generateActivityData(dataBob, '2021-11-07T13:13:12+00:00', '2022-03-04T18:20:55+00:00', 'days', 5);

  // Seed DB with bob.testnet data
  // Create receipts and action_receipts for bob.testnet
  await seedForAccount(dataBob);
  // ######### END OF SEEDING DATA FOR bob.testnet #########

  // ########### START OF SEEDING DATA FOR alice.testnet ###########
  // -- Test Case 5 --
  // ACCOUNT: alice.testnet
  /**
   * Alice's cert was issued_at 2019-08-03T00:00:00+00:00
   * she has not had any mainnet activity for 214 days (i.e. >180-days of inactivity)
   * then again no mainnet activity for 190 days
   * then again no mainnet activity for 182 days
   * and has not had any mainnet activity since then.
   */

  // alice.testnet data
  const dataAlice = {
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-03-11T19:05:12+00:00'), // Most recent mainnet activity. 182 days have passed since previous activity which was on 2020-09-10T18:30:06+00:00
        receipt_id: 'al04R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6b',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-09-10T18:30:06+00:00'), // 190 days have passed since previous activity which was on 2020-03-04T08:25:59+00:00
        receipt_id: 'al376vbsREdvLakfmcVkieiJhdshjfgbIewj73hncytsRb',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-03-04T08:25:59+00:00'), // 214 days have passed since issue date, which was on 2019-08-03T00:00:00+00:00. moment = issue date. When getExpiration is called, query will return issue date as moment. Issuing a cert to an account is not an action recorded on account's mainnet transaction history and therefore cannot be directly reached from account activity data, also the reason for not being seeded here.
        receipt_id: 'al98R6f58evkjlvmewopOFOKDjfdkKdjfksdfcmkskldew',
      },
    ],
    signer_account_id: 'alice.testnet',
  };

  // Seed DB with alice.testnet activity data
  // Create receipts and action_receipts for alice.testnet
  await seedForAccount(dataAlice);
  // ########### END OF SEEDING DATA FOR alice.testnet ###########

  // ########### START OF SEEDING DATA FOR rebecca.testnet ###########
  // -- Test Case 6 --
  // ACCOUNT: rebecca.testnet
  /**
   * Rebecca's cert was issued_at 2021-08-03T00:00:00+00:00
   * She has continued to have mainnet activity every couple of days through 2022-04-07T16:25:59+00:00
   */

  // rebecca.testnet data
  const dataRebecca = {
    account_activities: [],
    signer_account_id: 'rebecca.testnet',
  };

  // Seed DB with rebecca.testnet activity data
  // Create receipts and action_receipts for rebecca.testnet
  dataRebecca.account_activities.push({
    included_in_block_timestamp: convertStringDateToNanoseconds('2022-04-07T16:25:59+00:00'), // moment (most recent mainnet activity)
    receipt_id: 'rei9KjsfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tsjd',
  });

  // Create activities between dates where the account was frequently active according to the scenario.
  // Rebecca had frequent activity every couple of days after issue date (2021-08-03T00:00:00+00:00) through 2022-04-07T16:25:59+00:00
  await generateActivityData(dataRebecca, '2021-08-03T00:00:00+00:00', '2022-04-07T16:25:59+00:00', 'days', 5);

  // Seed DB with rebecca.testnet activity data
  // Create receipts and action_receipts for rebecca.testnet
  await seedForAccount(dataRebecca);
  // ########### END OF SEEDING DATA FOR rebecca.testnet ###########

  // ########### START OF SEEDING DATA FOR jennifer.testnet ###########
  // -- Test Case 7 --
  // ACCOUNT: jennifer.testnet
  /**
   * Jennifer's cert was issued_at 2022-04-06T01:00:00+00:00
   * She has continued to have mainnet activity every couple of minutes through 2022-04-06T10:10:00+00:00
   */

  // jennifer.testnet data
  const dataJennifer = {
    account_activities: [],
    signer_account_id: 'jennifer.testnet',
  };

  // Create activities between dates where the account was frequently active according to the scenario.
  // Jennifer had frequent activity every couple of minutes from 2022-04-06T01:00:00+00:00 through 2022-04-06T10:20:00+00:00
  // moment is 2022-04-06T10:10:00+00:00 (most recent mainnet activity)
  await generateActivityData(dataJennifer, '2022-04-06T01:00:00+00:00', '2022-04-06T10:20:00+00:00', 'minutes', 10);

  // Seed DB with jennifer.testnet activity data
  // Create receipts and action_receipts for jennifer.testnet
  await seedForAccount(dataJennifer);
  // ########### END OF SEEDING DATA FOR jennifer.testnet ###########

  // ########### START OF SEEDING DATA FOR william.testnet ###########
  // -- Test Case 8 --
  // ACCOUNT: william.testnet
  /**
   * Williams's cert was issued_at 180 days and 2 hours prior to now (present moment)
   * He had activity 1 hour after the issue date
   * he has not had any mainnet activity since
   */

  // william.testnet data
  const dataWilliam = {
    account_activities: [],
    signer_account_id: 'william.testnet',
  };

  const startDateWilliam = dayjs.utc().subtract(180, 'days').subtract(2, 'hours');
  const endDateWilliam = dayjs.utc().subtract(180, 'days');

  // Create activities between dates where the account was frequently active according to the scenario.
  // William had activity between the hour of (present moment - 180 days - 2 hours) and (present moment - 180 days)
  // moment is present moment - 180 days - 1 hour (most recent mainnet activity)
  await generateActivityData(dataWilliam, startDateWilliam, endDateWilliam, 'hours', 1);

  // Seed DB with william.testnet activity data
  // Create receipts and action_receipts for william.testnet
  await seedForAccount(dataWilliam);
  // ########### END OF SEEDING DATA FOR william.testnet ###########

  // ########### START OF SEEDING DATA FOR john.testnet ###########
  // -- Test Case 9 --
  // ACCOUNT: john.testnet
  /**
   * John's cert was issued_at 180 days prior to now (present moment)
   * He had activity 1 hour after the issue date
   * he has not had any mainnet activity since
   */

  // john.testnet data
  const dataJohn = {
    account_activities: [],
    signer_account_id: 'john.testnet',
  };

  const startDateJohn = dayjs.utc().subtract(180, 'days');
  const endDateJohn = dayjs.utc().subtract(180, 'days').add(2, 'hours');

  // Create activities between dates where the account was frequently active according to the scenario.
  // John had activity between the hour of (present moment - 180 days) and (present moment - 180 days + 2 hours)
  // moment is present moment - 180 days + 1 hour (most recent mainnet activity)
  await generateActivityData(dataJohn, startDateJohn, endDateJohn, 'hours', 1);

  // Seed DB with john.testnet activity data
  // Create receipts and action_receipts for john.testnet
  await seedForAccount(dataJohn);
  // ########### END OF SEEDING DATA FOR john.testnet ###########

  console.log('✨ Seeding finished!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    await client.$disconnect();
  });
