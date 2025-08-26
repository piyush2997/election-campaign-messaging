const mongoose = require('mongoose');
const { CampaignService } = require('../dist/services/CampaignService');
const { Logger } = require('../dist/config/logger');

// Initialize logger
Logger.initialize();

async function testAdvancedCampaignFeatures() {
    try {
        Logger.info('🚀 Starting Advanced Campaign Features Tests...');
        
        // Test data
        const testCampaignData = {
            name: 'Advanced Test Campaign 2024',
            description: 'A comprehensive test campaign for advanced features',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            targetAudience: ['young_voters', 'first_time_voters'],
            createdBy: 'test_user_456',
            budget: 15000,
            tags: ['advanced', 'test', '2024']
        };

        // Test 1: Create advanced campaign
        Logger.info('📋 Test 1: Creating advanced campaign...');
        const createdCampaign = await CampaignService.createCampaign(testCampaignData);
        Logger.info(`✅ Campaign created: ${createdCampaign._id}`);

        // Test 2: Create campaign message
        Logger.info('📨 Test 2: Creating campaign message...');
        const messageData = {
            title: 'Important Election Update',
            content: 'Your vote matters! Election day is approaching.',
            type: 'sms',
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        };
        
        const createdMessage = await CampaignService.createCampaignMessage(
            createdCampaign._id,
            messageData,
            'test_user_456'
        );
        Logger.info(`✅ Message created: ${createdMessage._id}`);

        // Test 3: Get campaign messages
        Logger.info('📬 Test 3: Retrieving campaign messages...');
        const campaignMessages = await CampaignService.getCampaignMessages(createdCampaign._id);
        Logger.info(`✅ Retrieved ${campaignMessages.length} messages`);

        // Test 4: Assign voters to campaign
        Logger.info('👥 Test 4: Assigning voters to campaign...');
        const testVoterIds = ['test_voter_001', 'test_voter_002', 'test_voter_003'];
        const assignmentResult = await CampaignService.assignVotersToCampaign(
            createdCampaign._id,
            testVoterIds,
            'test_user_456',
            'Test assignment'
        );
        Logger.info(`✅ Voter assignment: ${assignmentResult.success} successful, ${assignmentResult.failed} failed`);

        // Test 5: Get campaign analytics
        Logger.info('📊 Test 5: Generating campaign analytics...');
        const analytics = await CampaignService.getCampaignAnalytics(createdCampaign._id);
        Logger.info(`✅ Analytics generated: ${analytics.totalVoters} total voters, ${analytics.responseRate}% response rate`);

        // Test 6: Get performance summary
        Logger.info('🎯 Test 6: Generating performance summary...');
        const performance = await CampaignService.getCampaignPerformanceSummary(createdCampaign._id);
        Logger.info(`✅ Performance summary: ${performance.campaignName}, Cost per contact: $${performance.efficiency.costPerContact}`);

        // Test 7: Send campaign message
        Logger.info('📤 Test 7: Sending campaign message...');
        const sendResult = await CampaignService.sendCampaignMessage(
            createdCampaign._id,
            createdMessage._id
        );
        Logger.info(`✅ Message sent: ${sendResult.success} successful, ${sendResult.failed} failed`);

        // Test 8: Remove voters
        Logger.info('❌ Test 8: Removing voters from campaign...');
        const removalResult = await CampaignService.removeVotersFromCampaign(
            createdCampaign._id,
            [testVoterIds[0]]
        );
        Logger.info(`✅ Voter removal: ${removalResult.success} successful, ${removalResult.failed} failed`);

        // Test 9: Status transitions
        Logger.info('🔄 Test 9: Testing campaign status transitions...');
        const activatedCampaign = await CampaignService.activateCampaign(createdCampaign._id);
        Logger.info(`✅ Campaign activated: ${activatedCampaign.status}`);
        
        const pausedCampaign = await CampaignService.pauseCampaign(createdCampaign._id);
        Logger.info(`✅ Campaign paused: ${pausedCampaign.status}`);
        
        const completedCampaign = await CampaignService.completeCampaign(createdCampaign._id);
        Logger.info(`✅ Campaign completed: ${completedCampaign.status}`);

        // Test 10: Duplicate campaign
        Logger.info('🔄 Test 10: Duplicating campaign...');
        const duplicatedCampaign = await CampaignService.duplicateCampaign(
            createdCampaign._id,
            'Advanced Test Campaign 2024 - Copy',
            'test_user_456'
        );
        Logger.info(`✅ Campaign duplicated: ${duplicatedCampaign._id}`);

        // Cleanup
        Logger.info('🧹 Cleaning up test campaigns...');
        await CampaignService.deleteCampaign(duplicatedCampaign._id);
        await CampaignService.deleteCampaign(createdCampaign._id);
        Logger.info('✅ Cleanup completed');

        Logger.info('\n🎉 All Advanced Campaign Features Tests Completed Successfully!');

    } catch (error) {
        Logger.error('❌ Advanced Campaign Features test failed:', error);
        throw error;
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            Logger.info('🔌 Database connection closed');
        }
        process.exit(0);
    }
}

// Connect to database and run tests
async function runAdvancedTests() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/election_campaign';
        await mongoose.connect(mongoUri);
        Logger.info('🔗 Connected to MongoDB');
        await testAdvancedCampaignFeatures();
    } catch (error) {
        Logger.error('❌ Failed to run advanced tests:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runAdvancedTests();
}

module.exports = { testAdvancedCampaignFeatures };
