from pydantic import BaseModel, Field, validator
from typing import List, Optional

class ConsumptionManualInput(BaseModel):
    """
    Schema for manual input to predict energy consumption.
    """
    occupants: int = Field(..., gt=0, example=3, description="Number of occupants in the household.")
    area_m2: int = Field(..., gt=0, example=120, description="Total area of the household in square meters.")
    has_ev: bool = Field(default=False, example=True, description="Does the household have an Electric Vehicle?")
    has_heat_pump: bool = Field(default=False, example=False, description="Does the household have a heat pump for heating/cooling?")
    # CLP (Código de Punto de Suministro) is usually a long string, e.g., ES0021000000123456ABCD
    clp: Optional[str] = Field(None, example="ES0021000000123456ABCD", description="Optional. Supply Point Code (CUPS in Spain).", min_length=20, max_length=22)

    class Config:
        schema_extra = {
            "example": {
                "occupants": 3,
                "area_m2": 120,
                "has_ev": True,
                "has_heat_pump": False,
                "clp": "ES0021000000123456ABCD"
            }
        }

class ConsumptionOutput(BaseModel):
    """
    Schema for the output of consumption prediction endpoints.
    """
    annual_kwh: float = Field(..., example=4500.5, description="Total estimated annual energy consumption in kWh.")
    monthly_kwh: List[float] = Field(..., min_items=12, max_items=12, example=[300.0, 320.5, ..., 450.0], description="Estimated monthly energy consumption in kWh (12 values, Jan-Dec).")
    hourly_profile: List[float] = Field(..., min_items=8760, max_items=8760, description="Estimated hourly energy consumption profile for a full year in kWh (8760 values).")
    peak_power_kw: float = Field(..., example=5.5, description="Estimated peak power demand in kW.")

    @validator('monthly_kwh')
    def monthly_kwh_must_have_12_values(cls, v):
        if len(v) != 12:
            raise ValueError('monthly_kwh must contain exactly 12 values.')
        return v

    @validator('hourly_profile')
    def hourly_profile_must_have_8760_values(cls, v):
        if len(v) != 8760:
            raise ValueError('hourly_profile must contain exactly 8760 values.')
        return v

    class Config:
        schema_extra = {
            "example": {
                "annual_kwh": 4500.5,
                "monthly_kwh": [300, 310, 350, 380, 420, 450, 460, 440, 400, 360, 320, 310.5],
                "hourly_profile": [0.1, 0.1, ..., 0.8, 0.5], # Truncated for example
                "peak_power_kw": 5.5
            }
        }
