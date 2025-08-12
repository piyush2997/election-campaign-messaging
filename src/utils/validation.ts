import { Campaign, Message, Voter, CampaignStatus, MessageStatus } from '../types';

/**
 * Validates if a campaign object is valid
 * @param campaign - The campaign object to validate
 * @returns Object containing validation result and any errors
 */
export function validateCampaign(campaign: Campaign): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!campaign.name || campaign.name.trim().length === 0) {
        errors.push('Campaign name is required');
    }

    if (!campaign.description || campaign.description.trim().length === 0) {
        errors.push('Campaign description is required');
    }

    if (campaign.startDate >= campaign.endDate) {
        errors.push('Start date must be before end date');
    }

    if (campaign.startDate < new Date()) {
        errors.push('Start date cannot be in the past');
    }

    if (!campaign.targetAudience || campaign.targetAudience.length === 0) {
        errors.push('Target audience is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates if a message object is valid
 * @param message - The message object to validate
 * @returns Object containing validation result and any errors
 */
export function validateMessage(message: Message): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!message.title || message.title.trim().length === 0) {
        errors.push('Message title is required');
    }

    if (!message.content || message.content.trim().length === 0) {
        errors.push('Message content is required');
    }

    if (!message.campaignId) {
        errors.push('Campaign ID is required');
    }

    if (message.scheduledDate && message.scheduledDate < new Date()) {
        errors.push('Scheduled date cannot be in the past');
    }

    if (!message.targetAudience || message.targetAudience.length === 0) {
        errors.push('Target audience is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates if a voter object is valid
 * @param voter - The voter object to validate
 * @returns Object containing validation result and any errors
 */
export function validateVoter(voter: Voter): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!voter.firstName || voter.firstName.trim().length === 0) {
        errors.push('First name is required');
    }

    if (!voter.lastName || voter.lastName.trim().length === 0) {
        errors.push('Last name is required');
    }

    if (voter.email && !isValidEmail(voter.email)) {
        errors.push('Invalid email format');
    }

    if (voter.phone && !isValidPhone(voter.phone)) {
        errors.push('Invalid phone format');
    }

    if (voter.demographics.age < 18 || voter.demographics.age > 120) {
        errors.push('Age must be between 18 and 120');
    }

    if (!voter.demographics.location || voter.demographics.location.trim().length === 0) {
        errors.push('Location is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Checks if a campaign can be activated
 * @param campaign - The campaign to check
 * @returns True if campaign can be activated
 */
export function canActivateCampaign(campaign: Campaign): boolean {
    if (campaign.status !== CampaignStatus.DRAFT) {
        return false;
    }

    const validation = validateCampaign(campaign);
    return validation.isValid;
}

/**
 * Checks if a message can be sent
 * @param message - The message to check
 * @returns True if message can be sent
 */
export function canSendMessage(message: Message): boolean {
    if (message.status !== MessageStatus.SCHEDULED) {
        return false;
    }

    if (message.scheduledDate && message.scheduledDate > new Date()) {
        return false;
    }

    const validation = validateMessage(message);
    return validation.isValid;
}

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns True if email format is valid
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone format
 * @param phone - Phone string to validate
 * @returns True if phone format is valid
 */
function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Calculates campaign duration in days
 * @param campaign - The campaign to calculate duration for
 * @returns Duration in days
 */
export function calculateCampaignDuration(campaign: Campaign): number {
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Formats a date for display
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
} 