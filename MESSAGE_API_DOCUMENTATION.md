# Message API Documentation

This document provides comprehensive information about the standalone message API endpoints for the Election Campaign Messaging system.

## 🚀 **Overview**

The Message API allows you to create, manage, and preview standalone messages that can be used across multiple campaigns or sent independently. These messages support personalization with voter template variables.

## 📍 **Base URL**

```
https://your-domain.com/api/messages
```

## 🔐 **Authentication**

All endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📋 **Available Endpoints**

### **1. Create Message**

**Endpoint:** `POST /api/messages`

**Description:** Create a new standalone message with personalization support.

**Permissions Required:** `message:create`

**Request Body:**

```json
{
  "title": "Hello {{firstName}}! Welcome to {{constituency}}",
  "content": "Dear {{voterName}}, your vote matters in {{constituency}}. Your booth is {{boothNumber}}.",
  "messageType": "whatsapp",
  "targetAudience": ["registered_voters"],
  "targetConstituencies": ["Mumbai North", "Delhi South"],
  "targetLanguages": ["en", "hi", "te"],
  "templateVariables": [
    "firstName",
    "voterName",
    "constituency",
    "boothNumber"
  ],
  "defaultVariables": {
    "boothNumber": "TBD"
  },
  "variants": [
    {
      "language": "hi",
      "title": "नमस्ते {{firstName}}! {{constituency}} में आपका स्वागत है",
      "content": "प्रिय {{voterName}}, {{constituency}} में आपका वोट मायने रखता है। आपका बूथ {{boothNumber}} है।",
      "approved": true
    },
    {
      "language": "te",
      "title": "హలో {{firstName}}! {{constituency}}లోకి స్వాగతం",
      "content": "ప్రియ {{voterName}}, {{constituency}}లో మీ ఓటు ముఖ్యమైనది. మీ బూత్ {{boothNumber}}.",
      "approved": true
    }
  ],
  "priority": "medium",
  "scheduledDate": "2024-05-15T10:00:00Z"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Message created successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Hello {{firstName}}! Welcome to {{constituency}}",
    "content": "Dear {{voterName}}, your vote matters in {{constituency}}. Your booth is {{boothNumber}}.",
    "messageType": "whatsapp",
    "status": "draft",
    "templateVariables": ["firstName", "voterName", "constituency", "boothNumber"],
    "variants": [...],
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Fields:**

```json
{
  "success": false,
  "message": "Missing required fields",
  "error": "MISSING_FIELDS",
  "required": ["title", "content"]
}
```

**400 Bad Request - Invalid Message Type:**

```json
{
  "success": false,
  "message": "Invalid message type",
  "error": "INVALID_MESSAGE_TYPE",
  "validTypes": ["sms", "whatsapp", "email", "voice"]
}
```

**400 Bad Request - Invalid Template Variables:**

```json
{
  "success": false,
  "message": "Invalid template variables",
  "error": "INVALID_TEMPLATE_VARIABLES",
  "errors": ["Unsupported template variable: {{invalidVar}}"]
}
```

### **2. Get All Messages**

**Endpoint:** `GET /api/messages`

**Description:** Retrieve all standalone messages with basic information.

**Permissions Required:** `message:read`

**Query Parameters:**

- None (returns all messages)

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "title": "Hello {{firstName}}! Welcome to {{constituency}}",
        "content": "Dear {{voterName}}, your vote matters...",
        "messageType": "whatsapp",
        "status": "draft",
        "createdBy": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "username": "campaign_manager",
          "email": "manager@campaign.com"
        },
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### **3. Preview Message**

**Endpoint:** `POST /api/messages/:id/preview`

**Description:** Generate a preview of a message with sample voter data for personalization testing.

**Permissions Required:** `message:read`

**URL Parameters:**

- `id`: Message ID

**Request Body:**

```json
{
  "sampleVoter": {
    "firstName": "Rahul",
    "lastName": "Kumar",
    "constituency": "Mumbai North",
    "assemblySegment": "Andheri West",
    "boothNumber": "001",
    "age": 28,
    "gender": "male",
    "occupation": "Engineer"
  },
  "language": "en"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Message preview generated successfully",
  "data": {
    "messageId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "sampleVoter": {
      "firstName": "Rahul",
      "lastName": "Kumar",
      "constituency": "Mumbai North",
      "assemblySegment": "Andheri West",
      "boothNumber": "001",
      "age": 28,
      "gender": "male",
      "occupation": "Engineer"
    },
    "language": "en",
    "preview": {
      "title": "Hello Rahul! Welcome to Mumbai North",
      "content": "Dear Rahul Kumar, your vote matters in Mumbai North. Your booth is 001.",
      "htmlContent": "<!DOCTYPE html>..."
    }
  }
}
```

**Error Responses:**

**404 Not Found:**

```json
{
  "success": false,
  "message": "Message not found",
  "error": "MESSAGE_NOT_FOUND"
}
```

## 🎯 **Template Variables**

### **Supported Variables**

| Variable              | Description                      | Example Output |
| --------------------- | -------------------------------- | -------------- |
| `{{voterName}}`       | Full name (firstName + lastName) | "Rahul Kumar"  |
| `{{firstName}}`       | First name only                  | "Rahul"        |
| `{{lastName}}`        | Last name only                   | "Kumar"        |
| `{{constituency}}`    | Voter's constituency             | "Mumbai North" |
| `{{assemblySegment}}` | Assembly segment                 | "Andheri West" |
| `{{boothNumber}}`     | Polling booth number             | "001"          |
| `{{age}}`             | Voter's age                      | "28"           |
| `{{gender}}`          | Voter's gender                   | "male"         |
| `{{occupation}}`      | Voter's occupation               | "Engineer"     |

### **Template Variable Usage**

**Example Template:**

```
Hello {{firstName}}! Welcome to our campaign in {{constituency}}!

