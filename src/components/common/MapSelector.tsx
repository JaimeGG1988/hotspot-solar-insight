// src/components/common/MapSelector.tsx
import React, { useState, useEffect } from 'react';
import { useLeafletMap } from '../../hooks/useLeafletMap';
import MapSearch from './MapSearch';
import MapDisplay from './MapDisplay';
import MapInfo from './MapInfo';

interface MapSelectorProps {
  onLocationSelect: (coordinates: [number, number], address: string) => void;
  initialCoordinates?: [number, number];
  initialAddress?: string;
  className?: string;
}

const MapSelector: React.FC<MapSelectorProps> = ({
  onLocationSelect,
  initialCoordinates,
  initialAddress = '',
  className = ''
}) => {
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleLocationSelectedFromHook = (coordinates: [number, number], address: string) => {
    console.log("MAP_SELECTOR: handleLocationSelectedFromHook (desde hook) llamado con:", { coordinates, address });
    setSelectedAddress(address);
    onLocationSelect(coordinates, address);
  };

  const { 
    mapContainer, 
    isLoaded, 
    error: mapError, 
    flyToCoordinates,
    searchAddress: searchAddressFromHook, 
  } = useLeafletMap({
    initialCoordinates,
    onLocationSelect: handleLocationSelectedFromHook
  });

  // Sincronizar selectedAddress si initialAddress cambia
  useEffect(() => {
    if (initialAddress) {
      setSelectedAddress(initialAddress);
    }
  }, [initialAddress]);
  
  // Sincronizar mapa si initialCoordinates cambia
  useEffect(() => {
    if (initialCoordinates && flyToCoordinates) {
        console.log("MAP_SELECTOR: initialCoordinates cambió, llamando a flyToCoordinates:", initialCoordinates);
        flyToCoordinates(initialCoordinates);
    }
  }, [initialCoordinates, flyToCoordinates]);

  const handleSearch = async (query: string) => {
    console.log("MAP_SELECTOR: handleSearch (botón) llamado con query:", query);
    setIsSearching(true);
    try {
      const result = await searchAddressFromHook(query + ', España');
      if (result) {
        console.log("MAP_SELECTOR: Resultado de searchAddressFromHook:", result);
        setSearchResults([]);
      } else {
        console.warn('MAP_SELECTOR: No se encontró la dirección (handleSearch).');
        alert('No se encontró la dirección. Intenta con una búsqueda más específica.');
      }
    } catch (error) {
      console.error('MAP_SELECTOR: Error en handleSearch:', error);
      alert('Error en la búsqueda. Inténtalo de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = async (query: string) => {
    console.log("MAP_SELECTOR: handleSearchInput (autocomplete) llamado con query:", query);
    
    if (query.length > 2) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', España')}&countrycodes=es&limit=5&addressdetails=1`;
        console.log("MAP_SELECTOR: URL Nominatim (autocomplete):", url);
        const response = await fetch(url);
        const data = await response.json();
        console.log("MAP_SELECTOR: Respuesta Nominatim (autocomplete):", data);
        setSearchResults(data || []);
      } catch (error) {
        console.error('MAP_SELECTOR: Error en autocomplete:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: any) => {
    console.log("MAP_SELECTOR: selectSearchResult llamado con:", result);
    const coordinates: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)];
    
    if (flyToCoordinates) {
      flyToCoordinates(coordinates);
    }
    
    setSearchResults([]);
  };

  const getCurrentLocation = () => {
    console.log("MAP_SELECTOR: getCurrentLocation llamado.");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          console.log("MAP_SELECTOR: Ubicación actual obtenida:", coordinates);
          if (flyToCoordinates) {
            flyToCoordinates(coordinates);
          }
        },
        (geoError) => {
          console.error('MAP_SELECTOR: Error obteniendo ubicación:', geoError);
          alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <MapSearch
        onSearch={handleSearch}
        onSearchInputChange={handleSearchInput}
        searchResults={searchResults}
        onSelectResult={selectSearchResult}
        isSearching={isSearching}
      />

      <MapDisplay
        mapContainer={mapContainer}
        isLoaded={isLoaded}
        error={mapError}
        selectedAddress={selectedAddress}
        onGetCurrentLocation={getCurrentLocation}
      />
      
      <MapInfo />
    </div>
  );
};

export default MapSelector;
