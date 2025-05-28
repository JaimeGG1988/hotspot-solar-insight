// src/hooks/useLeafletMap.ts
import { useRef, useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MAP_CONFIG = {
  center: [40.4168, -3.7038] as [number, number],
  zoom: 6,
  maxZoom: 19
};

export interface LeafletMapOptions {
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
  initialCoordinates?: [number, number];
}

export const useLeafletMap = (options: LeafletMapOptions = {}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number; display_name: string } | null> => {
    console.log("HOOK_useLeafletMap: geocodeAddress llamado con:", address); // LOG
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=es&limit=1&addressdetails=1`;
      console.log("HOOK_useLeafletMap: URL Nominatim (geocodeAddress):", url); // LOG
      const response = await fetch(url);
      const data = await response.json();
      console.log("HOOK_useLeafletMap: Respuesta Nominatim (geocodeAddress):", data); // LOG
      
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display_name: data[0].display_name
        };
        console.log("HOOK_useLeafletMap: Coordenadas extraídas (geocodeAddress):", result); // LOG
        return result;
      }
      console.warn("HOOK_useLeafletMap: No se encontraron resultados en Nominatim para (geocodeAddress):", address); // LOG
      return null;
    } catch (err) {
      console.error('HOOK_useLeafletMap: Error en geocodeAddress:', err); // LOG
      setError('Error al buscar la dirección.');
      return null;
    }
  }, []);

  const reverseGeocode = useCallback(async (coordinates: [number, number]) => {
    const [lng, lat] = coordinates;
    console.log("HOOK_useLeafletMap: reverseGeocode llamado con coords:", { lat, lng }); // LOG
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=es`;
      console.log("HOOK_useLeafletMap: URL Nominatim (reverseGeocode):", url); // LOG
      const response = await fetch(url);
      const data = await response.json();
      console.log("HOOK_useLeafletMap: Respuesta Nominatim (reverseGeocode):", data); // LOG
      
      if (data && data.display_name) {
        console.log("HOOK_useLeafletMap: Dirección encontrada (reverseGeocode):", data.display_name); // LOG
        options.onLocationSelect?.(coordinates, data.display_name);
      } else {
        console.warn("HOOK_useLeafletMap: No se encontró dirección para (reverseGeocode):", coordinates); // LOG
        options.onLocationSelect?.(coordinates, `${lat.toFixed(5)}, ${lng.toFixed(5)}`); // Fallback a coordenadas
      }
    } catch (err) {
      console.error('HOOK_useLeafletMap: Error en reverseGeocode:', err); // LOG
      options.onLocationSelect?.(coordinates, `${lat.toFixed(5)}, ${lng.toFixed(5)}`); // Fallback a coordenadas en caso de error
    }
  }, [options.onLocationSelect]);

  const updateMarker = useCallback((coordinates: [number, number]) => {
    if (!map.current) return;
    const [lng, lat] = coordinates;
    console.log("HOOK_useLeafletMap: updateMarker con coords:", { lat, lng }); // LOG

    if (marker.current) {
      map.current.removeLayer(marker.current);
    }

    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div style="background-color: #ff6b35; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    marker.current = L.marker([lat, lng], { 
      icon: customIcon,
      draggable: true 
    }).addTo(map.current);

    marker.current.on('dragend', (e: L.DragEndEvent) => {
      const latlng = e.target.getLatLng();
      const newCoordinates: [number, number] = [latlng.lng, latlng.lat];
      console.log("HOOK_useLeafletMap: Marcador arrastrado a:", newCoordinates); // LOG
      reverseGeocode(newCoordinates);
    });
  }, [reverseGeocode]);
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    console.log("HOOK_useLeafletMap: Inicializando mapa..."); // LOG

    try {
      const initialCenter = options.initialCoordinates 
        ? [options.initialCoordinates[1], options.initialCoordinates[0]] as [number, number] 
        : MAP_CONFIG.center;
      const initialZoom = options.initialCoordinates ? 15 : MAP_CONFIG.zoom;

      map.current = L.map(mapContainer.current).setView(initialCenter, initialZoom);

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, Maxar, Earthstar Geographics', maxZoom: MAP_CONFIG.maxZoom
      }).addTo(map.current);
      
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: MAP_CONFIG.maxZoom
      });
      
      L.control.layers({ "Vista Satelital": satelliteLayer, "Mapa de Calles": osmLayer }).addTo(map.current);
      L.control.zoom({ position: 'topright' }).addTo(map.current);

      if (options.initialCoordinates) {
        updateMarker(options.initialCoordinates);
         // Si hay coords iniciales, también obtener la dirección
        reverseGeocode(options.initialCoordinates);
      }

      map.current.on('click', (e: L.LeafletMouseEvent) => {
        const coordinates: [number, number] = [e.latlng.lng, e.latlng.lat];
        console.log("HOOK_useLeafletMap: Clic en mapa en coords:", coordinates); // LOG
        updateMarker(coordinates);
        reverseGeocode(coordinates);
      });

      map.current.on('load', () => setIsLoaded(true));
      setTimeout(() => setIsLoaded(true), 500);
      console.log("HOOK_useLeafletMap: Mapa inicializado."); // LOG

    } catch (err) {
      console.error('HOOK_useLeafletMap: Error inicializando mapa:', err); // LOG
      setError('Error al inicializar el mapa.');
    }

    return () => {
      if (map.current) {
        console.log("HOOK_useLeafletMap: Eliminando mapa."); // LOG
        map.current.remove();
        map.current = null;
      }
    };
  }, [options.initialCoordinates, updateMarker, reverseGeocode]); // updateMarker y reverseGeocode en dependencias

  const flyToCoordinates = useCallback((coordinates: [number, number]) => {
    if (!map.current) return;
    console.log("HOOK_useLeafletMap: flyToCoordinates llamado con:", coordinates); // LOG
    
    const [lng, lat] = coordinates; // Lng es primero en tus coordenadas
    updateMarker(coordinates); // updateMarker espera [lng, lat]
    map.current.flyTo([lat, lng], 15, { duration: 2 }); // Leaflet espera [lat, lng]
  }, [updateMarker]);

  const searchAddress = useCallback(async (address: string) => {
    console.log("HOOK_useLeafletMap: searchAddress (del hook) llamado con:", address); // LOG
    const result = await geocodeAddress(address); // Usa la función interna del hook
    if (result) {
      const coordinates: [number, number] = [result.lng, result.lat]; // Lng, Lat
      flyToCoordinates(coordinates); // flyToCoordinates espera [lng, lat]
      // options.onLocationSelect se llama desde reverseGeocode o desde el clic si no hay búsqueda
      // O si queremos que se llame aquí también para la búsqueda:
      if(options.onLocationSelect) {
        console.log("HOOK_useLeafletMap: Llamando a onLocationSelect desde searchAddress con:", coordinates, result.display_name); //LOG
        options.onLocationSelect(coordinates, result.display_name);
      }
      return result;
    }
    return null;
  }, [geocodeAddress, flyToCoordinates, options.onLocationSelect]);

  return {
    mapContainer,
    map: map.current,
    isLoaded,
    error,
    flyToCoordinates,
    searchAddress, // Esta es la que usa MapSelector
  };
};