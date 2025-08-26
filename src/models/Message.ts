import mongoose, { Document, Schema } from 'mongoose';
import { MessageType, MessageStatus } from '../types';

// Define the Message document interface optimized for campaign messaging
export interface MessageDocument extends Document {
    // Core message fields
    campaignId: mongoose.Types.ObjectId;  // Reference to Campaign
    title: string;                        // Message title/headline
    content: string;                      // Message content (SMS/WhatsApp text)
    messageType: MessageType;             // SMS, WhatsApp, Voice, etc.

    // Targeting and scheduling
    targetAudience: string[];             // Target audience segments
    targetConstituencies: string[];       // Specific constituencies to target
    targetAgeGroups?: string[];           // Age groups to target
    targetLanguages: string[];            // Languages for message variants

    // Scheduling and delivery
    scheduledDate?: Date;                 // When to send the message
    sendWindow?: {                        // Time window for sending
        startTime: string;                // HH:MM format
        endTime: string;                  // HH:MM format
    };
    priority: 'low' | 'medium' | 'high'; // Message priority

    // Message variants for different languages
    variants: [{
        language: string;                 // Language code (en, hi, te, etc.)
        title: string;                    // Translated title
        content: string;                  // Translated content
        approved: boolean;                // Translation approved
    }];

    // Template variables for personalization
    templateVariables: string[];          // Available variables: {{voterName}}, {{constituency}}, etc.
    defaultVariables: Record<string, string>; // Default values for variables

    // Delivery tracking
    status: MessageStatus;                // Draft, Scheduled, Sent, Delivered, Failed
    totalRecipients: number;              // Total number of voters to receive
    sentCount: number;                    // How many actually sent
    deliveredCount: number;               // How many delivered
    failedCount: number;                  // How many failed
    optOutCount: number;                  // How many opted out

    // Campaign metrics
    openRate?: number;                    // For WhatsApp/Email messages
    responseRate?: number;                // Response rate from voters
    positiveResponseCount: number;        // Positive responses
    negativeResponseCount: number;        // Negative responses

