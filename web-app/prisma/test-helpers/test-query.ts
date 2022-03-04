// import { Prisma } from '@prisma/client';
import prisma from '../../helpers/prisma';

// eslint-disable-next-line max-lines-per-function
export default function testQuery() {
  const result = prisma.$queryRaw`
    SELECT *
    FROM PUBLIC.receipts
    `;
  return result;
}
