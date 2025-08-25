import { Voter, VoterDocument } from '../models/Voter';
import { Logger } from '../config/logger';
import { EnvConfig } from '../config/EnvConfig';

export interface VoterCreateRequest {
    boothNumber: string;
    phoneNumber: string;
    voterId?: string;
    firstName: string;
    lastName: string;
    constituency: string;
    assemblySegment?: string;
    preferredLanguage?: string;
    contactPreferences?: {
        sms: boolean;
        whatsapp: boolean;
        voiceCall: boolean;
        email: boolean;
    };
    age?: number;
    gender?: 'male' | 'female' | 'other';
    occupation?: string;
    votingHistory?: {
        lastElection: string;
        voted: boolean;
        party?: string;
    };
}

export interface VoterUpdateRequest {
    boothNumber?: string;
    phoneNumber?: string;
    voterId?: string;
    firstName?: string;
    lastName?: string;
    constituency?: string;
    assemblySegment?: string;
    preferredLanguage?: string;
    contactPreferences?: {
        sms: boolean;
        whatsapp: boolean;
        voiceCall: boolean;
        email: boolean;
    };
    age?: number;
    gender?: 'male' | 'female' | 'other';
    occupation?: string;
    votingHistory?: {
        lastElection: string;
        voted: boolean;
        party?: string;
    };
    isActive?: boolean;
}