    // System fields
    createdBy: string;                    // Who created the message
    approvedBy?: string;                  // Who approved the message
    approvalDate?: Date;                  // When approved
    isActive: boolean;                    // Is message active
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema({
    // Core message fields
    campaignId: {
        type: Schema.Types.ObjectId,
        ref: 'Campaign',
        required: [true, 'Campaign ID is required'],
        index: true
    },
    title: {
        type: String,
        required: [true, 'Message title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [1000, 'Content cannot exceed 1000 characters']
    },
    messageType: {
        type: String,
        enum: Object.values(MessageType),
        required: [true, 'Message type is required'],
        index: true
    },

    // Targeting and scheduling
    targetAudience: [{
        type: String,
        required: [true, 'Target audience is required'],
        trim: true
    }],
    targetConstituencies: [{
        type: String,
        required: [true, 'Target constituencies are required'],
        trim: true,
        index: true
    }],
    targetAgeGroups: [{
        type: String,
        enum: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
        index: true
    }],
    targetLanguages: [{
        type: String,
        enum: ['en', 'hi', 'te', 'ta', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or'],
        default: ['en'],
        index: true
    }],

    // Scheduling and delivery
    scheduledDate: {
        type: Date,
        index: true
    },
    sendWindow: {
        startTime: {
            type: String,
            default: '09:00',
            validate: {
                validator: function (time: string) {
                    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
                },
                message: 'Start time must be in HH:MM format'
            }
        },
        endTime: {
            type: String,
            default: '21:00',
            validate: {
                validator: function (time: string) {
                    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
                },
                message: 'End time must be in HH:MM format'
            }
        }
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
        index: true
    },

    // Message variants for different languages
    variants: [{
        language: {
            type: String,
            required: true,
            enum: ['en', 'hi', 'te', 'ta', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or']
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: [100, 'Translated title cannot exceed 100 characters']
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: [1000, 'Translated content cannot exceed 1000 characters']
        },
        approved: {
            type: Boolean,
            default: false
        }
    }],

    // Template variables for personalization
    templateVariables: [{
        type: String,
        trim: true,
        enum: ['voterName', 'firstName', 'lastName', 'constituency', 'assemblySegment', 'boothNumber', 'age', 'gender', 'occupation', 'customField']
    }],
    defaultVariables: {
        type: Map,
        of: String,
        default: {}
    },

    // Delivery tracking
    status: {
        type: String,
        enum: Object.values(MessageStatus),
        default: MessageStatus.DRAFT,
        required: true,
        index: true
    },
    totalRecipients: {
        type: Number,
        default: 0,
        min: 0
    },
    sentCount: {
        type: Number,
        default: 0,
        min: 0
    },
    deliveredCount: {
        type: Number,
        default: 0,
        min: 0
    },
    failedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    optOutCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // Campaign metrics
    openRate: {
        type: Number,
        min: 0,
        max: 100
    },
    responseRate: {
        type: Number,
        min: 0,
        max: 100
    },
    positiveResponseCount: {
        type: Number,
        default: 0,
        min: 0
    },
    negativeResponseCount: {
        type: Number,
        default: 0,
        min: 0
    },

    // System fields
    createdBy: {
        type: String,
        required: [true, 'Message creator is required'],
        trim: true,
        index: true
    },
    approvedBy: {
        type: String,
        trim: true
    },
    approvalDate: Date,
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'messages'
});

// Indexes for optimized queries
MessageSchema.index({ campaignId: 1, status: 1 });                    // Campaign + status queries
MessageSchema.index({ scheduledDate: 1, status: 1 });                // Scheduled messages
MessageSchema.index({ targetConstituencies: 1, status: 1 });          // Constituency targeting
MessageSchema.index({ messageType: 1, status: 1 });                  // Message type + status
MessageSchema.index({ priority: 1, scheduledDate: 1 });              // Priority scheduling
MessageSchema.index({ createdBy: 1, createdAt: -1 });                // Creator's messages
MessageSchema.index({ 'variants.language': 1, status: 1 });          // Language-based queries

// Compound indexes for complex queries
MessageSchema.index({
    campaignId: 1,
    targetConstituencies: 1,
    status: 1
}); // Campaign targeting queries

MessageSchema.index({
    scheduledDate: 1,
    priority: 1,
    status: 1
}); // Priority scheduling

// Text index for search functionality
MessageSchema.index({
    title: 'text',
    content: 'text',
    targetAudience: 'text'
});

// Virtual for delivery rate
MessageSchema.virtual('deliveryRate').get(function () {
    if (this.totalRecipients === 0) return 0;
    return Math.round((this.deliveredCount / this.totalRecipients) * 100);
});

// Virtual for success rate
MessageSchema.virtual('successRate').get(function () {
    if (this.totalRecipients === 0) return 0;
    const successful = this.deliveredCount + this.optOutCount;
    return Math.round((successful / this.totalRecipients) * 100);
});

// Virtual for isReadyToSend
MessageSchema.virtual('isReadyToSend').get(function () {
    if (this.status !== MessageStatus.SCHEDULED) return false;
    if (!this.scheduledDate) return false;

    const now = new Date();
    const scheduled = new Date(this.scheduledDate);

    // Check if scheduled time has passed
    if (scheduled > now) return false;

    // Check if within send window
    if (this.sendWindow) {
        const currentTime = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
        if (currentTime < this.sendWindow.startTime || currentTime > this.sendWindow.endTime) {
            return false;
        }
    }

    return true;
});

// Pre-save middleware for validation
MessageSchema.pre('save', function (next) {
    // Validate send window
    if (this.sendWindow && this.sendWindow.startTime >= this.sendWindow.endTime) {
        next(new Error('Start time must be before end time'));
        return;
    }

    // Validate scheduled date is in the future
    if (this.scheduledDate && this.scheduledDate <= new Date()) {
        next(new Error('Scheduled date must be in the future'));
        return;
    }

    // Ensure variants exist for target languages
    if (this.targetLanguages && this.targetLanguages.length > 0) {
        const hasVariants = this.variants.some(v =>
            this.targetLanguages.includes(v.language)
        );
        if (!hasVariants) {
            next(new Error('Message variants must exist for all target languages'));
            return;
        }
    }

    next();
});

// Static method to find messages ready to send
MessageSchema.statics.findReadyToSend = function () {
    const now = new Date();

    return this.find({
        status: MessageStatus.SCHEDULED,
        scheduledDate: { $lte: now },
        isActive: true
    }).populate('campaignId', 'name status');
};

// Static method to find messages by campaign
MessageSchema.statics.findByCampaign = function (campaignId: string, options: any = {}) {
    const query: any = { campaignId };

    if (options.status) query.status = options.status;
    if (options.messageType) query.messageType = options.messageType;
    if (options.isActive !== undefined) query.isActive = options.isActive;

    return this.find(query).sort({ createdAt: -1 });
};

// Static method to find messages by constituency
MessageSchema.statics.findByConstituency = function (constituency: string, options: any = {}) {
    const query: any = {
        targetConstituencies: constituency,
        isActive: true
    };

    if (options.status) query.status = options.status;
    if (options.messageType) query.messageType = options.messageType;

    return this.find(query).sort({ scheduledDate: -1 });
};

// Instance method to approve message
MessageSchema.methods.approve = function (approvedBy: string) {
    this.status = MessageStatus.SCHEDULED;
    this.approvedBy = approvedBy;
    this.approvalDate = new Date();
    return this.save();
};

// Instance method to schedule message
MessageSchema.methods.schedule = function (scheduledDate: Date) {
    this.status = MessageStatus.SCHEDULED;
    this.scheduledDate = scheduledDate;
    return this.save();
};

// Instance method to update delivery counts
MessageSchema.methods.updateDeliveryCounts = function (sent: number, delivered: number, failed: number, optOut: number) {
    this.sentCount = sent;
    this.deliveredCount = delivered;
    this.failedCount = failed;
    this.optOutCount = optOut;

    // Update status if all messages processed
    if (this.sentCount >= this.totalRecipients) {
        this.status = MessageStatus.SENT;
    }

    return this.save();
};

// Instance method to add language variant
MessageSchema.methods.addVariant = function (language: string, title: string, content: string) {
    const existingVariant = this.variants.find(v => v.language === language);

    if (existingVariant) {
        existingVariant.title = title;
        existingVariant.content = content;
        existingVariant.approved = false; // Reset approval for new content
    } else {
        this.variants.push({
            language,
            title,
            content,
            approved: false
        });
    }

    return this.save();
};

// Export the model
export const Message = mongoose.model<MessageDocument>('Message', MessageSchema); 