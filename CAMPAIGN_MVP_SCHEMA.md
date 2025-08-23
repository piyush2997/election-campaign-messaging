# Campaign MVP Database Schema

## 🎯 Overview

This document outlines the optimized MongoDB schema for the Election Campaign Messaging MVP, designed specifically for:

- **Fast lookups** by booth number and phone number
- **Minimal required information** + optional personalization details
- **Easy campaign linking** and voter engagement tracking
- **Scalable performance** for high-volume messaging

## 🏗️ Database Architecture

### Core Collections

1. **Campaigns** - Campaign management and configuration
2. **Voters** - Voter database optimized for fast lookups
3. **Messages** - Campaign messages with targeting and scheduling
4. **VoterContacts** - Individual message delivery tracking

## 📊 Voter Schema (Primary Focus)

### 🚀 Fast Lookup Optimization

#### Primary Indexes

```typescript
// Primary lookup by booth number
boothNumber: string (indexed, uppercase)

// Secondary lookup by phone number
phoneNumber: string (indexed, unique, validated)

// Official voter ID (optional but indexed)
voterId: string (sparse index)
```

#### Compound Indexes for Complex Queries

```typescript
// Booth + constituency lookups
{ boothNumber: 1, constituency: 1 }

// Active voters by constituency
{ constituency: 1, isActive: 1 }

// Demographics targeting
{ age: 1, gender: 1, isActive: 1 }

// Campaign-based queries
{ 'campaigns.campaignId': 1, 'campaigns.status': 1 }
```

### 📋 Minimal Required Information

#### Essential Fields (Required)

```typescript
firstName: string; // Personalization
lastName: string; // Personalization
constituency: string; // Campaign targeting
phoneNumber: string; // Contact method
boothNumber: string; // Identification
```

#### Optional Personalization Fields

```typescript
age?: number               // Age group targeting
gender?: 'male' | 'female' | 'other'
occupation?: string        // Message personalization
assemblySegment?: string   // Granular targeting
```

### 🔗 Campaign Linking

#### Embedded Campaign Tracking

```typescript
campaigns: [
  {
    campaignId: ObjectId, // Reference to Campaign
    status: "active" | "paused" | "completed",
    lastContactDate: Date, // Last contact
    contactCount: number, // Engagement tracking
    responseStatus: "positive" | "negative" | "neutral",
    notes: string, // Field agent notes
  },
];
```

#### Contact Preferences

```typescript
contactPreferences: {
    sms: boolean,               // Default: true
    whatsapp: boolean,          // Default: true
    voiceCall: boolean,         // Default: false
    email: boolean              // Default: false
}
preferredLanguage: string       // Multi-language support
optOutStatus: boolean           // Global opt-out
```

## 📨 Message Schema

### 🎯 Targeting & Scheduling

#### Multi-level Targeting

```typescript
targetAudience: string[]           // Audience segments
targetConstituencies: string[]     // Geographic targeting
targetAgeGroups?: string[]         // Age-based targeting
targetLanguages: string[]          // Language variants
```

#### Smart Scheduling

```typescript
scheduledDate?: Date               // When to send
sendWindow: {                      // Time restrictions
    startTime: string,             // HH:MM format
    endTime: string                // HH:MM format
}
priority: 'low' | 'medium' | 'high'
```

### 🌐 Multi-language Support

#### Language Variants

```typescript
variants: [
  {
    language: string, // en, hi, te, ta, bn, mr, gu, kn, ml, pa, or
    title: string, // Translated title
    content: string, // Translated content
    approved: boolean, // Translation approval
  },
];
```

#### Supported Languages

- **English (en)** - Default
- **Hindi (hi)** - National language
- **Telugu (te)** - Andhra Pradesh, Telangana
- **Tamil (ta)** - Tamil Nadu
- **Bengali (bn)** - West Bengal
- **Marathi (mr)** - Maharashtra
- **Gujarati (gu)** - Gujarat
- **Kannada (kn)** - Karnataka
- **Malayalam (ml)** - Kerala
- **Punjabi (pa)** - Punjab
- **Odia (or)** - Odisha

## 📞 VoterContact Schema

### 📊 Delivery Tracking

#### Contact Lifecycle

```typescript
contactStatus: ContactStatus       // Pending → Sent → Delivered → Read
scheduledAt?: Date                 // When scheduled
sentAt?: Date                      // When sent
deliveredAt?: Date                 // When delivered
readAt?: Date                      // When read (WhatsApp/Email)
```

#### Response Tracking

```typescript
responseStatus?: 'positive' | 'negative' | 'neutral' | 'opt_out'
responseText?: string              // Voter's response
responseTime?: Date                // When responded
responseChannel?: string           // How they responded
```

#### Engagement Metrics

```typescript
openCount: number; // Times opened/read
clickCount: number; // Links clicked
replyCount: number; // Times replied
```

## ⚡ Performance Optimizations

### 🗂️ Strategic Indexing

#### Single Field Indexes

- `boothNumber` - Primary voter lookup
- `phoneNumber` - Secondary voter lookup
- `constituency` - Geographic targeting
- `preferredLanguage` - Language-based queries
- `isActive` - Active voter filtering

#### Compound Indexes

