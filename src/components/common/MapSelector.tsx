
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, Search } from 'lucide-react';
import { useLeafletMap } from '../../hooks/useLeafletMap';

interface MapSelectorProps {
  onLocationSelect: (coordinates: [number, number], address: string) => void;
  initialCoordinates?: [number, number];
  initialAddress?: string;
  className?: string;
  showTokenInput?: boolean;
}

const MapSelector: React.FC<MapSelectorProps> = ({
  onLocationSelect,
  initialCoordinates,
  initialAddress = '',
  className = ''
}) => {
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const { 
    mapContainer, 
    isLoaded, 
    error: mapError, 
    flyToCoordinates,
    searchAddress,
    geocodeAddress
  } = useLeafletMap({
    initialCoordinates,
    onLocationSelect: (coordinates, address) => {
      setSelectedAddress(address);
      onLocationSelect(coordinates, address);
    }
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const result = await searchAddress(searchQuery + ', España');
      if (result) {
        setSelectedAddress(result.display_name);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        alert('No se encontró la dirección. Intenta con una búsqueda más específica.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Error en la búsqueda. Inténtalo de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length > 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', España')}&countrycodes=es&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setSearchResults(data || []);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: any) => {
    const coordinates: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)];
    flyToCoordinates(coordinates);
    setSelectedAddress(result.display_name);
    setSearchQuery('');
    setSearchResults([]);
    onLocationSelect(coordinates, result.display_name);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          flyToCoordinates(coordinates);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Buscador de direcciones */}
      <div className="space-y-4">
        <label className="block text-lg font-semibold text-white">
          Buscar dirección
        </label>
        
        <div className="relative">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Escribe una dirección en España..."
                className="input-premium w-full pr-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gris-hotspot-medio" />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="btn-premium px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-gris-hotspot-profundo border border-white/20 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectSearchResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors"
                >
                  <p className="text-white text-sm">{result.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dirección seleccionada */}
      {selectedAddress && (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-4">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-cobre-hotspot-claro flex-shrink-0" />
            <div>
              <p className="text-sm text-gris-hotspot-medio">Dirección seleccionada:</p>
              <p className="text-white font-medium">{selectedAddress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Controles adicionales */}
      <div className="flex space-x-2">
        <button
          onClick={getCurrentLocation}
          className="flex items-center space-x-2 px-4 py-2 bg-cobre-hotspot-plano text-white rounded-xl hover:bg-cobre-hotspot-oscuro transition-colors duration-300"
        >
          <Navigation className="w-4 h-4" />
          <span>Mi ubicación</span>
        </button>
      </div>

      {/* Error del mapa */}
      {mapError && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200">{mapError}</p>
        </div>
      )}

      {/* Contenedor del mapa */}
      <div className="space-y-2">
        <label className="block text-lg font-semibold text-white">
          Selecciona la ubicación en el mapa
        </label>
        <div 
          ref={mapContainer} 
          className="h-96 w-full rounded-xl border border-white/20 bg-gris-hotspot-profundo overflow-hidden"
        >
          {!isLoaded && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 border-2 border-cobre-hotspot-plano/30 border-t-cobre-hotspot-plano rounded-full animate-spin"></div>
                <p className="text-gris-hotspot-medio">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-sm text-gris-hotspot-medio">
          Haz clic en el mapa, busca una dirección o arrastra el marcador para seleccionar la ubicación
        </p>
      </div>

      {/* Información sobre el nuevo mapa */}
      <div className="bg-green-500/30 border border-green-500/50 rounded-xl p-6">
        <h4 className="font-semibold text-white mb-3">🗺️ Nuevo Mapa Gratuito con React-Leaflet:</h4>
        <ul className="space-y-2 text-sm text-gris-hotspot-medio">
          <li>• <strong>100% Gratuito:</strong> Sin límites de uso ni tokens necesarios</li>
          <li>• <strong>Vista Satelital:</strong> Perfecta para análisis de tejados</li>
          <li>• <strong>Búsqueda Inteligente:</strong> Encuentra cualquier dirección en España</li>
          <li>• <strong>Geolocalización:</strong> Usa tu ubicación actual automáticamente</li>
          <li>• <strong>Marcador Arrastrable:</strong> Ajusta la posición con precisión</li>
          <li>• <strong>OpenStreetMap + Esri:</strong> Datos precisos y actualizados</li>
        </ul>
      </div>
    </div>
  );
};

export default MapSelector;