Your polling booth is {{boothNumber}} in {{assemblySegment}}.
As a {{age}}-year-old {{occupation}}, your voice matters.

Best regards,
Your Campaign Team
```

**Personalized Output for Rahul Kumar:**

```
Hello Rahul! Welcome to our campaign in Mumbai North!

Your polling booth is 001 in Andheri West.
As a 28-year-old Engineer, your voice matters.

Best regards,
Your Campaign Team
```

## 🌍 **Multi-Language Support**

### **Language Variants**

Messages can have multiple language variants. Each variant includes:

- `language`: Language code (en, hi, te, ta, bn, mr, gu, kn, ml, pa, or)
- `title`: Translated title with template variables
- `content`: Translated content with template variables
- `approved`: Whether the translation is approved

### **Language Priority**

1. **User's preferred language** (if available and approved)
2. **Default language** (usually English)
3. **Fallback language** (if specified)

## 📱 **Message Types**

### **Supported Types**

| Type       | Description       | Max Length | Features                              |
| ---------- | ----------------- | ---------- | ------------------------------------- |
| `sms`      | Text messages     | 160 chars  | Basic text, template variables        |
| `whatsapp` | WhatsApp messages | 1000 chars | Rich text, emojis, template variables |
| `email`    | Email messages    | 1000 chars | HTML support, template variables      |
| `voice`    | Voice calls       | N/A        | Text-to-speech, template variables    |

## 🔧 **Message Status Flow**

```
DRAFT → SCHEDULED → SENT → DELIVERED
  ↓         ↓        ↓        ↓
CANCELLED  FAILED   FAILED   READ
```

## 📊 **Message Properties**

### **Core Fields**

- **title**: Message title/headline (max 100 chars)
- **content**: Message content (max 1000 chars)
- **messageType**: Type of message (sms, whatsapp, email, voice)
- **status**: Current status (draft, scheduled, sent, delivered, failed, cancelled, read)

### **Targeting Fields**

- **targetAudience**: Array of audience segments
- **targetConstituencies**: Array of specific constituencies
- **targetAgeGroups**: Array of age groups (18-24, 25-34, 35-44, 45-54, 55-64, 65+)
- **targetLanguages**: Array of supported languages

### **Personalization Fields**

- **templateVariables**: Array of available template variables
- **defaultVariables**: Object with fallback values for variables
- **variants**: Array of language variants

### **Scheduling Fields**

- **scheduledDate**: When to send the message
- **sendWindow**: Time window for sending (startTime, endTime)
- **priority**: Message priority (low, medium, high)

## 🚀 **Usage Examples**

### **1. Create a Simple Personalized SMS**

```bash
curl -X POST https://your-domain.com/api/messages \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vote Reminder for {{firstName}}",
    "content": "Hi {{firstName}}! Don't forget to vote in {{constituency}} on election day. Your booth is {{boothNumber}}.",
    "messageType": "sms",
    "targetAudience": ["registered_voters"],
    "templateVariables": ["firstName", "constituency", "boothNumber"]
  }'
```

### **2. Create Multi-Language WhatsApp Message**

```bash
curl -X POST https://your-domain.com/api/messages \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Campaign Update for {{voterName}}",
    "content": "Hello {{firstName}}! Welcome to our campaign in {{constituency}}.",
    "messageType": "whatsapp",
    "targetAudience": ["all_voters"],
    "templateVariables": ["voterName", "firstName", "constituency"],
    "variants": [
      {
        "language": "hi",
        "title": "{{voterName}} के लिए अभियान अपडेट",
        "content": "नमस्ते {{firstName}}! {{constituency}} में हमारे अभियान में आपका स्वागत है।",
        "approved": true
      }
    ]
  }'
