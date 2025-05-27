
// API response types for external services

export interface GooglePlacesResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface GooglePlacesResponse {
  predictions: Array<{
    description: string;
    place_id: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>;
  status: string;
}

export interface PVGISResponse {
  outputs: {
    monthly: Array<{
      month: number;
      E_d: number; // Daily energy output (kWh/day)
      E_m: number; // Monthly energy output (kWh/month)
      H_sun: number; // Sun hours
    }>;
    totals: {
      fixed: {
        E_y: number; // Yearly energy output (kWh/year)
        PR: number; // Performance ratio
      };
    };
    hourly: Array<{
      time: string;
      P: number; // Power output (W)
      G_i: number; // Global irradiance (W/m²)
      T_2m: number; // Temperature (°C)
    }>;
  };
}

export interface ClimateData {
  temperature: {
    annual_avg: number;
    summer_avg: number;
    winter_avg: number;
  };
  irradiance: {
    annual_kwh_m2: number;
    peak_sun_hours: number;
  };
  weather_factors: {
    cloudy_days: number;
    wind_speed: number;
  };
}

export interface ConsumptionProfileData {
  provinceCode: string;
  averageConsumption: {
    residential: number;
    withAC: number;
    withHeating: number;
    withEV: number;
  };
  hourlyProfile: number[]; // 24 hours
  monthlyProfile: number[]; // 12 months
}
