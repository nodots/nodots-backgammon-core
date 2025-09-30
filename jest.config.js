module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  coverageDirectory: '../coverage',
  verbose: true,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/?(*.)+(test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@nodots-llc/backgammon-ai$': '<rootDir>/__mocks__/backgammonAiMock.ts',
  },
}
