import type { Study } from '../types/domain.js';
import { byId } from '../lib/utils.js';
// import { initReadButtons } from './navigation.js';
import { initHoverSpeech } from './speech.js';
import { getStudies } from '../services/data.js';

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let currentSearchQuery = '';
let currentYearFilters: string[] = [];

export function renderStudies(): void {
  const container = byId('studies-list');
  if (!container) {
    console.warn('Studies container not found');
    return;
  }

  const studies = getStudies();
  
  if (!studies.length) {
    container.innerHTML = '<p class="no-data">No studies data available.</p>';
    return;
  }

  renderStudiesList(studies);
  initStudiesSearch();
  initStudiesFilter();
}

function renderStudiesList(studies: Study[]): void {
  const container = byId('studies-list');
  if (!container) return;

  container.innerHTML = studies.map(study => `
    <div class="card study-card">
      <div class="card-header">
        <h3>${escapeHtml(study.name)}</h3>
        <div class="study-meta">
          <span class="study-year">${study.year}</span>
          <span class="study-org">${escapeHtml(study.org)}</span>
        </div>
      </div>
      
      <div class="card-body">
        <div class="study-content" data-speech data-speech-title="${escapeHtml(study.name)}">
          <p class="study-summary">${escapeHtml(study.summary)}</p>
        </div>
        
        <div class="card-actions">
          <a href="${escapeHtml(study.url)}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="btn btn-primary"
             aria-label="Learn more about ${escapeHtml(study.name)}">
            Learn More
            <span class="external-icon" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>
  `).join('');

  // Initialize speech features for the new content
  initHoverSpeech(container);
}

function initStudiesSearch(): void {
  const searchInput = byId('studies-search') as HTMLInputElement;
  const searchForm = searchInput?.closest('form');
  
  if (!searchInput) return;

  // Handle search input with debouncing
  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    currentSearchQuery = query;
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search
    searchTimeout = setTimeout(() => {
      performStudiesFilter();
    }, 300);
  });

  // Handle form submission
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      currentSearchQuery = searchInput.value.trim();
      performStudiesFilter();
    });
  }

  // Handle escape key to clear search
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      currentSearchQuery = '';
      performStudiesFilter();
    }
  });
}

function initStudiesFilter(): void {
  const filterBtn = byId('studies-filter-btn');
  const filterMenu = byId('studies-filter-menu');
  const checkboxes = filterMenu?.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
  
  if (!filterBtn || !filterMenu) return;

  // Toggle dropdown
  filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = filterMenu.classList.contains('open');
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
      updateStudiesFilters();
      performStudiesFilter();
    });
  });
}

function updateStudiesFilters(): void {
  const checkboxes = document.querySelectorAll('#studies-filter-menu input[type="checkbox"]:checked') as NodeListOf<HTMLInputElement>;
  currentYearFilters = Array.from(checkboxes).map(cb => cb.value);
  
  // Update filter count badge
  const filterCount = byId('studies-filter-count');
  if (filterCount) {
    if (currentYearFilters.length > 0) {
      filterCount.textContent = currentYearFilters.length.toString();
      filterCount.style.display = 'inline';
    } else {
      filterCount.style.display = 'none';
    }
  }
}

function performStudiesFilter(): void {
  let results = getStudies();
  
  // Apply year filters
  if (currentYearFilters.length > 0) {
    results = filterStudiesByYear(results, currentYearFilters);
  }
  
  // Apply search filter
  if (currentSearchQuery) {
    results = filterStudiesBySearch(results, currentSearchQuery);
  }
  
  renderStudiesList(results);
  
  // Show filter feedback
  const container = byId('studies-list');
  if (container && (currentSearchQuery || currentYearFilters.length > 0)) {
    const resultCount = results.length;
    const filters = [];
    if (currentSearchQuery) filters.push(`search: "${currentSearchQuery}"`);
    if (currentYearFilters.length > 0) filters.push(`years: ${currentYearFilters.map(getYearFilterLabel).join(', ')}`);
    
    const feedback = document.createElement('div');
    feedback.className = 'search-feedback';
    feedback.innerHTML = `
      <p>${resultCount} result${resultCount !== 1 ? 's' : ''} found (${filters.join('; ')})</p>
    `;
    container.insertBefore(feedback, container.firstChild);
  }
}

function filterStudiesByYear(studies: Study[], yearFilters: string[]): Study[] {
  return studies.filter(study => {
    return yearFilters.some(filter => {
      switch (filter) {
        case '2020s':
          return study.year >= 2020;
        case '2010s':
          return study.year >= 2010 && study.year < 2020;
        case '2000s':
          return study.year >= 2000 && study.year < 2010;
        default:
          return false;
      }
    });
  });
}

function getYearFilterLabel(yearFilter: string): string {
  switch (yearFilter) {
    case '2020s': return '2020s';
    case '2010s': return '2010s';
    case '2000s': return '2000s';
    default: return yearFilter;
  }
}

function filterStudiesBySearch(studies: Study[], query: string): Study[] {
  if (!query.trim()) {
    return studies;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return studies.filter(study => 
    study.name.toLowerCase().includes(searchTerm) ||
    study.org.toLowerCase().includes(searchTerm) ||
    study.summary.toLowerCase().includes(searchTerm) ||
    study.year.toString().includes(searchTerm)
  );
}

// Export function for compatibility with search module
export function searchStudies(query: string): Study[] {
  return filterStudiesBySearch(getStudies(), query);
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}