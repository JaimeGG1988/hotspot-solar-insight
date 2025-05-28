import { GooglePlacesResponse, GooglePlacesResult, PVGISResponse, ClimateData, ConsumptionProfileData } from '../types/ApiTypes';

// API configuration - in production, these would come from environment variables
const API_CONFIG = {
  GOOGLE_PLACES_KEY: 'YOUR_GOOGLE_PLACES_API_KEY', // User should replace this
  PVGIS_PROXY_URL: '/api/pvgis', // Our serverless proxy
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

  // PVGIS API through serverless proxy - NOW WORKS WITH REAL COORDINATES
  static async getSolarData(lat: number, lng: number, peakPower: number = 1, angle: number = 35, aspect: number = 0): Promise<PVGISResponse> {
    const cacheKey = `pvgis_${lat.toFixed(4)}_${lng.toFixed(4)}_${peakPower}_${angle}_${aspect}`;
    if (cache.has(cacheKey)) {
      console.log('Using cached PVGIS data for:', lat, lng);
      return cache.get(cacheKey);
    }

    try {
      await rateLimit();
      
      console.log('Fetching REAL PVGIS data via proxy for coordinates:', lat, lng, 'with angle:', angle);
      
      const proxyUrl = `${API_CONFIG.PVGIS_PROXY_URL}?lat=${lat}&lng=${lng}&peakpower=${peakPower}&angle=${angle}&aspect=${aspect}`;
      
      console.log('PVGIS Proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`PVGIS Proxy Error: ${response.status}, using fallback data`);
        
        if (errorData.fallback) {
          return ApiClient.getEnhancedFallbackPVGISData(lat, lng, peakPower, angle);
        }
        
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Real PVGIS data received via proxy:', data);
      
      // Validate PVGIS response structure
      if (!data.outputs || !data.outputs.totals || !data.outputs.totals.fixed) {
        console.warn('Invalid PVGIS response structure from proxy, using enhanced fallback');
        return ApiClient.getEnhancedFallbackPVGISData(lat, lng, peakPower, angle);
      }
      
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching PVGIS data via proxy:', error);
      console.log('Using enhanced fallback data for Spain');
      return ApiClient.getEnhancedFallbackPVGISData(lat, lng, peakPower, angle);
    }
  }

  // Enhanced method to test multiple angles and find optimal inclination
  static async getOptimalSolarData(lat: number, lng: number, peakPower: number = 1): Promise<{
    optimal: PVGISResponse;
    angle: number;
    allAngles: Array<{ angle: number; energyYield: number; data: PVGISResponse }>;
  }> {
    const angles = [20, 25, 30, 35, 40, 45]; // Test multiple angles
    const results = [];
    
    console.log('Testing multiple angles for optimal solar data via proxy...');
    
    for (const angle of angles) {
      try {
        const data = await this.getSolarData(lat, lng, peakPower, angle);
        const energyYield = data.outputs.totals.fixed.E_y;
        results.push({ angle, energyYield, data });
        
        console.log(`Angle ${angle}°: ${energyYield.toFixed(0)} kWh/kWp/year`);
        
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
      current.energyYield > best.energyYield ? current : best
    );
    
    console.log(`Optimal angle: ${optimal.angle}° with ${optimal.energyYield.toFixed(0)} kWh/kWp/year`);
    
    return {
      optimal: optimal.data,
      angle: optimal.angle,
      allAngles: results
    };
  }

  // Enhanced fallback with realistic Spanish solar data
  static getEnhancedFallbackPVGISData(lat: number, lng: number, peakPower: number = 1, angle: number = 35): PVGISResponse {
    console.warn('Using enhanced fallback PVGIS data with Spanish solar irradiance averages');
    
    // Spanish solar irradiance by latitude (approximate HSP values)
    const getSpanishHSP = (latitude: number): number => {
      if (latitude >= 43) return 1200; // Northern Spain (Galicia, Asturias, Cantabria)
      if (latitude >= 41) return 1400; // Central-North Spain (Castilla y León, País Vasco)
      if (latitude >= 39) return 1550; // Central Spain (Madrid, Castilla-La Mancha)
      if (latitude >= 37) return 1650; // Southern Central Spain (Extremadura, norte Andalucía)
      return 1750; // Southern Spain (Andalucía, Murcia, Valencia)
    };
    
    const baseHSP = getSpanishHSP(lat);
    
    // Angle optimization factor (35° is typically optimal for Spain)
    const angleOptimizationFactor = 1 - Math.abs(angle - 35) * 0.008; // ~0.8% loss per degree from optimal
    
    const annualEnergyYield = baseHSP * angleOptimizationFactor;
    
    // Generate realistic monthly distribution
    const monthlyDistribution = [
      0.65, 0.75, 0.90, 1.10, 1.25, 1.35, // Jan-Jun
      1.40, 1.35, 1.15, 0.95, 0.70, 0.60  // Jul-Dec
    ];
    
    const monthly = monthlyDistribution.map((factor, i) => ({
      month: i + 1,
      E_d: (annualEnergyYield * factor) / (30.44 * 12), // Daily average for month
      E_m: (annualEnergyYield * factor) / 12, // Monthly total
      H_sun: 4.5 + factor * 2.5 // Realistic sun hours
    }));

    // Generate realistic hourly data
    const hourly = Array.from({ length: 8760 }, (_, i) => {
      const hour = i % 24;
      const dayOfYear = Math.floor(i / 24);
      const solarNoon = 12;
      const hourFromNoon = Math.abs(hour - solarNoon);
      const seasonalFactor = 0.7 + 0.5 * Math.sin((dayOfYear / 365) * 2 * Math.PI);
      
      return {
        time: new Date(2024, 0, 1, hour).toISOString(),
        P: hourFromNoon <= 6 ? Math.max(0, (peakPower * 1000 * Math.cos((hourFromNoon / 6) * Math.PI / 2) * seasonalFactor)) : 0,
        G_i: hourFromNoon <= 6 ? Math.max(0, (800 * Math.cos((hourFromNoon / 6) * Math.PI / 2) * seasonalFactor)) : 0,
        T_2m: 15 + 12 * Math.sin((dayOfYear / 365) * 2 * Math.PI) + 8 * Math.sin((hour / 24) * 2 * Math.PI)
      };
    });

    return {
      outputs: {
        monthly,
        totals: {
          fixed: {
            E_y: annualEnergyYield,
            PR: 0.84 // Realistic performance ratio for Spain
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
