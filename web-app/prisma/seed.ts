// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Disabling TypeScript checking for this file since it's only seeding. https://stackoverflow.com/a/51774725/470749
import prisma from '../test/test-helpers/client';
import { convertStringDateToNanoseconds } from '../helpers/time';
import { generateActivityData, generateDynamicActivityData } from '../test/test-helpers/generate-account-activities';

// TODO: Add missing data
// TODO: refactor comments

// eslint-disable-next-line max-lines-per-function
async function main() {
  // ########### START OF SEEDING DATA FOR sally.testnet ###########
  /**
   * Sally’s certificate was issued_at 2021-03-02T00:00:00+00:00,
   * She had no mainnet activitiy for 296 days.
   * Her last mainnet activity was on 2021-12-23T09:46:39+00:00
   * and she hasn’t been active since 2021-12-23T09:46:39+00:00.
   */

  // sally.testnet data
  const dataSally = {
    signer_account_id: 'sally.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-12-23T09:46:39+00:00'), // Most recent mainnet activity. 296 days have passed since issue date.
        receipt_id: 'Wt4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUoic',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-03-02T12:35:46+00:00'), // Issue date
        receipt_id: 'r74mcWqH2zCQeBzOgiS4skLnjvARIONorhfKroxrFAEts',
      },
    ],
  };

  // Seed DB with sally.testnet data
  // create receipts and action_receipts for sally.testnet
  dataSally.account_activities.forEach(async (action) => {
    await prisma.receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
      create: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {},
      create: {
        receipt_id: action.receipt_id,
        signer_account_id: dataSally.signer_account_id,
      },
    });
  });
  // ########### END OF SEEDING DATA FOR sally.testnet ###########

  // ########### START OF SEEDING DATA FOR steve.testnet ###########
  /**
   * Steve's cert was issued_at 2021-01-05
   * He had frequent mainnet activity for a couple of months (2021-03-16T20:08:59+00:00)
   * but then no mainnet activity for 204 days (i.e. >180-days of inactivity)
   * and then had some more mainnet activity.
   * His last mainnet activity was on 2022-03-05T09:46:39+00:00
   * But none of that activity after his 180+ days of inactivity matters because his certificate should have expired 180 days after the
   * beginning of the first long period of inactivity (>=180 days).
   */

  // steve.testnet data
  const dataSteve = {
    signer_account_id: 'steve.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-05T09:46:39+00:00'), // Most recent mainnet activity
        receipt_id: 'st4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUost',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-10-06T22:10:05+00:00'), // 204 days have passed since previous activity which was on 2021-03-16T20:08:59+00:00
        receipt_id: 'st02R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHast',
      }, // moment
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-03-16T20:08:59+00:00'),
        receipt_id: 'st02R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-01-05T11:15:09+00:00'), // Issue Date
        receipt_id: 'st06R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
    ],
  };

  // Create activities between dates where the account was frequently active according to the scenario.
  // Steve had frequent activity for a couple of months after issue date (2021-01-05T11:15:09+00:00) through 2021-03-16T20:08:59+00:00
  await generateActivityData(dataSteve, '2021-01-05T11:15:09+00:00', '2021-03-16T20:08:59+00:00');
  // and more activity after 2021-10-06T22:10:05+00:00 through 2022—03—0509:46:39+00:00
  await generateActivityData(dataSteve, '2021-10-06T22:10:05+00:00', '2022—03—0509:46:39+00:00');

  // Seed DB with steve.testnet data
  // create receipts and action_receipts for steve.testnet
  dataSteve.account_activities.forEach(async (action) => {
    await prisma.receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
      create: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {},
      create: {
        receipt_id: action.receipt_id,
        signer_account_id: dataSteve.signer_account_id,
      },
    });
  });
  // ########### END OF SEEDING DATA FOR steve.testnet ###########

  // ######### START OF SEEDING DATA FOR bob.testnet #########
  /**
   * Bob's certificate was issued_at 2018-10-01T00:00:00+00:00,
   * he has not had any mainnet activity for 365 days
   * then had frequent mainnet activity for a couple of years (through 2021-05-07T13:20:37+00:00)
   * then again no mainnet activity for 184 days
   * then, had frequent mainnet activity for a couple of months (through 2022-03-04T13:20:37+00:00)
   * His last mainnet activity was on 2022-03-04T13:20:37+00:00
   */

  // bob.testnet data
  const dataBob = {
    signer_account_id: 'bob.testnet',
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
        included_in_block_timestamp: convertStringDateToNanoseconds('2019-10-01T00:00:00+00:00'), // 365 days have passed since previous activity which was on 2018-10-01T00:00:00+00:00
        receipt_id: 'FkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2018-10-01T00:00:00+00:00'),
        receipt_id: 'EkcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
    ],
  };

  // Create activities between dates where the account was frequently active according to the scenario.
  // Bob had frequent activity for a couple of years after 2019-10-01T13:20:37+00:00 through 2021-05-07T13:22:15+00:00
  await generateActivityData(dataBob, '2019-10-01T13:20:37+00:00', '2021-05-07T13:22:15+00:00');
  // then again had frequent activity for a couple of months after 2021-11-07T13:13:12+00:00 through 2022-03-04T18:20:55+00:00
  await generateActivityData(dataBob, '2021-11-07T13:13:12+00:00', '2022-03-04T18:20:55+00:00');

  // Seed DB with bob.testnet data
  // Create receipts and action_receipts for bob.testnet
  dataBob.account_activities.forEach(async (action) => {
    await prisma.receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
      create: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {},
      create: {
        receipt_id: action.receipt_id,
        signer_account_id: dataBob.signer_account_id,
      },
    });
  });
  // ######### END OF SEEDING DATA FOR bob.testnet #########

  // ########### START OF SEEDING DATA FOR rebecca.testnet ###########
  /**
   * Rebecca's cert was issued_at 2021-08-03T00:00:00+00:00
   * She has continued to have mainnet activity every couple of days through 2022-04-07T16:25:59+00:00
   */

  // rebecca.testnet data
  const dataRebecca = {
    signer_account_id: 'rebecca.testnet',
    account_activities: [],
  };

  // Seed DB with rebecca.testnet activity data
  // Create receipts and action_receipts for rebecca.testnet
  dataRebecca.account_activities.push(
    {
      included_in_block_timestamp: convertStringDateToNanoseconds('2022-04-07T16:25:59+00:00'), // Most rcenet mainnet activity
      receipt_id: 'rei9KjsfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tsjd',
    },
    {
      included_in_block_timestamp: convertStringDateToNanoseconds('2021-08-03T00:00:00+00:00'), // Issue date
      receipt_id: 'reoJh87STcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tsdlf',
    },
  );

  // Create activities between dates where the account was frequently active according to the scenario.
  // Rebecca had frequent activity every couple of days after issue date (2021-08-03T00:00:00+00:00) through 2022-04-07T16:25:59+00:00
  await generateActivityData(dataRebecca, '2021-08-03T00:00:00+00:00', '2022-04-07T16:25:59+00:00');

  // Seed DB with rebecca.testnet activity data
  dataRebecca.account_activities.forEach(async (action) => {
    await prisma.receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
      create: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {},
      create: {
        receipt_id: action.receipt_id,
        signer_account_id: dataRebecca.signer_account_id,
      },
    });
  });
  // ########### END OF SEEDING DATA FOR rebecca.testnet ###########

  // ########### START OF SEEDING DATA FOR alice.testnet ###########
  /**
   * Alice's cert was issued_at 2019-08-03T00:00:00+00:00
   * she has not had any mainnet activity for 214 days
   * then again no mainnet activity for 190 days
   * then again no mainnet activity for 182 days
   * and has not had any mainnet activity since then.
   */

  // alice.testnet data
  const dataAlice = {
    signer_account_id: 'alice.testnet',
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
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-03-04T08:25:59+00:00'), // 214 days have passed since previous activity which was on 2019-08-03T00:00:00+00:00
        receipt_id: 'al98R6f58evkjlvmewopOFOKDjfdkKdjfksdfcmkskldew',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2019-08-03T00:00:00+00:00'),
        receipt_id: 'al14R6f58evkjlcmkMcmdWA89dsfkfuewiUIDbcdsacDs2',
      },
    ],
  };

  // Seed DB with alice.testnet activity data
  // Create receipts and action_receipts for alice.testnet
  dataAlice.account_activities.forEach(async (action) => {
    await prisma.receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
      create: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {},
      create: {
        receipt_id: action.receipt_id,
        signer_account_id: dataAlice.signer_account_id,
      },
    });
  });
  // ########### END OF SEEDING DATA FOR alice.testnet ###########

  // ########### START OF SEEDING DATA FOR william.testnet ###########
  /**
   * ~~william.testnet
   */

  // william.testnet data
  const dataWilliam = {
    signer_account_id: 'william.testnet',
    account_activities: [],
  };

  await generateDynamicActivityData(dataWilliam);

  // Seed DB with william.testnet activity data
  // Create receipts and action_receipts for william.testnet
  dataWilliam.account_activities.forEach(async (action) => {
    await prisma.receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
      create: {
        receipt_id: action.receipt_id,
        included_in_block_timestamp: action.included_in_block_timestamp,
      },
    });

    await prisma.action_receipts.upsert({
      where: { receipt_id: action.receipt_id },
      update: {},
      create: {
        receipt_id: action.receipt_id,
        signer_account_id: dataWilliam.signer_account_id,
      },
    });
  });
  // ########### END OF SEEDING DATA FOR william.testnet ###########

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
