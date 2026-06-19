module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Unit tests target pure logic in src/lib; transform RN packages as needed.
  testMatch: ['**/__tests__/**/*.test.ts'],
};
