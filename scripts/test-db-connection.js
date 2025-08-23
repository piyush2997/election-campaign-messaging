#!/usr/bin/env node

/**
 * Test MongoDB Connection Script
 * Run this script to test if MongoDB is accessible
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: 'env/dev.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/election_campaign';

async function testConnection() {
    console.log('🔍 Testing MongoDB connection...');
    console.log(`📡 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ MongoDB connection successful!');

        // Get database info
        const db = mongoose.connection.db;
        const stats = await db.stats();

        console.log('\n📊 Database Information:');
        console.log(`   Database: ${db.databaseName}`);
        console.log(`   Collections: ${stats.collections}`);
        console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Indexes: ${stats.indexes}`);

        // Test creating a collection
        const testCollection = db.collection('test_connection');
        await testCollection.insertOne({
            test: true,
            timestamp: new Date(),
            message: 'Connection test successful'
        });

        console.log('✅ Test collection created successfully');

        // Clean up test data
        await testCollection.deleteOne({ test: true });
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('   Error:', error.message);

        if (error.name === 'MongoServerSelectionError') {
            console.error('\n💡 Troubleshooting tips:');
            console.error('   1. Make sure MongoDB is running');
            console.error('   2. Check if MongoDB is accessible on localhost:27017');
            console.error('   3. Verify MongoDB service status');
        }

        process.exit(1);
    } finally {
        // Close connection
        await mongoose.disconnect();
        console.log('🔌 Connection closed');
        process.exit(0);
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, closing connection...');
    await mongoose.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, closing connection...');
    await mongoose.disconnect();
    process.exit(0);
});

// Run the test
testConnection(); 