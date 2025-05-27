
import React, { useState, useEffect } from 'react';
import { Settings, Lightbulb, Calculator } from 'lucide-react';
import { CalculadoraData } from '../../types/CalculadoraTypes';

interface PasoTecnicoProps {
  data: CalculadoraData;
  updateData: (data: Partial<CalculadoraData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
}

const PasoTecnico: React.FC<PasoTecnicoProps> = ({ data, updateData, onNext, onPrev, isLoading }) => {
  const [errors, setErrors] = useState<string[]>([]);

  // Calcular potencia pico final cuando cambian los valores
  useEffect(() => {
    const potenciaPicoFinal = (data.tecnico.potenciaModulo * data.tecnico.cantidadModulos) / 1000;
    updateData({
      tecnico: {
        ...data.tecnico,
        potenciaPicoFinal
      }
    });
  }, [data.tecnico.potenciaModulo, data.tecnico.cantidadModulos]);

  const validateAndNext = () => {
    const newErrors: string[] = [];

    if (data.tecnico.potenciaModulo <= 0) {
      newErrors.push('La potencia del módulo debe ser mayor que 0');
    }

    if (data.tecnico.cantidadModulos <= 0) {
      newErrors.push('La cantidad de módulos debe ser mayor que 0');
    }

    if (data.tecnico.potenciaInversorFinal <= 0) {
      newErrors.push('La potencia del inversor debe ser mayor que 0');
    }

    // Verificar ratio DC/AC razonable
    const ratioDCAC = data.tecnico.potenciaPicoFinal / data.tecnico.potenciaInversorFinal;
    if (ratioDCAC < 0.8 || ratioDCAC > 2.0) {
      newErrors.push('El ratio DC/AC debe estar entre 0.8 y 2.0 para una instalación eficiente');
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      onNext();
    }
  };

  const aplicarRecomendaciones = () => {
    if (data.tecnico.potenciaPicoRecomendada && data.tecnico.potenciaInversorRecomendada) {
      // Calcular cantidad de módulos basada en recomendación
      const cantidadRecomendada = Math.round((data.tecnico.potenciaPicoRecomendada * 1000) / data.tecnico.potenciaModulo);
      
      updateData({
        tecnico: {
          ...data.tecnico,
          cantidadModulos: cantidadRecomendada,
          potenciaInversorFinal: data.tecnico.potenciaInversorRecomendada
        }
      });
    }
  };

  return (
    <div className="card-premium animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cobre-hotspot-claro to-cobre-hotspot-plano flex items-center justify-center animate-float">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Configuración Técnica del Sistema
        </h2>
        <p className="text-gris-hotspot-medio">
          Define las características técnicas de tu instalación fotovoltaica
        </p>
      </div>

      <div className="space-y-8">
        {/* Recomendaciones del sistema */}
        {data.tecnico.potenciaPicoRecomendada && data.tecnico.potenciaInversorRecomendada && (
          <div className="bg-gradient-to-r from-cobre-hotspot-plano/20 to-cobre-hotspot-claro/20 border border-cobre-hotspot-plano/30 rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <Lightbulb className="w-8 h-8 text-cobre-hotspot-claro flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Recomendaciones del Sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-gris-hotspot-medio">Potencia Pico Recomendada</p>
                    <p className="text-2xl font-bold text-cobre-hotspot-claro">
                      {data.tecnico.potenciaPicoRecomendada.toFixed(2)} kWp
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-gris-hotspot-medio">Potencia Inversor Recomendada</p>
                    <p className="text-2xl font-bold text-cobre-hotspot-claro">
                      {data.tecnico.potenciaInversorRecomendada.toFixed(2)} kW
                    </p>
                  </div>
                </div>
                <button
                  onClick={aplicarRecomendaciones}
                  className="px-6 py-2 bg-cobre-hotspot-plano text-white rounded-lg hover:bg-cobre-hotspot-oscuro transition-colors duration-300"
                >
                  Aplicar Recomendaciones
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configuración de módulos */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Calculator className="w-6 h-6" />
            <span>Definición del Instalador</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold text-white mb-3">
                Potencia Nominal del Módulo (Wp)
              </label>
              <input
                type="number"
                value={data.tecnico.potenciaModulo}
                onChange={(e) => updateData({
                  tecnico: {
                    ...data.tecnico,
                    potenciaModulo: parseFloat(e.target.value) || 0
                  }
                })}
                className="input-premium text-lg"
                min="100"
                max="1000"
                step="10"
                placeholder="450"
              />
              <p className="text-sm text-gris-hotspot-medio mt-1">
                Típicamente entre 300-600 Wp por módulo
              </p>
            </div>

            <div>
              <label className="block text-lg font-semibold text-white mb-3">
                Cantidad de Módulos
              </label>
              <input
                type="number"
                value={data.tecnico.cantidadModulos}
                onChange={(e) => updateData({
                  tecnico: {
                    ...data.tecnico,
                    cantidadModulos: parseInt(e.target.value) || 0
                  }
                })}
                className="input-premium text-lg"
                min="1"
                max="100"
                step="1"
                placeholder="10"
              />
              <p className="text-sm text-gris-hotspot-medio mt-1">
                Número total de paneles solares
              </p>
            </div>
          </div>

          {/* Potencia pico final calculada */}
          <div className="bg-azul-hotspot/50 border border-white/20 rounded-xl p-6">
            <div className="text-center">
              <p className="text-lg text-gris-hotspot-medio mb-2">
                Potencia Pico FV Final Calculada
              </p>
              <p className="text-4xl font-bold text-gradient">
                {data.tecnico.potenciaPicoFinal.toFixed(2)} kWp
              </p>
              <p className="text-sm text-gris-hotspot-medio mt-2">
                {data.tecnico.potenciaModulo} Wp × {data.tecnico.cantidadModulos} módulos
              </p>
            </div>
          </div>

          {/* Potencia del inversor */}
          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              Potencia del Inversor Final (kW)
            </label>
            <input
              type="number"
              value={data.tecnico.potenciaInversorFinal}
              onChange={(e) => updateData({
                tecnico: {
                  ...data.tecnico,
                  potenciaInversorFinal: parseFloat(e.target.value) || 0
                }
              })}
              className="input-premium text-lg"
              min="0.1"
              max="50"
              step="0.1"
              placeholder="4.0"
            />
            
            {/* Indicador del ratio DC/AC */}
            {data.tecnico.potenciaPicoFinal > 0 && data.tecnico.potenciaInversorFinal > 0 && (
              <div className="mt-3 p-3 bg-white/10 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gris-hotspot-medio">Ratio DC/AC:</span>
                  <span className={`font-semibold ${
                    (data.tecnico.potenciaPicoFinal / data.tecnico.potenciaInversorFinal) >= 1.0 && 
                    (data.tecnico.potenciaPicoFinal / data.tecnico.potenciaInversorFinal) <= 1.3
                      ? 'text-green-400' 
                      : 'text-yellow-400'
                  }`}>
                    {(data.tecnico.potenciaPicoFinal / data.tecnico.potenciaInversorFinal).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gris-hotspot-medio mt-1">
                  Óptimo: 1.0 - 1.3 (permite cierto sobredimensionamiento de los paneles)
                </p>
              </div>
            )}
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
                <span>Procesando...</span>
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

export default PasoTecnico;
