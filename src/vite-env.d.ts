/// <reference types="vite/client" />

// Vite environment variables
interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    readonly VITE_API_BASE_URL: string;
    readonly VITE_TRANSLATE_API_KEY: string;
    readonly VITE_GEOCODING_API_KEY: string;
    readonly VITE_SUMMARIZER_ENDPOINT: string;
    readonly VITE_RESOURCES_ENDPOINT: string;
    readonly VITE_ANALYTICS_ID: string;
    readonly VITE_SENTRY_DSN: string;
    readonly VITE_VERSION: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  // Static asset imports
  declare module '*.svg' {
    const src: string;
    export default src;
  }
  
  declare module '*.png' {
    const src: string;
    export default src;
  }
  
  declare module '*.jpg' {
    const src: string;
    export default src;
  }
  
  declare module '*.jpeg' {
    const src: string;
    export default src;
  }
  
  declare module '*.gif' {
    const src: string;
    export default src;
  }
  
  declare module '*.webp' {
    const src: string;
    export default src;
  }
  
  declare module '*.ico' {
    const src: string;
    export default src;
  }
  
  // CSS modules (if you use them)
  declare module '*.module.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
  }
  
  declare module '*.module.scss' {
    const classes: { readonly [key: string]: string };
    export default classes;
  }
  
  // JSON imports
  declare module '*.json' {
    const value: any;
    export default value;
  }
  
  // Web Workers
  declare module '*?worker' {
    const workerConstructor: {
      new (): Worker;
    };
    export default workerConstructor;
  }
  
  declare module '*?worker&inline' {
    const workerConstructor: {
      new (): Worker;
    };
    export default workerConstructor;
  }
  
  // Service Worker
  declare module '*?sw' {
    const sw: string;
    export default sw;
  }
  
  // Raw imports
  declare module '*?raw' {
    const src: string;
    export default src;
  }
  
  declare module '*?url' {
    const src: string;
    export default src;
  }
  
  // Global type augmentations for your app
  declare global {
    interface Window {
      // Google Translate
      google?: {
        translate: {
          TranslateElement: new (options: any, element: string | HTMLElement) => void;
        };
      };
      googleTranslateElementInit?: () => void;
      
      // Speech Synthesis (for older browsers)
      speechSynthesis?: SpeechSynthesis;
      SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
      
      // App-specific globals
      includs?: {
        version: string;
        debug: boolean;
        [key: string]: any;
      };
      
      // Analytics (if you add it later)
      gtag?: (...args: any[]) => void;
      dataLayer?: any[];
    }
    
    // Custom events
    interface DocumentEventMap {
      'appReady': CustomEvent;
      'dataLoaded': CustomEvent;
      'languageChanged': CustomEvent<{ language: string }>;
      'themeChanged': CustomEvent<{ theme: string }>;
    }
  }
  
  // Ensure this file is treated as a module
  export {};