
import React from 'react';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

interface MapDisplayProps {
  mapContainer: React.RefObject<HTMLDivElement>;
  isLoaded: boolean;
  error: string | null;
  selectedAddress: string;
  onGetCurrentLocation: () => void;
}

const MapDisplay: React.FC<MapDisplayProps> = ({
  mapContainer,
  isLoaded,
  error,
  selectedAddress,
  onGetCurrentLocation
}) => {
  return (
    <div className="space-y-4">
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
          onClick={onGetCurrentLocation}
          className="flex items-center space-x-2 px-4 py-2 bg-cobre-hotspot-plano text-white rounded-xl hover:bg-cobre-hotspot-oscuro transition-colors duration-300"
        >
          <Navigation className="w-4 h-4" />
          <span>Mi ubicación</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-200">{error}</p>
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
    </div>
  );
};

export default MapDisplay;
