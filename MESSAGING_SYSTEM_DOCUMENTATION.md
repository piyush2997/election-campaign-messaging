# Messaging System Documentation

This document explains the comprehensive messaging system for the Election Campaign Messaging platform, including email, SMS, and WhatsApp delivery services.

## 🏗️ **System Architecture**

The messaging system consists of several key components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Campaign      │    │   Message        │    │   VoterContact  │
│   Service       │───▶│   Delivery       │───▶│   Tracking      │
└─────────────────┘    │   Service        │    └─────────────────┘
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Provider       │
                       │   Layer          │
                       │                  │
                       │  Email  SMS  WA  │
                       │  ┌──┐ ┌──┐ ┌──┐ │
                       │  │SG│ │TW│ │WB│ │
                       │  │AS│ │AS│ │TW│ │
                       │  │SM│ │GN│ │GN│ │
                       │  └──┘ └──┘ └──┘ │
                       └──────────────────┘
```

## 📧 **Email Services**

### **Supported Providers**

#### 1. **SendGrid**

- **Best for**: High-volume email campaigns, transactional emails
- **Features**:
  - Up to 1000 recipients per bulk request
  - Advanced analytics and tracking
  - Template support
  - High deliverability rates

**Configuration:**

```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Election Campaign
```

#### 2. **AWS SES (Simple Email Service)**

- **Best for**: Cost-effective email delivery, AWS integration
- **Features**:
  - Up to 50 recipients per bulk request
  - Pay-per-use pricing
  - High scalability
  - Built-in bounce and complaint handling

**Configuration:**

```env
EMAIL_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

#### 3. **SMTP/Nodemailer**

- **Best for**: Custom email servers, internal infrastructure
- **Features**:
  - Full control over email delivery
  - Custom authentication
  - Internal server integration

**Configuration:**

```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your_username
SMTP_PASS=your_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Election Campaign
```

## 📱 **SMS Services**

### **Supported Providers**

#### 1. **Twilio**

- **Best for**: Reliable SMS delivery, global coverage
- **Features**:
  - Global phone number support
  - Advanced messaging APIs
  - Delivery receipts
  - Rate limiting support

**Configuration:**

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

#### 2. **AWS SNS (Simple Notification Service)**

- **Best for**: AWS integration, cost-effective SMS
- **Features**:
  - Pay-per-use pricing
  - SMS type selection (Transactional/Promotional)
  - Built-in retry logic

**Configuration:**

```env
SMS_PROVIDER=aws
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_SNS_REGION=us-east-1
AWS_SNS_SMS_TYPE=Transactional
```

#### 3. **Generic SMS Gateway**

- **Best for**: Local SMS providers, custom integrations
- **Features**:
  - Flexible API integration
  - Custom authentication
  - Local provider support

**Configuration:**

```env
SMS_PROVIDER=generic
SMS_GATEWAY_URL=https://your-gateway.com/api
SMS_GATEWAY_API_KEY=your_api_key
SMS_GATEWAY_USERNAME=your_username
SMS_GATEWAY_PASSWORD=your_password
SMS_GATEWAY_SENDER_ID=ECAMPAIGN
```

## 💬 **WhatsApp Services**

### **Supported Providers**

#### 1. **WhatsApp Business API**

- **Best for**: Official WhatsApp Business integration
- **Features**:
  - Template message support
  - Rich media messages
  - Business verification
  - High engagement rates

**Configuration:**

```env
WHATSAPP_PROVIDER=business_api
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_API_VERSION=v18.0
```

#### 2. **Twilio WhatsApp**

- **Best for**: Easy WhatsApp integration, Twilio ecosystem
- **Features**:
  - Simple API integration
  - Template support
  - Delivery tracking

**Configuration:**

```env
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

#### 3. **Generic WhatsApp Gateway**

- **Best for**: Local WhatsApp providers, custom integrations
- **Features**:
  - Flexible integration
  - Custom authentication
  - Local provider support

**Configuration:**

```env
WHATSAPP_PROVIDER=generic
WHATSAPP_GATEWAY_URL=https://your-gateway.com/api
WHATSAPP_GATEWAY_API_KEY=your_api_key
WHATSAPP_GATEWAY_INSTANCE_ID=your_instance_id
WHATSAPP_GATEWAY_TOKEN=your_token
```

## ⚙️ **Configuration Management**

### **Environment Variables**

The system automatically detects and configures providers based on environment variables:

```env
# Provider Selection
EMAIL_PROVIDER=sendgrid
SMS_PROVIDER=twilio
WHATSAPP_PROVIDER=business_api

