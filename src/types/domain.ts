// Business domain types (moved from individual files)

// Studies
export interface Study {
  name: string;
  year: number;
  org: string;
  url: string;
  summary: string;
}

// Procedures
export interface Procedure {
  key: string;
  title: string;
  what: string;
  how: string;
  feel: string;
  after: string;
}

// Navigation and UI
export type PageId = 'home' | 'studies' | 'summarizer' | 'resources' | 'procedures';

export interface NavigationItem {
  id: PageId;
  label: string;
  icon?: string;
  ariaLabel?: string;
}

// Location and Resources
export interface Location {
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  country?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  hours?: string;
  services?: string[];
}

// Search
export interface SearchResult {
  type: 'study' | 'procedure' | 'resource' | 'page';
  title: string;
  content: string;
  url: string;
  relevance: number;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  type?: SearchResult['type'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: Location;
  radius?: number; // in miles
}

// Translation
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh-CN' | 'ar';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

export interface TranslationState {
  currentLanguage: LanguageCode;
  isTranslating: boolean;
  supportedLanguages: LanguageOption[];
}

// Speech
export interface VoiceConfig {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeechState {
  isSupported: boolean;
  isSpeaking: boolean;
  currentUtterance: SpeechSynthesisUtterance | null;
  voices: SpeechSynthesisVoice[];
  config: VoiceConfig;
}
