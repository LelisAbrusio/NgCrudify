/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jest-environment-jsdom',

  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: 'tsconfig.spec.json',
        stringifyContentPathRegex: '\\.html$',
        // IMPORTANT: let ts-jest instrument code (no "transpilation: true")
      }
    ]
  },

  // (optional) helps with modern node; works well with ts-jest
  coverageProvider: 'v8',

  setupFilesAfterEnv: ['<rootDir>/src/jest-setup.ts'],
  moduleFileExtensions: ['ts','html','js','mjs','json'],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text-summary'],

  // ✅ Only TS files; exclude specs and boot files so something actually matches
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/environments/**'
  ],
};
