import { Router, Request, Response } from 'express';
import { CampaignService, CampaignCreateRequest, CampaignUpdateRequest, CampaignSearchFilters, CampaignMessageRequest, VoterCampaignAssignment } from '../services/CampaignService';
import { authenticateToken, requirePermission, requireActiveUser } from '../middleware/auth';
import { Logger } from '../config/logger';

const router = Router();

/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private (requires campaign:create permission)
 */
router.post('/', authenticateToken, requireActiveUser, requirePermission('campaign:create'), async (req: Request, res: Response) => {
    try {
        const campaignData: CampaignCreateRequest = {
            ...req.body,
            createdBy: req.userId!
        };

        // Validate required fields
        const requiredFields = ['name', 'description', 'startDate', 'endDate', 'targetAudience'];
        const missingFields = requiredFields.filter(field => !campaignData[field as keyof CampaignCreateRequest]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: 'MISSING_FIELDS',
                required: missingFields
            });
        }

        // Validate target audience array
        if (!Array.isArray(campaignData.targetAudience) || campaignData.targetAudience.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Target audience must be a non-empty array',
                error: 'INVALID_TARGET_AUDIENCE'
            });
        }

        // Parse dates
        campaignData.startDate = new Date(campaignData.startDate);
        campaignData.endDate = new Date(campaignData.endDate);

        const campaign = await CampaignService.createCampaign(campaignData);

        Logger.info(`Campaign created successfully: ${campaign._id} by user: ${req.userId}`);

        res.status(201).json({
            success: true,
            message: 'Campaign created successfully',
            data: {
                id: campaign._id,
                name: campaign.name,
                description: campaign.description,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                status: campaign.status,
                targetAudience: campaign.targetAudience,
                budget: campaign.budget,
                tags: campaign.tags,
                isActive: campaign.isActive
            }
        });

    } catch (error: any) {
        Logger.error('Campaign creation route error:', error);

        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: error.message,
                error: 'CAMPAIGN_EXISTS'
            });
        }

        if (error.message.includes('Start date must be before end date')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                error: 'INVALID_DATES'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create campaign',
            error: 'CAMPAIGN_CREATION_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns
 * @desc    Search and filter campaigns
 * @access  Private (requires campaign:read permission)
 */
router.get('/', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const filters: CampaignSearchFilters = {
            name: req.query.name as string,
            status: req.query.status as any,
            targetAudience: req.query.targetAudience as string,
            createdBy: req.query.createdBy as string,
            startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
            endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            page: req.query.page ? parseInt(req.query.page as string) : undefined,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc'
        };

        const result = await CampaignService.searchCampaigns(filters);

        Logger.info(`Campaign search completed: ${result.campaigns.length} results by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaigns retrieved successfully',
            data: result
        });

    } catch (error: any) {
        Logger.error('Campaign search route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to search campaigns',
            error: 'CAMPAIGN_SEARCH_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns/:id
 * @desc    Get campaign by ID
 * @access  Private (requires campaign:read permission)
 */
router.get('/:id', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await CampaignService.getCampaignById(id);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        Logger.info(`Campaign retrieved: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign retrieved successfully',
            data: campaign
        });

    } catch (error: any) {
        Logger.error('Campaign retrieval route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaign',
            error: 'CAMPAIGN_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns/creator/:userId
 * @desc    Get campaigns by creator
 * @access  Private (requires campaign:read permission)
 */
router.get('/creator/:userId', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const campaigns = await CampaignService.getCampaignsByCreator(userId);

        Logger.info(`Campaigns retrieved for creator: ${userId} (${campaigns.length} results) by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaigns retrieved successfully',
            data: {
                creatorId: userId,
                campaigns,
                count: campaigns.length
            }
        });

    } catch (error: any) {
        Logger.error('Campaign creator lookup route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaigns by creator',
            error: 'CAMPAIGN_CREATOR_LOOKUP_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns/active
 * @desc    Get all active campaigns
 * @access  Private (requires campaign:read permission)
 */
router.get('/active', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const campaigns = await CampaignService.getActiveCampaigns();

        Logger.info(`Active campaigns retrieved: ${campaigns.length} results by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Active campaigns retrieved successfully',
            data: {
                campaigns,
                count: campaigns.length
            }
        });

    } catch (error: any) {
        Logger.error('Active campaigns route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve active campaigns',
            error: 'ACTIVE_CAMPAIGNS_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns/audience/:audience
 * @desc    Get campaigns by target audience
 * @access  Private (requires campaign:read permission)
 */
router.get('/audience/:audience', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const { audience } = req.params;

        const campaigns = await CampaignService.getCampaignsByTargetAudience(audience);

        Logger.info(`Campaigns retrieved for audience: ${audience} (${campaigns.length} results) by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaigns retrieved successfully',
            data: {
                targetAudience: audience,
                campaigns,
                count: campaigns.length
            }
        });

    } catch (error: any) {
        Logger.error('Campaign audience lookup route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaigns by audience',
            error: 'CAMPAIGN_AUDIENCE_LOOKUP_FAILED'
        });
    }
});

/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update campaign
 * @access  Private (requires campaign:update permission)
 */
router.put('/:id', authenticateToken, requireActiveUser, requirePermission('campaign:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData: CampaignUpdateRequest = req.body;

        // Parse dates if provided
        if (updateData.startDate) {
            updateData.startDate = new Date(updateData.startDate);
        }
        if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
        }

        const campaign = await CampaignService.updateCampaign(id, updateData);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        Logger.info(`Campaign updated: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign updated successfully',
            data: campaign
        });

    } catch (error: any) {
        Logger.error('Campaign update route error:', error);

        if (error.message.includes('Start date must be before end date')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                error: 'INVALID_DATES'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update campaign',
            error: 'CAMPAIGN_UPDATE_FAILED'
        });
    }
});

