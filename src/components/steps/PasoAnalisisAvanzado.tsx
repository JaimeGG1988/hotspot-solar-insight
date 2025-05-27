
import React, { useState } from 'react';
import { AddressDetails, RoofAnalysis, HouseholdProfile, ConsumptionPrediction } from '../../types/AdvancedTypes';
import AddressAnalyzer from '../advanced/AddressAnalyzer';
import HouseholdProfiler from '../advanced/HouseholdProfiler';

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
  }) => void;
}

const PasoAnalisisAvanzado: React.FC<PasoAnalisisAvanzadoProps> = ({
  onNext,
  onPrev,
  isLoading,
  setIsLoading,
  onDataUpdate
}) => {
  const [currentSubStep, setCurrentSubStep] = useState<'address' | 'household'>('address');
  const [addressData, setAddressData] = useState<{ address: AddressDetails; roofAnalysis: RoofAnalysis } | null>(null);
  const [householdData, setHouseholdData] = useState<{ profile: HouseholdProfile; prediction: ConsumptionPrediction } | null>(null);

  const handleAddressAnalyzed = (address: AddressDetails, roofAnalysis: RoofAnalysis) => {
    setAddressData({ address, roofAnalysis });
    setCurrentSubStep('household');
  };

  const handleHouseholdCompleted = (profile: HouseholdProfile, prediction: ConsumptionPrediction) => {
    setHouseholdData({ profile, prediction });
    
    if (addressData) {
      onDataUpdate({
        address: addressData.address,
        roofAnalysis: addressData.roofAnalysis,
        householdProfile: profile,
        consumptionPrediction: prediction
      });
      onNext();
    }
  };

  const handleBack = () => {
    if (currentSubStep === 'household') {
      setCurrentSubStep('address');
    } else {
      onPrev();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator for sub-steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          currentSubStep === 'address' 
            ? 'bg-cobre-hotspot-plano text-white' 
            : addressData ? 'bg-green-500 text-white' : 'bg-white/20 text-gris-hotspot-medio'
        }`}>
          1
        </div>
        <div className={`h-1 w-16 ${addressData ? 'bg-green-500' : 'bg-white/20'}`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
          currentSubStep === 'household' 
            ? 'bg-cobre-hotspot-plano text-white' 
            : householdData ? 'bg-green-500 text-white' : 'bg-white/20 text-gris-hotspot-medio'
        }`}>
          2
        </div>
      </div>

      {/* Sub-step content */}
      {currentSubStep === 'address' && (
        <AddressAnalyzer
          onAddressAnalyzed={handleAddressAnalyzed}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {currentSubStep === 'household' && (
        <HouseholdProfiler
          onProfileCompleted={handleHouseholdCompleted}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}

      {/* Navigation */}
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
