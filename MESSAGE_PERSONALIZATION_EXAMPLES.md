# Message Personalization Examples

This guide shows how to use voter names and other personalization variables in your campaign messages.

## 🎯 **Template Variables Available**

### **Voter Information Variables**

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

## 📝 **Message Examples with Personalization**

### **1. Simple Personalized SMS**

**Template:**

```
Hello {{firstName}}! Your vote matters in {{constituency}}.
Don't forget to vote on election day!
```

**Personalized Output for Rahul Kumar:**

```
Hello Rahul! Your vote matters in Mumbai North.
Don't forget to vote on election day!
```

### **2. Multi-Language Personalized WhatsApp**

**English Template:**

```
Dear {{voterName}},

Welcome to our campaign in {{constituency}}!
As a {{age}}-year-old {{occupation}}, your voice matters.

We're reaching out to voters in {{assemblySegment}} to ensure everyone participates in democracy.

Best regards,
Your Campaign Team
```

**Hindi Template:**

```
प्रिय {{voterName}},

{{constituency}} में हमारे अभियान में आपका स्वागत है!
{{age}} वर्ष के {{occupation}} के रूप में, आपकी आवाज़ मायने रखती है।

हम {{assemblySegment}} के मतदाताओं तक पहुंच रहे हैं ताकि सभी लोकतंत्र में भाग लें।

सादर,
आपकी अभियान टीम
```

**Telugu Template:**

```
ప్రియ {{voterName}},

{{constituency}}లో మా ఎన్నికల ప్రచారంలోకి స్వాగతం!
{{age}} సంవత్సరాల {{occupation}}గా, మీ స్వరం ముఖ్యమైనది.

{{assemblySegment}}లోని ఓటర్లందరికీ చేరుకోవడానికి ప్రయత్నిస్తున్నాము.

ధన్యవాదాలు,
మీ ఎన్నికల టీం
```

### **3. Campaign Launch Message**

**Template:**

```
🎉 {{firstName}}, our campaign is officially launched!

📍 Location: {{constituency}} - {{assemblySegment}}
🏛️ Booth: {{boothNumber}}

Your support as a {{occupation}} in our community is invaluable.
Let's work together for a better {{constituency}}!

#VoteForChange #{{constituency}}
```

**Personalized Output:**

```
🎉 Rahul, our campaign is officially launched!

📍 Location: Mumbai North - Andheri West
🏛️ Booth: 001

Your support as an Engineer in our community is invaluable.
Let's work together for a better Mumbai North!

#VoteForChange #MumbaiNorth
```

### **4. Reminder Message**

**Template:**

```
Hi {{firstName}} {{lastName}},

This is a friendly reminder that voting day is approaching for {{constituency}}.

📍 Your polling booth: {{boothNumber}}
📍 Assembly segment: {{assemblySegment}}

As a {{age}}-year-old {{occupation}}, your vote represents the future of our community.

See you at the polls!
```

## 🚀 **How to Create Personalized Messages**

### **1. Create Message with Template Variables**

```typescript
import { CampaignService } from "./services/CampaignService";

const messageData = {
  title: "Personal Campaign Update for {{voterName}}",
  content: `Hello {{firstName}}!

Welcome to our campaign in {{constituency}}! 
Your booth number is {{boothNumber}} in {{assemblySegment}}.

As a {{age}}-year-old {{occupation}}, your voice matters in our democracy.

Best regards,
Your Campaign Team`,
  type: "whatsapp",
  targetAudience: ["registered_voters"],
  templateVariables: [
    "voterName",
    "firstName",
    "constituency",
    "boothNumber",
    "assemblySegment",
    "age",
    "occupation",
  ],
  defaultVariables: {
    age: "voter",
    occupation: "citizen",
  },
};

const message = await CampaignService.createCampaignMessage(
  campaignId,
  messageData,
  userId
);
```

### **2. Preview Personalized Message**

```typescript
import { MessagePersonalizationService } from "./services/MessagePersonalizationService";

// Get message preview for a sample voter
const sampleVoter = {
  firstName: "Priya",
  lastName: "Sharma",
  constituency: "Delhi South",
  assemblySegment: "Greater Kailash",
  boothNumber: "015",
  age: 32,
  occupation: "Doctor",
};

const preview = MessagePersonalizationService.getMessagePreview(
  message,
  sampleVoter,
  "en"
);

console.log("Personalized Title:", preview.title);
console.log("Personalized Content:", preview.content);
```

