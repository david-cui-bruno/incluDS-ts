// Re-export all types
export * from './domain.js';
export * from './api.js';
export * from './config.js';

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// App-wide interfaces
export interface DataState {
  studies: import('./domain.js').Study[];
  procedures: import('./domain.js').Procedure[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

export interface AccessibilityOptions {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

export interface UsageEvent {
  event: string;
  page: import('./domain.js').PageId;
  timestamp: Date;
  data?: Record<string, any>;
}