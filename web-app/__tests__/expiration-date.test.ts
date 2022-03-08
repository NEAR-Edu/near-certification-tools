import { PrismaClient } from '@prisma/client';
import getExpiration from '../helpers/expiration-date';
import getQueryResult from '../prisma/test-helpers/query';

const prisma = new PrismaClient();

afterAll(async () => {
  const deleteReceipt = prisma.action_receipts.deleteMany();
  const deleteActionReceipt = prisma.receipts.deleteMany();

  await prisma.$transaction([deleteReceipt, deleteActionReceipt]);

  await prisma.$disconnect();
});

it('should return query result for jane doe', async () => {
  const queryResult = await getQueryResult('janedoe.testnet', '2022-03-02');

  expect(queryResult).toEqual(
    expect.arrayContaining([
      {
        moment: '2022-12-23T09:46:39+00:00',
        diff_to_previous_activity: 296,
        has_long_period_of_inactivity: true,
      },
    ]),
  );
});

it('should return query result for john doe', async () => {
  const queryResult = await getQueryResult('johndoe.testnet', '2022-03-02');

  expect(queryResult).toEqual(
    expect.arrayContaining([
      {
        moment: '2022-03-25T16:09:06+00:00',
        diff_to_previous_activity: null,
        has_long_period_of_inactivity: false,
      },
    ]),
  );
});

it('should return expiration date as Last Activity Date - (diff_to_previous_activity - 180) for account with 180-day inactivity period', async () => {
  // jane has a 180-day inactivity after issue date
  // 296 - 180 = 116
  // Last Activity: '2022-12-23'
  // Expiration Date = '2022-12-23' - 116 days = '2022-08-29'
  await expect(getExpiration('janedoe.testnet', '2022-03-02')).resolves.toEqual('2022-08-29');
});

it('should return expiration date as Last Activity Date + 180 for account with no 180-day inactivity period', async () => {
  // john does not have any 180-day inactivity after issue date
  // Last Activity: '2022-03-25'
  // Expiration Date = '2022-03-25' + 180 days = '2022-09-21'
  await expect(getExpiration('johndoe.testnet', '2022-03-02')).resolves.toEqual('2022-09-21');
});
