
import React, { useState } from 'react';
import { AddressDetails, RoofAnalysis, HouseholdProfile, ConsumptionPrediction } from '../../types/AdvancedTypes';
import AddressAnalysisStep from './AddressAnalysisStep';
import HouseholdAnalysisStep from './HouseholdAnalysisStep';
import SubStepIndicator from '../common/SubStepIndicator';

interface PasoAnalisisAvanzadoProps {
  onNext: () => void;
  onPrev: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onDataUpdate: (data: {
    address: AddressDetails;
    roofAnalysis: RoofAnalysis;
    householdProfile: HouseholdProfile;
    consumptionPrediction: ConsumptionPrediction;
    pvgisData?: any;
    coordinates?: [number, number];
  }) => void;
}

type SubStep = 'address' | 'household';

const PasoAnalisisAvanzado: React.FC<PasoAnalisisAvanzadoProps> = ({
  onNext,
  onPrev,
  isLoading,
  setIsLoading,
  onDataUpdate
}) => {
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('address');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [addressData, setAddressData] = useState<{ 
    address: AddressDetails; 
    roofAnalysis: RoofAnalysis;
    pvgisData?: any;
    coordinates?: [number, number];
  } | null>(null);

  const steps = [
    { id: 'address', label: 'Análisis del Tejado', number: 1 },
    { id: 'household', label: 'Perfil del Hogar', number: 2 }
  ];

  const handleAddressAnalyzed = (address: AddressDetails, roofAnalysis: RoofAnalysis, additionalData?: any) => {
    const data = { 
      address, 
      roofAnalysis,
      pvgisData: additionalData?.pvgisData,
      coordinates: additionalData?.coordinates
    };
    setAddressData(data);
    setCompletedSteps(['address']);
    setCurrentSubStep('household');
  };

  const handleHouseholdCompleted = (profile: HouseholdProfile, prediction: ConsumptionPrediction) => {
    if (addressData) {
      onDataUpdate({
        address: addressData.address,
        roofAnalysis: addressData.roofAnalysis,
        householdProfile: profile,
        consumptionPrediction: prediction,
        pvgisData: addressData.pvgisData,
        coordinates: addressData.coordinates
      });
      onNext();
    }
  };

  const handleBack = () => {
    if (currentSubStep === 'household') {
      setCurrentSubStep('address');
      setCompletedSteps([]);
    } else {
      onPrev();
    }
  };

  const renderCurrentStep = () => {
    switch (currentSubStep) {
      case 'address':
        return (
          <AddressAnalysisStep
            onAnalysisComplete={handleAddressAnalyzed}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 'household':
        return (
          <HouseholdAnalysisStep
            onProfileComplete={handleHouseholdCompleted}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <SubStepIndicator 
        currentStep={currentSubStep}
        completedSteps={completedSteps}
        steps={steps}
      />

      {renderCurrentStep()}

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border-2 border-white/30 text-white rounded-xl hover:border-cobre-hotspot-plano hover:bg-white/10 transition-all duration-300"
        >
          {currentSubStep === 'address' ? 'Anterior' : 'Volver al análisis del tejado'}
        </button>
      </div>
    </div>
  );
};

export default PasoAnalisisAvanzado;
