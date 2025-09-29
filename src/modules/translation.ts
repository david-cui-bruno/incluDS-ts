import type { LanguageCode, LanguageOption } from '../types/domain.js';
import { byId, $$, setCookie, clearCookie, normalizeLang, delay } from '../lib/utils.js';
import { SUPPORTED_LANGUAGES } from '../lib/constants.js';

let isInitialized = false;

export function initLanguageSelector(): void {
  if (isInitialized) return;
  
  const langBtn = byId('langBtn');
  const langDropdown = byId('langDropdown');
  
  if (!langBtn || !langDropdown) {
    console.error('Language selector elements not found!');
    return;
  }

  // Toggle dropdown
  langBtn.addEventListener('click', (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Globe button clicked, toggling dropdown');
    langDropdown.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    if (!langBtn.contains(target) && !langDropdown.contains(target)) {
      langDropdown.classList.remove('open');
    }
  });

  // Handle language selection
  const langOptions = $$('.lang-option', langDropdown);
  langOptions.forEach(option => {
    option.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      const langCode = option.dataset.lang as LanguageCode;
      if (!langCode) return;
      
      console.log('Language selected:', langCode);
      
      // Close dropdown
      langDropdown.classList.remove('open');
      
      // Update button to show selected language
      const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
      if (selectedLang) {
        langBtn.innerHTML = `<span style="font-size: 16px;">${selectedLang.flag}</span>`;
      }
      
      // Translate page
      try {
        await translatePage(langCode);
      } catch (error) {
        console.error('Translation failed:', error);
        // Restore original button state
        langBtn.innerHTML = `
          <svg class="globe-icon notranslate" viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        `;
        alert('Translation failed. Please try again.');
      }
    });
  });

  isInitialized = true;
}

async function translatePage(langCode: LanguageCode): Promise<void> {
  try {
    // Wait for Google Translate to be ready
    await waitForGoogleTranslate();
    
    const widgetSelect = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    
    if (widgetSelect) {
      console.log('Using Google Translate widget');
      
      if (langCode === 'en') {
        // Reset to English
        clearCookie('googtrans');
        clearCookie('googtransopt');
        widgetSelect.value = '';
        widgetSelect.dispatchEvent(new Event('change'));
      } else {
        // Set language
        const normalizedCode = normalizeLang(langCode);
        widgetSelect.value = normalizedCode;
        widgetSelect.dispatchEvent(new Event('change'));
      }
    } else {
      console.log('Using cookie fallback');
      // Fallback: use cookies
      clearCookie('googtrans');
      clearCookie('googtransopt');
      
      const normalizedCode = normalizeLang(langCode);
      const cookieValue = (normalizedCode === 'en') ? '/en/en' : `/en/${normalizedCode}`;
      
      // Set cookies with different domain variants
      const host = location.hostname;
      const rootDomain = '.' + host.split('.').slice(-2).join('.');
      
      setCookie('googtrans', cookieValue, { domain: host, maxAge: 60 * 60 * 24 });
      setCookie('googtrans', cookieValue, { domain: rootDomain, maxAge: 60 * 60 * 24 });
      setCookie('googtrans', cookieValue, { maxAge: 60 * 60 * 24 });
      
      // Reload page to apply translation
      await delay(100);
      location.reload();
    }
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

function waitForGoogleTranslate(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if Google Translate is already available
    if (window.google?.translate) {
      resolve(true);
      return;
    }
    
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (window.google?.translate) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.warn('Google Translate not ready after 5 seconds');
        resolve(false); // Continue anyway
      }
    }, 100);
  });
}

// Reset to English function for backward compatibility
export function toEnglish(): void {
  translatePage('en').catch(error => {
    console.error('Failed to reset to English:', error);
    // Force reload as fallback
    clearCookie('googtrans');
    clearCookie('googtransopt');
    location.reload();
  });
}

// Get available languages
export function getAvailableLanguages(): readonly LanguageOption[] {
  return SUPPORTED_LANGUAGES;
}

// Get current language from cookies or default to English
export function getCurrentLanguage(): LanguageCode {
  const googtrans = document.cookie
    .split('; ')
    .find(row => row.startsWith('googtrans='))
    ?.split('=')[1];
    
  if (googtrans && googtrans.includes('/')) {
    const langCode = googtrans.split('/')[2];
    const found = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    return found ? found.code : 'en';
  }
  
  return 'en';
}

// Check if translation is active
export function isTranslationActive(): boolean {
  return getCurrentLanguage() !== 'en';
}

// Global type declarations for Google Translate
declare global {
  interface Window {
    google?: {
      translate?: any;
    };
    googleTranslateElementInit?: () => void;
  }
}