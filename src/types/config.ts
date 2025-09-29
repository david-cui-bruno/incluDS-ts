export interface AppConfig {
    title: string;
    logo: string;
    logoAlt: string;
    colors: Record<string, string>;
    features: FeatureFlags;
    api: ApiConfig;
    ui: UiConfig;
  }
  
  export interface FeatureFlags {
    textToSpeech: boolean;
    translation: boolean;
    geolocation: boolean;
    search: boolean;
    summarizer: boolean;
    offlineMode: boolean;
  }
  
  export interface ApiConfig {
    translateApiKey?: string;
    geocodingApiKey?: string;
    summarizerEndpoint?: string;
    resourcesEndpoint?: string;
  }
  
  export interface UiConfig {
    theme: 'base' | 'headspace' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    animations: boolean;
    autoRead: boolean;
  }
  
  export interface ThemeColors {
    '--bg': string;
    '--fg': string;
    '--card': string;
    '--border': string;
    '--brand': string;
    '--brand-ink': string;
    '--muted': string;
    '--focus': string;
    '--success': string;
    '--warning': string;
    '--error': string;
  }