import { PrismaClient } from '@prisma/client';
import getExpiration from '../prisma/test-helpers/expiration';
import { getQueryResult } from '../prisma/test-helpers/query';

const prisma = new PrismaClient();

// eslint-disable-next-line max-lines-per-function
beforeAll(async () => {
  // create receipts
  await prisma.receipts.createMany({
    data: [
      {
        receipt_id: 'xxxxxxxxxxxxxxxxsxxxxxxxxxxxxxxxsxxxxxxxxxxxx',
        included_in_block_timestamp: 1646224546000000000,
      },
      {
        receipt_id: 'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
        included_in_block_timestamp: 1745788799000000000,
      },
      {
        receipt_id: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
        included_in_block_timestamp: 1671788799000000000,
      },
      {
        receipt_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        included_in_block_timestamp: 1646224546000000000,
      },
      {
        receipt_id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        included_in_block_timestamp: 1647224546000000000,
      },
      {
        receipt_id: 'ccccccccccccccccccccccccccccccccccccccccccccc',
        included_in_block_timestamp: 1648224546000000000,
      },
    ],
  });

  // create action_receipts
  await prisma.action_receipts.createMany({
    data: [
      {
        receipt_id: 'xxxxxxxxxxxxxxxxsxxxxxxxxxxxxxxxsxxxxxxxxxxxx',
        signer_account_id: 'janedoe.testnet',
      },
      {
        receipt_id: 'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
        signer_account_id: 'janedoe.testnet',
      },
      {
        receipt_id: 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
        signer_account_id: 'janedoe.testnet',
      },
      {
        receipt_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        signer_account_id: 'johndoe.testnet',
      },
      {
        receipt_id: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        signer_account_id: 'johndoe.testnet',
      },
      {
        receipt_id: 'ccccccccccccccccccccccccccccccccccccccccccccc',
        signer_account_id: 'johndoe.testnet',
      },
    ],
  });

  console.log('✨ 2 action_receipts successfully created!');

  console.log('✨ 2 receipts successfully created!');
});

afterAll(async () => {
  const deleteReceipt = prisma.action_receipts.deleteMany();
  const deleteActionReceipt = prisma.receipts.deleteMany();

  await prisma.$transaction([deleteReceipt, deleteActionReceipt]);

  await prisma.$disconnect();
});

it('should return expiration date for jane doe', async () => {
  // jane has a 180-dayinactivity after issue date
  await expect(getExpiration('janedoe.testnet', '2022-03-02')).resolves.toEqual('2022-08-29');
});

it('should return expiration date for john doe', async () => {
  // johnn does not have any 180-dayinactivity after issue date
  await expect(getExpiration('johndoe.testnet', '2022-03-02')).resolves.toEqual('2022-09-21');
});

it('should return query result for jane doe', async () => {
  const queryResult = await getQueryResult('janedoe.testnet', '2022-03-02');

  expect(queryResult).toEqual(
    expect.arrayContaining([
      {
        moment: expect.any(String),
        diff_to_previous_activity: expect.any(Number),
        diff_from_last_activity_to_render_date: null,
        has_long_period_of_inactivity: true,
      },
    ]),
  );

  console.log('jane doe', { queryResult });
});

it('should return query result for john doe', async () => {
  const queryResult = await getQueryResult('johndoe.testnet', '2022-03-02');

  expect(queryResult).toEqual(
    expect.arrayContaining([
      {
        moment: expect.any(String),
        diff_to_previous_activity: null,
        diff_from_last_activity_to_render_date: expect.any(Number),
        has_long_period_of_inactivity: false,
      },
    ]),
  );

  console.log('john doe', { queryResult });
});
