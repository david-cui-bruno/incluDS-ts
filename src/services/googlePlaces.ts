// src/services/googlePlaces.ts
export interface PlaceSearchRequest {
  location: { lat: number; lng: number };
  radius: number; // in meters
  types: string[]; // Google Places types
  keyword?: string;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  priceLevel?: number;
  phone?: string;
  website?: string;
  photoUrl?: string;
  openNow?: boolean;
  types: string[];
}

export class GooglePlacesService {
  private static apiKey: string = '';

  static initPlacesService(): void {
    // Get API key from environment
    this.apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('Google Maps API key not found');
    }
  }

  static async searchNearby(request: PlaceSearchRequest): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      this.initPlacesService();
    }

    try {
      // Use the new Places API (New) with text search
      const searchText = this.buildSearchText(request.types[0], request.keyword);
      const url = `https://places.googleapis.com/v1/places:searchText`;
      
      const requestBody = {
        textQuery: searchText,
        locationBias: {
          circle: {
            center: {
              latitude: request.location.lat,
              longitude: request.location.lng
            },
            radius: request.radius
          }
        },
        maxResultCount: 20,
        languageCode: 'en'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.priceLevel,places.nationalPhoneNumber,places.websiteUri,places.photos,places.currentOpeningHours,places.types'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Places API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();

      if (!data.places || data.places.length === 0) {
        return [];
      }

      const places = data.places.map((place: any) => {
        const result: PlaceResult = {
          placeId: place.id || `unknown_${Math.random()}`,
          name: place.displayName?.text || 'Unknown',
          address: place.formattedAddress || 'Address not available',
          location: {
            lat: place.location?.latitude || 0,
            lng: place.location?.longitude || 0
          },
          rating: place.rating,
          priceLevel: place.priceLevel,
          phone: place.nationalPhoneNumber,
          website: place.websiteUri,
          openNow: place.currentOpeningHours?.openNow,
          types: place.types || [],
          photoUrl: place.photos?.[0] ? this.getNewPhotoUrl(place.photos[0]) : undefined
        };

        return result;
      });

      return places;

    } catch (error) {
      console.error('Places API error:', error);
      throw error;
    }
  }

  private static buildSearchText(type: string, keyword?: string): string {
    // Map to Down syndrome and disability-specific search terms
    const typeMap: { [key: string]: string } = {
      // Medical - focus on special needs and developmental disabilities
      'doctor': 'developmental pediatrics special needs doctor Down syndrome',
      'hospital': 'children hospital special needs developmental disabilities',
      'pharmacy': 'pharmacy special needs medication',
      'dentist': 'special needs dentist pediatric developmental disabilities',
      
      // Therapy - focus on developmental therapies
      'physiotherapist': 'physical therapy special needs developmental disabilities children',
      'health': 'developmental disabilities health center special needs',
      'spa': 'therapeutic massage special needs sensory therapy',
      
      // Education - focus on special education
      'school': 'special education school developmental disabilities inclusion',
      'university': 'university special education program developmental disabilities',
      'library': 'library special needs programs accessibility',
      'primary_school': 'elementary school special education inclusion',
      'secondary_school': 'high school special education transition program',
      
      // Support - focus on disability support
      'community_center': 'Down syndrome support group community center disability services',
      'place_of_worship': 'church special needs ministry disability accessible',
      'local_government_office': 'disability services social services developmental disabilities',
      
      // Recreation - focus on adaptive and inclusive programs
      'gym': 'adaptive fitness special needs inclusive recreation therapy',
      'park': 'accessible park adaptive playground special needs',
      'amusement_park': 'accessible theme park special needs',
      'bowling_alley': 'adaptive bowling special needs league',
      'movie_theater': 'sensory friendly movies special needs',
      'zoo': 'accessible zoo special needs programs',
      
      'establishment': 'Down syndrome services developmental disabilities support'
    };

    const searchTerm = typeMap[type] || `${type} special needs developmental disabilities`;
    return keyword ? `${searchTerm} ${keyword}` : searchTerm;
  }

  private static getNewPhotoUrl(photo: any): string {
    try {
      if (photo.name) {
        return `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=300&maxWidthPx=400&key=${this.apiKey}`;
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  static getCategoryTypes(category: string): string[] {
    const categoryMap: { [key: string]: string[] } = {
      'medical': ['doctor', 'hospital'], // Focus on most relevant medical
      'therapy': ['physiotherapist', 'health'], // Skip spa for therapy
      'education': ['school', 'library'], // Focus on education
      'support': ['community_center', 'local_government_office'], // Focus on support services
      'recreation': ['gym', 'park'], // Focus on adaptive recreation
      'other': ['establishment']
    };

    const types = categoryMap[category.toLowerCase()] || categoryMap['other'];
    return types;
  }
}
