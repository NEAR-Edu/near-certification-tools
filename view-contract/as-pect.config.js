module.exports = {
  ...require('near-sdk-as/imports'),
  include: ['src/__tests__/**/*.spec.ts'],
  add: ['src/__tests__/**/*.include.ts'],
};
