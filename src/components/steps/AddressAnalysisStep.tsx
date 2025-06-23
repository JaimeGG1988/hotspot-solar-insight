
import React from 'react';
import { AddressDetails, RoofAnalysis } from '../../types/AdvancedTypes';
import AddressAnalyzer from '../advanced/AddressAnalyzer';

interface AddressAnalysisStepProps {
  onAnalysisComplete: (
    address: AddressDetails, 
    roofAnalysis: RoofAnalysis, 
    additionalData?: any
  ) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AddressAnalysisStep: React.FC<AddressAnalysisStepProps> = ({
  onAnalysisComplete,
  isLoading,
  setIsLoading
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-4">
          Análisis del Tejado y Ubicación
        </h3>
        <p className="text-gris-hotspot-medio">
          Analizaremos tu ubicación para determinar el potencial solar de tu tejado
        </p>
      </div>

      <AddressAnalyzer
        onAddressAnalyzed={onAnalysisComplete}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </div>
  );
};

export default AddressAnalysisStep;
