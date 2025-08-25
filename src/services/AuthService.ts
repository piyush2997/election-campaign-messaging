import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser, UserRole, UserStatus } from '../models/User';
import { EnvConfig } from '../config/EnvConfig';
import { Logger } from '../config/logger';

// JWT payload interface
export interface JWTPayload {
    userId: string;
    email: string;
    username: string;
    role: UserRole;
    permissions: string[];
    iat: number;
    exp: number;
}

// Login response interface
export interface LoginResponse {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        username: string;
        role: UserRole;
        status: UserStatus;
        permissions: string[];
        profilePicture?: string;
        timezone: string;
        language: string;
        twoFactorEnabled: boolean;
        emailVerified: boolean;
        lastLoginAt?: Date;
    };
    token: string;
    refreshToken: string;
    expiresIn: number;
}

// Registration request interface
export interface RegistrationRequest {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    phoneNumber?: string;
    role?: UserRole;
    organizationId?: string;
}

// Password reset request interface
export interface PasswordResetRequest {
    email: string;
}

// Password reset confirm interface
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
}

export class AuthService {
    private static readonly MAX_LOGIN_ATTEMPTS = 5;
    private static readonly ACCOUNT_LOCK_DURATION = 2 * 60 * 60 * 1000; // 2 hours

    // Lazy-loaded JWT configuration using getters
    private static get JWT_SECRET(): string {
        return EnvConfig.get('JWT_SECRET') || 'your-secret-key';
    }

    private static get JWT_EXPIRES_IN(): string {
        return EnvConfig.get('JWT_EXPIRES_IN') || '24h';
    }

    private static get REFRESH_TOKEN_EXPIRES_IN(): string {
        return EnvConfig.get('REFRESH_TOKEN_EXPIRES_IN') || '7d';
    }

    /**
     * Register a new user
     */
    public static async registerUser(registrationData: RegistrationRequest): Promise<IUser> {
        try {
            Logger.info(`Attempting to register new user: ${registrationData.email}`);

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [
                    { email: registrationData.email.toLowerCase() },
                    { username: registrationData.username }
                ]
            });

            if (existingUser) {
                throw new Error('User with this email or username already exists');
            }

            // Create new user
            const newUser = new User({
                ...registrationData,
                email: registrationData.email.toLowerCase(),
                status: UserStatus.PENDING_VERIFICATION,
                role: registrationData.role || UserRole.CAMPAIGN_OPERATOR,
                permissions: this.getDefaultPermissions(registrationData.role || UserRole.CAMPAIGN_OPERATOR)
            });

            // Generate email verification token
            const verificationToken = newUser.generateEmailVerificationToken();

            await newUser.save();

            Logger.info(`User registered successfully: ${newUser._id}`);

            // TODO: Send verification email with verificationToken
            Logger.info(`Email verification token generated: ${verificationToken}`);

