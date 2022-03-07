import { PrismaClient } from '@prisma/client';
import getExpiration from '../helpers/expiration-query';
import getQueryResult from '../prisma/test-helpers/query';

const prisma = new PrismaClient();

afterAll(async () => {
  const deleteReceipt = prisma.action_receipts.deleteMany();
  const deleteActionReceipt = prisma.receipts.deleteMany();

  await prisma.$transaction([deleteReceipt, deleteActionReceipt]);

  await prisma.$disconnect();
});
// TODO: REFACTOR
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
        has_long_period_of_inactivity: false,
      },
    ]),
  );

  console.log('john doe', { queryResult });
});
