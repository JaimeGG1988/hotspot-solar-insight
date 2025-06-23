import requests
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

OVERPASS_API_URL = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")

def get_building_and_obstacle_data(lat: float, lng: float, building_radius_m: int = 30, obstacles_radius_m: int = 150) -> dict:
    """
    Fetches building footprint and nearby obstacles (other buildings, trees) using Overpass API.
    This version combines queries for efficiency.

    Args:
        lat: Latitude of the center point.
        lng: Longitude of the center point.
        building_radius_m: Radius to search for the main building.
        obstacles_radius_m: Radius to search for obstacles.

    Returns:
        A dictionary containing GeoJSON-like elements from Overpass,
        or an empty dictionary if an error occurs or no data is found.
        The result will distinguish between 'building' and 'obstacles'.
    """
    # Overpass QL query
    # It looks for:
    # 1. Buildings within building_radius_m (target building)
    # 2. Buildings within obstacles_radius_m (obstacle buildings)
    # 3. Trees within obstacles_radius_m (obstacle trees)
    # It uses `out geom;` to get full geometry.
    query = f"""
    [out:json][timeout:30];
    (
      // Target building
      way(around:{building_radius_m},{lat},{lng})["building"];
      relation(around:{building_radius_m},{lat},{lng})["building"];
      // Obstacle buildings
      way(around:{obstacles_radius_m},{lat},{lng})["building"];
      relation(around:{obstacles_radius_m},{lat},{lng})["building"];
      // Obstacle trees (nodes and ways)
      node(around:{obstacles_radius_m},{lat},{lng})["natural"="tree"];
      way(around:{obstacles_radius_m},{lat},{lng})["natural"="tree"];
    );
    out geom;
    """
    logger.info(f"Querying Overpass API for lat={lat}, lng={lng} with building_radius={building_radius_m}m, obstacle_radius={obstacles_radius_m}m")

    # For now, returning mock data as per the plan for initial service implementation
    # In a real scenario, we would make the HTTP request here.
    # try:
    #     response = requests.post(OVERPASS_API_URL, data=query, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    #     response.raise_for_status() # Raises an exception for HTTP errors
    #     data = response.json()
    #     logger.info(f"Successfully received data from Overpass API. Elements found: {len(data.get('elements', []))}")

    #     # Basic processing to distinguish target building from obstacles could happen here or in geometry_service
    #     # For instance, one might assume the closest/largest building in building_radius_m is the target.
    #     return data
    # except requests.exceptions.RequestException as e:
    #     logger.error(f"Error querying Overpass API: {e}")
    #     return {"elements": []} # Return empty elements list on error
    # except ValueError as e: # Handles JSON decoding errors
    #     logger.error(f"Error decoding JSON from Overpass API: {e}")
    #     return {"elements": []}

    # --- MOCK DATA ---
    mock_data = {
        "version": 0.6,
        "generator": "Overpass API 0.7.62.1 a1a91737",
        "osm3s": {
            "timestamp_osm_base": "2024-01-01T00:00:00Z",
            "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL."
        },
        "elements": [
            { # Mocked target building (polygon)
                "type": "way",
                "id": 12345678,
                "tags": {"building": "residential"},
                "nodes": [1, 2, 3, 4, 1], # Closed way
                "geometry": [ # Simplified geometry
                    {"lat": lat + 0.00005, "lon": lng - 0.00005},
                    {"lat": lat + 0.00005, "lon": lng + 0.00005},
                    {"lat": lat - 0.00005, "lon": lng + 0.00005},
                    {"lat": lat - 0.00005, "lon": lng - 0.00005},
                    {"lat": lat + 0.00005, "lon": lng - 0.00005}
                ]
            },
            { # Mocked obstacle building (polygon)
                "type": "way",
                "id": 98765432,
                "tags": {"building": "garage"},
                "nodes": [5,6,7,8,5],
                 "geometry": [
                    {"lat": lat + 0.00020, "lon": lng - 0.00010},
                    {"lat": lat + 0.00020, "lon": lng - 0.00005},
                    {"lat": lat + 0.00015, "lon": lng - 0.00005},
                    {"lat": lat + 0.00015, "lon": lng - 0.00010},
                    {"lat": lat + 0.00020, "lon": lng - 0.00010}
                ]
            },
            { # Mocked tree (node)
                "type": "node",
                "id": 11223344,
                "lat": lat - 0.00010,
                "lon": lng + 0.00015,
                "tags": {"natural": "tree", "height": "15"} # Height is useful for shading
            }
        ]
    }
    logger.info("Overpass service returning mock data.")
    return mock_data
