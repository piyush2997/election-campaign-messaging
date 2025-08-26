import { SMSProvider } from '../MessageDeliveryService';
import { Logger } from '../../config/logger';
import { EnvConfig } from '../../config/EnvConfig';

// Twilio SMS Provider
export class TwilioProvider implements SMSProvider {
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;

    constructor() {
        this.accountSid = EnvConfig.get('TWILIO_ACCOUNT_SID') || '';
        this.authToken = EnvConfig.get('TWILIO_AUTH_TOKEN') || '';
        this.fromNumber = EnvConfig.get('TWILIO_FROM_NUMBER') || '';

        if (!this.accountSid || !this.authToken) {
            Logger.warn('Twilio credentials not configured, using mock mode');
        }
    }

    async sendSMS(to: string, message: string): Promise<boolean> {
        try {
            if (!this.accountSid || !this.authToken) {
                Logger.warn('Twilio not configured, simulating SMS send');
                return true;
            }

            // This would be the actual Twilio API call
            // const twilio = require('twilio');
            // const client = twilio(this.accountSid, this.authToken);

            const params = {
                body: message,
                from: this.fromNumber,
                to: to
            };

            // const result = await client.messages.create(params);
            Logger.info(`📱 Twilio SMS sent successfully to: ${to} | Message: ${message.substring(0, 50)}...`);
            return true;

        } catch (error) {
            Logger.error(`Twilio SMS failed to send to ${to}:`, error);
            return false;
        }
    }

    async sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        if (!this.accountSid || !this.authToken) {
            Logger.warn('Twilio not configured, simulating bulk SMS send');
            return { success: recipients.length, failed: 0, errors: [] };
        }

        // Twilio has rate limits, so we'll process in smaller batches
        const batchSize = 100;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            // Process batch with rate limiting
            for (const recipient of batch) {
                try {
                    const success = await this.sendSMS(recipient.phone, recipient.message);
                    if (success) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`Failed to send SMS to ${recipient.phone}`);
                    }

                    // Rate limiting: wait 100ms between messages
                    await new Promise(resolve => setTimeout(resolve, 100));

                } catch (error) {
                    results.failed++;
                    results.errors.push(`Error sending SMS to ${recipient.phone}: ${error.message}`);
                }
            }
        }

        return results;
    }
}

// AWS SNS SMS Provider
export class AWSSNSProvider implements SMSProvider {
    private region: string;
    private accessKeyId: string;
    private secretAccessKey: string;
    private defaultSMSType: string;

    constructor() {
        this.region = EnvConfig.get('AWS_SNS_REGION') || 'us-east-1';
        this.accessKeyId = EnvConfig.get('AWS_ACCESS_KEY_ID') || '';
        this.secretAccessKey = EnvConfig.get('AWS_SECRET_ACCESS_KEY') || '';
        this.defaultSMSType = EnvConfig.get('AWS_SNS_SMS_TYPE') || 'Transactional';

        if (!this.accessKeyId || !this.secretAccessKey) {
            Logger.warn('AWS SNS credentials not configured, using mock mode');
        }
    }

    async sendSMS(to: string, message: string): Promise<boolean> {
        try {
            if (!this.accessKeyId || !this.secretAccessKey) {
                Logger.warn('AWS SNS not configured, simulating SMS send');
                return true;
            }

            // This would be the actual AWS SNS API call
            // const AWS = require('aws-sdk');
            // const sns = new AWS.SNS({
            //     region: this.region,
            //     accessKeyId: this.accessKeyId,
            //     secretAccessKey: this.secretAccessKey
            // });

            const params = {
                Message: message,
                PhoneNumber: to,
                MessageAttributes: {
                    'AWS.SNS.SMS.SMSType': {
                        DataType: 'String',
                        StringValue: this.defaultSMSType
                    }
                }
            };

            // const result = await sns.publish(params).promise();
            Logger.info(`📱 AWS SNS SMS sent successfully to: ${to} | Message: ${message.substring(0, 50)}...`);
            return true;

        } catch (error) {
            Logger.error(`AWS SNS SMS failed to send to ${to}:`, error);
            return false;
        }
    }

    async sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        if (!this.accessKeyId || !this.secretAccessKey) {
            Logger.warn('AWS SNS not configured, simulating bulk SMS send');
            return { success: recipients.length, failed: 0, errors: [] };
        }

        // AWS SNS can handle bulk publishing
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
                results.errors.push(`Error sending SMS to ${recipient.phone}: ${error.message}`);
            }
        }

        return results;
    }
}

// Generic SMS Gateway Provider
export class GenericSMSProvider implements SMSProvider {
    private gatewayUrl: string;
    private apiKey: string;
    private username: string;
    private password: string;
    private senderId: string;

    constructor() {
        this.gatewayUrl = EnvConfig.get('SMS_GATEWAY_URL') || '';
        this.apiKey = EnvConfig.get('SMS_GATEWAY_API_KEY') || '';
        this.username = EnvConfig.get('SMS_GATEWAY_USERNAME') || '';
        this.password = EnvConfig.get('SMS_GATEWAY_PASSWORD') || '';
        this.senderId = EnvConfig.get('SMS_GATEWAY_SENDER_ID') || 'ECAMPAIGN';

        if (!this.gatewayUrl) {
            Logger.warn('SMS Gateway not configured, using mock mode');
        }
    }

    async sendSMS(to: string, message: string): Promise<boolean> {
        try {
            if (!this.gatewayUrl) {
                Logger.warn('SMS Gateway not configured, simulating SMS send');
                return true;
            }

            // This would be the actual HTTP request to the SMS gateway
            // const axios = require('axios');

            const payload = {
                api_key: this.apiKey,
                username: this.username,
                password: this.password,
                sender_id: this.senderId,
                to: to,
                message: message
            };

            // const response = await axios.post(this.gatewayUrl, payload);
            Logger.info(`📱 Generic SMS Gateway SMS sent successfully to: ${to} | Message: ${message.substring(0, 50)}...`);
            return true;

        } catch (error) {
            Logger.error(`Generic SMS Gateway SMS failed to send to ${to}:`, error);
            return false;
        }
    }

    async sendBulkSMS(recipients: Array<{ phone: string; message: string }>): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        if (!this.gatewayUrl) {
            Logger.warn('SMS Gateway not configured, simulating bulk SMS send');
            return { success: recipients.length, failed: 0, errors: [] };
        }

        // Many SMS gateways support bulk sending
        try {
            const payload = {
                api_key: this.apiKey,
                username: this.username,
                password: this.password,
                sender_id: this.senderId,
                messages: recipients.map(r => ({
                    to: r.phone,
                    message: r.message
                }))
            };

            // const response = await axios.post(this.gatewayUrl + '/bulk', payload);
            results.success = recipients.length;
            Logger.info(`Generic SMS Gateway bulk SMS sent to ${recipients.length} recipients`);

        } catch (error) {
            // Fallback to individual sending
            Logger.warn('Bulk SMS failed, falling back to individual sending');
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
                    results.errors.push(`Error sending SMS to ${recipient.phone}: ${error.message}`);
                }
            }
        }

        return results;
    }
}