### **3. Send Personalized Campaign Message**

```typescript
// The system automatically personalizes messages for each voter
const sendResult = await CampaignService.sendCampaignMessage(
  campaignId,
  message._id
);

console.log(`Sent: ${sendResult.successful}, Failed: ${sendResult.failed}`);
```

## 🌍 **Multi-Language Personalization**

### **Create Message with Language Variants**

```typescript
const messageData = {
  title: "Campaign Update for {{voterName}}",
  content: "Welcome {{firstName}} to our campaign in {{constituency}}!",
  type: "whatsapp",
  targetAudience: ["all_voters"],
  templateVariables: ["voterName", "firstName", "constituency"],
  variants: [
    {
      language: "hi",
      title: "{{voterName}} के लिए अभियान अपडेट",
      content:
        "{{constituency}} में हमारे अभियान में {{firstName}} का स्वागत है!",
      approved: true,
    },
    {
      language: "te",
      title: "{{voterName}} కోసం ఎన్నికల నవీకరణ",
      content:
        "{{constituency}}లో మా ఎన్నికల ప్రచారంలోకి {{firstName}} స్వాగతం!",
      approved: true,
    },
    {
      language: "ta",
      title: "{{voterName}} க்கான தேர்தல் புதுப்பிப்பு",
      content:
        "{{constituency}} இல் எங்கள் தேர்தல் பிரச்சாரத்திற்கு {{firstName}} வரவேற்கப்படுகிறார்!",
      approved: true,
    },
  ],
};
```

## 📱 **Channel-Specific Personalization**

### **SMS Messages (Shorter, Direct)**

**Template:**

```
{{firstName}}, vote on {{constituency}} election day!
Booth: {{boothNumber}}. Your voice matters!
```

### **WhatsApp Messages (Longer, Rich)**

**Template:**

```
🎯 *Campaign Update for {{voterName}}*

📍 *Location:* {{constituency}}
🏛️ *Booth:* {{boothNumber}}
👥 *Segment:* {{assemblySegment}}

Hello {{firstName}}! As a {{age}}-year-old {{occupation}},
your participation in democracy is crucial.

Let's build a better {{constituency}} together!

*Reply with "YES" to join our campaign!*
```

### **Email Messages (Detailed, HTML)**

**Template:**

```
Subject: {{firstName}}, Join Our Campaign in {{constituency}}

Dear {{voterName}},

Welcome to our campaign in {{constituency}}!

📍 **Your Details:**
- **Booth:** {{boothNumber}}
- **Segment:** {{assemblySegment}}
- **Age Group:** {{age}} years old
- **Profession:** {{occupation}}

Your voice as a {{occupation}} in our community is invaluable.
Together, we can create positive change in {{constituency}}.

Best regards,
Your Campaign Team
```

## 🔧 **Advanced Personalization Features**

### **1. Conditional Content**

```typescript
// You can create different messages based on voter characteristics
const getPersonalizedContent = (voter: VoterDocument) => {
  let baseContent = `Hello {{firstName}}! Welcome to our campaign in {{constituency}}.`;

  if (voter.age && voter.age < 25) {
    baseContent += `\n\nAs a young voter, you represent the future of our democracy!`;
  } else if (voter.age && voter.age > 60) {
    baseContent += `\n\nYour experience and wisdom are invaluable to our community.`;
  }

  if (voter.occupation === "Student") {
    baseContent += `\n\nStudents like you can drive change through active participation!`;
  }

  return baseContent;
};
```

### **2. Dynamic Targeting**

```typescript
// Create different messages for different voter segments
const createSegmentSpecificMessage = (segment: string) => {
  const messages = {
    young_voters: {
      title: "{{firstName}}, Shape the Future of {{constituency}}!",
      content: `Hey {{firstName}}! As a young voter in {{constituency}}, 
                     you have the power to shape our future. 
                     Your booth is {{boothNumber}} in {{assemblySegment}}.`,
    },
    senior_voters: {
      title: "{{firstName}}, Your Experience Matters in {{constituency}}",
      content: `Respected {{voterName}}, your wisdom and experience 
                     are crucial for {{constituency}}. 
                     Please vote at booth {{boothNumber}}.`,
    },
    professionals: {
      title: "{{firstName}}, Lead Change in {{constituency}}",
      content: `Dear {{occupation}} {{lastName}}, as a professional in {{constituency}}, 
                     you can lead positive change. 
                     Vote at booth {{boothNumber}} in {{assemblySegment}}.`,
    },
  };

  return messages[segment] || messages["young_voters"];
};
```

