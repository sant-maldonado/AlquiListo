import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  testTimeout: 10000,
  maxWorkers: 1,
};
