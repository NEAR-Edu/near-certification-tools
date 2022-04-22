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
describe('Test expiration date functions', () => {
  // eslint-disable-next-line max-lines-per-function
  describe('Accounts with 180 day inactivity after issue date', () => {
    // -- Test Case 1 --
    // ACCOUNT: sally.testnet
    describe('Account with 180 day inactivity and no frequent activity after issue date of certificate', () => {
      /**
       * Sally’s certificate was issued_at 2021-03-02TT12:35:46+00:00,
       * She had no mainnet activitiy for 296 days (i.e. >180-days of inactivity)
       * Her last mainnet activity was on 2021-12-23T09:46:39+00:00
       * and she hasn’t been active since 2021-12-23T09:46:39+00:00
       * --
       * Her cert should have an expiration of:
       * = moment + 180 days
       * = 2021-03-02T12:35:46+00:00 + 180 days
       * = 2021-08-29T12:35:46+00:00
       */

      const issueDate = convertStringDateToMilliseconds('2021-03-02TT12:35:46+00:00');

      it('Should return query result for Sally when 180-days inactivity is present and moment should be start date of first occurance of such period', async () => {
        const queryResult = await getRawQueryResult('sally.testnet', issueDate);
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2021-03-02T12:35:46+00:00', // Start date of long inactivity period
              diff_to_next_activity: 296,
            },
          ]),
        );
      });

      it('Should return expiration date for Sally as moment + 180 days', async () => {
        /**
         * Certificate expired 180 days after moment (start date of *first* long inactivity period)
         * Expiration date = 2021-03-02T12:35:46+00:00 + 180 days = 2021-08-29T12:35:46+00:00
         */
        await expect(getExpiration('sally.testnet', issueDate)).resolves.toEqual('2021-08-29T12:35:46+00:00');
      });
    });

    // -- Test Case 2 --
    // ACCOUNT: patricia.testnet
    describe('Account with no activity after issue date', () => {
      /**
       * Patricia's cert was issued_at 2022-04-01T21:08:07+00:00,
       * She has not had any mainnet activity since then
       * --
       * Issuance of certificate does not show up as mainnet activity // TODO: Confirm with Ryan
       * Therefore, query returns an empty result
       * Her cert should have an expiration of:
       * = issue date + 180 days
       * = 2022-04-01T21:08:07+00:00 + 180 days
       * = 2022-09-28T21:08:07+00:00
       */

      const issueDate = convertStringDateToMilliseconds('2022-04-01T21:08:07+00:00');

      it('Should return empty query result for Patrica', async () => {
        const queryResult = await getRawQueryResult('sally.testnet', issueDate);

        // Since Patricia did not have any mainnet activity after issue date, query should return empty
        expect(queryResult).toEqual(expect.arrayContaining([]));
      });

      it('Should return expiration date for Patricia as issue date + 180 days', async () => {
        /**
         * With an empty query result, getExpiration should return expiration date as:
         * = issue date + 180 days = 2022-04-01T21:08:07+00:00 + 180 days = 2022-09-28T21:08:07+00:00
         */
        await expect(getExpiration('patricia.testnet', issueDate)).resolves.toEqual('2022-09-28T21:08:07+00:00');
      });
    });

    // -- Test Case 3 --
    // ACCOUNT: steve.testnet
    describe('Account with 180 day inactivity and frequent activity after issue date of certificate', () => {
      /**
       * Steve's cert was issued_at 2021-01-05T11:15:09+00:00
       * He had frequent mainnet activity for a couple of months (through 2021-03-16T20:08:59+00:00)
       * but then no mainnet activity for 204 days (i.e. >180-days of inactivity)
       * and then had some more mainnet activity.
       * His last mainnet activity was on 2022-03-05T09:46:39+00:00
       * But none of that activity after his 180+ days of inactivity matters because his certificate should have expired 180 days after the
       * beginning of the *first* long period of inactivity (>=180 days).
       * --
       * His cert should have an expiration of:
       * = moment + 180 days
       * = 2021-03-16T20:08:59+00:00 + 180 days
       * = 2021-09-12T20:08:59+00:00
       */

      const issueDate = convertStringDateToMilliseconds('2021-01-05T11:15:09+00:00');

      it('Should return query result for Steve when 180-days inactivity is present and moment should be start date of first occurance of such period', async () => {
        const queryResult = await getRawQueryResult('steve.testnet', issueDate);
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2021-03-16T20:08:59+00:00', // Start date of long inactivity period
              diff_to_next_activity: 204,
            },
          ]),
        );
      });

      it('Should return correct expiration date for Steve', async () => {
        /**
         * Certificate expired 180 after moment (start date of *first* long inactivity period)
         * Expiration date = 2021-03-16T20:08:59+00:00 + 180 days = 2021-09-12T20:08:59+00:00
         */
        await expect(getExpiration('steve.testnet', issueDate)).resolves.toEqual('2021-09-12T20:08:59+00:00');
      });
    });

    // -- Test Case 4 --
    // ACCOUNT: bob.testnet
    describe('Account with multiple 180 day inactivity and frequent activity after issue date of certificate', () => {
      /**
       * Bob's certificate was issued_at 2018-10-01T00:00:00+00:00,
       * he has not had any mainnet activity for 365 days (i.e. >180-days of inactivity)
       * then had frequent mainnet activity for a couple of years (through 2021-05-07T13:20:37+00:00)
       * then again no mainnet activity for 184 days
       * then, had frequent mainnet activity for a couple of months (through 2022-03-04T13:20:37+00:00)
       * His last mainnet activity was on 2022-03-04T13:20:37+00:00
       * --
       * His cert should have an expiration of:
       * = moment + 180 days
       * = 2018-10-01T00:00:00+00:00 + 180 days
       * = 2018-10-01T00:00:00+00:00
       */

      const issueDate = convertStringDateToMilliseconds('2018-10-01T00:00:00+00:00');

      it('Should return query result for Bob when 180-days inactivity is present and moment should be start date of first occurance of such period', async () => {
        const queryResult = await getRawQueryResult('bob.testnet', issueDate);

        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2018-10-01T00:00:00+00:00', // Start date of long inactivity period
              diff_to_next_activity: 365,
            },
          ]),
        );
      });

      it('Should return expiration date for Bob as moment + 180 days', async () => {
        /**
         * Certificate expired 180 after moment (start date of *first* long inactivity period)
         * Expiration date = 2018-10-01T00:00:00+00:00 + 180 days = 2019-03-30T00:00:00+00:00
         */
        await expect(getExpiration('bob.testnet', issueDate)).resolves.toEqual('2019-03-30T00:00:00+00:00');
      });
    });

    // -- Test Case 5 --
    // ACCOUNT: alice.testnet
    describe('Account with multiple 180 day inactivity and frequent activity after issue date of certificate', () => {
      /**
       * Alice's cert was issued_at 2019-08-03T00:00:00+00:00
       * she has not had any mainnet activity for 214 days (i.e. >180-days of inactivity)
       * then again no mainnet activity for 190 days
       * then again no mainnet activity for 182 days
       * and has not had any mainnet activity since then.
       * --
       * Her cert should have an expiration of:
       * = moment + 180 days
       * = 2019-08-03T00:00:00+00:00 + 180 days
       * = 2020-01-30T00:00:00+00:00
       */

      const issueDate = convertStringDateToMilliseconds('2019-08-03T00:00:00+00:00');

      it('Should return query result for Alice when 180-days inactivity is present and moment should be start date of first occurance of such period', async () => {
        const queryResult = await getRawQueryResult('alice.testnet', issueDate);

        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2019-08-03T00:00:00+00:00', // Start date of long inactivity period
              diff_to_next_activity: 214,
            },
          ]),
        );
      });

      it('should return expiration date for Alice as moment + 180 days', async () => {
        /**
         * Certificate expired 180 after moment (start date of *first* long inactivity period)
         * Expiration date = 2019-08-03T00:00:00+00:00 + 180 days = 2020-01-30T00:00:00+00:00
         */
        await expect(getExpiration('alice.testnet', issueDate)).resolves.toEqual('2020-01-30T00:00:00+00:00');
      });
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe('Accounts with frequent activity and no 180 day inactivity after issue date', () => {
    // -- Test Case 6 --
    // ACCOUNT: rebecca.testnet
    describe('Account with frequent activity after issue date (every couple of days)', () => {
      /**
       * Rebecca's cert was issued_at 2021-08-03T00:00:00+00:00
       * She has continued to have mainnet activity every couple of days through 2022-04-07T16:25:59+00:00
       * --
       * Her cert should have an expiration of:
       * = moment (most recent activity) + 180 days
       * = 2022-04-07T16:25:59+00:00 + 180 days
       * = 2022-10-04T16:25:59+00:00
       */

      const issueDate = convertStringDateToMilliseconds('2021-08-03T00:00:00+00:00');

      it('should return query result for Rebecca', async () => {
        const queryResult = await getRawQueryResult('rebecca.testnet', issueDate);
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2022-04-07T16:25:59+00:00', // Most recent activity
              diff_to_next_activity: null,
            },
          ]),
        );
      });

      it('should return expiration date as last activity date + 180 for account with no 180-day inactivity period', async () => {
        /**
         * Certificate expired 180 after moment (last activity)
         * Expiration date = 2022-04-07T16:25:59+00:00 + 180 days = 2022-10-04T16:25:59+00:00
         */
        await expect(getExpiration('rebecca.testnet', issueDate)).resolves.toEqual('2022-10-04T16:25:59+00:00');
      });
    });

    // -- Test Case 7 --
    // ACCOUNT: jennifer.testnet
    describe('Account with frequent activity after issue date every couple of minutes', () => {
      /**
       * Jennifer's cert was issued_at 2022-04-06T01:00:00+00:00
       * She has continued to have mainnet activity every couple of minutes through 2022-04-06T10:10:00+00:00
       * --
       * Her cert should have an expiration of:
       * = moment (most recent activity) + 180 days
       * = 2022-04-06T10:10:00+00:00 + 180 days
       * = 2022-10-03T10:10:00+00:00
       */

      const issueDate = convertStringDateToMilliseconds('2022-04-06T01:00:00+00:00');

      it('should return query result for Jennifer', async () => {
        const queryResult = await getRawQueryResult('jennifer.testnet', issueDate);
        expect(queryResult).toEqual(
          expect.arrayContaining([
            {
              moment: '2022-04-06T10:10:00+00:00', // Most recent activity
              diff_to_next_activity: null,
            },
          ]),
        );
      });

      it('jennifer', async () => {
        /**
         * Certificate expired 180 after moment (last activity)
         * Expiration date = 2022-04-06T10:10:00+00:00 + 180 days = 2022-10-03T10:10:00+00:00
         */
        await expect(getExpiration('jennifer.testnet', issueDate)).resolves.toEqual('2022-10-03T10:10:00+00:00');
      });
    });
  });
});

