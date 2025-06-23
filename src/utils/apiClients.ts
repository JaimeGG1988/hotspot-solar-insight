// src/utils/apiClients.ts
import { GooglePlacesResponse, GooglePlacesResult, PVGISResponse, ClimateData, ConsumptionProfileData } from '../types/ApiTypes';

// API configuration
const API_CONFIG = {
  GOOGLE_PLACES_KEY: 'YOUR_GOOGLE_PLACES_API_KEY',
  PVGIS_PROXY_URL: '/api/pvgis',
  NOMINATIM_URL: 'https://nominatim.openstreetmap.org',
  RATE_LIMIT_DELAY: 1000
};

const cache = new Map<string, any>();
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
  static async searchAddresses(query: string): Promise<GooglePlacesResponse> {
    console.log("API_CLIENT: searchAddresses llamado con query:", query); // LOG AÑADIDO
    const cacheKey = `places_${query}`;
    if (cache.has(cacheKey)) {
      console.log("API_CLIENT: Devolviendo desde caché para searchAddresses:", query); // LOG AÑADIDO
      return cache.get(cacheKey);
    }

    try {
      await rateLimit();
      
      const url = `${API_CONFIG.NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=es&limit=5&addressdetails=1`;
      console.log("API_CLIENT: URL de Nominatim construida (searchAddresses):", url); // LOG AÑADIDO
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("API_CLIENT: Error en respuesta de Nominatim (searchAddresses):", response.status, response.statusText); // LOG AÑADIDO
        throw new Error(`API Error: ${response.status}`);
      }
      
      const nominatimResults = await response.json();
      console.log("API_CLIENT: Respuesta cruda de Nominatim (searchAddresses):", nominatimResults); // LOG AÑADIDO
      
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

      console.log("API_CLIENT: Datos formateados (searchAddresses):", googlePlacesFormat); // LOG AÑADIDO
      cache.set(cacheKey, googlePlacesFormat);
      return googlePlacesFormat;
    } catch (error) {
      console.error('API_CLIENT: Error en searchAddresses:', error); // LOG MODIFICADO
      throw error;
    }
  }

  static async getAddressDetails(placeId: string): Promise<GooglePlacesResult> {
    console.log("API_CLIENT: getAddressDetails llamado con placeId:", placeId); // LOG AÑADIDO
    const cacheKey = `address_${placeId}`;
    if (cache.has(cacheKey)) {
      console.log("API_CLIENT: Devolviendo desde caché para getAddressDetails:", placeId); // LOG AÑADIDO
      return cache.get(cacheKey);
    }

    try {
      await rateLimit();
      
      const url = `${API_CONFIG.NOMINATIM_URL}/lookup?osm_ids=N${placeId}&format=json&addressdetails=1`;
      console.log("API_CLIENT: URL de Nominatim construida (getAddressDetails):", url); // LOG AÑADIDO
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("API_CLIENT: Error en respuesta de Nominatim (getAddressDetails):", response.status, response.statusText); // LOG AÑADIDO
        throw new Error(`API Error: ${response.status}`);
      }
      
      const results = await response.json();
      console.log("API_CLIENT: Respuesta cruda de Nominatim (getAddressDetails):", results); // LOG AÑADIDO
      const result = results[0];
      
      if (!result) {
        console.error('API_CLIENT: Dirección no encontrada para placeId:', placeId); // LOG AÑADIDO
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
      console.log("API_CLIENT: Datos formateados (getAddressDetails):", googlePlacesResult); // LOG AÑADIDO
      cache.set(cacheKey, googlePlacesResult);
      return googlePlacesResult;
    } catch (error) {
      console.error('API_CLIENT: Error en getAddressDetails:', error); // LOG MODIFICADO
      throw error;
    }
  }

  static async getSolarData(lat: number, lng: number, peakPower: number = 1, angle: number = 35, aspect: number = 0): Promise<PVGISResponse> {
    const cacheKey = `pvgis_${lat.toFixed(4)}_${lng.toFixed(4)}_${peakPower}_${angle}_${aspect}`;
    if (cache.has(cacheKey)) {
      console.log('API_CLIENT: Usando PVGIS data cacheada para:', lat, lng);
      return cache.get(cacheKey);
    }

    try {
      await rateLimit();
      console.log('API_CLIENT: Obteniendo datos REALES de PVGIS via proxy para coordenadas:', lat, lng, 'con ángulo:', angle);
      const proxyUrl = `${API_CONFIG.PVGIS_PROXY_URL}?lat=${lat}&lng=${lng}&peakpower=${peakPower}&angle=${angle}&aspect=${aspect}`;
      console.log('API_CLIENT: PVGIS Proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`API_CLIENT: PVGIS Proxy Error: ${response.status}, usando fallback data. ErrorData:`, errorData);
        
        // Asumiendo que tu proxy puede devolver una propiedad 'fallback'
        if (errorData.fallback || response.status === 404 || response.status === 500) { 
          return ApiClient.getEnhancedFallbackPVGISData(lat, lng, peakPower, angle);
        }
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API_CLIENT: Datos REALES de PVGIS recibidos via proxy:', data);
      
      if (!data.outputs || !data.outputs.totals || !data.outputs.totals.fixed) {
        console.warn('API_CLIENT: Estructura de respuesta PVGIS inválida desde proxy, usando enhanced fallback');
        return ApiClient.getEnhancedFallbackPVGISData(lat, lng, peakPower, angle);
      }
      
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('API_CLIENT: Error obteniendo datos PVGIS via proxy:', error);
      console.log('API_CLIENT: Usando enhanced fallback data para España');
      return ApiClient.getEnhancedFallbackPVGISData(lat, lng, peakPower, angle);
    }
  }

  static async getOptimalSolarData(lat: number, lng: number, peakPower: number = 1): Promise<{
    optimal: PVGISResponse;
    angle: number;
    allAngles: Array<{ angle: number; energyYield: number; data: PVGISResponse }>;
  }> {
    const angles = [20, 25, 30, 35, 40, 45];
    const results = [];
    console.log('API_CLIENT: Probando múltiples ángulos para datos solares óptimos via proxy...');
    
    for (const angle of angles) {
      try {
        const data = await this.getSolarData(lat, lng, peakPower, angle); // Reusa getSolarData
        if (data && data.outputs && data.outputs.totals && data.outputs.totals.fixed && typeof data.outputs.totals.fixed.E_y === 'number') {
          const energyYield = data.outputs.totals.fixed.E_y;
          results.push({ angle, energyYield, data });
          console.log(`API_CLIENT: Ángulo ${angle}°: ${energyYield.toFixed(0)} kWh/kWp/año`);
        } else {
          console.warn(`API_CLIENT: Datos inválidos o faltantes para el ángulo ${angle}°`);
        }
        // await new Promise(resolve => setTimeout(resolve, 500)); // Eliminado - rateLimit en getSolarData debería ser suficiente
      } catch (error) {
        console.error(`API_CLIENT: Error probando ángulo ${angle}:`, error);
      }
    }
    
    if (results.length === 0) {
      console.warn("API_CLIENT: No se obtuvieron resultados para ningún ángulo, usando fallback para ángulo 35°");
      const fallbackData = await this.getSolarData(lat, lng, peakPower, 35); // Usará fallback si falla
      return { optimal: fallbackData, angle: 35, allAngles: [] };
    }
    
    const optimal = results.reduce((best, current) => 
      current.energyYield > best.energyYield ? current : best
    );
    console.log(`API_CLIENT: Ángulo óptimo: ${optimal.angle}° con ${optimal.energyYield.toFixed(0)} kWh/kWp/año`);
    
    return {
      optimal: optimal.data,
      angle: optimal.angle,
      allAngles: results
    };
  }

  static getEnhancedFallbackPVGISData(lat: number, lng: number, peakPower: number = 1, angle: number = 35): PVGISResponse {
    console.warn('API_CLIENT: Usando enhanced fallback PVGIS data con promedios solares españoles para:', {lat, lng, peakPower, angle});
    
    const getSpanishHSP = (latitude: number): number => {
      if (latitude >= 43) return 1200;
      if (latitude >= 41) return 1400;
      if (latitude >= 39) return 1550;
      if (latitude >= 37) return 1650;
      return 1750;
    };
    
    const baseHSP = getSpanishHSP(lat);
    const angleOptimizationFactor = 1 - Math.abs(angle - 35) * 0.008;
    const annualEnergyYield = baseHSP * angleOptimizationFactor * peakPower; // Multiplicar por peakPower
    
    const monthlyDistribution = [0.65,0.75,0.90,1.10,1.25,1.35,1.40,1.35,1.15,0.95,0.70,0.60];
    
    const monthly = monthlyDistribution.map((factor, i) => ({
      month: i + 1,
      E_d: (annualEnergyYield * factor) / (30.44 * 12),
      E_m: (annualEnergyYield * factor) / 12,
      H_sun: 4.5 + factor * 2.5
    }));

    const hourly = Array.from({ length: 8760 }, (_, i) => {
      const hour = i % 24;
      const dayOfYear = Math.floor(i / 24);
      const solarNoon = 12;
      const hourFromNoon = Math.abs(hour - solarNoon);
      // Factor estacional más pronunciado para latitudes medias y altas
      const seasonalFactor = 0.6 + 0.6 * Math.cos(((dayOfYear - 172) / 365) * 2 * Math.PI); // Pico en verano, mínimo en invierno
      
      return {
        time: new Date(2024, 0, 1 + dayOfYear, hour).toISOString(), // Fecha correcta
        P: hourFromNoon <= 7 ? Math.max(0, (peakPower * 1000 * Math.pow(Math.cos((hourFromNoon / 7) * Math.PI / 2), 1.5) * seasonalFactor)) : 0,
        G_i: hourFromNoon <= 7 ? Math.max(0, (1000 * Math.pow(Math.cos((hourFromNoon / 7) * Math.PI / 2), 1.5) * seasonalFactor)) : 0, // Irradiación pico 1000 W/m^2
        T_2m: 15 + 10 * Math.sin(((dayOfYear - 100) / 365) * 2 * Math.PI) + 5 * Math.sin((hour / 24) * 2 * Math.PI) // Variación de temperatura
      };
    });

    return {
      outputs: {
        monthly,
        totals: { fixed: { E_y: annualEnergyYield, PR: 0.82 } }, // PR ligeramente ajustado
        hourly
      }
    };
  }

  static async getConsumptionProfile(provinceCode: string): Promise<ConsumptionProfileData> {
    const cacheKey = `consumption_${provinceCode}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const spanishProvinces: Record<string, ConsumptionProfileData> = {
      'default': {
        provinceCode,
        averageConsumption: { residential: 3500, withAC: 4200, withHeating: 4800, withEV: 5000 },
        hourlyProfile: [0.3,0.25,0.22,0.2,0.18,0.2,0.3,0.5,0.7,0.8,0.9,1.0,1.1,1.0,0.9,0.8,0.9,1.2,1.5,1.8,1.6,1.2,0.8,0.5],
        monthlyProfile: [1.1,1.0,0.9,0.8,0.7,0.8,1.2,1.3,0.9,0.8,1.0,1.2]
      }
    };
    const profile = spanishProvinces[provinceCode] || spanishProvinces['default'];
    cache.set(cacheKey, profile);
    return profile;
  }

  static clearCache(): void {
    console.log("API_CLIENT: Limpiando caché"); // LOG AÑADIDO
    cache.clear();
  }
}
