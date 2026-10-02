export type PetEmotion = 'idle' | 'happy' | 'thinking' | 'surprised' | 'sleeping' | 'alert' | 'celebrating';

export type PetStyle = 'anime' | 'cartoon' | 'pixel' | 'cyberpunk' | 'ghibli' | 'chibi';

export interface PetAvatar {
  id: string;
  name: string;
  style: PetStyle;
  description: string;
  isCustom?: boolean;
  sourceImage?: string; // Original uploaded media if custom
  // Sprites for different emotions (can be SVG string, Data URL, or URL)
  sprites: {
    idle: string;
    happy?: string;
    thinking?: string;
    surprised?: string;
    sleeping?: string;
    alert?: string;
    celebrating?: string;
  };
  scale?: number;
  offsetY?: number;
}

export type LLMProviderId = 'deepseek' | 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'siliconflow' | 'custom';

export interface LLMConfig {
  provider: LLMProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface Persona {
  id: string;
  name: string;
  title: string;
  avatarIcon: string;
  greeting: string;
  systemPrompt: string;
  speechPitch: number;
  speechRate: number;
  voiceName?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'pet' | 'agent' | 'system';
  content: string;
  timestamp: number;
  emotion?: PetEmotion;
  agentName?: string;
  actionRequired?: {
    type: 'confirm' | 'choice' | 'input';
    options?: string[];
    callbackId?: string;
  };
}

export interface AgentNotification {
  id: string;
  source: string; // e.g. "Claude Desktop", "Antigravity", "Cursor", "GitHub CI", "Local Script"
  title: string;
  message: string;
  emotion?: PetEmotion;
  timestamp: number;
  duration?: number; // ms
  sound?: boolean;
}

export interface StylizeParams {
  style: PetStyle;
  prompt: string;
  cartoonLevel: number; // 1-10
  edgeStrength: number; // 1-10
  vibrancy: number; // 1-10
  removeBackground: boolean;
  colorPalette: 'vibrant' | 'pastel' | 'monochrome' | 'cyber';
  preserveOriginalColors: boolean;
}

export interface AppSettings {
  alwaysOnTop: boolean;
  clickThrough: boolean;
  soundEnabled: boolean;
  ttsEnabled: boolean;
  volume: number;
  petScale: number;
  opacity: number;
  idleWander: boolean;
  activePetId: string;
  activePersonaId: string;
  apiPort: number;
  mcpEnabled: boolean;
  currentLLM: LLMConfig;
}
