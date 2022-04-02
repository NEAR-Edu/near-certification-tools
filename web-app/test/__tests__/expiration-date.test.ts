import { PrismaClient } from '@prisma/client';
// import { prismaMock } from '../prisma/test-helpers/mock-client';
import { getExpiration, getRawQueryResult } from '../../helpers/expiration-date';
import convertStringDateToMilliseconds from '../test-helpers/time';

const prisma = new PrismaClient();

afterAll(async () => {
  const deleteReceipt = prisma.action_receipts.deleteMany();
  const deleteActionReceipt = prisma.receipts.deleteMany();

  await prisma.$transaction([deleteReceipt, deleteActionReceipt]);

  await prisma.$disconnect();
});

// eslint-disable-next-line max-lines-per-function
describe('test expiration date functions', () => {
  /**
   * Sally has 296 days of inactivity after issue date (2022-03-02).
   * moment column in query result should show end date of this period.
   * Certificate expired 296 - 180 = 116 days prior to moment.
   * moment: 2022-12-23T09:46:39+00:00
   * expiration date = 2022-12-23 - 116 days = 2022-08-29
   */
  describe('account with 180 day inactivity after issue date', () => {
    it('should return query result for sallysmith with first occurence of 180-day inactivity period', async () => {
      const queryResult = await getRawQueryResult('sallysmith.testnet', convertStringDateToMilliseconds('2021-03-02T00:00:00+00:00'));
      expect(queryResult).toEqual(
        expect.arrayContaining([
          {
            moment: '2021-12-23T09:46:39+00:00',
            diff_to_previous_activity: 296,
            has_long_period_of_inactivity: true,
          },
        ]),
      );
    });

    it('should return expiration date for sallysmith as last activity date - (diff_to_previous_activity - 180)', async () => {
      // expiration date = 2022-12-23 - 116 days = 2022-08-29
      await expect(getExpiration('sallysmith.testnet', convertStringDateToMilliseconds('2021-03-02T00:00:00+00:00'))).resolves.toEqual('2021-08-29');
    });
  });

  /**
   * John doesn't have 180-day inactivity period.
   * moment column in query result should show last activity date.
   * moment: 2022-03-25T16:09:06+00:00
   * last activity: 2022-03-25
   * expiration date = last activity date + 180 = 2022-03-25 + 180 days = 2022-09-21
   */
  describe('active account', () => {
    it('should return query result for johndoe', async () => {
      const queryResult = await getRawQueryResult('johndoe.testnet', convertStringDateToMilliseconds('2022-03-02T00:00:00+00:00'));
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

    it('should return expiration date as last activity date + 180 for account with no 180-day inactivity period', async () => {
      /**
       * last Activity: 2022-03-25
       * expiration date = 2022-03-25 + 180 days = 2022-09-21
       */
      await expect(getExpiration('johndoe.testnet', convertStringDateToMilliseconds('2022-03-02T00:00:00+00:00'))).resolves.toEqual('2022-09-21');
    });
  });

  /**
   * Bob has multiple inactivity periods exceeding 180 days and years of activity on his account.
   * We will test if we are getting correct results depending on various issue dates.
   */
  // eslint-disable-next-line max-lines-per-function
  describe('account with years of activity', () => {
    describe('issue date in between long period of inactivity', () => {
      /**
       * Bob's last long period of inactivity was on 2021/11/07
       * issue date as 2021-11-05 should skip this period and return
       * has_long_period_of_inactivity as false, because start of long period of inactivity started prior to issue date.
       * expiration date: last activity + 180 = 2022-03-04 + 180 = 2022-09-05
       */
      it('should return query result for bobwilson while no when no 180-days inactivity is present after issue date', async () => {
        const queryResult = await getRawQueryResult('bobwilson.testnet', convertStringDateToMilliseconds('2021-11-05T00:00:00+00:00'));
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2022-03-04T13:20:37+00:00',
              diff_to_previous_activity: null,
              has_long_period_of_inactivity: false,
            },
          ]),
        );
      });

      it('should return expiration date as last activity date + 180 for account with no 180-day inactivity period', async () => {
        /**
         * Bob does not have any 180-day inactivity after issue date.
         * last activity: 2022-03-25
         * expiration date = 2022-03-25 + 180 days = 2022-09-21
         */
        await expect(getExpiration('bobwilson.testnet', convertStringDateToMilliseconds('2021-11-05T00:00:00+00:00'))).resolves.toEqual('2022-08-31');
      });
    });
    describe('multiple periods of >180-day inactivity', () => {
      /**
       * Bob has 365 (on 2019-10-01) and 184 (on 2021/11/07) days of inactivity after issue date (2018-10-01).
       * Moment column in query result should show most recent inactivity period (2019-10-01).
       * Certificate expired 365 - 180 = 185 days prior to moment (2019-10-01).
       * moment: 2019-10-01T13:20:37+00:00
       * expiration date = 2019-10-01 - 185 days = 2019-03-30
       */
      it('should return query result for bobwilson when 180-days inactivity is present and moment should be the most recent date of such period', async () => {
        const queryResult = await getRawQueryResult('bobwilson.testnet', convertStringDateToMilliseconds('2018-10-01T00:00:00+00:00'));

        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2019-10-01T13:20:37+00:00',
              diff_to_previous_activity: 365,
              has_long_period_of_inactivity: true,
            },
          ]),
        );
      });

      it('should return expiration date as Last Activity Date + 180 for account with no 180-day inactivity period', async () => {
        // expiration date = last activity + 180 = 2022-03-04 + 180 = 2022-09-05
        await expect(getExpiration('bobwilson.testnet', convertStringDateToMilliseconds('2018-10-01T00:00:00+00:00'))).resolves.toEqual('2019-03-30');
      });
    });
  });
});
