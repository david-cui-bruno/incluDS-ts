// src/services/googleMaps.ts
import type { AggregatedResult } from './resourceAggregator.js';

declare global {
  interface Window {
    initMap: () => void;
  }
}

// const getGoogleMaps = (): any => {
//   if (!(window as any).google?.maps) {
//     throw new Error('Google Maps not loaded');
//   }
//   return (window as any).google;
// };

export interface MapLocation {
  lat: number;
  lng: number;
}

export class GoogleMapsService {
  private static map: any;
  private static markers: any[] = [];
  private static userLocation: MapLocation | null = null;
  private static isLoaded = false;

  static getMap(): any {
    return this.map;
  }

  static async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded && (window as any).google?.maps) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        reject(new Error('Google Maps API key not found'));
        return;
      }

      // Check if script is already loading
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkLoaded = () => {
          if ((window as any).google?.maps) {
            this.isLoaded = true;
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // Set up callback before loading script
      window.initMap = () => {
        this.isLoaded = true;
        resolve();
      };

      // Load script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  }

  static async initMap(containerId: string): Promise<void> {
    try {
      await this.loadGoogleMaps();
      
      if (!(window as any).google?.maps) {
        throw new Error('Google Maps API not available after loading');
      }
      
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Map container '${containerId}' not found`);
      }

      // Default to center of US
      const defaultCenter = { lat: 39.8283, lng: -98.5795 };

      this.map = new ((window as any).google).maps.Map(container, {
        zoom: 4,
        center: defaultCenter,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      throw error;
    }
  }

  static getCurrentLocation(): Promise<MapLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by this browser'));
        return;
      }

      const attempts = [
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
      ];

      let attemptCount = 0;

      const tryGeolocation = (options: PositionOptions) => {
        attemptCount++;

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            
            this.userLocation = userPos;
            
            if (this.map) {
              this.map.setCenter(userPos);
              this.map.setZoom(12);
            }
            
            resolve(userPos);
          },
          (error) => {
            if (attemptCount < attempts.length) {
              setTimeout(() => tryGeolocation(attempts[attemptCount]), 1000);
            } else {
              let errorMessage = 'Location access failed';
              let suggestions: string[] = [];
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Location access denied by user';
                  suggestions = [
                    'Allow location access in browser settings',
                    'Try refreshing and allowing location when prompted'
                  ];
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable';
                  suggestions = [
                    'Enable Location Services in system settings',
                    'Try connecting to Wi-Fi for better location accuracy'
                  ];
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Location request timed out';
                  suggestions = [
                    'Check your internet connection',
                    'Try again in a moment'
                  ];
                  break;
                default:
                  errorMessage = `Location error: ${error.message}`;
                  suggestions = ['Try refreshing the page'];
                  break;
              }
              
              reject(new Error(errorMessage + '\n\nSuggestions:\n• ' + suggestions.join('\n• ')));
            }
          },
          options
        );
      };

      tryGeolocation(attempts[0]);
    });
  }

  static getUserLocation(): MapLocation | null {
    return this.userLocation;
  }

  static setUserLocation(location: MapLocation): void {
    this.userLocation = location;
  }

  static addResourceMarkers(resources: AggregatedResult[]): void {
    this.clearMarkers();
    
    resources.forEach((resource) => {
      const marker = new ((window as any).google).maps.Marker({
        position: resource.location,
        map: this.map,
        title: resource.name,
        icon: this.getMarkerIcon(resource.category)
      });
      
      const infoWindow = new ((window as any).google).maps.InfoWindow({
        content: this.createInfoWindowContent(resource)
      });
      
      marker.addListener('click', () => {
        this.markers.forEach(m => (m as any).infoWindow?.close());
        infoWindow.open(this.map, marker);
      });
      
      (marker as any).infoWindow = infoWindow;
      this.markers.push(marker);
    });
  }

  static focusOnMarker(index: number): void {
    if (this.markers[index]) {
      const marker = this.markers[index];
      this.map.setCenter(marker.getPosition());
      this.map.setZoom(15);
      (marker as any).infoWindow?.open(this.map, marker);
    }
  }

  static clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.setMap(null);
      if ((marker as any).infoWindow) {
        (marker as any).infoWindow.close();
      }
    });
    this.markers = [];
  }

  private static getMarkerIcon(category: string): any {
    const colors = {
      'Medical': '#FF6B6B',
      'Therapy': '#4ECDC4', 
      'Education': '#45B7D1',
      'Support': '#96CEB4',
      'Recreation': '#FFEAA7',
      'Other': '#DDA0DD'
    };

    return {
      path: ((window as any).google).maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: (colors as any)[category] || colors['Other'],
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    };
  }

  private static createInfoWindowContent(resource: AggregatedResult): string {
    return `
      <div style="max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px;">${resource.name}</h3>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 12px;">
          <strong>${resource.category}</strong> • ${resource.distance.toFixed(1)} miles away
        </p>
        <p style="margin: 0 0 8px 0; font-size: 14px;">${resource.address}</p>
        ${resource.rating ? `
          <p style="margin: 0 0 4px 0; font-size: 12px;">
            ⭐ ${resource.rating}/5
          </p>
        ` : ''}
        ${resource.phone ? `
          <p style="margin: 0 0 4px 0;">
            <a href="tel:${resource.phone}" style="color: #007cba; text-decoration: none;">
              📞 ${resource.phone}
            </a>
          </p>
        ` : ''}
        ${resource.website ? `
          <p style="margin: 4px 0 0 0;">
            <a href="${resource.website}" target="_blank" style="color: #007cba; text-decoration: none;">
              🌐 Visit Website →
            </a>
          </p>
        ` : ''}
      </div>
    `;
  }
}
