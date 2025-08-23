import mongoose, { Document, Schema } from 'mongoose';
import { ContactMethod, ContactStatus } from '../types';

// Define the VoterContact document interface for tracking individual contacts
export interface VoterContactDocument extends Document {
    // Core identification
    voterId: mongoose.Types.ObjectId;     // Reference to Voter
    campaignId: mongoose.Types.ObjectId;  // Reference to Campaign
    messageId: mongoose.Types.ObjectId;   // Reference to Message

    // Contact details
    contactMethod: ContactMethod;         // SMS, WhatsApp, Voice, Email
    contactStatus: ContactStatus;         // Pending, Sent, Delivered, Read, Failed, Opted Out
    language: string;                     // Language used for this contact

    // Delivery tracking
    scheduledAt?: Date;                   // When contact was scheduled
    sentAt?: Date;                        // When actually sent
    deliveredAt?: Date;                   // When delivered
    readAt?: Date;                        // When read (for WhatsApp/Email)

    // Response tracking
    responseStatus?: 'none' | 'positive' | 'negative' | 'neutral' | 'opt_out';
    responseText?: string;                // Text response from voter
    responseTime?: Date;                  // When response received
    responseChannel?: string;             // How they responded

    // Engagement metrics
    openCount: number;                    // How many times opened/read
    clickCount: number;                   // How many links clicked (if applicable)
    replyCount: number;                   // How many times replied

    // Cost and billing
    cost?: number;                        // Cost of this contact
    currency?: string;                    // Currency for cost

    // Error tracking
    errorCode?: string;                   // Error code if failed
    errorMessage?: string;                // Error description
    retryCount: number;                   // Number of retry attempts

    // System fields
    isActive: boolean;                    // Is contact record active
    createdAt: Date;
    updatedAt: Date;
}