/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete campaign (soft delete)
 * @access  Private (requires campaign:delete permission)
 */
router.delete('/:id', authenticateToken, requireActiveUser, requirePermission('campaign:delete'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const success = await CampaignService.deleteCampaign(id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        Logger.info(`Campaign deleted: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign deleted successfully'
        });

    } catch (error: any) {
        Logger.error('Campaign deletion route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete campaign',
            error: 'CAMPAIGN_DELETION_FAILED'
        });
    }
});

/**
 * @route   POST /api/campaigns/:id/activate
 * @desc    Activate campaign
 * @access  Private (requires campaign:update permission)
 */
router.post('/:id/activate', authenticateToken, requireActiveUser, requirePermission('campaign:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await CampaignService.activateCampaign(id);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        Logger.info(`Campaign activated: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign activated successfully',
            data: campaign
        });

    } catch (error: any) {
        Logger.error('Campaign activation route error:', error);

        if (error.message.includes('Only draft campaigns can be activated')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                error: 'INVALID_CAMPAIGN_STATUS'
            });
        }

        if (error.message.includes('Cannot activate campaign with past start date')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                error: 'INVALID_START_DATE'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to activate campaign',
            error: 'CAMPAIGN_ACTIVATION_FAILED'
        });
    }
});

/**
 * @route   POST /api/campaigns/:id/pause
 * @desc    Pause campaign
 * @access  Private (requires campaign:update permission)
 */
router.post('/:id/pause', authenticateToken, requireActiveUser, requirePermission('campaign:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await CampaignService.pauseCampaign(id);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        Logger.info(`Campaign paused: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign paused successfully',
            data: campaign
        });

    } catch (error: any) {
        Logger.error('Campaign pause route error:', error);

        if (error.message.includes('Only active campaigns can be paused')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                error: 'INVALID_CAMPAIGN_STATUS'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to pause campaign',
            error: 'CAMPAIGN_PAUSE_FAILED'
        });
    }
});

/**
 * @route   POST /api/campaigns/:id/complete
 * @desc    Complete campaign
 * @access  Private (requires campaign:update permission)
 */
