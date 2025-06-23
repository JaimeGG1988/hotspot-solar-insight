import requests
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# PVGIS API base URL for version 5.2, PV calculation endpoint
PVGIS_API_URL = os.getenv("PVGIS_API_URL_CALC", "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc")
PVGIS_API_HORIZON_URL = os.getenv("PVGIS_API_URL_HORIZON", "https://re.jrc.ec.europa.eu/api/v5_2/SHcalc")


def get_pvgis_data(lat: float, lng: float, peak_power_kwp: float = 1.0, system_loss: float = 14.0, optimal_inclination: bool = True, optimal_azimuth: bool = True) -> dict:
    """
    Fetches photovoltaic (PV) performance data from PVGIS API.
    This includes monthly and annual energy production, solar radiation, and optimal angles if requested.

    Args:
        lat: Latitude of the location.
        lng: Longitude of the location.
        peak_power_kwp: Nominal power of the PV system in kWp.
        system_loss: Overall system losses in percentage (e.g., 14 for 14%).
        optimal_inclination: If True, requests PVGIS to calculate optimal inclination.
        optimal_azimuth: If True, requests PVGIS to calculate optimal azimuth.

    Returns:
        A dictionary containing the parsed JSON response from PVGIS,
        or an empty dictionary if an error occurs.
    """
    params = {
        'lat': lat,
        'lon': lng,
        'peakpower': peak_power_kwp,
        'loss': system_loss,
        'outputformat': 'json',
        'optimalinclination': '1' if optimal_inclination else '0',
        'optimalangle': '1' if optimal_azimuth else '0', # 'optimalangle' is for azimuth in PVGIS
        # 'inclination': 35, # Example fixed inclination if optimalinclination=0
        # 'azimuth': 0,    # Example fixed azimuth (0=south) if optimalangle=0
        'raddatabase': 'PVGIS-SARAH2', # Using a recent radiation database
        'components': '1' # To get more detailed component data if needed later
    }

    logger.info(f"Querying PVGIS PVcalc API for lat={lat}, lng={lng} with params: {params}")

    # For now, returning mock data as per the plan for initial service implementation
    # try:
    #     response = requests.get(PVGIS_API_URL, params=params)
    #     response.raise_for_status() # Raises HTTPError for bad responses (4XX or 5XX)
    #     data = response.json()
    #     logger.info(f"Successfully received data from PVGIS PVcalc API for lat={lat}, lng={lng}")
    #     return data
    # except requests.exceptions.RequestException as e:
    #     logger.error(f"Error querying PVGIS PVcalc API: {e}")
    #     return {}
    # except ValueError as e: # Handles JSON decoding errors
    #     logger.error(f"Error decoding JSON from PVGIS PVcalc API: {e}")
    #     return {}

    # --- MOCK DATA ---
    # This mock data simulates a response for a location, requesting optimal angles.
    mock_pvgis_response = {
        "inputs": {
            "location": {"latitude": lat, "longitude": lng, "elevation": 100.0},
            "meteo_data": {"radiation_db": "PVGIS-SARAH2", "meteo_db": "ERA-Interim"},
            "mounting_system": {
                "fixed": {
                    "slope": {"value": 33.5, "optimal": "yes" if optimal_inclination else "no"}, # Example optimal tilt
                    "azimuth": {"value": -5.0, "optimal": "yes" if optimal_azimuth else "no"}    # Example optimal azimuth (slightly west of South)
                }
            },
            "pv_module": {"technology": "c-Si", "peak_power": peak_power_kwp, "system_loss": system_loss}
        },
        "outputs": {
            "totals": {
                "fixed": {
                    "E_d": 3.85, # Average daily production (kWh/day)
                    "E_m": 117.2, # Average monthly production (kWh/month)
                    "E_y": 1406.5, # Average annual production (kWh/year)
                    "H(i)_d": 4.5, # Average daily sum of global irradiation per square meter (kWh/m2/day)
                    "H(i)_m": 136.8, # Average monthly sum of global irradiation per square meter (kWh/m2/month)
                    "H(i)_y": 1642.1, # Average annual sum of global irradiation per square meter (kWh/m2/year)
                    "SD_m": 15.5,  # Standard deviation of monthly energy production
                    "SD_y": 80.1,  # Standard deviation of annual energy production
                    "l_cs": 2.0,   # Cable losses (%)
                    "l_dc": 1.5,   # DC ohmic losses (%)
                    "l_inv": 3.0,  # Inverter losses (%)
                    "l_misc": 1.0, # Miscellaneous losses (%)
                    "l_sh": 0.0,   # Shading losses (external, not from PVGIS horizon)
                    "l_tmp": 6.5,  # Temperature losses (%)
                    "aoi_modifier": 0.95 # Angle of incidence modifier (average)
                }
            },
            "monthly": { # Per kWp
                "fixed": [
                    {"month": 1, "E_d": 2.5, "E_m": 77.5, "H(i)_d": 2.8, "H(i)_m": 86.8, "T2m": 5.0},
                    {"month": 2, "E_d": 3.0, "E_m": 84.0, "H(i)_d": 3.5, "H(i)_m": 98.0, "T2m": 6.0},
                    {"month": 3, "E_d": 4.0, "E_m": 124.0, "H(i)_d": 4.8, "H(i)_m": 148.8, "T2m": 9.0},
                    {"month": 4, "E_d": 4.5, "E_m": 135.0, "H(i)_d": 5.5, "H(i)_m": 165.0, "T2m": 12.0},
                    {"month": 5, "E_d": 5.0, "E_m": 155.0, "H(i)_d": 6.2, "H(i)_m": 192.2, "T2m": 16.0},
                    {"month": 6, "E_d": 5.2, "E_m": 156.0, "H(i)_d": 6.5, "H(i)_m": 195.0, "T2m": 20.0},
                    {"month": 7, "E_d": 5.1, "E_m": 158.1, "H(i)_d": 6.4, "H(i)_m": 198.4, "T2m": 23.0},
                    {"month": 8, "E_d": 4.8, "E_m": 148.8, "H(i)_d": 5.9, "H(i)_m": 182.9, "T2m": 22.0},
                    {"month": 9, "E_d": 4.2, "E_m": 126.0, "H(i)_d": 5.0, "H(i)_m": 150.0, "T2m": 18.0},
                    {"month": 10, "E_d": 3.5, "E_m": 108.5, "H(i)_d": 4.0, "H(i)_m": 124.0, "T2m": 14.0},
                    {"month": 11, "E_d": 2.8, "E_m": 84.0, "H(i)_d": 3.0, "H(i)_m": 90.0, "T2m": 9.0},
                    {"month": 12, "E_d": 2.3, "E_m": 71.3, "H(i)_d": 2.5, "H(i)_m": 77.5, "T2m": 6.0}
                ]
            }
        }
    }
    logger.info("PVGIS service (get_pvgis_data) returning mock data.")
    return mock_pvgis_response

