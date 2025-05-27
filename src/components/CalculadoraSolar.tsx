
import React, { useState, useEffect } from 'react';
import Header from './Header';
import StepIndicator from './StepIndicator';
import PasoAnalisisAvanzado from './steps/PasoAnalisisAvanzado';
import PasoTecnico from './steps/PasoTecnico';
import PasoEconomico from './steps/PasoEconomico';
import AdvancedResults from './advanced/AdvancedResults';
import { CalculadoraData, defaultCalculadoraData } from '../types/CalculadoraTypes';
import { AddressDetails, RoofAnalysis, HouseholdProfile, ConsumptionPrediction, AdvancedResults as AdvancedResultsType } from '../types/AdvancedTypes';

const CalculadoraSolar = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CalculadoraData>(defaultCalculadoraData);
  const [isLoading, setIsLoading] = useState(false);
  
  // Advanced data
  const [advancedData, setAdvancedData] = useState<{
    address?: AddressDetails;
    roofAnalysis?: RoofAnalysis;
    householdProfile?: HouseholdProfile;
    consumptionPrediction?: ConsumptionPrediction;
    advancedResults?: AdvancedResultsType;
  }>({});

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('calculadoraSolarData');
    const savedAdvancedData = localStorage.getItem('calculadoraSolarAdvancedData');
    
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (error) {
        console.log('Error loading saved data:', error);
      }
    }
    
    if (savedAdvancedData) {
      try {
        setAdvancedData(JSON.parse(savedAdvancedData));
      } catch (error) {
        console.log('Error loading saved advanced data:', error);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('calculadoraSolarData', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('calculadoraSolarAdvancedData', JSON.stringify(advancedData));
  }, [advancedData]);

  const updateData = (stepData: Partial<CalculadoraData>) => {
    setData(prev => ({ ...prev, ...stepData }));
  };

  const updateAdvancedData = (newAdvancedData: Partial<typeof advancedData>) => {
    setAdvancedData(prev => ({ ...prev, ...newAdvancedData }));
  };

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
    if (!advancedData.roofAnalysis || !advancedData.consumptionPrediction) return;

    setIsLoading(true);
    
    try {
      // Simulate advanced calculations
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const roofAnalysis = advancedData.roofAnalysis;
      const consumption = advancedData.consumptionPrediction;
      
      // Calculate production based on roof analysis and PVGIS data
      const annualProduction = roofAnalysis.maxKwp * 1200 * roofAnalysis.shadingFactor; // kWh/year
      const selfConsumption = Math.min(annualProduction, consumption.currentAnnualKwh);
      const coverage = (selfConsumption / consumption.currentAnnualKwh) * 100;
      
      // Financial calculations
      const systemCost = roofAnalysis.maxKwp * 1200; // €/kWp
      const annualSavings = selfConsumption * 0.25; // €/kWh
      const payback = systemCost / annualSavings;
      const roi = (annualSavings / systemCost) * 100;
      
      // Mock subsidies
      const subsidies = {
        national: [
          {
            name: 'Programa de Incentivos al Autoconsumo y Almacenamiento',
            amount: systemCost * 0.15,
            type: 'percentage' as const,
            description: 'Subvención del 15% del coste de instalación',
            requirements: ['Instalación en vivienda habitual', 'Potencia < 10 kWp']
          }
        ],
        regional: [
          {
            name: 'Ayuda Autonómica para Energías Renovables',
            amount: 800,
            type: 'fixed' as const,
            description: 'Ayuda fija de 800€ para instalaciones residenciales',
            requirements: ['Residencia en la comunidad autónoma']
          }
        ],
        local: [],
        totalAmount: systemCost * 0.15 + 800,
        netSystemCost: systemCost - (systemCost * 0.15 + 800)
      };

      const scenarios = [
        {
          name: 'Conservador',
          systemSize: roofAnalysis.maxKwp * 0.7,
          cost: systemCost * 0.7,
          annualSavings: annualSavings * 0.7,
          payback: (systemCost * 0.7) / (annualSavings * 0.7),
          roi: ((annualSavings * 0.7) / (systemCost * 0.7)) * 100
        },
        {
          name: 'Recomendado',
          systemSize: roofAnalysis.maxKwp * 0.85,
          cost: systemCost * 0.85,
          annualSavings: annualSavings * 0.85,
          payback: (systemCost * 0.85) / (annualSavings * 0.85),
          roi: ((annualSavings * 0.85) / (systemCost * 0.85)) * 100
        },
        {
          name: 'Máximo',
          systemSize: roofAnalysis.maxKwp,
          cost: systemCost,
          annualSavings: annualSavings,
          payback: payback,
          roi: roi
        }
      ];

      const advancedResults: AdvancedResultsType = {
        // Basic results
        potenciaPicoInstalada_kWp: roofAnalysis.maxKwp * 0.85,
        potenciaInversor_kW: roofAnalysis.maxKwp * 0.85 * 0.9,
        produccionAnualEstimada_kWh: annualProduction * 0.85,
        porcentajeCoberturaFV: coverage * 0.85,
        ahorroEconomicoAnual_eur: annualSavings * 0.85,
        costeTotalInstalacion_eur: systemCost * 0.85,
        periodoRetornoInversion_anios: payback,
        
        // Advanced results
        roofAnalysis,
        consumptionPrediction: consumption,
        financialAnalysis: {
          systemCost: systemCost * 0.85,
          annualProduction: annualProduction * 0.85,
          annualSavings: annualSavings * 0.85,
          roi: roi,
          paybackYears: payback,
          npv25Years: (annualSavings * 0.85 * 20) - (systemCost * 0.85),
          irr: 12.5,
          scenarios
        },
        subsidies,
        environmentalImpact: {
          co2SavedAnnually: (annualProduction * 0.85 * 0.3) / 1000,
          co2Saved25Years: (annualProduction * 0.85 * 0.3 * 25) / 1000,
          treesEquivalent: Math.round((annualProduction * 0.85 * 0.3 * 25) / 1000 / 0.02)
        }
      };

      updateAdvancedData({ advancedResults });
      setCurrentStep(4);
      
    } catch (error) {
      console.error('Error calculating results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCalculator = () => {
    setData(defaultCalculadoraData);
    setAdvancedData({});
    setCurrentStep(1);
    localStorage.removeItem('calculadoraSolarData');
    localStorage.removeItem('calculadoraSolarAdvancedData');
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
                consumptionPrediction: newData.consumptionPrediction
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
              // Update technical data based on roof analysis
              if (advancedData.roofAnalysis) {
                const recommendedKwp = advancedData.roofAnalysis.maxKwp * 0.85;
                const recommendedInverter = recommendedKwp * 0.9;
                const moduleCount = Math.floor((recommendedKwp * 1000) / 450); // 450W modules
                
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
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 4:
        return advancedData.advancedResults ? (
          <AdvancedResults
            results={advancedData.advancedResults}
            onNewCalculation={resetCalculator}
          />
        ) : (
          <div className="card-premium text-center">
            <p className="text-white">Calculando resultados avanzados...</p>
          </div>
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
