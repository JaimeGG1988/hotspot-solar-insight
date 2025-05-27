
import { PVGISResponse, ConsumptionProfileData } from '../types/ApiTypes';
import { RoofAnalysis, ConsumptionPrediction, FinancialAnalysis } from '../types/AdvancedTypes';

export class SolarCalculations {
  // Calculate roof capacity based on area and panel specifications
  static calculateRoofCapacity(roofArea: number, panelPower: number = 450, panelArea: number = 2.3): number {
    const panelsPerM2 = 1 / panelArea;
    const maxPanels = Math.floor(roofArea * panelsPerM2 * 0.85); // 85% efficiency factor
    return (maxPanels * panelPower) / 1000; // Convert to kWp
  }

  // Calculate annual production from PVGIS data
  static calculateAnnualProduction(pvgisData: PVGISResponse, systemKwp: number): number {
    const specificYield = pvgisData.outputs.totals.fixed.E_y; // kWh/kWp/year
    return specificYield * systemKwp;
  }

  // Calculate self-consumption and grid injection
  static calculateEnergyBalance(
    production: number[], // Hourly production
    consumption: number[]  // Hourly consumption
  ): {
    selfConsumption: number;
    gridInjection: number;
    gridConsumption: number;
    selfConsumptionRate: number;
    autarkyRate: number;
  } {
    let selfConsumption = 0;
    let gridInjection = 0;
    let gridConsumption = 0;

    for (let i = 0; i < Math.min(production.length, consumption.length); i++) {
      const prod = production[i];
      const cons = consumption[i];

      if (prod >= cons) {
        selfConsumption += cons;
        gridInjection += (prod - cons);
      } else {
        selfConsumption += prod;
        gridConsumption += (cons - prod);
      }
    }

    const totalProduction = production.reduce((sum, p) => sum + p, 0);
    const totalConsumption = consumption.reduce((sum, c) => sum + c, 0);

    return {
      selfConsumption,
      gridInjection,
      gridConsumption,
      selfConsumptionRate: totalProduction > 0 ? (selfConsumption / totalProduction) * 100 : 0,
      autarkyRate: totalConsumption > 0 ? (selfConsumption / totalConsumption) * 100 : 0
    };
  }

  // Generate hourly consumption profile
  static generateHourlyConsumption(
    annualConsumption: number,
    profileData: ConsumptionProfileData,
    hasAC: boolean = false,
    hasHeating: boolean = false,
    hasEV: boolean = false
  ): number[] {
    const { hourlyProfile, monthlyProfile } = profileData;
    const baseConsumption = annualConsumption;
    
    // Adjust for appliances
    let adjustedConsumption = baseConsumption;
    if (hasAC) adjustedConsumption *= 1.2;
    if (hasHeating) adjustedConsumption *= 1.15;
    if (hasEV) adjustedConsumption *= 1.3;

    const hourlyConsumption: number[] = [];
    
    for (let day = 0; day < 365; day++) {
      const month = Math.floor(day / 30.4); // Approximate month
      const monthlyFactor = monthlyProfile[Math.min(month, 11)];
      
      for (let hour = 0; hour < 24; hour++) {
        const hourlyFactor = hourlyProfile[hour];
        const dailyAverage = (adjustedConsumption * monthlyFactor) / 365;
        const hourlyValue = (dailyAverage * hourlyFactor) / 24;
        
        // Add some randomness for realism
        const randomFactor = 0.9 + Math.random() * 0.2;
        hourlyConsumption.push(hourlyValue * randomFactor);
      }
    }

    return hourlyConsumption;
  }

  // Generate hourly production profile from PVGIS data
  static generateHourlyProduction(pvgisData: PVGISResponse, systemKwp: number): number[] {
    return pvgisData.outputs.hourly.map(hour => (hour.P * systemKwp) / 1000); // Convert to kWh
  }

  // Calculate financial metrics
  static calculateFinancialMetrics(
    systemCost: number,
    annualSavings: number,
    electricityPriceIncrease: number = 0.03,
    discountRate: number = 0.05,
    systemLifespan: number = 25
  ): Partial<FinancialAnalysis> {
    // Calculate NPV
    let npv = -systemCost;
    for (let year = 1; year <= systemLifespan; year++) {
      const yearlyRevenue = annualSavings * Math.pow(1 + electricityPriceIncrease, year - 1);
      npv += yearlyRevenue / Math.pow(1 + discountRate, year);
    }

    // Calculate IRR (simplified approximation)
    const totalSavings = annualSavings * systemLifespan;
    const irr = ((totalSavings / systemCost) ** (1 / systemLifespan) - 1) * 100;

    // Payback period
    let cumulativeSavings = 0;
    let paybackYears = 0;
    for (let year = 1; year <= systemLifespan; year++) {
      const yearlyRevenue = annualSavings * Math.pow(1 + electricityPriceIncrease, year - 1);
      cumulativeSavings += yearlyRevenue;
      if (cumulativeSavings >= systemCost) {
        paybackYears = year;
        break;
      }
    }

    return {
      systemCost,
      annualProduction: 0, // Will be calculated separately
      annualSavings,
      roi: (annualSavings / systemCost) * 100,
      paybackYears,
      npv25Years: npv,
      irr,
      scenarios: []
    };
  }

  // Calculate CO2 savings
  static calculateEnvironmentalImpact(annualProduction: number, systemLifespan: number = 25): {
    co2SavedAnnually: number;
    co2Saved25Years: number;
    treesEquivalent: number;
  } {
    const co2FactorSpain = 0.331; // kg CO2/kWh for Spanish grid (2023)
    const co2SavedAnnually = (annualProduction * co2FactorSpain) / 1000; // tons CO2/year
    const co2Saved25Years = co2SavedAnnually * systemLifespan;
    const treesEquivalent = Math.round(co2Saved25Years / 0.025); // 1 tree absorbs ~25kg CO2/year

    return {
      co2SavedAnnually,
      co2Saved25Years,
      treesEquivalent
    };
  }
}