router.post('/:id/complete', authenticateToken, requireActiveUser, requirePermission('campaign:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const campaign = await CampaignService.completeCampaign(id);

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        Logger.info(`Campaign completed: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign completed successfully',
            data: campaign
        });

    } catch (error: any) {
        Logger.error('Campaign completion route error:', error);

        if (error.message.includes('Only active or paused campaigns can be completed')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                error: 'INVALID_CAMPAIGN_STATUS'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to complete campaign',
            error: 'CAMPAIGN_COMPLETION_FAILED'
        });
    }
});

/**
 * @route   POST /api/campaigns/:id/duplicate
 * @desc    Duplicate campaign
 * @access  Private (requires campaign:create permission)
 */
router.post('/:id/duplicate', authenticateToken, requireActiveUser, requirePermission('campaign:create'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newName } = req.body;

        if (!newName) {
            return res.status(400).json({
                success: false,
                message: 'New name is required for campaign duplication',
                error: 'MISSING_NEW_NAME'
            });
        }

        const duplicatedCampaign = await CampaignService.duplicateCampaign(id, newName, req.userId!);

        if (!duplicatedCampaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        Logger.info(`Campaign duplicated: ${id} to ${duplicatedCampaign._id} by user: ${req.userId}`);

        res.status(201).json({
            success: true,
            message: 'Campaign duplicated successfully',
            data: {
                id: duplicatedCampaign._id,
                name: duplicatedCampaign.name,
                description: duplicatedCampaign.description,
                startDate: duplicatedCampaign.startDate,
                endDate: duplicatedCampaign.endDate,
                status: duplicatedCampaign.status,
                targetAudience: duplicatedCampaign.targetAudience,
                budget: duplicatedCampaign.budget,
                tags: duplicatedCampaign.tags,
                isActive: duplicatedCampaign.isActive
            }
        });

    } catch (error: any) {
        Logger.error('Campaign duplication route error:', error);

        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: error.message,
                error: 'CAMPAIGN_NAME_EXISTS'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to duplicate campaign',
            error: 'CAMPAIGN_DUPLICATION_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns/statistics
 * @desc    Get campaign statistics
 * @access  Private (requires campaign:read permission)
 */
router.get('/statistics', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const { createdBy } = req.query;

        const statistics = await CampaignService.getCampaignStatistics(createdBy as string);

        Logger.info(`Campaign statistics retrieved by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign statistics retrieved successfully',
            data: statistics
        });

    } catch (error: any) {
        Logger.error('Campaign statistics route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaign statistics',
            error: 'CAMPAIGN_STATISTICS_FAILED'
        });
    }
});

/**
 * @route   POST /api/campaigns/:id/messages
 * @desc    Create a message for a campaign
 * @access  Private (requires campaign:update permission)
 */
