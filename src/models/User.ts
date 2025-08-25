import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// User roles for access control
export enum UserRole {
    ADMIN = 'admin',
    CAMPAIGN_MANAGER = 'campaign_manager',
    CAMPAIGN_ANALYST = 'campaign_analyst',
    CAMPAIGN_OPERATOR = 'campaign_operator',
    VIEWER = 'viewer'
}

// User status
export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    PENDING_VERIFICATION = 'pending_verification'
}

// Campaign permissions
export interface CampaignPermission {
    campaignId: mongoose.Types.ObjectId;
    permissions: string[]; // ['read', 'write', 'delete', 'approve', 'schedule']
    grantedAt: Date;
    grantedBy: mongoose.Types.ObjectId;
}

// User document interface
export interface IUser extends Document {
    // Basic Information
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    username: string;

    // Authentication
    password: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    emailVerificationToken?: string;
    emailVerified: boolean;
    lastLoginAt?: Date;

    // Role and Access Control
    role: UserRole;
    status: UserStatus;
    permissions: string[];
    campaignPermissions: CampaignPermission[];

    // Organization and Campaign Access
    organizationId?: mongoose.Types.ObjectId;
    managedCampaigns: mongoose.Types.ObjectId[];
    accessibleCampaigns: mongoose.Types.ObjectId[];

    // Profile and Preferences
    profilePicture?: string;
    timezone: string;
    language: string;
    notificationPreferences: {
        email: boolean;
        sms: boolean;
        push: boolean;
        campaignUpdates: boolean;
        systemAlerts: boolean;
    };

    // Security and Audit
    loginAttempts: number;
    lockUntil?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    lastPasswordChange: Date;
    failedLoginAttempts: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    lastActivityAt: Date;

    // Instance methods
    comparePassword(candidatePassword: string): Promise<boolean>;
    generatePasswordResetToken(): string;
    generateEmailVerificationToken(): string;
    incrementLoginAttempts(): void;
    resetLoginAttempts(): void;
    isLocked(): boolean;
    lockAccount(): void;
    unlockAccount(): void;
    hasPermission(permission: string): boolean;
    hasCampaignPermission(campaignId: string, permission: string): boolean;
    addCampaignPermission(campaignId: string, permissions: string[]): void;
    removeCampaignPermission(campaignId: string): void;
    getFullName(): string;
    isActive(): boolean;
    canManageCampaigns(): boolean;
    canViewDashboard(): boolean;
}

// User schema
const userSchema = new Schema<IUser>({
    // Basic Information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters'],
        match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
    },

    // Authentication
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLoginAt: Date,

    // Role and Access Control
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.CAMPAIGN_OPERATOR
    },
    status: {
        type: String,
        enum: Object.values(UserStatus),
        default: UserStatus.PENDING_VERIFICATION
    },
    permissions: [{
        type: String,
        enum: [
            'campaign:create',
            'campaign:read',
            'campaign:update',
            'campaign:delete',
            'campaign:approve',
            'campaign:schedule',
            'voter:read',
            'voter:create',
            'voter:update',
            'voter:delete',
            'message:create',
            'message:read',
            'message:update',
            'message:delete',
            'message:approve',
            'message:schedule',
            'user:read',
            'user:create',
            'user:update',
            'user:delete',
            'dashboard:view',
            'analytics:view',
            'reports:generate'
        ]
    }],
    campaignPermissions: [{
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: 'Campaign',
            required: true
        },
        permissions: [{
            type: String,
            enum: ['read', 'write', 'delete', 'approve', 'schedule']
        }],
        grantedAt: {
            type: Date,
            default: Date.now
        },
        grantedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],

    // Organization and Campaign Access
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization' // Future extension
    },
    managedCampaigns: [{
        type: Schema.Types.ObjectId,
        ref: 'Campaign'
    }],
    accessibleCampaigns: [{
        type: Schema.Types.ObjectId,
        ref: 'Campaign'
    }],

    // Profile and Preferences
    profilePicture: String,
    timezone: {
        type: String,
        default: 'UTC'
    },
    language: {
        type: String,
        default: 'en'
    },
    notificationPreferences: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        },
        push: {
            type: Boolean,
            default: true
        },
        campaignUpdates: {
            type: Boolean,
            default: true
        },
        systemAlerts: {
            type: Boolean,
            default: true
        }
    },

    // Security and Audit
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,
    lastPasswordChange: {
        type: Date,
        default: Date.now
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },

    // Timestamps
    lastActivityAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for fast lookups
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ organizationId: 1 });
userSchema.index({ 'campaignPermissions.campaignId': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastActivityAt: -1 });