```

### **3. Preview Message with Sample Data**

```bash
curl -X POST https://your-domain.com/api/messages/64f8a1b2c3d4e5f6a7b8c9d0/preview \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sampleVoter": {
      "firstName": "Priya",
      "lastName": "Sharma",
      "constituency": "Delhi South",
      "boothNumber": "015"
    },
    "language": "en"
  }'
```

## 🔒 **Security & Permissions**

### **Required Permissions**

| Endpoint                         | Permission Required |
| -------------------------------- | ------------------- |
| `POST /api/messages`             | `message:create`    |
| `GET /api/messages`              | `message:read`      |
| `POST /api/messages/:id/preview` | `message:read`      |

### **Access Control**

- **Authentication Required**: All endpoints require valid JWT tokens
- **Permission Based**: Access controlled by user permissions
- **User Isolation**: Users can only access messages they created (unless admin)
- **Rate Limiting**: Applied to prevent abuse

## 📈 **Performance & Limits**

### **Rate Limits**

- **Create Message**: 10 requests per minute per user
- **Get Messages**: 100 requests per minute per user
- **Preview Message**: 50 requests per minute per user

### **Size Limits**

- **Title**: Maximum 100 characters
- **Content**: Maximum 1000 characters
- **Template Variables**: Maximum 20 variables per message
- **Language Variants**: Maximum 15 variants per message

## 🐛 **Error Handling**

### **Common Error Codes**

| Error Code                   | Description                   | HTTP Status |
| ---------------------------- | ----------------------------- | ----------- |
| `MISSING_FIELDS`             | Required fields not provided  | 400         |
| `INVALID_MESSAGE_TYPE`       | Unsupported message type      | 400         |
| `INVALID_TEMPLATE_VARIABLES` | Invalid template variables    | 400         |
| `MESSAGE_NOT_FOUND`          | Message ID not found          | 404         |
| `MESSAGE_CREATION_FAILED`    | Server error during creation  | 500         |
| `MESSAGE_RETRIEVAL_FAILED`   | Server error during retrieval | 500         |
| `MESSAGE_PREVIEW_FAILED`     | Server error during preview   | 500         |

### **Error Response Format**

```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "ERROR_CODE",
  "details": "Additional error information (optional)"
}
```

## 🔍 **Testing & Validation**

### **Template Variable Validation**

Before creating a message, validate your template variables:

```typescript
import { MessagePersonalizationService } from "./services/MessagePersonalizationService";

const content = "Hello {{firstName}}! Welcome to {{constituency}}.";
const validation =
  MessagePersonalizationService.validateTemplateVariables(content);

if (validation.isValid) {
  console.log("Valid template variables:", validation.variables);
} else {
  console.error("Template errors:", validation.errors);
}
```

### **Message Preview Testing**

Always test your messages with sample data before sending:

```typescript
const sampleVoter = {
  firstName: "Test",
  lastName: "User",
  constituency: "Test Constituency",
  boothNumber: "999",
};

const preview = await fetch("/api/messages/messageId/preview", {
  method: "POST",
  headers: { Authorization: "Bearer token" },
  body: JSON.stringify({ sampleVoter, language: "en" }),
});
```

## 🚀 **Best Practices**

### **1. Template Variable Usage**

✅ **Good:**

- Use relevant variables that add personal value
- Provide meaningful default values
- Test with various voter data scenarios

❌ **Avoid:**

- Overusing variables that don't add value
- Using variables without fallback values
- Creating overly complex templates

### **2. Message Content**

✅ **Good:**

- Keep messages concise and clear
- Use appropriate language for the channel
- Include clear call-to-action

❌ **Avoid:**

- Overly long messages
- Complex language that might confuse voters
- Missing contact information or next steps

### **3. Multi-Language Support**

✅ **Good:**

- Provide translations for major languages in your constituency
- Ensure cultural appropriateness
- Test translations with native speakers

❌ **Avoid:**

- Machine translations without human review
- Ignoring cultural nuances
- Using the same content across all languages

## 📞 **Support & Troubleshooting**

### **Common Issues**

1. **Template Variables Not Replaced**

   - Check if variables are properly formatted: `{{variableName}}`
   - Ensure variables are included in `templateVariables` array
   - Verify voter data contains the required fields

2. **Language Variants Not Working**

   - Check if language codes are correct (en, hi, te, etc.)
   - Ensure variants are marked as `approved: true`
   - Verify `targetLanguages` includes the required languages

3. **Message Creation Fails**
   - Check required fields (title, content, messageType)
   - Verify message type is supported
   - Ensure template variables are valid

### **Getting Help**

- **Documentation**: Refer to this guide and examples
- **Logs**: Check application logs for detailed error information
- **Support**: Contact the development team for technical issues

---

**🎉 You now have a complete standalone message creation system with personalization support!**

**Create personalized messages, test them with sample data, and integrate them into your campaigns for maximum voter engagement.**
