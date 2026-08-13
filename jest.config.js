/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  // @featbit/react-client-sdk ships ESM-only (no CJS build), which Jest's
  // default CJS module system can't require() directly. It publishes its
  // TypeScript source alongside dist though, so map the package to that —
  // ts-jest (already configured below) transforms it like any other .ts file.
  moduleNameMapper: {
    '^@featbit/react-client-sdk$': '<rootDir>/node_modules/@featbit/react-client-sdk/src/index.ts',
  },
  // The mapped path above still lives under node_modules, so it needs an
  // explicit carve-out from Jest's default "never transform node_modules" rule.
  transformIgnorePatterns: ['/node_modules/(?!@featbit/react-client-sdk)'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          esModuleInterop: true,
          jsx: 'react-jsx',
          types: ['node', 'jest'],
          // tests deliberately use partial mocks of SDK/RN shapes
          strict: false,
          noImplicitOverride: false,
        },
      },
    ],
  },
};
