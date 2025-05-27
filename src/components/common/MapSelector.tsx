
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useMapbox } from '../../hooks/useMapbox';

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
  className = '',
  showTokenInput = true
}) => {
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const { 
    mapContainer, 
    isLoaded, 
    error: mapError, 
    setMapboxToken: setToken,
    flyToCoordinates 
  } = useMapbox({
    initialCoordinates,
    showSearch: !!mapboxToken,
    showGeolocation: !!mapboxToken,
    onLocationSelect: (coordinates, address) => {
      setSelectedAddress(address);
      onLocationSelect(coordinates, address);
    }
  });

  // Cargar token desde localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
      setToken(savedToken);
    }
  }, [setToken]);

  const handleTokenSubmit = () => {
    if (!mapboxToken.trim()) {
      setTokenError('Por favor introduce tu token de Mapbox');
      return;
    }

    if (!mapboxToken.startsWith('pk.')) {
      setTokenError('El token debe comenzar con "pk."');
      return;
    }

    localStorage.setItem('mapbox_token', mapboxToken);
    setToken(mapboxToken);
    setTokenError(null);
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

  if (!mapboxToken && showTokenInput) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-gradient-to-r from-azul-hotspot/20 to-cobre-hotspot-plano/20 border border-cobre-hotspot-plano/30 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="w-6 h-6 text-cobre-hotspot-claro" />
            <h3 className="text-xl font-semibold text-white">Configurar Mapbox</h3>
          </div>
          
          <p className="text-gris-hotspot-medio mb-4">
            Para usar el mapa interactivo, necesitas un token de Mapbox. Es gratuito hasta 50,000 cargas por mes.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gris-hotspot-medio mb-2">
                Token de Mapbox
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjam..."
                  className="input-premium w-full pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="p-2 text-gris-hotspot-medio hover:text-white transition-colors"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {tokenError && (
                <p className="text-red-400 text-sm mt-1">{tokenError}</p>
              )}
            </div>
            
            <button
              onClick={handleTokenSubmit}
              className="btn-premium w-full"
            >
              Activar Mapa Interactivo
            </button>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">¿Cómo obtener tu token?</h4>
              <ol className="text-sm text-gris-hotspot-medio space-y-1">
                <li>1. Ve a <a href="https://account.mapbox.com/" target="_blank" rel="noopener" className="text-cobre-hotspot-claro hover:underline">mapbox.com</a></li>
                <li>2. Crea una cuenta gratuita</li>
                <li>3. Ve a la sección "Tokens"</li>
                <li>4. Copia tu "Default public token"</li>
                <li>5. Pégalo arriba y activa el mapa</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
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
        
        <button
          onClick={() => {
            localStorage.removeItem('mapbox_token');
            setMapboxToken('');
            setToken('');
          }}
          className="px-4 py-2 border border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors duration-300"
        >
          Cambiar token
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
          {!isLoaded && mapboxToken && (
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
    </div>
  );
};

export default MapSelector;