            return newUser;
        } catch (error) {
            Logger.error('User registration failed:', error);
            throw error;
        }
    }

    /**
     * Authenticate user login
     */
    public static async loginUser(email: string, password: string): Promise<LoginResponse> {
        try {
            Logger.info(`Login attempt for user: ${email}`);

            // Find user by email and include password field
            const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Check if account is locked
            if (user.isLocked) {
                throw new Error('Account is temporarily locked due to multiple failed login attempts');
            }

            // Check if account is active
            if (user.status !== UserStatus.ACTIVE) {
                throw new Error('Account is not active. Please verify your email or contact support');
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                // Increment failed login attempts
                await user.incrementLoginAttempts();

                if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
                    await user.lockAccount();
                    throw new Error('Account locked due to multiple failed login attempts. Please try again later or reset your password');
                }

                throw new Error('Invalid email or password');
            }

            // Reset login attempts on successful login
            await user.resetLoginAttempts();

            // Update last login time
            user.lastLoginAt = new Date();
            await user.save();

            // Generate JWT token
            const token = this.generateJWTToken(user);
            const refreshToken = this.generateRefreshToken(user);

            Logger.info(`User login successful: ${user._id}`);

            return {
                user: {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    status: user.status,
                    permissions: user.permissions,
                    profilePicture: user.profilePicture,
                    timezone: user.timezone,
                    language: user.language,
                    twoFactorEnabled: user.twoFactorEnabled,
                    emailVerified: user.emailVerified,
                    lastLoginAt: user.lastLoginAt
                },
                token,
                refreshToken,
                expiresIn: this.getTokenExpirationTime()
            };
        } catch (error) {
            Logger.error('User login failed:', error);
            throw error;
        }
    }

    /**
     * Verify JWT token and return user data
     */
    public static async verifyToken(token: string): Promise<IUser> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;

            const user = await User.findById(decoded.userId);

            if (!user) {
                throw new Error('User not found');
            }

            if (user.status !== UserStatus.ACTIVE) {
                throw new Error('User account is not active');
            }

            if (user.isLocked) {
                throw new Error('User account is locked');
            }

            return user;
        } catch (error) {
            Logger.error('Token verification failed:', error);
            throw new Error('Invalid or expired token');
        }
    }

    /**
     * Refresh JWT token
     */
    public static async refreshToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
        try {
            const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as JWTPayload;

            const user = await User.findById(decoded.userId);

            if (!user || user.status !== UserStatus.ACTIVE) {
                throw new Error('Invalid refresh token');
            }

            const newToken = this.generateJWTToken(user);

            return {
                token: newToken,
                expiresIn: this.getTokenExpirationTime()
            };
        } catch (error) {
            Logger.error('Token refresh failed:', error);
            throw new Error('Invalid or expired refresh token');
        }
    }

    /**
     * Request password reset
     */
    public static async requestPasswordReset(email: string): Promise<void> {
        try {
            Logger.info(`Password reset requested for: ${email}`);

            const user = await User.findOne({ email: email.toLowerCase() });

            if (!user) {
                // Don't reveal if user exists or not for security
                Logger.info(`Password reset requested for non-existent email: ${email}`);
                return;
            }

            // Generate password reset token
            const resetToken = user.generatePasswordResetToken();
            await user.save();

            // TODO: Send password reset email with resetToken
            Logger.info(`Password reset token generated for user: ${user._id}`);

        } catch (error) {
            Logger.error('Password reset request failed:', error);
            throw error;
        }
    }

    /**
     * Confirm password reset
     */
    public static async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
        try {
            Logger.info('Password reset confirmation requested');

            // Hash the token to compare with stored hash
            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await User.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpires: { $gt: Date.now() }
            });

            if (!user) {
                throw new Error('Invalid or expired password reset token');
            }

            // Update password and clear reset token
            user.password = newPassword;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            user.lastPasswordChange = new Date();

            await user.save();

            Logger.info(`Password reset successful for user: ${user._id}`);

        } catch (error) {
            Logger.error('Password reset confirmation failed:', error);
            throw error;
        }
    }

    /**
     * Verify email with token
     */
    public static async verifyEmail(token: string): Promise<void> {
        try {
            Logger.info('Email verification requested');

            const hashedToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');

            const user = await User.findOne({
                emailVerificationToken: hashedToken
            });

            if (!user) {
                throw new Error('Invalid email verification token');
            }

            // Mark email as verified
            user.emailVerified = true;
            user.emailVerificationToken = undefined;
            user.status = UserStatus.ACTIVE;

            await user.save();

            Logger.info(`Email verified successfully for user: ${user._id}`);

        } catch (error) {
            Logger.error('Email verification failed:', error);
            throw error;
        }
    }

    /**
     * Change user password
     */
    public static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        try {
            Logger.info(`Password change requested for user: ${userId}`);

            const user = await User.findById(userId).select('+password');

            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);

            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Update password
            user.password = newPassword;
            user.lastPasswordChange = new Date();

            await user.save();

            Logger.info(`Password changed successfully for user: ${userId}`);

        } catch (error) {
            Logger.error('Password change failed:', error);
            throw error;
        }
    }

    /**
     * Logout user (invalidate refresh token)
     */
    public static async logoutUser(userId: string): Promise<void> {
        try {
            Logger.info(`User logout: ${userId}`);

            // TODO: Implement refresh token blacklisting if needed
            // For now, we'll just log the logout

        } catch (error) {
            Logger.error('User logout failed:', error);
            throw error;
        }
    }

    /**
     * Get user permissions
     */
    public static async getUserPermissions(userId: string): Promise<string[]> {
        try {
            const user = await User.findById(userId);

            if (!user) {
                throw new Error('User not found');
            }

            return user.permissions;
        } catch (error) {
            Logger.error('Failed to get user permissions:', error);
            throw error;
        }
    }

    /**
     * Check if user has specific permission
     */
    public static async hasPermission(userId: string, permission: string): Promise<boolean> {
        try {
            const user = await User.findById(userId);

            if (!user) {
                return false;
            }

            return user.hasPermission(permission);
        } catch (error) {
            Logger.error('Failed to check user permission:', error);
            return false;
        }
    }

    /**
     * Check if user has campaign permission
     */
    public static async hasCampaignPermission(userId: string, campaignId: string, permission: string): Promise<boolean> {
        try {
            const user = await User.findById(userId);

            if (!user) {
                return false;
            }

            return user.hasCampaignPermission(campaignId, permission);
        } catch (error) {
            Logger.error('Failed to check campaign permission:', error);
            return false;
        }
    }

    // Private helper methods

    private static generateJWTToken(user: IUser): string {
        const payload: JWTPayload = {
            userId: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            iat: Date.now(),
            exp: Date.now() + this.getTokenExpirationTime()
        };

        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN
        } as any);
    }

    private static generateRefreshToken(user: IUser): string {
        const payload: JWTPayload = {
            userId: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
            permissions: user.permissions,
            iat: Date.now(),
            exp: Date.now() + this.getRefreshTokenExpirationTime()
        };

        return jwt.sign(payload, this.JWT_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
        } as any);
    }

    private static getTokenExpirationTime(): number {
        const expiresIn = this.JWT_EXPIRES_IN;
        if (expiresIn.includes('h')) {
            return parseInt(expiresIn) * 60 * 60 * 1000;
        } else if (expiresIn.includes('d')) {
            return parseInt(expiresIn) * 24 * 60 * 60 * 1000;
        } else if (expiresIn.includes('m')) {
            return parseInt(expiresIn) * 60 * 1000;
        } else if (expiresIn.includes('s')) {
            return parseInt(expiresIn) * 1000;
        }
        return 24 * 60 * 60 * 1000; // Default to 24 hours
    }

    private static getRefreshTokenExpirationTime(): number {
        const expiresIn = this.REFRESH_TOKEN_EXPIRES_IN;
        if (expiresIn.includes('h')) {
            return parseInt(expiresIn) * 60 * 60 * 1000;
        } else if (expiresIn.includes('d')) {
            return parseInt(expiresIn) * 24 * 60 * 60 * 1000;
        } else if (expiresIn.includes('m')) {
            return parseInt(expiresIn) * 60 * 1000;
        } else if (expiresIn.includes('s')) {
            return parseInt(expiresIn) * 1000;
        }
        return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }

    private static getDefaultPermissions(role: UserRole): string[] {
        switch (role) {
            case UserRole.ADMIN:
                return [
                    'campaign:create', 'campaign:read', 'campaign:update', 'campaign:delete', 'campaign:approve', 'campaign:schedule',
                    'voter:read', 'voter:create', 'voter:update', 'voter:delete',
                    'message:create', 'message:read', 'message:update', 'message:delete', 'message:approve', 'message:schedule',
                    'user:read', 'user:create', 'user:update', 'user:delete',
                    'dashboard:view', 'analytics:view', 'reports:generate'
                ];
            case UserRole.CAMPAIGN_MANAGER:
                return [
                    'campaign:create', 'campaign:read', 'campaign:update', 'campaign:approve', 'campaign:schedule',
                    'voter:read', 'voter:create', 'voter:update',
                    'message:create', 'message:read', 'message:update', 'message:approve', 'message:schedule',
                    'user:read',
                    'dashboard:view', 'analytics:view', 'reports:generate'
                ];
            case UserRole.CAMPAIGN_ANALYST:
                return [
                    'campaign:read',
                    'voter:read',
                    'message:read',
                    'dashboard:view', 'analytics:view', 'reports:generate'
                ];
            case UserRole.CAMPAIGN_OPERATOR:
                return [
                    'campaign:read', 'campaign:update',
                    'voter:read',
                    'message:create', 'message:read', 'message:update',
                    'dashboard:view'
                ];
            case UserRole.VIEWER:
                return [
                    'campaign:read',
                    'voter:read',
                    'message:read',
                    'dashboard:view'
                ];
            default:
                return ['dashboard:view'];
        }
    }
}
