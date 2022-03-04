module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/prisma/test-helpers/mock-client.ts'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      // set global config for ts-jest
    },
  },
};
