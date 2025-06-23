
import React, { useState } from 'react';
import Header from './Header';
import StepIndicator from './StepIndicator';
import PasoAnalisisAvanzado from './steps/PasoAnalisisAvanzado';
import PasoTecnico from './steps/PasoTecnico';
import PasoEconomico from './steps/PasoEconomico';
import AdvancedResults from './advanced/AdvancedResults';
// import { useCalculatorData } from '../hooks/useCalculatorData'; // Eliminado
import { useCalculatorStore } from '@/stores/useCalculatorStore'; // Importar Zustand store
import { useSolarResults } from '../hooks/useSolarCalculations';
import { useWizardNavigation } from '../hooks/useWizardNavigation';

const CalculadoraSolar = () => {
  const [isLoading, setIsLoading] = useState(false); // Para spinners locales en pasos, si es necesario
  
  // Usar Zustand Store
  const {
    currentWizardStep: currentStepFromStore, // Renombrar para evitar conflicto con el del hook de navegación si se usa
    setWizardStep,
    locationInputs,
    consumptionManualInputs,
    consumptionCsvFile,
    pvConfigurationInputs,
    locationAnalysisResults,
    consumptionPredictionResults,
    financeAnalysisResults,
    setLocationInputs,
    setConsumptionManualInputs,
    setConsumptionCsvFile,
    setPvConfigurationInputs,
    setLocationAnalysisResults,
    setConsumptionPredictionResults,
    setFinanceAnalysisResults,
    resetCalculator: resetCalculatorStore // Renombrar para claridad
  } = useCalculatorStore();

  // TODO: Revisar si data y advancedData se mapean completamente a los nuevos campos del store
  // Por ahora, vamos a asumir que:
  // - `advancedData.address`, `advancedData.coordinates` -> `locationInputs`
  // - `advancedData.roofAnalysis` -> `locationAnalysisResults`
  // - `advancedData.householdProfile` -> `consumptionManualInputs` (parcialmente)
  // - `advancedData.consumptionPrediction` -> `consumptionPredictionResults`
  // - `advancedData.pvgisData` -> Quizás parte de `locationAnalysisResults` o un campo nuevo
  // - `advancedData.advancedResults` -> `financeAnalysisResults`
  // - `data` (CalculadoraData) parece ser para `PasoTecnico` y `PasoEconomico`.
  //   Sus campos (ej. `data.tecnico`, `data.economico`) necesitarán mapearse a `pvConfigurationInputs`
  //   o ser parte de los resultados de `financeAnalysisResults`.

  // El hook useWizardNavigation gestiona el estado del paso actual.
  // Podríamos sincronizarlo con el store de Zustand o usar uno como fuente de verdad.
  // Por ahora, useWizardNavigation sigue siendo la fuente de verdad para currentStep.
  // Cuando se llame a setWizardStep del store, también se debería actualizar el de useWizardNavigation si es necesario, o viceversa.
  // O, mejor, hacer que useWizardNavigation obtenga y actualice el currentStep desde Zustand.
  // Esto se abordará en el paso de implementación del Wizard.
  // Por ahora, usaremos el currentStep de useWizardNavigation.

  const {
    currentStep,
    nextStep,
    prevStep,
    markStepCompleted
  } = useWizardNavigation({ 
    totalSteps: 4,
    onStepChange: (step) => {
      console.log(`Navegando al paso: ${step}`);
      setWizardStep(step); // Sincronizar con Zustand
    }
  });

  // Sincronizar el currentStep del hook de navegación con Zustand al montar
  React.useEffect(() => {
    setWizardStep(currentStep);
  }, [currentStep, setWizardStep]);

  // Sincronizar el currentStep del store de Zustand con el hook de navegación si cambia externamente
  // (esto podría ser necesario si otros componentes modifican currentStep en Zustand)
  // React.useEffect(() => {
  //  if (currentStepFromStore !== currentStep && setCurrentStepInNavHook) { // setCurrentStepInNavHook no existe en useWizardNavigation
  //    setCurrentStepInNavHook(currentStepFromStore);
  //  }
  // }, [currentStepFromStore, currentStep, setCurrentStepInNavHook]);


  const {
    data: calculatedResults, // Esto es de useSolarResults, que es un hook de cálculo en frontend
    isLoading: isCalculating, // Esto también es de useSolarResults
    error: calculationError // Y esto
  } = useSolarResults(
    locationAnalysisResults, // Usar datos del store
    consumptionPredictionResults, // Usar datos del store
    locationInputs?.coordinates ? locationInputs.coordinates as [number, number] : undefined, // Usar datos del store
    locationAnalysisResults // Asumiendo que pvgisData podría estar dentro de locationAnalysisResults o ser otro campo del store
                           // Por ahora, el hook useSolarResults necesitará adaptarse a la nueva estructura del store.
                           // O, locationAnalysisResults ya contiene lo que antes era pvgisData.
                           // El tipo de pvgisData en el store no está definido, lo que es un TODO.
  );

  // Actualizado para usar acciones de Zustand
  const handleAdvancedDataUpdate = (newData: { // Tipar newData según lo que devuelve PasoAnalisisAvanzado
    address?: any; // Reemplazar 'any' con tipos específicos
    roofAnalysis?: any;
    householdProfile?: any;
    consumptionPrediction?: any;
    pvgisData?: any;
    coordinates?: [number, number];
  }) => {
    if (newData.address || newData.coordinates) {
      setLocationInputs({
        address: newData.address?.description, // Asumiendo que address es un objeto con description
        latitude: newData.coordinates?.[0],
        longitude: newData.coordinates?.[1]
      });
    }
    if (newData.roofAnalysis) { // Este sería el LocationAnalyzeOutput del backend
      setLocationAnalysisResults(newData.roofAnalysis);
    }
    if (newData.householdProfile) { // Esto mapearía a consumptionManualInputs
      // setConsumptionManualInputs(mapear householdProfile a ConsumptionManualInputs);
    }
    if (newData.consumptionPrediction) { // Este sería el ConsumptionOutput del backend
      setConsumptionPredictionResults(newData.consumptionPrediction);
    }
    // pvgisData: ¿dónde va? ¿Es parte de locationAnalysisResults?
    markStepCompleted(1);
  };

  // Esta función necesitará una revisión profunda.
  // 'data' y 'updateData' ya no existen. Se debe usar pvConfigurationInputs y setPvConfigurationInputs.
  // La lógica de recomendación debería moverse a un servicio o ser parte de la respuesta de /finance/calculate.
  const handleTechnicalStepNext = () => {
    if (locationAnalysisResults) {
      const recommendedKwp = Math.min(locationAnalysisResults.maxKwp * 0.85, 10);
      // const recommendedInverter = recommendedKwp * 0.9;
      // const moduleCount = Math.floor((recommendedKwp * 1000) / 450);
      
      setPvConfigurationInputs({
        // ... mapear los valores calculados a los campos de pvConfigurationInputs
        // panelCount: moduleCount,
        panelWp: recommendedKwp * 1000, // Ejemplo
      });
    }
    markStepCompleted(2);
    nextStep();
  };

  // Esta función también necesita revisión.
  // Debería llamar a /finance/calculate y guardar los resultados en financeAnalysisResults.
  // calculatedResults viene de useSolarResults (cálculo frontend), no del backend de finanzas.
  const calculateAdvancedResults = async () => {
    if (!locationAnalysisResults || !consumptionPredictionResults) {
      console.error('Missing required data for calculations (location or consumption results)');
      alert('Error: Faltan datos de análisis de ubicación o predicción de consumo.');
      return;
    }

    // TODO: Llamar al endpoint /api/finance/calculate usando React Query
    // y luego setFinanceAnalysisResults(resultadoDeLaAPI);

    // Por ahora, si useSolarResults (cálculo frontend) tiene datos, los usamos como placeholder
    if (calculatedResults) {
      // Esto es incorrecto, advancedResults debería ser el FinanceOutput del backend
      // setFinanceAnalysisResults({ dummyFinancialData: JSON.stringify(calculatedResults) }); // Placeholder
      console.warn("Usando 'calculatedResults' (cálculo frontend) como placeholder para resultados financieros.")
      markStepCompleted(3);
      nextStep();
    } else if (calculationError) {
      console.error('Error en useSolarResults (cálculo frontend):', calculationError);
      alert('Error al calcular los resultados preliminares (frontend).');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PasoAnalisisAvanzado
            onNext={nextStep} // useWizardNavigation
            onPrev={prevStep} // useWizardNavigation
            isLoading={isLoading} // Estado local, podría moverse a Zustand si es global
            setIsLoading={setIsLoading} // Para el estado local
            // onDataUpdate ahora debería usar las acciones del store de Zustand directamente
            // o este componente debería obtener y establecer los datos del store.
            // Por ahora, `handleAdvancedDataUpdate` usa las acciones del store.
            onDataUpdate={handleAdvancedDataUpdate}
            // Pasar los datos relevantes del store si el componente los necesita como props iniciales
            initialLocationInputs={locationInputs}
            initialLocationAnalysis={locationAnalysisResults}
          />
        );
      case 2:
        // PasoTecnico necesita ser refactorizado para usar/actualizar pvConfigurationInputs de Zustand
        // en lugar de 'data' y 'updateData'.
        return (
          <PasoTecnico
            // data={data} // Reemplazar con pvConfigurationInputs y otros datos del store si es necesario
            // updateData={updateData} // Reemplazar con setPvConfigurationInputs
            pvConfigInputs={pvConfigurationInputs} // Ejemplo
            setPvConfigInputs={setPvConfigurationInputs} // Ejemplo
            locationAnalysis={locationAnalysisResults} // Para recomendaciones
            onNext={handleTechnicalStepNext}
            onPrev={prevStep}
            isLoading={isLoading}
          />
        );
      case 3:
        // PasoEconomico necesita ser refactorizado.
        // 'data' y 'updateData' ya no existen.
        // Debería usar datos de location, consumption, y pvConfiguration para preparar la llamada a /finance/calculate.
        return (
          <PasoEconomico
            // data={data}
            // updateData={updateData}
            // Pasar todos los datos necesarios para el cálculo financiero desde el store
            onNext={calculateAdvancedResults} // Este llamará a /finance/calculate (eventualmente)
            onPrev={prevStep}
            isLoading={isCalculating} // ¿O un isLoading específico para finanzas?
            setIsLoading={setIsLoading}
          />
        );
      case 4:
        // AdvancedResults debería tomar `financeAnalysisResults` del store.
        // `calculatedResults` es del hook de cálculo frontend y es un placeholder aquí.
        return financeAnalysisResults ? ( // O el placeholder calculatedResults por ahora
          <AdvancedResults
            results={financeAnalysisResults || calculatedResults} // Priorizar el del store
            onNewCalculation={resetCalculatorStore} // Usar la acción del store
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

  // Handle calculation errors
  React.useEffect(() => {
    if (calculationError && currentStep === 4) {
      setTimeout(() => prevStep(), 2000);
    }
  }, [calculationError, currentStep, prevStep]);

  // Move to results when calculation is ready
  React.useEffect(() => {
    if (calculatedResults && currentStep === 3 && !financeAnalysisResults) { // Solo si no tenemos resultados de finanzas reales
      // updateAdvancedData({ advancedResults: calculatedResults }); // Ya no existe updateAdvancedData
      // setFinanceAnalysisResults({ dummyFinancialData: JSON.stringify(calculatedResults) }); // No hacer esto automáticamente
      // La navegación al siguiente paso la maneja calculateAdvancedResults
      console.log("calculatedResults (frontend) disponible en el paso 3, esperando acción del usuario para 'calculateAdvancedResults'")
    }
  // }, [calculatedResults, currentStep, updateAdvancedData, markStepCompleted, nextStep]); // Dependencias originales
  }, [calculatedResults, currentStep, financeAnalysisResults]); // Dependencias actualizadas

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
