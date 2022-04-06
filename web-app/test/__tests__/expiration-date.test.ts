import { PrismaClient } from '@prisma/client';
// import { prismaMock } from '../prisma/test-helpers/mock-client';
import { getExpiration, getRawQueryResult } from '../../helpers/expiration-date';
import { convertStringDateToMilliseconds } from '../../helpers/time';

const prisma = new PrismaClient();

afterAll(async () => {
  const deleteReceipt = prisma.action_receipts.deleteMany();
  const deleteActionReceipt = prisma.receipts.deleteMany();

  await prisma.$transaction([deleteReceipt, deleteActionReceipt]);

  await prisma.$disconnect();
});

// TODO: Complete cases
/**
 * Patricia's cert was issued 2022-04-01,  — issueDate
 * she has not had any mainnet activity since then.
 * --
 * her cert is tentatively scheduled to expire 2022-04-01 + 180.
 */

/**
 * Steven's cert was issued 2021-08-03
 * he has continued to have mainnet activity every couple of days through 05-04-2022
 * --
 * His cert is tentatively scheduled to expire  05-04-2022  + 180.
 */

/**
 * Alice's cert was issued 2019-08-03
 * she has not had any mainnet activity for 214 days
 * then again no mainnet activity for 190 days
 * then again no mainnet activity for 182 days
 * and has not had any mainnet activity since then.
 * --
 * Her certficate expired on
 */

/**
 * William's cert was issued 2022-04-06T01:00:00+00:00
 * he has continued to have mainnet activity every couple of minutes through 06-04-2022T00:10:00+00:00
 * --
 * His cert is tentatively scheduled to expire  06-04-2022  + 180.
 */
// TODO: -end

// eslint-disable-next-line max-lines-per-function
describe('test expiration date functions', () => {
  // -- Test Case -1 --
  // eslint-disable-next-line max-lines-per-function
  describe('accounts with 180 day inactivity after issue date', () => {
    /**
     * Sally’s certificate was issued_at 2021-03-02T00:00:00+00:00, ==> issueDate
     * She had no mainnet activitiy for 296 days. ==> >180-days of inactivity
     * Her last mainnet activity was on 2021-12-23T09:46:39+00:00 ==> moment
     * and she hasn’t been active since 2021-12-23T09:46:39+00:00.
     * --
     * Her cert has expired on
     * = 2021-03-02 + 180 days ( = 2021-12-23 - (296 - 180)days)
     * = 2021-08-29
     */
    describe('account with 180 day inactivity after issue date and no frequent activity after issue date of certificate', () => {
      it('should return query result for sally with first occurence of 180-day inactivity period', async () => {
        const queryResult = await getRawQueryResult('sally.testnet', convertStringDateToMilliseconds('2021-03-02T00:00:00+00:00'));
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2021-12-23T09:46:39+00:00', // moment column in query result should show end date of long inactivity period (2021-12-23T09:46:39+00:00)
              diff_to_previous_activity: 296,
              has_long_period_of_inactivity: true,
            },
          ]),
        );
      });

      it('should return expiration date for sally as last activity date - (diff_to_previous_activity - 180)', async () => {
        /**
         * Certificate expired 296 - 180 = 116 days prior to moment.
         * expiration date = 2021-12-23 - 116 = 2021-03-02 + 180 days = 2022-08-29
         */
        await expect(getExpiration('sally.testnet', convertStringDateToMilliseconds('2021-03-02T00:00:00+00:00'))).resolves.toEqual('2021-08-29');
      });
    });

    /**
     * Steve's cert was issued_at 2021-01-05 — issueDate
     * he had frequent mainnet activity for a couple of months (2021-03-16T20:08:59+00:00)
     * but then no mainnet activity for 204 days — >180-days of inactivity
     * and then had some more mainnet activity.
     * His last mainnet activity was on 2022—03—0509:46:39+00:00
     * --
     * His cert has expired on
     * = 2021-03-15 + 180 ( = 2021-10-06 - (204 - 180) days)
     */
    describe('account with 180 day inactivity and frequent activity after issue date of certificate', () => {
      it('should return query result for steve', async () => {
        const queryResult = await getRawQueryResult('steve.testnet', convertStringDateToMilliseconds('2021-01-05T11:15:09+00:00'));
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2021-10-06T22:10:05+00:00',
              diff_to_previous_activity: 204,
              has_long_period_of_inactivity: true,
            },
          ]),
        );
      });

      it('should return expiration date as last activity date + 180 for account with no 180-day inactivity period', async () => {
        /**
         * Certificate expired 204 - 180 = 24 days prior to moment.
         * expiration date = 2021-10-06 - 24 days = 2021-03-16 + 180 days = 2021-09-13
         */
        await expect(getExpiration('steve.testnet', convertStringDateToMilliseconds('2021-03-15T11:15:09+00:00'))).resolves.toEqual('2021-09-13');
      });
    });
  });

  /**
   * John's certificate was issued_at 2022-03-02T00:00:00+00:00, ==> issueDate
   * He has frequent mainnet activity since the issue date
   * His last mainnet activity was on 2021-04-05T09:46:39+00:00 ==> moment
   * --
   * His cert is tentatively scheduled to expire 2022-04-05 + 180 days
   * = 2022-10-02
   */
  describe('accounts with frequent activity after issue date', () => {
    it('should return query result for john', async () => {
      const queryResult = await getRawQueryResult('john.testnet', convertStringDateToMilliseconds('2022-03-02T00:00:00+00:00'));
      expect(queryResult).toEqual(
        expect.arrayContaining([
          {
            moment: '2022-04-05T17:24:06+00:00',
            diff_to_previous_activity: null,
            has_long_period_of_inactivity: false,
          },
        ]),
      );
    });

    it('should return expiration date as last activity date + 180 for account with no 180-day inactivity period', async () => {
      /**
       * last Activity: 2022-04-05
       * expiration date = 2022-04-05 + 180 days = 2022-10-02
       */
      await expect(getExpiration('john.testnet', convertStringDateToMilliseconds('2022-03-02T00:00:00+00:00'))).resolves.toEqual('2022-10-02');
    });
  });

  /**
   * Bob's certificate was issued_at 2018-10-01T00:00:00+00:00, ==> issueDate
   * he has not had any mainnet activity for 365 days => >180-days of inactivity
   * then had frequent mainnet activity for a couple of years (through 2021-05-07T13:20:37+00:00)
   * but then again no mainnet activity for 184 days => >180-days of inactivity
   * then had frequent mainnet activity for a couple of months (through 2022-03-04T13:20:37+00:00)
   * His last mainnet activity was on 2022-03-04T13:20:37+00:00
   * --
   * His cert has expired on
   * = 2018-10-01 + 180 days (= 2019-10-01 - (365 - 180)days)
   * = 2019-03-30, during the FIRST inactivity period
   */
  // eslint-disable-next-line max-lines-per-function
  describe('accounts with multiple 180 day inactivity after issue date', () => {
    describe('account with multiple 180 day inactivity after issue date and frequent activity after issue date of certificate', () => {
      /**
       * Certificate expired 365 - 180 = 185 days prior to moment (2019-10-01).
       * expiration date = 2019-10-01 - 185 = 2018-10-01 + 180 days = 2019-03-30
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

    describe('account with multiple 180 day inactivity after issue date and frequent activity after issue date of certificate', () => {
      /**
       * Certificate expired 365 - 180 = 185 days prior to moment (2019-10-01).
       * expiration date = 2019-10-01 - 185 = 2018-10-01 + 180 days = 2019-03-30
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
