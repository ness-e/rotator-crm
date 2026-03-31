/**
 * @file jest.config.js
 * @description Configuration file for Jest testing framework.
 * 
 * Organized into:
 * - INTEGRATION: Tests for API endpoints and routes
 * - UNIT/SERVICES: Business logic tests
 * - VALIDATION: Zod schema tests
 */

const baseConfig = {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};

export default {
  ...baseConfig,
  verbose: true,
  projects: [
    {
      ...baseConfig,
      displayName: 'INTEGRATION',
      testMatch: [
        '<rootDir>/__tests__/integration/**/*.test.js',
        '<rootDir>/__tests__/routes/**/*.test.js'
      ],
    },
    {
      ...baseConfig,
      displayName: 'SERVICES/LOGIC',
      testMatch: ['<rootDir>/__tests__/services/**/*.test.js'],
    },
    {
      ...baseConfig,
      displayName: 'VALIDATORS',
      testMatch: ['<rootDir>/__tests__/validation/**/*.test.js'],
    }
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}
 