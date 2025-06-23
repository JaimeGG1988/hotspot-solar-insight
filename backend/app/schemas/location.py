from pydantic import BaseModel, Field
from typing import List

class LocationAnalyzeInput(BaseModel):
    """
    Schema for the input of the /location/analyze endpoint.
    """
    lat: float = Field(..., example=40.416775, description="Latitude of the location to analyze.")
    lng: float = Field(..., example=-3.703790, description="Longitude of the location to analyze.")

    class Config:
        schema_extra = {
            "example": {
                "lat": 40.416775,
                "lng": -3.703790
            }
        }

class RoofSection(BaseModel):
    """
    Schema representing a single section of a roof.
    """
    area: float = Field(..., example=50.5, description="Area of the roof section in square meters.")
    azimuth: float = Field(..., example=180.0, description="Azimuth of the roof section in degrees (0=N, 90=E, 180=S, 270=W).")
    tilt: float = Field(..., example=30.0, description="Tilt angle of the roof section in degrees from horizontal.")

    class Config:
        schema_extra = {
            "example": {
                "area": 50.5,
                "azimuth": 180.0,
                "tilt": 30.0
            }
        }

class LocationAnalyzeOutput(BaseModel):
    """
    Schema for the output of the /location/analyze endpoint.
    """
    roof_area_total: float = Field(..., example=120.75, alias="roofAreaTotal", description="Total usable roof area in square meters.")
    roof_sections: List[RoofSection] = Field(..., alias="roofSections", description="List of identified roof sections with their properties.")
    shading_factor_monthly: List[float] = Field(..., min_items=12, max_items=12, alias="shadingFactorMonthly", example=[0.9, 0.9, 0.95, 0.95, 1.0, 1.0, 1.0, 1.0, 0.95, 0.95, 0.9, 0.9], description="Monthly shading factor (0.0 to 1.0), 12 values starting from January.")
    shading_factor_annual: float = Field(..., example=0.95, alias="shadingFactorAnnual", description="Annual average shading factor (0.0 to 1.0).")
    max_kwp: float = Field(..., example=15.5, alias="maxKwp", description="Estimated maximum PV system size in kWp that can be installed.")

    class Config:
        allow_population_by_field_name = True # Permite usar tanto 'roof_area_total' como 'roofAreaTotal' al crear una instancia
        schema_extra = {
            "example": {
                "roofAreaTotal": 120.75,
                "roofSections": [
                    {"area": 70.25, "azimuth": 170.0, "tilt": 35.0},
                    {"area": 50.50, "azimuth": -10.0, "tilt": 35.0}
                ],
                "shadingFactorMonthly": [0.9, 0.9, 0.95, 0.95, 1.0, 1.0, 1.0, 1.0, 0.95, 0.95, 0.9, 0.9],
                "shadingFactorAnnual": 0.95,
                "maxKwp": 15.5
            }
        }
