import express from "express";
import cors from "cors";
import { EnvConfig } from "./config/EnvConfig";
import { database } from "./config/database";

// Initialize environment configuration
EnvConfig.init();

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

const PORT = EnvConfig.getPort();
console.log(`Environment: ${EnvConfig.getEnvironment()}`);
console.log(`Server starting on port: ${PORT}`);

// Start server and connect to database
async function startServer() {
    try {
        // Connect to MongoDB
        await database.connect();

        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Database: ${database.getConnectionStatus()}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
