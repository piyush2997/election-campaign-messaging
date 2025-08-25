import mongoose, { Document, Schema, Model } from 'mongoose';

// Define the Voter document interface optimized for campaign messaging
export interface VoterDocument extends Document {
    // Core identification fields (for fast lookups)
    boothNumber: string;           // Polling booth number - primary lookup field
    phoneNumber: string;           // Phone number - secondary lookup field
    voterId: string;               // Official voter ID (optional but useful)

    // Essential campaign messaging fields
    firstName: string;             // Required for personalization
    lastName: string;              // Required for personalization
    constituency: string;          // Required for campaign targeting
    assemblySegment?: string;      // Optional: more specific area targeting

    // Contact preferences and opt-outs
    preferredLanguage: string;     // Default: 'en', options: 'en', 'hi', 'te', etc.
    contactPreferences: {
        sms: boolean;              // Default: true
        whatsapp: boolean;         // Default: true
        voiceCall: boolean;        // Default: false
        email: boolean;            // Default: false
    };
    optOutStatus: boolean;         // Default: false - global opt-out

    // Campaign engagement tracking
    campaigns: [{
        campaignId: mongoose.Types.ObjectId;
        status: 'active' | 'paused' | 'completed';
        lastContactDate?: Date;
        contactCount: number;      // How many times contacted in this campaign
        responseStatus?: 'none' | 'positive' | 'negative' | 'neutral';
        notes?: string;            // Field agent notes
    }];

    // Demographics (minimal but useful for targeting)
    age?: number;                  // Optional: age group for targeting
    gender?: 'male' | 'female' | 'other';
    occupation?: string;           // Optional: for message personalization

    // Voting behavior (for campaign strategy)
    votingHistory?: {
        lastElection: string;      // e.g., "2019", "2024"
        voted: boolean;            // Did they vote in last election?
        party?: string;            // Optional: if known
    };

    // System fields
    isActive: boolean;             // Default: true
    createdAt: Date;
    updatedAt: Date;
    lastActivityDate: Date;        // Last time any action was taken

    // Instance methods
    addCampaign(campaignId: string): Promise<VoterDocument>;
    updateContactStatus(campaignId: string, responseStatus: string, notes?: string): Promise<VoterDocument>;
    optOut(): Promise<VoterDocument>;
}

const VoterSchema = new Schema({
    // Core identification fields with indexes for fast lookups
    boothNumber: {
        type: String,
        required: [true, 'Booth number is required for voter identification'],
        trim: true,
        uppercase: true,
        index: true // Primary lookup index
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required for campaign messaging'],
        trim: true,
        unique: true, // Ensure unique phone numbers
        index: true,  // Secondary lookup index
        validate: {
            validator: function (phone: string) {
                // Basic Indian phone number validation
                const phoneRegex = /^[6-9]\d{9}$/;
                return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
            },
            message: 'Please enter a valid 10-digit Indian phone number'
        }
    },
    voterId: {
        type: String,
        trim: true,
        sparse: true, // Allow multiple null values
        index: true
    },

    // Essential campaign messaging fields
    firstName: {
        type: String,
        required: [true, 'First name is required for personalization'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required for personalization'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    constituency: {
        type: String,
        required: [true, 'Constituency is required for campaign targeting'],
        trim: true,
        index: true // For constituency-based queries
    },
    assemblySegment: {
        type: String,
        trim: true,
        index: true
    },

    // Contact preferences
    preferredLanguage: {
        type: String,
        default: 'en',
        enum: ['en', 'hi', 'te', 'ta', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or'],
        index: true
    },
    contactPreferences: {
        sms: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: true },
        voiceCall: { type: Boolean, default: false },
        email: { type: Boolean, default: false }
    },
    optOutStatus: {
        type: Boolean,
        default: false,
        index: true
    },

    // Campaign engagement tracking
    campaigns: [{
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: 'Campaign',
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'paused', 'completed'],
            default: 'active'
        },
        lastContactDate: Date,
        contactCount: {
            type: Number,
            default: 0,
            min: 0
        },
        responseStatus: {
            type: String,
            enum: ['none', 'positive', 'negative', 'neutral'],
            default: 'none'
        },
        notes: {
            type: String,
            maxlength: [500, 'Notes cannot exceed 500 characters']
        }
    }],

    // Demographics
    age: {
        type: Number,
        min: [18, 'Voter must be at least 18 years old'],
        max: [120, 'Invalid age value'],
        index: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        index: true
    },
    occupation: {
        type: String,
        trim: true,
        maxlength: [100, 'Occupation cannot exceed 100 characters']
    },

    // Voting behavior
    votingHistory: {
        lastElection: {
            type: String,
            trim: true
        },
        voted: Boolean,
        party: {
            type: String,
            trim: true
        }
    },

    // System fields
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    lastActivityDate: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'voters'
});

