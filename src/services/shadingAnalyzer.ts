
import { BuildingData } from './buildingAnalyzer';

export interface ShadingData {
  annualShadingFactor: number;
  monthlyShadingFactors: number[]; // 12 months
  hourlyShadingFactors: number[]; // 24 hours average
  nearbyObstructions: Array<{
    id: string;
    distance: number;
    height: number;
    azimuth: number;
    shadingImpact: number;
  }>;
}

export class ShadingAnalyzer {
  private static readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

  // Get nearby buildings and obstacles
  static async getNearbyObstructions(lat: number, lng: number, radius: number = 100): Promise<BuildingData[]> {
    const query = `
      [out:json][timeout:25];
      (
        way["building"](around:${radius},${lat},${lng});
        way["natural"="tree"](around:${radius},${lat},${lng});
        way["barrier"](around:${radius},${lat},${lng});
      );
      out geom;
    `;

    try {
      console.log('Fetching nearby obstructions...');
      
      const response = await fetch(this.OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.elements
        .filter((element: any) => element.geometry && element.geometry.length > 0)
        .map((element: any) => this.processObstruction(element, lat, lng))
        .filter((obstruction: BuildingData | null) => obstruction !== null);
        
    } catch (error) {
      console.error('Error fetching nearby obstructions:', error);
      return [];
    }
  }

  private static processObstruction(element: any, targetLat: number, targetLng: number): BuildingData | null {
    try {
      const geometry = element.geometry.map((point: any) => [point.lon, point.lat]);
      const center = this.calculateCenter(element.geometry);
      const distance = this.calculateDistance(targetLat, targetLng, center[1], center[0]);
      
      // Only consider nearby obstructions
      if (distance > 100) return null; // 100m radius
      
      const tags = element.tags || {};
      const levels = parseInt(tags['building:levels'] || tags.levels || '2');
      const height = parseFloat(tags.height || (levels * 3).toString());
      
      return {
        id: element.id.toString(),
        geometry,
        tags,
        center: [center[0], center[1]],
        height,
        levels
      };
    } catch (error) {
      console.error('Error processing obstruction:', error);
      return null;
    }
  }

  // Calculate shading impact from nearby buildings
  static calculateShadingImpact(
    targetBuilding: BuildingData,
    nearbyBuildings: BuildingData[],
    lat: number
  ): ShadingData {
    console.log('Calculating shading impact for building:', targetBuilding.id);
    
    const obstructions = nearbyBuildings.map(building => {
      const distance = this.calculateDistance(
        targetBuilding.center[1], targetBuilding.center[0],
        building.center[1], building.center[0]
      ) * 1000; // Convert to meters
      
      const azimuth = this.calculateAzimuth(
        targetBuilding.center[1], targetBuilding.center[0],
        building.center[1], building.center[0]
      );
      
      const heightDiff = (building.height || 6) - (targetBuilding.height || 6);
      const elevationAngle = Math.atan(heightDiff / distance) * 180 / Math.PI;
      
      // Calculate shading impact based on solar angles
      const shadingImpact = this.calculateShadingFactor(elevationAngle, azimuth, distance);
      
      return {
        id: building.id,
        distance,
        height: building.height || 6,
        azimuth,
        shadingImpact
      };
    });

    // Calculate monthly shading factors (simplified solar path)
    const monthlyShadingFactors = Array.from({ length: 12 }, (_, month) => {
      const solarDeclination = this.getSolarDeclination(month);
      const maxSolarElevation = 90 - Math.abs(lat - solarDeclination);
      
      // Reduce shading in summer (higher sun), increase in winter
      const seasonalFactor = 0.8 + 0.2 * Math.sin((month / 12) * 2 * Math.PI);
      return Math.max(0.7, Math.min(0.95, seasonalFactor));
    });

    // Calculate hourly shading factors (simplified)
    const hourlyShadingFactors = Array.from({ length: 24 }, (_, hour) => {
      if (hour < 6 || hour > 20) return 0; // No sun
      
      const solarElevation = this.getSolarElevation(hour, lat);
      const baseFactor = Math.max(0.1, Math.min(1.0, solarElevation / 60));
      
      // Apply obstruction effects
      const obstructionFactor = obstructions.reduce((factor, obs) => {
        if (obs.shadingImpact > 0.1) {
          return factor * (1 - obs.shadingImpact * 0.3);
        }
        return factor;
      }, 1.0);
      
      return baseFactor * obstructionFactor;
    });

    const annualShadingFactor = monthlyShadingFactors.reduce((sum, factor) => sum + factor, 0) / 12;

    return {
      annualShadingFactor,
      monthlyShadingFactors,
      hourlyShadingFactors,
      nearbyObstructions: obstructions
    };
  }

  private static calculateCenter(geometry: Array<{lat: number, lon: number}>): [number, number] {
    const sumLat = geometry.reduce((sum, point) => sum + point.lat, 0);
    const sumLng = geometry.reduce((sum, point) => sum + point.lon, 0);
    return [sumLng / geometry.length, sumLat / geometry.length];
  }

  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
  }

  private static calculateAzimuth(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    const azimuth = Math.atan2(y, x) * 180 / Math.PI;
    return (azimuth + 360) % 360;
  }

  private static calculateShadingFactor(elevationAngle: number, azimuth: number, distance: number): number {
    // Simplified shading calculation
    if (elevationAngle <= 0) return 0; // No shading if obstacle is below
    if (distance > 50) return 0; // Ignore distant obstacles
    
    // Higher elevation angles and closer distances = more shading
    const elevationFactor = Math.min(1, elevationAngle / 45); // Max at 45°
    const distanceFactor = Math.max(0, (50 - distance) / 50); // Linear decrease with distance
    
    // Consider azimuth (south-facing obstacles cast more shade)
    const azimuthFactor = azimuth > 90 && azimuth < 270 ? 1 : 0.5; // South side more critical
    
    return elevationFactor * distanceFactor * azimuthFactor * 0.3; // Max 30% shading per obstacle
  }

  private static getSolarDeclination(month: number): number {
    // Simplified solar declination calculation
    const dayOfYear = month * 30; // Approximate
    return 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
  }

  private static getSolarElevation(hour: number, latitude: number): number {
    // Simplified solar elevation for given hour and latitude
    const hourAngle = (hour - 12) * 15; // Degrees from solar noon
    const declination = 23.45 * Math.sin((360 * 172 / 365) * Math.PI / 180); // Average declination
    
    const latRad = latitude * Math.PI / 180;
    const decRad = declination * Math.PI / 180;
    const hourRad = hourAngle * Math.PI / 180;
    
    const elevation = Math.asin(
      Math.sin(latRad) * Math.sin(decRad) +
      Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad)
    ) * 180 / Math.PI;
    
    return Math.max(0, elevation);
  }
}
