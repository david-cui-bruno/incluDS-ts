// App-wide constants
export const APP_CONFIG = {
  SUMMARIZER: {
    GRADE_LEVEL: 8,
    MAX_WORDS: 1000,
    MAX_INPUT_CHARS: 8000, // Increased for better estimation
    MAX_INPUT_WORDS: 2000  // Clear word limit
  },
  SPEECH: {
    PREFERRED_VOICES: [
      'Microsoft Aria',
      'Microsoft Zira',
      'Google UK English Female',
      'Samantha',
      'Victoria',
      'Karen',
      'Tessa',
      'Microsoft Linda',
      'Microsoft Hazel',
      'Google US English Female',
      'female',
      'Female'
    ]
  },
  API: {
    OPENAI_MODEL: 'gpt-3.5-turbo',
    REQUEST_TIMEOUT: 45000, // 45 seconds for longer texts
    MAX_RETRIES: 2 // Retry failed requests
  }
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' }
] as const;

export const PAGE_IDS = ['home', 'studies', 'summarizer', 'resources', 'procedures'] as const;

// Error messages for better UX
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your internet connection.',
  API_KEY: 'Service configuration issue. Please contact support.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  TEXT_TOO_LONG: 'Text is too long. Please use shorter text.',
  TEXT_TOO_SHORT: 'Text is too short to summarize meaningfully.',
  GENERIC: 'Something went wrong. Please try again.',
  TIMEOUT: 'Request timed out. Please try again with shorter text.'
} as const;

