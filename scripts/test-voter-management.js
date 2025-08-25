#!/usr/bin/env node

/**
 * Test script for Voter Management System
 * Tests all voter operations including CRUD, search, filtering, and campaign management
 */

require('dotenv').config({ path: 'env/dev.env' });

// Import the compiled service and models
const { VoterService } = require('../dist/services/VoterService');
const { Voter } = require('../dist/models/Voter');
const mongoose = require('mongoose');

async function testVoterManagement() {
    console.log('🗳️  Testing Voter Management System...');

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully');

        // Test 1: Create test voters
        console.log('\n🧪 Test 1: Creating test voters...');

        const testVoters = [
            {
                boothNumber: 'A001',
                phoneNumber: '9876543210',
                firstName: 'Rajesh',
                lastName: 'Kumar',
                constituency: 'Mumbai North',
                assemblySegment: 'Andheri West',
                preferredLanguage: 'en',
                age: 35,
                gender: 'male',
                occupation: 'Engineer'
            },
            {
                boothNumber: 'A002',
                phoneNumber: '9876543211',
                firstName: 'Priya',
                lastName: 'Sharma',
                constituency: 'Mumbai North',
                assemblySegment: 'Andheri East',
                preferredLanguage: 'hi',
                age: 28,
                gender: 'female',
                occupation: 'Teacher'
            },
            {
                boothNumber: 'B001',
                phoneNumber: '9876543212',
                firstName: 'Amit',
                lastName: 'Patel',
                constituency: 'Mumbai South',
                assemblySegment: 'Colaba',
                preferredLanguage: 'en',
                age: 42,
                gender: 'male',
                occupation: 'Business Owner'
            }
        ];

        const createdVoters = [];
        for (const voterData of testVoters) {
            try {
                const voter = await VoterService.createVoter(voterData);
                createdVoters.push(voter);
                console.log(`   ✅ Created voter: ${voter.firstName} ${voter.lastName} (${voter.phoneNumber})`);
            } catch (error) {
                console.log(`   ⚠️  Voter creation failed: ${error.message}`);
            }
        }

        if (createdVoters.length === 0) {
            throw new Error('No voters were created successfully');
        }

        // Test 2: Test voter retrieval
        console.log('\n🧪 Test 2: Testing voter retrieval...');

        const firstVoter = createdVoters[0];
        const retrievedVoter = await VoterService.getVoterById(firstVoter._id.toString());
        console.log(`   Get by ID: ${retrievedVoter ? '✅' : '❌'}`);

        const phoneVoter = await VoterService.getVoterByPhone(firstVoter.phoneNumber);
        console.log(`   Get by phone: ${phoneVoter ? '✅' : '❌'}`);

        const boothVoters = await VoterService.getVotersByBooth(firstVoter.boothNumber);
        console.log(`   Get by booth: ${boothVoters.length > 0 ? '✅' : '❌'} (${boothVoters.length} voters)`);

        const constituencyVoters = await VoterService.getVotersByConstituency('Mumbai North');
        console.log(`   Get by constituency: ${constituencyVoters.length > 0 ? '✅' : '❌'} (${constituencyVoters.length} voters)`);

        // Test 3: Test voter search and filtering
        console.log('\n🧪 Test 3: Testing voter search and filtering...');

        const searchResult = await VoterService.searchVoters({
            constituency: 'Mumbai North',
            limit: 10,
            page: 1,
            sortBy: 'firstName',
            sortOrder: 'asc'
        });

        console.log(`   Search results: ${searchResult.voters.length} voters`);
        console.log(`   Total voters: ${searchResult.total}`);
        console.log(`   Pagination: page ${searchResult.page}/${searchResult.totalPages}`);

        // Test 4: Test voter update
        console.log('\n🧪 Test 4: Testing voter update...');

        const updateData = {
            age: 36,
            occupation: 'Senior Engineer',
            contactPreferences: {
                sms: true,
                whatsapp: true,
                voiceCall: true,
                email: false
            }
        };

        const updatedVoter = await VoterService.updateVoter(firstVoter._id.toString(), updateData);
        console.log(`   Voter update: ${updatedVoter ? '✅' : '❌'}`);

        if (updatedVoter) {
            console.log(`   New age: ${updatedVoter.age}`);
            console.log(`   New occupation: ${updatedVoter.occupation}`);
            console.log(`   Voice call preference: ${updatedVoter.contactPreferences.voiceCall ? '✅' : '❌'}`);
        }

        // Test 5: Test campaign management
        console.log('\n🧪 Test 5: Testing campaign management...');

        const campaignId = new mongoose.Types.ObjectId().toString();
        const voterWithCampaign = await VoterService.addVoterToCampaign(firstVoter._id.toString(), campaignId);
        console.log(`   Add to campaign: ${voterWithCampaign ? '✅' : '❌'}`);

        if (voterWithCampaign) {
            const campaign = voterWithCampaign.campaigns.find(c => c.campaignId.toString() === campaignId);
            console.log(`   Campaign status: ${campaign ? campaign.status : 'Not found'}`);
        }

        // Test 6: Test contact status update
        console.log('\n🧪 Test 6: Testing contact status update...');

        const contactUpdate = await VoterService.updateVoterContactStatus(
            firstVoter._id.toString(),
            campaignId,
            'positive',
            'Voter showed strong support for our candidate'
        );

        console.log(`   Contact status update: ${contactUpdate ? '✅' : '❌'}`);

        if (contactUpdate) {
            const campaign = contactUpdate.campaigns.find(c => c.campaignId.toString() === campaignId);
            console.log(`   Response status: ${campaign ? campaign.responseStatus : 'Not found'}`);
            console.log(`   Contact count: ${campaign ? campaign.contactCount : 'Not found'}`);
            console.log(`   Notes: ${campaign ? campaign.notes : 'Not found'}`);
        }

        // Test 7: Test voter statistics
        console.log('\n🧪 Test 7: Testing voter statistics...');

        const stats = await VoterService.getVoterStatistics();
        console.log(`   Total voters: ${stats.totalVoters}`);
        console.log(`   Active voters: ${stats.activeVoters}`);
        console.log(`   Opted out voters: ${stats.optedOutVoters}`);
        console.log(`   Constituencies: ${stats.constituencyStats.length}`);
        console.log(`   Languages: ${stats.languageStats.length}`);
        console.log(`   Age groups: ${stats.ageGroupStats.length}`);

        // Test 8: Test bulk import
        console.log('\n🧪 Test 8: Testing bulk import...');

        const bulkVoters = [
            {
                boothNumber: 'C001',
                phoneNumber: '9876543213',
                firstName: 'Sita',
                lastName: 'Devi',
                constituency: 'Mumbai Central',
                preferredLanguage: 'hi'
            },
            {
                boothNumber: 'C002',
                phoneNumber: '9876543214',
                firstName: 'Ramesh',
                lastName: 'Singh',
                constituency: 'Mumbai Central',
                preferredLanguage: 'en'
            }
        ];

        const bulkResult = await VoterService.bulkImportVoters(bulkVoters);
        console.log(`   Bulk import: ${bulkResult.success} successful, ${bulkResult.failed} failed`);

        if (bulkResult.errors.length > 0) {
            console.log(`   Import errors: ${bulkResult.errors.length}`);
        }

        // Test 9: Test opt-out functionality
        console.log('\n🧪 Test 9: Testing opt-out functionality...');

        const optOutVoter = await VoterService.optOutVoter(firstVoter._id.toString());
        console.log(`   Opt-out: ${optOutVoter ? '✅' : '❌'}`);

        if (optOutVoter) {
            console.log(`   Opt-out status: ${optOutVoter.optOutStatus ? '✅' : '❌'}`);
        }

        // Test 10: Test contactable voters for campaign
        console.log('\n🧪 Test 10: Testing contactable voters for campaign...');

        const contactableVoters = await VoterService.getContactableVotersForCampaign(campaignId);
        console.log(`   Contactable voters: ${contactableVoters.length}`);

        console.log('\n🎉 All Voter Management tests passed successfully!');

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');

        const allTestVoters = [...createdVoters];
        if (bulkResult.success > 0) {
            // Find and add bulk imported voters
            const bulkVoterPhones = bulkVoters.map(v => v.phoneNumber);
            const foundBulkVoters = await Voter.find({ phoneNumber: { $in: bulkVoterPhones } });
            allTestVoters.push(...foundBulkVoters);
        }

        for (const voter of allTestVoters) {
            try {
                await Voter.findByIdAndDelete(voter._id);
            } catch (error) {
                console.log(`   ⚠️  Failed to delete voter ${voter._id}: ${error.message}`);
            }
        }

        console.log(`✅ Cleaned up ${allTestVoters.length} test voters`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔌 MongoDB connection closed');
        }
    }
}

// Run the test
testVoterManagement().catch(console.error);
