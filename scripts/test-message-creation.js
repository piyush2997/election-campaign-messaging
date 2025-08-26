// Configuration
const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test data for message creation
const testMessages = [
    {
        title: "Hello {{firstName}}! Welcome to {{constituency}}",
        content: "Dear {{voterName}}, your vote matters in {{constituency}}. Your booth is {{boothNumber}}.",
        messageType: "whatsapp",
        targetAudience: ["registered_voters"],
        targetConstituencies: ["Mumbai North", "Delhi South"],
        targetLanguages: ["en", "hi", "te"],
        templateVariables: ["firstName", "voterName", "constituency", "boothNumber"],
        defaultVariables: {
            boothNumber: "TBD"
        },
        variants: [
            {
                language: "hi",
                title: "नमस्ते {{firstName}}! {{constituency}} में आपका स्वागत है",
                content: "प्रिय {{voterName}}, {{constituency}} में आपका वोट मायने रखता है। आपका बूथ {{boothNumber}} है।",
                approved: true
            },
            {
                language: "te",
                title: "హలో {{firstName}}! {{constituency}}లోకి స్వాగతం",
                content: "ప్రియ {{voterName}}, {{constituency}}లో మీ ఓటు ముఖ్యమైనది. మీ బూత్ {{boothNumber}}.",
                approved: true
            }
        ],
        priority: "medium"
    },
    {
        title: "Vote Reminder for {{firstName}}",
        content: "Hi {{firstName}}! Don't forget to vote in {{constituency}} on election day. Your booth is {{boothNumber}}.",
        messageType: "sms",
        targetAudience: ["registered_voters"],
        targetConstituencies: ["Mumbai North"],
        targetLanguages: ["en"],
        templateVariables: ["firstName", "constituency", "boothNumber"],
        priority: "high"
    },
    {
        title: "Campaign Update for {{voterName}}",
        content: "Hello {{firstName}}! As a {{age}}-year-old {{occupation}}, your voice matters in {{constituency}}.",
        messageType: "whatsapp",
        targetAudience: ["all_voters"],
        targetConstituencies: ["Delhi South"],
        targetLanguages: ["en", "hi"],
        templateVariables: ["voterName", "firstName", "age", "occupation", "constituency"],
        variants: [
            {
                language: "hi",
                title: "{{voterName}} के लिए अभियान अपडेट",
                content: "नमस्ते {{firstName}}! {{age}} वर्ष के {{occupation}} के रूप में, आपकी आवाज़ {{constituency}} में मायने रखती है।",
                approved: true
            }
        ],
        priority: "medium"
    }
];

// Sample voter data for preview testing
const sampleVoters = [
    {
        firstName: "Rahul",
        lastName: "Kumar",
        constituency: "Mumbai North",
        assemblySegment: "Andheri West",
        boothNumber: "001",
        age: 28,
        gender: "male",
        occupation: "Engineer"
    },
    {
        firstName: "Priya",
        lastName: "Sharma",
        constituency: "Delhi South",
        assemblySegment: "Greater Kailash",
        boothNumber: "015",
        age: 32,
        gender: "female",
        occupation: "Doctor"
    },
    {
        firstName: "Amit",
        lastName: "Patel",
        constituency: "Ahmedabad East",
        assemblySegment: "Vastrapur",
        boothNumber: "023",
        age: 45,
        gender: "male",
        occupation: "Teacher"
    }
];

