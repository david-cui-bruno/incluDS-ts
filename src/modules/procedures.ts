import type { Procedure } from '../types/domain.js';
import { byId } from '../lib/utils.js';
import { initHoverSpeech } from './speech.js';
import { getProcedures } from '../services/data.js';

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let currentSearchQuery = '';
let currentBodyFilters: string[] = [];
let isShowingResults = false;

export function renderProcedures(): void {
  // Always show landing page when navigating to procedures
  resetToLandingPage();
  
  // Initialize the search interface
  initProceduresSearchInterface();
}

function initProceduresSearchInterface(): void {
  // Set up event listeners for both landing and results search forms
  initSearchForm('procedures-search-input', 'procedures-search-form');
  initSearchForm('procedures-search-input-results', 'procedures-search-form-compact');
  
  // Set up filter dropdowns
  initProceduresFilter('procedures-filter-btn', 'procedures-filter-menu');
  initProceduresFilter('procedures-filter-btn-results', 'procedures-filter-menu-results');
  
  // Show landing page by default
  showLandingPage();
}

function initSearchForm(inputId: string, formClass: string): void {
  const searchInput = byId(inputId) as HTMLInputElement;
  const searchForm = searchInput?.closest(`.${formClass}`) as HTMLFormElement;
  
  if (!searchInput || !searchForm) return;

  // Handle search input with debouncing
  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    currentSearchQuery = query;
    
    // Sync the other search input
    syncSearchInputs(query, inputId);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search
    searchTimeout = setTimeout(() => {
      if (query) {
        performSearch();
      }
    }, 300);
  });

  // Handle form submission
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    currentSearchQuery = searchInput.value.trim();
    
    if (currentSearchQuery) {
      performSearch();
    }
  });

  // Handle escape key to clear search
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  });
}

function syncSearchInputs(query: string, excludeId: string): void {
  const inputs = ['procedures-search-input', 'procedures-search-input-results'];
  inputs.forEach(id => {
    if (id !== excludeId) {
      const input = byId(id) as HTMLInputElement;
      if (input) {
        input.value = query;
      }
    }
  });
}

function initProceduresFilter(buttonId: string, menuId: string): void {
  const filterBtn = byId(buttonId);
  const filterMenu = byId(menuId);
  const checkboxes = filterMenu?.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
  
  if (!filterBtn || !filterMenu) return;

  // Toggle dropdown
  filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = filterMenu.classList.contains('open');
    
    // Close any other open filter menus
    document.querySelectorAll('.filter-dropdown-menu').forEach(menu => {
      if (menu !== filterMenu) {
        menu.classList.remove('open');
      }
    });
    
    filterMenu.classList.toggle('open');
    filterBtn.setAttribute('aria-expanded', (!isOpen).toString());
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterBtn.contains(e.target as Node) && !filterMenu.contains(e.target as Node)) {
      filterMenu.classList.remove('open');
      filterBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle checkbox changes
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateFilters();
      syncFilterStates();
      if (isShowingResults) {
        performSearch();
      }
    });
  });
}

function syncFilterStates(): void {
  const menus = ['procedures-filter-menu', 'procedures-filter-menu-results'];
  
  menus.forEach(menuId => {
    const menu = byId(menuId);
    if (!menu) return;
    
    const checkboxes = menu.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach(checkbox => {
      checkbox.checked = currentBodyFilters.includes(checkbox.value);
    });
  });
}

