import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { authenticateToken, requireActiveUser, authRateLimit } from '../middleware/auth';
import { Logger } from '../config/logger';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRateLimit, async (req: Request, res: Response) => {
    try {
        const {
            firstName,
            lastName,
            email,
            username,
            password,
            phoneNumber,
            role,
            organizationId
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: 'MISSING_FIELDS',
                required: ['firstName', 'lastName', 'email', 'username', 'password']
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long',
                error: 'WEAK_PASSWORD'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
                error: 'INVALID_EMAIL'
            });
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_-]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username can only contain letters, numbers, underscores, and hyphens',
                error: 'INVALID_USERNAME'
            });
        }

        const user = await AuthService.registerUser({
            firstName,
            lastName,
            email,
            username,
            password,
            phoneNumber,
            role,
            organizationId
        });

        Logger.info(`New user registered: ${user.email} (${user._id})`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for verification.',
            data: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified
            }
        });
    } catch (error: any) {
        Logger.error('User registration route error:', error);

        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: error.message,
                error: 'USER_EXISTS'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to register user',
            error: 'REGISTRATION_FAILED'
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login', authRateLimit, async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
                error: 'MISSING_CREDENTIALS'
            });
        }

        const loginResponse = await AuthService.loginUser(email, password);

        Logger.info(`User login successful: ${email}`);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: loginResponse
        });
    } catch (error: any) {
        Logger.error('User login route error:', error);

        if (error.message.includes('Invalid email or password')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                error: 'INVALID_CREDENTIALS'
            });
        }

        if (error.message.includes('Account is temporarily locked')) {
            return res.status(423).json({
                success: false,
                message: error.message,
                error: 'ACCOUNT_LOCKED'
            });
        }

        if (error.message.includes('Account is not active')) {
            return res.status(403).json({
                success: false,
                message: error.message,
                error: 'ACCOUNT_INACTIVE'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: 'LOGIN_FAILED'
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate token
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
    try {
        await AuthService.logoutUser(req.userId!);

        Logger.info(`User logout successful: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error: any) {
        Logger.error('User logout route error:', error);

        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: 'LOGOUT_FAILED'
        });
    }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
                error: 'MISSING_REFRESH_TOKEN'
            });
        }

        const tokenResponse = await AuthService.refreshToken(refreshToken);

        Logger.info('Token refreshed successfully');

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: tokenResponse
        });
    } catch (error: any) {
        Logger.error('Token refresh route error:', error);

        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
            error: 'INVALID_REFRESH_TOKEN'
        });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', authRateLimit, async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
                error: 'MISSING_EMAIL'
            });
        }

        await AuthService.requestPasswordReset(email);

        // Always return success to prevent email enumeration
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    } catch (error: any) {
        Logger.error('Password reset request route error:', error);

        // Always return success to prevent email enumeration
        res.status(200).json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent'
        });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required',
                error: 'MISSING_FIELDS'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long',
                error: 'WEAK_PASSWORD'
            });
        }

        await AuthService.confirmPasswordReset(token, newPassword);

        Logger.info('Password reset successful');

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        });
    } catch (error: any) {
        Logger.error('Password reset confirmation route error:', error);

        if (error.message.includes('Invalid or expired')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token',
                error: 'INVALID_TOKEN'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: 'PASSWORD_RESET_FAILED'
        });
    }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Verification token is required',
                error: 'MISSING_TOKEN'
            });
        }

        await AuthService.verifyEmail(token);

        Logger.info('Email verification successful');

        res.status(200).json({
            success: true,
            message: 'Email verified successfully. Your account is now active.'
        });
    } catch (error: any) {
        Logger.error('Email verification route error:', error);

        if (error.message.includes('Invalid email verification token')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email verification token',
                error: 'INVALID_TOKEN'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: 'VERIFICATION_FAILED'
        });
    }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticateToken, requireActiveUser, async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required',
                error: 'MISSING_FIELDS'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long',
                error: 'WEAK_PASSWORD'
            });
        }

        await AuthService.changePassword(req.userId!, currentPassword, newPassword);

        Logger.info(`Password changed successfully for user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error: any) {
        Logger.error('Password change route error:', error);

        if (error.message.includes('Current password is incorrect')) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
                error: 'INCORRECT_CURRENT_PASSWORD'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Password change failed',
            error: 'PASSWORD_CHANGE_FAILED'
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, requireActiveUser, async (req: Request, res: Response) => {
    try {
        const user = req.user;

        res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: {
                id: user._id,
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
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error: any) {
        Logger.error('Get user profile route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user profile',
            error: 'PROFILE_RETRIEVAL_FAILED'
        });
    }
});

export default router;
