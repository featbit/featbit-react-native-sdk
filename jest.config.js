/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
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
