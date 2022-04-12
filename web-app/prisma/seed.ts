// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Disabling TypeScript checking for this file since it's only seeding. https://stackoverflow.com/a/51774725/470749
import dayjs from 'dayjs';
import prisma from '../test/test-helpers/client';
import { convertStringDateToNanoseconds } from '../helpers/time';
// TODO: Add missing data
// TODO: refactor comments

// eslint-disable-next-line max-lines-per-function
async function main() {
  // ########### START OF SEEDING DATA FOR sally.testnet ###########

  // seed DB with sally.testnet data
  const dataSally = {
    signer_account_id: 'sally.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-12-23T09:46:39+00:00'),
        receipt_id: 'Wt4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUoic',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-03-02T12:35:46+00:00'),
        receipt_id: 'r74mcWqH2zCQeBzOgiS4skLnjvARIONorhfKroxrFAEts',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-04-27T21:19:59+00:00'),
        receipt_id: 'Zc82R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
    ],
  };

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

  // seed DB with steve.testnet data
  const dataSteve = {
    signer_account_id: 'steve.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-05T09:46:39+00:00'),
        receipt_id: 'st4a5NwKgihcWiKlU6NHDWhfoeE9b7HsYUIjTQAfCUost',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-02-27T11:40:46+00:00'),
        receipt_id: 'st4ncWqH2zCQeBzOgiS4skLnjvARIONorhfKroxrFAEst',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-02-02T12:35:46+00:00'),
        receipt_id: 'st4mcWqH2zCQeBzOgiS4skLnjvARIONorhfKroxrFAEst',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-01-15T12:10:46+00:00'),
        receipt_id: 'st4mcWqH2zCQeBzOgiS4skLnjvARIONorhfKroxrFAEts',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-10-06T22:10:05+00:00'),
        receipt_id: 'st02R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHast',
      }, // moment
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-03-16T20:08:59+00:00'),
        receipt_id: 'st02R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-02-14T20:08:59+00:00'),
        receipt_id: 'st03R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-02-08T07:19:59+00:00'),
        receipt_id: 'st04R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-01-10T16:25:59+00:00'),
        receipt_id: 'st05R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6V',
      },
    ],
  };

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

  // ########### START OF SEEDING DATA FOR john.testnet ###########

  // seed DB with john.testnet data
  const dataJohn = {
    signer_account_id: 'john.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-04-05T17:24:06+00:00'),
        receipt_id: 'jdcSMfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tndRC2',
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-25T16:09:06+00:00'),
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

  dataJohn.account_activities.forEach(async (action) => {
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
        signer_account_id: dataJohn.signer_account_id,
      },
    });
  });
  // ########### END OF SEEDING DATA FOR john.testnet ###########

  // ######### START OF SEEDING DATA FOR bob.testnet #########

  // seed DB with bob.testnet data
  const dataBob = {
    signer_account_id: 'bob.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2022-03-04T13:20:37+00:00'),
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
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-11-07T13:20:37+00:00'), // 184 days to previous activity.
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
        included_in_block_timestamp: convertStringDateToNanoseconds('2019-10-01T13:20:37+00:00'), // 365 days to previous activity
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

  // seed DB with rebecca.testnet data
  const dataRebecca = {
    signer_account_id: 'rebecca.testnet',
    account_activities: [],
  };

  dataRebecca.account_activities.push({
    included_in_block_timestamp: convertStringDateToNanoseconds('2022-04-07T16:25:59+00:00'),
    receipt_id: `steveYfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tstoday`,
  });

  // Get duration between issue date and date before account's last activity date in days, to create activity data every few days in between these dates.
  const issueDateRebecca = dayjs('2021-08-03');
  const endDate = dayjs('2022-04-05');
  const duration = endDate.diff(issueDateRebecca, 'days');

  // create activity every 5 days after issue date until '2022-04-05' and push to dataRebecca
  for (let i = 0; i < duration; i += 5) {
    dataRebecca.account_activities.push({
      included_in_block_timestamp: convertStringDateToNanoseconds(issueDateRebecca.add(i, 'day').toISOString()),
      receipt_id: `steveYfikcRDP1xGRiRMSVPMciC2Mq1tndRC2Mq1tsteve${i}`,
    });
  }

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

  const dataAlice = {
    signer_account_id: 'alice.testnet',
    account_activities: [
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2021-03-11T19:05:12+00:00'),
        receipt_id: `al04R6f58evLaZ3h306k9vs9PpAifXytsRABt4ngpHa6b`,
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-09-10T18:30:06+00:00'),
        receipt_id: `al376vbsREdvLakfmcVkieiJhdshjfgbIewj73hncytsRb`,
      },
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2020-03-04T08:25:59+00:00'),
        receipt_id: `al98R6f58evkjlvmewopOFOKDjfdkKdjfksdfcmkskldew`,
      },
      // eslint-disable-next-line max-lines
      {
        included_in_block_timestamp: convertStringDateToNanoseconds('2019-08-03T00:00:00+00:00'),
        receipt_id: `al14R6f58evkjlcmkMcmdWA89dsfkfuewiUIDbcdsacDs2`,
      },
    ],
  };

  // Seed DB with alice.testnet activity data
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
