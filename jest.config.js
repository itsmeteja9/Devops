module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!dist/**',
    '!.terraform/**',
    '!jest.config.js',
    '!server.js',
    '!public/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/.terraform/',
    '/public/',
  ],
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).js'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 70,
      lines: 75,
      statements: 75
    }
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        usePathAsTestSuite: true
      }
    ]
  ],
  testTimeout: 30000,
  verbose: true,
  maxWorkers: '50%',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'cobertura',
    'json'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
