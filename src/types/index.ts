// Core types for the Election Campaign Messaging System

export interface Campaign {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: CampaignStatus;
    targetAudience: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    campaignId: string;
    title: string;
    content: string;
    type: MessageType;
    scheduledDate?: Date;
    status: MessageStatus;
    targetAudience: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface VoterContact {
    id: string;
    voterId: string;
    campaignId: string;
    messageId: string;
    contactMethod: ContactMethod;
    status: ContactStatus;
    sentAt?: Date;
    deliveredAt?: Date;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Voter {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    votingPreference?: string;
    demographics: VoterDemographics;
    createdAt: Date;
    updatedAt: Date;
}

export interface VoterDemographics {
    age: number;
    gender?: string;
    ethnicity?: string;
    education?: string;
    income?: string;
    location: string;
}

export enum CampaignStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum MessageType {
    EMAIL = 'email',
    SMS = 'sms',
    PUSH_NOTIFICATION = 'push_notification',
    SOCIAL_MEDIA = 'social_media'
}

export enum MessageStatus {
    DRAFT = 'draft',
    SCHEDULED = 'scheduled',
    SENT = 'sent',
    DELIVERED = 'delivered',
    FAILED = 'failed'
}

export enum ContactMethod {
    EMAIL = 'email',
    SMS = 'sms',
    PHONE = 'phone',
    MAIL = 'mail'
}

export enum ContactStatus {
    PENDING = 'pending',
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
    OPTED_OUT = 'opted_out'
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
    timestamp: Date;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
} 