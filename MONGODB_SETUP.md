# MongoDB Setup Guide for Election Campaign Messaging

This guide will help you set up MongoDB for your election campaign messaging project.

## 🚀 Quick Start

### 1. Install MongoDB

**macOS (using Homebrew):**

```bash
brew tap mongodb/brew
brew install mongodb-community
```

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install -y mongodb
```

**Windows:**
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### 2. Start MongoDB Service

**macOS:**

```bash
brew services start mongodb/brew/mongodb-community
```

**Ubuntu/Debian:**

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Windows:**
MongoDB runs as a service automatically after installation.

### 3. Verify MongoDB is Running

```bash
# Check if MongoDB is running
lsof -i :27017

# Or connect to MongoDB shell
mongosh
```

## ⚙️ Configuration

### Environment Variables

Your MongoDB configuration is already set up in `env/dev.env`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/election_campaign
MONGODB_URI_TEST=mongodb://localhost:27017/election_campaign_test
MONGODB_USER=
MONGODB_PASSWORD=
MONGODB_AUTH_SOURCE=admin

# Database Connection Options
MONGODB_CONNECTION_TIMEOUT=30000
MONGODB_SOCKET_TIMEOUT=45000
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=1
```

### Database Names

- **Development**: `election_campaign`
- **Test**: `election_campaign_test`
- **Production**: `election_campaign_prod` (when configured)

## 🧪 Testing the Connection

### 1. Test Database Connection

```bash
npm run test:db
```

This will:

- Connect to MongoDB
- Create a test collection
- Show database statistics
- Clean up test data

### 2. Start the Server

```bash
npm run dev
```

The server will:

- Load environment configuration
- Connect to MongoDB
- Start the Express server
- Show connection status

### 3. Check Health Endpoint

```bash
curl http://localhost:5004/health
```

Response should include database status:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "port": 5004,
  "database": {
    "status": "connected",
    "connected": true
  }
}
```

## 🏗️ Project Structure

```
src/
├── config/
│   ├── EnvConfig.ts      # Environment configuration
│   └── database.ts       # MongoDB connection & configuration
├── models/
│   └── Campaign.ts       # Campaign MongoDB model
└── index.ts              # Main server file with DB connection
```

## 🔧 Database Models

### Campaign Model

The Campaign model includes:

- **Schema validation** for required fields
- **Indexes** for optimal query performance
- **Virtual fields** for computed values
- **Instance methods** for business logic
- **Static methods** for common queries

### Key Features

- **Automatic timestamps** (createdAt, updatedAt)
- **Status management** (DRAFT, ACTIVE, PAUSED, COMPLETED)
- **Target audience** tracking
- **Budget management**
- **Tagging system**

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

**Error**: `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:

```bash
# Check if MongoDB is running
brew services list | grep mongodb
# or
sudo systemctl status mongod

# Start MongoDB if not running
brew services start mongodb/brew/mongodb-community
# or
sudo systemctl start mongod
```

#### 2. Permission Denied

**Error**: `MongoServerError: Authentication failed`

**Solution**:

- Check if authentication is enabled
- Verify username/password in environment variables
- Ensure database user has proper permissions

#### 3. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::27017`

**Solution**:

```bash
# Find process using port 27017
lsof -i :27017

# Kill the process
kill -9 <PID>
```

### Connection Options

The database configuration includes:

- **Connection pooling** for performance
- **Timeout settings** for reliability
- **Automatic reconnection** handling
- **Graceful shutdown** on process termination

## 📊 Database Operations

### Basic Operations

```typescript
import { Campaign } from "./models/Campaign";

// Create a campaign
const campaign = new Campaign({
  name: "Election 2024",
  description: "Main election campaign",
  startDate: new Date("2024-11-01"),
  endDate: new Date("2024-11-30"),
  targetAudience: ["voters-18-25", "voters-26-35"],
  createdBy: "admin@campaign.com",
});

await campaign.save();

// Find active campaigns
const activeCampaigns = await Campaign.findActiveCampaigns();

// Find by target audience
const youthCampaigns = await Campaign.findByTargetAudience("voters-18-25");
```

### Advanced Queries

```typescript
// Aggregation pipeline example
const campaignStats = await Campaign.aggregate([
  { $match: { status: "active" } },
  {
    $group: {
      _id: "$targetAudience",
      count: { $sum: 1 },
      totalBudget: { $sum: "$budget" },
    },
  },
]);
```

## 🔒 Security Considerations

### Development Environment

- MongoDB runs without authentication (default)
- Accessible only from localhost
- No external network access

### Production Environment

- Enable authentication
- Use strong passwords
- Restrict network access
- Enable SSL/TLS
- Regular backups

## 📈 Performance Optimization

### Indexes

- **Single field indexes** on frequently queried fields
- **Compound indexes** for complex queries
- **Text indexes** for search functionality

### Connection Pooling

- **Max pool size**: 10 connections
- **Min pool size**: 1 connection
- **Connection timeout**: 30 seconds
- **Socket timeout**: 45 seconds

## 🆘 Getting Help

### Useful Commands

```bash
# MongoDB shell
mongosh

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Check service status
brew services list | grep mongodb
```

### Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [MongoDB Atlas](https://www.mongodb.com/atlas) (Cloud hosting)

---

**Your MongoDB setup is now complete! 🎉**

Run `npm run test:db` to verify the connection, then start your server with `npm run dev`.
