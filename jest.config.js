module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './src',
  watch: true,
  verbose: true,
  collectCoverage: true,
  testMatch: ['**/?(*.)+(test).ts'],
  moduleFileExtensions: ['ts', 'ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}
