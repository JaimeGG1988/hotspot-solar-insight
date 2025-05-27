
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';
import { CalculadoraData, Orientacion } from '../../types/CalculadoraTypes';

interface PasoInstalacionProps {
  data: CalculadoraData;
  updateData: (data: Partial<CalculadoraData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PasoInstalacion: React.FC<PasoInstalacionProps> = ({ 
  data, 
  updateData, 
  onNext, 
  onPrev, 
  isLoading, 
  setIsLoading 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [searchAddress, setSearchAddress] = useState(data.instalacion.ubicacion);

  // Inicializar mapa
  useEffect(() => {
    if (mapRef.current && !map && typeof window !== 'undefined' && (window as any).L) {
      const L = (window as any).L;
      
      const newMap = L.map(mapRef.current).setView(
        [data.instalacion.latitud, data.instalacion.longitud], 
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(newMap);

      const newMarker = L.marker([data.instalacion.latitud, data.instalacion.longitud], {
        draggable: true
      }).addTo(newMap);

      newMarker.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        updateData({
          instalacion: {
            ...data.instalacion,
            latitud: position.lat,
            longitud: position.lng
          }
        });
        reverseGeocode(position.lat, position.lng);
      });

      newMap.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        newMarker.setLatLng([lat, lng]);
        updateData({
          instalacion: {
            ...data.instalacion,
            latitud: lat,
            longitud: lng
          }
        });
        reverseGeocode(lat, lng);
      });

      setMap(newMap);
      setMarker(newMarker);
    }
  }, []);

  // Actualizar posición del marcador cuando cambien las coordenadas
  useEffect(() => {
    if (map && marker) {
      marker.setLatLng([data.instalacion.latitud, data.instalacion.longitud]);
      map.setView([data.instalacion.latitud, data.instalacion.longitud], 13);
    }
  }, [data.instalacion.latitud, data.instalacion.longitud, map, marker]);

