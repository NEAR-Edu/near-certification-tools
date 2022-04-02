// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Disabling TypeScript checking for this file since it's only seeding. https://stackoverflow.com/a/51774725/470749
import prisma from '../test/test-helpers/client';
import { convertStringDateToNanoseconds } from '../helpers/time';

// eslint-disable-next-line max-lines-per-function
async function main() {
  // ########### START OF SEEDING DATA FOR sallysmith.testnet ###########
  // ----------------------------------------------------------------
  // ------- account with 180-day inactivity after issue date -------
  // ----------------------------------------------------------------

  // seed db with sallysmith.testnet data
  const dataSallySmith = {
    signer_account_id: 'sallysmith.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-12-23T09:46:39+00:00'), // This is the end date of FIRST OCCURENCE of a 180-day inactivity period. Difference to previous activty(diff_to_previous_activity) is 296. The query should return 296 days as diff_to_previous and has_long_period_of_inactivity as true. The expiration date should be calculated as (previous_actiivity + 180 ), or in other words :  last activity date - (diff_to_previous_activity - 180)
        receipt_id: 'Wt4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUoic',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-03-02T12:35:46+00:00'), // previous activity. The issue date in tests for this account is 2021-03-02, the same day as this date, query is expected to NOT ignore this entry.
        receipt_id: 'r74mcWqH2zCQeBzOgiS4skLnjvARIONorhfKroxrFAEts',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-04-27T21:19:59+00:00'),
        receipt_id: 'Zc82R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
    ],
  };

  // create receipts and action_receipts for sallysmith.testnet
  dataSallySmith.account_activities.forEach(async (action) => {
    await prisma.receipts.create({
      data: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.create({
      data: {
        receipt_id: action.receipt_id,
        signer_account_id: dataSallySmith.signer_account_id,
      },
    });
  });
  // ########### END OF SEEDING DATA FOR sallysmith.testnet ###########

  // ########### START OF SEEDING DATA FOR johndoe.testnet ###########
  // ------------------------------------------------------------------------------------
  // ---- active account, that does not have any 180-day inactivity after issue date ----
  // ------------------------------------------------------------------------------------

  // seed db with johndoe.testnet data
  const dataJohnDoe = {
    signer_account_id: 'johndoe.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-25T16:09:06+00:00'), // Last activity date. Difference to previous activity is <180. The query should return diff_to_previous as null and has_long_period_of_inactivity as false. Expiration date should be: last activity date + 180 days
        receipt_id: 'OkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-14T02:22:26+00:00'),
        receipt_id: '0zxA9dIZCrd8NltfLA3xFy2ctNTT4nskvNkjZP5bvEBl5',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-02T12:35:46+00:00'),
        receipt_id: 'o2uftO97TSisawK2PCkqe45tki0A9IX6lWRkQXUjy6rW6',
      },
    ],
  };

  dataJohnDoe.account_activities.forEach(async (action) => {
    await prisma.receipts.create({
      data: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.create({
      data: {
        receipt_id: action.receipt_id,
        signer_account_id: dataJohnDoe.signer_account_id,
      },
    });
  });
  // ########### END OF SEEDING DATA FOR johndoe.testnet ###########

  // ######### START OF SEEDING DATA FOR bobwilson.testnet #########
  // -------------------------------------------
  // ------ accountwith years of activity ------
  // -------------------------------------------

  /**
   * tests check two scenarios for this account
   * Scenario 1: Where issue date is 2021-11-05
   * Scenario 2: Where issue date is 2018-10-01
   */

  // seed db with bobwilson.testnet data
  const dataBobWilson = {
    signer_account_id: 'bobwilson.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-04T13:20:37+00:00'), // For Scenario 1 where issue date is 2021-11-05, this is the last activity date. Difference to previous activity date is <180 days. The query should return diff_to_previous as null and has_long_period_of_inactivity as false. Expiration date should be: last activity date + 180 days
        receipt_id: 'UkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-02-03T13:20:37+00:00'),
        receipt_id: 'TkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-01-05T13:20:37+00:00'),
        receipt_id: 'SkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-11-07T13:20:37+00:00'), // 184 days to previous activity. For Scenario 1, where issue date is 2018-10-01, query matches this date as well but since we want to get the FIRST OCCURENCE of inactivity period, query result should not return this.
        receipt_id: 'RkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-05-07T13:20:37+00:00'),
        receipt_id: 'QkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-04-20T13:20:37+00:00'),
        receipt_id: 'PkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-04-16T13:20:37+00:00'),
        receipt_id: 'NkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-01-24T13:20:37+00:00'),
        receipt_id: 'MkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-11-24T13:20:37+00:00'),
        receipt_id: 'LkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-08-09T13:20:37+00:00'),
        receipt_id: 'KkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-02-16T13:20:37+00:00'),
        receipt_id: 'JkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-02-11T13:20:37+00:00'),
        receipt_id: 'IkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2019-12-13T13:20:37+00:00'),
        receipt_id: 'HkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2019-11-05T13:20:37+00:00'),
        receipt_id: 'GkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2019-10-01T13:20:37+00:00'), // For Scenario 2 where issue date is 2018-10-01, this is the end date of FIRST OCCURENCE of 180-day inactivity period. The second occurence is 2021-11-07 where diffeerence to previous activity is 184 days. Here, difference to previous activty(diff_to_previous_activity) is 365. The query should return this date, 365 days as diff_to_previous and has_long_period_of_inactivity as true. The expiration date should be calculated as (previous_actiivity + 180 ), or in other words :  last activity date - (diff_to_previous_activity - 180)
        receipt_id: 'FkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2018-10-01T13:20:37+00:00'),
        receipt_id: 'EkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2017-06-03T13:20:37+00:00'),
        receipt_id: 'DkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2016-07-21T13:20:37+00:00'),
        receipt_id: 'CkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2016-05-18T13:20:37+00:00'),
        receipt_id: 'BkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2015-03-14T13:20:37+00:00'),
        receipt_id: 'AkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
    ],
  };

  dataBobWilson.account_activities.forEach(async (action) => {
    await prisma.receipts.create({
      data: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.create({
      data: {
        receipt_id: action.receipt_id,
        signer_account_id: dataBobWilson.signer_account_id,
      },
    });
  });
  // ######### END OF SEEDING DATA FOR bobwilson.testnet #########

  console.log('✨ Seeding finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
