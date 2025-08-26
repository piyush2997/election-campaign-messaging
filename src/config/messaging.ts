import { EnvConfig } from './EnvConfig';
import { Logger } from './logger';
import {
    SendGridProvider,
    AWSSESProvider,
    NodemailerProvider
} from '../services/providers/EmailProviders';
import {
    TwilioProvider,
    AWSSNSProvider,
    GenericSMSProvider
} from '../services/providers/SMSProviders';
import {
    WhatsAppBusinessProvider,
    TwilioWhatsAppProvider,
    GenericWhatsAppProvider
} from '../services/providers/WhatsAppProviders';
import {
    EmailProvider,
    SMSProvider,
    WhatsAppProvider
} from '../services/MessageDeliveryService';

export interface MessagingConfig {
    email: {
        provider: string;
        settings: Record<string, any>;
    };
    sms: {
        provider: string;
        settings: Record<string, any>;
    };
    whatsapp: {
        provider: string;
        settings: Record<string, any>;
    };
    rateLimiting: {
        emailPerSecond: number;
        smsPerSecond: number;
        whatsappPerSecond: number;
        maxRetries: number;
        retryDelayMs: number;
    };
    templates: {
        defaultLanguage: string;
        supportedLanguages: string[];
        fallbackLanguage: string;
    };
}

