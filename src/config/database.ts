import mongoose from 'mongoose';
import { EnvConfig } from './EnvConfig';

export class Database {
    private static instance: Database;
    private isConnected: boolean = false;

    private constructor() { }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * Connect to MongoDB database
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            console.log('Database is already connected');
            return;
        }

        try {
            const mongoUri = this.getMongoUri();
            const options = this.getConnectionOptions();

            console.log(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

            await mongoose.connect(mongoUri, options);

            this.isConnected = true;
            console.log('✅ MongoDB connected successfully');

            // Handle connection events
            this.setupConnectionHandlers();

        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Disconnect from MongoDB database
     */
    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            console.log('Database is not connected');
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('✅ MongoDB disconnected successfully');
        } catch (error) {
            console.error('❌ MongoDB disconnection failed:', error);
            throw error;
        }
    }

    /**
     * Get MongoDB connection URI based on environment
     */
    private getMongoUri(): string {
        const env = EnvConfig.getEnvironment();

        if (env === 'test') {
            return EnvConfig.get('MONGODB_URI_TEST');
        }

        return EnvConfig.get('MONGODB_URI');
    }

    /**
     * Get MongoDB connection options
     */
    private getConnectionOptions(): mongoose.ConnectOptions {
        const options: mongoose.ConnectOptions = {
            maxPoolSize: parseInt(EnvConfig.getOrDefault('MONGODB_MAX_POOL_SIZE', '10')),
            minPoolSize: parseInt(EnvConfig.getOrDefault('MONGODB_MIN_POOL_SIZE', '1')),
            serverSelectionTimeoutMS: parseInt(EnvConfig.getOrDefault('MONGODB_CONNECTION_TIMEOUT', '30000')),
            socketTimeoutMS: parseInt(EnvConfig.getOrDefault('MONGODB_SOCKET_TIMEOUT', '45000')),
            bufferCommands: false,
        };

        // Add authentication if credentials are provided
        const username = EnvConfig.getOrDefault('MONGODB_USER', '');
        const password = EnvConfig.getOrDefault('MONGODB_PASSWORD', '');

        if (username && password) {
            options.auth = {
                username,
                password,
            };
            options.authSource = EnvConfig.getOrDefault('MONGODB_AUTH_SOURCE', 'admin');
        }

        return options;
    }

    /**
     * Setup MongoDB connection event handlers
     */
    private setupConnectionHandlers(): void {
        const connection = mongoose.connection;

        connection.on('connected', () => {
            console.log('MongoDB connection established');
        });

        connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
            this.isConnected = false;
        });

        connection.on('disconnected', () => {
            console.log('MongoDB connection disconnected');
            this.isConnected = false;
        });

        connection.on('reconnected', () => {
            console.log('MongoDB connection reestablished');
            this.isConnected = true;
        });

        // Handle process termination
        process.on('SIGINT', async () => {
            console.log('Received SIGINT, closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('Received SIGTERM, closing MongoDB connection...');
            await this.disconnect();
            process.exit(0);
        });
    }

    /**
     * Check if database is connected
     */
    public isDatabaseConnected(): boolean {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    /**
     * Get database connection status
     */
    public getConnectionStatus(): string {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
    }

    /**
     * Get database statistics
     */
    public async getDatabaseStats(): Promise<any> {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        try {
            const stats = await mongoose.connection.db.stats();
            return {
                collections: stats.collections,
                dataSize: stats.dataSize,
                storageSize: stats.storageSize,
                indexes: stats.indexes,
                indexSize: stats.indexSize
            };
        } catch (error) {
            console.error('Failed to get database stats:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const database = Database.getInstance(); 