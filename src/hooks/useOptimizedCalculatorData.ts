
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalculadoraData, defaultCalculadoraData } from '../types/CalculadoraTypes';
import { AddressDetails, RoofAnalysis, HouseholdProfile, ConsumptionPrediction, AdvancedResultsType } from '../types/AdvancedTypes';

interface AdvancedData {
  address?: AddressDetails;
  roofAnalysis?: RoofAnalysis;
  householdProfile?: HouseholdProfile;
  consumptionPrediction?: ConsumptionPrediction;
  pvgisData?: any;
  coordinates?: [number, number];
  advancedResults?: AdvancedResultsType;
}

export const useOptimizedCalculatorData = () => {
  const [data, setData] = useState<CalculadoraData>(defaultCalculadoraData);
  const [advancedData, setAdvancedData] = useState<AdvancedData>({});

  // Load data from localStorage only once
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

  // Debounced save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('calculadoraSolarData', JSON.stringify(data));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [data]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('calculadoraSolarAdvancedData', JSON.stringify(advancedData));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [advancedData]);

  const updateData = useCallback((stepData: Partial<CalculadoraData>) => {
    setData(prev => ({ ...prev, ...stepData }));
  }, []);

  const updateAdvancedData = useCallback((newAdvancedData: Partial<AdvancedData>) => {
    setAdvancedData(prev => ({ ...prev, ...newAdvancedData }));
  }, []);

  const resetCalculator = useCallback(() => {
    setData(defaultCalculadoraData);
    setAdvancedData({});
    localStorage.removeItem('calculadoraSolarData');
    localStorage.removeItem('calculadoraSolarAdvancedData');
  }, []);

  // Memoized calculations status
  const calculationStatus = useMemo(() => ({
    hasAddressData: !!advancedData.address,
    hasRoofAnalysis: !!advancedData.roofAnalysis,
    hasHouseholdProfile: !!advancedData.householdProfile,
    hasConsumptionPrediction: !!advancedData.consumptionPrediction,
    hasPvgisData: !!advancedData.pvgisData,
    hasResults: !!advancedData.advancedResults,
    isReadyForCalculation: !!(
      advancedData.roofAnalysis && 
      advancedData.consumptionPrediction && 
      advancedData.coordinates && 
      advancedData.pvgisData
    )
  }), [advancedData]);

  return {
    data,
    advancedData,
    updateData,
    updateAdvancedData,
    resetCalculator,
    calculationStatus
  };
};
