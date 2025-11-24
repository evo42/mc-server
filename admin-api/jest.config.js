// jest.config.js - Comprehensive test configuration for Minecraft SaaS Platform

module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'routes/**/*.js',
    '!services/datapacksService.js', // Exclude the original for now, use our updated version
    '!services/serversService.js',   // Exclude the original for now, use our updated version
    '!node_modules/',
    '!**/node_modules/**',
    '!coverage/',
    '!**/coverage/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
  ],
  verbose: true,
  collectCoverage: true,
  // Transform: we might need this if using special syntax
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // Module name mapper to handle imports if needed
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Test timeout (in ms) - increase if tests involve async operations
  testTimeout: 10000,
  // Slow test threshold (in ms) - warn if tests are slower than this
  slowTestThreshold: 5,
};