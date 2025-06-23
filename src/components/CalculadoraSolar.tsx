
import React, { useState } from 'react';
import Header from './Header';
import StepIndicator from './StepIndicator';
import PasoAnalisisAvanzado from './steps/PasoAnalisisAvanzado';
import PasoTecnico from './steps/PasoTecnico';
import PasoEconomico from './steps/PasoEconomico';
import AdvancedResults from './advanced/AdvancedResults';
import { useCalculatorData } from '../hooks/useCalculatorData';
import { useSolarResults } from '../hooks/useSolarCalculations';

const CalculadoraSolar = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    data,
    advancedData,
    updateData,
    updateAdvancedData,
    resetCalculator
  } = useCalculatorData();

  const {
    data: calculatedResults,
    isLoading: isCalculating,
    error: calculationError
  } = useSolarResults(
    advancedData.roofAnalysis,
    advancedData.consumptionPrediction,
    advancedData.coordinates,
    advancedData.pvgisData
  );

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const calculateAdvancedResults = async () => {
    if (!advancedData.roofAnalysis || !advancedData.consumptionPrediction) {
      console.error('Missing required data for calculations');
      alert('Error: Faltan datos necesarios para el cálculo. Por favor, complete el análisis del tejado y el perfil de consumo.');
      return;
    }

    // The calculation is handled by the useSolarResults hook
    // We just need to wait for it to complete and then proceed
    if (calculatedResults) {
      updateAdvancedData({ advancedResults: calculatedResults });
      setCurrentStep(4);
    } else if (calculationError) {
      console.error('Error calculating results:', calculationError);
      alert('Error al calcular los resultados. Por favor, verifica que todos los datos estén disponibles.');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PasoAnalisisAvanzado
            onNext={nextStep}
            onPrev={prevStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onDataUpdate={(newData) => {
              updateAdvancedData({
                address: newData.address,
                roofAnalysis: newData.roofAnalysis,
                householdProfile: newData.householdProfile,
                consumptionPrediction: newData.consumptionPrediction,
                pvgisData: (newData as any).pvgisData,
                coordinates: (newData as any).coordinates
              });
            }}
          />
        );
      case 2:
        return (
          <PasoTecnico
            data={data}
            updateData={updateData}
            onNext={() => {
              // Update technical data based on REAL roof analysis
              if (advancedData.roofAnalysis) {
                const recommendedKwp = Math.min(advancedData.roofAnalysis.maxKwp * 0.85, 10);
                const recommendedInverter = recommendedKwp * 0.9;
                const moduleCount = Math.floor((recommendedKwp * 1000) / 450);
                
                updateData({
                  tecnico: {
                    ...data.tecnico,
                    potenciaPicoRecomendada: recommendedKwp,
                    potenciaInversorRecomendada: recommendedInverter,
                    cantidadModulos: moduleCount,
                    potenciaPicoFinal: recommendedKwp,
                    potenciaInversorFinal: recommendedInverter
                  }
                });
              }
              nextStep();
            }}
            onPrev={prevStep}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <PasoEconomico
            data={data}
            updateData={updateData}
            onNext={calculateAdvancedResults}
            onPrev={prevStep}
            isLoading={isCalculating}
            setIsLoading={setIsLoading}
          />
        );
      case 4:
        return calculatedResults ? (
          <AdvancedResults
            results={calculatedResults}
            onNewCalculation={resetCalculator}
          />
        ) : (
          <div className="card-premium text-center">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 border-2 border-cobre-hotspot-plano/30 border-t-cobre-hotspot-plano rounded-full animate-spin"></div>
              <p className="text-white">Calculando resultados con datos reales...</p>
            </div>
            {calculationError && (
              <p className="text-red-400 mt-2">Error en el cálculo. Volviendo al paso anterior...</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // If there's a calculation error, go back to step 3
  React.useEffect(() => {
    if (calculationError && currentStep === 4) {
      setTimeout(() => setCurrentStep(3), 2000);
    }
  }, [calculationError, currentStep]);

  // When calculation results are ready, move to step 4
  React.useEffect(() => {
    if (calculatedResults && currentStep === 3) {
      updateAdvancedData({ advancedResults: calculatedResults });
      setCurrentStep(4);
    }
  }, [calculatedResults, currentStep, updateAdvancedData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-azul-hotspot via-azul-hotspot to-gris-hotspot-profundo">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <StepIndicator currentStep={currentStep} totalSteps={4} />
          
          <div className="mt-8">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraSolar;
