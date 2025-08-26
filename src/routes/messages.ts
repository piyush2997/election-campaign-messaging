import { Router, Request, Response } from 'express';
import { Message } from '../models/Message';
import { MessagePersonalizationService } from '../services/MessagePersonalizationService';
import { authenticateToken, requirePermission, requireActiveUser } from '../middleware/auth';
import { Logger } from '../config/logger';
import { MessageStatus, MessageType } from '../types';

const router = Router();

/**
 * @route   POST /api/messages
 * @desc    Create a new standalone message
 * @access  Private (requires message:create permission)
 */
router.post('/', authenticateToken, requireActiveUser, requirePermission('message:create'), async (req: Request, res: Response) => {
    try {
        const messageData = req.body;

        // Validate required fields
        const requiredFields = ['title', 'content', 'messageType'];
        const missingFields = requiredFields.filter(field => !messageData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                error: 'MISSING_FIELDS',
                required: missingFields
            });
        }

        // Validate message type
        if (!Object.values(MessageType).includes(messageData.messageType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message type',
                error: 'INVALID_MESSAGE_TYPE',
                validTypes: Object.values(MessageType)
            });
        }

        // Validate template variables if provided
        if (messageData.templateVariables && messageData.templateVariables.length > 0) {
            const validation = MessagePersonalizationService.validateTemplateVariables(messageData.content);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid template variables',
                    error: 'INVALID_TEMPLATE_VARIABLES',
                    errors: validation.errors
                });
            }
        }

        // Create message without campaign (standalone)
        const message = new Message({
            ...messageData,
            campaignId: undefined, // Standalone message
            createdBy: req.userId!,
            status: MessageStatus.DRAFT,
            totalRecipients: 0,
            sentCount: 0,
            deliveredCount: 0,
            failedCount: 0,
            optOutCount: 0,
            positiveResponseCount: 0,
            negativeResponseCount: 0,
            isActive: true
        });

        await message.save();

        Logger.info(`Standalone message created: ${message._id} by user: ${req.userId}`);

        res.status(201).json({
            success: true,
            message: 'Message created successfully',
            data: {
                id: message._id,
                title: message.title,
                content: message.content,
                messageType: message.messageType,
                status: message.status,
                templateVariables: message.templateVariables,
                variants: message.variants,
                createdAt: message.createdAt
            }
        });

    } catch (error: any) {
        Logger.error('Message creation route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to create message',
            error: 'MESSAGE_CREATION_FAILED'
        });
    }
});

/**
 * @route   GET /api/messages
 * @desc    Get all standalone messages
 * @access  Private (requires message:read permission)
 */
router.get('/', authenticateToken, requireActiveUser, requirePermission('message:read'), async (req: Request, res: Response) => {
    try {
        const messages = await Message.find({ campaignId: { $exists: false } })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'username email');

        Logger.info(`Standalone messages retrieved: ${messages.length} messages by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Messages retrieved successfully',
            data: {
                messages,
                count: messages.length
            }
        });

    } catch (error: any) {
        Logger.error('Message retrieval route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve messages',
            error: 'MESSAGE_RETRIEVAL_FAILED'
        });
    }
});

/**
 * @route   POST /api/messages/:id/preview
 * @desc    Preview a message with sample voter data
 * @access  Private (requires message:read permission)
 */
router.post('/:id/preview', authenticateToken, requireActiveUser, requirePermission('message:read'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { sampleVoter, language = 'en' } = req.body;

        const message = await Message.findOne({ _id: id, campaignId: { $exists: false } });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
                error: 'MESSAGE_NOT_FOUND'
            });
        }

        // Create sample voter data if not provided
        const defaultSampleVoter = {
            firstName: sampleVoter?.firstName || 'John',
            lastName: sampleVoter?.lastName || 'Doe',
            constituency: sampleVoter?.constituency || 'Sample Constituency',
            assemblySegment: sampleVoter?.assemblySegment || 'Sample Assembly',
            boothNumber: sampleVoter?.boothNumber || '001',
            age: sampleVoter?.age || 30,
            gender: sampleVoter?.gender || 'male',
            occupation: sampleVoter?.occupation || 'Professional'
        };

        const preview = MessagePersonalizationService.getMessagePreview(
            message,
            defaultSampleVoter,
            language
        );

        Logger.info(`Message preview generated: ${id} by user: ${req.userId}`);

        res.status(200).json({
            success: true,
            message: 'Message preview generated successfully',
            data: {
                messageId: id,
                sampleVoter: defaultSampleVoter,
                language,
                preview
            }
        });

    } catch (error: any) {
        Logger.error('Message preview route error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to generate message preview',
            error: 'MESSAGE_PREVIEW_FAILED'
        });
    }
});

export default router;
