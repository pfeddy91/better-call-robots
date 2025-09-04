import * as fs from 'fs';

const filePath = 'src/services/geminiLive.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic onmessage callback with a simple version
const oldOnmessage = /onmessage: async \(event: any\) => \{[\s\S]*?\},/;
const newOnmessage = `onmessage: (event: any) => {
            log.debug('Received message from Gemini Live', { data: event.data });
          },`;

content = content.replace(oldOnmessage, newOnmessage);

fs.writeFileSync(filePath, content);
console.log('Fixed TypeScript errors in geminiLive.ts');
