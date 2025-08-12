// Jest setup file for the Election Campaign Messaging System
// This file runs before each test file

import { CampaignStatus, MessageType, MessageStatus, ContactMethod, ContactStatus } from '../types';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

// Global test timeout
jest.setTimeout(10000);

// Global test utilities
global.console = {
    ...console,
    // Uncomment to suppress console.log during tests
    // log: jest.fn(),
    // debug: jest.fn(),
    // info: jest.fn(),
    // warn: jest.fn(),
    // error: jest.fn(),
};

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});

// Global test data helpers
export const createMockCampaign = (overrides = {}) => ({
    id: 'test-campaign-id',
    name: 'Test Campaign',
    description: 'A test campaign for unit testing',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: CampaignStatus.DRAFT,
    targetAudience: ['voters-18-25', 'voters-26-35'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});

export const createMockMessage = (overrides = {}) => ({
    id: 'test-message-id',
    campaignId: 'test-campaign-id',
    title: 'Test Message',
    content: 'This is a test message content',
    type: MessageType.EMAIL,
    status: MessageStatus.DRAFT,
    targetAudience: ['voters-18-25'],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});

export const createMockVoter = (overrides = {}) => ({
    id: 'test-voter-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Test St, Test City, TC 12345',
    votingPreference: 'undecided',
    demographics: {
        age: 25,
        gender: 'male',
        ethnicity: 'caucasian',
        education: 'bachelor',
        income: '50000-75000',
        location: 'Test City'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});

export const createMockVoterContact = (overrides = {}) => ({
    id: 'test-contact-id',
    voterId: 'test-voter-id',
    campaignId: 'test-campaign-id',
    messageId: 'test-message-id',
    contactMethod: ContactMethod.EMAIL,
    status: ContactStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});

// Mock Express request and response objects
export const createMockRequest = (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides
});

export const createMockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
};

// Mock Express NextFunction
export const createMockNext = () => jest.fn();

// Test database connection mock (for future use)
export const mockDatabaseConnection = {
    query: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    transaction: jest.fn()
};

// Test logger mock (for future use)
export const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
}; 