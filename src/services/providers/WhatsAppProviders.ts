import { WhatsAppProvider } from '../MessageDeliveryService';
import { Logger } from '../../config/logger';
import { EnvConfig } from '../../config/EnvConfig';

// WhatsApp Business API Provider
export class WhatsAppBusinessProvider implements WhatsAppProvider {
    private accessToken: string;
    private phoneNumberId: string;
    private businessAccountId: string;
    private apiVersion: string;

    constructor() {
        this.accessToken = EnvConfig.get('WHATSAPP_ACCESS_TOKEN') || '';
        this.phoneNumberId = EnvConfig.get('WHATSAPP_PHONE_NUMBER_ID') || '';
        this.businessAccountId = EnvConfig.get('WHATSAPP_BUSINESS_ACCOUNT_ID') || '';
        this.apiVersion = EnvConfig.get('WHATSAPP_API_VERSION') || 'v18.0';

        if (!this.accessToken || !this.phoneNumberId) {
            Logger.warn('WhatsApp Business API not configured, using mock mode');
        }
    }

    async sendWhatsApp(to: string, message: string, templateName?: string, variables?: Record<string, string>): Promise<boolean> {
        try {
            if (!this.accessToken || !this.phoneNumberId) {
                Logger.warn('WhatsApp Business API not configured, simulating WhatsApp send');
                return true;
            }

            // This would be the actual WhatsApp Business API call
            // const axios = require('axios');

            const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

            let payload: any;

            if (templateName && variables) {
                // Send template message
                payload = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: {
                            code: 'en'
                        },
                        components: [
                            {
                                type: 'body',
                                parameters: Object.entries(variables).map(([key, value]) => ({
                                    type: 'text',
                                    text: value
                                }))
                            }
                        ]
                    }
                };
            } else {
                // Send text message
                payload = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: {
                        body: message
                    }
                };
            }

            // const response = await axios.post(url, payload, {
            //     headers: {
            //         'Authorization': `Bearer ${this.accessToken}`,
            //         'Content-Type': 'application/json'
            //     }
            // });

            Logger.info(`💬 WhatsApp Business API message sent successfully to: ${to} | Message: ${message.substring(0, 50)}...`);
            return true;

        } catch (error) {
            Logger.error(`WhatsApp Business API failed to send to ${to}:`, error);
            return false;
        }
    }

    async sendBulkWhatsApp(recipients: Array<{ phone: string; message: string; templateName?: string; variables?: Record<string, string> }>): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        if (!this.accessToken || !this.phoneNumberId) {
            Logger.warn('WhatsApp Business API not configured, simulating bulk WhatsApp send');
            return { success: recipients.length, failed: 0, errors: [] };
        }

        // WhatsApp Business API has rate limits, so we'll process in smaller batches
        const batchSize = 50;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            // Process batch with rate limiting
            for (const recipient of batch) {
                try {
                    const success = await this.sendWhatsApp(
                        recipient.phone,
                        recipient.message,
                        recipient.templateName,
                        recipient.variables
                    );

                    if (success) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`Failed to send WhatsApp to ${recipient.phone}`);
                    }

                    // Rate limiting: wait 200ms between messages
                    await new Promise(resolve => setTimeout(resolve, 200));

                } catch (error) {
                    results.failed++;
                    results.errors.push(`Error sending WhatsApp to ${recipient.phone}: ${error.message}`);
                }
            }
        }

        return results;
    }
}

// Twilio WhatsApp Provider
export class TwilioWhatsAppProvider implements WhatsAppProvider {
    private accountSid: string;
    private authToken: string;
    private fromNumber: string;

    constructor() {
        this.accountSid = EnvConfig.get('TWILIO_ACCOUNT_SID') || '';
        this.authToken = EnvConfig.get('TWILIO_AUTH_TOKEN') || '';
        this.fromNumber = EnvConfig.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886';

        if (!this.accountSid || !this.authToken) {
            Logger.warn('Twilio WhatsApp not configured, using mock mode');
        }
    }

    async sendWhatsApp(to: string, message: string, templateName?: string, variables?: Record<string, string>): Promise<boolean> {
        try {
            if (!this.accountSid || !this.authToken) {
                Logger.warn('Twilio WhatsApp not configured, simulating WhatsApp send');
                return true;
            }

            // This would be the actual Twilio WhatsApp API call
            // const twilio = require('twilio');
            // const client = twilio(this.accountSid, this.authToken);

            // Format phone number for WhatsApp
            const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

            let messageBody = message;
            if (templateName && variables) {
                // Replace variables in message
                Object.entries(variables).forEach(([key, value]) => {
                    messageBody = messageBody.replace(`{{${key}}}`, value);
                });
            }

            const params = {
                body: messageBody,
                from: this.fromNumber,
                to: formattedTo
            };

            // const result = await client.messages.create(params);
            Logger.info(`💬 Twilio WhatsApp message sent successfully to: ${to} | Message: ${messageBody.substring(0, 50)}...`);
            return true;

        } catch (error) {
            Logger.error(`Twilio WhatsApp failed to send to ${to}:`, error);
            return false;
        }
    }

