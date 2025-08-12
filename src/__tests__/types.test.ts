import {
    Campaign,
    Message,
    Voter,
    VoterContact,
    CampaignStatus,
    MessageType,
    MessageStatus,
    ContactMethod,
    ContactStatus,
    ApiResponse,
    PaginatedResponse
} from '../types';
import {
    createMockCampaign,
    createMockMessage,
    createMockVoter,
    createMockVoterContact
} from './setup';

describe('Type Definitions', () => {
    describe('Campaign Interface', () => {
        it('should create a valid campaign object', () => {
            const campaign: Campaign = createMockCampaign();

            expect(campaign.id).toBe('test-campaign-id');
            expect(campaign.name).toBe('Test Campaign');
            expect(campaign.status).toBe('draft');
            expect(campaign.targetAudience).toHaveLength(2);
            expect(campaign.createdAt).toBeInstanceOf(Date);
            expect(campaign.updatedAt).toBeInstanceOf(Date);
        });

        it('should allow campaign status updates', () => {
            const campaign: Campaign = createMockCampaign({
                status: CampaignStatus.ACTIVE
            });

            expect(campaign.status).toBe(CampaignStatus.ACTIVE);
        });

        it('should validate campaign dates', () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const campaign: Campaign = createMockCampaign({
                startDate,
                endDate
            });

            expect(campaign.startDate).toBe(startDate);
            expect(campaign.endDate).toBe(endDate);
            expect(campaign.startDate.getTime()).toBeLessThan(campaign.endDate.getTime());
        });
    });

    describe('Message Interface', () => {
        it('should create a valid message object', () => {
            const message: Message = createMockMessage();

            expect(message.id).toBe('test-message-id');
            expect(message.campaignId).toBe('test-campaign-id');
            expect(message.title).toBe('Test Message');
            expect(message.type).toBe(MessageType.EMAIL);
            expect(message.status).toBe(MessageStatus.DRAFT);
        });

        it('should support different message types', () => {
            const smsMessage: Message = createMockMessage({
                type: MessageType.SMS,
                status: MessageStatus.SCHEDULED
            });

            expect(smsMessage.type).toBe(MessageType.SMS);
            expect(smsMessage.status).toBe(MessageStatus.SCHEDULED);
        });

        it('should handle optional scheduled date', () => {
            const scheduledDate = new Date('2024-06-01T10:00:00Z');
            const message: Message = createMockMessage({
                scheduledDate,
                status: MessageStatus.SCHEDULED
            });

            expect(message.scheduledDate).toBe(scheduledDate);
        });
    });

    describe('Voter Interface', () => {
        it('should create a valid voter object', () => {
            const voter: Voter = createMockVoter();

            expect(voter.firstName).toBe('John');
            expect(voter.lastName).toBe('Doe');
            expect(voter.email).toBe('john.doe@example.com');
            expect(voter.demographics.age).toBe(25);
            expect(voter.demographics.location).toBe('Test City');
        });

        it('should handle optional voter fields', () => {
            const voter: Voter = createMockVoter({
                phone: undefined,
                address: undefined,
                votingPreference: 'democrat'
            });

            expect(voter.phone).toBeUndefined();
            expect(voter.address).toBeUndefined();
            expect(voter.votingPreference).toBe('democrat');
        });
    });

    describe('VoterContact Interface', () => {
        it('should create a valid voter contact object', () => {
            const contact: VoterContact = createMockVoterContact();

            expect(contact.voterId).toBe('test-voter-id');
            expect(contact.campaignId).toBe('test-campaign-id');
            expect(contact.contactMethod).toBe(ContactMethod.EMAIL);
            expect(contact.status).toBe(ContactStatus.PENDING);
        });

        it('should track contact lifecycle', () => {
            const sentAt = new Date();
            const deliveredAt = new Date(sentAt.getTime() + 1000);
            const readAt = new Date(deliveredAt.getTime() + 5000);

            const contact: VoterContact = createMockVoterContact({
                status: ContactStatus.READ,
                sentAt,
                deliveredAt,
                readAt
            });

            expect(contact.status).toBe(ContactStatus.READ);
            expect(contact.sentAt).toBe(sentAt);
            expect(contact.deliveredAt).toBe(deliveredAt);
            expect(contact.readAt).toBe(readAt);
        });
    });

    describe('Enums', () => {
        it('should have valid campaign statuses', () => {
            expect(Object.values(CampaignStatus)).toContain('draft');
            expect(Object.values(CampaignStatus)).toContain('active');
            expect(Object.values(CampaignStatus)).toContain('paused');
            expect(Object.values(CampaignStatus)).toContain('completed');
            expect(Object.values(CampaignStatus)).toContain('cancelled');
        });

        it('should have valid message types', () => {
            expect(Object.values(MessageType)).toContain('email');
            expect(Object.values(MessageType)).toContain('sms');
            expect(Object.values(MessageType)).toContain('push_notification');
            expect(Object.values(MessageType)).toContain('social_media');
        });

        it('should have valid contact methods', () => {
            expect(Object.values(ContactMethod)).toContain('email');
            expect(Object.values(ContactMethod)).toContain('sms');
            expect(Object.values(ContactMethod)).toContain('phone');
            expect(Object.values(ContactMethod)).toContain('mail');
        });
    });

    describe('API Response Interfaces', () => {
        it('should create a successful API response', () => {
            const campaign = createMockCampaign();
            const response: ApiResponse<Campaign> = {
                success: true,
                data: campaign,
                message: 'Campaign retrieved successfully',
                timestamp: new Date()
            };

            expect(response.success).toBe(true);
            expect(response.data).toBe(campaign);
            expect(response.message).toBe('Campaign retrieved successfully');
            expect(response.timestamp).toBeInstanceOf(Date);
        });

        it('should create an error API response', () => {
            const response: ApiResponse<null> = {
                success: false,
                message: 'Campaign not found',
                error: 'CAMPAIGN_NOT_FOUND',
                timestamp: new Date()
            };

            expect(response.success).toBe(false);
            expect(response.data).toBeUndefined();
            expect(response.error).toBe('CAMPAIGN_NOT_FOUND');
        });

        it('should create a paginated response', () => {
            const campaigns = [createMockCampaign(), createMockCampaign()];
            const response: PaginatedResponse<Campaign> = {
                data: campaigns,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 2,
                    totalPages: 1
                }
            };

            expect(response.data).toHaveLength(2);
            expect(response.pagination.page).toBe(1);
            expect(response.pagination.total).toBe(2);
            expect(response.pagination.totalPages).toBe(1);
        });
    });
}); 