## 📊 **Testing Personalization**

### **1. Validate Template Variables**

```typescript
import { MessagePersonalizationService } from "./services/MessagePersonalizationService";

const content = "Hello {{firstName}}! Welcome to {{constituency}}.";
const validation =
  MessagePersonalizationService.validateTemplateVariables(content);

if (validation.isValid) {
  console.log("Template variables:", validation.variables);
} else {
  console.error("Template errors:", validation.errors);
}
```

### **2. Test with Sample Voters**

```typescript
const sampleVoters = [
  {
    firstName: "Amit",
    lastName: "Patel",
    constituency: "Ahmedabad East",
    assemblySegment: "Vastrapur",
    boothNumber: "023",
    age: 28,
    occupation: "Software Engineer",
  },
  {
    firstName: "Sunita",
    lastName: "Verma",
    constituency: "Ahmedabad East",
    assemblySegment: "Satellite",
    boothNumber: "045",
    age: 45,
    occupation: "Teacher",
  },
];

// Test personalization for each sample voter
sampleVoters.forEach((voter) => {
  const preview = MessagePersonalizationService.getMessagePreview(
    message,
    voter,
    "en"
  );
  console.log(`\n--- ${voter.firstName} ${voter.lastName} ---`);
  console.log("Title:", preview.title);
  console.log("Content:", preview.content);
});
```

## 🎨 **Best Practices**

### **1. Keep It Personal but Professional**

✅ **Good:**

```
Hello {{firstName}}! Your vote in {{constituency}} matters.
```

❌ **Avoid:**

```
Hey {{firstName}}! Wanna vote? It's cool!
```

### **2. Use Appropriate Variables**

✅ **Relevant:**

```
{{firstName}}, as a {{occupation}} in {{constituency}}, your voice matters.
```

❌ **Irrelevant:**

```
{{firstName}}, your {{boothNumber}} is ready for voting.
```

### **3. Test Different Scenarios**

- Test with different age groups
- Test with different occupations
- Test with different constituencies
- Test in different languages

### **4. Monitor Performance**

```typescript
// Track which personalized messages perform better
const analytics = await CampaignService.getCampaignAnalytics(campaignId);

console.log({
  totalVoters: analytics.totalVoters,
  responseRate: analytics.responseRate,
  engagementMetrics: analytics.engagementMetrics,
});
```

## 🚀 **Getting Started**

### **1. Create Your First Personalized Message**

```typescript
const firstMessage = {
  title: "Welcome {{firstName}} to {{constituency}}!",
  content: `Hello {{voterName}}!

Welcome to our campaign in {{constituency}}! 
Your polling booth is {{boothNumber}} in {{assemblySegment}}.

As a {{age}}-year-old {{occupation}}, your participation is crucial.

Best regards,
Your Campaign Team`,
  type: "whatsapp",
  targetAudience: ["registered_voters"],
  templateVariables: [
    "firstName",
    "voterName",
    "constituency",
    "boothNumber",
    "assemblySegment",
    "age",
    "occupation",
  ],
};
```

### **2. Send and Monitor**

```typescript
// Create and send the message
const message = await CampaignService.createCampaignMessage(
  campaignId,
  firstMessage,
  userId
);
const result = await CampaignService.sendCampaignMessage(
  campaignId,
  message._id
);

// Monitor results
console.log(`Personalized messages sent: ${result.successful}`);
```

---

**🎉 Now every voter will receive a personalized message with their name and relevant details!**

The system automatically:

- ✅ Replaces `{{voterName}}` with the voter's full name
- ✅ Replaces `{{firstName}}` with the voter's first name
- ✅ Replaces `{{constituency}}` with their constituency
- ✅ Replaces `{{boothNumber}}` with their booth number
- ✅ Supports multiple Indian languages
- ✅ Handles missing data gracefully
- ✅ Provides fallback values when needed

**Your campaign messages will now feel personal and engaging for every voter!** 🚀