# Rate Limiting
EMAIL_RATE_LIMIT_PER_SECOND=10
SMS_RATE_LIMIT_PER_SECOND=5
WHATSAPP_RATE_LIMIT_PER_SECOND=3

# Retry Configuration
MAX_MESSAGE_RETRIES=3
MESSAGE_RETRY_DELAY_MS=5000

# Language Support
DEFAULT_MESSAGE_LANGUAGE=en
SUPPORTED_MESSAGE_LANGUAGES=en,hi,te,ta,kn,ml
FALLBACK_MESSAGE_LANGUAGE=en
```

### **Configuration Validation**

The system automatically validates your configuration:

```typescript
import { MessagingConfigManager } from "./config/messaging";

const configManager = MessagingConfigManager.getInstance();
const validation = configManager.validateConfig();

if (!validation.isValid) {
  console.error("Configuration errors:", validation.errors);
}
```

## 🚀 **Usage Examples**

### **1. Basic Message Sending**

```typescript
import { MessageDeliveryService } from "./services/MessageDeliveryService";

// Send a single message
const result = await MessageDeliveryService.sendMessageToVoter(
  "message_id_123",
  "voter_id_456",
  "email"
);

console.log("Message sent:", result.success);
```

### **2. Campaign Message Delivery**

```typescript
// Send campaign message to all assigned voters
const bulkResult = await MessageDeliveryService.sendCampaignMessage(
  "campaign_id_789",
  "message_id_123"
);

console.log(`Sent: ${bulkResult.successful}, Failed: ${bulkResult.failed}`);
```

### **3. Custom Provider Configuration**

```typescript
import { SendGridProvider } from "./services/providers/EmailProviders";
import { TwilioProvider } from "./services/providers/SMSProviders";
import { WhatsAppBusinessProvider } from "./services/providers/WhatsAppProviders";

// Set custom providers
MessageDeliveryService.setProviders(
  new SendGridProvider(),
  new TwilioProvider(),
  new WhatsAppBusinessProvider()
);
```

### **4. Message Retry Logic**

```typescript
// Retry failed deliveries
const retryResult = await MessageDeliveryService.retryFailedDeliveries(
  "message_id_123"
);
console.log(
  `Retry successful: ${retryResult.success}, Failed: ${retryResult.failed}`
);
```

## 📊 **Delivery Tracking**

### **Message Status Flow**

```
DRAFT → SCHEDULED → SENT → DELIVERED → READ
  ↓         ↓        ↓        ↓        ↓
FAILED ← RETRY ← FAILED ← FAILED ← FAILED
```

### **Delivery Statistics**

```typescript
// Get delivery statistics
const stats = await MessageDeliveryService.getMessageDeliveryStats(
  "message_id_123"
);

console.log({
  total: stats.total,
  delivered: stats.delivered,
  failed: stats.failed,
  pending: stats.pending,
  successRate: stats.successRate,
});
```

## 🔄 **Rate Limiting & Retry Logic**

### **Rate Limits**

- **Email**: 10 messages per second (configurable)
- **SMS**: 5 messages per second (configurable)
- **WhatsApp**: 3 messages per second (configurable)

### **Retry Strategy**

- **Max Retries**: 3 attempts (configurable)
- **Retry Delay**: 5 seconds between attempts (configurable)
- **Exponential Backoff**: Automatic delay increase on failures

### **Bulk Processing**

The system automatically handles bulk message delivery with:

- **Batch Processing**: Groups messages by provider and method
- **Rate Limiting**: Respects provider rate limits
- **Error Handling**: Continues processing on individual failures
- **Progress Tracking**: Real-time delivery status updates

## 🌍 **Multi-Language Support**

### **Supported Languages**

- **English (en)**: Default language
- **Hindi (hi)**: Indian national language
- **Telugu (te)**: Andhra Pradesh & Telangana
- **Tamil (ta)**: Tamil Nadu
- **Kannada (kn)**: Karnataka
- **Malayalam (ml)**: Kerala

### **Language Variants**

Messages can have multiple language variants:

```typescript
const message = {
  title: "Election Update",
  content: "Your vote matters!",
  variants: [
    {
      language: "hi",
      title: "चुनाव अपडेट",
      content: "आपका वोट मायने रखता है!",
      approved: true,
    },
    {
      language: "te",
      title: "ఎన్నికల నవీకరణ",
      content: "మీ ఓటు ముఖ్యమైనది!",
      approved: true,
    },
  ],
};
```

## 🛡️ **Security & Compliance**

### **Data Protection**

- **Encryption**: All sensitive data encrypted at rest and in transit
- **Authentication**: Secure API key management
- **Audit Logging**: Complete message delivery audit trail

### **Compliance**

- **GDPR**: Right to be forgotten, data portability
- **CAN-SPAM**: Email compliance for US campaigns
- **TCPA**: SMS compliance for US campaigns
- **Local Regulations**: Compliance with Indian messaging laws

### **Opt-out Management**

- **Global Opt-out**: Voters can opt out of all communications
- **Channel Opt-out**: Voters can opt out of specific channels
- **Campaign Opt-out**: Voters can opt out of specific campaigns
- **Automatic Compliance**: System automatically respects opt-outs

## 📈 **Performance & Monitoring**

### **Performance Metrics**

- **Delivery Rate**: Percentage of successfully delivered messages
- **Response Time**: Time to deliver messages
- **Failure Rate**: Percentage of failed deliveries
- **Throughput**: Messages processed per second

### **Monitoring & Alerts**

- **Real-time Dashboard**: Live delivery status monitoring
- **Alert System**: Automatic notifications for failures
- **Performance Tracking**: Historical delivery performance
- **Provider Health**: Service provider status monitoring

### **Scaling**

- **Horizontal Scaling**: Multiple service instances
- **Load Balancing**: Automatic distribution of message load
- **Queue Management**: Asynchronous message processing
- **Database Optimization**: Efficient message tracking queries

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Email Delivery Failures**

```bash
# Check SendGrid configuration
echo $SENDGRID_API_KEY
echo $SENDGRID_FROM_EMAIL

