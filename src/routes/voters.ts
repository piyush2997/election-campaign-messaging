import { Router, Request, Response } from 'express';
import { VoterService, VoterCreateRequest, VoterUpdateRequest, VoterSearchFilters } from '../services/VoterService';
import { authenticateToken, requirePermission, requireActiveUser } from '../middleware/auth';
import { Logger } from '../config/logger';

const router = Router();

/**
 * @route   POST /api/voters
 * @desc    Create a new voter
 * @access  Private (requires voter:create permission)
 */
router.post('/', authenticateToken, requireActiveUser, requirePermission('voter:create'), async (req: Request, res: Response) => {
    try {
        const voterData: VoterCreateRequest = req.body;

        // Validate required fields
        const requiredFields = ['boothNumber', 'phoneNumber', 'firstName', 'lastName', 'constituency'];
        const missingFields = requiredFields.filter(field => !voterData[field as keyof VoterCreateRequest]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: 'MISSING_FIELDS',
                required: missingFields
            });
        }

        const voter = await VoterService.createVoter(voterData);

        Logger.info(`Voter created successfully: ${voter._id} by user: ${req.userId}`);

        res.status(201).json({
            success: true,
            message: 'Voter created successfully',
            data: {
                id: voter._id,
                boothNumber: voter.boothNumber,
                phoneNumber: voter.phoneNumber,
                firstName: voter.firstName,
                lastName: voter.lastName,
                constituency: voter.constituency,
                isActive: voter.isActive
            }
        });

    } catch (error: any) {
        Logger.error('Voter creation route error:', error);

        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                message: error.message,
                error: 'VOTER_EXISTS'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create voter',
            error: 'VOTER_CREATION_FAILED'
        });
    }
});

/**
 * @route   GET /api/voters
 * @desc    Search and filter voters
 * @access  Private (requires voter:read permission)
 */
router.get('/', authenticateToken, requireActiveUser, requirePermission('voter:read'), async (req: Request, res: Response) => {
    try {
        const filters: VoterSearchFilters = {
            boothNumber: req.query.boothNumber as string,
            phoneNumber: req.query.phoneNumber as string,
            constituency: req.query.constituency as string,
            assemblySegment: req.query.assemblySegment as string,
            preferredLanguage: req.query.preferredLanguage as string,
            ageGroup: req.query.ageGroup as string,
            gender: req.query.gender as string,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            campaignId: req.query.campaignId as string,
            responseStatus: req.query.responseStatus as string,
            limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
            page: req.query.page ? parseInt(req.query.page as string) : undefined,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as 'asc' | 'desc'
        };

        const result = await VoterService.searchVoters(filters);

        Logger.info(`Voter search completed: ${result.voters.length} results by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voters retrieved successfully',
            data: result
        });

    } catch (error: any) {
        Logger.error('Voter search route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to search voters',
            error: 'VOTER_SEARCH_FAILED'
        });
    }
});

/**
 * @route   GET /api/voters/:id
 * @desc    Get voter by ID
 * @access  Private (requires voter:read permission)
 */
router.get('/:id', authenticateToken, requireActiveUser, requirePermission('voter:read'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const voter = await VoterService.getVoterById(id);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found',
                error: 'VOTER_NOT_FOUND'
            });
        }

        Logger.info(`Voter retrieved: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter retrieved successfully',
            data: voter
        });

    } catch (error: any) {
        Logger.error('Voter retrieval route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve voter',
            error: 'VOTER_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   GET /api/voters/phone/:phoneNumber
 * @desc    Get voter by phone number
 * @access  Private (requires voter:read permission)
 */
router.get('/phone/:phoneNumber', authenticateToken, requireActiveUser, requirePermission('voter:read'), async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.params;

        const voter = await VoterService.getVoterByPhone(phoneNumber);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found',
                error: 'VOTER_NOT_FOUND'
            });
        }

        Logger.info(`Voter retrieved by phone: ${phoneNumber} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter retrieved successfully',
            data: voter
        });

    } catch (error: any) {
        Logger.error('Voter phone lookup route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve voter',
            error: 'VOTER_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   GET /api/voters/booth/:boothNumber
 * @desc    Get voters by booth number
 * @access  Private (requires voter:read permission)
 */
router.get('/booth/:boothNumber', authenticateToken, requireActiveUser, requirePermission('voter:read'), async (req: Request, res: Response) => {
    try {
        const { boothNumber } = req.params;
        const { constituency } = req.query;

        const voters = await VoterService.getVotersByBooth(boothNumber, constituency as string);

        Logger.info(`Voters retrieved by booth: ${boothNumber} (${voters.length} results) by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voters retrieved successfully',
            data: {
                boothNumber,
                constituency: constituency || 'all',
                voters,
                count: voters.length
            }
        });

    } catch (error: any) {
        Logger.error('Voter booth lookup route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve voters by booth',
            error: 'VOTER_BOOTH_LOOKUP_FAILED'
        });
    }
});

/**
 * @route   GET /api/voters/constituency/:constituency
 * @desc    Get voters by constituency
 * @access  Private (requires voter:read permission)
 */
