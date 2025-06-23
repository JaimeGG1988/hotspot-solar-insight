
import { useState, useEffect } from 'react';
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

export const useCalculatorData = () => {
  const [data, setData] = useState<CalculadoraData>(defaultCalculadoraData);
  const [advancedData, setAdvancedData] = useState<AdvancedData>({});

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

  const updateAdvancedData = (newAdvancedData: Partial<AdvancedData>) => {
    setAdvancedData(prev => ({ ...prev, ...newAdvancedData }));
  };

  const resetCalculator = () => {
    setData(defaultCalculadoraData);
    setAdvancedData({});
    localStorage.removeItem('calculadoraSolarData');
    localStorage.removeItem('calculadoraSolarAdvancedData');
  };

  return {
    data,
    advancedData,
    updateData,
    updateAdvancedData,
    resetCalculator
  };
};
