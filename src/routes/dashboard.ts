import { Router, Request, Response } from 'express';
import { authenticateToken, requireActiveUser, requirePermission } from '../middleware/auth';
import { Campaign } from '../models/Campaign';
import { Message } from '../models/Message';
import { Voter } from '../models/Voter';
import { VoterContact } from '../models/VoterContact';
import { User } from '../models/User';
import { Logger } from '../config/logger';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);
router.use(requireActiveUser);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview with key metrics
 * @access  Private (requires dashboard:view permission)
 */
router.get('/overview', requirePermission('dashboard:view'), async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const user = req.user;

        Logger.info(`Dashboard overview requested by user: ${userId}`);

        // Get campaign statistics based on user permissions
        let campaignQuery: any = {};
        let messageQuery: any = {};
        let voterQuery: any = {};

        // If user is not admin, filter by their accessible campaigns
        if (user.role !== 'admin') {
            const accessibleCampaignIds = user.accessibleCampaigns || [];
            campaignQuery = { _id: { $in: accessibleCampaignIds } };
            messageQuery = { campaignId: { $in: accessibleCampaignIds } };
            voterQuery = { 'campaigns.campaignId': { $in: accessibleCampaignIds } };
        }

        // Get campaign counts by status
        const campaignStats = await Campaign.aggregate([
            { $match: campaignQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get message counts by status
        const messageStats = await Message.aggregate([
            { $match: messageQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get voter counts
        const totalVoters = await Voter.countDocuments(voterQuery);
        const contactableVoters = await Voter.countDocuments({
            ...voterQuery,
            'optOutStatus': { $ne: true }
        });

        // Get recent activity
        const recentCampaigns = await Campaign.find(campaignQuery)
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('name status startDate endDate');

        const recentMessages = await Message.find(messageQuery)
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('title status campaignId scheduledDate');

        // Get delivery statistics
        const deliveryStats = await VoterContact.aggregate([
            { $match: { campaignId: { $in: user.accessibleCampaigns || [] } } },
            {
                $group: {
                    _id: '$contactStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate engagement metrics
        const engagementStats = await VoterContact.aggregate([
            { $match: { campaignId: { $in: user.accessibleCampaigns || [] } } },
            {
                $group: {
                    _id: null,
                    totalContacts: { $sum: 1 },
                    totalDelivered: { $sum: { $cond: [{ $eq: ['$contactStatus', 'delivered'] }, 1, 0] } },
                    totalRead: { $sum: { $cond: [{ $eq: ['$contactStatus', 'read'] }, 1, 0] } },
                    totalResponses: { $sum: { $cond: [{ $ne: ['$responseStatus', null] }, 1, 0] } }
                }
            }
        ]);

        const overview = {
            campaigns: {
                total: campaignStats.reduce((sum, stat) => sum + stat.count, 0),
                byStatus: campaignStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {} as any)
            },
            messages: {
                total: messageStats.reduce((sum, stat) => sum + stat.count, 0),
                byStatus: messageStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {} as any)
            },
            voters: {
                total: totalVoters,
                contactable: contactableVoters,
                optOut: totalVoters - contactableVoters
            },
            delivery: {
                byStatus: deliveryStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {} as any)
            },
            engagement: engagementStats[0] || {
                totalContacts: 0,
                totalDelivered: 0,
                totalRead: 0,
                totalResponses: 0
            },
            recentActivity: {
                campaigns: recentCampaigns,
                messages: recentMessages
            }
        };

        // Calculate percentages
        if (overview.engagement.totalContacts > 0) {
            overview.engagement.deliveryRate = (overview.engagement.totalDelivered / overview.engagement.totalContacts * 100).toFixed(2);
            overview.engagement.readRate = (overview.engagement.totalRead / overview.engagement.totalDelivered * 100).toFixed(2);
            overview.engagement.responseRate = (overview.engagement.totalResponses / overview.engagement.totalContacts * 100).toFixed(2);
        }

        res.status(200).json({
            success: true,
            message: 'Dashboard overview retrieved successfully',
            data: overview
        });

    } catch (error: any) {
        Logger.error('Dashboard overview route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve dashboard overview',
            error: 'DASHBOARD_OVERVIEW_FAILED'
        });
    }
});

/**
 * @route   GET /api/dashboard/campaigns
 * @desc    Get user's accessible campaigns with details
 * @access  Private (requires campaign:read permission)
 */
router.get('/campaigns', requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const user = req.user;
        const { page = 1, limit = 10, status, search } = req.query;

        Logger.info(`Campaigns requested by user: ${userId}`);

        // Build query based on user permissions
        let query: any = {};

        if (user.role !== 'admin') {
            query._id = { $in: user.accessibleCampaigns || [] };
        }

        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const campaigns = await Campaign.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string))
            .populate('createdBy', 'firstName lastName email');

        const total = await Campaign.countDocuments(query);

        // Get campaign performance metrics
        const campaignsWithMetrics = await Promise.all(
            campaigns.map(async (campaign) => {
                const messageCount = await Message.countDocuments({ campaignId: campaign._id });
                const voterCount = await Voter.countDocuments({ 'campaigns.campaignId': campaign._id });
                const contactCount = await VoterContact.countDocuments({ campaignId: campaign._id });

                const deliveredCount = await VoterContact.countDocuments({
                    campaignId: campaign._id,
                    contactStatus: 'delivered'
                });

                const readCount = await VoterContact.countDocuments({
                    campaignId: campaign._id,
                    contactStatus: 'read'
                });

                return {
                    ...campaign.toObject(),
                    metrics: {
                        messageCount,
                        voterCount,
                        contactCount,
                        deliveredCount,
                        readCount,
                        deliveryRate: contactCount > 0 ? (deliveredCount / contactCount * 100).toFixed(2) : '0',
                        readRate: deliveredCount > 0 ? (readCount / deliveredCount * 100).toFixed(2) : '0'
                    }
                };
            })
        );

        res.status(200).json({
            success: true,
            message: 'Campaigns retrieved successfully',
            data: campaignsWithMetrics,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });

    } catch (error: any) {
        Logger.error('Dashboard campaigns route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaigns',
            error: 'CAMPAIGNS_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   GET /api/dashboard/messages
 * @desc    Get user's accessible messages with details
 * @access  Private (requires message:read permission)
 */
router.get('/messages', requirePermission('message:read'), async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const user = req.user;
        const { page = 1, limit = 10, status, type, campaignId } = req.query;

        Logger.info(`Messages requested by user: ${userId}`);

        // Build query based on user permissions
        let query: any = {};

        if (user.role !== 'admin') {
            const accessibleCampaignIds = user.accessibleCampaigns || [];
            query.campaignId = { $in: accessibleCampaignIds };
        }

        if (status) {
            query.status = status;
        }

        if (type) {
            query.messageType = type;
        }

        if (campaignId) {
            query.campaignId = campaignId;
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const messages = await Message.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit as string))
            .populate('campaignId', 'name status');

        const total = await Message.countDocuments(query);

        // Get message performance metrics
        const messagesWithMetrics = await Promise.all(
            messages.map(async (message) => {
                const contactCount = await VoterContact.countDocuments({ messageId: message._id });
                const deliveredCount = await VoterContact.countDocuments({
                    messageId: message._id,
                    contactStatus: 'delivered'
                });
                const readCount = await VoterContact.countDocuments({
                    messageId: message._id,
                    contactStatus: 'read'
                });
                const responseCount = await VoterContact.countDocuments({
                    messageId: message._id,
                    responseStatus: { $exists: true, $ne: null }
                });

                return {
                    ...message.toObject(),
                    metrics: {
                        contactCount,
                        deliveredCount,
                        readCount,
                        responseCount,
                        deliveryRate: contactCount > 0 ? (deliveredCount / contactCount * 100).toFixed(2) : '0',
                        readRate: deliveredCount > 0 ? (readCount / deliveredCount * 100).toFixed(2) : '0',
                        responseRate: contactCount > 0 ? (responseCount / contactCount * 100).toFixed(2) : '0'
                    }
                };
            })
        );

        res.status(200).json({
            success: true,
            message: 'Messages retrieved successfully',
            data: messagesWithMetrics,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                totalPages: Math.ceil(total / parseInt(limit as string))
            }
        });

    } catch (error: any) {
        Logger.error('Dashboard messages route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve messages',
            error: 'MESSAGES_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   GET /api/dashboard/analytics
 * @desc    Get analytics data for user's campaigns
 * @access  Private (requires analytics:view permission)
 */
router.get('/analytics', requirePermission('analytics:view'), async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const user = req.user;
        const { period = '30d', campaignId } = req.query;

        Logger.info(`Analytics requested by user: ${userId}`);

        // Calculate date range
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Build query based on user permissions
        let campaignQuery: any = {};

        if (user.role !== 'admin') {
            campaignQuery._id = { $in: user.accessibleCampaigns || [] };
        }

        if (campaignId) {
            campaignQuery._id = campaignId;
        }

        // Get campaign performance over time
        const dailyStats = await VoterContact.aggregate([
            {
                $match: {
                    campaignId: { $in: user.accessibleCampaigns || [] },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        status: '$contactStatus'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    statuses: {
                        $push: {
                            status: '$_id.status',
                            count: '$count'
                        }
                    },
                    total: { $sum: '$count' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get top performing campaigns
        const topCampaigns = await VoterContact.aggregate([
            {
                $match: {
                    campaignId: { $in: user.accessibleCampaigns || [] },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$campaignId',
                    totalContacts: { $sum: 1 },
                    delivered: { $sum: { $cond: [{ $eq: ['$contactStatus', 'delivered'] }, 1, 0] } },
                    read: { $sum: { $cond: [{ $eq: ['$contactStatus', 'read'] }, 1, 0] } },
                    responses: { $sum: { $cond: [{ $ne: ['$responseStatus', null] }, 1, 0] } }
                }
            },
            {
                $lookup: {
                    from: 'campaigns',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'campaign'
                }
            },
            {
                $addFields: {
                    campaignName: { $arrayElemAt: ['$campaign.name', 0] },
                    deliveryRate: {
                        $cond: [
                            { $gt: ['$totalContacts', 0] },
                            { $multiply: [{ $divide: ['$delivered', '$totalContacts'] }, 100] },
                            0
                        ]
                    },
                    readRate: {
                        $cond: [
                            { $gt: ['$delivered', 0] },
                            { $multiply: [{ $divide: ['$read', '$delivered'] }, 100] },
                            0
                        ]
                    },
                    responseRate: {
                        $cond: [
                            { $gt: ['$totalContacts', 0] },
                            { $multiply: [{ $divide: ['$responses', '$totalContacts'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { deliveryRate: -1 } },
            { $limit: 10 }
        ]);

        // Get voter engagement metrics
        const voterEngagement = await VoterContact.aggregate([
            {
                $match: {
                    campaignId: { $in: user.accessibleCampaigns || [] },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$voterId',
                    totalContacts: { $sum: 1 },
                    totalRead: { $sum: { $cond: [{ $eq: ['$contactStatus', 'read'] }, 1, 0] } },
                    totalResponses: { $sum: { $cond: [{ $ne: ['$responseStatus', null] }, 1, 0] } }
                }
            },
            {
                $group: {
                    _id: null,
                    totalVoters: { $sum: 1 },
                    avgContactsPerVoter: { $avg: '$totalContacts' },
                    avgReadsPerVoter: { $avg: '$totalRead' },
                    avgResponsesPerVoter: { $avg: '$totalResponses' }
                }
            }
        ]);

        const analytics = {
            period,
            dateRange: {
                start: startDate,
                end: now
            },
            dailyStats,
            topCampaigns,
            voterEngagement: voterEngagement[0] || {
                totalVoters: 0,
                avgContactsPerVoter: 0,
                avgReadsPerVoter: 0,
                avgResponsesPerVoter: 0
            }
        };

        res.status(200).json({
            success: true,
            message: 'Analytics data retrieved successfully',
            data: analytics
        });

    } catch (error: any) {
        Logger.error('Dashboard analytics route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics data',
            error: 'ANALYTICS_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   GET /api/dashboard/notifications
 * @desc    Get user's notifications and alerts
 * @access  Private
 */
router.get('/notifications', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const user = req.user;

        Logger.info(`Notifications requested by user: ${userId}`);

        // Get user's campaigns that need attention
        const campaignsNeedingAttention = await Campaign.find({
            _id: { $in: user.accessibleCampaigns || [] },
            $or: [
                { status: 'draft', updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
                { status: 'active', endDate: { $lt: new Date(Date.now() + 24 * 60 * 60 * 1000) } },
                { status: 'paused' }
            ]
        }).select('name status startDate endDate updatedAt');

        // Get messages that need approval or scheduling
        const messagesNeedingAttention = await Message.find({
            campaignId: { $in: user.accessibleCampaigns || [] },
            $or: [
                { status: 'draft' },
                { status: 'pending_approval' },
                { status: 'scheduled', scheduledDate: { $lt: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
            ]
        }).select('title status campaignId scheduledDate');

        // Get recent system alerts
        const systemAlerts = [
            // TODO: Implement system alerts based on business rules
            // For now, return empty array
        ];

        const notifications = {
            campaigns: campaignsNeedingAttention.map(campaign => ({
                type: 'campaign',
                priority: campaign.status === 'draft' ? 'low' : 'medium',
                message: `Campaign "${campaign.name}" needs attention`,
                data: campaign
            })),
            messages: messagesNeedingAttention.map(message => ({
                type: 'message',
                priority: message.status === 'pending_approval' as any ? 'high' : 'medium',
                message: `Message "${message.title}" needs attention`,
                data: message
            })),
            system: systemAlerts
        };

        // Calculate total notifications
        const totalNotifications = notifications.campaigns.length + notifications.messages.length + notifications.system.length;

        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: {
                notifications,
                total: totalNotifications,
                unread: totalNotifications // TODO: Implement read/unread status
            }
        });

    } catch (error: any) {
        Logger.error('Dashboard notifications route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications',
            error: 'NOTIFICATIONS_RETRIEVAL_FAILED'
        });
    }
});

export default router;
