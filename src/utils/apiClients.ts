import { GooglePlacesResponse, GooglePlacesResult, PVGISResponse, ClimateData, ConsumptionProfileData } from '../types/ApiTypes';

// API configuration - in production, these would come from environment variables
const API_CONFIG = {
  GOOGLE_PLACES_KEY: 'YOUR_GOOGLE_PLACES_API_KEY', // User should replace this
  PVGIS_BASE_URL: 'https://re.jrc.ec.europa.eu/api/v5_2',
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org',
  RATE_LIMIT_DELAY: 1000 // 1 second between requests
};

// Simple cache to avoid repeated API calls
const cache = new Map<string, any>();

// Rate limiting utility
let lastRequestTime = 0;
const rateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < API_CONFIG.RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, API_CONFIG.RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
};

export class ApiClient {
  // Google Places API for address search
  static async searchAddresses(query: string): Promise<GooglePlacesResponse> {
    const cacheKey = `places_${query}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      await rateLimit();
      
      // For demo purposes, we'll use Nominatim as fallback
      // In production, replace with Google Places API
      const response = await fetch(
        `${API_CONFIG.NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=es&limit=5&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const nominatimResults = await response.json();
      
      // Convert Nominatim response to Google Places format
      const googlePlacesFormat: GooglePlacesResponse = {
        predictions: nominatimResults.map((result: any) => ({
          description: result.display_name,
          place_id: result.place_id,
          structured_formatting: {
            main_text: result.address?.road || result.name || '',
            secondary_text: `${result.address?.city || result.address?.town || ''}, ${result.address?.state || ''}`
          }
        })),
        status: 'OK'
      };

      cache.set(cacheKey, googlePlacesFormat);
      return googlePlacesFormat;
    } catch (error) {
      console.error('Error searching addresses:', error);
      throw error;
    }
  }

  // Get detailed address information
  static async getAddressDetails(placeId: string): Promise<GooglePlacesResult> {
    const cacheKey = `address_${placeId}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    try {
      await rateLimit();
      
      // Using Nominatim for demo - replace with Google Places Details API
      const response = await fetch(
        `${API_CONFIG.NOMINATIM_URL}/lookup?osm_ids=N${placeId}&format=json&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const results = await response.json();
      const result = results[0];
      
      if (!result) {
        throw new Error('Address not found');
      }

      const googlePlacesResult: GooglePlacesResult = {
        place_id: placeId,
        formatted_address: result.display_name,
        geometry: {
          location: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          }
        },
        address_components: [
          { long_name: result.address?.road || '', short_name: '', types: ['route'] },
          { long_name: result.address?.house_number || '', short_name: '', types: ['street_number'] },
          { long_name: result.address?.city || result.address?.town || '', short_name: '', types: ['locality'] },
          { long_name: result.address?.state || '', short_name: '', types: ['administrative_area_level_1'] },
          { long_name: result.address?.postcode || '', short_name: '', types: ['postal_code'] },
          { long_name: result.address?.country || 'España', short_name: 'ES', types: ['country'] }
        ]
      };

