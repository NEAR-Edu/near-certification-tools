import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
// import { prismaMock } from '../prisma/test-helpers/mock-client';
import { getExpiration, getRawQueryResult } from '../../helpers/expiration-date';
import { convertStringDateToMilliseconds, isBeforeNow } from '../../helpers/time';

const prisma = new PrismaClient();

afterAll(async () => {
  const deleteReceipt = prisma.action_receipts.deleteMany();
  const deleteActionReceipt = prisma.receipts.deleteMany();

  await prisma.$transaction([deleteReceipt, deleteActionReceipt]);

  await prisma.$disconnect();
});

// eslint-disable-next-line max-lines-per-function
describe('test expiration date functions', () => {
  // eslint-disable-next-line max-lines-per-function
  describe('accounts with 180 day inactivity after issue date', () => {
    describe('account with 180 day inactivity and no frequent activity after issue date of certificate', () => {
      // -- Test Case 1 --
      // ACCOUNT: sally.testnet
      /**
       * Sally’s certificate was issued_at 2021-03-02T00:00:00+00:00,
       * She had no mainnet activitiy for 296 days.
       * Her last mainnet activity was on 2021-12-23T09:46:39+00:00
       * and she hasn’t been active since 2021-12-23T09:46:39+00:00.
       * --
       * Her cert has expired on
       * = 2021-03-02 + 180 days ( = 2021-12-23 - (296 - 180)days)
       * = 2021-08-29T09:46:39+00:00
       */
      const issueDate = convertStringDateToMilliseconds('2021-03-02T00:00:00+00:00');

      it('should return query result for sally with first occurence of 180-day inactivity period', async () => {
        const queryResult = await getRawQueryResult('sally.testnet', issueDate);
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2021-12-23T09:46:39+00:00', // moment column in query result should show end date of long inactivity period
              start_of_long_period_of_inactivity: '2021-03-02T12:35:46+00:00', // start date of long inactivity period
              diff_to_previous_activity: 296,
            },
          ]),
        );
      });

      it('should return expiration date for Sally as last activity date - (diff_to_previous_activity - 180)', async () => {
        /**
         * Certificate expired 296 - 180 = 116 days prior to moment.
         * expiration date = 2021-12-23 - 116 = 2021-03-02 + 180 days = 2022-08-29
         */
        await expect(getExpiration('sally.testnet', issueDate)).resolves.toEqual('2021-08-29T12:35:46+00:00');
      });
    });

    describe('account with 180 day inactivity and frequent activity after issue date of certificate', () => {
      // -- Test Case 2 --
      // ACCOUNT: steve.testnet
      /**
       * Steve's cert was issued_at 2021-01-05T11:15:09+00:00
       * He had frequent mainnet activity for a couple of months (2021-03-16T20:08:59+00:00)
       * but then no mainnet activity for 204 days (i.e. >180-days of inactivity)
       * and then had some more mainnet activity.
       * His last mainnet activity was on 2022-03-05T09:46:39+00:00
       * But none of that activity after his 180+ days of inactivity matters because his certificate should have expired 180 days after the
       * beginning of the first long period of inactivity (>=180 days).
       * --
       * His cert should have an expiration of: 2021-03-16 + 180 = 2021-09-12
       * Double-check from another angle: Certificate expired 204 - 180 = 24 days prior to moment.
       * So, expiration date = 2021-10-06 - 24 days = 2021-09-12 = 2021-03-16 + 180 days
       */

      const issueDate = convertStringDateToMilliseconds('2021-01-05T11:15:09+00:00');

      it('should return query result for Steve', async () => {
        const queryResult = await getRawQueryResult('steve.testnet', issueDate);
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2021-10-06T22:10:05+00:00', // moment column in query result should show end date of long inactivity period
              start_of_long_period_of_inactivity: '2021-03-16T20:08:59+00:00', // start date of long inactivity period
              diff_to_previous_activity: 204,
            },
          ]),
        );
      });

      it('should return correct expiration date for Steve', async () => {
        await expect(getExpiration('steve.testnet', issueDate)).resolves.toEqual('2021-09-12T20:08:59+00:00');
      });
    });
  });

  describe('accounts with frequent activity after issue date', () => {
    describe('account with frequent activity after issue date', () => {
      // -- Test Case 3 --
      // ACCOUNT: rebecca.testnet
      /**
       * Rebecca's cert was issued 2021-08-03T00:00:00+00:00
       * She has continued to have mainnet activity every couple of days through 2022-04-07T16:25:59+00:00
       * --
       * Her cert is tentatively scheduled to expire 2022-04-07T16:25:59+00:00 + 180 days.
       */

      const issueDate = convertStringDateToMilliseconds('2021-08-03T00:00:00+00:00');

      it('should return query result for Rebecca', async () => {
        const queryResult = await getRawQueryResult('rebecca.testnet', issueDate);
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2022-04-07T16:25:59+00:00',
              start_of_long_period_of_inactivity: null,
              diff_to_previous_activity: null,
            },
          ]),
        );
      });

      it('should return expiration date as last activity date + 180 for account with no 180-day inactivity period', async () => {
        /**
         * last Activity: 2022-04-07T16:25:59+00:00
         * expiration date = 2022-04-07T16:25:59+00:00 + 180 days = 2022-10-04
         */
        await expect(getExpiration('rebecca.testnet', issueDate)).resolves.toEqual('2022-10-04T16:25:59+00:00');
      });
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe('accounts with multiple 180 day inactivity after issue date of certificate', () => {
    describe('account with multiple 180 day inactivity and frequent activity after issue date of certificate', () => {
      // -- Test Case 4 --
      // ACCOUNT: bob.testnet
      /**
       * Bob's certificate was issued_at 2018-10-01T00:00:00+00:00, ==> issueDate
       * he has not had any mainnet activity for 365 days => >180-days of inactivity
       * then had frequent mainnet activity for a couple of years (through 2021-05-07T13:20:37+00:00)
       * then again no mainnet activity for 184 days => >180-days of inactivity
       * then, had frequent mainnet activity for a couple of months (through 2022-03-04T13:20:37+00:00)
       * His last mainnet activity was on 2022-03-04T13:20:37+00:00
       * --
       * His cert has expired on
       * = 2018-10-01 + 180 days (= 2019-10-01 - (365 - 180)days)
       * = 2019-03-30, during the FIRST inactivity period
       */

      const issueDate = convertStringDateToMilliseconds('2018-10-01T00:00:00+00:00');

      it('should return query result for bob when 180-days inactivity is present and moment should be the most recent date of such period', async () => {
        const queryResult = await getRawQueryResult('bob.testnet', issueDate);

        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2019-10-01T00:00:00+00:00', // moment column in query result should show end date of long inactivity period
              start_of_long_period_of_inactivity: '2018-10-01T00:00:00+00:00', // start date of long inactivity period
              diff_to_previous_activity: 365,
            },
          ]),
        );
      });

      it('should return expiration date for Bob as last activity date - (diff_to_previous_activity - 180)', async () => {
        await expect(getExpiration('bob.testnet', issueDate)).resolves.toEqual('2019-03-30T00:00:00+00:00');
      });
    });

    describe('account with multiple 180 day inactivity and frequent activity after issue date of certificate', () => {
      // -- Test Case 5 --
      // ACCOUNT: alice.testnet
      /**
       * Alice's cert was issued_at 2019-08-03T00:00:00+00:00
       * she has not had any mainnet activity for 214 days
       * then again no mainnet activity for 190 days
       * then again no mainnet activity for 182 days
       * and has not had any mainnet activity since then.
       * --
       * Her certficate expired on
       */

      const issueDate = convertStringDateToMilliseconds('2019-08-03T00:00:00+00:00');

      it('should return query result for Alice when 180-days inactivity is present and moment should be the most recent date of such period', async () => {
        const queryResult = await getRawQueryResult('alice.testnet', issueDate);

        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2020-03-04T08:25:59+00:00', // moment column in query result should show end date of long inactivity period
              start_of_long_period_of_inactivity: '2019-08-03T00:00:00+00:00', // start date of long inactivity period
              diff_to_previous_activity: 214,
            },
          ]),
        );
      });

      it('should return expiration date for Alice as last activity date - (diff_to_previous_activity - 180)', async () => {
        // expiration date = 2020-03-04 - 34 = 2019-08-03 + 180 days = 2020-01-30
        await expect(getExpiration('alice.testnet', issueDate)).resolves.toEqual('2020-01-30T00:00:00+00:00');
      });
    });
  });

  // TODO: WIP!
  describe('test the isBeforeNow function', () => {
    // -- Test Case 6 --
    // ACCOUNT: william.testnet
    /**
     * Williams's cert was issued 2019-08-03
     * He has not had any mainnet activity for 214 days
     * then again no mainnet activity for 190 days
     * then again no mainnet activity for 182 days
     * and has not had any mainnet activity since then.
     * --
     * Her certficate expired on
     */
    const issueDate = convertStringDateToMilliseconds(dayjs().subtract(180, 'day').subtract(6, 'hour').toISOString());

    it('isBeforeNow should return true', async () => {
      const expiration = await getExpiration('william.testnet', issueDate);
      console.log({ expiration });
      expect(isBeforeNow(expiration)).toBe(false);
    });
  });
});
