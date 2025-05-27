
import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

// Configuración de Mapbox
const MAPBOX_CONFIG = {
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [-3.7038, 40.4168] as [number, number], // Madrid como centro por defecto
  zoom: 6,
  language: 'es'
};

export interface MapboxOptions {
  onLocationSelect?: (coordinates: [number, number], address: string) => void;
  initialCoordinates?: [number, number];
  showSearch?: boolean;
  showGeolocation?: boolean;
}

export const useMapbox = (options: MapboxOptions = {}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const geocoder = useRef<MapboxGeocoder | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Inicializar el mapa
  useEffect(() => {
    if (!mapContainer.current || map.current || !accessToken) return;

    try {
      mapboxgl.accessToken = accessToken;

      // Crear el mapa
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_CONFIG.style,
        center: options.initialCoordinates || MAPBOX_CONFIG.center,
        zoom: options.initialCoordinates ? 15 : MAPBOX_CONFIG.zoom,
        language: MAPBOX_CONFIG.language
      });

      // Añadir controles de navegación
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Añadir control de geolocalización si está habilitado
      if (options.showGeolocation) {
        map.current.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
          }),
          'top-right'
        );
      }

      // Añadir geocoder si está habilitado
      if (options.showSearch) {
        geocoder.current = new MapboxGeocoder({
          accessToken: mapboxgl.accessToken,
          mapboxgl: mapboxgl,
          countries: 'es',
          language: 'es',
          placeholder: 'Buscar dirección...',
          proximity: MAPBOX_CONFIG.center
        });

        map.current.addControl(geocoder.current, 'top-left');

        // Escuchar eventos del geocoder
        geocoder.current.on('result', (e) => {
          const coordinates = e.result.center as [number, number];
          const address = e.result.place_name;
          updateMarker(coordinates);
          options.onLocationSelect?.(coordinates, address);
        });
      }

      // Crear marcador inicial
      if (options.initialCoordinates) {
        updateMarker(options.initialCoordinates);
      }

      // Click en el mapa para colocar marcador
      map.current.on('click', (e) => {
        const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        updateMarker(coordinates);
        reverseGeocode(coordinates);
      });

      map.current.on('load', () => {
        setIsLoaded(true);
      });

    } catch (err) {
      console.error('Error initializing Mapbox:', err);
      setError('Error al inicializar el mapa. Verifica tu token de Mapbox.');
    }

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
      geocoder.current = null;
    };
  }, [accessToken, options.initialCoordinates, options.showSearch, options.showGeolocation]);

  const updateMarker = (coordinates: [number, number]) => {
    if (!map.current) return;

    // Remover marcador existente
    if (marker.current) {
      marker.current.remove();
    }

    // Crear nuevo marcador
    marker.current = new mapboxgl.Marker({
      color: '#ff6b35',
      draggable: true
    })
      .setLngLat(coordinates)
      .addTo(map.current);

    // Centrar mapa en el marcador
    map.current.flyTo({
      center: coordinates,
      zoom: 15,
      duration: 1000
    });

    // Escuchar eventos de arrastre del marcador
    marker.current.on('dragend', () => {
      const lngLat = marker.current!.getLngLat();
      const newCoordinates: [number, number] = [lngLat.lng, lngLat.lat];
      reverseGeocode(newCoordinates);
    });
  };

  const reverseGeocode = async (coordinates: [number, number]) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${accessToken}&language=es&country=es`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        options.onLocationSelect?.(coordinates, address);
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const flyToCoordinates = (coordinates: [number, number]) => {
    if (!map.current) return;
    
    updateMarker(coordinates);
    map.current.flyTo({
      center: coordinates,
      zoom: 15,
      duration: 2000
    });
  };

  const setMapboxToken = (token: string) => {
    setAccessToken(token);
    setError(null);
  };

  return {
    mapContainer,
    map: map.current,
    isLoaded,
    error,
    flyToCoordinates,
    setMapboxToken,
    updateMarker
  };
};
