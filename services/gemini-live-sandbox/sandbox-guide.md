## Gemini 2.5 Live Angular Demo – Architecture and Guide

This guide focuses exclusively on the Angular demo located at:
`services/gemini-live-sandbox/external/gemini-2-live-angular/`

Use this as your quick reference to understand the architecture, what you can do with the demo, which components do what, and how the voice flow works end-to-end.

---

### Overview (plain English)

- **What it is**: A browser-only Angular app that connects directly to Gemini 2.5 Live using the TypeScript `@google/genai` SDK. No backend needed.
- **What you can do**:
  - Talk to Gemini using your microphone; hear responses with low-latency audio.
  - Send text prompts from a side console.
  - Stream your webcam or screen so Gemini can reason over live video frames.
  - Use in-browser tools via MCP (Model Context Protocol) like a mock weather lookup or multiplication.
  - Switch between native audio (affective/proactive) and cascade (text+TTS pipeline) models.

---

### Architecture (technical)

- UI shell (standalone Angular):
  - `src/app/app.component.*` – root layout; embeds the control tray, side panel, and a `<video>` preview.
  - `src/app/app.config.ts` – bootstraps NgRx logger store and devtools.

- Core services and media plumbing:
  - `src/gemini/gemini-client.service.ts` – the Live API client. Manages session lifecycle, streaming send/receive, model/tool config, audio output playback, and emits logs.
  - `src/gemini/audio-recorder.ts` – captures mic with an AudioWorklet and emits 16‑bit PCM chunks + live volume.
  - `src/gemini/audio-streamer.ts` – smooth playback of model audio (PCM) using Web Audio scheduling and optional metering worklet.
  - `src/gemini/webcam.service.ts` / `src/gemini/screen-capture.service.ts` – control MediaStreams and lifecycle.
  - `src/gemini/gemini-mcp.service.ts` + `src/gemini/mcp/*.server.ts` – in‑memory MCP tools (weather, multiply) exposed as a single callable tool to Gemini.
  - `src/gemini/types.ts`, `src/gemini/utils.ts`, `src/gemini/audioworklet-registry.ts` – shared types/utilities and worklet registration.

- Developer console and controls:
  - `src/app/control-tray/*` – Connect/Disconnect; mic toggle; start/stop webcam and screen share; throttles video frames to Gemini.
  - `src/app/side-panel/*` – collapsible console with text input and a filterable log view.
  - `src/app/logger/*` – log rendering; NgRx store reduces and keeps a rolling buffer of messages.
  - `src/app/audio-pulse/*` – animated mic level indicator.

---

### What each component does

- **AppComponent (`src/app/app.component.ts|html`)**: Hosts the video element and listens for streamed content and tool calls. Pushes user messages; displays model messages.
- **ControlTrayComponent (`src/app/control-tray/*`)**: The primary control surface. Handles connect/disconnect, mic mute, webcam/screen capture toggles, and pushes PCM audio + JPEG frames to the Gemini client.
- **SidePanelComponent (`src/app/side-panel/*`)**: Developer console with send‑text box and a live log view.
- **LoggerComponent + logging feature (`src/app/logger/*`, `src/app/logging/*`)**: Displays structured logs (client send, server content, tool calls, transcripts). Powered by NgRx reducers/selectors.
- **MultimodalLiveService (`src/gemini/gemini-client.service.ts`)**: Heart of the app—creates the `@google/genai` Live session, wires callbacks, sends/receives content, manages model config (native vs cascade), registers MCP tool(s), and plays model audio.
- **McpService (`src/gemini/gemini-mcp.service.ts`)**: Spins up mock MCP servers (weather/multiply) in memory and exposes them to Gemini as tools.
- **AudioRecorder (`src/gemini/audio-recorder.ts`)**: Captures microphone input, converts to PCM16 (base64), emits chunk + volume events.
- **AudioStreamer (`src/gemini/audio-streamer.ts`)**: Queues PCM chunks from Gemini and schedules smooth playback.
- **WebcamService / ScreenCaptureService**: Start/stop MediaStreams; notify ControlTray which forwards frames.

---

### Voice flow (deep‑dive)

Non‑technical explanation:
- You click Play and (optionally) unmute the mic. The app starts sending your voice to Gemini and plays back Gemini’s voice replies almost immediately. You can also type messages if you prefer.

