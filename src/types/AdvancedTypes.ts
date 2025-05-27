
// Advanced types for the enhanced solar calculator
export interface AddressDetails {
  fullAddress: string;
  street: string;
  number: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
}

export interface RoofAnalysis {
  usableArea: number; // m²
  totalArea: number; // m²
  orientation: number; // degrees from south
  inclination: number; // degrees from horizontal
  shadingFactor: number; // 0-1 (1 = no shading)
  maxKwp: number; // maximum installable kWp
  roofSections: RoofSection[];
}

export interface RoofSection {
  id: string;
  area: number;
  orientation: number;
  inclination: number;
  shadingFactor: number;
  panelCount: number;
}

export interface HouseholdProfile {
  houseType: 'apartment' | 'house' | 'townhouse';
  occupants: number;
  surfaceArea: number;
  constructionYear: number;
  hasAirConditioning: boolean;
  hasElectricHeating: boolean;
  hasPool: boolean;
  hasEV: boolean;
  evModel?: string;
  annualKm?: number;
  electricBill: {
    monthlyKwh: number;
    monthlyCost: number;
  };
}

export interface ConsumptionPrediction {
  currentAnnualKwh: number;
  futureAnnualKwh: number; // with planned additions
  hourlyProfile: number[]; // 8760 values
  monthlyProfile: number[]; // 12 values
  peakPower: number; // kW
}

export interface FinancialAnalysis {
  systemCost: number;
  annualProduction: number;
  annualSavings: number;
  roi: number;
  paybackYears: number;
  npv25Years: number;
  irr: number;
  scenarios: FinancialScenario[];
}

export interface FinancialScenario {
  name: string;
  systemSize: number;
  cost: number;
  annualSavings: number;
  payback: number;
  roi: number;
}

export interface Subsidies {
  national: SubsidyInfo[];
  regional: SubsidyInfo[];
  local: SubsidyInfo[];
  totalAmount: number;
  netSystemCost: number;
}

export interface SubsidyInfo {
  name: string;
  amount: number;
  type: 'percentage' | 'fixed' | 'per_kwp';
  maxAmount?: number;
  description: string;
  requirements: string[];
}

export interface AdvancedResults extends Resultados {
  roofAnalysis: RoofAnalysis;
  consumptionPrediction: ConsumptionPrediction;
  financialAnalysis: FinancialAnalysis;
  subsidies: Subsidies;
  environmentalImpact: {
    co2SavedAnnually: number;
    co2Saved25Years: number;
    treesEquivalent: number;
  };
}
