import 'dotenv/config';
import express = require('express');
import cors = require('cors');
import { v4 as uuid } from 'uuid';
import { GoogleGenAI, Modality } from '@google/genai';
import http = require('http');
import WebSocket, { Server as WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 5050);
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || '';
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

if (!PROJECT_ID) {
  console.error('Missing GOOGLE_PROJECT_ID in environment.');
  process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('GOOGLE_APPLICATION_CREDENTIALS not set. ADC must be available for auth.');
}

type LiveSession = {
  id: string;
  live: any; // session from @google/genai
  events: Array<{ ts: number; type: string; data?: any }>;
  open: boolean;
  clients: Set<WebSocket>;
};

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create HTTP server and WebSocket server for real-time event streaming
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Helper to broadcast to all clients of a session
function broadcastToSession(sessionId: string, payload: any) {
  const s = sessions.get(sessionId);
  if (!s || s.clients.size === 0) return;
  const data = JSON.stringify(payload);
  for (const ws of s.clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

const genai = new GoogleGenAI({ project: PROJECT_ID });
const sessions = new Map<string, LiveSession>();

app.get('/health', (_req, res) => {
  res.json({ ok: true, model: MODEL, project: PROJECT_ID });
});

// Phase 1: text-only smoke test
app.post('/api/session', async (_req, res) => {
  const id = uuid();
  try {
    // Create session placeholder BEFORE connecting so callbacks can record events
    const placeholder: LiveSession = { id, live: null as any, events: [{ ts: Date.now(), type: 'created' }], open: false, clients: new Set() };
    sessions.set(id, placeholder);

    const enableAudioOut = /^1|true$/i.test(String(process.env.GEMINI_ENABLE_AUDIO_OUT || ''));
    const voiceEnv = (process.env.GEMINI_VOICE || '').trim();
    const languageCode = (process.env.GEMINI_SPEECH_LANGUAGE || 'en-US').trim();
    const speechCfg: any = { languageCode };
    // Voice config must be TOP-LEVEL in connect config (not nested under speechConfig)
    const voiceCfg: any | undefined = enableAudioOut && voiceEnv
      ? { prebuiltVoiceConfig: { voiceName: voiceEnv } }
      : undefined;

    const live = await genai.live.connect({
      model: MODEL,
      config: enableAudioOut
        ? {
            // Request AUDIO only to match supported server expectations
            responseModalities: [Modality.AUDIO],
            systemInstruction: 'You are a concise, friendly assistant.'
            // Note: omit speechConfig/voiceConfig initially to avoid invalid-argument
          }
        : {
            // Default: text-only (most robust)
            responseModalities: [Modality.TEXT],
            systemInstruction: 'You are a concise, friendly assistant.'
          },
      callbacks: {
        onopen: () => {
          const s = sessions.get(id);
          s?.events.push({ ts: Date.now(), type: 'open' });
          if (s) s.open = true;
          broadcastToSession(id, { type: 'open' });
        },
        onmessage: (msg: any) => {
          const s = sessions.get(id);
          s?.events.push({ ts: Date.now(), type: 'message', data: msg });
          // Some SDK versions emit setupComplete before onopen; treat as open for debug
          if (msg && (msg.setupComplete || msg.serverMetadata)) {
            if (s) s.open = true;
          }

          // Try to extract assistant text/audio across possible shapes
          const texts: string[] = [];
          try {
            const partsA = msg?.serverContent?.modelTurn?.parts;
            if (Array.isArray(partsA)) {
              for (const p of partsA) {
                if (typeof p?.text === 'string') texts.push(p.text);
              }
            }
            const partsB = msg?.modelTurn?.parts;
            if (Array.isArray(partsB)) {
              for (const p of partsB) {
                if (typeof p?.text === 'string') texts.push(p.text);
              }
            }
            const candText = msg?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (typeof candText === 'string') texts.push(candText);
            // Capture inline audio responses wherever they appear
            const collectAudioFromParts = (parts: any[]) => {
              for (const p of parts) {
                const data = p?.inlineData?.data;
                const mime = p?.inlineData?.mimeType;
                if (data && typeof data === 'string' && typeof mime === 'string' && mime.startsWith('audio/')) {
                  s?.events.push({ ts: Date.now(), type: 'assistantAudio', data: { mimeType: mime, base64: data } });
                  broadcastToSession(id, { type: 'assistantAudio', data: { mimeType: mime, base64: data } });
                }
              }
            };
            if (Array.isArray(partsA)) collectAudioFromParts(partsA);
            if (Array.isArray(partsB)) collectAudioFromParts(partsB);
            const candParts = msg?.candidates?.[0]?.content?.parts;
            if (Array.isArray(candParts)) collectAudioFromParts(candParts);
            // SDK convenience getter: msg.data may concatenate inlineData parts
            const concatData = typeof msg?.data === 'string' ? msg.data : undefined;
            if (concatData) {
              const guessedMime = (partsA?.find?.((p: any) => p?.inlineData?.data)?.inlineData?.mimeType)
                || (partsB?.find?.((p: any) => p?.inlineData?.data)?.inlineData?.mimeType)
                || (candParts?.find?.((p: any) => p?.inlineData?.data)?.inlineData?.mimeType)
                || 'audio/pcm;rate=24000';
              s?.events.push({ ts: Date.now(), type: 'assistantAudio', data: { mimeType: guessedMime, base64: concatData } });
              broadcastToSession(id, { type: 'assistantAudio', data: { mimeType: guessedMime, base64: concatData } });
            }
          } catch {}
          if (texts.length && s) {
            s.events.push({ ts: Date.now(), type: 'assistantText', data: { text: texts.join('\n') } });
            broadcastToSession(id, { type: 'assistantText', data: { text: texts.join('\n') } });
          }

          // Signal turn completion so clients can re-enable mic (half-duplex)
          try {
            const turnComplete = Boolean(
              msg?.serverContent?.turnComplete ||
              msg?.turnComplete ||
              msg?.serverContent?.modelTurn?.turnComplete
            );
            if (turnComplete) {
              s?.events.push({ ts: Date.now(), type: 'turnComplete' });
              broadcastToSession(id, { type: 'turnComplete' });
            }
          } catch {}
        },
        onerror: (err: any) => {
          const s = sessions.get(id);
          s?.events.push({ ts: Date.now(), type: 'error', data: { message: String(err?.message || err) } });
          broadcastToSession(id, { type: 'error', data: { message: String(err?.message || err) } });
        },
        onclose: (evt: any) => {
          const s = sessions.get(id);
          s?.events.push({ ts: Date.now(), type: 'close', data: { code: evt?.code, reason: evt?.reason } });
          if (s) s.open = false;
          broadcastToSession(id, { type: 'close', data: { code: evt?.code, reason: evt?.reason } });
        }
      }
    });
    // Attach the live session to the placeholder now that connect resolved
    const s = sessions.get(id);
    if (s) s.live = live;
    res.json({ success: true, sessionId: id });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'failed to connect' });
  }
});

