import express from "express";
import cors from "cors";
import { EnvConfig } from "./config/EnvConfig";
import { Logger } from "./config/logger";
import { database } from "./config/database";

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import voterRoutes from './routes/voters';
import campaignRoutes from './routes/campaigns';

// Initialize environment configuration
EnvConfig.init();

// Initialize logger
Logger.initialize();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is live 🔥");
});

// Health check endpoint
app.get("/health", async (req, res) => {
    try {
        const dbStatus = database.getConnectionStatus();
        const isConnected = database.isDatabaseConnected();

        res.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            environment: EnvConfig.getEnvironment(),
            port: EnvConfig.getPort(),
            database: {
                status: dbStatus,
                connected: isConnected
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/campaigns', campaignRoutes);

const PORT = EnvConfig.getPort();
Logger.info(`Environment: ${EnvConfig.getEnvironment()}`);
Logger.info(`Server starting on port: ${PORT}`);

// Start server and connect to database
async function startServer() {
    try {
        // Connect to MongoDB
        await database.connect();

        // Start the server
        app.listen(PORT, () => {
            Logger.info(`🚀 Server running on port ${PORT}`);
            Logger.info(`📊 Database: ${database.getConnectionStatus()}`);
        });

    } catch (error) {
        Logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
