import { Campaign, CampaignDocument, CampaignModel } from '../models/Campaign';
import { Message, MessageDocument } from '../models/Message';
import { Voter, VoterDocument } from '../models/Voter';
import { VoterContact, VoterContactDocument } from '../models/VoterContact';
import { Logger } from '../config/logger';
import { CampaignStatus, MessageStatus, ContactStatus } from '../types';

export interface CampaignCreateRequest {
    name: string;
    description: string;
    startDate: Date;
    endDate: Date;
    targetAudience: string[];
    createdBy: string;
    budget?: number;
    tags?: string[];
}

export interface CampaignUpdateRequest {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    targetAudience?: string[];
    budget?: number;
    tags?: string[];
    isActive?: boolean;
}

export interface CampaignSearchFilters {
    name?: string;
    status?: CampaignStatus;
    targetAudience?: string;
    createdBy?: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CampaignSearchResult {
    campaigns: CampaignDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CampaignMessageRequest {
    title: string;
    content: string;
    type: string;
    scheduledDate?: Date;
    targetAudience?: string[];
}

export interface VoterCampaignAssignment {
    voterId: string;
    campaignId: string;
    assignedAt: Date;
    assignedBy: string;
    notes?: string;
}

export interface CampaignAnalytics {
    totalVoters: number;
    contactedVoters: number;
    responseRate: number;
    messageDeliveryStats: {
        total: number;
        delivered: number;
        failed: number;
        pending: number;
    };
    audienceBreakdown: Array<{
        segment: string;
        count: number;
        percentage: number;
    }>;
    engagementMetrics: {
        opens: number;
        clicks: number;
        responses: number;
        optOuts: number;
    };
}

export class CampaignService {
    private static readonly DEFAULT_LIMIT = 20;
    private static readonly MAX_LIMIT = 100;

    /**
     * Create a new campaign
     */
    public static async createCampaign(campaignData: CampaignCreateRequest): Promise<CampaignDocument> {
        try {
            Logger.info(`Creating new campaign: ${campaignData.name} by user: ${campaignData.createdBy}`);

            // Validate dates
            if (campaignData.startDate >= campaignData.endDate) {
                throw new Error('Start date must be before end date');
            }

            // Check if campaign name already exists for the creator
            const existingCampaign = await Campaign.findOne({
                name: campaignData.name,
                createdBy: campaignData.createdBy,
                isActive: true
            });

            if (existingCampaign) {
                throw new Error('Campaign with this name already exists for this user');
            }

            // Create new campaign
            const newCampaign = new Campaign({
                ...campaignData,
                status: CampaignStatus.DRAFT,
                isActive: true
            });

            await newCampaign.save();

            Logger.info(`Campaign created successfully: ${newCampaign._id}`);
            return newCampaign;

        } catch (error) {
            Logger.error('Campaign creation failed:', error);
            throw error;
        }
    }

    /**
     * Get campaign by ID
     */
    public static async getCampaignById(campaignId: string): Promise<CampaignDocument | null> {
        try {
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                Logger.warn(`Campaign not found: ${campaignId}`);
                return null;
            }
            return campaign;
        } catch (error) {
            Logger.error(`Error fetching campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Get campaigns by creator
     */
    public static async getCampaignsByCreator(createdBy: string): Promise<CampaignDocument[]> {
        try {
            const campaigns = await Campaign.find({ createdBy, isActive: true })
                .sort({ createdAt: -1 });

            Logger.info(`Found ${campaigns.length} campaigns for creator: ${createdBy}`);
            return campaigns;
        } catch (error) {
            Logger.error(`Error fetching campaigns for creator ${createdBy}:`, error);
            throw error;
        }
    }

    /**
     * Update campaign
     */
    public static async updateCampaign(campaignId: string, updateData: CampaignUpdateRequest): Promise<CampaignDocument | null> {
        try {
            Logger.info(`Updating campaign: ${campaignId}`);

            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                Logger.warn(`Campaign not found for update: ${campaignId}`);
                return null;
            }

            // Validate dates if both are being updated
            if (updateData.startDate && updateData.endDate) {
                if (updateData.startDate >= updateData.endDate) {
                    throw new Error('Start date must be before end date');
                }
            } else if (updateData.startDate && campaign.endDate) {
                if (updateData.startDate >= campaign.endDate) {
                    throw new Error('Start date must be before end date');
                }
            } else if (updateData.endDate && campaign.startDate) {
                if (campaign.startDate >= updateData.endDate) {
                    throw new Error('Start date must be before end date');
                }
            }

            // Update fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key as keyof CampaignUpdateRequest] !== undefined) {
                    (campaign as any)[key] = updateData[key as keyof CampaignUpdateRequest];
                }
            });

            await campaign.save();

            Logger.info(`Campaign updated successfully: ${campaignId}`);
            return campaign;

        } catch (error) {
            Logger.error(`Error updating campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Delete campaign (soft delete by setting isActive to false)
     */
    public static async deleteCampaign(campaignId: string): Promise<boolean> {
        try {
            Logger.info(`Deleting campaign: ${campaignId}`);

            const result = await Campaign.findByIdAndUpdate(campaignId, {
                isActive: false,
                status: CampaignStatus.CANCELLED
            });

            if (!result) {
                Logger.warn(`Campaign not found for deletion: ${campaignId}`);
                return false;
            }

            Logger.info(`Campaign deleted successfully: ${campaignId}`);
            return true;

        } catch (error) {
            Logger.error(`Error deleting campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Search and filter campaigns
     */
    public static async searchCampaigns(filters: CampaignSearchFilters): Promise<CampaignSearchResult> {
        try {
            const {
                name,
                status,
                targetAudience,
                createdBy,
                startDate,
                endDate,
                isActive,
                limit = this.DEFAULT_LIMIT,
                page = 1,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = filters;

            // Build query
            const query: any = {};

            if (name) query.name = { $regex: name, $options: 'i' };
            if (status) query.status = status;
            if (targetAudience) query.targetAudience = { $in: [targetAudience] };
            if (createdBy) query.createdBy = createdBy;
            if (startDate) query.startDate = { $gte: startDate };
            if (endDate) query.endDate = { $lte: endDate };
            if (isActive !== undefined) query.isActive = isActive;

            // Apply limit
            const actualLimit = Math.min(limit, this.MAX_LIMIT);
            const skip = (page - 1) * actualLimit;

            // Build sort object
            const sort: any = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const [campaigns, total] = await Promise.all([
                Campaign.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(actualLimit),
                Campaign.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / actualLimit);

            Logger.info(`Campaign search completed: ${campaigns.length} results, page ${page}/${totalPages}`);

            return {
                campaigns,
                total,
                page,
                limit: actualLimit,
                totalPages
            };

        } catch (error) {
            Logger.error('Campaign search failed:', error);
            throw error;
        }
    }

    /**
     * Activate campaign
     */
    public static async activateCampaign(campaignId: string): Promise<CampaignDocument | null> {
        try {
            Logger.info(`Activating campaign: ${campaignId}`);

            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                Logger.warn(`Campaign not found for activation: ${campaignId}`);
                return null;
            }

            await campaign.activate();
            Logger.info(`Campaign activated successfully: ${campaignId}`);
            return campaign;

        } catch (error) {
            Logger.error(`Error activating campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Pause campaign
     */
    public static async pauseCampaign(campaignId: string): Promise<CampaignDocument | null> {
        try {
            Logger.info(`Pausing campaign: ${campaignId}`);

            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                Logger.warn(`Campaign not found for pausing: ${campaignId}`);
                return null;
            }

            await campaign.pause();
            Logger.info(`Campaign paused successfully: ${campaignId}`);
            return campaign;

        } catch (error) {
            Logger.error(`Error pausing campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Complete campaign
     */
    public static async completeCampaign(campaignId: string): Promise<CampaignDocument | null> {
        try {
            Logger.info(`Completing campaign: ${campaignId}`);

            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                Logger.warn(`Campaign not found for completion: ${campaignId}`);
                return null;
            }

            await campaign.complete();
            Logger.info(`Campaign completed successfully: ${campaignId}`);
            return campaign;

        } catch (error) {
            Logger.error(`Error completing campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Get active campaigns
     */
    public static async getActiveCampaigns(): Promise<CampaignDocument[]> {
        try {
            const campaigns = await Campaign.findActiveCampaigns();
            Logger.info(`Found ${campaigns.length} active campaigns`);
            return campaigns;
        } catch (error) {
            Logger.error('Error fetching active campaigns:', error);
            throw error;
        }
    }

    /**
     * Get campaigns by target audience
     */
    public static async getCampaignsByTargetAudience(audience: string): Promise<CampaignDocument[]> {
        try {
            const campaigns = await Campaign.findByTargetAudience(audience);
            Logger.info(`Found ${campaigns.length} campaigns for target audience: ${audience}`);
            return campaigns;
        } catch (error) {
            Logger.error(`Error fetching campaigns for target audience ${audience}:`, error);
            throw error;
        }
    }

    /**
     * Get campaign statistics
     */
    public static async getCampaignStatistics(createdBy?: string): Promise<any> {
        try {
            const query: any = { isActive: true };
            if (createdBy) query.createdBy = createdBy;

            const [
                totalCampaigns,
                draftCampaigns,
                activeCampaigns,
                pausedCampaigns,
                completedCampaigns,
                cancelledCampaigns,
                statusStats,
                audienceStats
            ] = await Promise.all([
                Campaign.countDocuments(query),
                Campaign.countDocuments({ ...query, status: CampaignStatus.DRAFT }),
                Campaign.countDocuments({ ...query, status: CampaignStatus.ACTIVE }),
                Campaign.countDocuments({ ...query, status: CampaignStatus.PAUSED }),
                Campaign.countDocuments({ ...query, status: CampaignStatus.COMPLETED }),
                Campaign.countDocuments({ ...query, status: CampaignStatus.CANCELLED }),
                Campaign.aggregate([
                    { $match: query },
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                Campaign.aggregate([
                    { $match: query },
                    { $unwind: '$targetAudience' },
                    { $group: { _id: '$targetAudience', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ])
            ]);

            return {
                totalCampaigns,
                draftCampaigns,
                activeCampaigns,
                pausedCampaigns,
                completedCampaigns,
                cancelledCampaigns,
                statusStats,
                audienceStats,
                lastUpdated: new Date()
            };

        } catch (error) {
            Logger.error('Error fetching campaign statistics:', error);
            throw error;
        }
    }

    /**
     * Duplicate campaign
     */
    public static async duplicateCampaign(campaignId: string, newName: string, createdBy: string): Promise<CampaignDocument | null> {
        try {
            Logger.info(`Duplicating campaign: ${campaignId} with new name: ${newName}`);

            const originalCampaign = await Campaign.findById(campaignId);
            if (!originalCampaign) {
                Logger.warn(`Campaign not found for duplication: ${campaignId}`);
                return null;
            }

            // Check if new name already exists for the creator
            const existingCampaign = await Campaign.findOne({
                name: newName,
                createdBy: createdBy,
                isActive: true
            });

            if (existingCampaign) {
                throw new Error('Campaign with this name already exists for this user');
            }

            // Create duplicate campaign
            const duplicatedCampaign = new Campaign({
                name: newName,
                description: originalCampaign.description,
                startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                targetAudience: [...originalCampaign.targetAudience],
                createdBy: createdBy,
                budget: originalCampaign.budget,
                tags: [...(originalCampaign.tags || [])],
                status: CampaignStatus.DRAFT,
                isActive: true
            });

            await duplicatedCampaign.save();

            Logger.info(`Campaign duplicated successfully: ${duplicatedCampaign._id}`);
            return duplicatedCampaign;

        } catch (error) {
            Logger.error(`Error duplicating campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Create a message for a campaign
     */
    public static async createCampaignMessage(
        campaignId: string,
        messageData: CampaignMessageRequest,
        createdBy: string
    ): Promise<MessageDocument> {
        try {
            Logger.info(`Creating message for campaign: ${campaignId}`);

            // Verify campaign exists and is active
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                throw new Error('Campaign not found');
            }

            if (!campaign.isActive) {
                throw new Error('Cannot create message for inactive campaign');
            }

            // Create message
            const newMessage = new Message({
                campaignId,
                title: messageData.title,
                content: messageData.content,
                type: messageData.type,
                scheduledDate: messageData.scheduledDate,
                status: MessageStatus.DRAFT,
                targetAudience: messageData.targetAudience || campaign.targetAudience,
                createdBy
            });

            await newMessage.save();

            Logger.info(`Message created successfully: ${newMessage._id} for campaign: ${campaignId}`);
            return newMessage;

        } catch (error) {
            Logger.error(`Error creating campaign message: ${error}`);
            throw error;
        }
    }

    /**
     * Get all messages for a campaign
     */
    public static async getCampaignMessages(campaignId: string): Promise<MessageDocument[]> {
        try {
            const messages = await Message.find({ campaignId }).sort({ createdAt: -1 });
            Logger.info(`Found ${messages.length} messages for campaign: ${campaignId}`);
            return messages;
        } catch (error) {
            Logger.error(`Error fetching campaign messages: ${error}`);
            throw error;
        }
    }

    /**
     * Assign voters to a campaign
     */
    public static async assignVotersToCampaign(
        campaignId: string,
        voterIds: string[],
        assignedBy: string,
        notes?: string
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        try {
            Logger.info(`Assigning ${voterIds.length} voters to campaign: ${campaignId}`);

            // Verify campaign exists
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                throw new Error('Campaign not found');
            }

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[]
            };

            for (const voterId of voterIds) {
                try {
                    // Check if voter exists
                    const voter = await Voter.findById(voterId);
                    if (!voter) {
                        results.failed++;
                        results.errors.push(`Voter ${voterId} not found`);
                        continue;
                    }

                    // Check if already assigned
                    const existingAssignment = await VoterContact.findOne({
                        voterId,
                        campaignId
                    });

                    if (existingAssignment) {
                        results.failed++;
                        results.errors.push(`Voter ${voterId} already assigned to campaign`);
                        continue;
                    }

                    // Create voter contact record
                    const voterContact = new VoterContact({
                        voterId,
                        campaignId,
                        messageId: null, // Will be set when message is sent
                        contactMethod: 'email', // Default, can be updated
                        status: ContactStatus.PENDING,
                        assignedAt: new Date(),
                        assignedBy,
                        notes
                    });

                    await voterContact.save();

                    // Update voter's campaigns array
                    await Voter.findByIdAndUpdate(voterId, {
                        $addToSet: { campaigns: campaignId }
                    });

                    results.success++;

                } catch (error) {
                    results.failed++;
                    results.errors.push(`Error assigning voter ${voterId}: ${error}`);
                }
            }

            Logger.info(`Voter assignment completed: ${results.success} successful, ${results.failed} failed`);
            return results;

        } catch (error) {
            Logger.error(`Error assigning voters to campaign: ${error}`);
            throw error;
        }
    }

    /**
     * Remove voters from a campaign
     */
    public static async removeVotersFromCampaign(
        campaignId: string,
        voterIds: string[]
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        try {
            Logger.info(`Removing ${voterIds.length} voters from campaign: ${campaignId}`);

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[]
            };

            for (const voterId of voterIds) {
                try {
                    // Remove voter contact records
                    const deleteResult = await VoterContact.deleteMany({
                        voterId,
                        campaignId
                    });

                    if (deleteResult.deletedCount > 0) {
                        // Update voter's campaigns array
                        await Voter.findByIdAndUpdate(voterId, {
                            $pull: { campaigns: campaignId }
                        });

                        results.success++;
                    } else {
                        results.failed++;
                        results.errors.push(`Voter ${voterId} not found in campaign`);
                    }

                } catch (error) {
                    results.failed++;
                    results.errors.push(`Error removing voter ${voterId}: ${error}`);
                }
            }

            Logger.info(`Voter removal completed: ${results.success} successful, ${results.failed} failed`);
            return results;

        } catch (error) {
            Logger.error(`Error removing voters from campaign: ${error}`);
            throw error;
        }
    }

    /**
     * Get campaign analytics and performance metrics
     */
    public static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
        try {
            Logger.info(`Generating analytics for campaign: ${campaignId}`);

            // Get campaign details
            const campaign = await Campaign.findById(campaignId);
            if (!campaign) {
                throw new Error('Campaign not found');
            }

            // Get voter contact statistics
            const [
                totalVoters,
                contactedVoters,
                messageStats,
                audienceStats,
                engagementStats
            ] = await Promise.all([
                VoterContact.countDocuments({ campaignId }),
                VoterContact.countDocuments({
                    campaignId,
                    status: { $in: [ContactStatus.SENT, ContactStatus.DELIVERED, ContactStatus.READ] }
                }),
                VoterContact.aggregate([
                    { $match: { campaignId } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                VoterContact.aggregate([
                    { $match: { campaignId } },
                    { $lookup: { from: 'voters', localField: 'voterId', foreignField: '_id', as: 'voter' } },
                    { $unwind: '$voter' },
                    { $group: { _id: '$voter.demographics.location', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                VoterContact.aggregate([
                    { $match: { campaignId } },
                    {
                        $group: {
                            _id: null,
                            opens: { $sum: { $cond: { if: { $eq: ['$status', ContactStatus.READ] }, then: 1, else: 0 } } },
                            responses: { $sum: { $cond: { if: { $eq: ['$responseStatus', 'responded'] }, then: 1, else: 0 } } },
                            optOuts: { $sum: { $cond: { if: { $eq: ['$responseStatus', 'opted_out'] }, then: 1, else: 0 } } }
                        }
                    }
                ])
            ]);

            // Calculate response rate
            const responseRate = totalVoters > 0 ? (contactedVoters / totalVoters) * 100 : 0;

            // Process message delivery stats
            const messageDeliveryStats = {
                total: totalVoters,
                delivered: 0,
                failed: 0,
                pending: 0
            };

            messageStats.forEach(stat => {
                switch (stat._id) {
                    case ContactStatus.DELIVERED:
                        messageDeliveryStats.delivered = stat.count;
                        break;
                    case ContactStatus.FAILED:
                        messageDeliveryStats.failed = stat.count;
                        break;
                    case ContactStatus.PENDING:
                        messageDeliveryStats.pending = stat.count;
                        break;
                }
            });

            // Process audience breakdown
            const audienceBreakdown = audienceStats.map(stat => ({
                segment: stat._id,
                count: stat.count,
                percentage: (stat.count / totalVoters) * 100
            }));

            // Process engagement metrics
            const engagementMetrics = engagementStats.length > 0 ? engagementStats[0] : {
                opens: 0,
                responses: 0,
                optOuts: 0
            };

            const analytics: CampaignAnalytics = {
                totalVoters,
                contactedVoters,
                responseRate: Math.round(responseRate * 100) / 100,
                messageDeliveryStats,
                audienceBreakdown,
                engagementMetrics: {
                    opens: engagementMetrics.opens || 0,
                    clicks: 0, // Not implemented yet
                    responses: engagementMetrics.responses || 0,
                    optOuts: engagementMetrics.optOuts || 0
                }
            };

            Logger.info(`Analytics generated successfully for campaign: ${campaignId}`);
            return analytics;

        } catch (error) {
            Logger.error(`Error generating campaign analytics: ${error}`);
            throw error;
        }
    }

    /**
     * Send campaign message to assigned voters
     */
    public static async sendCampaignMessage(
        campaignId: string,
        messageId: string
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        try {
            Logger.info(`Sending campaign message: ${messageId} to campaign: ${campaignId}`);

            // Verify message exists and belongs to campaign
            const message = await Message.findById(messageId);
            if (!message || message.campaignId.toString() !== campaignId) {
                throw new Error('Message not found or does not belong to campaign');
            }

            // Get all pending voter contacts for this campaign
            const pendingContacts = await VoterContact.find({
                campaignId,
                status: ContactStatus.PENDING
            });

            if (pendingContacts.length === 0) {
                Logger.info('No pending contacts found for campaign');
                return { success: 0, failed: 0, errors: [] };
            }

            const results = {
                success: 0,
                failed: 0,
                errors: [] as string[]
            };

            // Update message status to scheduled
            await Message.findByIdAndUpdate(messageId, { status: MessageStatus.SCHEDULED });

            // Process each contact
            for (const contact of pendingContacts) {
                try {
                    // Update contact with message ID and status
                    await VoterContact.findByIdAndUpdate(contact._id, {
                        messageId,
                        status: ContactStatus.SENT,
                        sentAt: new Date()
                    });

                    results.success++;

                } catch (error) {
                    results.failed++;
                    results.errors.push(`Error processing contact ${contact._id}: ${error}`);
                }
            }

            Logger.info(`Message sending completed: ${results.success} successful, ${results.failed} failed`);
            return results;

        } catch (error) {
            Logger.error(`Error sending campaign message: ${error}`);
            throw error;
        }
    }

    /**
     * Get campaign performance summary
     */
    public static async getCampaignPerformanceSummary(campaignId: string): Promise<any> {
        try {
            const analytics = await this.getCampaignAnalytics(campaignId);
            const campaign = await Campaign.findById(campaignId);

            if (!campaign) {
                throw new Error('Campaign not found');
            }

            const performanceSummary = {
                campaignId,
                campaignName: campaign.name,
                status: campaign.status,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                targetAudience: campaign.targetAudience,
                budget: campaign.budget,
                analytics,
                efficiency: {
                    costPerContact: campaign.budget && analytics.totalVoters > 0
                        ? campaign.budget / analytics.totalVoters
                        : 0,
                    responseRate: analytics.responseRate,
                    engagementScore: (analytics.engagementMetrics.opens + analytics.engagementMetrics.responses) / analytics.totalVoters * 100
                }
            };

            return performanceSummary;

        } catch (error) {
            Logger.error(`Error generating performance summary: ${error}`);
            throw error;
        }
    }
}
