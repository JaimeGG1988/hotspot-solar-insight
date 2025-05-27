
import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { CalculadoraData, Orientacion } from '../../types/CalculadoraTypes';
import MapSelector from '../common/MapSelector';

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
  const [errors, setErrors] = useState<string[]>([]);

  const handleLocationSelect = (coordinates: [number, number], address: string) => {
    updateData({
      instalacion: {
        ...data.instalacion,
        ubicacion: address,
        latitud: coordinates[1], // lat
        longitud: coordinates[0] // lng
      }
    });
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
        
        // Simular llamada al backend para obtener recomendaciones
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
        {/* Mapa interactivo */}
        <MapSelector
          onLocationSelect={handleLocationSelect}
          initialCoordinates={data.instalacion.latitud && data.instalacion.longitud ? 
            [data.instalacion.longitud, data.instalacion.latitud] : undefined
          }
          initialAddress={data.instalacion.ubicacion}
        />

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