export interface VoterSearchFilters {
    boothNumber?: string;
    phoneNumber?: string;
    constituency?: string;
    assemblySegment?: string;
    preferredLanguage?: string;
    ageGroup?: string;
    gender?: string;
    isActive?: boolean;
    campaignId?: string;
    responseStatus?: string;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface VoterSearchResult {
    voters: VoterDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class VoterService {
    private static readonly DEFAULT_LIMIT = 20;
    private static readonly MAX_LIMIT = 100;

    /**
     * Create a new voter
     */
    public static async createVoter(voterData: VoterCreateRequest): Promise<VoterDocument> {
        try {
            Logger.info(`Creating new voter: ${voterData.firstName} ${voterData.lastName} (${voterData.phoneNumber})`);

            // Check if voter already exists with same phone number
            const existingVoter = await Voter.findOne({ phoneNumber: voterData.phoneNumber });
            if (existingVoter) {
                throw new Error('Voter with this phone number already exists');
            }

            // Check if voter already exists with same booth number and constituency
            if (voterData.boothNumber && voterData.constituency) {
                const existingBoothVoter = await Voter.findOne({
                    boothNumber: voterData.boothNumber.toUpperCase(),
                    constituency: voterData.constituency
                });
                if (existingBoothVoter) {
                    Logger.warn(`Voter already exists at booth ${voterData.boothNumber} in constituency ${voterData.constituency}`);
                }
            }

            // Create new voter with defaults
            const newVoter = new Voter({
                ...voterData,
                boothNumber: voterData.boothNumber.toUpperCase(),
                preferredLanguage: voterData.preferredLanguage || 'en',
                contactPreferences: {
                    sms: true,
                    whatsapp: true,
                    voiceCall: false,
                    email: false,
                    ...voterData.contactPreferences
                },
                optOutStatus: false,
                campaigns: [],
                isActive: true,
                lastActivityDate: new Date()
            });

            await newVoter.save();

            Logger.info(`Voter created successfully: ${newVoter._id}`);
            return newVoter;

        } catch (error) {
            Logger.error('Voter creation failed:', error);
            throw error;
        }
    }

    /**
     * Get voter by ID
     */
    public static async getVoterById(voterId: string): Promise<VoterDocument | null> {
        try {
            const voter = await Voter.findById(voterId);
            if (!voter) {
                Logger.warn(`Voter not found: ${voterId}`);
                return null;
            }
            return voter;
        } catch (error) {
            Logger.error(`Error fetching voter ${voterId}:`, error);
            throw error;
        }
    }

    /**
     * Get voter by phone number
     */
    public static async getVoterByPhone(phoneNumber: string): Promise<VoterDocument | null> {
        try {
            const voter = await Voter.findByPhone(phoneNumber);
            return voter;
        } catch (error) {
            Logger.error(`Error fetching voter by phone ${phoneNumber}:`, error);
            throw error;
        }
    }

    /**
     * Get voters by booth number
     */
    public static async getVotersByBooth(boothNumber: string, constituency?: string): Promise<VoterDocument[]> {
        try {
            const voters = await Voter.findByBooth(boothNumber, constituency);
            return voters;
        } catch (error) {
            Logger.error(`Error fetching voters by booth ${boothNumber}:`, error);
            throw error;
        }
    }

    /**
     * Update voter
     */
    public static async updateVoter(voterId: string, updateData: VoterUpdateRequest): Promise<VoterDocument | null> {
        try {
            Logger.info(`Updating voter: ${voterId}`);

            const voter = await Voter.findById(voterId);
            if (!voter) {
                Logger.warn(`Voter not found for update: ${voterId}`);
                return null;
            }

            // Update fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key as keyof VoterUpdateRequest] !== undefined) {
                    (voter as any)[key] = updateData[key as keyof VoterUpdateRequest];
                }
            });

            // Update activity timestamp
            voter.lastActivityDate = new Date();

            // Handle booth number uppercase conversion
            if (updateData.boothNumber) {
                voter.boothNumber = updateData.boothNumber.toUpperCase();
            }

            await voter.save();

            Logger.info(`Voter updated successfully: ${voterId}`);
            return voter;

        } catch (error) {
            Logger.error(`Error updating voter ${voterId}:`, error);
            throw error;
        }
    }

    /**
     * Delete voter (soft delete by setting isActive to false)
     */
    public static async deleteVoter(voterId: string): Promise<boolean> {
        try {
            Logger.info(`Deleting voter: ${voterId}`);

            const result = await Voter.findByIdAndUpdate(voterId, {
                isActive: false,
                lastActivityDate: new Date()
            });

            if (!result) {
                Logger.warn(`Voter not found for deletion: ${voterId}`);
                return false;
            }

            Logger.info(`Voter deleted successfully: ${voterId}`);
            return true;

        } catch (error) {
            Logger.error(`Error deleting voter ${voterId}:`, error);
            throw error;
        }
    }

    /**
     * Search and filter voters
     */
    public static async searchVoters(filters: VoterSearchFilters): Promise<VoterSearchResult> {
        try {
            const {
                boothNumber,
                phoneNumber,
                constituency,
                assemblySegment,
                preferredLanguage,
                ageGroup,
                gender,
                isActive,
                campaignId,
                responseStatus,
                limit = this.DEFAULT_LIMIT,
                page = 1,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = filters;

            // Build query
            const query: any = {};

            if (boothNumber) query.boothNumber = boothNumber.toUpperCase();
            if (phoneNumber) query.phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
            if (constituency) query.constituency = constituency;
            if (assemblySegment) query.assemblySegment = assemblySegment;
            if (preferredLanguage) query.preferredLanguage = preferredLanguage;
            if (gender) query.gender = gender;
            if (isActive !== undefined) query.isActive = isActive;

            // Handle age group filtering
            if (ageGroup) {
                const ageRanges: { [key: string]: { min: number; max: number } } = {
                    '18-24': { min: 18, max: 24 },
                    '25-34': { min: 25, max: 34 },
                    '35-44': { min: 35, max: 44 },
                    '45-54': { min: 45, max: 54 },
                    '55-64': { min: 55, max: 64 },
                    '65+': { min: 65, max: 120 }
                };

                if (ageRanges[ageGroup]) {
                    const range = ageRanges[ageGroup];
                    query.age = { $gte: range.min, $lte: range.max };
                }
            }

            // Handle campaign-based filtering
            if (campaignId) {
                query['campaigns.campaignId'] = campaignId;
                if (responseStatus) {
                    query['campaigns.responseStatus'] = responseStatus;
                }
            }

            // Apply limit
            const actualLimit = Math.min(limit, this.MAX_LIMIT);
            const skip = (page - 1) * actualLimit;

            // Build sort object
            const sort: any = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute query
            const [voters, total] = await Promise.all([
                Voter.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(actualLimit),
                Voter.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / actualLimit);

            Logger.info(`Voter search completed: ${voters.length} results, page ${page}/${totalPages}`);

            return {
                voters,
                total,
                page,
                limit: actualLimit,
                totalPages
            };

        } catch (error) {
            Logger.error('Voter search failed:', error);
            throw error;
        }
    }

    /**
     * Get voters by constituency
     */
    public static async getVotersByConstituency(constituency: string, options: any = {}): Promise<VoterDocument[]> {
        try {
            const voters = await Voter.findByConstituency(constituency, options);
            Logger.info(`Found ${voters.length} voters in constituency: ${constituency}`);
            return voters;
        } catch (error) {
            Logger.error(`Error fetching voters by constituency ${constituency}:`, error);
            throw error;
        }
    }

    /**
     * Get contactable voters for a campaign
     */
    public static async getContactableVotersForCampaign(campaignId: string, constituency?: string): Promise<VoterDocument[]> {
        try {
            const voters = await Voter.findContactableForCampaign(campaignId, constituency);
            Logger.info(`Found ${voters.length} contactable voters for campaign: ${campaignId}`);
            return voters;
        } catch (error) {
            Logger.error(`Error fetching contactable voters for campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Add voter to campaign
     */
    public static async addVoterToCampaign(voterId: string, campaignId: string): Promise<VoterDocument | null> {
        try {
            Logger.info(`Adding voter ${voterId} to campaign ${campaignId}`);

            const voter = await Voter.findById(voterId);
            if (!voter) {
                Logger.warn(`Voter not found: ${voterId}`);
                return null;
            }

            await voter.addCampaign(campaignId);
            Logger.info(`Voter ${voterId} added to campaign ${campaignId} successfully`);
            return voter;

        } catch (error) {
            Logger.error(`Error adding voter ${voterId} to campaign ${campaignId}:`, error);
            throw error;
        }
    }

    /**
     * Update voter contact status for a campaign
     */
    public static async updateVoterContactStatus(
        voterId: string,
        campaignId: string,
        responseStatus: string,
        notes?: string
    ): Promise<VoterDocument | null> {
        try {
            Logger.info(`Updating contact status for voter ${voterId} in campaign ${campaignId}`);

            const voter = await Voter.findById(voterId);
            if (!voter) {
                Logger.warn(`Voter not found: ${voterId}`);
                return null;
            }

            await voter.updateContactStatus(campaignId, responseStatus, notes);
            Logger.info(`Contact status updated for voter ${voterId} in campaign ${campaignId}`);
            return voter;

        } catch (error) {
            Logger.error(`Error updating contact status for voter ${voterId}:`, error);
            throw error;
        }
    }

    /**
     * Opt out voter from all communications
     */
    public static async optOutVoter(voterId: string): Promise<VoterDocument | null> {
        try {
            Logger.info(`Opting out voter: ${voterId}`);

            const voter = await Voter.findById(voterId);
            if (!voter) {
                Logger.warn(`Voter not found: ${voterId}`);
                return null;
            }

            await voter.optOut();
            Logger.info(`Voter ${voterId} opted out successfully`);
            return voter;

        } catch (error) {
            Logger.error(`Error opting out voter ${voterId}:`, error);
            throw error;
        }
    }

    /**
     * Get voter statistics
     */
    public static async getVoterStatistics(constituency?: string): Promise<any> {
        try {
            const query: any = { isActive: true };
            if (constituency) query.constituency = constituency;

            const [
                totalVoters,
                activeVoters,
                optedOutVoters,
                constituencyStats,
                languageStats,
                ageGroupStats
            ] = await Promise.all([
                Voter.countDocuments(query),
                Voter.countDocuments({ ...query, optOutStatus: false }),
                Voter.countDocuments({ ...query, optOutStatus: true }),
                Voter.aggregate([
                    { $match: query },
                    { $group: { _id: '$constituency', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                Voter.aggregate([
                    { $match: query },
                    { $group: { _id: '$preferredLanguage', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                Voter.aggregate([
                    { $match: query },
                    {
                        $group: {
                            _id: {
                                $switch: {
                                    branches: [
                                        { case: { $lt: ['$age', 25] }, then: '18-24' },
                                        { case: { $lt: ['$age', 35] }, then: '25-34' },
                                        { case: { $lt: ['$age', 45] }, then: '35-44' },
                                        { case: { $lt: ['$age', 55] }, then: '45-54' },
                                        { case: { $lt: ['$age', 65] }, then: '55-64' }
                                    ],
                                    default: '65+'
                                }
                            },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ])
            ]);

            return {
                totalVoters,
                activeVoters,
                optedOutVoters,
                constituencyStats,
                languageStats,
                ageGroupStats,
                lastUpdated: new Date()
            };

        } catch (error) {
            Logger.error('Error fetching voter statistics:', error);
            throw error;
        }
    }

    /**
     * Bulk import voters (for CSV uploads)
     */
    public static async bulkImportVoters(votersData: VoterCreateRequest[]): Promise<{
        success: number;
        failed: number;
        errors: Array<{ index: number; error: string; data: any }>;
    }> {
        try {
            Logger.info(`Starting bulk import of ${votersData.length} voters`);

            const results = {
                success: 0,
                failed: 0,
                errors: [] as Array<{ index: number; error: string; data: any }>
            };

            for (let i = 0; i < votersData.length; i++) {
                try {
                    const voterData = votersData[i];
                    await this.createVoter(voterData);
                    results.success++;
                } catch (error: any) {
                    results.failed++;
                    results.errors.push({
                        index: i,
                        error: error.message,
                        data: votersData[i]
                    });
                }
            }

            Logger.info(`Bulk import completed: ${results.success} successful, ${results.failed} failed`);
            return results;

        } catch (error) {
            Logger.error('Bulk import failed:', error);
            throw error;
        }
    }
}
