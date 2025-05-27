
import React, { useState } from 'react';
import { TipoEntradaConsumo, PerfilUsuario, ConsumosMensuales, CalculadoraData } from '../../types/CalculadoraTypes';
import { Upload, Zap, Home } from 'lucide-react';

interface PasoConsumoProps {
  data: CalculadoraData;
  updateData: (data: Partial<CalculadoraData>) => void;
  onNext: () => void;
  isLoading: boolean;
}

const PasoConsumo: React.FC<PasoConsumoProps> = ({ data, updateData, onNext, isLoading }) => {
  const [errors, setErrors] = useState<string[]>([]);

  const handleTipoEntradaChange = (tipo: TipoEntradaConsumo) => {
    updateData({
      consumo: {
        ...data.consumo,
        tipoEntrada: tipo,
        consumoAnual: undefined,
        consumosMensuales: undefined,
        nombreArchivoCSV: undefined
      }
    });
  };

  const handleConsumoAnualChange = (value: string) => {
    const consumoAnual = parseFloat(value) || 0;
    updateData({
      consumo: {
        ...data.consumo,
        consumoAnual
      }
    });
  };

  const handleConsumoMensualChange = (mes: keyof ConsumosMensuales, value: string) => {
    const valorMes = parseFloat(value) || 0;
    const consumosMensuales = data.consumo.consumosMensuales || {
      enero: 0, febrero: 0, marzo: 0, abril: 0, mayo: 0, junio: 0,
      julio: 0, agosto: 0, septiembre: 0, octubre: 0, noviembre: 0, diciembre: 0
    };

    updateData({
      consumo: {
        ...data.consumo,
        consumosMensuales: {
          ...consumosMensuales,
          [mes]: valorMes
        }
      }
    });
  };

  const validateAndNext = () => {
    const newErrors: string[] = [];

    if (data.consumo.tipoEntrada === TipoEntradaConsumo.ANUAL) {
      if (!data.consumo.consumoAnual || data.consumo.consumoAnual <= 0) {
        newErrors.push('El consumo anual debe ser mayor que 0');
      }
    } else if (data.consumo.tipoEntrada === TipoEntradaConsumo.MENSUAL) {
      if (!data.consumo.consumosMensuales) {
        newErrors.push('Debe introducir los consumos mensuales');
      } else {
        const suma = Object.values(data.consumo.consumosMensuales).reduce((acc, val) => acc + val, 0);
        if (suma <= 0) {
          newErrors.push('El consumo total anual debe ser mayor que 0');
        }
      }
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      onNext();
    }
  };

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ] as const;

  return (
    <div className="card-premium animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cobre-hotspot-claro to-cobre-hotspot-plano flex items-center justify-center animate-float">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Datos de Consumo Eléctrico
        </h2>
        <p className="text-gris-hotspot-medio">
          Introduce los datos de consumo de la vivienda para calcular tu instalación solar óptima
        </p>
      </div>

      {/* Tipo de entrada */}
      <div className="space-y-6">
        <div>
          <label className="block text-lg font-semibold text-white mb-4">
            ¿Cómo quieres introducir el consumo?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { tipo: TipoEntradaConsumo.ANUAL, label: 'Consumo Anual', icon: '📊' },
              { tipo: TipoEntradaConsumo.MENSUAL, label: 'Consumos Mensuales', icon: '📅' },
              { tipo: TipoEntradaConsumo.CSV, label: 'Archivo CSV', icon: '📁' }
            ].map(({ tipo, label, icon }) => (
              <button
                key={tipo}
                onClick={() => handleTipoEntradaChange(tipo)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  data.consumo.tipoEntrada === tipo
                    ? 'border-cobre-hotspot-plano bg-cobre-hotspot-plano/20 text-white'
                    : 'border-white/20 bg-white/5 text-gris-hotspot-medio hover:border-cobre-hotspot-plano/50 hover:bg-white/10'
                }`}
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div className="font-medium">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Consumo Anual */}
        {data.consumo.tipoEntrada === TipoEntradaConsumo.ANUAL && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-white">
              Consumo Anual (kWh)
            </label>
            <input
              type="number"
              placeholder="Ej: 4500"
              value={data.consumo.consumoAnual || ''}
              onChange={(e) => handleConsumoAnualChange(e.target.value)}
              className="input-premium text-lg"
              min="0"
              step="100"
            />
          </div>
        )}

        {/* Consumos Mensuales */}
        {data.consumo.tipoEntrada === TipoEntradaConsumo.MENSUAL && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-white">
              Consumos Mensuales (kWh)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {meses.map((mes) => (
                <div key={mes}>
                  <label className="block text-sm font-medium text-gris-hotspot-medio mb-1 capitalize">
                    {mes}
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={data.consumo.consumosMensuales?.[mes] || ''}
                    onChange={(e) => handleConsumoMensualChange(mes, e.target.value)}
                    className="input-premium"
                    min="0"
                    step="10"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CSV Upload */}
        {data.consumo.tipoEntrada === TipoEntradaConsumo.CSV && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-white">
              Archivo CSV con curva de consumo
            </label>
            <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center hover:border-cobre-hotspot-plano/50 transition-all duration-300">
              <Upload className="w-12 h-12 text-gris-hotspot-medio mx-auto mb-4" />
              <p className="text-gris-hotspot-medio mb-2">
                Arrastra tu archivo CSV aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-gris-hotspot-medio">
                Archivo con 8760 valores horarios de consumo (kWh)
              </p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateData({
                      consumo: {
                        ...data.consumo,
                        nombreArchivoCSV: file.name
                      }
                    });
                  }
                }}
              />
            </div>
            {data.consumo.nombreArchivoCSV && (
              <p className="text-cobre-hotspot-claro">
                Archivo seleccionado: {data.consumo.nombreArchivoCSV}
              </p>
            )}
          </div>
        )}

        {/* Perfil de usuario */}
        {data.consumo.tipoEntrada !== TipoEntradaConsumo.CSV && (
          <div className="space-y-4">
            <label className="block text-lg font-semibold text-white">
              Perfil de la vivienda
            </label>
            <select
              value={data.consumo.perfilUsuario || ''}
              onChange={(e) => updateData({
                consumo: {
                  ...data.consumo,
                  perfilUsuario: e.target.value as PerfilUsuario
                }
              })}
              className="input-premium"
            >
              <option value={PerfilUsuario.RESIDENCIAL_DEFECTO}>Vivienda Estándar</option>
              <option value={PerfilUsuario.RESIDENCIAL_TELETRABAJO}>Vivienda con Teletrabajo</option>
              <option value={PerfilUsuario.RESIDENCIAL_FIN_SEMANA}>Vivienda con Uso Intensivo Fin de Semana</option>
            </select>
          </div>
        )}

        {/* Opciones adicionales */}
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-white mb-4">
            Equipos especiales en la vivienda
          </label>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={data.consumo.tieneVE}
                onChange={(e) => updateData({
                  consumo: {
                    ...data.consumo,
                    tieneVE: e.target.checked
                  }
                })}
                className="w-5 h-5 rounded border-2 border-gris-hotspot-claro text-cobre-hotspot-plano focus:ring-cobre-hotspot-plano focus:ring-2"
              />
              <span className="text-white font-medium group-hover:text-cobre-hotspot-claro transition-colors duration-300">
                Vehículo Eléctrico (VE) con carga en la vivienda
              </span>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={data.consumo.tieneBombaCalor}
                onChange={(e) => updateData({
                  consumo: {
                    ...data.consumo,
                    tieneBombaCalor: e.target.checked
                  }
                })}
                className="w-5 h-5 rounded border-2 border-gris-hotspot-claro text-cobre-hotspot-plano focus:ring-cobre-hotspot-plano focus:ring-2"
              />
              <span className="text-white font-medium group-hover:text-cobre-hotspot-claro transition-colors duration-300">
                Bomba de Calor (BC) para climatización principal
              </span>
            </label>
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

        {/* Botón siguiente */}
        <div className="flex justify-end pt-6">
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

export default PasoConsumo;
