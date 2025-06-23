
import React, { useState } from 'react';
import { CalculadoraData, UnidadCoste, CosteItem } from '../../types/CalculadoraTypes';
import { Calculator, Euro, TrendingUp } from 'lucide-react';

interface PasoEconomicoProps {
  data: CalculadoraData;
  updateData: (data: Partial<CalculadoraData>) => void;
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PasoEconomico: React.FC<PasoEconomicoProps> = ({ 
  data, 
  updateData, 
  onNext, 
  onPrev, 
  isLoading, 
  setIsLoading 
}) => {
  const [errors, setErrors] = useState<string[]>([]);

  const updateCoste = (tipo: keyof typeof data.economico, campo: keyof CosteItem, valor: any) => {
    if (tipo === 'precioElectricidad') return;
    
    const costeActual = data.economico[tipo] as CosteItem;
    updateData({
      economico: {
        ...data.economico,
        [tipo]: {
          ...costeActual,
          [campo]: valor
        }
      }
    });
  };

  const calcularCosteTotal = () => {
    const potenciaPicoWp = data.tecnico.potenciaPicoFinal * 1000;
    let total = 0;

    Object.entries(data.economico).forEach(([key, value]) => {
      if (key === 'precioElectricidad') return;
      
      const coste = value as CosteItem;
      if (coste.unidad === UnidadCoste.EUROS_TOTAL) {
        total += coste.valor;
      } else {
        total += coste.valor * potenciaPicoWp;
      }
    });

    return total;
  };

  const validateAndNext = async () => {
    const newErrors: string[] = [];

    if (data.economico.precioElectricidad <= 0) {
      newErrors.push('El precio de la electricidad debe ser mayor que 0');
    }

    // Validar que todos los costes sean positivos
    Object.entries(data.economico).forEach(([key, value]) => {
      if (key === 'precioElectricidad') return;
      
      const coste = value as CosteItem;
      if (coste.valor < 0) {
        newErrors.push(`El coste de ${key} no puede ser negativo`);
      }
    });

    setErrors(newErrors);

    if (newErrors.length === 0) {
      try {
        setIsLoading(true);

        // Preparar datos para enviar al backend
        // Esta parte es importante y se mantendrá, pero los datos vendrán del store de Zustand
        // en lugar de `props.data`.
        // const {
        //   locationAnalysisResults,
        //   consumptionPredictionResults,
        //   pvConfigurationInputs,
        //   // ... otros datos del store necesarios para FinanceInput del backend
        // } = useCalculatorStore.getState(); // O pasarlos como props si este componente no accede directamente al store

        // TODO: Mapear los datos del store de Zustand al formato `FinanceInput` del backend.
        // Ejemplo (requiere que los datos estén en el store):
        // const financeApiPayload = {
        //   location_data: locationAnalysisResults,
        //   consumption_data: consumptionPredictionResults,
        //   system_cost_per_kwp: data.economico.costeTotal / (pvConfigurationInputs.panelWp * pvConfigurationInputs.panelCount / 1000), // Ejemplo
        //   energy_price_kwh: data.economico.precioElectricidad,
        //   feed_in_tariff_kwh: 0.05, // Ejemplo, necesita input en el UI
        //   eligible_region_code: locationAnalysisResults?.region_code || "ES", // Ejemplo
        //   inflation_rate_percent: 2.0, // Ejemplo, necesita input
        //   discount_rate_percent: 5.0, // Ejemplo, necesita input
        //   analysis_years: 25
        // };

        // **** Inicio del Refactor: Eliminación del setTimeout y lógica de simulación ****
        // La llamada real a la API /api/finance/calculate y el manejo de `isLoading`
        // se harán con React Query en un paso posterior.
        // `updateData({ resultados })` será reemplazado por `setFinanceAnalysisResults(datosDeLaApi)` del store.

        logger.warn("PasoEconomico.validateAndNext: Lógica de llamada a API y simulación de resultados eliminada. Se debe implementar con React Query y datos del store.");

        // Por ahora, para que el flujo continúe, simplemente llamamos a onNext.
        // En la implementación real con React Query, onNext se llamaría en el onSuccess de la mutación.
        // Y los resultados se guardarían en el store de Zustand.
        // setIsLoading(true) y setIsLoading(false) serían manejados por React Query.

        // Simulación temporal para avanzar:
        // setFinanceAnalysisResults({ dummyFinancialData: "Resultados financieros simulados" }); // Ejemplo
        onNext();
        // La lógica de `setIsLoading(false)` se movió al `finally` que ya existía.
        // } catch (error) { // El bloque catch original
      } catch (error) { // Mantener el bloque catch para otros errores de validación o preparación
        console.error('Error preparing for financial calculation:', error);
        newErrors.push('Error al calcular los resultados');
        setErrors(newErrors);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const costesConfig = [
    { key: 'costeModulos', label: 'Módulos Fotovoltaicos', icon: '☀️', color: 'from-blue-500 to-blue-600' },
    { key: 'costeInversor', label: 'Inversor', icon: '⚡', color: 'from-yellow-500 to-yellow-600' },
    { key: 'costeEstructura', label: 'Estructura de Montaje', icon: '🔩', color: 'from-gray-500 to-gray-600' },
    { key: 'costeAuxiliares', label: 'Materiales Auxiliares', icon: '🔧', color: 'from-green-500 to-green-600' },
    { key: 'costeManoObra', label: 'Mano de Obra', icon: '👷', color: 'from-orange-500 to-orange-600' }
  ];

  return (
    <div className="card-premium animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cobre-hotspot-claro to-cobre-hotspot-plano flex items-center justify-center animate-float">
          <Euro className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Datos Económicos
        </h2>
        <p className="text-gris-hotspot-medio">
          Define los costes y parámetros económicos para calcular la rentabilidad de tu instalación
        </p>
      </div>

      <div className="space-y-8">
        {/* Precio de la electricidad */}
        <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6" />
            <span>Precio de la Electricidad</span>
          </h3>
          <div>
            <label className="block text-lg font-semibold text-white mb-3">
              Precio Medio de la Electricidad (€/kWh)
            </label>
            <input
              type="number"
              value={data.economico.precioElectricidad}
              onChange={(e) => updateData({
                economico: {
                  ...data.economico,
                  precioElectricidad: parseFloat(e.target.value) || 0
                }
              })}
              className="input-premium text-lg max-w-xs"
              min="0"
              max="1"
              step="0.01"
              placeholder="0.25"
            />
            <p className="text-sm text-gris-hotspot-medio mt-1">
              Precio actual típico en España: 0.20 - 0.30 €/kWh
            </p>
          </div>
        </div>

        {/* Costes de instalación */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
            <Calculator className="w-6 h-6" />
            <span>Costes de la Instalación (CAPEX)</span>
          </h3>

          <div className="space-y-6">
            {costesConfig.map(({ key, label, icon, color }) => {
              const coste = data.economico[key as keyof typeof data.economico] as CosteItem;
              return (
                <div key={key} className={`bg-gradient-to-r ${color}/20 border border-white/20 rounded-xl p-6`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">{icon}</span>
                    <h4 className="text-lg font-semibold text-white">{label}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gris-hotspot-medio mb-2">
                        Valor
                      </label>
                      <input
                        type="number"
                        value={coste.valor}
                        onChange={(e) => updateCoste(key as keyof typeof data.economico, 'valor', parseFloat(e.target.value) || 0)}
                        className="input-premium"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gris-hotspot-medio mb-2">
                        Unidad
                      </label>
                      <select
                        value={coste.unidad}
                        onChange={(e) => updateCoste(key as keyof typeof data.economico, 'unidad', e.target.value)}
                        className="input-premium"
                      >
                        <option value={UnidadCoste.EUROS_TOTAL}>€ Total</option>
                        <option value={UnidadCoste.EUROS_POR_WP}>€/Wp</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Mostrar coste calculado */}
                  <div className="mt-3 p-3 bg-white/10 rounded-lg">
                    <p className="text-sm text-gris-hotspot-medio">Coste calculado:</p>
                    <p className="text-lg font-semibold text-white">
                      {coste.unidad === UnidadCoste.EUROS_TOTAL 
                        ? `${coste.valor.toFixed(2)} €`
                        : `${(coste.valor * data.tecnico.potenciaPicoFinal * 1000).toFixed(2)} €`
                      }
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen de costes */}
        <div className="bg-azul-hotspot/50 border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            Resumen de Costes Totales
          </h3>
          <div className="text-center">
            <p className="text-lg text-gris-hotspot-medio mb-2">
              Coste Total de la Instalación
            </p>
            <p className="text-4xl font-bold text-gradient">
              {calcularCosteTotal().toFixed(2)} €
            </p>
            <p className="text-sm text-gris-hotspot-medio mt-2">
              {(calcularCosteTotal() / (data.tecnico.potenciaPicoFinal * 1000)).toFixed(2)} €/Wp
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
                <span>Calculando resultados...</span>
              </div>
            ) : (
              'Calcular Resultados'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasoEconomico;
