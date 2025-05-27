
import { RoofSection } from '../types/AdvancedTypes';

export interface BuildingData {
  id: string;
  geometry: Array<[number, number]>; // Polygon coordinates
  tags: Record<string, string>;
  center: [number, number];
  area?: number;
  height?: number;
  levels?: number;
}

export interface RoofAnalysisData {
  building: BuildingData;
  roofArea: number;
  usableArea: number;
  orientation: number;
  averageInclination: number;
  roofSections: Array<{
    id: string;
    area: number;
    orientation: number;
    inclination: number;
    shadingFactor: number;
  }>;
}

export class BuildingAnalyzer {
  private static readonly OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
  
  // Get building data from coordinates using Overpass API
  static async getBuildingAtCoordinates(lat: number, lng: number): Promise<BuildingData | null> {
    const query = `
      [out:json][timeout:25];
      (
        way["building"](around:10,${lat},${lng});
        relation["building"](around:10,${lat},${lng});
      );
      out geom;
    `;

    try {
      console.log('Fetching building data from Overpass API for:', lat, lng);
      
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
      console.log('Overpass API response:', data);

      if (!data.elements || data.elements.length === 0) {
        console.log('No building found at coordinates');
        return null;
      }

      // Find the closest building
      const building = this.findClosestBuilding(data.elements, lat, lng);
      if (!building) return null;

      return this.processBuilding(building);
    } catch (error) {
      console.error('Error fetching building data:', error);
      return null;
    }
  }

  private static findClosestBuilding(elements: any[], targetLat: number, targetLng: number): any | null {
    let closestBuilding = null;
    let minDistance = Infinity;

    for (const element of elements) {
      if (element.type === 'way' && element.geometry) {
        const center = this.calculatePolygonCenter(element.geometry);
        const distance = this.calculateDistance(targetLat, targetLng, center[1], center[0]);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestBuilding = element;
        }
      }
    }

    return closestBuilding;
  }

  private static processBuilding(building: any): BuildingData {
    // Ensure geometry is properly typed as [number, number] tuples
    const geometry: Array<[number, number]> = building.geometry.map((point: any) => [point.lon, point.lat] as [number, number]);
    const center = this.calculatePolygonCenter(building.geometry);
    
    // Extract building properties
    const tags = building.tags || {};
    const levels = parseInt(tags['building:levels'] || tags.levels || '2');
    const height = parseFloat(tags.height || (levels * 3).toString()); // Assume 3m per level

    return {
      id: building.id.toString(),
      geometry,
      tags,
      center: [center[0], center[1]], // [lng, lat]
      area: this.calculatePolygonArea(geometry),
      height,
      levels
    };
  }

  private static calculatePolygonCenter(geometry: Array<{lat: number, lon: number}>): [number, number] {
    const sumLat = geometry.reduce((sum, point) => sum + point.lat, 0);
    const sumLng = geometry.reduce((sum, point) => sum + point.lon, 0);
    return [sumLng / geometry.length, sumLat / geometry.length];
  }

  private static calculatePolygonArea(coordinates: Array<[number, number]>): number {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    
    // Convert to square meters (approximation)
    const earthRadius = 6371000; // meters
    return Math.abs(area) / 2 * (Math.PI / 180) * earthRadius * earthRadius / 1000000; // km² to m²
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

  // Analyze roof characteristics
  static analyzeRoof(building: BuildingData): RoofAnalysisData {
    const roofArea = building.area || 0;
    
    // Calculate roof orientation based on building geometry
    const orientation = this.calculateBuildingOrientation(building.geometry);
    
    // Estimate inclination based on building type
    const averageInclination = this.estimateRoofInclination(building.tags);
    
    // Calculate usable area (accounting for obstacles, edges, etc.)
    const usableArea = roofArea * 0.85; // 85% usable typically
    
    // Create roof sections (simplified to main section for now)
    const roofSections = [
      {
        id: 'main',
        area: usableArea * 0.8,
        orientation: orientation,
        inclination: averageInclination,
        shadingFactor: 0.9 // Will be calculated by ShadingAnalyzer
      },
      {
        id: 'secondary',
        area: usableArea * 0.2,
        orientation: orientation + 180, // Opposite side
        inclination: averageInclination,
        shadingFactor: 0.85
      }
    ];

    return {
      building,
      roofArea,
      usableArea,
      orientation,
      averageInclination,
      roofSections
    };
  }

  private static calculateBuildingOrientation(geometry: Array<[number, number]>): number {
    if (geometry.length < 3) return 180; // Default to south
    
    // Find the longest edge and use its orientation
    let maxLength = 0;
    let orientation = 180;
    
    for (let i = 0; i < geometry.length - 1; i++) {
      const [lng1, lat1] = geometry[i];
      const [lng2, lat2] = geometry[i + 1];
      
      const length = Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2));
      
      if (length > maxLength) {
        maxLength = length;
        // Calculate bearing
        const bearing = Math.atan2(lng2 - lng1, lat2 - lat1) * 180 / Math.PI;
        orientation = (bearing + 360) % 360;
      }
    }
    
    return orientation;
  }

  private static estimateRoofInclination(tags: Record<string, string>): number {
    const roofShape = tags['roof:shape'] || '';
    const buildingType = tags.building || '';
    
    // Estimate based on roof type and building type
    if (roofShape.includes('flat')) return 5;
    if (roofShape.includes('gabled')) return 35;
    if (roofShape.includes('hipped')) return 30;
    if (buildingType === 'house') return 35;
    if (buildingType === 'apartments') return 25;
    
    return 30; // Default inclination for Spain
  }
}
