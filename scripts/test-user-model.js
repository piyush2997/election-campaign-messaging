#!/usr/bin/env node

/**
 * Test script for User model
 * Tests basic User model operations and MongoDB connection
 */

require('dotenv').config({ path: 'env/dev.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import the User model from compiled JavaScript
const { User, UserRole, UserStatus } = require('../dist/models/User');

async function testUserModel() {
    console.log('🔍 Testing User model...');

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully');

        // Test 1: Create a test user
        console.log('\n🧪 Test 1: Creating a test user...');
        const testUser = new User({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            username: 'johndoe',
            password: 'SecurePassword123!',
            role: UserRole.CAMPAIGN_MANAGER,
            status: UserStatus.ACTIVE,
            permissions: [
                'campaign:create',
                'campaign:read',
                'campaign:update',
                'dashboard:view',
                'analytics:view'
            ],
            timezone: 'UTC',
            language: 'en'
        });

        await testUser.save();
        console.log('✅ Test user created successfully');
        console.log(`   User ID: ${testUser._id}`);
        console.log(`   Username: ${testUser.username}`);
        console.log(`   Role: ${testUser.role}`);
        console.log(`   Status: ${testUser.status}`);

        // Test 2: Find user by email
        console.log('\n🧪 Test 2: Finding user by email...');
        const foundUser = await User.findOne({ email: 'john.doe@example.com' }).select('+password');
        if (foundUser) {
            console.log('✅ User found by email');
            console.log(`   Full Name: ${foundUser.getFullName()}`);
            console.log(`   Can manage campaigns: ${foundUser.canManageCampaigns()}`);
            console.log(`   Can view dashboard: ${foundUser.canViewDashboard()}`);
        } else {
            console.log('❌ User not found');
        }

        // Test 3: Test password comparison
        console.log('\n🧪 Test 3: Testing password comparison...');
        const isPasswordValid = await foundUser.comparePassword('SecurePassword123!');
        const isPasswordInvalid = await foundUser.comparePassword('WrongPassword');
        console.log(`   Correct password: ${isPasswordValid ? '✅' : '❌'}`);
        console.log(`   Wrong password: ${isPasswordInvalid ? '❌' : '✅'}`);

        // Test 4: Test permission checking
        console.log('\n🧪 Test 4: Testing permission checking...');
        console.log(`   Has campaign:create permission: ${foundUser.hasPermission('campaign:create') ? '✅' : '❌'}`);
        console.log(`   Has campaign:delete permission: ${foundUser.hasPermission('campaign:delete') ? '✅' : '❌'}`);
        console.log(`   Has dashboard:view permission: ${foundUser.hasPermission('dashboard:view') ? '✅' : '❌'}`);

        // Test 5: Test role-based access
        console.log('\n🧪 Test 5: Testing role-based access...');
        console.log(`   Is Admin: ${foundUser.role === UserRole.ADMIN ? '✅' : '❌'}`);
        console.log(`   Is Campaign Manager: ${foundUser.role === UserRole.CAMPAIGN_MANAGER ? '✅' : '❌'}`);
        console.log(`   Can manage campaigns: ${foundUser.canManageCampaigns() ? '✅' : '❌'}`);

        // Test 6: Test user status
        console.log('\n🧪 Test 6: Testing user status...');
        console.log(`   Is Active: ${foundUser.isActive() ? '✅' : '❌'}`);
        console.log(`   Is Locked: ${foundUser.isLocked ? '✅' : '❌'}`);

        // Test 7: Test virtual fields
        console.log('\n🧪 Test 7: Testing virtual fields...');
        console.log(`   Full Name: ${foundUser.fullName}`);
        console.log(`   Display Name: ${foundUser.displayName}`);

        // Test 8: Test static methods
        console.log('\n🧪 Test 8: Testing static methods...');
        const activeUsers = await User.findActiveUsers();
        const campaignManagers = await User.findByRole(UserRole.CAMPAIGN_MANAGER);
        console.log(`   Total active users: ${activeUsers.length}`);
        console.log(`   Campaign managers: ${campaignManagers.length}`);

        // Test 9: Test user update
        console.log('\n🧪 Test 9: Testing user update...');
        foundUser.lastName = 'Smith';
        foundUser.permissions.push('campaign:delete');
        await foundUser.save();
        console.log('✅ User updated successfully');
        console.log(`   New full name: ${foundUser.getFullName()}`);
        console.log(`   Has campaign:delete permission: ${foundUser.hasPermission('campaign:delete') ? '✅' : '❌'}`);

        // Test 10: Test campaign permission management
        console.log('\n🧪 Test 10: Testing campaign permission management...');
        const campaignId = new mongoose.Types.ObjectId();
        foundUser.addCampaignPermission(campaignId.toString(), ['read', 'write']);
        await foundUser.save();
        console.log('✅ Campaign permission added successfully');
        console.log(`   Has campaign read permission: ${foundUser.hasCampaignPermission(campaignId.toString(), 'read') ? '✅' : '❌'}`);
        console.log(`   Has campaign write permission: ${foundUser.hasCampaignPermission(campaignId.toString(), 'write') ? '✅' : '❌'}`);

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await User.deleteOne({ email: 'john.doe@example.com' });
        console.log('✅ Test user deleted successfully');

        console.log('\n🎉 All User model tests passed successfully!');

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
testUserModel().catch(console.error);
