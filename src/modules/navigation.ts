import type { PageId } from '../types/domain.js';

const pages: PageId[] = ['home', 'studies', 'summarizer', 'resources', 'procedures'];

// Utility functions
function getElementById(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function initReadButtons(root: HTMLElement | Document = document): void {
  const readButtons = root.querySelectorAll('[data-read]') as NodeListOf<HTMLElement>;
  
  readButtons.forEach(btn => {
    if ((btn as any)._wired) return;
    (btn as any)._wired = true;
    
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-card]') || btn.parentElement;
      if (card) {
        const text = card.textContent?.replace(/🔊.*$/, '').trim() || '';
        if (text) {
          // We'll call speak function when speech module is ready
          if (window.speak) {
            window.speak(text);
          }
        }
      }
    });
  });
}

export function navigate(id: string): void {
  // Fallback to home if unknown page
  console.log('🧭 Navigate called with id:', id);
  console.log('🗂️ Available pages:', pages);
  console.log('✅ Page exists in list:', pages.includes(id as PageId));
  
  const target = pages.includes(id as PageId) ? (id as PageId) : 'home';
  
  console.log('🎯 Final target page:', target);
  console.log('🔄 Starting navigation to:', target);
  
  // Show/hide sections using CSS classes
  pages.forEach(p => {
    const sec = getElementById(p);
    if (sec) {
      if (p === target) {
        console.log(`✅ Activating page: ${p}`);
        sec.classList.add('active');
      } else {
        console.log(`❌ Deactivating page: ${p}`);
        sec.classList.remove('active');
      }
    } else {
      console.warn(`⚠️ Page element not found: ${p}`);
    }
    
    // Update navigation link active states (if they have IDs)
    const link = getElementById(`link-${p}`);
    if (link) {
      link.classList.toggle('active', p === target);
      if (p === target) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  });

  // Update browser history
  if (location.hash.slice(1) !== target) {
    history.replaceState({ page: target }, '', `#${target}`);
  }
  
  // Initialize read buttons for the current page
  const targetElement = getElementById(target);
  if (targetElement) {
    initReadButtons(targetElement);
  }

  // Initialize page-specific functionality
  if (target === 'resources') {
    // Import and initialize resources
    import('./resources.js').then(module => {
      module.initResourcesPage();
    });
  } else if (target === 'procedures') {
    // Import and initialize procedures
    import('./procedures.js').then(module => {
      module.renderProcedures();
    });
  }
}

export function initNavigation(): void {
  // Handle navigation clicks
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href^="#"]') as HTMLAnchorElement;
    if (!link) return;
    
    e.preventDefault();
    const href = link.getAttribute('href');
    if (href) {
      navigate(href.slice(1));
    }
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    navigate((location.hash || '#home').slice(1));
  });
  
  window.addEventListener('hashchange', () => {
    navigate((location.hash || '#home').slice(1));
  });
}

export function getCurrentPage(): PageId {
  const hash = location.hash.slice(1);
  return pages.includes(hash as PageId) ? (hash as PageId) : 'home';
}

export function getPages(): readonly PageId[] {
  return pages;
}

// Expose initReadButtons for other modules
export { initReadButtons };

// Global type declaration for speech function
declare global {
  interface Window {
    speak: (text: string) => void;
  }
}