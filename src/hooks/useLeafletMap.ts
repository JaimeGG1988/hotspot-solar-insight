
import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Configuración del mapa
const MAP_CONFIG = {
  center: [40.4168, -3.7038] as [number, number], // Madrid como centro por defecto
  zoom: 6,
  maxZoom: 19
};

export interface LeafletMapOptions {
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
  initialCoordinates?: [number, number];
  showSearch?: boolean;
  showGeolocation?: boolean;
}

export const useLeafletMap = (options: LeafletMapOptions = {}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geocodificación con Nominatim (gratuita)
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number; display_name: string } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=es&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Geocodificación inversa
  const reverseGeocode = async (coordinates: [number, number]) => {
    try {
      const [lng, lat] = coordinates;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=es`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        options.onLocationSelect?.(coordinates, data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Inicializar el mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Crear el mapa
      const initialCenter = options.initialCoordinates ? 
        [options.initialCoordinates[1], options.initialCoordinates[0]] as [number, number] : 
        MAP_CONFIG.center;
      
      const initialZoom = options.initialCoordinates ? 15 : MAP_CONFIG.zoom;

      map.current = L.map(mapContainer.current).setView(initialCenter, initialZoom);

      // Añadir capas de mapas
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, Maxar, Earthstar Geographics',
        maxZoom: 19
      });

      // Añadir capa por defecto (satelital para análisis de tejados)
      satelliteLayer.addTo(map.current);

      // Control de capas
      const baseMaps = {
        "Vista Satelital": satelliteLayer,
        "Mapa de Calles": osmLayer
      };

      L.control.layers(baseMaps).addTo(map.current);

      // Control de zoom
      L.control.zoom({ position: 'topright' }).addTo(map.current);

      // Crear marcador inicial
      if (options.initialCoordinates) {
        updateMarker(options.initialCoordinates);
      }

      // Click en el mapa para colocar marcador
      map.current.on('click', (e: L.LeafletMouseEvent) => {
        const coordinates: [number, number] = [e.latlng.lng, e.latlng.lat];
        updateMarker(coordinates);
        reverseGeocode(coordinates);
      });

      map.current.on('load', () => {
        setIsLoaded(true);
      });

      // Marcar como cargado después de un breve delay
      setTimeout(() => setIsLoaded(true), 500);

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error al inicializar el mapa.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        marker.current = null;
      }
    };
  }, [options.initialCoordinates]);

  const updateMarker = (coordinates: [number, number]) => {
    if (!map.current) return;

    const [lng, lat] = coordinates;

    // Remover marcador existente
    if (marker.current) {
      map.current.removeLayer(marker.current);
    }

    // Crear nuevo marcador personalizado
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background-color: #ff6b35; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Crear nuevo marcador
    marker.current = L.marker([lat, lng], { 
      icon: customIcon,
      draggable: true 
    }).addTo(map.current);

    // Centrar mapa en el marcador
    map.current.flyTo([lat, lng], 15, { duration: 1 });

    // Escuchar eventos de arrastre del marcador
    marker.current.on('dragend', (e: L.DragEndEvent) => {
      const latlng = e.target.getLatLng();
      const newCoordinates: [number, number] = [latlng.lng, latlng.lat];
      reverseGeocode(newCoordinates);
    });
  };

  const flyToCoordinates = (coordinates: [number, number]) => {
    if (!map.current) return;
    
    updateMarker(coordinates);
    const [lng, lat] = coordinates;
    map.current.flyTo([lat, lng], 15, { duration: 2 });
  };

  const searchAddress = async (address: string) => {
    const result = await geocodeAddress(address);
    if (result) {
      const coordinates: [number, number] = [result.lng, result.lat];
      updateMarker(coordinates);
      options.onLocationSelect?.(coordinates, result.display_name);
      return result;
    }
    return null;
  };

  return {
    mapContainer,
    map: map.current,
    isLoaded,
    error,
    flyToCoordinates,
    updateMarker,
    searchAddress,
    geocodeAddress,
    reverseGeocode
  };
};
