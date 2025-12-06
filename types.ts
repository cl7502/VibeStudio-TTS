
export interface VoiceConfig {
  name: string;
  gender: 'Male' | 'Female';
  style: string;
  id: string; // Internal ID for API
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voiceName: string;
  timestamp: number;
  duration: number;
  audioUrl: string; // Blob URL
  audioBuffer: AudioBuffer;
}

export interface ReferenceAudio {
  id: string;
  name: string;
  url: string | null; // URL might be null for presets without preview
  blob: Blob | null;
  type: 'upload' | 'sample';
  targetVoiceId?: string; // For samples: The pre-defined mapping
  baseModelId?: string;   // For uploads: The user-selected best match
  style?: string;
  color?: string; // UI color for avatar
}

export enum TTSMode {
  PRESET = 'PRESET',
  CLONE = 'CLONE', // VibeVoice style reference
}

export const PRESET_VOICES: VoiceConfig[] = [
  { name: 'Puck', gender: 'Male', style: 'Neutral, Balanced', id: 'Puck' },
  { name: 'Charon', gender: 'Male', style: 'Deep, Authoritative', id: 'Charon' },
  { name: 'Kore', gender: 'Female', style: 'Clear, Friendly', id: 'Kore' },
  { name: 'Fenrir', gender: 'Male', style: 'Energetic, Fast', id: 'Fenrir' },
  { name: 'Zephyr', gender: 'Female', style: 'Soft, Calm', id: 'Zephyr' },
];

export const SAMPLE_VOICES: ReferenceAudio[] = [
  { 
    id: 'sample_female_1', 
    name: 'Emma', 
    style: 'Professional, Clear', 
    type: 'sample', 
    targetVoiceId: 'Kore', 
    color: 'bg-rose-500',
    url: null, 
    blob: null 
  },
  { 
    id: 'sample_male_1', 
    name: 'Marcus', 
    style: 'Deep Narrative', 
    type: 'sample', 
    targetVoiceId: 'Charon', 
    color: 'bg-indigo-500',
    url: null, 
    blob: null 
  },
  { 
    id: 'sample_female_2', 
    name: 'Sophia', 
    style: 'Soft Whisper', 
    type: 'sample', 
    targetVoiceId: 'Zephyr', 
    color: 'bg-violet-500',
    url: null, 
    blob: null 
  },
  { 
    id: 'sample_male_2', 
    name: 'Oliver', 
    style: 'Fast & Energetic', 
    type: 'sample', 
    targetVoiceId: 'Fenrir', 
    color: 'bg-amber-500',
    url: null, 
    blob: null 
  },
  { 
    id: 'sample_male_3', 
    name: 'British Anchor', 
    style: 'News, Formal', 
    type: 'sample', 
    targetVoiceId: 'Puck', 
    color: 'bg-slate-500',
    url: null, 
    blob: null 
  },
];
