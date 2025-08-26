const mongoose = require('mongoose');
const { CampaignService } = require('../dist/services/CampaignService');
const { Logger } = require('../dist/config/logger');

// Initialize logger
Logger.initialize();

// Test campaign data
const testCampaignData = {
    name: 'Test Campaign 2024',
    description: 'A test campaign for development purposes',
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    targetAudience: ['young_voters', 'first_time_voters'],
    createdBy: 'test_user_123',
    budget: 5000,
    tags: ['test', 'development', '2024']
};

async function testCampaignService() {
    try {
        Logger.info('Starting Campaign Service tests...');

        // Test 1: Create campaign
        Logger.info('Test 1: Creating campaign...');
        const createdCampaign = await CampaignService.createCampaign(testCampaignData);
        Logger.info(`Campaign created successfully with ID: ${createdCampaign._id}`);

        // Test 2: Get campaign by ID
        Logger.info('Test 2: Getting campaign by ID...');
        const retrievedCampaign = await CampaignService.getCampaignById(createdCampaign._id);
        if (retrievedCampaign) {
            Logger.info(`Campaign retrieved: ${retrievedCampaign.name}`);
        } else {
            Logger.error('Failed to retrieve campaign');
        }

        // Test 3: Update campaign
        Logger.info('Test 3: Updating campaign...');
        const updateData = {
            description: 'Updated test campaign description',
            budget: 7500
        };
        const updatedCampaign = await CampaignService.updateCampaign(createdCampaign._id, updateData);
        if (updatedCampaign) {
            Logger.info(`Campaign updated: ${updatedCampaign.description}, Budget: ${updatedCampaign.budget}`);
        } else {
            Logger.error('Failed to update campaign');
        }

        // Test 4: Search campaigns
        Logger.info('Test 4: Searching campaigns...');
        const searchFilters = {
            name: 'Test',
            limit: 10,
            page: 1
        };
        const searchResult = await CampaignService.searchCampaigns(searchFilters);
        Logger.info(`Search completed: ${searchResult.campaigns.length} results found`);

        // Test 5: Get campaigns by creator
        Logger.info('Test 5: Getting campaigns by creator...');
        const creatorCampaigns = await CampaignService.getCampaignsByCreator('test_user_123');
        Logger.info(`Found ${creatorCampaigns.length} campaigns for creator`);

        // Test 6: Activate campaign
        Logger.info('Test 6: Activating campaign...');
        const activatedCampaign = await CampaignService.activateCampaign(createdCampaign._id);
        if (activatedCampaign) {
            Logger.info(`Campaign activated: ${activatedCampaign.status}`);
        } else {
            Logger.error('Failed to activate campaign');
        }

        // Test 7: Get campaign statistics
        Logger.info('Test 7: Getting campaign statistics...');
        const statistics = await CampaignService.getCampaignStatistics('test_user_123');
        Logger.info(`Statistics: ${statistics.totalCampaigns} total campaigns, ${statistics.activeCampaigns} active`);

        // Test 8: Duplicate campaign
        Logger.info('Test 8: Duplicating campaign...');
        const duplicatedCampaign = await CampaignService.duplicateCampaign(
            createdCampaign._id,
            'Test Campaign 2024 - Copy',
            'test_user_123'
        );
        if (duplicatedCampaign) {
            Logger.info(`Campaign duplicated: ${duplicatedCampaign.name} (${duplicatedCampaign._id})`);
        } else {
            Logger.error('Failed to duplicate campaign');
        }

        // Test 9: Pause campaign
        Logger.info('Test 9: Pausing campaign...');
        const pausedCampaign = await CampaignService.pauseCampaign(createdCampaign._id);
        if (pausedCampaign) {
            Logger.info(`Campaign paused: ${pausedCampaign.status}`);
        } else {
            Logger.error('Failed to pause campaign');
        }

        // Test 10: Complete campaign
        Logger.info('Test 10: Completing campaign...');
        const completedCampaign = await CampaignService.completeCampaign(createdCampaign._id);
        if (completedCampaign) {
            Logger.info(`Campaign completed: ${completedCampaign.status}`);
        } else {
            Logger.error('Failed to complete campaign');
        }

        // Test 11: Delete campaign (soft delete)
        Logger.info('Test 11: Deleting campaign...');
        const deleteSuccess = await CampaignService.deleteCampaign(createdCampaign._id);
        if (deleteSuccess) {
            Logger.info('Campaign deleted successfully');
        } else {
            Logger.error('Failed to delete campaign');
        }

        // Test 12: Delete duplicated campaign
        if (duplicatedCampaign) {
            Logger.info('Test 12: Deleting duplicated campaign...');
            const duplicateDeleteSuccess = await CampaignService.deleteCampaign(duplicatedCampaign._id);
            if (duplicateDeleteSuccess) {
                Logger.info('Duplicated campaign deleted successfully');
            } else {
                Logger.error('Failed to delete duplicated campaign');
            }
        }

        Logger.info('All Campaign Service tests completed successfully!');

    } catch (error) {
        Logger.error('Campaign Service test failed:', error);
    } finally {
        // Close database connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            Logger.info('Database connection closed');
        }
        process.exit(0);
    }
}

// Connect to database and run tests
async function runTests() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/election_campaign';
        await mongoose.connect(mongoUri);
        Logger.info('Connected to MongoDB');

        // Run tests
        await testCampaignService();

    } catch (error) {
        Logger.error('Failed to run tests:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { testCampaignService };