const VoterContactSchema = new Schema({
    // Core identification
    voterId: {
        type: Schema.Types.ObjectId,
        ref: 'Voter',
        required: [true, 'Voter ID is required'],
        index: true
    },
    campaignId: {
        type: Schema.Types.ObjectId,
        ref: 'Campaign',
        required: [true, 'Campaign ID is required'],
        index: true
    },
    messageId: {
        type: Schema.Types.ObjectId,
        ref: 'Message',
        required: [true, 'Message ID is required'],
        index: true
    },

    // Contact details
    contactMethod: {
        type: String,
        enum: Object.values(ContactMethod),
        required: [true, 'Contact method is required'],
        index: true
    },
    contactStatus: {
        type: String,
        enum: Object.values(ContactStatus),
        default: ContactStatus.PENDING,
        required: true,
        index: true
    },
    language: {
        type: String,
        enum: ['en', 'hi', 'te', 'ta', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or'],
        default: 'en',
        required: true,
        index: true
    },

    // Delivery tracking
    scheduledAt: {
        type: Date,
        index: true
    },
    sentAt: {
        type: Date,
        index: true
    },
    deliveredAt: {
        type: Date,
        index: true
    },
    readAt: {
        type: Date,
        index: true
    },

    // Response tracking
    responseStatus: {
        type: String,
        enum: ['none', 'positive', 'negative', 'neutral', 'opt_out'],
        default: 'none',
        index: true
    },
    responseText: {
        type: String,
        maxlength: [1000, 'Response text cannot exceed 1000 characters']
    },
    responseTime: {
        type: Date,
        index: true
    },
    responseChannel: {
        type: String,
        trim: true
    },

    // Engagement metrics
    openCount: {
        type: Number,
        default: 0,
        min: 0
    },
    clickCount: {
        type: Number,
        default: 0,
        min: 0
    },
    replyCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Cost and billing
    cost: {
        type: Number,
        min: 0
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR']
    },

    // Error tracking
    errorCode: {
        type: String,
        trim: true
    },
    errorMessage: {
        type: String,
        maxlength: [500, 'Error message cannot exceed 500 characters']
    },
    retryCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // System fields
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'voter_contacts'
});

// Indexes for optimized queries
VoterContactSchema.index({ voterId: 1, campaignId: 1 });                    // Voter + campaign queries
VoterContactSchema.index({ campaignId: 1, contactStatus: 1 });              // Campaign status queries
VoterContactSchema.index({ messageId: 1, contactStatus: 1 });               // Message delivery queries
VoterContactSchema.index({ contactMethod: 1, contactStatus: 1 });           // Method + status queries
VoterContactSchema.index({ scheduledAt: 1, contactStatus: 1 });             // Scheduled contacts
VoterContactSchema.index({ sentAt: 1, contactStatus: 1 });                  // Sent contacts
VoterContactSchema.index({ responseStatus: 1, createdAt: -1 });             // Response analysis
VoterContactSchema.index({ language: 1, contactStatus: 1 });                // Language-based queries

// Compound indexes for complex queries
VoterContactSchema.index({
    campaignId: 1,
    contactMethod: 1,
    contactStatus: 1
}); // Campaign delivery analysis

VoterContactSchema.index({
    voterId: 1,
    contactMethod: 1,
    createdAt: -1
}); // Voter contact history

VoterContactSchema.index({
    scheduledAt: 1,
    priority: 1,
    contactStatus: 1
}); // Priority scheduling

// Virtual for delivery time
VoterContactSchema.virtual('deliveryTime').get(function () {
    if (this.sentAt && this.deliveredAt) {
        return this.deliveredAt.getTime() - this.sentAt.getTime();
    }
    return null;
});

// Virtual for response time
VoterContactSchema.virtual('responseTimeMs').get(function () {
    if (this.sentAt && this.responseTime) {
        return this.responseTime.getTime() - this.sentAt.getTime();
    }
    return null;
});

// Virtual for isDelivered
VoterContactSchema.virtual('isDelivered').get(function () {
    return this.contactStatus === ContactStatus.DELIVERED ||
        this.contactStatus === ContactStatus.READ;
});

// Virtual for isEngaged
VoterContactSchema.virtual('isEngaged').get(function () {
    return this.openCount > 0 || this.clickCount > 0 || this.replyCount > 0;
});

// Pre-save middleware for validation
VoterContactSchema.pre('save', function (next) {
    // Update timestamps based on status changes
    if (this.isModified('contactStatus')) {
        const now = new Date();

        switch (this.contactStatus) {
            case ContactStatus.SENT:
                this.sentAt = now;
                break;
            case ContactStatus.DELIVERED:
                this.deliveredAt = now;
                break;
            case ContactStatus.READ:
                this.readAt = now;
                break;
        }
    }

    // Validate scheduled time is in the future
    if (this.scheduledAt && this.scheduledAt <= new Date()) {
        next(new Error('Scheduled time must be in the future'));
        return;
    }

    next();
});

// Static method to find pending contacts
VoterContactSchema.statics.findPendingContacts = function () {
    return this.find({
        contactStatus: ContactStatus.PENDING,
        isActive: true
    }).populate('voterId', 'phoneNumber firstName lastName preferredLanguage')
        .populate('messageId', 'content variants')
        .populate('campaignId', 'name');
};

// Static method to find contacts by campaign
VoterContactSchema.statics.findByCampaign = function (campaignId: string, options: any = {}) {
    const query: any = { campaignId };

    if (options.contactStatus) query.contactStatus = options.contactStatus;
    if (options.contactMethod) query.contactMethod = options.contactMethod;
    if (options.language) query.language = options.language;
    if (options.isActive !== undefined) query.isActive = options.isActive;

    return this.find(query).populate('voterId', 'firstName lastName phoneNumber')
        .populate('messageId', 'title content')
        .sort({ createdAt: -1 });
};

// Static method to find contacts by voter
VoterContactSchema.statics.findByVoter = function (voterId: string, options: any = {}) {
    const query: any = { voterId };

    if (options.campaignId) query.campaignId = options.campaignId;
    if (options.contactStatus) query.contactStatus = options.contactStatus;
    if (options.contactMethod) query.contactMethod = options.contactMethod;

    return this.find(query).populate('campaignId', 'name')
        .populate('messageId', 'title content')
        .sort({ createdAt: -1 });
};

// Static method to find failed contacts for retry
VoterContactSchema.statics.findFailedForRetry = function (maxRetries: number = 3) {
    return this.find({
        contactStatus: ContactStatus.FAILED,
        retryCount: { $lt: maxRetries },
        isActive: true
    }).populate('voterId', 'phoneNumber')
        .populate('messageId', 'content');
};

// Instance method to mark as sent
VoterContactSchema.methods.markAsSent = function () {
    this.contactStatus = ContactStatus.SENT;
    this.sentAt = new Date();
    return this.save();
};

// Instance method to mark as delivered
VoterContactSchema.methods.markAsDelivered = function () {
    this.contactStatus = ContactStatus.DELIVERED;
    this.deliveredAt = new Date();
    return this.save();
};

// Instance method to mark as read
VoterContactSchema.methods.markAsRead = function () {
    this.contactStatus = ContactStatus.READ;
    this.readAt = new Date();
    this.openCount += 1;
    return this.save();
};

// Instance method to mark as failed
VoterContactSchema.methods.markAsFailed = function (errorCode: string, errorMessage: string) {
    this.contactStatus = ContactStatus.FAILED;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
    this.retryCount += 1;
    return this.save();
};

// Instance method to record response
VoterContactSchema.methods.recordResponse = function (responseStatus: string, responseText?: string, responseChannel?: string) {
    this.responseStatus = responseStatus;
    this.responseText = responseText;
    this.responseChannel = responseChannel;
    this.responseTime = new Date();

    if (responseStatus === 'opt_out') {
        this.contactStatus = ContactStatus.OPTED_OUT;
    }

    return this.save();
};

// Instance method to record engagement
VoterContactSchema.methods.recordEngagement = function (type: 'open' | 'click' | 'reply') {
    switch (type) {
        case 'open':
            this.openCount += 1;
            break;
        case 'click':
            this.clickCount += 1;
            break;
        case 'reply':
            this.replyCount += 1;
            break;
    }

    return this.save();
};

// Export the model
export const VoterContact = mongoose.model<VoterContactDocument>('VoterContact', VoterContactSchema); 