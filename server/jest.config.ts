/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],  // adjust to your test folder & naming
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  };
  