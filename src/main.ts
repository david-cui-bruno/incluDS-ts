import './styles/main.css';
import { loadData } from './services/data.js';
import { initNavigation, navigate } from './modules/navigation.js';
import { initSpeechSynthesis, initHoverSpeech } from './modules/speech.js';
import { initLanguageSelector } from './modules/translation.js';
import { renderStudies } from './modules/studies.js';
import { renderProcedures } from './modules/procedures.js';
import { renderResources } from './modules/resources.js';
import { initSiteSearch } from './modules/search.js';
import { initSummarizer } from './modules/summarizer.js';
import { initSlideshow } from './modules/slideshow.js';
import { byId } from './lib/utils.js';
import { initReadButtons } from './modules/navigation.js';

// Global state
let isAppInitialized = false;

// Initialize the application
async function initializeApp(): Promise<void> {
  try {
    // Initialize core modules
    initNavigation();
    initSpeechSynthesis();
    initLanguageSelector();
    initSiteSearch();
    initSummarizer();
    initSlideshow();
    
    // Load configuration and data
    await loadData();
    
    // Render initial content
    renderStudies();
    renderProcedures();
    renderResources(null); // Start without location
    
    // Initialize speech features for existing content
    initReadButtons(document); // Legacy read buttons
    initHoverSpeech(document); // New hover speech overlays
    
    // Set up initial navigation
    const initialPage = (location.hash || '#home').slice(1);
    navigate(initialPage);
    
    // Update footer year
    const yearElement = byId('year');
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear().toString();
    }
    
    // Hide loading screen
    const loadingScreen = byId('app-loading');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    
    // Mark app as initialized
    isAppInitialized = true;
    document.dispatchEvent(new CustomEvent('appReady'));
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    displayInitializationError(error as Error);
  }
}

// Display error if app fails to initialize
function displayInitializationError(error: Error): void {
  const app = byId('app');
  if (app) {
    app.innerHTML = `
      <div class="error-container">
        <div class="error-content">
          <h1>🚫 Unable to Load incluDS</h1>
          <p>We're sorry, but the application failed to initialize properly.</p>
          <details>
            <summary>Technical Details</summary>
            <pre>${error.message}</pre>
          </details>
          <div class="error-actions">
            <button onclick="location.reload()" class="btn btn-primary">
              🔄 Try Again
            </button>
            <a href="mailto:support@includs.org" class="btn btn-secondary">
              📧 Contact Support
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

// Service Worker registration - only for HTTPS
async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }
}

// Check for updates
function checkForUpdates(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showUpdateNotification();
    });
  }
}

// Show update notification
function showUpdateNotification(): void {
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; background: var(--brand); color: white; padding: 16px; border-radius: 8px; box-shadow: var(--shadow-lg); z-index: 10000;">
      <p style="margin: 0 0 8px 0; font-weight: 600;">🎉 Update Available!</p>
      <p style="margin: 0 0 12px 0; font-size: 14px;">A new version of incluDS is ready.</p>
      <button onclick="location.reload()" style="background: white; color: var(--brand); border: none; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;">
        Update Now
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
}

// Handle app lifecycle events
function setupAppLifecycle(): void {
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && isAppInitialized) {
      // App became visible again, refresh data if needed
    }
  });
  
  // Handle online/offline events
  window.addEventListener('online', () => {
    showConnectionStatus('online');
  });
  
  window.addEventListener('offline', () => {
    showConnectionStatus('offline');
  });
  
  // Handle errors globally
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

function showConnectionStatus(status: 'online' | 'offline'): void {
  const statusEl = document.createElement('div');
  statusEl.textContent = status === 'online' ? '🟢 Back online' : '🔴 Offline';
  statusEl.style.cssText = `
    position: fixed; top: 20px; left: 20px; background: ${status === 'online' ? '#10b981' : '#ef4444'}; 
    color: white; padding: 8px 16px; border-radius: 6px; z-index: 9999; font-size: 14px;
  `;
  document.body.appendChild(statusEl);
  setTimeout(() => statusEl.remove(), 3000);
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  setupAppLifecycle();
  registerServiceWorker();
  checkForUpdates();
  initializeApp();
});