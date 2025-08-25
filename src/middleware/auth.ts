import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { Logger } from '../config/logger';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
            userId?: string;
        }
    }
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required',
                error: 'MISSING_TOKEN'
            });
            return;
        }

        // Verify token and get user
        const user = await AuthService.verifyToken(token);

        // Add user to request object
        req.user = user;
        req.userId = user._id.toString();

        Logger.info(`User authenticated: ${user.email} (${user._id})`);
        next();
    } catch (error) {
        Logger.error('Token authentication failed:', error);

        res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: 'INVALID_TOKEN'
        });
    }
};

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (permission: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    error: 'UNAUTHORIZED'
                });
                return;
            }

            const hasPermission = await AuthService.hasPermission(req.userId, permission);

            if (!hasPermission) {
                Logger.warn(`User ${req.userId} attempted to access resource requiring permission: ${permission}`);

                res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions',
                    error: 'INSUFFICIENT_PERMISSIONS'
                });
                return;
            }

            Logger.debug(`User ${req.userId} has permission: ${permission}`);
            next();
        } catch (error) {
            Logger.error('Permission check failed:', error);

            res.status(500).json({
                success: false,
                message: 'Internal server error during permission check',
                error: 'PERMISSION_CHECK_FAILED'
            });
        }
    };
};

/**
 * Middleware to check if user has campaign permission
 */
export const requireCampaignPermission = (permission: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.userId) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    error: 'UNAUTHORIZED'
                });
                return;
            }

            const campaignId = req.params.campaignId || req.body.campaignId;

            if (!campaignId) {
                res.status(400).json({
                    success: false,
                    message: 'Campaign ID is required',
                    error: 'MISSING_CAMPAIGN_ID'
                });
                return;
            }

            const hasPermission = await AuthService.hasCampaignPermission(req.userId, campaignId, permission);

            if (!hasPermission) {
                Logger.warn(`User ${req.userId} attempted to access campaign ${campaignId} requiring permission: ${permission}`);

                res.status(403).json({
                    success: false,
                    message: 'Insufficient campaign permissions',
                    error: 'INSUFFICIENT_CAMPAIGN_PERMISSIONS'
                });
                return;
            }

            Logger.debug(`User ${req.userId} has campaign permission: ${permission} for campaign: ${campaignId}`);
            next();
        } catch (error) {
            Logger.error('Campaign permission check failed:', error);

            res.status(500).json({
                success: false,
                message: 'Internal server error during campaign permission check',
                error: 'CAMPAIGN_PERMISSION_CHECK_FAILED'
            });
        }
    };
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    error: 'UNAUTHORIZED'
                });
                return;
            }

            if (!roles.includes(req.user.role)) {
                Logger.warn(`User ${req.userId} with role ${req.user.role} attempted to access resource requiring roles: ${roles.join(', ')}`);

                res.status(403).json({
                    success: false,
                    message: 'Insufficient role permissions',
                    error: 'INSUFFICIENT_ROLE_PERMISSIONS'
                });
                return;
            }

            Logger.debug(`User ${req.userId} has required role: ${req.user.role}`);
            next();
        } catch (error) {
            Logger.error('Role check failed:', error);

            res.status(500).json({
                success: false,
                message: 'Internal server error during role check',
                error: 'ROLE_CHECK_FAILED'
            });
        }
    };
};

/**
 * Middleware to check if user is active
 */
export const requireActiveUser = (req: Request, res: Response, next: NextFunction): void => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                error: 'UNAUTHORIZED'
            });
            return;
        }

        if (req.user.status !== 'active') {
            Logger.warn(`Inactive user ${req.userId} attempted to access resource`);

            res.status(403).json({
                success: false,
                message: 'Account is not active',
                error: 'INACTIVE_ACCOUNT'
            });
            return;
        }

        if (req.user.isLocked) {
            Logger.warn(`Locked user ${req.userId} attempted to access resource`);

            res.status(403).json({
                success: false,
                message: 'Account is temporarily locked',
                error: 'LOCKED_ACCOUNT'
            });
            return;
        }

        next();
    } catch (error) {
        Logger.error('Active user check failed:', error);

        res.status(500).json({
            success: false,
            message: 'Internal server error during user status check',
            error: 'USER_STATUS_CHECK_FAILED'
        });
    }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const user = await AuthService.verifyToken(token);
                req.user = user;
                req.userId = user._id.toString();
                Logger.debug(`Optional auth successful for user: ${user.email}`);
            } catch (error) {
                Logger.debug('Optional auth failed, continuing without user context');
            }
        }

        next();
    } catch (error) {
        Logger.error('Optional auth middleware error:', error);
        next();
    }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (req: Request, res: Response, next: NextFunction): void => {
    // TODO: Implement rate limiting for auth endpoints
    // This is a placeholder for future implementation
    next();
};

/**
 * Logout middleware to invalidate tokens
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (req.userId) {
            await AuthService.logoutUser(req.userId);
            Logger.info(`User logged out: ${req.userId}`);
        }

        // Clear user from request
        req.user = undefined;
        req.userId = undefined;

        next();
    } catch (error) {
        Logger.error('Logout middleware error:', error);
        next();
    }
};