// Text index for search
userSchema.index({
    firstName: 'text',
    lastName: 'text',
    email: 'text',
    username: 'text'
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
userSchema.virtual('displayName').get(function () {
    return `${this.firstName} ${this.lastName}` || this.username;
});

// Virtual for is locked
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        this.lastPasswordChange = new Date();
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Pre-save middleware to update lastActivityAt
userSchema.pre('save', function (next) {
    this.lastActivityAt = new Date();
    next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function (): string {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function (): string {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    return verificationToken;
};

// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = function (): void {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }

    const updates: any = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 failed attempts
    if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
        (updates as any).$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }

    return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function (): void {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Instance method to lock account
userSchema.methods.lockAccount = function (): void {
    return this.updateOne({
        lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 hours
    });
};

// Instance method to unlock account
userSchema.methods.unlockAccount = function (): void {
    return this.updateOne({
        $unset: { lockUntil: 1, loginAttempts: 1 }
    });
};

// Instance method to check permission
userSchema.methods.hasPermission = function (permission: string): boolean {
    return this.permissions.includes(permission);
};

// Instance method to check campaign permission
userSchema.methods.hasCampaignPermission = function (campaignId: string, permission: string): boolean {
    const campaignPermission = this.campaignPermissions.find(
        cp => cp.campaignId.toString() === campaignId
    );
    return campaignPermission ? campaignPermission.permissions.includes(permission) : false;
};

// Instance method to add campaign permission
userSchema.methods.addCampaignPermission = function (campaignId: string, permissions: string[]): void {
    const existingPermission = this.campaignPermissions.find(
        cp => cp.campaignId.toString() === campaignId
    );

    if (existingPermission) {
        // Add new permissions to existing ones
        permissions.forEach(permission => {
            if (!existingPermission.permissions.includes(permission)) {
                existingPermission.permissions.push(permission);
            }
        });
    } else {
        // Create new campaign permission
        this.campaignPermissions.push({
            campaignId: new mongoose.Types.ObjectId(campaignId),
            permissions,
            grantedAt: new Date(),
            grantedBy: this._id
        });
    }
};

// Instance method to remove campaign permission
userSchema.methods.removeCampaignPermission = function (campaignId: string): void {
    this.campaignPermissions = this.campaignPermissions.filter(
        cp => cp.campaignId.toString() !== campaignId
    );
};

// Instance method to get full name
userSchema.methods.getFullName = function (): string {
    return `${this.firstName} ${this.lastName}`;
};

// Instance method to check if user is active
userSchema.methods.isActive = function (): boolean {
    return this.status === UserStatus.ACTIVE && !this.isLocked;
};

// Instance method to check if user can manage campaigns
userSchema.methods.canManageCampaigns = function (): boolean {
    return this.role === UserRole.ADMIN ||
        this.role === UserRole.CAMPAIGN_MANAGER ||
        this.hasPermission('campaign:create') ||
        this.hasPermission('campaign:update');
};

// Instance method to check if user can view dashboard
userSchema.methods.canViewDashboard = function (): boolean {
    return this.isActive() && (
        this.hasPermission('dashboard:view') ||
        this.hasPermission('campaign:read') ||
        this.hasPermission('analytics:view')
    );
};

// Static method to find users by role
userSchema.statics.findByRole = function (role: UserRole) {
    return this.find({ role, status: UserStatus.ACTIVE });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function () {
    return this.find({ status: UserStatus.ACTIVE });
};

// Static method to find users by organization
userSchema.statics.findByOrganization = function (organizationId: string) {
    return this.find({ organizationId, status: UserStatus.ACTIVE });
};

// Static method to find users with campaign access
userSchema.statics.findByCampaignAccess = function (campaignId: string) {
    return this.find({
        'campaignPermissions.campaignId': campaignId,
        status: UserStatus.ACTIVE
    });
};

// Export the model
export const User = mongoose.model<IUser>('User', userSchema);
