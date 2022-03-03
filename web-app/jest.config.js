module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/prisma/test-setup/mock-client.ts'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      // set global config for ts-jest
    },
  },
};
