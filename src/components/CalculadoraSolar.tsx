
import React, { useState } from 'react';
import Header from './Header';
import StepIndicator from './StepIndicator';
import PasoAnalisisAvanzado from './steps/PasoAnalisisAvanzado';
import PasoTecnico from './steps/PasoTecnico';
import PasoEconomico from './steps/PasoEconomico';
import AdvancedResults from './advanced/AdvancedResults';
import ErrorBoundary from './common/ErrorBoundary';
import LoadingSpinner from './common/LoadingSpinner';
import { useCalculatorData } from '../hooks/useCalculatorData';
import { useSolarResults } from '../hooks/useSolarCalculations';
import { useWizardNavigation } from '../hooks/useWizardNavigation';
import { useErrorHandler } from '../hooks/useErrorHandler';

const CalculadoraSolar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { handleError, withErrorHandling } = useErrorHandler();
  
  const {
    data,
    advancedData,
    updateData,
    updateAdvancedData,
    resetCalculator
  } = useCalculatorData();

  const {
    currentStep,
    nextStep,
    prevStep,
    markStepCompleted
  } = useWizardNavigation({ 
    totalSteps: 4,
    onStepChange: (step) => {
      console.log(`Navegando al paso: ${step}`);
    }
  });

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

  const handleAdvancedDataUpdate = withErrorHandling(async (newData: any) => {
    updateAdvancedData({
      address: newData.address,
      roofAnalysis: newData.roofAnalysis,
      householdProfile: newData.householdProfile,
      consumptionPrediction: newData.consumptionPrediction,
      pvgisData: newData.pvgisData,
      coordinates: newData.coordinates
    });
    markStepCompleted(1);
  }, 'Error actualizando datos del análisis avanzado');

  const handleTechnicalStepNext = withErrorHandling(async () => {
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
    markStepCompleted(2);
    nextStep();
  }, 'Error en el paso técnico');

  const calculateAdvancedResults = withErrorHandling(async () => {
    if (!advancedData.roofAnalysis || !advancedData.consumptionPrediction) {
      throw new Error('Faltan datos necesarios para el cálculo. Complete el análisis del tejado y el perfil de consumo.');
    }

    // The calculation is handled by the useSolarResults hook
    if (calculatedResults) {
      updateAdvancedData({ advancedResults: calculatedResults });
      markStepCompleted(3);
      nextStep();
    } else if (calculationError) {
      throw new Error('Error al calcular los resultados. Verifica que todos los datos estén disponibles.');
    }
  }, 'Error calculando resultados avanzados');

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ErrorBoundary>
            <PasoAnalisisAvanzado
              onNext={nextStep}
              onPrev={prevStep}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              onDataUpdate={handleAdvancedDataUpdate}
            />
          </ErrorBoundary>
        );
      case 2:
        return (
          <ErrorBoundary>
            <PasoTecnico
              data={data}
              updateData={updateData}
              onNext={handleTechnicalStepNext}
              onPrev={prevStep}
              isLoading={isLoading}
            />
          </ErrorBoundary>
        );
      case 3:
        return (
          <ErrorBoundary>
            <PasoEconomico
              data={data}
              updateData={updateData}
              onNext={calculateAdvancedResults}
              onPrev={prevStep}
              isLoading={isCalculating}
              setIsLoading={setIsLoading}
            />
          </ErrorBoundary>
        );
      case 4:
        return calculatedResults ? (
          <ErrorBoundary>
            <AdvancedResults
              results={calculatedResults}
              onNewCalculation={resetCalculator}
            />
          </ErrorBoundary>
        ) : (
          <div className="card-premium text-center">
            <LoadingSpinner 
              message="Calculando resultados con datos reales..." 
              size="lg"
            />
            {calculationError && (
              <p className="text-red-400 mt-4">Error en el cálculo. Volviendo al paso anterior...</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Handle calculation errors
  React.useEffect(() => {
    if (calculationError && currentStep === 4) {
      handleError(calculationError, 'Error en los cálculos');
      setTimeout(() => prevStep(), 2000);
    }
  }, [calculationError, currentStep, prevStep, handleError]);

  // Move to results when calculation is ready
  React.useEffect(() => {
    if (calculatedResults && currentStep === 3) {
      updateAdvancedData({ advancedResults: calculatedResults });
      markStepCompleted(3);
      nextStep();
    }
  }, [calculatedResults, currentStep, updateAdvancedData, markStepCompleted, nextStep]);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default CalculadoraSolar;
