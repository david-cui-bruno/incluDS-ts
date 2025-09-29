import type { VoiceConfig } from '../types/domain.js';
import { APP_CONFIG } from '../lib/constants.js';

let cachedVoice: SpeechSynthesisVoice | null = null;
let currentSpeechElement: HTMLElement | null = null;
let isCurrentlySpeaking = false;

function getPreferredVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  
  // Log available voices for debugging
  console.log('🔊 Available voices:', voices.map(v => `${v.name} (${v.lang}) - ${v.gender || 'unknown gender'}`));
  
  for (const preferredName of APP_CONFIG.SPEECH.PREFERRED_VOICES) {
    const voice = voices.find(v => 
      (v.name || '').toLowerCase().includes(preferredName.toLowerCase())
    );
    if (voice) {
      console.log('✅ Selected voice:', voice.name, '(', voice.lang, ')');
      return voice;
    }
  }
  
  // Fallback: try to find any female voice
  const femaleVoice = voices.find(v => 
    v.name.toLowerCase().includes('female') || 
    v.name.toLowerCase().includes('woman') ||
    (v as any).gender === 'female'
  );
  
  if (femaleVoice) {
    console.log('✅ Found female fallback voice:', femaleVoice.name);
    return femaleVoice;
  }
  
  console.log('⚠️ Using default voice:', voices[0]?.name || 'none');
  return voices[0] || null;
}

export function speak(text: string, element?: HTMLElement): void {
  if (!text.trim()) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Get or cache the preferred voice
  cachedVoice = cachedVoice || getPreferredVoice();
  
  // Voice configuration for accessibility
  const config: VoiceConfig = {
    voice: cachedVoice,
    rate: 0.85,
    pitch: 1.0,
    volume: 1
  };
  
  utterance.rate = config.rate;
  utterance.pitch = config.pitch;
  utterance.voice = config.voice;
  utterance.lang = (cachedVoice && cachedVoice.lang) ? cachedVoice.lang : 'en-US';
  
  // Track speech state
  utterance.onstart = () => {
    isCurrentlySpeaking = true;
    currentSpeechElement = element || null;
    updateSpeechButtonState(element, true);
  };
  
  utterance.onend = () => {
    isCurrentlySpeaking = false;
    currentSpeechElement = null;
    updateSpeechButtonState(element, false);
  };
  
  utterance.onerror = () => {
    isCurrentlySpeaking = false;
    currentSpeechElement = null;
    updateSpeechButtonState(element, false);
  };
  
  // Cancel any ongoing speech and start new
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  speechSynthesis.cancel();
  isCurrentlySpeaking = false;
  updateSpeechButtonState(currentSpeechElement, false);
  currentSpeechElement = null;
}

function updateSpeechButtonState(element: HTMLElement | null, isPlaying: boolean): void {
  if (!element) return;
  
  // Update hover speech overlays
  const overlay = element.querySelector('.speech-overlay') as HTMLElement;
  if (overlay) {
    overlay.classList.toggle('playing', isPlaying);
  }
  
  // Update legacy read buttons  
  const readButton = element.querySelector('[data-read]') as HTMLElement;
  if (readButton) {
    readButton.classList.toggle('playing', isPlaying);
    // Change button text if it's a text-based button
    if (readButton.textContent?.includes('🔊')) {
      readButton.textContent = isPlaying ? '⏹️ Stop' : '🔊 Read';
    }
  }
}

function toggleSpeech(element: HTMLElement, text: string): void {
  // If this element is currently speaking, stop it
  if (currentSpeechElement === element && isCurrentlySpeaking) {
    stopSpeech();
    return;
  }
  
  // Otherwise, start speaking this element
  speak(text, element);
}

export function initReadButtons(root: HTMLElement | Document = document): void {
  // Legacy function - keeping for backward compatibility
  const readButtons = root.querySelectorAll('[data-read]') as NodeListOf<HTMLElement>;
  
  readButtons.forEach(btn => {
    // Prevent duplicate event listeners
    if ((btn as any)._speechWired) return;
    (btn as any)._speechWired = true;
    
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-card]') || btn.parentElement;
      if (card) {
        const text = card.textContent?.replace(/🔊.*$/, '').trim() || '';
        if (text) {
          toggleSpeech(card as HTMLElement, text);
        }
      }
    });
  });
}

export function initHoverSpeech(root: HTMLElement | Document = document): void {
  const speechElements = root.querySelectorAll('[data-speech]') as NodeListOf<HTMLElement>;
  
  speechElements.forEach(element => {
    // Prevent duplicate event listeners
    if ((element as any)._hoverSpeechWired) return;
    (element as any)._hoverSpeechWired = true;
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'speech-overlay';
    overlay.innerHTML = `
      <div class="speech-icon">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      </div>
    `;
    
    // Position overlay
    element.style.position = 'relative';
    element.appendChild(overlay);
    
    // Add event listeners
    element.addEventListener('mouseenter', () => {
      overlay.classList.add('visible');
    });
    
    element.addEventListener('mouseleave', () => {
      overlay.classList.remove('visible');
    });
    
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const text = extractTextForSpeech(element);
      if (text) {
        toggleSpeech(element, text);
      }
    });
  });
}

function extractTextForSpeech(element: HTMLElement): string {
  // Special handling for procedure cards with titles
  if (element.hasAttribute('data-speech-title')) {
    const title = element.getAttribute('data-speech-title');
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove buttons, overlays, toggle icons, and other non-content elements
    const elementsToRemove = clone.querySelectorAll('.btn, .speech-overlay, .card-actions, button, .procedure-toggle-icon');
    elementsToRemove.forEach(el => el.remove());
    
    const content = clone.textContent?.trim() || '';
    return title ? `${title}. ${content}` : content;
  }
  
  // Default behavior for other elements
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Remove buttons, overlays, and other non-content elements
  const elementsToRemove = clone.querySelectorAll('.btn, .speech-overlay, .card-actions, button, .procedure-toggle-icon');
  elementsToRemove.forEach(el => el.remove());
  
  // Get clean text content
  return clone.textContent?.trim() || '';
}

export function initSpeechSynthesis(): void {
  // Update cached voice when voices change
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = getPreferredVoice();
  };
  
  // Initial voice loading
  cachedVoice = getPreferredVoice();
}

// Get available voices for debugging
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return speechSynthesis.getVoices();
}

// Check if speech synthesis is supported
export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window;
}

// Expose speak function globally for backward compatibility
declare global {
  interface Window {
    speak: (text: string) => void;
  }
}

// Set global speak function
window.speak = speak;