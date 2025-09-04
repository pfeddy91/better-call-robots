import 'dotenv/config';
import { GoogleGenAI, Modality } from '@google/genai';

const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'gen-lang-client-0507434828';
const MODEL = 'gemini-2.0-flash-exp'; // Text model forced to audio mode

console.log('Testing Gemini Live with AUDIO mode on text model...');
console.log('Project ID:', PROJECT_ID);
console.log('Model:', MODEL);

try {
  const genai = new GoogleGenAI({ project: PROJECT_ID });
  
  console.log('Creating Live session with AUDIO responseModalities...');
  const live = await genai.live.connect({
    model: MODEL,
    config: {
      responseModalities: [Modality.AUDIO, Modality.TEXT], // This should cause the error
      systemInstruction: 'You are a concise assistant.',
      speechConfig: { languageCode: 'en-US' }
    },
    callbacks: {
      onopen: () => console.log('✅ Session opened'),
      onmessage: (msg) => console.log('📨 Message:', JSON.stringify(msg, null, 2)),
      onerror: (err) => console.log('❌ Error:', err),
      onclose: (evt) => console.log('🔒 Closed:', evt)
    }
  });
  
  console.log('Sending test message...');
  live.sendClientContent({
    turns: [{ role: 'user', parts: [{ text: 'Say hello' }] }],
    turnComplete: true
  });
  
  // Wait a bit, then close
  setTimeout(() => {
    console.log('Closing session...');
    live.close();
  }, 5000);
  
} catch (error) {
  console.error('❌ Failed:', error);
  process.exit(1);
}
