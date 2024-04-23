/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from 'jest';

const config: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",
  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Transform settings if you have custom needs, but this is optional since ts-jest is preset
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  // Module file extensions for importing
  moduleFileExtensions: ['ts', 'js', 'json', 'node','test.ts', 'static.test.ts'],
};

export default config;