// Compound indexes for optimized queries
VoterSchema.index({ boothNumber: 1, constituency: 1 });           // Booth + constituency lookups
VoterSchema.index({ constituency: 1, isActive: 1 });             // Active voters by constituency
VoterSchema.index({ phoneNumber: 1, isActive: 1 });              // Active voters by phone
VoterSchema.index({ preferredLanguage: 1, isActive: 1 });        // Voters by language preference
VoterSchema.index({ age: 1, gender: 1, isActive: 1 });           // Demographics targeting
VoterSchema.index({ 'campaigns.campaignId': 1, 'campaigns.status': 1 }); // Campaign-based queries
VoterSchema.index({ lastActivityDate: -1 });                     // Recent activity

// Text index for search functionality
VoterSchema.index({
    firstName: 'text',
    lastName: 'text',
    constituency: 'text',
    assemblySegment: 'text'
});

// Virtual for full name
VoterSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for age group (useful for targeting)
VoterSchema.virtual('ageGroup').get(function () {
    if (!this.age) return 'unknown';
    if (this.age < 25) return '18-24';
    if (this.age < 35) return '25-34';
    if (this.age < 45) return '35-44';
    if (this.age < 55) return '45-54';
    if (this.age < 65) return '55-64';
    return '65+';
});

// Virtual for contactable status
VoterSchema.virtual('isContactable').get(function () {
    return this.isActive && !this.optOutStatus && this.phoneNumber;
});

// Pre-save middleware for validation
VoterSchema.pre('save', function (next) {
    // Update last activity date
    this.lastActivityDate = new Date();

    // Validate phone number format
    if (this.phoneNumber) {
        const cleanPhone = this.phoneNumber.replace(/[\s\-\(\)]/g, '');
        if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
            next(new Error('Invalid phone number format'));
            return;
        }
    }

    next();
});

// Static method to find voters by booth
VoterSchema.statics.findByBooth = function (boothNumber: string, constituency?: string) {
    const query: any = { boothNumber: boothNumber.toUpperCase() };
    if (constituency) query.constituency = constituency;

    return this.find(query).where('isActive', true);
};

// Static method to find voters by phone
VoterSchema.statics.findByPhone = function (phoneNumber: string) {
    return this.findOne({
        phoneNumber: phoneNumber.replace(/[\s\-\(\)]/g, ''),
        isActive: true
    });
};

// Static method to find contactable voters for a campaign
VoterSchema.statics.findContactableForCampaign = function (campaignId: string, constituency?: string) {
    const query: any = {
        isActive: true,
        optOutStatus: false,
        'campaigns.campaignId': campaignId,
        'campaigns.status': 'active'
    };

    if (constituency) query.constituency = constituency;

    return this.find(query).where('phoneNumber').exists();
};

// Static method to find voters by constituency
VoterSchema.statics.findByConstituency = function (constituency: string, options: any = {}) {
    const query: any = { constituency, isActive: true };

    if (options.assemblySegment) query.assemblySegment = options.assemblySegment;
    if (options.preferredLanguage) query.preferredLanguage = options.preferredLanguage;
    if (options.ageGroup) {
        const ageRanges: { [key: string]: { min: number, max: number } } = {
            '18-24': { min: 18, max: 24 },
            '25-34': { min: 25, max: 34 },
            '35-44': { min: 35, max: 44 },
            '45-54': { min: 45, max: 54 },
            '55-64': { min: 55, max: 64 },
            '65+': { min: 65, max: 120 }
        };

        if (ageRanges[options.ageGroup]) {
            const range = ageRanges[options.ageGroup];
            query.age = { $gte: range.min, $lte: range.max };
        }
    }

    return this.find(query);
};

// Instance method to add campaign
VoterSchema.methods.addCampaign = function (campaignId: string) {
    const existingCampaign = this.campaigns.find(
        (c: any) => c.campaignId.toString() === campaignId
    );

    if (existingCampaign) {
        existingCampaign.status = 'active';
        existingCampaign.lastContactDate = new Date();
    } else {
        this.campaigns.push({
            campaignId: new mongoose.Types.ObjectId(campaignId),
            status: 'active',
            lastContactDate: new Date(),
            contactCount: 0
        });
    }

    return this.save();
};

// Instance method to update contact status
VoterSchema.methods.updateContactStatus = function (campaignId: string, responseStatus: string, notes?: string) {
    const campaign = this.campaigns.find(
        (c: any) => c.campaignId.toString() === campaignId
    );

    if (campaign) {
        campaign.lastContactDate = new Date();
        campaign.contactCount += 1;
        campaign.responseStatus = responseStatus;
        if (notes) campaign.notes = notes;
    }

    return this.save();
};

// Instance method to opt out
VoterSchema.methods.optOut = function () {
    this.optOutStatus = true;
    this.lastActivityDate = new Date();
    return this.save();
};

// Interface for Voter static methods
export interface VoterModel extends Model<VoterDocument> {
    findByBooth(boothNumber: string, constituency?: string): Promise<VoterDocument[]>;
    findByPhone(phoneNumber: string): Promise<VoterDocument | null>;
    findContactableForCampaign(campaignId: string, constituency?: string): Promise<VoterDocument[]>;
    findByConstituency(constituency: string, options?: any): Promise<VoterDocument[]>;
}

// Export the model with proper typing
export const Voter = mongoose.model<VoterDocument, VoterModel>('Voter', VoterSchema); 