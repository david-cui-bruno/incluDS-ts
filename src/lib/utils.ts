// DOM utility functions
export function $$(selector: string, root: HTMLElement | Document = document): HTMLElement[] {
  return Array.from(root.querySelectorAll(selector));
}

export function byId(id: string): HTMLElement | null {
  return document.getElementById(id);
}

// Cookie management functions
interface CookieOptions {
  domain?: string;
  maxAge?: number;
  path?: string;
}

export function setCookie(name: string, value: string, opts: CookieOptions = {}): void {
  let cookieString = `${name}=${value}; path=${opts.path || '/'}`;
  
  if (opts.domain) {
    cookieString += `; domain=${opts.domain}`;
  }
  
  if (opts.maxAge) {
    cookieString += `; max-age=${opts.maxAge}`;
  }
  
  document.cookie = cookieString;
}

export function clearCookie(name: string): void {
  const host = location.hostname;
  const rootDomain = '.' + host.split('.').slice(-2).join('.');
  
  // Clear cookie for different domain variants
  const domains = [host, rootDomain, undefined];
  
  domains.forEach(domain => {
    const cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/` + 
      (domain ? `; domain=${domain}` : '');
    document.cookie = cookieString;
  });
}

// Language code normalization
export function normalizeLang(code: string): string {
  if (!code) return '';
  
  const normalizedCode = code.toLowerCase();
  const languageMap: Record<string, string> = {
    'zh': 'zh-CN',
    'zh-cn': 'zh-CN',
    'zh-tw': 'zh-TW',
    'he': 'iw',
    'pt-br': 'pt'
  };
  
  return languageMap[normalizedCode] || code;
}

// Distance calculation using Haversine formula
export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (degrees: number): number => degrees * Math.PI / 180;
  const EARTH_RADIUS = 6371; // km
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) ** 2 + 
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  
  return EARTH_RADIUS * 2 * Math.asin(Math.sqrt(a));
}

// Text processing functions
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export function sanitizeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Promise-based timeout
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if element is in viewport
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Smooth scroll to element
export function scrollToElement(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
  element.scrollIntoView({ behavior, block: 'start' });
}

// Format numbers for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

// URL parameter helpers
export function getUrlParam(name: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function setUrlParam(name: string, value: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.replaceState({}, '', url.toString());
}

// Local storage helpers with error handling
export function getFromStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('localStorage not available:', error);
    return null;
  }
}

export function setToStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn('localStorage not available:', error);
    return false;
  }
}

// Error handling helper
export function handleError(error: unknown, context: string): void {
  console.error(`Error in ${context}:`, error);
  
  // You could integrate with error reporting service here
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}