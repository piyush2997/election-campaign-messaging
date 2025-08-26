import mongoose, { Document, Schema, Model } from 'mongoose';
import { CampaignStatus } from '../types';

// Define the Campaign document interface
export interface CampaignDocument extends Document {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    status: CampaignStatus;
    targetAudience: string[];
    createdBy: string;
    budget?: number;
    tags?: string[];
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;

    // Instance methods
    activate(): Promise<CampaignDocument>;
    pause(): Promise<CampaignDocument>;
    complete(): Promise<CampaignDocument>;
}

// Define the Campaign model interface with static methods
export interface CampaignModel extends Model<CampaignDocument> {
    findActiveCampaigns(): Promise<CampaignDocument[]>;
    findByTargetAudience(audience: string): Promise<CampaignDocument[]>;
}

const CampaignSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Campaign name is required'],
        trim: true,
        maxLength: [200, 'Campaign name cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Campaign description is required'],
        trim: true,
        maxLength: [1000, 'Campaign description cannot exceed 1000 characters']
    },
    startDate: {
        type: Date,
        required: [true, 'Campaign start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'Campaign end date is required']
    },
    status: {
        type: String,
        enum: Object.values(CampaignStatus),
        default: CampaignStatus.DRAFT,
        required: true
    },
    targetAudience: [{
        type: String,
        required: [true, 'Target audience is required'],
        trim: true
    }],
    createdBy: {
        type: String,
        required: [true, 'Campaign creator is required'],
        trim: true
    },
    budget: {
        type: Number,
        min: [0, 'Budget cannot be negative'],
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'campaigns'
});

// Indexes for better query performance
CampaignSchema.index({ name: 1 });
CampaignSchema.index({ status: 1 });
CampaignSchema.index({ startDate: 1, endDate: 1 });
CampaignSchema.index({ targetAudience: 1 });
CampaignSchema.index({ createdBy: 1 });
CampaignSchema.index({ isActive: 1 });
CampaignSchema.index({ createdAt: -1 });

// Compound indexes for common queries
CampaignSchema.index({ status: 1, startDate: 1 });
CampaignSchema.index({ status: 1, endDate: 1 });
CampaignSchema.index({ targetAudience: 1, status: 1 });

// Virtual for campaign duration
CampaignSchema.virtual('duration').get(function () {
    if (this.startDate && this.endDate) {
        const timeDiff = this.endDate.getTime() - this.startDate.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
    return 0;
});

// Pre-save middleware for validation
CampaignSchema.pre('save', function (next) {
    if (this.isModified('startDate') || this.isModified('endDate')) {
        if (this.startDate >= this.endDate) {
            next(new Error('Start date must be before end date'));
        }
    }
    next();
});

// Static method to find active campaigns
CampaignSchema.statics.findActiveCampaigns = function () {
    const now = new Date();
    return this.find({
        status: CampaignStatus.ACTIVE,
        startDate: { $lte: now },
        endDate: { $gte: now },
        isActive: true
    });
};

// Static method to find campaigns by target audience
CampaignSchema.statics.findByTargetAudience = function (audience: string) {
    return this.find({
        targetAudience: audience,
        status: CampaignStatus.ACTIVE,
        isActive: true
    });
};

// Instance method to activate campaign
CampaignSchema.methods.activate = function () {
    if (this.status !== CampaignStatus.DRAFT) {
        throw new Error('Only draft campaigns can be activated');
    }

    if (this.startDate <= new Date()) {
        throw new Error('Cannot activate campaign with past start date');
    }

    this.status = CampaignStatus.ACTIVE;
    return this.save();
};

// Instance method to pause campaign
CampaignSchema.methods.pause = function () {
    if (this.status !== CampaignStatus.ACTIVE) {
        throw new Error('Only active campaigns can be paused');
    }

    this.status = CampaignStatus.PAUSED;
    return this.save();
};

// Instance method to complete campaign
CampaignSchema.methods.complete = function () {
    if (this.status !== CampaignStatus.ACTIVE && this.status !== CampaignStatus.PAUSED) {
        throw new Error('Only active or paused campaigns can be completed');
    }

    this.status = CampaignStatus.COMPLETED;
    return this.save();
};

// Export the model
export const Campaign = mongoose.model<CampaignDocument, CampaignModel>('Campaign', CampaignSchema); 