- `{ boothNumber: 1, constituency: 1 }` - Booth + area queries
- `{ constituency: 1, isActive: 1 }` - Active voters by area
- `{ 'campaigns.campaignId': 1, 'campaigns.status': 1 }` - Campaign targeting

#### Text Indexes

- Full-text search on voter names and constituencies
- Message content search capabilities

### 🔍 Query Optimization

#### Fast Lookup Methods

```typescript
// Find voter by booth (fastest)
Voter.findByBooth("BOOTH001", "Mumbai North");

// Find voter by phone
Voter.findByPhone("9876543210");

// Find contactable voters for campaign
Voter.findContactableForCampaign("campaignId", "Mumbai North");
```

#### Targeted Queries

```typescript
// Constituency-based targeting
Voter.findByConstituency("Mumbai North", {
  preferredLanguage: "hi",
  ageGroup: "25-34",
});

// Campaign-based queries
Message.findByCampaign("campaignId", {
  status: "scheduled",
  messageType: "whatsapp",
});
```

## 📈 Scalability Features

### 🚀 Connection Pooling

```typescript
maxPoolSize: 10; // Maximum connections
minPoolSize: 1; // Minimum connections
connectionTimeout: 30000; // 30 seconds
socketTimeout: 45000; // 45 seconds
```

### 🔄 Automatic Reconnection

- Handles network disconnections
- Automatic retry mechanisms
- Graceful error handling
- Process termination cleanup

### 📊 Monitoring & Analytics

```typescript
// Database statistics
database.getDatabaseStats();

// Connection status
database.getConnectionStatus();

// Health monitoring
database.isDatabaseConnected();
```

## 🎯 Use Cases & Examples

### 1. **Booth-based Voter Lookup**

```typescript
// Find all voters in a specific booth
const boothVoters = await Voter.findByBooth("BOOTH001", "Mumbai North");
```

### 2. **Phone-based Voter Search**

```typescript
// Find voter by phone number
const voter = await Voter.findByPhone("9876543210");
```

### 3. **Campaign Targeting**

```typescript
// Find voters for a specific campaign
const targetVoters = await Voter.findContactableForCampaign(
  "campaignId",
  "Mumbai North"
);
```

### 4. **Multi-language Message Sending**

```typescript
// Create message with Hindi variant
const message = new Message({
  title: "Vote for Change",
  content: "Your vote matters!",
  targetLanguages: ["en", "hi"],
  variants: [
    { language: "en", title: "Vote for Change", content: "Your vote matters!" },
    {
      language: "hi",
      title: "परिवर्तन के लिए वोट करें",
      content: "आपका वोट मायने रखता है!",
    },
  ],
});
```

### 5. **Delivery Tracking**

```typescript
// Track message delivery
const contact = await VoterContact.findOne({ voterId, messageId });
await contact.markAsDelivered();
await contact.recordResponse("positive", "I will vote!");
```

## 🔒 Security & Compliance

### 📱 Opt-out Management

- Global opt-out capability
- Per-campaign opt-out tracking
- Respect for voter preferences
- Audit trail for compliance

### 🔐 Data Privacy

- Minimal data collection
- Secure phone number storage
- Encrypted sensitive information
- GDPR compliance ready

### 📊 Audit Trail

- Complete contact history
- Response tracking
- Engagement metrics
- Compliance reporting

## 🚀 Getting Started

### 1. **Install Dependencies**

```bash
npm install mongoose
```

### 2. **Import Models**

```typescript
import { Voter, Message, Campaign, VoterContact } from "./models";
```

### 3. **Create Voter**

```typescript
const voter = new Voter({
  boothNumber: "BOOTH001",
  phoneNumber: "9876543210",
  firstName: "Rahul",
  lastName: "Kumar",
  constituency: "Mumbai North",
  preferredLanguage: "hi",
});
await voter.save();
```

### 4. **Send Campaign Message**

```typescript
const message = new Message({
  campaignId: campaign._id,
  title: "Vote for Change",
  content: "Your vote matters!",
  targetConstituencies: ["Mumbai North"],
  messageType: "whatsapp",
});
await message.save();
```

## 📊 Performance Benchmarks

### 🚀 Expected Query Performance

- **Booth Lookup**: < 1ms (primary index)
- **Phone Lookup**: < 1ms (unique index)
- **Constituency Queries**: < 5ms (compound index)
- **Campaign Targeting**: < 10ms (optimized indexes)

### 📈 Scalability Targets

- **Voters**: 10M+ records
- **Messages**: 100K+ per campaign
- **Contacts**: 1M+ per day
- **Response Time**: < 100ms for 95% of queries

---

## 🎉 Summary

This optimized schema provides:

✅ **Fast Lookups** - Primary indexes on booth and phone  
✅ **Minimal Data** - Essential fields only, optional personalization  
✅ **Easy Linking** - Embedded campaign tracking and references  
✅ **Multi-language** - Support for 11 Indian languages  
✅ **Performance** - Strategic indexing and query optimization  
✅ **Scalability** - Connection pooling and monitoring  
✅ **Compliance** - Opt-out management and audit trails

Your Campaign MVP is now ready for high-performance voter messaging! 🚀
