import type { SearchResult } from '../types/domain.js';
import { byId } from '../lib/utils.js';
import { searchStudies } from './studies.js';
import { searchProcedures } from './procedures.js';

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

export function initSiteSearch(): void {
  const searchInput = byId('site-search') as HTMLInputElement;
  const searchResults = byId('search-results');
  
  if (!searchInput || !searchResults) {
    console.warn('Search elements not found');
    return;
  }

  // Handle search input with debouncing
  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.trim();
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search
    searchTimeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        clearSearchResults();
      }
    }, 300);
  });

  // Handle search form submission
  const searchForm = searchInput.closest('form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query.length >= 2) {
        performSearch(query);
      }
    });
  }

  // Handle escape key to clear search
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      clearSearchResults();
      searchInput.blur();
    }
  });
}

function performSearch(query: string): void {
  const searchResults = byId('search-results');
  if (!searchResults) return;

  // Show loading state
  searchResults.style.display = 'block';
  searchResults.innerHTML = `
    <div class="search-loading">
      <p>🔍 Searching...</p>
    </div>
  `;

  // Perform search across all content types
  const results = searchAll(query);
  
  // Display results
  displaySearchResults(query, results);
}

function searchAll(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  
  // Search studies
  const studyResults = searchStudies(query);
  studyResults.forEach(study => {
    results.push({
      type: 'study',
      title: study.name,
      content: study.summary,
      url: `#studies`,
      relevance: calculateRelevance(query, study.name + ' ' + study.summary)
    });
  });
  
  // Search procedures
  const procedureResults = searchProcedures(query);
  procedureResults.forEach(procedure => {
    const searchText = `${procedure.title} ${procedure.what} ${procedure.how}`;
    results.push({
      type: 'procedure',
      title: procedure.title,
      content: procedure.what,
      url: `#procedures`,
      relevance: calculateRelevance(query, searchText)
    });
  });
  
  // Search static content (home page content)
  const homeResults = searchStaticContent(query);
  results.push(...homeResults);
  
  // Sort by relevance
  return results.sort((a, b) => b.relevance - a.relevance);
}

function searchStaticContent(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  
  // Search home page content
  const homeContent = [
    {
      title: 'About Down Syndrome',
      content: 'Down syndrome is a genetic condition caused by an extra copy of chromosome 21. People with Down syndrome can live full, independent lives with proper support.',
      keywords: 'down syndrome chromosome genetic condition support independence'
    },
    {
      title: 'Types of Down Syndrome',
      content: 'There are three types: Trisomy 21, Translocation, and Mosaic. Each type has different characteristics.',
      keywords: 'trisomy translocation mosaic types'
    },
    {
      title: 'Research and Studies',
      content: 'Current research focuses on health, development, and quality of life improvements for people with Down syndrome.',
      keywords: 'research studies health development quality life'
    }
  ];
  
  homeContent.forEach(item => {
    const searchText = `${item.title} ${item.content} ${item.keywords}`;
    if (searchText.toLowerCase().includes(queryLower)) {
      results.push({
        type: 'page',
        title: item.title,
        content: item.content,
        url: '#home',
        relevance: calculateRelevance(query, searchText)
      });
    }
  });
  
  return results;
}

function calculateRelevance(query: string, text: string): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  let score = 0;
  
  // Exact phrase match gets highest score
  if (textLower.includes(queryLower)) {
    score += 100;
  }
  
  // Individual word matches
  const queryWords = queryLower.split(/\s+/);
  queryWords.forEach(word => {
    if (word.length >= 2 && textLower.includes(word)) {
      score += 10;
    }
  });
  
  // Title matches get bonus points
  if (text.split(' ').slice(0, 10).join(' ').toLowerCase().includes(queryLower)) {
    score += 50;
  }
  
  return score;
}

function displaySearchResults(query: string, results: SearchResult[]): void {
  const searchResults = byId('search-results');
  if (!searchResults) return;
  
  if (results.length === 0) {
    searchResults.innerHTML = `
      <div class="search-no-results">
        <h3>No results found</h3>
        <p>No results found for "${escapeHtml(query)}". Try different keywords or browse our sections directly.</p>
      </div>
    `;
    return;
  }
  
  searchResults.innerHTML = `
    <div class="search-results-header">
      <h3>Search Results</h3>
      <p>${results.length} result${results.length !== 1 ? 's' : ''} for "${escapeHtml(query)}"</p>
      <button type="button" class="btn btn-secondary btn-sm" onclick="clearSearchResults()">
        ✕ Clear
      </button>
    </div>
    
    <div class="search-results-list">
      ${results.map(result => `
        <div class="search-result-item">
          <div class="search-result-header">
            <h4>
              <a href="${result.url}" class="search-result-link">
                ${escapeHtml(result.title)}
              </a>
            </h4>
            <span class="search-result-type">${getTypeLabel(result.type)}</span>
          </div>
          <p class="search-result-content">
            ${highlightQuery(escapeHtml(result.content), query)}
          </p>
        </div>
      `).join('')}
    </div>
  `;
}

function clearSearchResults(): void {
  const searchResults = byId('search-results');
  const searchInput = byId('site-search') as HTMLInputElement;
  
  if (searchResults) {
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';
  }
  
  if (searchInput) {
    searchInput.value = '';
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'study': return 'Research Study';
    case 'procedure': return 'Medical Procedure';
    case 'page': return 'Information';
    default: return 'Content';
  }
}

function highlightQuery(text: string, query: string): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make clearSearchResults globally available
(window as any).clearSearchResults = clearSearchResults;