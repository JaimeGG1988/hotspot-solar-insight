
import React, { useState } from 'react';
import { Home, Users, Zap, Car } from 'lucide-react';
import { HouseholdProfile, ConsumptionPrediction } from '../../types/AdvancedTypes';

interface HouseholdProfilerProps {
  onProfileCompleted: (profile: HouseholdProfile, prediction: ConsumptionPrediction) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const HouseholdProfiler: React.FC<HouseholdProfilerProps> = ({
  onProfileCompleted,
  isLoading,
  setIsLoading
}) => {
  const [profile, setProfile] = useState<HouseholdProfile>({ // HouseholdProfile es un tipo local
    houseType: 'house',
    occupants: 3, // Corresponde a ConsumptionManualInputs.occupants
    surfaceArea: 120, // Corresponde a ConsumptionManualInputs.areaM2
    constructionYear: 2000, // No está en ConsumptionManualInputs
    hasAirConditioning: true, // No está en ConsumptionManualInputs
    hasElectricHeating: false, // No está en ConsumptionManualInputs
    hasPool: false, // No está en ConsumptionManualInputs
    hasEV: false, // Corresponde a ConsumptionManualInputs.hasEv
    electricBill: { // No está en ConsumptionManualInputs
      monthlyKwh: 300,
      monthlyCost: 75
    }
    // clp, evModel, annualKm son opcionales y podrían añadirse aquí
  });

  // Esta función ya no genera la predicción, solo prepara los datos y llama a onProfileCompleted.
  // La llamada a la API real se hará usando React Query en el componente padre o en un hook dedicado.
  // O, si este componente se usa directamente en el wizard, aquí se haría la mutación de React Query.
  // Por ahora, eliminamos la lógica de predicción y el setTimeout.
  // La prop `onProfileCompleted` ahora debería esperar solo `HouseholdProfile` (los inputs)
  // y la predicción vendrá del store de Zustand después de la llamada API.
  // O, `onProfileCompleted` podría ser una función que *dispare* la llamada API.

  // Para este refactor, asumiremos que `HouseholdProfiler` es responsable de
  // recoger los datos del perfil Y de iniciar la llamada a la API de predicción de consumo manual.
  // Esto requerirá React Query aquí.
  // Sin embargo, el plan es solo "reemplazar stubs". Así que por ahora, solo quitaremos el setTimeout
  // y la lógica de cálculo. La llamada real la manejará el componente que use HouseholdProfiler
  // o se añadirá aquí en el paso de implementación del Wizard con React Query.

  // const { mutate: predictConsumption, isLoading: isPredicting } = usePredictConsumptionManualMutation(); // Ejemplo de React Query

  const handleSubmit = async () => {
    // setIsLoading(true); // React Query se encargaría de esto con `isPending` o `isLoading` de useMutation

    // 1. Mapear `profile` (estado local) a `ConsumptionManualInputs` (schema del backend)
    const manualInputs = {
      occupants: profile.occupants,
      area_m2: profile.surfaceArea,
      has_ev: profile.hasEV,
      has_heat_pump: profile.hasElectricHeating, // Asumiendo que electricHeating es el equivalente a heat_pump
      // clp: profile.clp, // Si se añade clp al estado local 'profile'
    };

    // 2. Aquí es donde se haría la llamada a la API con React Query:
    // predictConsumption(manualInputs, {
    //   onSuccess: (consumptionPredictionData) => {
    //     // consumptionPredictionData es el ConsumptionOutput del backend
    //     onProfileCompleted(profile, consumptionPredictionData); // Pasar inputs y output
    //     setIsLoading(false);
    //   },
    //   onError: (error) => {
    //     console.error("Error predicting consumption:", error);
    //     alert("Error al predecir el consumo.");
    //     setIsLoading(false);
    //   }
    // });

    // **** Inicio del Refactor: Eliminación del setTimeout y lógica de cálculo ****
    // La lógica de cálculo de `generateConsumptionPrediction` se ha eliminado.
    // El `setTimeout` también se ha eliminado.
    // La llamada real a la API y el manejo de `isLoading` se harán con React Query
    // en un paso posterior cuando se implemente el wizard.
    // Por ahora, `handleSubmit` solo llamará a `onProfileCompleted` con los datos del perfil.
    // El componente que usa `HouseholdProfiler` (probablemente un paso del wizard)
    // será responsable de tomar estos `profile` (inputs) y llamar al endpoint del backend.

    // Esto significa que `onProfileCompleted` probablemente solo necesite los inputs del perfil ahora,
    // y el componente padre se encargará de la llamada API y de actualizar el store de Zustand.
    // O, `onProfileCompleted` se podría redefinir para que tome los `manualInputs` y dispare la mutación.

    // Simplificación para este paso de refactor:
    // `onProfileCompleted` ahora solo pasa los datos del perfil.
    // El componente que lo usa (Paso 2 del wizard) tomará estos datos,
    // los mapeará a ConsumptionManualInputs, y llamará al endpoint.
    // La prop `isLoading` y `setIsLoading` podrían ser eliminadas de este componente
    // si React Query maneja el estado de carga globalmente o en el componente llamador.

    logger.warn("HouseholdProfiler.handleSubmit: Lógica de llamada a API y predicción eliminada. Se debe implementar con React Query en el componente del wizard.");
    // Simplemente pasamos los datos del perfil recogidos.
    // El componente padre (Paso 2 del wizard) usará estos datos para llamar al endpoint.
    onProfileCompleted(profile, {} as ConsumptionPrediction); // Pasar un objeto vacío como predicción temporal
    // La firma de onProfileCompleted era (profile: HouseholdProfile, prediction: ConsumptionPrediction)
    // Para que no rompa, pasamos un objeto vacío. El componente padre deberá ajustarse.
    // O mejor, si `onProfileCompleted` es solo para notificar que el perfil está listo:
    // onProfileCompleted(profile); y el padre hace el resto.
    // Para este refactor, mantendremos la firma pero la predicción será placeholder.
    // **** Fin del Refactor ****
  };

  return (
    <div className="card-premium animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cobre-hotspot-claro to-cobre-hotspot-plano flex items-center justify-center animate-float">
          <Home className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Perfil de Consumo Personalizado
        </h2>
        <p className="text-gris-hotspot-medio">
          Cuéntanos sobre tu hogar para calcular un consumo energético preciso
        </p>
      </div>

      <div className="space-y-8">
        {/* House Type */}
        <div>
          <label className="block text-lg font-semibold text-white mb-4">
            Tipo de vivienda
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'apartment', label: 'Apartamento', icon: '🏢' },
              { value: 'house', label: 'Casa unifamiliar', icon: '🏠' },
              { value: 'townhouse', label: 'Casa adosada', icon: '🏘️' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setProfile(prev => ({ ...prev, houseType: option.value as any }))}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  profile.houseType === option.value
                    ? 'border-cobre-hotspot-plano bg-cobre-hotspot-plano/20 text-white'
                    : 'border-white/20 bg-white/5 text-gris-hotspot-medio hover:border-cobre-hotspot-plano/50'
                }`}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Household Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-lg font-semibold text-white mb-2">
              Número de ocupantes
            </label>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-cobre-hotspot-claro" />
              <input
                type="number"
                value={profile.occupants}
                onChange={(e) => setProfile(prev => ({ ...prev, occupants: parseInt(e.target.value) || 1 }))}
                className="input-premium flex-1"
                min="1"
                max="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-white mb-2">
              Superficie de la vivienda (m²)
            </label>
            <input
              type="number"
              value={profile.surfaceArea}
              onChange={(e) => setProfile(prev => ({ ...prev, surfaceArea: parseInt(e.target.value) || 100 }))}
              className="input-premium"
              min="50"
              max="500"
            />
          </div>

          <div>
            <label className="block text-lg font-semibold text-white mb-2">
              Año de construcción
            </label>
            <input
              type="number"
              value={profile.constructionYear}
              onChange={(e) => setProfile(prev => ({ ...prev, constructionYear: parseInt(e.target.value) || 2000 }))}
              className="input-premium"
              min="1950"
              max="2024"
            />
          </div>
        </div>

        {/* Electric Bill */}
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-cobre-hotspot-claro" />
            <span>Factura eléctrica actual</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gris-hotspot-medio mb-1">
                Consumo mensual (kWh)
              </label>
              <input
                type="number"
                value={profile.electricBill.monthlyKwh}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  electricBill: { ...prev.electricBill, monthlyKwh: parseInt(e.target.value) || 0 }
                }))}
                className="input-premium"
                placeholder="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gris-hotspot-medio mb-1">
                Coste mensual (€)
              </label>
              <input
                type="number"
                value={profile.electricBill.monthlyCost}
                onChange={(e) => setProfile(prev => ({
                  ...prev,
                  electricBill: { ...prev.electricBill, monthlyCost: parseInt(e.target.value) || 0 }
                }))}
                className="input-premium"
                placeholder="75"
              />
            </div>
          </div>
        </div>

        {/* Equipment and Systems */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Equipos y sistemas eléctricos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'hasAirConditioning', label: 'Aire acondicionado', icon: '❄️' },
              { key: 'hasElectricHeating', label: 'Calefacción eléctrica', icon: '🔥' },
              { key: 'hasPool', label: 'Piscina', icon: '🏊' },
              { key: 'hasEV', label: 'Vehículo eléctrico', icon: '🚗' }
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={profile[item.key as keyof HouseholdProfile] as boolean}
                  onChange={(e) => setProfile(prev => ({ ...prev, [item.key]: e.target.checked }))}
                  className="w-5 h-5 rounded border-2 border-white/30 bg-transparent checked:bg-cobre-hotspot-plano checked:border-cobre-hotspot-plano"
                />
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* EV Details */}
        {profile.hasEV && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-6">
            <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
              <Car className="w-5 h-5" />
              <span>Detalles del vehículo eléctrico</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gris-hotspot-medio mb-1">
                  Modelo (opcional)
                </label>
                <input
                  type="text"
                  value={profile.evModel || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, evModel: e.target.value }))}
                  className="input-premium"
                  placeholder="Tesla Model 3, Nissan Leaf..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gris-hotspot-medio mb-1">
                  Kilómetros anuales
                </label>
                <input
                  type="number"
                  value={profile.annualKm || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, annualKm: parseInt(e.target.value) || undefined }))}
                  className="input-premium"
                  placeholder="15000"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="btn-premium w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Analizando consumo energético...</span>
            </div>
          ) : (
            'Analizar Consumo Energético'
          )}
        </button>
      </div>
    </div>
  );
};

export default HouseholdProfiler;