app.post('/api/session/:id/send-text', async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s || !s.open) return res.status(404).json({ success: false, error: 'session not found or not open' });
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ success: false, error: 'text is required' });

  try {
    // Use Live Session API to send a user turn
    s.live.sendClientContent({
      turns: [
        {
          role: 'user',
          parts: [{ text }]
        }
      ],
      turnComplete: true
    });
    s.events.push({ ts: Date.now(), type: 'clientText', data: { text } });
    broadcastToSession(req.params.id, { type: 'clientText', data: { text } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'send failed' });
  }
});

// Phase 2: audio input streaming (webm/opus or pcm). Body: { base64, mimeType, end? }
app.post('/api/session/:id/send-audio', async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s || !s.open) return res.status(404).json({ success: false, error: 'session not found or not open' });
  const base64 = String(req.body?.base64 || '');
  const mimeType = String(req.body?.mimeType || '');
  const end = Boolean(req.body?.end);
  // Accept PCM 16k and webm/opus (some models require PCM-only)
  const SUPPORTED = ['audio/pcm', 'audio/pcm;rate=16000', 'audio/webm;codecs=opus', 'audio/webm'];
  if (!end && (!base64 || !mimeType)) {
    return res.status(400).json({ success: false, error: 'base64 and mimeType required' });
  }
  if (!end && !SUPPORTED.includes(mimeType)) {
    return res.status(415).json({ success: false, error: `unsupported mimeType: ${mimeType}` });
  }
  try {
    if (!end) s.live.sendRealtimeInput({ audio: { data: base64, mimeType } });
    if (end) s.live.sendRealtimeInput({ audioStreamEnd: true });
    s.events.push({ ts: Date.now(), type: 'clientAudio', data: { bytes: Math.floor((base64.length * 3) / 4), mimeType } });
    if (!end) broadcastToSession(req.params.id, { type: 'clientAudio', data: { bytes: Math.floor((base64.length * 3) / 4), mimeType } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'audio send failed' });
  }
});

app.get('/api/session/:id/events', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'session not found' });
  res.json({ success: true, open: s.open, events: s.events.slice(-200) });
});

app.post('/api/session/:id/close', async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ success: false, error: 'session not found' });
  try {
    await s.live.close();
    s.open = false;
    s.events.push({ ts: Date.now(), type: 'clientClose' });
    broadcastToSession(req.params.id, { type: 'clientClose' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'close failed' });
  }
});

// Handle WebSocket connections and bind them to sessions via query string: ?sid=...
wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const sid = url.searchParams.get('sid') || '';
    const s = sessions.get(sid);
    if (!s) {
      ws.close(1008, 'invalid session');
      return;
    }
    s.clients.add(ws);
    ws.on('close', () => {
      s.clients.delete(ws);
    });
  } catch {
    ws.close(1011, 'error');
  }
});

server.listen(PORT, () => {
  console.log(`[gemini-live-sandbox] listening on http://localhost:${PORT}`);
});


