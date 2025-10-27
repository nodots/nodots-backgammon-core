const collectCoverage = process.env.COVERAGE === '1'

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  coverageDirectory: '../coverage',
  verbose: false,
  collectCoverage,
  coverageReporters: ['text', 'lcov'],
  testMatch: ['**/?(*.)+(test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
        diagnostics: false,
        isolatedModules: true,
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@nodots-llc/backgammon-ai$': '<rootDir>/__mocks__/backgammonAiMock.ts',
    '^@nodots-llc/backgammon-types$': '<rootDir>/../../types/src/index.ts',
  },
}