function updateFilters(): void {
  const activeMenu = document.querySelector('.filter-dropdown-menu.open');
  if (!activeMenu) return;
  
  const checkboxes = activeMenu.querySelectorAll('input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
  currentBodyFilters = Array.from(checkboxes).map(cb => cb.value);
  
  // Update filter count badges
  const filterCounts = ['procedures-filter-count'];
  filterCounts.forEach(countId => {
    const filterCount = byId(countId);
    if (filterCount) {
      if (currentBodyFilters.length > 0) {
        filterCount.textContent = currentBodyFilters.length.toString();
        filterCount.style.display = 'inline';
      } else {
        filterCount.style.display = 'none';
      }
    }
  });
}

function performSearch(): void {
  let results = getProcedures();
  
  // Apply body system filters
  if (currentBodyFilters.length > 0) {
    results = filterProceduresByBodySystem(results, currentBodyFilters);
  }
  
  // Apply search filter
  if (currentSearchQuery) {
    results = searchProceduresFiltered(results, currentSearchQuery);
  }
  
  // Show results page
  showResultsPage(results);
}

function resetToLandingPage(): void {
  const landing = byId('procedures-landing');
  const results = byId('procedures-results');
  
  if (landing && results) {
    // Reset state immediately (no animation needed for navigation)
    results.style.display = 'none';
    results.classList.remove('fade-in');
    
    landing.style.display = 'flex';
    landing.classList.remove('fade-out');
    
    isShowingResults = false;
    
    // Clear search state
    currentSearchQuery = '';
    currentBodyFilters = [];
    
    // Clear all search inputs
    const searchInputs = ['procedures-search-input', 'procedures-search-input-results'];
    searchInputs.forEach(id => {
      const input = byId(id) as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    });
    
    // Clear all filter checkboxes
    const filterMenus = ['procedures-filter-menu', 'procedures-filter-menu-results'];
    filterMenus.forEach(menuId => {
      const menu = byId(menuId);
      if (menu) {
        const checkboxes = menu.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
        checkboxes.forEach(checkbox => {
          checkbox.checked = false;
        });
      }
    });
    
    // Update filter counts
    updateFilters();
  }
}

function showLandingPage(): void {
  const landing = byId('procedures-landing');
  const results = byId('procedures-results');
  
  if (landing && results) {
    // Fade out results first
    results.classList.remove('fade-in');
    
    setTimeout(() => {
      results.style.display = 'none';
      landing.style.display = 'flex';
      landing.classList.remove('fade-out');
      isShowingResults = false;
    }, 200);
  }
}

function showResultsPage(procedures: Procedure[]): void {
  const landing = byId('procedures-landing');
  const results = byId('procedures-results');
  const resultsList = byId('procedures-list');
  const resultsCount = byId('procedures-results-count');
  
  if (!landing || !results || !resultsList) return;
  
  // Animate transition from landing to results
  if (!isShowingResults) {
    // Fade out landing page
    landing.classList.add('fade-out');
    
    setTimeout(() => {
      landing.style.display = 'none';
      results.style.display = 'block';
      
      // Trigger fade in animation
      setTimeout(() => {
        results.classList.add('fade-in');
      }, 50);
      
      isShowingResults = true;
    }, 400);
  } else {
    // Already showing results, just update content
    results.classList.add('fade-in');
  }
  
  // Update results count
  if (resultsCount) {
    const count = procedures.length;
    resultsCount.textContent = `${count} procedure${count !== 1 ? 's' : ''} found`;
  }
  
  // Render procedures as rows
  renderProceduresRows(procedures, resultsList);
}

function renderProceduresRows(procedures: Procedure[], container: HTMLElement): void {
  // Show loading state first
  container.innerHTML = `
    <div class="procedures-loading">
      <div class="loading-spinner"></div>
      <span>Loading procedures...</span>
    </div>
  `;
  
  // Simulate brief loading for smooth animation
  setTimeout(() => {
    if (procedures.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <p>No procedures found matching your search criteria.</p>
          <button onclick="clearSearch()" class="btn btn-secondary">Clear search</button>
        </div>
      `;
      return;
    }
    
    const createRowHTML = (procedure: Procedure) => `
      <div class="procedure-row" data-procedure-id="${procedure.key}" data-speech data-speech-title="${escapeHtml(procedure.title)}">
        <div class="procedure-row-header">
          <h3 class="procedure-row-title">${escapeHtml(procedure.title)}</h3>
        </div>
        
        <div class="procedure-row-content">
          <div class="procedure-section">
            <h4>What is it?</h4>
            <p>${escapeHtml(procedure.what)}</p>
          </div>
          
          <div class="procedure-section">
            <h4>How does it work?</h4>
            <p>${escapeHtml(procedure.how)}</p>
          </div>
          
          <div class="procedure-section">
            <h4>What will it feel like?</h4>
            <p>${escapeHtml(procedure.feel)}</p>
          </div>
          
          <div class="procedure-section">
            <h4>What happens after?</h4>
            <p>${escapeHtml(procedure.after)}</p>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = procedures.map(createRowHTML).join('');

    // Initialize speech features for the new content
    initHoverSpeech(container);
  }, 300);
}

function clearSearch(): void {
  currentSearchQuery = '';
  currentBodyFilters = [];
  
  // Clear all search inputs
  const searchInputs = ['procedures-search-input', 'procedures-search-input-results'];
  searchInputs.forEach(id => {
    const input = byId(id) as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  });
  
  // Clear all filter checkboxes
  const filterMenus = ['procedures-filter-menu', 'procedures-filter-menu-results'];
  filterMenus.forEach(menuId => {
    const menu = byId(menuId);
    if (menu) {
      const checkboxes = menu.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
    }
  });
  
  // Update filter counts
  updateFilters();
  
  // Show landing page
  showLandingPage();
}

// Make clearSearch available globally for the no-results button
(window as any).clearSearch = clearSearch;

function filterProceduresByBodySystem(procedures: Procedure[], bodyFilters: string[]): Procedure[] {
  const bodySystemMap: Record<string, string[]> = {
    brain: ['eeg', 'mri', 'lumbar-puncture', 'cog-testing', 'balance-vest'],
    heart: ['ecg', 'echo', 'treadmill'],
    blood: ['blood-draw', 'dbs-card'],
    imaging: ['mri', 'ct-scan', 'xray-chest', 'ultrasound-abd'],
    physical: ['hearing', 'eye-exam', 'dental', 'sleep-study', 'spirometry', 'pt-eval', 'ot-eval', 'speech-eval'],
    therapy: ['pt-eval', 'ot-eval', 'speech-eval', 'cog-testing'],
    other: ['saliva-swab', 'urine-test', 'stool-sample', 'vaccine', 'allergy-skin', 'iv-place', 'med-trial-visit', 'interview', 'wearable']
  };

  return procedures.filter(procedure => {
    return bodyFilters.some(filter => {
      const systemKeys = bodySystemMap[filter];
      return systemKeys && systemKeys.includes(procedure.key);
    });
  });
}

function searchProceduresFiltered(procedures: Procedure[], query: string): Procedure[] {
  if (!query.trim()) {
    return procedures;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return procedures.filter(procedure => 
    procedure.title.toLowerCase().includes(searchTerm) ||
    procedure.what.toLowerCase().includes(searchTerm) ||
    procedure.how.toLowerCase().includes(searchTerm) ||
    procedure.feel.toLowerCase().includes(searchTerm) ||
    procedure.after.toLowerCase().includes(searchTerm)
  );
}

// Keep the original export for compatibility
export function searchProcedures(query: string): Procedure[] {
  return searchProceduresFiltered(getProcedures(), query);
}

export function getProcedureByKey(key: string): Procedure | undefined {
  const procedures = getProcedures();
  return procedures.find(procedure => procedure.key === key);
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}