      cache.set(cacheKey, googlePlacesResult);
      return googlePlacesResult;
    } catch (error) {
      console.error('Error getting address details:', error);
      throw error;
    }
  }

  // PVGIS API for real solar irradiance data - NOW USES REAL COORDINATES
  static async getSolarData(lat: number, lng: number, peakPower: number = 1, angle: number = 35, aspect: number = 0): Promise<PVGISResponse> {
    const cacheKey = `pvgis_${lat.toFixed(4)}_${lng.toFixed(4)}_${peakPower}_${angle}_${aspect}`;
    if (cache.has(cacheKey)) {
      console.log('Using cached PVGIS data for:', lat, lng);
      return cache.get(cacheKey);
    }

    try {
      await rateLimit();
      
      console.log('Fetching REAL PVGIS data for coordinates:', lat, lng, 'with angle:', angle);
      
      const url = `${API_CONFIG.PVGIS_BASE_URL}/PVcalc?lat=${lat}&lon=${lng}&peakpower=${peakPower}&loss=14&angle=${angle}&aspect=${aspect}&mountingplace=building&outputformat=json`;
      
      console.log('PVGIS URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`PVGIS API Error: ${response.status}, falling back to mock data`);
        return ApiClient.getMockPVGISData();
      }
      
      const data = await response.json();
      
      console.log('Real PVGIS data received:', data);
      
      // Validate PVGIS response
      if (!data.outputs || !data.outputs.totals || !data.outputs.totals.fixed) {
        console.warn('Invalid PVGIS response structure, using mock data');
        return ApiClient.getMockPVGISData();
      }
      
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching PVGIS data:', error);
      console.log('Falling back to mock data');
      return ApiClient.getMockPVGISData();
    }
  }

  // Enhanced method to test multiple angles and find optimal inclination
  static async getOptimalSolarData(lat: number, lng: number, peakPower: number = 1): Promise<{
    optimal: PVGISResponse;
    angle: number;
    allAngles: Array<{ angle: number; yield: number; data: PVGISResponse }>;
  }> {
    const angles = [20, 25, 30, 35, 40, 45]; // Test multiple angles
    const results = [];
    
    console.log('Testing multiple angles for optimal solar data...');
    
    for (const angle of angles) {
      try {
        const data = await this.getSolarData(lat, lng, peakPower, angle);
        const yield = data.outputs.totals.fixed.E_y;
        results.push({ angle, yield, data });
        
        console.log(`Angle ${angle}°: ${yield.toFixed(0)} kWh/kWp/year`);
        
        // Add delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error testing angle ${angle}:`, error);
      }
    }
    
    if (results.length === 0) {
      const fallbackData = await this.getSolarData(lat, lng, peakPower, 35);
      return { optimal: fallbackData, angle: 35, allAngles: [] };
    }
    
    // Find optimal angle
    const optimal = results.reduce((best, current) => 
      current.yield > best.yield ? current : best
    );
    
    console.log(`Optimal angle: ${optimal.angle}° with ${optimal.yield.toFixed(0)} kWh/kWp/year`);
    
    return {
      optimal: optimal.data,
      angle: optimal.angle,
      allAngles: results
    };
  }

  // Fallback mock PVGIS data
  static getMockPVGISData(): PVGISResponse {
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      E_d: 3.5 + Math.sin((i + 1) * Math.PI / 6) * 1.5, // Seasonal variation
      E_m: (3.5 + Math.sin((i + 1) * Math.PI / 6) * 1.5) * 30,
      H_sun: 5.2 + Math.sin((i + 1) * Math.PI / 6) * 2
    }));

    const hourly = Array.from({ length: 8760 }, (_, i) => {
      const hour = i % 24;
      const dayOfYear = Math.floor(i / 24);
      const solarNoon = 12;
      const hourFromNoon = Math.abs(hour - solarNoon);
      const seasonalFactor = 0.8 + 0.4 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
      
      return {
        time: new Date(2024, 0, 1, hour).toISOString(),
        P: hourFromNoon <= 6 ? Math.max(0, (1000 * Math.cos((hourFromNoon / 6) * Math.PI / 2) * seasonalFactor)) : 0,
        G_i: hourFromNoon <= 6 ? Math.max(0, (800 * Math.cos((hourFromNoon / 6) * Math.PI / 2) * seasonalFactor)) : 0,
        T_2m: 20 + 10 * Math.sin((dayOfYear / 365) * 2 * Math.PI) + 5 * Math.sin((hour / 24) * 2 * Math.PI)
      };
    });

    return {
      outputs: {
        monthly,
        totals: {
          fixed: {
            E_y: monthly.reduce((sum, month) => sum + month.E_m, 0),
            PR: 0.86
          }
        },
        hourly
      }
    };
  }

  // Get Spanish consumption profiles by province
  static async getConsumptionProfile(provinceCode: string): Promise<ConsumptionProfileData> {
    const cacheKey = `consumption_${provinceCode}`;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Mock data based on Spanish averages - in production, integrate with INE API
    const spanishProvinces: Record<string, ConsumptionProfileData> = {
      'default': {
        provinceCode,
        averageConsumption: {
          residential: 3500, // kWh/year
          withAC: 4200,
          withHeating: 4800,
          withEV: 5000
        },
        hourlyProfile: [
          0.3, 0.25, 0.22, 0.2, 0.18, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0,
          1.1, 1.0, 0.9, 0.8, 0.9, 1.2, 1.5, 1.8, 1.6, 1.2, 0.8, 0.5
        ],
        monthlyProfile: [1.1, 1.0, 0.9, 0.8, 0.7, 0.8, 1.2, 1.3, 0.9, 0.8, 1.0, 1.2]
      }
    };

    const profile = spanishProvinces[provinceCode] || spanishProvinces['default'];
    cache.set(cacheKey, profile);
    return profile;
  }

  // Clear cache (useful for development)
  static clearCache(): void {
    cache.clear();
  }
}
