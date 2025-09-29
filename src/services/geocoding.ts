export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export class GeocodingService {
  private static apiKey: string = '';

  static init(): void {
    this.apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';
    console.log('🔑 Geocoding API Key status:', this.apiKey ? 'Found' : 'Missing');
    console.log('🔑 API Key length:', this.apiKey.length);
  }

  static async geocodeAddress(address: string): Promise<GeocodeResult> {
    console.log('🌍 Starting geocoding for address:', address);
    
    if (!this.apiKey) {
      console.log('⚠️ No API key, initializing...');
      this.init();
    }

    if (!this.apiKey) {
      console.error('❌ Still no API key after init');
      throw new Error('Google Maps API key not found. Please check your environment variables.');
    }

    console.log('✅ API key available, proceeding with geocoding');
    return await this.googleGeocode(address);
  }

  private static async googleGeocode(address: string): Promise<GeocodeResult> {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`;
    
    console.log('📡 Making geocoding request...');
    console.log('📍 Original address:', address);
    console.log('🔗 Encoded address:', encodedAddress);
    console.log('🌐 Request URL (key hidden):', url.replace(this.apiKey, 'HIDDEN_KEY'));
    
    try {
      console.log('⏳ Sending fetch request...');
      const response = await fetch(url);
      
      console.log('📨 Response received');
      console.log('📊 Response status:', response.status);
      console.log('✅ Response ok:', response.ok);

      if (!response.ok) {
        console.error('❌ HTTP error response');
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        throw new Error(`Geocoding API HTTP error: ${response.status} ${response.statusText}`);
      }

      console.log('📋 Parsing JSON response...');
      const data = await response.json();
      console.log('📄 Full API response:', data);
      console.log('🎯 Response status:', data.status);

      if (data.status !== 'OK') {
        console.error('❌ Google API returned non-OK status:', data.status);
        console.error('❌ Error message:', data.error_message);
        console.error('❌ Available results:', data.results);
        
        // Provide specific error messages for common issues
        let userMessage = '';
        switch (data.status) {
          case 'REQUEST_DENIED':
            console.error('🚫 REQUEST_DENIED - API key issue');
            userMessage = 'API access denied. Please check your API key configuration.';
            break;
          case 'ZERO_RESULTS':
            console.warn('🔍 ZERO_RESULTS - No location found');
            userMessage = `No results found for "${address}". Please try a more specific address.`;
            break;
          case 'OVER_QUERY_LIMIT':
            console.error('💸 OVER_QUERY_LIMIT - Quota exceeded');
            userMessage = 'Geocoding quota exceeded. Please try again later.';
            break;
          case 'INVALID_REQUEST':
            console.error('❓ INVALID_REQUEST - Invalid format');
            userMessage = 'Invalid address format.';
            break;
          default:
            console.error('❌ Unknown error status:', data.status);
            userMessage = `Geocoding failed: ${data.status}`;
        }
        throw new Error(userMessage);
      }

      if (!data.results || data.results.length === 0) {
        console.error('❌ No results in API response despite OK status');
        throw new Error(`No results found for "${address}". Please try a more specific address.`);
      }

      const result = data.results[0];
      const location = result.geometry.location;

      console.log('✅ Successfully parsed geocoding result:');
      console.log('📍 Latitude:', location.lat);
      console.log('📍 Longitude:', location.lng);
      console.log('📍 Formatted address:', result.formatted_address);

      const geocodeResult = {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address
      };

      console.log('🎉 Returning geocode result:', geocodeResult);
      return geocodeResult;

    } catch (fetchError) {
      console.error('💥 Fetch error occurred:');
      console.error('❌ Error name:', (fetchError as Error).name);
      console.error('❌ Error message:', (fetchError as Error).message);
      console.error('❌ Error stack:', (fetchError as Error).stack);
      
      if ((fetchError as Error).message.includes('Failed to fetch')) {
        console.error('🌐 Network error detected');
        throw new Error('Network error: Unable to reach Google Geocoding API.');
      }
      throw fetchError;
    }
  }
}
