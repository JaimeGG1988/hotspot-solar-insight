
import React from 'react';

const MapInfo: React.FC = () => {
  return (
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
  );
};

export default MapInfo;
