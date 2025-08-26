import { Message, MessageDocument } from '../models/Message';
import { VoterContact, VoterContactDocument } from '../models/VoterContact';
import { Voter, VoterDocument } from '../models/Voter';
import { Logger } from '../config/logger';
import { MessageStatus, MessageType, ContactStatus } from '../types';
import { EnvConfig } from '../config/EnvConfig';
import { MessagePersonalizationService } from './MessagePersonalizationService';

// Message delivery service interfaces
export interface EmailProvider {
    sendEmail(to: string, subject: string, content: string, htmlContent?: string): Promise<boolean>;
    sendBulkEmail(recipients: Array<{ email: string; name?: string }>, subject: string, content: string, htmlContent?: string): Promise<{ success: number; failed: number; errors: string[] }>;
}

export interface SMSProvider {
    sendSMS(to: string, message: string): Promise<boolean>;
    sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<{ success: number; failed: number; errors: string[] }>;
}

export interface WhatsAppProvider {
    sendWhatsApp(to: string, message: string, templateName?: string, variables?: Record<string, string>): Promise<boolean>;
    sendBulkWhatsApp(recipients: Array<{ phone: string; message: string; templateName?: string; variables?: Record<string, string> }>): Promise<{ success: number; failed: number; errors: string[] }>;
}

export interface DeliveryResult {
    success: boolean;
    messageId: string;
    recipientId: string;
    deliveryStatus: ContactStatus;
    error?: string;
    timestamp: Date;
    providerResponse?: any;
}

export interface BulkDeliveryResult {
    total: number;
    successful: number;
    failed: number;
    results: DeliveryResult[];
    summary: {
        emailSuccess: number;
        emailFailed: number;
        smsSuccess: number;
        smsFailed: number;
        whatsappSuccess: number;
        whatsappFailed: number;
    };
}

// Mock providers (replace with actual service integrations)
class MockEmailProvider implements EmailProvider {
    async sendEmail(to: string, subject: string, content: string, htmlContent?: string): Promise<boolean> {
        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Simulate 95% success rate
        const success = Math.random() > 0.05;

        if (success) {
            Logger.info(`📧 Email sent successfully to: ${to} | Subject: ${subject}`);
        } else {
            Logger.warn(`📧 Email failed to send to: ${to} | Subject: ${subject}`);
        }

        return success;
    }

    async sendBulkEmail(recipients: Array<{ email: string; name?: string }>, subject: string, content: string, htmlContent?: string): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const recipient of recipients) {
            try {
                const success = await this.sendEmail(recipient.email, subject, content, htmlContent);
                if (success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push(`Failed to send email to ${recipient.email}`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Error sending email to ${recipient.email}: ${error}`);
            }
        }

        return results;
    }
}

class MockSMSProvider implements SMSProvider {
    async sendSMS(to: string, message: string): Promise<boolean> {
        // Simulate SMS sending delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Simulate 98% success rate
        const success = Math.random() > 0.02;

        if (success) {
            Logger.info(`📱 SMS sent successfully to: ${to} | Message: ${message.substring(0, 50)}...`);
        } else {
            Logger.warn(`📱 SMS failed to send to: ${to} | Message: ${message.substring(0, 50)}...`);
        }

        return success;
    }

    async sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const recipient of recipients) {
            try {
                const success = await this.sendSMS(recipient.phone, recipient.message);
                if (success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push(`Failed to send SMS to ${recipient.phone}`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Error sending SMS to ${recipient.phone}: ${error}`);
            }
        }

        return results;
    }
}

class MockWhatsAppProvider implements WhatsAppProvider {
    async sendWhatsApp(to: string, message: string, templateName?: string, variables?: Record<string, string>): Promise<boolean> {
        // Simulate WhatsApp sending delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Simulate 99% success rate
        const success = Math.random() > 0.01;

        if (success) {
            Logger.info(`💬 WhatsApp sent successfully to: ${to} | Message: ${message.substring(0, 50)}...`);
        } else {
            Logger.warn(`💬 WhatsApp failed to send to: ${to} | Message: ${message.substring(0, 50)}...`);
        }

        return success;
    }