router.get('/constituency/:constituency', authenticateToken, requireActiveUser, requirePermission('voter:read'), async (req: Request, res: Response) => {
    try {
        const { constituency } = req.params;
        const options = {
            assemblySegment: req.query.assemblySegment as string,
            preferredLanguage: req.query.preferredLanguage as string,
            ageGroup: req.query.ageGroup as string
        };

        const voters = await VoterService.getVotersByConstituency(constituency, options);

        Logger.info(`Voters retrieved by constituency: ${constituency} (${voters.length} results) by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voters retrieved successfully',
            data: {
                constituency,
                options,
                voters,
                count: voters.length
            }
        });

    } catch (error: any) {
        Logger.error('Voter constituency lookup route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve voters by constituency',
            error: 'VOTER_CONSTITUENCY_LOOKUP_FAILED'
        });
    }
});

/**
 * @route   PUT /api/voters/:id
 * @desc    Update voter
 * @access  Private (requires voter:update permission)
 */
router.put('/:id', authenticateToken, requireActiveUser, requirePermission('voter:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData: VoterUpdateRequest = req.body;

        const voter = await VoterService.updateVoter(id, updateData);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found',
                error: 'VOTER_NOT_FOUND'
            });
        }

        Logger.info(`Voter updated: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter updated successfully',
            data: voter
        });

    } catch (error: any) {
        Logger.error('Voter update route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update voter',
            error: 'VOTER_UPDATE_FAILED'
        });
    }
});

/**
 * @route   DELETE /api/voters/:id
 * @desc    Delete voter (soft delete)
 * @access  Private (requires voter:delete permission)
 */
router.delete('/:id', authenticateToken, requireActiveUser, requirePermission('voter:delete'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const success = await VoterService.deleteVoter(id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found',
                error: 'VOTER_NOT_FOUND'
            });
        }

        Logger.info(`Voter deleted: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter deleted successfully'
        });

    } catch (error: any) {
        Logger.error('Voter deletion route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to delete voter',
            error: 'VOTER_DELETION_FAILED'
        });
    }
});

/**
 * @route   POST /api/voters/:id/campaigns/:campaignId
 * @desc    Add voter to campaign
 * @access  Private (requires voter:update permission)
 */
router.post('/:id/campaigns/:campaignId', authenticateToken, requireActiveUser, requirePermission('voter:update'), async (req: Request, res: Response) => {
    try {
        const { id, campaignId } = req.params;

        const voter = await VoterService.addVoterToCampaign(id, campaignId);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found',
                error: 'VOTER_NOT_FOUND'
            });
        }

        Logger.info(`Voter ${id} added to campaign ${campaignId} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter added to campaign successfully',
            data: voter
        });

    } catch (error: any) {
        Logger.error('Add voter to campaign route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to add voter to campaign',
            error: 'CAMPAIGN_ADDITION_FAILED'
        });
    }
});

/**
 * @route   PUT /api/voters/:id/campaigns/:campaignId/contact-status
 * @desc    Update voter contact status for a campaign
 * @access  Private (requires voter:update permission)
 */
router.put('/:id/campaigns/:campaignId/contact-status', authenticateToken, requireActiveUser, requirePermission('voter:update'), async (req: Request, res: Response) => {
    try {
        const { id, campaignId } = req.params;
        const { responseStatus, notes } = req.body;

        if (!responseStatus) {
            return res.status(400).json({
                success: false,
                message: 'Response status is required',
                error: 'MISSING_RESPONSE_STATUS'
            });
        }

        const voter = await VoterService.updateVoterContactStatus(id, campaignId, responseStatus, notes);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found',
                error: 'VOTER_NOT_FOUND'
            });
        }

        Logger.info(`Contact status updated for voter ${id} in campaign ${campaignId} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Contact status updated successfully',
            data: voter
        });

    } catch (error: any) {
        Logger.error('Update contact status route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to update contact status',
            error: 'CONTACT_STATUS_UPDATE_FAILED'
        });
    }
});

/**
 * @route   POST /api/voters/:id/opt-out
 * @desc    Opt out voter from all communications
 * @access  Private (requires voter:update permission)
 */
router.post('/:id/opt-out', authenticateToken, requireActiveUser, requirePermission('voter:update'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const voter = await VoterService.optOutVoter(id);

        if (!voter) {
            return res.status(404).json({
                success: false,
                message: 'Voter not found',
                error: 'VOTER_NOT_FOUND'
            });
        }

        Logger.info(`Voter ${id} opted out by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter opted out successfully',
            data: voter
        });

    } catch (error: any) {
        Logger.error('Voter opt-out route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to opt out voter',
            error: 'VOTER_OPT_OUT_FAILED'
        });
    }
});

/**
 * @route   GET /api/voters/statistics
 * @desc    Get voter statistics
 * @access  Private (requires voter:read permission)
 */
router.get('/statistics', authenticateToken, requireActiveUser, requirePermission('voter:read'), async (req: Request, res: Response) => {
    try {
        const { constituency } = req.query;

        const statistics = await VoterService.getVoterStatistics(constituency as string);

        Logger.info(`Voter statistics retrieved by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Voter statistics retrieved successfully',
            data: statistics
        });

    } catch (error: any) {
        Logger.error('Voter statistics route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve voter statistics',
            error: 'VOTER_STATISTICS_FAILED'
        });
    }
});

/**
 * @route   POST /api/voters/bulk-import
 * @desc    Bulk import voters from CSV data
 * @access  Private (requires voter:create permission)
 */
router.post('/bulk-import', authenticateToken, requireActiveUser, requirePermission('voter:create'), async (req: Request, res: Response) => {
    try {
        const { voters } = req.body;

        if (!Array.isArray(voters) || voters.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Voters array is required and must not be empty',
                error: 'INVALID_VOTERS_DATA'
            });
        }

        if (voters.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 1000 voters can be imported at once',
                error: 'TOO_MANY_VOTERS'
            });
        }

        const result = await VoterService.bulkImportVoters(voters);

        Logger.info(`Bulk import completed: ${result.success} successful, ${result.failed} failed by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Bulk import completed',
            data: result
        });

    } catch (error: any) {
        Logger.error('Bulk import route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to perform bulk import',
            error: 'BULK_IMPORT_FAILED'
        });
    }
});

export default router;
