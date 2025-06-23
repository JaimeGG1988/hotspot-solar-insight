
import React from 'react';
import { HouseholdProfile, ConsumptionPrediction } from '../../types/AdvancedTypes';
import HouseholdProfiler from '../advanced/HouseholdProfiler';

interface HouseholdAnalysisStepProps {
  onProfileComplete: (profile: HouseholdProfile, prediction: ConsumptionPrediction) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const HouseholdAnalysisStep: React.FC<HouseholdAnalysisStepProps> = ({
  onProfileComplete,
  isLoading,
  setIsLoading
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          Perfil de Consumo del Hogar
        </h3>
        <p className="text-gris-hotspot-medio">
          Configuremos tu perfil de consumo para optimizar la instalación solar
        </p>
      </div>

      <HouseholdProfiler
        onProfileCompleted={onProfileComplete}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </div>
  );
};

export default HouseholdAnalysisStep;
