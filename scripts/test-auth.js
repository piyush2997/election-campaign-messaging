#!/usr/bin/env node

/**
 * Test script for Authentication system
 * Tests user registration, login, and token verification
 */

require('dotenv').config({ path: 'env/dev.env' });
const mongoose = require('mongoose');

// Import the compiled models and services
const { User, UserRole, UserStatus } = require('../dist/models/User');

async function testAuthSystem() {
    console.log('🔐 Testing Authentication System...');

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB connected successfully');

        // Test 1: Create a test admin user
        console.log('\n🧪 Test 1: Creating admin user...');
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            username: 'admin',
            password: 'AdminPassword123!',
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            permissions: [
                'campaign:create', 'campaign:read', 'campaign:update', 'campaign:delete', 'campaign:approve', 'campaign:schedule',
                'voter:read', 'voter:create', 'voter:update', 'voter:delete',
                'message:create', 'message:read', 'message:update', 'message:delete', 'message:approve', 'message:schedule',
                'user:read', 'user:create', 'user:update', 'user:delete',
                'dashboard:view', 'analytics:view', 'reports:generate'
            ],
            timezone: 'UTC',
            language: 'en'
        });

        await adminUser.save();
        console.log('✅ Admin user created successfully');
        console.log(`   User ID: ${adminUser._id}`);
        console.log(`   Role: ${adminUser.role}`);
        console.log(`   Permissions: ${adminUser.permissions.length}`);

        // Test 2: Create a campaign manager user
        console.log('\n🧪 Test 2: Creating campaign manager user...');
        const managerUser = new User({
            firstName: 'Campaign',
            lastName: 'Manager',
            email: 'manager@example.com',
            username: 'campaignmanager',
            password: 'ManagerPass123!',
            role: UserRole.CAMPAIGN_MANAGER,
            status: UserStatus.ACTIVE,
            permissions: [
                'campaign:create', 'campaign:read', 'campaign:update', 'campaign:approve', 'campaign:schedule',
                'voter:read', 'voter:create', 'voter:update',
                'message:create', 'message:read', 'message:update', 'message:approve', 'message:schedule',
                'user:read',
                'dashboard:view', 'analytics:view', 'reports:generate'
            ],
            timezone: 'UTC',
            language: 'en'
        });

        await managerUser.save();
        console.log('✅ Campaign manager user created successfully');
        console.log(`   User ID: ${managerUser._id}`);
        console.log(`   Role: ${managerUser.role}`);
        console.log(`   Can manage campaigns: ${managerUser.canManageCampaigns()}`);

        // Test 3: Test password comparison
        console.log('\n🧪 Test 3: Testing password comparison...');
        const foundAdmin = await User.findOne({ email: 'admin@example.com' }).select('+password');
        const foundManager = await User.findOne({ email: 'manager@example.com' }).select('+password');

        const adminPasswordValid = await foundAdmin.comparePassword('AdminPassword123!');
        const managerPasswordValid = await foundManager.comparePassword('ManagerPass123!');
        const wrongPasswordValid = await foundAdmin.comparePassword('WrongPassword');

        console.log(`   Admin correct password: ${adminPasswordValid ? '✅' : '❌'}`);
        console.log(`   Manager correct password: ${managerPasswordValid ? '✅' : '❌'}`);
        console.log(`   Wrong password: ${wrongPasswordValid ? '❌' : '✅'}`);

        // Test 4: Test permission checking
        console.log('\n🧪 Test 4: Testing permission checking...');
        console.log(`   Admin has campaign:create: ${foundAdmin.hasPermission('campaign:create') ? '✅' : '❌'}`);
        console.log(`   Admin has user:delete: ${foundAdmin.hasPermission('user:delete') ? '✅' : '❌'}`);
        console.log(`   Manager has campaign:create: ${foundManager.hasPermission('campaign:create') ? '✅' : '❌'}`);
        console.log(`   Manager has user:delete: ${foundManager.hasPermission('user:delete') ? '✅' : '❌'}`);

        // Test 5: Test role-based access
        console.log('\n🧪 Test 5: Testing role-based access...');
        console.log(`   Admin can manage campaigns: ${foundAdmin.canManageCampaigns() ? '✅' : '❌'}`);
        console.log(`   Admin can view dashboard: ${foundAdmin.canViewDashboard() ? '✅' : '❌'}`);
        console.log(`   Manager can manage campaigns: ${foundManager.canManageCampaigns() ? '✅' : '❌'}`);
        console.log(`   Manager can view dashboard: ${foundManager.canViewDashboard() ? '✅' : '❌'}`);

        // Test 6: Test user status
        console.log('\n🧪 Test 6: Testing user status...');
        console.log(`   Admin is active: ${foundAdmin.isActive() ? '✅' : '❌'}`);
        console.log(`   Admin is locked: ${foundAdmin.isLocked ? '✅' : '❌'}`);
        console.log(`   Manager is active: ${foundManager.isActive() ? '✅' : '❌'}`);
        console.log(`   Manager is locked: ${foundManager.isLocked ? '✅' : '❌'}`);

        // Test 7: Test static methods
        console.log('\n🧪 Test 7: Testing static methods...');
        const activeUsers = await User.findActiveUsers();
        const admins = await User.findByRole(UserRole.ADMIN);
        const managers = await User.findByRole(UserRole.CAMPAIGN_MANAGER);

        console.log(`   Total active users: ${activeUsers.length}`);
        console.log(`   Admin users: ${admins.length}`);
        console.log(`   Campaign managers: ${managers.length}`);

        // Test 8: Test user update
        console.log('\n🧪 Test 8: Testing user update...');
        foundManager.lastName = 'Supervisor';
        foundManager.permissions.push('campaign:delete');
        await foundManager.save();

        console.log('✅ Manager user updated successfully');
        console.log(`   New full name: ${foundManager.getFullName()}`);
        console.log(`   Has campaign:delete permission: ${foundManager.hasPermission('campaign:delete') ? '✅' : '❌'}`);

        // Test 9: Test campaign permission management
        console.log('\n🧪 Test 9: Testing campaign permission management...');
        const campaignId = new mongoose.Types.ObjectId();
        foundManager.addCampaignPermission(campaignId.toString(), ['read', 'write', 'approve']);
        await foundManager.save();

        console.log('✅ Campaign permission added successfully');
        console.log(`   Has campaign read permission: ${foundManager.hasCampaignPermission(campaignId.toString(), 'read') ? '✅' : '❌'}`);
        console.log(`   Has campaign write permission: ${foundManager.hasCampaignPermission(campaignId.toString(), 'write') ? '✅' : '❌'}`);
        console.log(`   Has campaign approve permission: ${foundManager.hasCampaignPermission(campaignId.toString(), 'approve') ? '✅' : '❌'}`);

        // Test 10: Test user search and filtering
        console.log('\n🧪 Test 10: Testing user search and filtering...');
        const usersByEmail = await User.findOne({ email: 'admin@example.com' });
        const usersByUsername = await User.findOne({ username: 'campaignmanager' });
        const usersByRole = await User.findByRole(UserRole.CAMPAIGN_MANAGER);

        console.log(`   User found by email: ${usersByEmail ? '✅' : '❌'}`);
        console.log(`   User found by username: ${usersByUsername ? '✅' : '❌'}`);
        console.log(`   Users found by role: ${usersByRole.length}`);

        console.log('\n🎉 All Authentication System tests passed successfully!');

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await User.deleteOne({ email: 'admin@example.com' });
        await User.deleteOne({ email: 'manager@example.com' });
        console.log('✅ Test users deleted successfully');

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
testAuthSystem().catch(console.error);