    async sendBulkWhatsApp(recipients: Array<{ phone: string; message: string; templateName?: string; variables?: Record<string, string> }>): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        for (const recipient of recipients) {
            try {
                const success = await this.sendWhatsApp(recipient.phone, recipient.message, recipient.templateName, recipient.variables);
                if (success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push(`Failed to send WhatsApp to ${recipient.phone}`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Error sending WhatsApp to ${recipient.phone}: ${error}`);
            }
        }

        return results;
    }
}

export class MessageDeliveryService {
    private static emailProvider: EmailProvider = new MockEmailProvider();
    private static smsProvider: SMSProvider = new MockSMSProvider();
    private static whatsappProvider: WhatsAppProvider = new MockWhatsAppProvider();

    /**
     * Set custom providers for message delivery
     */
    public static setProviders(
        emailProvider: EmailProvider,
        smsProvider: SMSProvider,
        whatsappProvider: WhatsAppProvider
    ) {
        this.emailProvider = emailProvider;
        this.smsProvider = smsProvider;
        this.whatsappProvider = whatsappProvider;
        Logger.info('Message delivery providers updated');
    }

    /**
     * Send a single message to a voter
     */
    public static async sendMessageToVoter(
        messageId: string,
        voterId: string,
        contactMethod: string
    ): Promise<DeliveryResult> {
        try {
            Logger.info(`Sending message ${messageId} to voter ${voterId} via ${contactMethod}`);

            // Get message and voter details
            const [message, voter] = await Promise.all([
                Message.findById(messageId),
                Voter.findById(voterId)
            ]);

            if (!message) {
                throw new Error('Message not found');
            }

            if (!voter) {
                throw new Error('Voter not found');
            }

            // Personalize content for the voter
            const personalizedContent = MessagePersonalizationService.personalizeMessage(
                message,
                voter,
                voter.preferredLanguage || 'en'
            );

            let deliverySuccess = false;
            let providerResponse = null;

            // Send message based on contact method
            switch (contactMethod.toLowerCase()) {
                case 'email':
                    // Note: Voter model doesn't store email addresses, only contact preferences
                    // In a real implementation, you'd need to get email from a separate contact table
                    throw new Error('Email delivery not implemented - voter email addresses not stored');
                    break;

                case 'sms':
                    if (voter.phoneNumber) {
                        deliverySuccess = await this.smsProvider.sendSMS(
                            voter.phoneNumber,
                            personalizedContent.content
                        );
                    } else {
                        throw new Error('Voter has no phone number');
                    }
                    break;

                case 'whatsapp':
                    if (voter.phoneNumber) {
                        deliverySuccess = await this.whatsappProvider.sendWhatsApp(
                            voter.phoneNumber,
                            personalizedContent.content,
                            'election_campaign',
                            { campaign_name: message.title }
                        );
                    } else {
                        throw new Error('Voter has no phone number');
                    }
                    break;

                default:
                    throw new Error(`Unsupported contact method: ${contactMethod}`);
            }

            // Update delivery status
            const deliveryStatus = deliverySuccess ? ContactStatus.DELIVERED : ContactStatus.FAILED;
            await VoterContact.findOneAndUpdate(
                { messageId, voterId },
                {
                    status: deliveryStatus,
                    deliveredAt: deliverySuccess ? new Date() : undefined,
                    lastAttemptAt: new Date()
                }
            );

            const result: DeliveryResult = {
                success: deliverySuccess,
                messageId,
                recipientId: voterId,
                deliveryStatus,
                timestamp: new Date(),
                providerResponse
            };

            if (!deliverySuccess) {
                result.error = `Failed to deliver message via ${contactMethod}`;
            }

            Logger.info(`Message delivery ${deliverySuccess ? 'successful' : 'failed'} for voter ${voterId}`);
            return result;

        } catch (error) {
            Logger.error(`Error sending message to voter ${voterId}:`, error);

            // Update contact status to failed
            await VoterContact.findOneAndUpdate(
                { messageId, voterId },
                {
                    status: ContactStatus.FAILED,
                    lastAttemptAt: new Date()
                }
            );

            return {
                success: false,
                messageId,
                recipientId: voterId,
                deliveryStatus: ContactStatus.FAILED,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Send campaign message to all assigned voters
     */
    public static async sendCampaignMessage(
        messageId: string,
        campaignId: string
    ): Promise<BulkDeliveryResult> {
        try {
            Logger.info(`Starting bulk message delivery for campaign ${campaignId}, message ${messageId}`);

            // Get message details
            const message = await Message.findById(messageId);
            if (!message) {
                throw new Error('Message not found');
            }

            // Get all voter contacts for this campaign
            const voterContacts = await VoterContact.find({ campaignId });

            if (voterContacts.length === 0) {
                Logger.info('No voter contacts found for campaign');
                return {
                    total: 0,
                    successful: 0,
                    failed: 0,
                    results: [],
                    summary: {
                        emailSuccess: 0,
                        emailFailed: 0,
                        smsSuccess: 0,
                        smsFailed: 0,
                        whatsappSuccess: 0,
                        whatsappFailed: 0
                    }
                };
            }

            // Group contacts by contact method
            const contactsByMethod = this.groupContactsByMethod(voterContacts);

            const results: DeliveryResult[] = [];
            const summary = {
                emailSuccess: 0,
                emailFailed: 0,
                smsSuccess: 0,
                smsFailed: 0,
                whatsappSuccess: 0,
                whatsappFailed: 0
            };

            // Process each contact method
            for (const [method, contacts] of Object.entries(contactsByMethod)) {
                const methodResults = await this.processContactsByMethod(message, contacts, method);
                results.push(...methodResults);

                // Update summary
                methodResults.forEach(result => {
                    if (result.success) {
                        switch (method) {
                            case 'email': summary.emailSuccess++; break;
                            case 'sms': summary.smsSuccess++; break;
                            case 'whatsapp': summary.whatsappSuccess++; break;
                        }
                    } else {
                        switch (method) {
                            case 'email': summary.emailFailed++; break;
                            case 'sms': summary.smsFailed++; break;
                            case 'whatsapp': summary.whatsappFailed++; break;
                        }
                    }
                });
            }

            // Update message status
            const successfulDeliveries = results.filter(r => r.success).length;
            const failedDeliveries = results.filter(r => !r.success).length;

            await Message.findByIdAndUpdate(messageId, {
                status: MessageStatus.SENT,
                sentCount: successfulDeliveries,
                failedCount: failedDeliveries,
                totalRecipients: results.length
            });

            const bulkResult: BulkDeliveryResult = {
                total: results.length,
                successful: successfulDeliveries,
                failed: failedDeliveries,
                results,
                summary
            };

            Logger.info(`Bulk message delivery completed: ${successfulDeliveries} successful, ${failedDeliveries} failed`);
            return bulkResult;

        } catch (error) {
            Logger.error(`Error in bulk message delivery:`, error);
            throw error;
        }
    }

    /**
     * Process contacts by method for bulk delivery
     */
    private static async processContactsByMethod(
        message: MessageDocument,
        contacts: VoterContactDocument[],
        method: string
    ): Promise<DeliveryResult[]> {
        const results: DeliveryResult[] = [];

        // Get voter details for all contacts
        const voterIds = contacts.map(c => c.voterId);
        const voters = await Voter.find({ _id: { $in: voterIds } });
        const voterMap = new Map(voters.map(v => [v._id.toString(), v]));

        // Prepare content for the method (will be personalized per voter)
        const baseContent = this.prepareLocalizedContent(message, 'en'); // Default to English for bulk

        // Process each contact
        for (const contact of contacts) {
            const voter = voterMap.get(contact.voterId.toString());
            if (!voter) {
                results.push({
                    success: false,
                    messageId: message._id.toString(),
                    recipientId: contact.voterId.toString(),
                    deliveryStatus: ContactStatus.FAILED,
                    error: 'Voter not found',
                    timestamp: new Date()
                });
                continue;
            }

            try {
                let deliverySuccess = false;

                // Personalize message for this specific voter
                const personalizedContent = MessagePersonalizationService.personalizeMessage(
                    message,
                    voter,
                    voter.preferredLanguage || 'en'
                );

                switch (method) {
                    case 'email':
                        // Note: Voter model doesn't store email addresses
                        // In a real implementation, you'd need to get email from a separate contact table
                        Logger.warn(`Email delivery not implemented for voter ${voter._id}`);
                        break;

                    case 'sms':
                        if (voter.phoneNumber) {
                            deliverySuccess = await this.smsProvider.sendSMS(
                                voter.phoneNumber,
                                personalizedContent.content
                            );
                        }
                        break;

                    case 'whatsapp':
                        if (voter.phoneNumber) {
                            deliverySuccess = await this.whatsappProvider.sendWhatsApp(
                                voter.phoneNumber,
                                personalizedContent.content,
                                'election_campaign'
                            );
                        }
                        break;
                }

                // Update contact status
                const deliveryStatus = deliverySuccess ? ContactStatus.DELIVERED : ContactStatus.FAILED;
                await VoterContact.findByIdAndUpdate(contact._id, {
                    status: deliveryStatus,
                    deliveredAt: deliverySuccess ? new Date() : undefined,
                    lastAttemptAt: new Date()
                });

                results.push({
                    success: deliverySuccess,
                    messageId: message._id.toString(),
                    recipientId: contact.voterId.toString(),
                    deliveryStatus,
                    timestamp: new Date()
                });

            } catch (error) {
                results.push({
                    success: false,
                    messageId: message._id.toString(),
                    recipientId: contact.voterId.toString(),
                    deliveryStatus: ContactStatus.FAILED,
                    error: error.message,
                    timestamp: new Date()
                });

                // Update contact status to failed
                await VoterContact.findByIdAndUpdate(contact._id, {
                    status: ContactStatus.FAILED,
                    lastAttemptAt: new Date()
                });
            }
        }

        return results;
    }

    /**
     * Group contacts by contact method
     */
    private static groupContactsByMethod(contacts: VoterContactDocument[]): Record<string, VoterContactDocument[]> {
        const grouped: Record<string, VoterContactDocument[]> = {
            email: [],
            sms: [],
            whatsapp: []
        };

        contacts.forEach(contact => {
            const method = contact.contactMethod || 'email';
            if (grouped[method]) {
                grouped[method].push(contact);
            }
        });

        return grouped;
    }

    /**
     * Prepare localized content for different languages
     */
    private static prepareLocalizedContent(message: MessageDocument, language: string): { title: string; content: string; htmlContent?: string } {
        // Check if message has variants for the requested language
        if (message.variants && message.variants.length > 0) {
            const variant = message.variants.find(v => v.language === language && v.approved);
            if (variant) {
                return {
                    title: variant.title,
                    content: variant.content,
                    htmlContent: `<h1>${variant.title}</h1><p>${variant.content}</p>`
                };
            }
        }

        // Fallback to default content
        return {
            title: message.title,
            content: message.content,
            htmlContent: `<h1>${message.title}</h1><p>${message.content}</p>`
        };
    }

    /**
     * Retry failed message deliveries
     */
    public static async retryFailedDeliveries(messageId: string): Promise<{ success: number; failed: number }> {
        try {
            Logger.info(`Retrying failed deliveries for message: ${messageId}`);

            const failedContacts = await VoterContact.find({
                messageId,
                status: ContactStatus.FAILED
            });

            if (failedContacts.length === 0) {
                Logger.info('No failed deliveries to retry');
                return { success: 0, failed: 0 };
            }

            let successCount = 0;
            let failedCount = 0;

            for (const contact of failedContacts) {
                try {
                    const result = await this.sendMessageToVoter(
                        messageId,
                        contact.voterId.toString(),
                        contact.contactMethod || 'email'
                    );

                    if (result.success) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                } catch (error) {
                    failedCount++;
                    Logger.error(`Error retrying delivery for contact ${contact._id}:`, error);
                }
            }

            Logger.info(`Retry completed: ${successCount} successful, ${failedCount} failed`);
            return { success: successCount, failed: failedCount };

        } catch (error) {
            Logger.error(`Error retrying failed deliveries:`, error);
            throw error;
        }
    }

    /**
     * Get delivery statistics for a message
     */
    public static async getMessageDeliveryStats(messageId: string): Promise<any> {
        try {
            const stats = await VoterContact.aggregate([
                { $match: { messageId } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]);

            const total = stats.reduce((sum, stat) => sum + stat.count, 0);
            const delivered = stats.find(s => s._id === ContactStatus.DELIVERED)?.count || 0;
            const failed = stats.find(s => s._id === ContactStatus.FAILED)?.count || 0;
            const pending = stats.find(s => s._id === ContactStatus.PENDING)?.count || 0;

            return {
                total,
                delivered,
                failed,
                pending,
                successRate: total > 0 ? (delivered / total) * 100 : 0,
                breakdown: stats
            };

        } catch (error) {
            Logger.error(`Error getting delivery stats:`, error);
            throw error;
        }
    }
}