router.post('/:id/messages', authenticateToken, requireActiveUser, requirePermission('campaign:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const messageData: CampaignMessageRequest = req.body;

        // Validate required fields
        const requiredFields = ['title', 'content', 'type'];
        const missingFields = requiredFields.filter(field => !messageData[field as keyof CampaignMessageRequest]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: 'MISSING_FIELDS',
                required: missingFields
            });
        }

        // Parse scheduled date if provided
        if (messageData.scheduledDate) {
            messageData.scheduledDate = new Date(messageData.scheduledDate);
        }

        const message = await CampaignService.createCampaignMessage(id, messageData, req.userId!);

        Logger.info(`Campaign message created: ${message._id} for campaign: ${id} by user: ${req.userId}`);

        res.status(201).json({
            success: true,
            message: 'Campaign message created successfully',
            data: message
        });

    } catch (error: any) {
        Logger.error('Campaign message creation route error:', error);

        if (error.message.includes('Campaign not found')) {
            return res.status(404).json({
                success: false,
                message: error.message,
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        if (error.message.includes('inactive campaign')) {
            return res.status(400).json({
                success: false,
                message: error.message,
                error: 'INACTIVE_CAMPAIGN'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create campaign message',
            error: 'MESSAGE_CREATION_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns/:id/messages
 * @desc    Get all messages for a campaign
 * @access  Private (requires campaign:read permission)
 */
router.get('/:id/messages', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const messages = await CampaignService.getCampaignMessages(id);

        Logger.info(`Campaign messages retrieved: ${id} (${messages.length} messages) by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign messages retrieved successfully',
            data: {
                campaignId: id,
                messages,
                count: messages.length
            }
        });

    } catch (error: any) {
        Logger.error('Campaign messages retrieval route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaign messages',
            error: 'MESSAGE_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   POST /api/campaigns/:id/voters/assign
 * @desc    Assign voters to a campaign
 * @access  Private (requires campaign:update permission)
 */
router.post('/:id/voters/assign', authenticateToken, requireActiveUser, requirePermission('campaign:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { voterIds, notes } = req.body;

        if (!Array.isArray(voterIds) || voterIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Voter IDs array is required and must not be empty',
                error: 'INVALID_VOTER_IDS'
            });
        }

        const result = await CampaignService.assignVotersToCampaign(id, voterIds, req.userId!, notes);

        Logger.info(`Voters assigned to campaign: ${id} (${result.success} successful, ${result.failed} failed) by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter assignment completed',
            data: result
        });

    } catch (error: any) {
        Logger.error('Voter assignment route error:', error);

        if (error.message.includes('Campaign not found')) {
            return res.status(404).json({
                success: false,
                message: error.message,
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to assign voters to campaign',
            error: 'VOTER_ASSIGNMENT_FAILED'
        });
    }
});

/**
 * @route   POST /api/campaigns/:id/voters/remove
 * @desc    Remove voters from a campaign
 * @access  Private (requires campaign:update permission)
 */
router.post('/:id/voters/remove', authenticateToken, requireActiveUser, requirePermission('campaign:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { voterIds } = req.body;

        if (!Array.isArray(voterIds) || voterIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Voter IDs array is required and must not be empty',
                error: 'INVALID_VOTER_IDS'
            });
        }

        const result = await CampaignService.removeVotersFromCampaign(id, voterIds);

        Logger.info(`Voters removed from campaign: ${id} (${result.success} successful, ${result.failed} failed) by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter removal completed',
            data: result
        });

    } catch (error: any) {
        Logger.error('Voter removal route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to remove voters from campaign',
            error: 'VOTER_REMOVAL_FAILED'
        });
    }
});

/**
 * @route   POST /api/campaigns/:id/messages/:messageId/send
 * @desc    Send campaign message to assigned voters
 * @access  Private (requires campaign:update permission)
 */
router.post('/:id/messages/:messageId/send', authenticateToken, requireActiveUser, requirePermission('campaign:update'), async (req: Request, res: Response) => {
    try {
        const { id, messageId } = req.params;

        const result = await CampaignService.sendCampaignMessage(id, messageId);

        Logger.info(`Campaign message sent: ${messageId} to campaign: ${id} (${result.success} successful, ${result.failed} failed) by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign message sent successfully',
            data: result
        });

    } catch (error: any) {
        Logger.error('Campaign message sending route error:', error);

        if (error.message.includes('Message not found')) {
            return res.status(404).json({
                success: false,
                message: error.message,
                error: 'MESSAGE_NOT_FOUND'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to send campaign message',
            error: 'MESSAGE_SENDING_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns/:id/analytics
 * @desc    Get campaign analytics and performance metrics
 * @access  Private (requires campaign:read permission)
 */
router.get('/:id/analytics', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const analytics = await CampaignService.getCampaignAnalytics(id);

        Logger.info(`Campaign analytics retrieved: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign analytics retrieved successfully',
            data: analytics
        });

    } catch (error: any) {
        Logger.error('Campaign analytics route error:', error);

        if (error.message.includes('Campaign not found')) {
            return res.status(404).json({
                success: false,
                message: error.message,
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaign analytics',
            error: 'ANALYTICS_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   GET /api/campaigns/:id/performance
 * @desc    Get campaign performance summary
 * @access  Private (requires campaign:read permission)
 */
router.get('/:id/performance', authenticateToken, requireActiveUser, requirePermission('campaign:read'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const performance = await CampaignService.getCampaignPerformanceSummary(id);

        Logger.info(`Campaign performance retrieved: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Campaign performance retrieved successfully',
            data: performance
        });

    } catch (error: any) {
        Logger.error('Campaign performance route error:', error);

        if (error.message.includes('Campaign not found')) {
            return res.status(404).json({
                success: false,
                message: error.message,
                error: 'CAMPAIGN_NOT_FOUND'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve campaign performance',
            error: 'PERFORMANCE_RETRIEVAL_FAILED'
        });
    }
});

export default router;
