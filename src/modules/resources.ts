import type { Resource, Location } from '../types/domain.js';
import { byId } from '../lib/utils.js';
import { initReadButtons } from './navigation.js';
import { GoogleMapsService } from '../services/googleMaps.js';
import { ResourceAggregator } from '../services/resourceAggregator.js';
import type { SearchFilters, AggregatedResult } from '../services/resourceAggregator.js';

let userLocation: Location | null = null;
let currentResults: AggregatedResult[] = [];

export function renderResources(location: Location | null): void {
  const container = byId('resources-list');
  if (!container) {
    console.warn('Resources container not found');
    return;
  }

  if (!location) {
    container.innerHTML = `
      <div class="location-prompt">
        <h3>Find Resources Near You</h3>
        <p>Allow location access to find local Down syndrome resources and support groups.</p>
        <button type="button" class="btn btn-primary" onclick="requestLocation()">
          📍 Share My Location
        </button>
        <p class="privacy-note">Your location is only used to find nearby resources and is not stored.</p>
      </div>
    `;
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="loading-state">
      <p>🔍 Finding resources near you...</p>
    </div>
  `;

  // Fetch resources (this would typically be an API call)
  fetchResources(location).then(resources => {
    if (!resources.length) {
      container.innerHTML = `
        <div class="no-resources">
          <h3>No resources found nearby</h3>
          <p>Try expanding your search radius or check back later as we add more resources.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="resources-header">
        <h3>Resources near ${location.city || 'your location'}</h3>
        <p class="resources-count">${resources.length} resource${resources.length !== 1 ? 's' : ''} found</p>
      </div>
      
      <div class="resources-grid">
        ${resources.map(resource => `
          <div class="card resource-card" data-read="${resource.name}">
            <div class="card-header">
              <h4>${escapeHtml(resource.name)}</h4>
              <span class="resource-type">${escapeHtml(resource.type)}</span>
            </div>
            
            <div class="card-body">
              <p class="resource-description">${escapeHtml(resource.description || '')}</p>
              
              ${resource.address ? `
                <div class="resource-address">
                  <strong>Address:</strong> ${escapeHtml(resource.address)}
                </div>
              ` : ''}
              
              ${resource.phone ? `
                <div class="resource-contact">
                  <strong>Phone:</strong> 
                  <a href="tel:${resource.phone}">${escapeHtml(resource.phone)}</a>
                </div>
              ` : ''}
              
              ${resource.website ? `
                <div class="resource-website">
                  <a href="${escapeHtml(resource.website)}" 
                     target="_blank" 
                     rel="noopener noreferrer"
                     class="btn btn-primary">
                    Visit Website ↗
                  </a>
                </div>
              ` : ''}
              
              <div class="resource-distance">
                <span class="distance">${calculateDistance(location, resource).toFixed(1)} miles away</span>
              </div>
              
              <button type="button" 
                      class="btn btn-secondary btn-read" 
                      data-read="${escapeHtml(resource.name)}"
                      aria-label="Read ${escapeHtml(resource.name)} information aloud">
                🔊 Read
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Initialize read buttons for the new content
    initReadButtons(container);
  }).catch(error => {
    console.error('Error fetching resources:', error);
    container.innerHTML = `
      <div class="error-state">
        <h3>Unable to load resources</h3>
        <p>Please try again later or check your internet connection.</p>
        <button type="button" class="btn btn-primary" onclick="renderResources(userLocation)">
          Try Again
        </button>
      </div>
    `;
  });
}

export async function requestLocation(): Promise<void> {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.');
    return;
  }

  try {
    const position = await getCurrentPosition();
    userLocation = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      city: '', // Would be filled by reverse geocoding
      state: '',
      country: ''
    };
    
    renderResources(userLocation);
  } catch (error) {
    console.error('Error getting location:', error);
    alert('Unable to get your location. Please ensure location services are enabled.');
  }
}

// Mock resource fetching - in real app this would be an API call
async function fetchResources(location: Location): Promise<Resource[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data - in real app this would come from an API
  return [
    {
      id: '1',
      name: 'Down Syndrome Association',
      type: 'Support Group',
      lat: location.lat + 0.01,
      lon: location.lon + 0.01,
      description: 'Local support group for families and individuals with Down syndrome.',
      address: '123 Main St, City, State 12345',
      phone: '(555) 123-4567',
      website: 'https://example.com'
    },
    {
      id: '2',
      name: 'Special Needs Medical Center',
      type: 'Healthcare',
      lat: location.lat - 0.02,
      lon: location.lon + 0.015,
      description: 'Specialized medical care for individuals with developmental disabilities.',
      address: '456 Health Ave, City, State 12345',
      phone: '(555) 987-6543',
      website: 'https://medical-example.com'
    }
  ];
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    });
  });
}

function calculateDistance(location1: Location, location2: Resource): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(location2.lat - location1.lat);
  const dLon = toRad(location2.lon - location1.lon);
  const lat1 = toRad(location1.lat);
  const lat2 = toRad(location2.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make requestLocation globally available
(window as any).requestLocation = requestLocation;

export function initResources(): void {
  console.log('Resources module loaded');
  // Don't initialize map immediately - wait for page navigation
}

export function initResourcesPage(): void {
  const container = byId('resources-map');
  if (!container) {
    console.error('Resources map container not found');
    return;
  }
  
  initMap();
  initSearchHandlers();
}

async function initMap(): Promise<void> {
  try {
    console.log('Loading Google Maps...');
    await GoogleMapsService.initMap('resources-map');
    console.log('✅ Google Maps loaded successfully!');
    
    // Remove this line - don't automatically get location
    // await getCurrentLocationAndSearch();
    
    console.log('Map ready. Click "Use My Location" to search nearby resources.');
  } catch (error) {
    console.error('❌ Google Maps failed to load:', error);
  }
}

function initSearchHandlers(): void {
  const useLocationBtn = byId('use-location-btn');
  const searchBtn = byId('search-resources-btn');
  const distanceRange = byId('distance-range') as HTMLInputElement;
  const distanceValue = byId('distance-value');
  const locationInput = byId('location-input') as HTMLInputElement;
  
  // Initialize the filter dropdown
  initResourcesFilter();
  
  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', () => {
      getCurrentLocationAndSearch();
    });
  }
  
  if (locationInput) {
    locationInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        handleManualLocationSearch();
      }
    });
    
    locationInput.addEventListener('change', () => {
      // Location input changed
    });
  }
  
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const locationInput = byId('location-input') as HTMLInputElement;
      if (locationInput && locationInput.value.trim()) {
        handleManualLocationSearch();
      } else {
        performSearch();
      }
    });
  }
  
  if (distanceRange && distanceValue) {
    // Use consistent number array for both display and logic
    const distanceOptions = [5, 10, 25, 50];
    
    // Set initial value
    const currentIndex = parseInt(distanceRange.value);
    distanceValue.textContent = `${distanceOptions[currentIndex]} miles`;
    
    distanceRange.addEventListener('input', () => {
      const selectedIndex = parseInt(distanceRange.value);
      const selectedDistance = distanceOptions[selectedIndex];
      distanceValue.textContent = `${selectedDistance} miles`;
      
      // Optional: Log the change to verify it's working
      console.log('Distance changed to:', selectedDistance, 'miles (index:', selectedIndex, ')');
    });
  }
}

function initResourcesFilter(): void {
  const filterBtn = byId('resources-filter-btn');
  const filterMenu = byId('resources-filter-menu');
  const filterCount = byId('resources-filter-count');
  
  if (!filterBtn || !filterMenu || !filterCount) {
    console.warn('Resources filter elements not found');
    return;
  }
  
  // Toggle dropdown
  filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = filterBtn.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      closeResourcesFilter();
    } else {
      openResourcesFilter();
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterMenu.contains(e.target as Node) && !filterBtn.contains(e.target as Node)) {
      closeResourcesFilter();
    }
  });
  
  // Handle checkbox changes
  const checkboxes = filterMenu.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateResourcesFilterCount);
  });
  
  // Initial count
  updateResourcesFilterCount();
}

function openResourcesFilter(): void {
  const filterBtn = byId('resources-filter-btn');
  const filterMenu = byId('resources-filter-menu');
  
  if (filterBtn && filterMenu) {
    filterBtn.setAttribute('aria-expanded', 'true');
    filterMenu.style.display = 'block';
    filterBtn.classList.add('active');
  }
}

function closeResourcesFilter(): void {
  const filterBtn = byId('resources-filter-btn');
  const filterMenu = byId('resources-filter-menu');
  
  if (filterBtn && filterMenu) {
    filterBtn.setAttribute('aria-expanded', 'false');
    filterMenu.style.display = 'none';
    filterBtn.classList.remove('active');
  }
}

function updateResourcesFilterCount(): void {
  const filterCount = byId('resources-filter-count');
  const checkboxes = document.querySelectorAll('#resources-filter-menu input[type="checkbox"]:checked');
  
  if (filterCount) {
    const count = checkboxes.length;
    filterCount.textContent = count.toString();
    filterCount.style.display = count > 0 ? 'inline' : 'none';
  }
}

async function handleManualLocationSearch(): Promise<void> {
  console.log('📝 Starting manual location search...');
  
  const locationInput = byId('location-input') as HTMLInputElement;
  const useLocationBtn = byId('use-location-btn') as HTMLButtonElement;
  
  if (!locationInput || !locationInput.value.trim()) {
    console.error('❌ No location input provided');
    alert('Please enter a location (city, state, or zip code)');
    return;
  }
  
  const manualLocation = locationInput.value.trim();
  console.log('📍 Manual location entered:', manualLocation);
  
  if (useLocationBtn) {
    console.log('🔄 Updating button to show "Finding Location..."');
    useLocationBtn.textContent = '🔍 Finding Location...';
    useLocationBtn.style.background = '#ffc107';
  }
  
  try {
    console.log('📦 Importing GeocodingService...');
    const { GeocodingService } = await import('../services/geocoding.js');
    
    console.log('🌍 Calling geocodeAddress...');
    const geocodeResult = await GeocodingService.geocodeAddress(manualLocation);
    console.log('✅ Geocoding successful:', geocodeResult);
    
    const coordinates = { lat: geocodeResult.lat, lng: geocodeResult.lng };
    console.log('📍 Setting coordinates in GoogleMapsService:', coordinates);
    GoogleMapsService.setUserLocation(coordinates);
    
    const map = GoogleMapsService.getMap();
    if (map) {
      console.log('🗺️ Updating map center and zoom');
      map.setCenter(coordinates);
      map.setZoom(12);
    } else {
      console.warn('⚠️ No map available to center');
    }
    
    if (useLocationBtn) {
      console.log('✅ Updating button to show success');
      useLocationBtn.textContent = `✅ ${geocodeResult.formattedAddress}`;
      useLocationBtn.style.background = '#28a745';
    }
    
    console.log('🔍 Starting search with geocoded location...');
    await performSearch();
    console.log('✅ Search completed successfully');
    
    setTimeout(() => {
      if (useLocationBtn) {
        console.log('🔄 Resetting button to normal state');
        useLocationBtn.textContent = '📍 Use My Location';
        useLocationBtn.style.background = '';
      }
    }, 3000);
    
  } catch (error) {
    console.error('💥 Error in manual location search:');
    console.error('❌ Error object:', error);
    console.error('❌ Error message:', (error as Error).message);
    console.error('❌ Error stack:', (error as Error).stack);
    
    if (useLocationBtn) {
      console.log('🔴 Updating button to show error state');
      useLocationBtn.textContent = '❌ Location Not Found';
      useLocationBtn.style.background = '#dc3545';
    }
    
    console.log('📝 Showing error alert to user');
    alert(`Could not find location "${manualLocation}". Please try:\n• Full city and state (e.g., "Dallas, TX")\n• ZIP code (e.g., "75201")\n• More specific address`);
    
    setTimeout(() => {
      if (useLocationBtn) {
        console.log('🔄 Resetting button after error');
        useLocationBtn.textContent = '📍 Use My Location';
        useLocationBtn.style.background = '';
      }
    }, 3000);
  }
}

async function getCurrentLocationAndSearch(): Promise<void> {
  try {
    await GoogleMapsService.getCurrentLocation();
    
    const locationInput = byId('location-input') as HTMLInputElement;
    if (locationInput) {
      locationInput.value = '';
    }
    
    await performSearch();
    
  } catch (error) {
    console.error('Geolocation failed:', error);
    
    const useLocationBtn = byId('use-location-btn') as HTMLButtonElement;
    if (useLocationBtn) {
      useLocationBtn.textContent = '❌ Location Failed';
      useLocationBtn.style.background = '#dc3545';
      
      setTimeout(() => {
        useLocationBtn.textContent = '📍 Use My Location';
        useLocationBtn.style.background = '';
      }, 3000);
    }
    
    alert('Unable to get your location automatically. Please enter your city, state, or zip code in the location field above and try searching.');
  }
}

async function performSearch(): Promise<void> {
  const searchBtn = byId('search-resources-btn') as HTMLButtonElement;
  const resultsCount = byId('results-count');
  
  try {
    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.textContent = '🔍 Searching...';
    }
    
    const userLocation = GoogleMapsService.getUserLocation();
    
    if (!userLocation) {
      alert('Please allow location access or enter an address first.');
      return;
    }
    
    // Get search parameters with consistent distance mapping
    const distanceRange = byId('distance-range') as HTMLInputElement;
    const distanceOptions = [5, 10, 25, 50]; // Same array as in initSearchHandlers
    const selectedIndex = parseInt(distanceRange?.value || '2'); // Default to index 2 (25 miles)
    const distance = distanceOptions[selectedIndex];
    
    const selectedCategories = getSelectedCategories();
    
    // Log search parameters for debugging
    console.log('Search parameters:', {
      distance: distance,
      sliderValue: distanceRange?.value,
      sliderIndex: selectedIndex,
      categories: selectedCategories,
      location: userLocation
    });
    
    if (selectedCategories.length === 0) {
      alert('Please select at least one resource type.');
      return;
    }
    
    const filters: SearchFilters = {
      location: userLocation,
      radius: distance,
      categories: selectedCategories
    };
    
    currentResults = await ResourceAggregator.searchResources(filters);
    
    // Update map
    GoogleMapsService.addResourceMarkers(currentResults);
    
    // Update results count
    if (resultsCount) {
      resultsCount.textContent = `${currentResults.length} resources found`;
    }
    
    // Update results list
    displayResultsList(currentResults);
    
  } catch (error) {
    console.error('Search error:', error);
    alert('Search failed. Please try again.');
  } finally {
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.textContent = '🔍 Search Resources';
    }
  }
}

function getSelectedCategories(): string[] {
  const checkboxes = document.querySelectorAll('#resources-filter-menu input[type="checkbox"]:checked');
  const categories = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value);
  
  // If no categories selected, default to medical for testing
  if (categories.length === 0) {
    return ['medical'];
  }
  
  return categories;
}

function displayResultsList(results: AggregatedResult[]): void {
  const resultsList = byId('results-list');
  if (!resultsList) return;
  
  if (results.length === 0) {
    resultsList.innerHTML = `
      <div class="no-results">
        <p>No resources found in this area.</p>
        <p>Try expanding your search radius or selecting different categories.</p>
      </div>
    `;
    return;
  }
  
  resultsList.innerHTML = results.map((resource, index) => `
    <div class="result-item" data-place-id="${resource.placeId}" data-index="${index}">
      <div class="result-header">
        <h4>${resource.name}</h4>
        <span class="result-category">${resource.category}</span>
      </div>
      <div class="result-details">
        <p class="result-address">${resource.address}</p>
        <p class="result-distance">${resource.distance.toFixed(1)} miles away</p>
        ${resource.rating ? `<p class="result-rating">⭐ ${resource.rating}/5</p>` : ''}
        ${resource.phone ? `<p class="result-phone"><a href="tel:${resource.phone}">${resource.phone}</a></p>` : ''}
      </div>
    </div>
  `).join('');
  
  // Add click handlers to focus on map markers
  results.forEach((_resource, index) => {
    const item = resultsList.querySelector(`[data-index="${index}"]`);
    item?.addEventListener('click', () => {
      GoogleMapsService.focusOnMarker(index);
    });
  });
}