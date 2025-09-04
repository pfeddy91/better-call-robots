# Gemini Live API Prompting Guide

## 🎯 **Where We Prompt Gemini Live API**

The Gemini Live API is prompted in **two key places** during a call:

### **1. Session Initialization** (`geminiLive.ts` lines 200-230)

When a call starts, we send **two critical messages** to configure Gemini:

#### **A. System Prompt** (Lines 200-215)
```typescript
// Send system prompt to configure the agent
const systemMessage = {
  clientContent: {
    turns: [{
      role: 'user',
      parts: [{
        text: systemPrompt, // Contains all behavioral instructions
      }],
    }],
    turnComplete: true,
  },
};
ws.send(JSON.stringify(systemMessage));
```

**What this does:**
- Sets Gemini's **identity** (e.g., "Vodafone Broadband Assistant")
- Defines **behavioral rules** (speak clearly, spell out numbers, etc.)
- Establishes **conversational flow** (greeting → help → closing)
- Configures **voice settings** (Aoede voice, natural pace)

#### **B. Greeting Message** (Lines 217-230)
```typescript
// Send greeting message
const greeting = createGreeting(agentConfig, callContext?.customerName);
const greetingMessage = {
  clientContent: {
    turns: [{
      role: 'user',
      parts: [{
        text: greeting, // e.g., "Hello, you're through to Vodafone's automated broadband assistant. How can I help you today?"
      }],
    }],
    turnComplete: true,
  },
};
ws.send(JSON.stringify(greetingMessage));
```

**What this does:**
- Provides the **opening line** for the conversation
- Can be **personalized** with customer name
- Sets the **tone** for the entire call

### **2. Real-Time Audio Processing** (`geminiLive.ts` lines 337-370)

During the call, we continuously send audio to Gemini:

```typescript
// Send audio from Twilio to Gemini
public async sendAudioToGemini(sessionId: string, twilioAudio: string): Promise<void> {
  // Convert Twilio μ-law to Gemini PCM
  const pcmAudio = audioConverter.convertTwilioToGemini(twilioAudio);
  
  // Create audio message
  const audioMessage = {
    realtimeInput: {
      mediaChunks: [{
        mimeType: 'audio/pcm',
        data: pcmAudio,
      }],
    },
  };
  
  // Send to Gemini
  session.ws.send(JSON.stringify(audioMessage));
}
```

## 📋 **Prompt Configuration System**

### **Agent Configurations** (`config/prompts.ts`)

We have **predefined agent configurations** that contain:

1. **System Prompt**: Complete behavioral instructions
2. **Greeting**: Opening message
3. **Voice Settings**: Voice name, speaking rate, pitch
4. **Conversation Rules**: Duration limits, closing phrases

### **Available Agents:**

#### **Vodafone Broadband Agent** (`vodafone-broadband`)
- **Company**: Vodafone
- **Role**: Broadband Support Specialist
- **Specialties**: Broadband terms, charges, policies
- **Voice**: Aoede (natural-sounding)
- **Greeting**: "Hello, you're through to Vodafone's automated broadband assistant. How can I help you today?"

#### **Generic Customer Service Agent** (`generic-customer-service`)
- **Company**: Better Call Robots
- **Role**: Customer Service Representative
- **Specialties**: General customer service
- **Voice**: Aoede (natural-sounding)
- **Greeting**: "Hello, you're through to our customer service assistant. How can I help you today?"

## 🔧 **How to Customize Prompts**

### **1. Modify Existing Agent**
Edit the agent configuration in `config/prompts.ts`:

```typescript
export const VODAFONE_AGENT: AgentConfig = {
  id: 'vodafone-broadband',
  name: 'Vodafone Broadband Assistant',
  company: 'Vodafone',
  role: 'Broadband Support Specialist',
  systemPrompt: `# Your custom system prompt here
  ...`,
  greeting: "Your custom greeting here",
  // ... other settings
};
```

### **2. Create New Agent**
Add a new agent to the registry:

```typescript
export const CUSTOM_AGENT: AgentConfig = {
  id: 'custom-agent',
  name: 'Custom Assistant',
  // ... configuration
};

export const AGENT_REGISTRY: Record<string, AgentConfig> = {
  'vodafone-broadband': VODAFONE_AGENT,
  'generic-customer-service': GENERIC_AGENT,
  'custom-agent': CUSTOM_AGENT, // Add your new agent
  'default': GENERIC_AGENT,
};
```

### **3. Use Different Agent in Call**
Specify the agent ID when creating a session:

```typescript
// In WebSocket service
geminiLiveService.createSession(
  connection.callSid,
  'custom-agent', // Use your custom agent
  {
    callType: 'inbound',
  }
);
```

## 📝 **System Prompt Structure**

Each system prompt follows this structure:

```markdown
# --- CORE IDENTITY --- 
[Agent identity and persona]

# --- PRIMARY OBJECTIVE --- 
[What the agent should accomplish]

# --- RULES FOR SPOKEN RESPONSES --- 
[How to format responses for voice]

# --- CONVERSATIONAL FLOW --- 
[How to structure the conversation]

# --- IMPORTANT BEHAVIORAL GUIDELINES ---
[Specific behavioral rules]
```

## 🎯 **Key Behavioral Instructions**

### **Voice Optimization:**
- **Spell out numbers**: "fifteen pounds" not "£15"
- **No special characters**: No asterisks, bullets, emojis
- **Clear pronunciation**: Natural, professional tone
- **Conversational pace**: Responsive but efficient

### **Conversational Flow:**
1. **Greet** professionally
2. **Listen** and respond appropriately
3. **Ask for more**: "Is there anything else I can help you with?"
4. **Close politely**: "Thank you for calling. Goodbye."

### **Professional Standards:**
- **Be polite** and professional
- **Don't make up information**
- **Offer human agent** if unsure
- **Be empathetic** to concerns
- **Use customer name** if provided

## 🔄 **Call Flow with Prompts**

1. **Call Starts** → WebSocket connection established
2. **System Prompt Sent** → Configures Gemini's behavior
3. **Greeting Sent** → Provides opening line
4. **Gemini Responds** → Speaks the greeting
5. **Customer Speaks** → Audio sent to Gemini
6. **Gemini Processes** → Uses configured behavior to respond
7. **Conversation Continues** → Real-time audio exchange
8. **Call Ends** → Session cleanup

## 🚀 **Testing Your Prompts**

To test different prompts:

1. **Modify the agent configuration** in `config/prompts.ts`
2. **Restart the server**: `npm run dev`
3. **Make a test call** to your Twilio number
4. **Listen to the responses** and adjust as needed

The system is designed to be **highly configurable** while maintaining **enterprise-grade reliability**. 