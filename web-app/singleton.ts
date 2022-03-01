/**
 * The singleton file tells Jest to mock a default export (the Prisma client
 * instantiated in ./client.ts), and uses the mockDeep method from
 * jest-mock-extended to enable access to the objects and methods available on
 * the Prisma client. It then resets the mocked instance before each test is run.
 */
// https://www.prisma.io/docs/guides/testing/unit-testing#:~:text=extended%20version%20%5E2.0.4.-,Singleton,-The%20following%20steps
import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import prisma from './client';

jest.mock('./client', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  mockReset(prismaMock);
});

// eslint-disable-next-line import/prefer-default-export
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