export class MessagingConfigManager {
    private static instance: MessagingConfigManager;
    private config: MessagingConfig;

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): MessagingConfigManager {
        if (!MessagingConfigManager.instance) {
            MessagingConfigManager.instance = new MessagingConfigManager();
        }
        return MessagingConfigManager.instance;
    }

    private loadConfig(): MessagingConfig {
        return {
            email: {
                provider: EnvConfig.get('EMAIL_PROVIDER') || 'sendgrid',
                settings: {
                    sendgrid: {
                        apiKey: EnvConfig.get('SENDGRID_API_KEY'),
                        fromEmail: EnvConfig.get('SENDGRID_FROM_EMAIL') || 'noreply@electioncampaign.com',
                        fromName: EnvConfig.get('SENDGRID_FROM_NAME') || 'Election Campaign'
                    },
                    aws: {
                        region: EnvConfig.get('AWS_SES_REGION') || 'us-east-1',
                        accessKeyId: EnvConfig.get('AWS_ACCESS_KEY_ID'),
                        secretAccessKey: EnvConfig.get('AWS_SECRET_ACCESS_KEY'),
                        fromEmail: EnvConfig.get('AWS_SES_FROM_EMAIL') || 'noreply@electioncampaign.com'
                    },
                    smtp: {
                        host: EnvConfig.get('SMTP_HOST'),
                        port: EnvConfig.get('SMTP_PORT'),
                        secure: EnvConfig.get('SMTP_SECURE') === 'true',
                        user: EnvConfig.get('SMTP_USER'),
                        pass: EnvConfig.get('SMTP_PASS'),
                        fromEmail: EnvConfig.get('SMTP_FROM_EMAIL') || 'noreply@electioncampaign.com',
                        fromName: EnvConfig.get('SMTP_FROM_NAME') || 'Election Campaign'
                    }
                }
            },
            sms: {
                provider: EnvConfig.get('SMS_PROVIDER') || 'twilio',
                settings: {
                    twilio: {
                        accountSid: EnvConfig.get('TWILIO_ACCOUNT_SID'),
                        authToken: EnvConfig.get('TWILIO_AUTH_TOKEN'),
                        fromNumber: EnvConfig.get('TWILIO_FROM_NUMBER')
                    },
                    aws: {
                        region: EnvConfig.get('AWS_SNS_REGION') || 'us-east-1',
                        accessKeyId: EnvConfig.get('AWS_ACCESS_KEY_ID'),
                        secretAccessKey: EnvConfig.get('AWS_SECRET_ACCESS_KEY'),
                        smsType: EnvConfig.get('AWS_SNS_SMS_TYPE') || 'Transactional'
                    },
                    generic: {
                        url: EnvConfig.get('SMS_GATEWAY_URL'),
                        apiKey: EnvConfig.get('SMS_GATEWAY_API_KEY'),
                        username: EnvConfig.get('SMS_GATEWAY_USERNAME'),
                        password: EnvConfig.get('SMS_GATEWAY_PASSWORD'),
                        senderId: EnvConfig.get('SMS_GATEWAY_SENDER_ID') || 'ECAMPAIGN'
                    }
                }
            },
            whatsapp: {
                provider: EnvConfig.get('WHATSAPP_PROVIDER') || 'business_api',
                settings: {
                    business_api: {
                        accessToken: EnvConfig.get('WHATSAPP_ACCESS_TOKEN'),
                        phoneNumberId: EnvConfig.get('WHATSAPP_PHONE_NUMBER_ID'),
                        businessAccountId: EnvConfig.get('WHATSAPP_BUSINESS_ACCOUNT_ID'),
                        apiVersion: EnvConfig.get('WHATSAPP_API_VERSION') || 'v18.0'
                    },
                    twilio: {
                        accountSid: EnvConfig.get('TWILIO_ACCOUNT_SID'),
                        authToken: EnvConfig.get('TWILIO_AUTH_TOKEN'),
                        fromNumber: EnvConfig.get('TWILIO_WHATSAPP_FROM') || 'whatsapp:+14155238886'
                    },
                    generic: {
                        url: EnvConfig.get('WHATSAPP_GATEWAY_URL'),
                        apiKey: EnvConfig.get('WHATSAPP_GATEWAY_API_KEY'),
                        instanceId: EnvConfig.get('WHATSAPP_GATEWAY_INSTANCE_ID'),
                        token: EnvConfig.get('WHATSAPP_GATEWAY_TOKEN')
                    }
                }
            },
            rateLimiting: {
                emailPerSecond: parseInt(EnvConfig.get('EMAIL_RATE_LIMIT_PER_SECOND') || '10'),
                smsPerSecond: parseInt(EnvConfig.get('SMS_RATE_LIMIT_PER_SECOND') || '5'),
                whatsappPerSecond: parseInt(EnvConfig.get('WHATSAPP_RATE_LIMIT_PER_SECOND') || '3'),
                maxRetries: parseInt(EnvConfig.get('MAX_MESSAGE_RETRIES') || '3'),
                retryDelayMs: parseInt(EnvConfig.get('MESSAGE_RETRY_DELAY_MS') || '5000')
            },
            templates: {
                defaultLanguage: EnvConfig.get('DEFAULT_MESSAGE_LANGUAGE') || 'en',
                supportedLanguages: (EnvConfig.get('SUPPORTED_MESSAGE_LANGUAGES') || 'en,hi,te,ta,kn,ml').split(','),
                fallbackLanguage: EnvConfig.get('FALLBACK_MESSAGE_LANGUAGE') || 'en'
            }
        };
    }

    public getConfig(): MessagingConfig {
        return this.config;
    }

    public getEmailProvider(): EmailProvider {
        const providerName = this.config.email.provider.toLowerCase();

        switch (providerName) {
            case 'sendgrid':
                return new SendGridProvider();
            case 'aws':
            case 'awsses':
                return new AWSSESProvider();
            case 'smtp':
            case 'nodemailer':
                return new NodemailerProvider();
            default:
                Logger.warn(`Unknown email provider: ${providerName}, falling back to SendGrid`);
                return new SendGridProvider();
        }
    }

    public getSMSProvider(): SMSProvider {
        const providerName = this.config.sms.provider.toLowerCase();

        switch (providerName) {
            case 'twilio':
                return new TwilioProvider();
            case 'aws':
            case 'awsns':
                return new AWSSNSProvider();
            case 'generic':
                return new GenericSMSProvider();
            default:
                Logger.warn(`Unknown SMS provider: ${providerName}, falling back to Twilio`);
                return new TwilioProvider();
        }
    }

    public getWhatsAppProvider(): WhatsAppProvider {
        const providerName = this.config.whatsapp.provider.toLowerCase();

        switch (providerName) {
            case 'business_api':
            case 'whatsapp_business':
                return new WhatsAppBusinessProvider();
            case 'twilio':
                return new TwilioWhatsAppProvider();
            case 'generic':
                return new GenericWhatsAppProvider();
            default:
                Logger.warn(`Unknown WhatsApp provider: ${providerName}, falling back to Business API`);
                return new WhatsAppBusinessProvider();
        }
    }

    public validateConfig(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const config = this.config;

        // Validate email configuration
        if (config.email.provider === 'sendgrid' && !config.email.settings.sendgrid.apiKey) {
            errors.push('SendGrid API key is required when using SendGrid provider');
        }

        if (config.email.provider === 'aws' && (!config.email.settings.aws.accessKeyId || !config.email.settings.aws.secretAccessKey)) {
            errors.push('AWS credentials are required when using AWS SES provider');
        }

        if (config.email.provider === 'smtp' && (!config.email.settings.smtp.host || !config.email.settings.smtp.user || !config.email.settings.smtp.pass)) {
            errors.push('SMTP host, user, and password are required when using SMTP provider');
        }

        // Validate SMS configuration
        if (config.sms.provider === 'twilio' && (!config.sms.settings.twilio.accountSid || !config.sms.settings.twilio.authToken)) {
            errors.push('Twilio credentials are required when using Twilio provider');
        }

        if (config.sms.provider === 'aws' && (!config.sms.settings.aws.accessKeyId || !config.sms.settings.aws.secretAccessKey)) {
            errors.push('AWS credentials are required when using AWS SNS provider');
        }

        // Validate WhatsApp configuration
        if (config.whatsapp.provider === 'business_api' && (!config.whatsapp.settings.business_api.accessToken || !config.whatsapp.settings.business_api.phoneNumberId)) {
            errors.push('WhatsApp Business API credentials are required when using Business API provider');
        }

        // Validate rate limiting
        if (config.rateLimiting.emailPerSecond <= 0 || config.rateLimiting.smsPerSecond <= 0 || config.rateLimiting.whatsappPerSecond <= 0) {
            errors.push('Rate limiting values must be greater than 0');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    public reloadConfig(): void {
        this.config = this.loadConfig();
        Logger.info('Messaging configuration reloaded');
    }

    public getRateLimitForMethod(method: string): number {
        switch (method.toLowerCase()) {
            case 'email':
                return this.config.rateLimiting.emailPerSecond;
            case 'sms':
                return this.config.rateLimiting.smsPerSecond;
            case 'whatsapp':
                return this.config.rateLimiting.whatsappPerSecond;
            default:
                return this.config.rateLimiting.emailPerSecond;
        }
    }

    public getMaxRetries(): number {
        return this.config.rateLimiting.maxRetries;
    }

    public getRetryDelay(): number {
        return this.config.rateLimiting.retryDelayMs;
    }

    public getSupportedLanguages(): string[] {
        return this.config.templates.supportedLanguages;
    }

    public getDefaultLanguage(): string {
        return this.config.templates.defaultLanguage;
    }

    public getFallbackLanguage(): string {
        return this.config.templates.fallbackLanguage;
    }
}
