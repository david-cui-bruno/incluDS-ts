// import type { PlaceResult, GooglePlacesService } from './googlePlaces.js';

export interface SearchFilters {
  location: { lat: number; lng: number };
  radius: number; // miles
  categories: string[];
  keyword?: string;
}

export interface AggregatedResult {
  placeId: string;
  name: string;
  category: string;
  address: string;
  location: { lat: number; lng: number };
  distance: number; // miles
  rating?: number;
  phone?: string;
  website?: string;
  photoUrl?: string;
  source: 'google_places' | 'curated';
}

export class ResourceAggregator {
  static async searchResources(filters: SearchFilters): Promise<AggregatedResult[]> {
    console.log('🔍 Starting search with filters:', filters);
    
    try {
      const allResults: AggregatedResult[] = [];
      
      // Convert miles to meters for Google Places API
      const radiusMeters = Math.min(filters.radius * 1609.34, 25000); // Max 25km for more targeted
      console.log('📏 Search radius:', filters.radius, 'miles =', radiusMeters, 'meters');
      
      // Search each category
      for (const category of filters.categories) {
        try {
          const { GooglePlacesService } = await import('./googlePlaces.js');
          const placesTypes = GooglePlacesService.getCategoryTypes(category);
          
          // Search for each type in this category
          for (const placeType of placesTypes) {
            try {
              const placesRequest = {
                location: filters.location,
                radius: radiusMeters,
                types: [placeType],
                keyword: 'Down syndrome developmental disabilities special needs'
              };
              
              const places = await GooglePlacesService.searchNearby(placesRequest);
              console.log(`📍 Found ${places.length} raw places for ${placeType}`);
              
              // Convert to AggregatedResult format first
              const aggregatedPlaces = places.map(place => this.convertToAggregatedResult(place, category, filters.location));
              
              // Log distances before filtering
              aggregatedPlaces.forEach(place => {
                console.log(`📏 ${place.name}: ${place.distance.toFixed(2)} miles`);
              });
              
              // Filter by actual calculated distance (more precise than API radius)
              const filteredPlaces = aggregatedPlaces.filter(place => {
                const withinRadius = place.distance <= filters.radius;
                if (!withinRadius) {
                  console.log(`❌ Filtered out ${place.name} - ${place.distance.toFixed(2)} miles > ${filters.radius} miles`);
                }
                return withinRadius;
              });
              
              console.log(`✅ After distance filtering: ${filteredPlaces.length} places within ${filters.radius} miles`);
              
              // Filter and score results for relevance
              const relevantPlaces = filteredPlaces
                .map(place => ({
                  ...place,
                  relevanceScore: this.calculateRelevanceScore(place)
                }))
                .filter(place => place.relevanceScore > 0)
                .sort((a, b) => b.relevanceScore - a.relevanceScore);
              
              console.log(`🎯 After relevance filtering: ${relevantPlaces.length} relevant places`);
              
              allResults.push(...relevantPlaces);
              
              // Add delay between requests
              await new Promise(resolve => setTimeout(resolve, 200));
              
            } catch (typeError) {
              console.warn(`Error searching type ${placeType}:`, typeError);
            }
          }
          
        } catch (error) {
          console.error(`Error searching category ${category}:`, error);
        }
      }
      
      console.log(`🔍 Total raw results before deduplication: ${allResults.length}`);
      
      // Remove duplicates and prioritize by relevance
      const uniqueResults = this.removeDuplicates(allResults);
      console.log(`🔍 After removing duplicates: ${uniqueResults.length} results`);
      
      // Sort by distance (since they're all within the radius now)
      const sortedResults = uniqueResults.sort((a, b) => a.distance - b.distance);
      
      // Limit to top 10 most relevant results
      const limitedResults = sortedResults.slice(0, 10);
      console.log(`✅ Final results: ${limitedResults.length} places`);
      console.log('📊 Distance range:', 
        limitedResults.length > 0 ? 
        `${limitedResults[0].distance.toFixed(1)} - ${limitedResults[limitedResults.length - 1].distance.toFixed(1)} miles` : 
        'No results'
      );
      
      return limitedResults;
      
    } catch (error) {
      console.error('ResourceAggregator search error:', error);
      return [];
    }
  }
  
  private static convertToAggregatedResult(place: any, category: string, userLocation: { lat: number; lng: number }): AggregatedResult {
    const distance = this.calculateDistance(userLocation, place.location);
    
    return {
      placeId: place.placeId,
      name: place.name,
      category: this.formatCategoryName(category),
      address: place.address,
      location: place.location,
      distance: distance,
      rating: place.rating,
      phone: place.phone,
      website: place.website,
      photoUrl: place.photoUrl,
      source: 'google_places'
    };
  }
  
  private static removeDuplicates(results: AggregatedResult[]): AggregatedResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.placeId)) {
        return false;
      }
      seen.add(result.placeId);
      return true;
    });
  }
  
  private static calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  private static formatCategoryName(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  private static calculateRelevanceScore(place: any): number {
    let score = 0;
    const name = place.name.toLowerCase();
    const types = place.types?.join(' ').toLowerCase() || '';
    
    // High relevance keywords
    if (name.includes('down syndrome') || name.includes('developmental disabilit')) score += 10;
    if (name.includes('special needs') || name.includes('inclusion')) score += 8;
    if (name.includes('adaptive') || name.includes('therapeutic')) score += 6;
    if (name.includes('children') || name.includes('pediatric')) score += 4;
    
    // Type-based scoring
    if (types.includes('health') || types.includes('doctor') || types.includes('hospital')) score += 3;
    if (types.includes('school') || types.includes('education')) score += 3;
    if (types.includes('community')) score += 2;
    
    // Negative scoring for generic places
    if (name.includes('planet fitness') || name.includes('la fitness')) score -= 5;
    if (name.includes('mcdonalds') || name.includes('starbucks')) score -= 10;
    if (types.includes('gas_station') || types.includes('convenience_store')) score -= 5;
    
    return score;
  }
}