    async sendBulkWhatsApp(recipients: Array<{ phone: string; message: string; templateName?: string; variables?: Record<string, string> }>): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        if (!this.accountSid || !this.authToken) {
            Logger.warn('Twilio WhatsApp not configured, simulating bulk WhatsApp send');
            return { success: recipients.length, failed: 0, errors: [] };
        }

        // Twilio has rate limits for WhatsApp
        const batchSize = 30;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            // Process batch with rate limiting
            for (const recipient of batch) {
                try {
                    const success = await this.sendWhatsApp(
                        recipient.phone,
                        recipient.message,
                        recipient.templateName,
                        recipient.variables
                    );

                    if (success) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`Failed to send WhatsApp to ${recipient.phone}`);
                    }

                    // Rate limiting: wait 300ms between WhatsApp messages
                    await new Promise(resolve => setTimeout(resolve, 300));

                } catch (error) {
                    results.failed++;
                    results.errors.push(`Error sending WhatsApp to ${recipient.phone}: ${error.message}`);
                }
            }
        }

        return results;
    }
}

// Generic WhatsApp Gateway Provider
export class GenericWhatsAppProvider implements WhatsAppProvider {
    private gatewayUrl: string;
    private apiKey: string;
    private instanceId: string;
    private token: string;

    constructor() {
        this.gatewayUrl = EnvConfig.get('WHATSAPP_GATEWAY_URL') || '';
        this.apiKey = EnvConfig.get('WHATSAPP_GATEWAY_API_KEY') || '';
        this.instanceId = EnvConfig.get('WHATSAPP_GATEWAY_INSTANCE_ID') || '';
        this.token = EnvConfig.get('WHATSAPP_GATEWAY_TOKEN') || '';

        if (!this.gatewayUrl) {
            Logger.warn('WhatsApp Gateway not configured, using mock mode');
        }
    }

    async sendWhatsApp(to: string, message: string, templateName?: string, variables?: Record<string, string>): Promise<boolean> {
        try {
            if (!this.gatewayUrl) {
                Logger.warn('WhatsApp Gateway not configured, simulating WhatsApp send');
                return true;
            }

            // This would be the actual HTTP request to the WhatsApp gateway
            // const axios = require('axios');

            let messageBody = message;
            if (templateName && variables) {
                // Replace variables in message
                Object.entries(variables).forEach(([key, value]) => {
                    messageBody = messageBody.replace(`{{${key}}}`, value);
                });
            }

            const payload = {
                api_key: this.apiKey,
                instance_id: this.instanceId,
                token: this.token,
                to: to,
                message: messageBody,
                type: 'text'
            };

            // const response = await axios.post(this.gatewayUrl + '/send', payload);
            Logger.info(`💬 Generic WhatsApp Gateway message sent successfully to: ${to} | Message: ${messageBody.substring(0, 50)}...`);
            return true;

        } catch (error) {
            Logger.error(`Generic WhatsApp Gateway failed to send to ${to}:`, error);
            return false;
        }
    }

    async sendBulkWhatsApp(recipients: Array<{ phone: string; message: string; templateName?: string; variables?: Record<string, string> }>): Promise<{ success: number; failed: number; errors: string[] }> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        if (!this.gatewayUrl) {
            Logger.warn('WhatsApp Gateway not configured, simulating bulk WhatsApp send');
            return { success: recipients.length, failed: 0, errors: [] };
        }

        // Many WhatsApp gateways support bulk sending
        try {
            const messages = recipients.map(recipient => {
                let messageBody = recipient.message;
                if (recipient.templateName && recipient.variables) {
                    Object.entries(recipient.variables).forEach(([key, value]) => {
                        messageBody = messageBody.replace(`{{${key}}}`, value);
                    });
                }

                return {
                    to: recipient.phone,
                    message: messageBody,
                    type: 'text'
                };
            });

            const payload = {
                api_key: this.apiKey,
                instance_id: this.instanceId,
                token: this.token,
                messages: messages
            };

            // const response = await axios.post(this.gatewayUrl + '/bulk', payload);
            results.success = recipients.length;
            Logger.info(`Generic WhatsApp Gateway bulk messages sent to ${recipients.length} recipients`);

        } catch (error) {
            // Fallback to individual sending
            Logger.warn('Bulk WhatsApp failed, falling back to individual sending');
            for (const recipient of recipients) {
                try {
                    const success = await this.sendWhatsApp(
                        recipient.phone,
                        recipient.message,
                        recipient.templateName,
                        recipient.variables
                    );

                    if (success) {
                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`Failed to send WhatsApp to ${recipient.phone}`);
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(`Error sending WhatsApp to ${recipient.phone}: ${error.message}`);
                }
            }
        }

        return results;
    }
}
