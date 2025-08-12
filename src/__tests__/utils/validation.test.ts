import {
    validateCampaign,
    validateMessage,
    validateVoter,
    canActivateCampaign,
    canSendMessage,
    calculateCampaignDuration,
    formatDate
} from '../../utils/validation';
import {
    createMockCampaign,
    createMockMessage,
    createMockVoter
} from '../setup';
import { CampaignStatus, MessageStatus } from '../../types';

describe('Validation Utils', () => {
    describe('validateCampaign', () => {
        it('should validate a valid campaign', () => {
            const campaign = createMockCampaign({
                startDate: new Date(Date.now() + 86400000), // Tomorrow
                endDate: new Date(Date.now() + 172800000)   // Day after tomorrow
            });
            const result = validateCampaign(campaign);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect missing campaign name', () => {
            const campaign = createMockCampaign({ name: '' });
            const result = validateCampaign(campaign);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Campaign name is required');
        });

        it('should detect missing campaign description', () => {
            const campaign = createMockCampaign({ description: '' });
            const result = validateCampaign(campaign);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Campaign description is required');
        });

        it('should detect invalid date range', () => {
            const campaign = createMockCampaign({
                startDate: new Date('2024-12-31'),
                endDate: new Date('2024-01-01')
            });
            const result = validateCampaign(campaign);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Start date must be before end date');
        });

        it('should detect past start date', () => {
            const campaign = createMockCampaign({
                startDate: new Date('2020-01-01')
            });
            const result = validateCampaign(campaign);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Start date cannot be in the past');
        });

        it('should detect missing target audience', () => {
            const campaign = createMockCampaign({ targetAudience: [] });
            const result = validateCampaign(campaign);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Target audience is required');
        });
    });

    describe('validateMessage', () => {
        it('should validate a valid message', () => {
            const message = createMockMessage();
            const result = validateMessage(message);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect missing message title', () => {
            const message = createMockMessage({ title: '' });
            const result = validateMessage(message);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Message title is required');
        });

        it('should detect missing message content', () => {
            const message = createMockMessage({ content: '' });
            const result = validateMessage(message);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Message content is required');
        });

        it('should detect missing campaign ID', () => {
            const message = createMockMessage({ campaignId: '' });
            const result = validateMessage(message);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Campaign ID is required');
        });

        it('should detect past scheduled date', () => {
            const message = createMockMessage({
                scheduledDate: new Date('2020-01-01')
            });
            const result = validateMessage(message);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Scheduled date cannot be in the past');
        });

        it('should detect missing target audience', () => {
            const message = createMockMessage({ targetAudience: [] });
            const result = validateMessage(message);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Target audience is required');
        });
    });

    describe('validateVoter', () => {
        it('should validate a valid voter', () => {
            const voter = createMockVoter();
            const result = validateVoter(voter);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect missing first name', () => {
            const voter = createMockVoter({ firstName: '' });
            const result = validateVoter(voter);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('First name is required');
        });

        it('should detect missing last name', () => {
            const voter = createMockVoter({ lastName: '' });
            const result = validateVoter(voter);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Last name is required');
        });

        it('should detect invalid email format', () => {
            const voter = createMockVoter({ email: 'invalid-email' });
            const result = validateVoter(voter);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid email format');
        });

        it('should accept valid email format', () => {
            const voter = createMockVoter({ email: 'valid@email.com' });
            const result = validateVoter(voter);

            expect(result.isValid).toBe(true);
        });

        it('should detect invalid phone format', () => {
            const voter = createMockVoter({ phone: 'invalid-phone' });
            const result = validateVoter(voter);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid phone format');
        });

        it('should accept valid phone format', () => {
            const voter = createMockVoter({ phone: '+1234567890' });
            const result = validateVoter(voter);

            expect(result.isValid).toBe(true);
        });

        it('should detect invalid age', () => {
            const voter = createMockVoter({
                demographics: { ...createMockVoter().demographics, age: 15 }
            });
            const result = validateVoter(voter);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Age must be between 18 and 120');
        });

        it('should detect missing location', () => {
            const voter = createMockVoter({
                demographics: { ...createMockVoter().demographics, location: '' }
            });
            const result = validateVoter(voter);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Location is required');
        });
    });

    describe('canActivateCampaign', () => {
        it('should return true for valid draft campaign', () => {
            const campaign = createMockCampaign({
                status: CampaignStatus.DRAFT,
                startDate: new Date(Date.now() + 86400000), // Tomorrow
                endDate: new Date(Date.now() + 172800000)   // Day after tomorrow
            });
            const result = canActivateCampaign(campaign);

            expect(result).toBe(true);
        });

        it('should return false for non-draft campaign', () => {
            const campaign = createMockCampaign({ status: CampaignStatus.ACTIVE });
            const result = canActivateCampaign(campaign);

            expect(result).toBe(false);
        });

        it('should return false for invalid campaign', () => {
            const campaign = createMockCampaign({ name: '' });
            const result = canActivateCampaign(campaign);

            expect(result).toBe(false);
        });
    });

    describe('canSendMessage', () => {
        it('should return true for valid scheduled message', () => {
            const message = createMockMessage({
                status: MessageStatus.SCHEDULED,
                scheduledDate: new Date(Date.now() - 1000) // 1 second ago (past)
            });

            // Debug: Check the message object
            expect(message.status).toBe(MessageStatus.SCHEDULED);
            expect((message as any).scheduledDate).toBeDefined();
            expect((message as any).scheduledDate).toBeInstanceOf(Date);

            const result = canSendMessage(message);
            expect(result).toBe(true);
        });

        it('should return false for non-scheduled message', () => {
            const message = createMockMessage({ status: MessageStatus.DRAFT });
            const result = canSendMessage(message);

            expect(result).toBe(false);
        });

        it('should return false for future scheduled message', () => {
            const message = createMockMessage({
                status: MessageStatus.SCHEDULED,
                scheduledDate: new Date(Date.now() + 86400000) // Tomorrow
            });
            const result = canSendMessage(message);

            expect(result).toBe(false);
        });

        it('should return false for invalid message', () => {
            const message = createMockMessage({ title: '' });
            const result = canSendMessage(message);

            expect(result).toBe(false);
        });
    });

    describe('calculateCampaignDuration', () => {
        it('should calculate correct duration for 30-day campaign', () => {
            const campaign = createMockCampaign({
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            const duration = calculateCampaignDuration(campaign);

            expect(duration).toBe(30);
        });

        it('should calculate correct duration for 1-day campaign', () => {
            const campaign = createMockCampaign({
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-01')
            });
            const duration = calculateCampaignDuration(campaign);

            expect(duration).toBe(0);
        });
    });

    describe('formatDate', () => {
        it('should format date correctly', () => {
            const date = new Date('2024-01-15');
            const formatted = formatDate(date);

            expect(formatted).toMatch(/January 15, 2024/);
        });

        it('should handle different dates', () => {
            const date = new Date('2024-12-25');
            const formatted = formatDate(date);

            expect(formatted).toMatch(/December 25, 2024/);
        });
    });
}); 