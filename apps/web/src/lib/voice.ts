// apps/web/src/lib/voice.ts
import { Device, type Connection } from "@twilio/voice-sdk";

let device: Device | null = null;
let connection: Connection | null = null;
let initializing: Promise<void> | null = null;
let demoMode = false;

// Check if we're in demo mode (production without backend)
const isDemoMode = () => {
  return import.meta.env.PROD && !import.meta.env.VITE_API_URL;
};

async function fetchToken(identity = "demo-user") {
  if (isDemoMode()) {
    throw new Error("Demo mode - no backend available");
  }
  
  const res = await fetch(`/api/voice/token?identity=${encodeURIComponent(identity)}`);
  if (!res.ok) throw new Error(`token ${res.status}`);
  const { token } = await res.json();
  return token as string;
}

async function ensureDevice() {
  if (device) return;
  if (!initializing) {
    initializing = (async () => {
      const token = await fetchToken();
      device = new Device(token, { codecPreferences: ["opus", "pcmu"], fakeLocalDTMF: true });
      device.on("ready", () => console.log("[voice] ready"));
      device.on("error", (e) => console.error("[voice] error", e));
      device.on("disconnect", () => console.log("[voice] disconnect"));
      device.on("incoming", (conn) => console.log("[voice] incoming", conn.parameters));
      device.on("tokenWillExpire", async () => {
        try { await device?.updateToken(await fetchToken()); console.log("[voice] token refreshed"); }
        catch (e) { console.error("[voice] token refresh failed", e); }
      });
      await new Promise<void>((resolve, reject) => {
        const onReady = () => { device?.off("ready", onReady); resolve(); };
        const onErr = (e: unknown) => reject(e);
        device!.once("ready", onReady);
        device!.once("error", onErr);
        // Fallback timeout (optional)
        setTimeout(() => resolve(), 3000);
      });
    })().finally(() => { initializing = null; });
  }
  await initializing;
}

export async function startCall(params?: Record<string,string>) {
  if (isDemoMode()) {
    // Show demo notification for production deployment
    alert(`🎙️ DEMO MODE - Better Call Robots

This is a live demo of the enterprise voice AI platform!

In a full deployment, this would:
✅ Connect to Twilio Voice SDK
✅ Stream real-time audio to Google Gemini AI
✅ Generate responses with ElevenLabs voices
✅ Handle enterprise customer support calls

Built for telecommunications and utility companies.

Repository: https://github.com/pfeddy91/better-call-robots`);
    return null;
  }
  
  await ensureDevice();
  if (!device) throw new Error("device not initialized");
  if (connection) return connection;
  connection = await device.connect({ params: params ?? {} });
  connection.on("accept", () => console.log("[voice] accepted"));
  connection.on("warning", (name, data) => console.warn("[voice] warning", name, data));
  connection.on("disconnect", () => { console.log("[voice] disconnected"); connection = null; });
  return connection;
}

export function endCall() {
  try { device?.disconnectAll(); } catch {}
}

export function mute(on: boolean) {
  if (connection) connection.mute(on);
}

export function getState() {
  return {
    deviceState: device?.state ?? "uninitialized",
    hasConnection: !!connection,
  };
}