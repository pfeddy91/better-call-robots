/**
 * Shared types for Voice AI Agent configuration
 */

export type AgentType = "inbound" | "outbound";

export interface AgentSettings {
  endCall: boolean;
  detectLanguage: boolean;
  skipTurn: boolean;
  transferToAgent: boolean;
  transferToNumber: boolean;
  playKeypadTone: boolean;
  voicemailDetection: boolean;
}

export interface AgentConfig {
  type: AgentType | null;
  language: string;
  welcomeMessage: string;
  systemPrompt: string;
  settings: AgentSettings;
}

export interface AgentData extends AgentConfig {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  fullCreatedAt: string;
}

export interface CreateAgentRequest {
  name: string;
  type: AgentType;
  language: string;
  welcomeMessage: string;
  systemPrompt: string;
  settings: AgentSettings;
  createdBy: string;
}

export interface CreateAgentResponse {
  success: true;
  agentId: string;
  message: string;
}

export interface CreateAgentErrorResponse {
  success: false;
  error: string;
}

export type CreateAgentApiResponse = CreateAgentResponse | CreateAgentErrorResponse;

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "hr", name: "Croatian", flag: "🇭🇷" },
  { code: "cs", name: "Czech", flag: "🇨🇿" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
] as const;

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  endCall: false,
  detectLanguage: false,
  skipTurn: false,
  transferToAgent: false,
  transferToNumber: false,
  playKeypadTone: false,
  voicemailDetection: false,
}; 