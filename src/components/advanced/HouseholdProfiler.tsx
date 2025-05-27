
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
  const [profile, setProfile] = useState<HouseholdProfile>({
    houseType: 'house',
    occupants: 3,
    surfaceArea: 120,
    constructionYear: 2000,
    hasAirConditioning: true,
    hasElectricHeating: false,
    hasPool: false,
    hasEV: false,
    electricBill: {
      monthlyKwh: 300,
      monthlyCost: 75
    }
  });

  const generateConsumptionPrediction = async (householdProfile: HouseholdProfile): Promise<ConsumptionPrediction> => {
    setIsLoading(true);
    
    try {
      // Simulate API call for consumption prediction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let baseConsumption = householdProfile.electricBill.monthlyKwh * 12;
      
      // Adjust based on household characteristics
      if (householdProfile.hasEV) {
        baseConsumption += 2500; // Average EV consumption
      }
      if (householdProfile.hasPool) {
        baseConsumption += 1200; // Pool equipment
      }
      if (householdProfile.hasElectricHeating) {
        baseConsumption += 3000; // Electric heating
      }
      
      // Generate hourly profile (simplified)
      const hourlyProfile = Array.from({ length: 8760 }, (_, hour) => {
        const dayHour = hour % 24;
        const month = Math.floor(hour / (24 * 30)) % 12;
        
        // Base consumption pattern
        let factor = 0.5; // Base load
        
        // Daily pattern
        if (dayHour >= 7 && dayHour <= 9) factor += 0.3; // Morning peak
        if (dayHour >= 19 && dayHour <= 22) factor += 0.4; // Evening peak
        
        // Seasonal adjustment
        if (month >= 5 && month <= 9 && householdProfile.hasAirConditioning) {
          factor += 0.2; // Summer AC usage
        }
        if ((month <= 2 || month >= 11) && householdProfile.hasElectricHeating) {
          factor += 0.3; // Winter heating
        }
        
        return (baseConsumption / 8760) * factor;
      });
      
      // Generate monthly profile
      const monthlyProfile = Array.from({ length: 12 }, (_, month) => {
        const startHour = month * 24 * 30;
        const endHour = Math.min(startHour + 24 * 30, 8760);
        return hourlyProfile.slice(startHour, endHour).reduce((sum, val) => sum + val, 0);
      });
      
      const prediction: ConsumptionPrediction = {
        currentAnnualKwh: baseConsumption,
        futureAnnualKwh: baseConsumption,
        hourlyProfile,
        monthlyProfile,
        peakPower: Math.max(...hourlyProfile) * 1.2 // Add 20% margin
      };
      
      return prediction;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const prediction = await generateConsumptionPrediction(profile);
    onProfileCompleted(profile, prediction);
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
