import type { Config } from 'jest';

const config: Config = {
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  preset: 'ts-jest',
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/__tests__/*.(spec|test).[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)',
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
  ],
};

export default config;
