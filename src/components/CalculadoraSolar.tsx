
import React, { useState, useEffect } from 'react';
import Header from './Header';
import StepIndicator from './StepIndicator';
import PasoConsumo from './steps/PasoConsumo';
import PasoInstalacion from './steps/PasoInstalacion';
import PasoTecnico from './steps/PasoTecnico';
import PasoEconomico from './steps/PasoEconomico';
import PasoResultados from './steps/PasoResultados';
import { CalculadoraData, defaultCalculadoraData } from '../types/CalculadoraTypes';

const CalculadoraSolar = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CalculadoraData>(defaultCalculadoraData);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos del localStorage al montar el componente
  useEffect(() => {
    const savedData = localStorage.getItem('calculadoraSolarData');
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (error) {
        console.log('Error loading saved data:', error);
      }
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('calculadoraSolarData', JSON.stringify(data));
  }, [data]);

  const updateData = (stepData: Partial<CalculadoraData>) => {
    setData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const resetCalculator = () => {
    setData(defaultCalculadoraData);
    setCurrentStep(1);
    localStorage.removeItem('calculadoraSolarData');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PasoConsumo
            data={data}
            updateData={updateData}
            onNext={nextStep}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <PasoInstalacion
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 3:
        return (
          <PasoTecnico
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <PasoEconomico
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 5:
        return (
          <PasoResultados
            data={data}
            onPrev={prevStep}
            onReset={resetCalculator}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-azul-hotspot via-azul-hotspot to-gris-hotspot-profundo">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <StepIndicator currentStep={currentStep} totalSteps={5} />
          
          <div className="mt-8">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraSolar;
