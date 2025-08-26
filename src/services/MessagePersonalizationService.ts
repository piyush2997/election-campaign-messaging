import { VoterDocument } from '../models/Voter';
import { MessageDocument } from '../models/Message';
import { Logger } from '../config/logger';

export interface PersonalizationVariables {
    voterName: string;
    firstName: string;
    lastName: string;
    constituency: string;
    assemblySegment?: string;
    boothNumber: string;
    age?: number;
    gender?: string;
    occupation?: string;
    customField?: string;
    [key: string]: any;
}

export interface PersonalizedMessage {
    title: string;
    content: string;
    htmlContent?: string;
}

export class MessagePersonalizationService {

    /**
     * Get personalization variables for a voter
     */
    public static getVoterVariables(voter: VoterDocument): PersonalizationVariables {
        return {
            voterName: `${voter.firstName} ${voter.lastName}`.trim(),
            firstName: voter.firstName,
            lastName: voter.lastName,
            constituency: voter.constituency,
            assemblySegment: voter.assemblySegment,
            boothNumber: voter.boothNumber,
            age: voter.age,
            gender: voter.gender,
            occupation: voter.occupation,
            customField: undefined // Can be extended for custom fields
        };
    }

    /**
     * Replace template variables in message content
     */
    public static replaceTemplateVariables(
        content: string,
        variables: PersonalizationVariables,
        fallbackValues: Record<string, string> = {}
    ): string {
        let personalizedContent = content;

        // Replace all available variables
        Object.entries(variables).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
                personalizedContent = personalizedContent.replace(regex, String(value));
            }
        });

        // Replace any remaining variables with fallback values
        Object.entries(fallbackValues).forEach(([key, value]) => {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
            personalizedContent = personalizedContent.replace(regex, value);
        });

        // Replace any remaining unmatched variables with empty string
        personalizedContent = personalizedContent.replace(/\{\{\s*\w+\s*\}\}/g, '');

        return personalizedContent;
    }

    /**
     * Personalize a message for a specific voter
     */
    public static personalizeMessage(
        message: MessageDocument,
        voter: VoterDocument,
        language: string = 'en'
    ): PersonalizedMessage {
        try {
            // Get voter variables
            const voterVariables = this.getVoterVariables(voter);

            // Get message content for the specified language
            let title = message.title;
            let content = message.content;

            // Check if there's a language variant
            if (message.variants && message.variants.length > 0) {
                const variant = message.variants.find(v =>
                    v.language === language && v.approved
                );

                if (variant) {
                    title = variant.title;
                    content = variant.content;
                }
            }

            // Personalize the content
            const personalizedTitle = this.replaceTemplateVariables(
                title,
                voterVariables,
                message.defaultVariables
            );

            const personalizedContent = this.replaceTemplateVariables(
                content,
                voterVariables,
                message.defaultVariables
            );

            // Create HTML version for email
            const htmlContent = this.createHtmlContent(personalizedTitle, personalizedContent);

            Logger.info(`Message personalized for voter ${voter._id}: ${voter.firstName} ${voter.lastName}`);

            return {
                title: personalizedTitle,
                content: personalizedContent,
                htmlContent
            };

        } catch (error) {
            Logger.error(`Error personalizing message for voter ${voter._id}:`, error);

            // Return fallback content
            return {
                title: message.title,
                content: message.content,
                htmlContent: this.createHtmlContent(message.title, message.content)
            };
        }
    }

    /**
     * Create HTML content for email messages
     */
    private static createHtmlContent(title: string, content: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                </div>
                <div class="content">
                    <p>${content.replace(/\n/g, '</p><p>')}</p>
                </div>
                <div class="footer">
                    <p>This message was sent by the Election Campaign Messaging System.</p>
                    <p>To opt out, reply with "STOP"</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Validate template variables in message content
     */
    public static validateTemplateVariables(content: string): {
        isValid: boolean;
        variables: string[];
        errors: string[];
    } {
        const variables: string[] = [];
        const errors: string[] = [];

        // Extract all template variables from content
        const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
        let match;

        while ((match = variableRegex.exec(content)) !== null) {
            const variableName = match[1];
            if (!variables.includes(variableName)) {
                variables.push(variableName);
            }
        }

        // Validate against supported variables
        const supportedVariables = [
            'voterName', 'firstName', 'lastName', 'constituency',
            'assemblySegment', 'boothNumber', 'age', 'gender',
            'occupation', 'customField'
        ];

        variables.forEach(variable => {
            if (!supportedVariables.includes(variable)) {
                errors.push(`Unsupported template variable: {{${variable}}}`);
            }
        });

        return {
            isValid: errors.length === 0,
            variables,
            errors
        };
    }

    /**
     * Get preview of personalized message
     */
    public static getMessagePreview(
        message: MessageDocument,
        sampleVoter: Partial<VoterDocument>,
        language: string = 'en'
    ): PersonalizedMessage {
        // Create a mock voter document for preview
        const mockVoter = {
            _id: 'preview_voter',
            firstName: sampleVoter.firstName || 'John',
            lastName: sampleVoter.lastName || 'Doe',
            constituency: sampleVoter.constituency || 'Sample Constituency',
            assemblySegment: sampleVoter.assemblySegment || 'Sample Assembly',
            boothNumber: sampleVoter.boothNumber || '001',
            age: sampleVoter.age || 30,
            gender: sampleVoter.gender || 'male',
            occupation: sampleVoter.occupation || 'Professional',
            phoneNumber: sampleVoter.phoneNumber || '9876543210',
            preferredLanguage: sampleVoter.preferredLanguage || 'en',
            contactPreferences: sampleVoter.contactPreferences || {
                sms: true,
                whatsapp: true,
                voiceCall: false,
                email: false
            },
            optOutStatus: false,
            campaigns: [],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastActivityDate: new Date()
        };

        // For preview, we'll create a simple personalized message without full voter object
        const voterVariables = {
            voterName: `${mockVoter.firstName} ${mockVoter.lastName}`.trim(),
            firstName: mockVoter.firstName,
            lastName: mockVoter.lastName,
            constituency: mockVoter.constituency,
            assemblySegment: mockVoter.assemblySegment,
            boothNumber: mockVoter.boothNumber,
            age: mockVoter.age,
            gender: mockVoter.gender,
            occupation: mockVoter.occupation,
            customField: undefined
        };

        // Get message content for the specified language
        let title = message.title;
        let content = message.content;

        // Check if there's a language variant
        if (message.variants && message.variants.length > 0) {
            const variant = message.variants.find(v =>
                v.language === language && v.approved
            );

            if (variant) {
                title = variant.title;
                content = variant.content;
            }
        }

        // Personalize the content
        const personalizedTitle = this.replaceTemplateVariables(
            title,
            voterVariables,
            message.defaultVariables
        );

        const personalizedContent = this.replaceTemplateVariables(
            content,
            voterVariables,
            message.defaultVariables
        );

        // Create HTML version for email
        const htmlContent = this.createHtmlContent(personalizedTitle, personalizedContent);

        return {
            title: personalizedTitle,
            content: personalizedContent,
            htmlContent
        };
    }

    /**
     * Batch personalize messages for multiple voters
     */
    public static batchPersonalizeMessages(
        message: MessageDocument,
        voters: VoterDocument[],
        language: string = 'en'
    ): Array<{ voterId: string; personalizedMessage: PersonalizedMessage }> {
        return voters.map(voter => ({
            voterId: voter._id.toString(),
            personalizedMessage: this.personalizeMessage(message, voter, language)
        }));
    }
}