Technical walkthrough:
1) Connect and model setup
   - `ControlTrayComponent` calls `MultimodalLiveService.connect({ affectiveAudio?, proactiveAudio? })`.
   - `gemini-client.service.ts` picks a model:
     - Cascade (default): `gemini-live-2.5-flash-preview` with Search + Code Execution + MCP tools.
     - Native audio: `gemini-2.5-flash-preview-native-audio-dialog` with affective or proactive flags.
   - It sets `responseModalities` (audio or text), voice config (for cascade), and tools.

2) Microphone capture → Gemini
   - When mic is unmuted, `AudioRecorder` acquires a MediaStream, runs an AudioWorklet to convert samples to PCM16, and emits base64 PCM chunks plus volume.
   - `ControlTrayComponent` forwards PCM chunks via `MultimodalLiveService.sendRealtimeInput([{ mimeType: 'audio/pcm;rate=16000', data }])`.

3) Video frames (optional)
   - Webcam or screen share provides a MediaStream. Frames are rendered to a `<canvas>` and downscaled; each frame is JPEG‑encoded and sent via `sendRealtimeInput([{ mimeType: 'image/jpeg', data }])` at a low rate.

4) Model responses (audio + text)
   - `gemini-client.service.ts` listens to Live server messages. For audio parts (PCM), it base64‑decodes and enqueues them into `AudioStreamer`, which schedules seamless playback.
   - For text parts, the service emits `content$` updates; `AppComponent` appends messages as they stream.

5) Tool use (MCP)
   - If Gemini emits a `toolCall`, `AppComponent` forwards it to `McpService.execute()`.
   - The tool response is then sent back to Gemini with `sendToolResponse`, allowing Gemini to integrate the result into its reply.

6) Logging and transcripts
   - All client/server events are emitted as `StreamingLog` entries and shown in the side panel. (Deepgram live transcription is scaffolded but off by default.)

Key files for voice:
- `src/gemini/gemini-client.service.ts` – model selection, Live callbacks, audio emit/receive.
- `src/gemini/audio-recorder.ts` – mic capture + PCM16 encoding.
- `src/gemini/audio-streamer.ts` – PCM playback scheduler.
- `src/app/control-tray/control-tray.component.ts` – user controls, stream wiring, frame throttling.

---

### Running the demo

Requirements:
- Node 22.12.0 (or 20.19.0+). Create `src/environments/environment.development.ts`:

```ts
export const environment = {
  API_KEY: 'YOUR_GOOGLE_AI_API_KEY',
  DEEPGRAM_API_KEY: ''  // optional
};
```

Install and run (dev):
```bash
cd services/gemini-live-sandbox/external/gemini-2-live-angular
npm install
npm start   # or: npx @angular/cli@20 ng serve
# open http://localhost:4200/
```

Build (static):
```bash
npm run build
# output: dist/gemini-2-live-angular/browser/
# serve (example):
npx http-server dist/gemini-2-live-angular/browser -p 4200
```

Switch between native audio and cascade:
- In the Control Tray, toggle “Affective” or “Proactive” for native audio models; otherwise, it uses a cascade model with tools like Search and Code Execution enabled.

---

### Typical data flows

- Audio in: Mic → AudioWorklet PCM16 → `sendRealtimeInput` → Gemini
- Audio out: Gemini PCM → `AudioStreamer` → Web Audio playback
- Text: Side panel → `send()` → Gemini → streamed model text
- Video: Webcam/Screen → Canvas → JPEG frames → `sendRealtimeInput`
- Tools: `toolCall` → MCP execute → `sendToolResponse`

---

### Tips and troubleshooting

- If the dev server complains about Node version, switch to Node 22.12.0 and retry.
- If you see a blank page or 404 when serving statically, ensure you’re serving from `dist/gemini-2-live-angular/browser/` (not the parent folder).
- Ensure your `API_KEY` is present; Angular does not read `.env`.
- For native audio, enable “Affective” or “Proactive” before connecting. For tool calling, leave both disabled (cascade mode).

---

### Quick reference (copy/paste)

Run Node sandbox:

```bash
cd services/gemini-live-sandbox
npm install
cp .env.example .env   # if you have one; otherwise create .env as above
npm run dev
# open http://localhost:5050/
```

Run Angular demo:

```bash
cd services/gemini-live-sandbox/external/gemini-2-live-angular
npm install -g @angular/cli
npm install
# create src/environments/environment.development.ts (see snippet above)
npm start
# open http://localhost:4200/
```

---

### Security note

This demo runs fully in the browser. Do not put server‑side secrets into `environment.development.ts`. Only include the client API key (and optional Deepgram key if you enable it). For production, prefer a backend proxy or Vertex AI with server‑side credentials.

---

If you need, we can automate generating the Angular `environment.development.ts` from your existing `.env` to avoid manual copying.


