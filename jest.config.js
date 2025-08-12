module.exports = {
    // The test environment that will be used for testing
    testEnvironment: 'env/test.env',

    // The glob patterns Jest uses to detect test files
    testMatch: [
        '**/__tests__/**/*.test.ts',
        '**/__tests__/**/*.spec.ts',
        '**/?(*.)+(spec|test).ts'
    ],

    // An array of file extensions your modules use
    moduleFileExtensions: ['ts', 'js', 'json'],

    // A map from regular expressions to paths to transformers
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },

    // The root directory that Jest should scan for tests and modules
    rootDir: '.',

    // Indicates whether the coverage information should be collected while executing the test
    collectCoverage: true,

    // An array of glob patterns indicating a set of files for which coverage information should be collected
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/__tests__/**/*.ts',
        '!src/**/index.ts'
    ],

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],

    // The glob patterns Jest uses to detect test files
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/coverage/'
    ],

    // A list of paths to modules that run some code to configure or set up the testing environment
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

    // The maximum amount of workers used to run your tests
    maxWorkers: '50%',

    // Indicates whether each individual test should be reported during the run
    verbose: true,

    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // The test timeout in milliseconds
    testTimeout: 10000
};