def get_pvgis_terrain_horizon(lat: float, lng: float) -> dict:
    """
    Fetches terrain horizon data from PVGIS API (SHcalc).
    This data can be used for more precise shading calculations if needed.

    Args:
        lat: Latitude of the location.
        lng: Longitude of the location.

    Returns:
        A dictionary containing the parsed JSON response from PVGIS for horizon data,
        or an empty dictionary if an error occurs.
    """
    params = {
        'lat': lat,
        'lon': lng,
        'outputformat': 'json',
        'terrain': '1' # Request terrain data
    }
    logger.info(f"Querying PVGIS SHcalc (horizon) API for lat={lat}, lng={lng}")

    # For now, returning mock data
    # try:
    #     response = requests.get(PVGIS_API_HORIZON_URL, params=params)
    #     response.raise_for_status()
    #     data = response.json()
    #     logger.info(f"Successfully received data from PVGIS SHcalc API for lat={lat}, lng={lng}")
    #     return data
    # except requests.exceptions.RequestException as e:
    #     logger.error(f"Error querying PVGIS SHcalc API: {e}")
    #     return {}
    # except ValueError as e: # Handles JSON decoding errors
    #     logger.error(f"Error decoding JSON from PVGIS SHcalc API: {e}")
    #     return {}

    # --- MOCK DATA for Horizon ---
    mock_horizon_data = {
        "inputs": {"location": {"latitude": lat, "longitude": lng}},
        "outputs": {
            "terrain_profile": [ # Azimuth (degrees from North), Height (degrees)
                {"azimuth": 0, "height": 2.1}, {"azimuth": 10, "height": 2.5},
                {"azimuth": 20, "height": 2.8}, {"azimuth": 30, "height": 3.0},
                # ... more data points up to 350 degrees
                {"azimuth": 180, "height": 1.0}, # Example: South might be less obstructed
                {"azimuth": 270, "height": 5.5}, # Example: West might have a hill
                {"azimuth": 350, "height": 2.2}
            ],
            "sun_path": { # Not typically used directly by us, but PVGIS provides it
                "winter_solstice": [{"azimuth": 120, "elevation": 15}, {"azimuth": 180, "elevation": 20}],
                "summer_solstice": [{"azimuth": 60, "elevation": 60}, {"azimuth": 180, "elevation": 70}]
            }
        },
        "meta": {"source": "SRTM", "resolution": "90m"}
    }
    logger.info("PVGIS service (get_pvgis_terrain_horizon) returning mock data.")
    return mock_horizon_data
