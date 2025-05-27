
import React, { useState, useEffect } from 'react';
import Header from './Header';
import StepIndicator from './StepIndicator';
import PasoAnalisisAvanzado from './steps/PasoAnalisisAvanzado';
import PasoTecnico from './steps/PasoTecnico';
import PasoEconomico from './steps/PasoEconomico';
import AdvancedResults from './advanced/AdvancedResults';
import { CalculadoraData, defaultCalculadoraData } from '../types/CalculadoraTypes';
import { AddressDetails, RoofAnalysis, HouseholdProfile, ConsumptionPrediction, AdvancedResultsType, FinancialAnalysis } from '../types/AdvancedTypes';
import { ApiClient } from '../utils/apiClients';
import { SolarCalculations } from '../utils/solarCalculations';

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
      console.log('Starting advanced calculations with real data...');
      
      const roofAnalysis = advancedData.roofAnalysis;
      const consumption = advancedData.consumptionPrediction;
      
      // Get real PVGIS data for the location
      const pvgisData = await ApiClient.getSolarData(40.4168, -3.7038, roofAnalysis.maxKwp);
      console.log('PVGIS data for calculations:', pvgisData);
      
      // Calculate production using real solar data
      const specificYield = pvgisData.outputs.totals.fixed.E_y; // kWh/kWp/year from PVGIS
      const recommendedKwp = roofAnalysis.maxKwp * 0.85; // Conservative sizing
      const annualProduction = SolarCalculations.calculateAnnualProduction(pvgisData, recommendedKwp);
      
      console.log('Annual production calculated:', annualProduction, 'kWh');
      
      // Generate hourly profiles for detailed analysis
      const hourlyProduction = SolarCalculations.generateHourlyProduction(pvgisData, recommendedKwp);
      const profileData = await ApiClient.getConsumptionProfile('madrid');
      const hourlyConsumption = SolarCalculations.generateHourlyConsumption(
        consumption.currentAnnualKwh,
        profileData,
        advancedData.householdProfile?.hasAirConditioning,
        advancedData.householdProfile?.hasElectricHeating,
        advancedData.householdProfile?.hasEV
      );
      
      // Calculate energy balance
      const energyBalance = SolarCalculations.calculateEnergyBalance(hourlyProduction, hourlyConsumption);
      console.log('Energy balance:', energyBalance);
      
      // Financial calculations with real data
      const systemCost = recommendedKwp * 1200; // €/kWp
      const electricityPrice = 0.25; // €/kWh
      const annualSavings = energyBalance.selfConsumption * electricityPrice + 
                           energyBalance.gridInjection * 0.05; // Lower price for injection
      
      const financialMetrics = SolarCalculations.calculateFinancialMetrics(
        systemCost,
        annualSavings,
        0.03, // 3% electricity price increase
        0.05, // 5% discount rate
        25    // 25-year lifespan
      );

      // Environmental impact
      const environmentalImpact = SolarCalculations.calculateEnvironmentalImpact(annualProduction, 25);

      // Mock subsidies (in production, integrate with real subsidy APIs)
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
          systemSize: recommendedKwp * 0.8,
          cost: systemCost * 0.8,
          annualSavings: annualSavings * 0.8,
          payback: (systemCost * 0.8) / (annualSavings * 0.8),
          roi: ((annualSavings * 0.8) / (systemCost * 0.8)) * 100
        },
        {
          name: 'Recomendado',
          systemSize: recommendedKwp,
          cost: systemCost,
          annualSavings: annualSavings,
          payback: financialMetrics.paybackYears || 0,
          roi: financialMetrics.roi || 0
        },
        {
          name: 'Máximo',
          systemSize: roofAnalysis.maxKwp,
          cost: roofAnalysis.maxKwp * 1200,
          annualSavings: annualSavings * 1.18,
          payback: (roofAnalysis.maxKwp * 1200) / (annualSavings * 1.18),
          roi: ((annualSavings * 1.18) / (roofAnalysis.maxKwp * 1200)) * 100
        }
      ];

      const advancedResults: AdvancedResultsType = {
        // Basic results
        potenciaPicoInstalada_kWp: recommendedKwp,
        potenciaInversor_kW: recommendedKwp * 0.9,
        produccionAnualEstimada_kWh: annualProduction,
        porcentajeCoberturaFV: energyBalance.autarkyRate,
        ahorroEconomicoAnual_eur: annualSavings,
        costeTotalInstalacion_eur: systemCost,
        periodoRetornoInversion_anios: financialMetrics.paybackYears || 0,
        
        // Advanced results
        roofAnalysis,
        consumptionPrediction: consumption,
        financialAnalysis: {
          ...financialMetrics,
          systemCost,
          annualProduction,
          annualSavings,
          scenarios
        } as FinancialAnalysis,
        subsidies,
        environmentalImpact
      };

      console.log('Advanced results calculated:', advancedResults);
      updateAdvancedData({ advancedResults });
      setCurrentStep(4);
      
    } catch (error) {
      console.error('Error calculating results:', error);
      // Simple error handling without setApiError
      alert('Error al calcular los resultados. Inténtalo de nuevo.');
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
