
// src/components/common/MapSelector.tsx
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, Search } from 'lucide-react';
import { useLeafletMap } from '../../hooks/useLeafletMap';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleLocationSelectedFromHook = (coordinates: [number, number], address: string) => {
    console.log("MAP_SELECTOR: handleLocationSelectedFromHook (desde hook) llamado con:", { coordinates, address }); // LOG
    setSelectedAddress(address);
    onLocationSelect(coordinates, address); // Propaga al AddressAnalyzer
  };

  const { 
    mapContainer, 
    isLoaded, 
    error: mapError, 
    flyToCoordinates,
    searchAddress: searchAddressFromHook, // Renombrar para evitar conflicto
  } = useLeafletMap({
    initialCoordinates,
    onLocationSelect: handleLocationSelectedFromHook // Conectar con la función de arriba
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
        console.log("MAP_SELECTOR: initialCoordinates cambió, llamando a flyToCoordinates:", initialCoordinates); // LOG
        flyToCoordinates(initialCoordinates);
    }
  }, [initialCoordinates, flyToCoordinates]);


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    console.log("MAP_SELECTOR: handleSearch (botón) llamado con query:", searchQuery); // LOG

    setIsSearching(true);
    try {
      // Usar la función searchAddress del hook useLeafletMap
      const result = await searchAddressFromHook(searchQuery + ', España');
      if (result) {
        console.log("MAP_SELECTOR: Resultado de searchAddressFromHook:", result); // LOG
        // setSelectedAddress y onLocationSelect ya son llamados por el hook a través de handleLocationSelectedFromHook
        setSearchQuery(''); // Limpiar input
        setSearchResults([]); // Limpiar resultados
      } else {
        console.warn('MAP_SELECTOR: No se encontró la dirección (handleSearch).'); // LOG
        alert('No se encontró la dirección. Intenta con una búsqueda más específica.');
      }
    } catch (error) {
      console.error('MAP_SELECTOR: Error en handleSearch:', error); // LOG
      alert('Error en la búsqueda. Inténtalo de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = async (query: string) => {
    setSearchQuery(query);
    console.log("MAP_SELECTOR: handleSearchInput (autocomplete) llamado con query:", query); // LOG
    
    if (query.length > 2) { // Umbral para autocompletar
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', España')}&countrycodes=es&limit=5&addressdetails=1`;
        console.log("MAP_SELECTOR: URL Nominatim (autocomplete):", url); // LOG
        const response = await fetch(url);
        const data = await response.json();
        console.log("MAP_SELECTOR: Respuesta Nominatim (autocomplete):", data); // LOG
        setSearchResults(data || []);
      } catch (error) {
        console.error('MAP_SELECTOR: Error en autocomplete:', error); // LOG
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectSearchResult = (result: any) => {
    console.log("MAP_SELECTOR: selectSearchResult llamado con:", result); // LOG
    // Nominatim devuelve [lon, lat] en sus geometrías, pero .lat y .lon directamente
    const coordinates: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)];
    
    if (flyToCoordinates) {
      flyToCoordinates(coordinates); // Centra el mapa y actualiza el marcador
    }
    // La llamada a onLocationSelect (y setSelectedAddress) ahora se maneja a través del
    // onLocationSelect del hook que se llama cuando el marcador se actualiza o el mapa se hace clic,
    // o desde searchAddressFromHook.
    // Si necesitamos forzar la actualización aquí también:
    // handleLocationSelectedFromHook(coordinates, result.display_name);
    
    setSearchQuery(''); // Limpiar input
    setSearchResults([]); // Limpiar lista de resultados
  };

  const getCurrentLocation = () => {
    console.log("MAP_SELECTOR: getCurrentLocation llamado."); // LOG
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          console.log("MAP_SELECTOR: Ubicación actual obtenida:", coordinates); // LOG
          if (flyToCoordinates) {
            flyToCoordinates(coordinates);
            // La reverse geocodificación y onLocationSelect se manejan dentro del hook
          }
        },
        (geoError) => {
          console.error('MAP_SELECTOR: Error obteniendo ubicación:', geoError); // LOG
          alert('No se pudo obtener tu ubicación. Verifica los permisos del navegador.');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
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
                onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
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
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-gris-hotspot-profundo border border-white/20 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((item, index) => ( // Cambiado 'result' a 'item' para evitar conflicto
                <button
                  key={item.place_id || index} // Usar place_id si está disponible
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors"
                >
                  <p className="text-white text-sm">{item.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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

      <div className="flex space-x-2">
        <button
          onClick={getCurrentLocation}
          className="flex items-center space-x-2 px-4 py-2 bg-cobre-hotspot-plano text-white rounded-xl hover:bg-cobre-hotspot-oscuro transition-colors duration-300"
        >
          <Navigation className="w-4 h-4" />
          <span>Mi ubicación</span>
        </button>
      </div>

      {mapError && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200">{mapError}</p>
        </div>
      )}

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