# Verify domain authentication
# Check spam folder settings
```

#### **2. SMS Delivery Issues**

```bash
# Check Twilio credentials
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN

# Verify phone number format
# Check account balance
```

#### **3. WhatsApp Delivery Problems**

```bash
# Check WhatsApp Business API
echo $WHATSAPP_ACCESS_TOKEN
echo $WHATSAPP_PHONE_NUMBER_ID

# Verify template approval
# Check message format
```

### **Debug Mode**

Enable debug logging for troubleshooting:

```env
LOG_LEVEL=debug
MESSAGING_DEBUG=true
```

### **Provider Testing**

Test individual providers:

```typescript
import { SendGridProvider } from "./services/providers/EmailProviders";

const emailProvider = new SendGridProvider();
const success = await emailProvider.sendEmail(
  "test@example.com",
  "Test Subject",
  "Test message content"
);

console.log("Test email sent:", success);
```

## 📚 **API Reference**

### **MessageDeliveryService Methods**

| Method                    | Description             | Parameters                              | Returns              |
| ------------------------- | ----------------------- | --------------------------------------- | -------------------- |
| `sendMessageToVoter`      | Send single message     | `messageId`, `voterId`, `contactMethod` | `DeliveryResult`     |
| `sendCampaignMessage`     | Send campaign message   | `messageId`, `campaignId`               | `BulkDeliveryResult` |
| `retryFailedDeliveries`   | Retry failed messages   | `messageId`                             | `{success, failed}`  |
| `getMessageDeliveryStats` | Get delivery statistics | `messageId`                             | `DeliveryStats`      |

### **Provider Interfaces**

| Interface          | Methods                            | Description                |
| ------------------ | ---------------------------------- | -------------------------- |
| `EmailProvider`    | `sendEmail`, `sendBulkEmail`       | Email delivery services    |
| `SMSProvider`      | `sendSMS`, `sendBulkSMS`           | SMS delivery services      |
| `WhatsAppProvider` | `sendWhatsApp`, `sendBulkWhatsApp` | WhatsApp delivery services |

## 🚀 **Getting Started**

### **1. Install Dependencies**

```bash
npm install @sendgrid/mail twilio aws-sdk
```

### **2. Configure Environment**

```bash
# Copy environment template
cp env/dev.env.example env/dev.env

# Edit configuration
nano env/dev.env
```

### **3. Test Configuration**

```bash
# Run configuration validation
npm run validate-messaging

# Test message delivery
npm run test-messaging
```

### **4. Start Sending Messages**

```typescript
// Your campaign service will automatically use the configured providers
const campaignService = new CampaignService();
await campaignService.sendCampaignMessage(campaignId, messageId);
```

## 📞 **Support & Resources**

### **Documentation**

- [API Reference](./API_REFERENCE.md)
- [Provider Setup](./PROVIDER_SETUP.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### **Community**

- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)
- [Email Support](mailto:support@yourdomain.com)

### **Updates**

- [Changelog](./CHANGELOG.md)
- [Release Notes](./RELEASES.md)
- [Migration Guide](./MIGRATION.md)

---

**The messaging system is now fully integrated and ready for production use!** 🎉

For questions or support, please refer to the documentation above or contact the development team.
