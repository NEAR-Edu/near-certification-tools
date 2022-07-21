import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import client from './client';

jest.mock('./client', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  mockReset(prismaMock);
});

// eslint-disable-next-line import/prefer-default-export
export const prismaMock = client as unknown as DeepMockProxy<PrismaClient>;
