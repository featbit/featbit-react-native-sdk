/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/e2e/**/*.e2e.test.ts'],
  setupFiles: ['<rootDir>/e2e/setup.ts'],
  // The SDK imports `react-native`; in Node we swap in a controllable mock so the e2e can
  // drive real AppState transitions and provide Platform info.
  moduleNameMapper: {
    '^react-native$': '<rootDir>/e2e/mocks/react-native.ts',
    // The real async-storage loads but needs a RN/browser env (throws `window is not defined`
    // under Node), so swap in an in-memory implementation for the e2e.
    '^@react-native-async-storage/async-storage$': '<rootDir>/e2e/mocks/async-storage.ts',
  },
  testTimeout: 600_000,
  // The @featbit SDK packages ship ESM only, so they must be transformed (down-levelled to
  // CJS) rather than ignored like the rest of node_modules.
  transformIgnorePatterns: ['/node_modules/(?!(@featbit)/)'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: {
          module: 'commonjs',
          esModuleInterop: true,
          allowJs: true,
          types: ['node', 'jest'],
          strict: false,
          noImplicitOverride: false,
        },
      },
    ],
  },
};