  const searchLocation = async () => {
    if (!searchAddress.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        updateData({
          instalacion: {
            ...data.instalacion,
            latitud: parseFloat(lat),
            longitud: parseFloat(lon),
            ubicacion: display_name
          }
        });
        setSearchAddress(display_name);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const result = await response.json();

      if (result.display_name) {
        updateData({
          instalacion: {
            ...data.instalacion,
            ubicacion: result.display_name
          }
        });
        setSearchAddress(result.display_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          updateData({
            instalacion: {
              ...data.instalacion,
              latitud: lat,
              longitud: lng
            }
          });
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const validateAndNext = async () => {
    const newErrors: string[] = [];

    if (!data.instalacion.ubicacion.trim()) {
      newErrors.push('Debe seleccionar una ubicación');
    }

    if (data.instalacion.inclinacion < 0 || data.instalacion.inclinacion > 90) {
      newErrors.push('La inclinación debe estar entre 0° y 90°');
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      try {
        setIsLoading(true);
        
        // Llamar al backend para obtener recomendaciones
        const payload = {
          tipoCliente: 'residencial',
          tipoEntradaConsumo: data.consumo.tipoEntrada,
          consumoAnual: data.consumo.consumoAnual,
          consumosMensuales: data.consumo.consumosMensuales,
          tipoPerfilUsuario: data.consumo.perfilUsuario,
          tieneVE: data.consumo.tieneVE,
          tieneBombaCalor: data.consumo.tieneBombaCalor,
          nombreArchivoCSV: data.consumo.nombreArchivoCSV,
          ubicacion: data.instalacion.ubicacion,
          latitud: data.instalacion.latitud,
          longitud: data.instalacion.longitud,
          orientacion: data.instalacion.orientacion,
          inclinacion: data.instalacion.inclinacion
        };

        // Simular llamada al backend (reemplazar con llamada real)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Datos simulados de respuesta
        const recomendaciones = {
          ppico_recomendada_kwp: 4.5,
          pinversor_recomendado_kw: 4.0
        };

        updateData({
          tecnico: {
            ...data.tecnico,
            potenciaPicoRecomendada: recomendaciones.ppico_recomendada_kwp,
            potenciaInversorRecomendada: recomendaciones.pinversor_recomendado_kw
          }
        });

        onNext();
      } catch (error) {
        console.error('Error getting recommendations:', error);
        newErrors.push('Error al obtener recomendaciones del sistema');
        setErrors(newErrors);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="card-premium animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cobre-hotspot-claro to-cobre-hotspot-plano flex items-center justify-center animate-float">
          <MapPin className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Ubicación e Instalación
        </h2>
        <p className="text-gris-hotspot-medio">
          Selecciona la ubicación exacta y configura los parámetros de tu instalación solar
        </p>
      </div>

      <div className="space-y-6">
        {/* Búsqueda de ubicación */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-white">
            Ubicación de la instalación
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Introduce dirección o ciudad"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="input-premium flex-1"
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
            />
            <button
              onClick={searchLocation}
              className="px-4 py-3 bg-cobre-hotspot-plano text-white rounded-xl hover:bg-cobre-hotspot-oscuro transition-colors duration-300"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={getCurrentLocation}
              className="px-4 py-3 bg-gris-hotspot-profundo text-white rounded-xl hover:bg-gris-hotspot-medio transition-colors duration-300"
              title="Usar mi ubicación actual"
            >
              <Navigation className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mapa */}
        <div className="space-y-2">
          <label className="block text-lg font-semibold text-white">
            Selecciona la ubicación exacta en el mapa
          </label>
          <div 
            ref={mapRef} 
            className="h-64 w-full rounded-xl border border-white/20 bg-gris-hotspot-profundo"
            style={{ minHeight: '300px' }}
          >
            <div className="flex items-center justify-center h-full text-gris-hotspot-medio">
              Cargando mapa...
            </div>
          </div>
          <p className="text-sm text-gris-hotspot-medio">
            Haz clic en el mapa o arrastra el marcador para ajustar la ubicación
          </p>
        </div>

        {/* Coordenadas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gris-hotspot-medio mb-1">
              Latitud
            </label>
            <input
              type="number"
              value={data.instalacion.latitud.toFixed(6)}
              onChange={(e) => updateData({
                instalacion: {
                  ...data.instalacion,
                  latitud: parseFloat(e.target.value) || 0
                }
              })}
              className="input-premium"
              step="0.000001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gris-hotspot-medio mb-1">
              Longitud
            </label>
            <input
              type="number"
              value={data.instalacion.longitud.toFixed(6)}
              onChange={(e) => updateData({
                instalacion: {
                  ...data.instalacion,
                  longitud: parseFloat(e.target.value) || 0
                }
              })}
              className="input-premium"
              step="0.000001"
            />
          </div>
        </div>

        {/* Configuración de paneles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-semibold text-white mb-4">
              Orientación de los paneles
            </label>
            <select
              value={data.instalacion.orientacion}
              onChange={(e) => updateData({
                instalacion: {
                  ...data.instalacion,
                  orientacion: e.target.value as Orientacion
                }
              })}
              className="input-premium"
            >
              <option value={Orientacion.SUR}>Sur (Óptima)</option>
              <option value={Orientacion.SURESTE}>Sureste</option>
              <option value={Orientacion.SUROESTE}>Suroeste</option>
              <option value={Orientacion.ESTE}>Este</option>
              <option value={Orientacion.OESTE}>Oeste</option>
            </select>
          </div>

          <div>
            <label className="block text-lg font-semibold text-white mb-4">
              Inclinación de los paneles (°)
            </label>
            <input
              type="number"
              value={data.instalacion.inclinacion}
              onChange={(e) => updateData({
                instalacion: {
                  ...data.instalacion,
                  inclinacion: parseFloat(e.target.value) || 0
                }
              })}
              className="input-premium"
              min="0"
              max="90"
              step="1"
            />
            <p className="text-sm text-gris-hotspot-medio mt-1">
              Recomendado: 30° para máxima eficiencia anual
            </p>
          </div>
        </div>

        {/* Errores */}
        {errors.length > 0 && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <ul className="text-red-200 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between pt-6">
          <button
            onClick={onPrev}
            className="px-6 py-3 border-2 border-white/30 text-white rounded-xl hover:border-cobre-hotspot-plano hover:bg-white/10 transition-all duration-300"
          >
            Anterior
          </button>
          
          <button
            onClick={validateAndNext}
            disabled={isLoading}
            className="btn-premium px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Calculando recomendaciones...</span>
              </div>
            ) : (
              'Continuar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasoInstalacion;