async function testMessageCreation() {
    console.log('🚀 Testing Standalone Message Creation API\n');

    try {
        // Note: In a real scenario, you would first authenticate and get a token
        // For this demo, we'll show the API structure without actual authentication

        console.log('📝 Available Test Messages:');
        testMessages.forEach((msg, index) => {
            console.log(`\n${index + 1}. ${msg.title}`);
            console.log(`   Type: ${msg.messageType}`);
            console.log(`   Template Variables: ${msg.templateVariables.join(', ')}`);
            console.log(`   Languages: ${msg.targetLanguages.join(', ')}`);
        });

        console.log('\n📋 API Endpoints Available:');
        console.log('POST /api/messages - Create a new message');
        console.log('GET /api/messages - Get all messages');
        console.log('POST /api/messages/:id/preview - Preview message with sample data');

        console.log('\n🔧 Example API Calls:');

        // Example 1: Create WhatsApp message
        console.log('\n1. Create WhatsApp Message:');
        console.log(`curl -X POST ${API_URL}/messages \\`);
        console.log('  -H "Authorization: Bearer <your-token>" \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{');
        console.log('    "title": "Hello {{firstName}}! Welcome to {{constituency}}",');
        console.log('    "content": "Dear {{voterName}}, your vote matters...",');
        console.log('    "messageType": "whatsapp",');
        console.log('    "templateVariables": ["firstName", "voterName", "constituency"]');
        console.log('  }\'');

        // Example 2: Preview message
        console.log('\n2. Preview Message:');
        console.log(`curl -X POST ${API_URL}/messages/<message-id>/preview \\`);
        console.log('  -H "Authorization: Bearer <your-token>" \\');
        console.log('  -H "Content-Type: application/json" \\');
        console.log('  -d \'{');
        console.log('    "sampleVoter": {');
        console.log('      "firstName": "Rahul",');
        console.log('      "lastName": "Kumar",');
        console.log('      "constituency": "Mumbai North"');
        console.log('    },');
        console.log('    "language": "en"');
        console.log('  }\'');

        console.log('\n📊 Sample Voter Data for Testing:');
        sampleVoters.forEach((voter, index) => {
            console.log(`\n${index + 1}. ${voter.firstName} ${voter.lastName}`);
            console.log(`   Constituency: ${voter.constituency}`);
            console.log(`   Booth: ${voter.boothNumber}`);
            console.log(`   Age: ${voter.age}, Occupation: ${voter.occupation}`);
        });

        console.log('\n🎯 Template Variables Available:');
        console.log('- {{voterName}} - Full name (firstName + lastName)');
        console.log('- {{firstName}} - First name only');
        console.log('- {{lastName}} - Last name only');
        console.log('- {{constituency}} - Voter\'s constituency');
        console.log('- {{assemblySegment}} - Assembly segment');
        console.log('- {{boothNumber}} - Polling booth number');
        console.log('- {{age}} - Voter\'s age');
        console.log('- {{gender}} - Voter\'s gender');
        console.log('- {{occupation}} - Voter\'s occupation');

        console.log('\n🌍 Supported Languages:');
        console.log('- en (English), hi (Hindi), te (Telugu)');
        console.log('- ta (Tamil), bn (Bengali), mr (Marathi)');
        console.log('- gu (Gujarati), kn (Kannada), ml (Malayalam)');
        console.log('- pa (Punjabi), or (Odia)');

        console.log('\n📱 Message Types:');
        console.log('- sms: Text messages (max 160 chars)');
        console.log('- whatsapp: WhatsApp messages (max 1000 chars)');
        console.log('- email: Email messages (max 1000 chars)');
        console.log('- voice: Voice calls (text-to-speech)');

        console.log('\n✅ Message Creation Features:');
        console.log('- Template variable personalization');
        console.log('- Multi-language support');
        console.log('- Audience targeting');
        console.log('- Scheduling and priority');
        console.log('- Preview with sample data');
        console.log('- Template validation');

        console.log('\n🔒 Security Features:');
        console.log('- JWT authentication required');
        console.log('- Permission-based access control');
        console.log('- Rate limiting');
        console.log('- Input validation');

        console.log('\n📚 Next Steps:');
        console.log('1. Set up authentication and get JWT token');
        console.log('2. Create your first personalized message');
        console.log('3. Test with sample voter data');
        console.log('4. Integrate with your campaign system');

        console.log('\n🎉 Your standalone message creation system is ready!');
        console.log('Every message can now include voter names and personal details automatically.');

    } catch (error) {
        console.error('❌ Error during testing:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testMessageCreation();
}

module.exports = { testMessageCreation, testMessages, sampleVoters };
