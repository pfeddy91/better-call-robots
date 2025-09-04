## Option B: Browser Voice (Twilio Programmable Voice SDK) — Demo Plan

### Objective
- Enable “Talk to Agent” from the web app using Twilio’s browser Voice SDK (WebRTC), leveraging existing backend `/twiml` and `/ws` endpoints for ConversationRelay.

### Architecture
- Browser fetches a short-lived Twilio Voice Access Token from the API → initializes a Twilio `Device` → connects a WebRTC call to Twilio → Twilio requests `/twiml` → `<ConversationRelay>` bridges audio to `wss://<NGROK_URL>/ws`.

### Prerequisites
- Twilio Account SID, Programmable Voice API Key SID and Secret.
- TwiML App with Voice Request URL set to `https://<public-api-domain>/twiml` (POST).
- Public HTTPS URL for the API (ngrok acceptable). Env: `NGROK_URL` points to your public domain.
- Browser served via HTTPS (localhost is fine) with mic permission.

### Backend (FastAPI) — Minimal Additions
1) Dependencies
- Add: `twilio` (for Access Token). FastAPI already present.

2) Environment
- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_TWIML_APP_SID`
- `TOKEN_TTL_SECONDS` (e.g., 3600)

3) CORS
- Allow your Vite dev origin (e.g., `http://localhost:5173`) for the token route.

4) New route: `/voice/token`
- Returns a signed Access Token with a VoiceGrant referencing `TWILIO_TWIML_APP_SID`.
- Include basic request-id logging; keep logs concise and consistent with existing prints.

5) Confirm existing endpoints
- `POST /twiml` returns `<ConversationRelay url="wss://<NGROK_URL>/ws" ...>`
- `WS /ws` accepts and processes ConversationRelay messages (already implemented in `main.py`).

### Twilio Console
1) Create TwiML App
- Voice → Request URL: `https://<public-api-domain>/twiml` (POST).
- Save the App SID to `TWILIO_TWIML_APP_SID`.

2) Create API Key + Secret (Programmable Voice)
- Store in env as `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET`.

3) (Optional) Inbound number
- Point your Twilio number “Voice & Fax → A Call Comes In” to the same `/twiml` for phone-call-based testing.

### Frontend (Vite React)
1) Dependencies
- `@twilio/voice-sdk`

2) Config
- Add `VITE_API_URL` (e.g., `https://<public-api-domain>`).

3) Voice client module (singleton)
- Fetch token from `/voice/token` (handle 401/expiry); instantiate `Device` with codec prefs (`opus`, `pcmu`).
- Wire events: `ready`, `connect`, `disconnect`, `error`, `tokenWillExpire` (refresh token).
- Expose `startCall(params?)`, `endCall()`, `mute(bool)`.

4) UI wiring
- “Talk to Agent” button → `startCall()`; show statuses: Connecting → Connected → Disconnected.
- Add “Hang up” and “Mute” controls; display concise error toasts if any.

### Local Runbook
1) API
- Export env including `NGROK_URL` and Twilio creds. Run the API (e.g., `make run`).
- Start ngrok for the API port. Update `NGROK_URL`. Confirm `WS_URL` logs correctly at startup.

2) Twilio App
- Update TwiML App Voice Request URL to the current ngrok `https://<ngrok-subdomain>/twiml`.

3) Frontend
- `VITE_API_URL` → your public API origin. `npm run dev` at `http://localhost:5173`.

4) E2E test
- Load the app → click “Talk to Agent” → allow mic → observe connected state → speak; hear TTS reply.

### Debugging (Best-in-Class for Demo)
- Browser: Console logs from `Device` events; Network tab for `/voice/token` 200; mic permissions.
- Backend: Logs for `/voice/token` (issued token/identity), `/twiml` hits, `/ws` `setup`/`prompt` activity with `callSid`.
- Twilio: Console → Programmable Voice → Debugger; Voice Insights call logs for ICE/media issues.
- ngrok: Inspect requests to `/voice/token` and `/twiml`.

Common fixes
- 401/403: Token missing/expired ⇒ ensure route reachable; implement `tokenWillExpire` refresh.
- No audio: Mic denied or non-HTTPS ⇒ grant permission, ensure HTTPS.
- Twilio not hitting `/twiml`: Wrong URL in TwiML App ⇒ update to latest ngrok URL.
- WebSocket errors: `NGROK_URL` stale ⇒ update env and restart API.

### Security (Demo-Appropriate)
- Short-lived tokens (15–60 min). Limit CORS to dev origin(s). Avoid logging PII. HTTPS everywhere.

### Time-Boxed Checklist (≈2 hours)
- 0:00–0:20  Twilio: API Key/Secret, TwiML App → `/twiml`.
- 0:20–0:40  Backend: env, CORS, `/voice/token` route.
- 0:40–1:00  ngrok: expose API; update `NGROK_URL` + TwiML App URL.
- 1:00–1:30  Frontend: install SDK, add `voice` module; wire button + controls.
- 1:30–2:00  E2E test; polish logs/status; screenshot backup.

### Acceptance Criteria (Demo)
- Clicking “Talk to Agent” starts a browser call; mic works; agent replies via TTS.
- Call controls (hang up, mute) function; status indicators are visible and accurate.
- Logs are sufficient to quickly triage token, TwiML, or WebSocket issues.