/**
 * The isBeforeNow function checks whether the expiration date is before the present moment or not
 * If expiration is before the present moment, certificate has expired;
 * If expiration is not before the present moment, certificate has not expired yet.
 */
describe('Test the isBeforeNow function', () => {
  // -- Test Case 8 --
  // ACCOUNT: william.testnet
  describe('Account which expiration date falls 1 hour before present moment (now)', () => {
    /**
     * Williams's cert was issued_at 180 days and 2 hours prior to now (present moment)
     * He had activity 1 hour after the issue date
     * he has not had any mainnet activity since
     * --
     * His cert should have an expiration of:
     * moment + 180 days
     * So, expiration date
     * = (present moment - 180 days - 2 hours + 1 hour) + 180 days
     * = present moment - 1 hour
     * --
     * isBeforeNow function should return true
     */

    const issueDate = convertStringDateToMilliseconds(dayjs.utc().subtract(180, 'day').subtract(2, 'hour').format('YYYY-MM-DDTHH:mm:ss+00:00'));

    it('isBeforeNow should return true for william.testnet', async () => {
      const expiration = await getExpiration('william.testnet', issueDate);
      // Expiration date is one hour before now
      // isBeforeNow should return true
      expect(isBeforeNow(expiration)).toBe(true);
    });
  });

  // -- Test Case 9 --
  // ACCOUNT: john.testnet
  describe('Account which expiration date falls 1 hour after present moment (now)', () => {
    /**
     * John's cert was issued_at 180 days prior to now (present moment)
     * He had activity 1 hour after the issue date
     * he has not had any mainnet activity since
     * --
     * His cert should have an expiration of:
     * moment + 180 days
     * So, expiration date
     * = (present moment - 180 days  + 1 hour) + 180 days
     * = present moment + 1 hour
     * --
     * isBeforeNow function should return false
     */

    const issueDate = convertStringDateToMilliseconds(dayjs.utc().subtract(180, 'day').format('YYYY-MM-DDTHH:mm:ss+00:00'));

    it('isBeforeNow should return false for john.testnet', async () => {
      const expiration = await getExpiration('john.testnet', issueDate);
      /**
       * Expiration date is one hour after now
       * isBeforeNow should return false
       */
      expect(isBeforeNow(expiration)).toBe(false);
    });
  });
});
