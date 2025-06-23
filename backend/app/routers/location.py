import logging
from fastapi import APIRouter, HTTPException, Body
from app.schemas.location import LocationAnalyzeInput, LocationAnalyzeOutput, RoofSection
from app.services import overpass_service, pvgis_service, geometry_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(
    "/analyze",
    response_model=LocationAnalyzeOutput,
    summary="Analyze Location for Solar Potential",
    description=(
        "Analyzes a given geographic location (latitude and longitude) to determine its solar energy potential.\n\n"
        "This endpoint currently uses **mocked data** for Overpass, PVGIS, and geometry calculations "
        "as the underlying services are placeholders.\n\n"
        "- Fetches building footprint and obstacles (mocked Overpass call).\n"
        "- Determines optimal tilt and irradiation (mocked PVGIS call).\n"
        "- Calculates roof area, sections, shading, and max kWp (mocked geometry calculations)."
    )
)
async def analyze_location(
    input_data: LocationAnalyzeInput = Body(..., description="Latitude and longitude of the location to analyze.")
):
    """
    Detailed endpoint behavior:
    1.  **Fetch Geospatial Data**: Calls `overpass_service.get_building_and_obstacle_data`
        to get building outlines and potential obstacles like other buildings or trees nearby.
        *(Currently returns mock Overpass data)*
    2.  **Analyze Roof Geometry**: Calls `geometry_service.analyze_roof_from_overpass_data`
        using the data from Overpass to identify the main building, segment its roof,
        calculate areas, and orientations for each segment. It also identifies obstacles.
        *(Currently uses mock Overpass data and returns mock roof sections and obstacles)*
    3.  **Get PVGIS Data**: Calls `pvgis_service.get_pvgis_data` to fetch optimal inclination
        for the PV panels at the given location and typical solar irradiation data.
        *(Currently returns mock PVGIS data, including a mock optimal tilt)*
        The optimal tilt from PVGIS might be used by the geometry service in a real scenario
        to refine roof section tilts or assume tilts for flat roofs.
    4.  **Calculate Shading**: Calls `geometry_service.calculate_shading_factors` using the
        roof geometry, obstacle data, and latitude to estimate monthly and annual shading losses.
        *(Currently returns mock shading factors)*
    5.  **Estimate Max kWp**: Calls `geometry_service.estimate_max_kwp` based on the total
        calculated usable roof area.
        *(Currently uses mock total area and returns a mock kWp estimation)*
    6.  **Format Output**: Compiles all gathered and calculated data into the
        `LocationAnalyzeOutput` schema.
    """
    logger.info(f"Received request to analyze location: lat={input_data.lat}, lng={input_data.lng}")

    # 1. Fetch Geospatial Data (Overpass)
    try:
        logger.info("Calling Overpass service...")
        overpass_data = overpass_service.get_building_and_obstacle_data(
            lat=input_data.lat, lng=input_data.lng
        )
        if not overpass_data or not overpass_data.get("elements"):
            logger.warning(f"No elements found from Overpass service for lat={input_data.lat}, lng={input_data.lng}")
            # Depending on strictness, could raise 404 here or proceed with defaults/empty results
            # For now, geometry_service mock might handle empty elements.
    except Exception as e:
        logger.error(f"Error calling Overpass service: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail=f"Error contacting Overpass service: {e}")

    # 2. Analyze Roof Geometry
    try:
        logger.info("Calling Geometry service for roof analysis...")
        total_roof_area, roof_sections_data, obstacles = geometry_service.analyze_roof_from_overpass_data(
            overpass_elements=overpass_data.get("elements", []),
            target_lat=input_data.lat,
            target_lng=input_data.lng
        )
        # Ensure roof_sections_data are instances of RoofSection if not already
        # The mock service currently returns them correctly.
        # If roof_sections_data was a list of dicts:
        # roof_sections = [RoofSection(**section_data) for section_data in roof_sections_data]
        roof_sections = roof_sections_data
    except Exception as e:
        logger.error(f"Error during roof geometry analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing roof geometry: {e}")

    # 3. Get PVGIS Data (primarily for optimal tilt, though mock geometry_service might not use it yet)
    optimal_tilt_from_pvgis = 30.0 # Default
    try:
        logger.info("Calling PVGIS service...")
        pvgis_data = pvgis_service.get_pvgis_data(lat=input_data.lat, lng=input_data.lng, optimal_inclination=True)
        if pvgis_data and "inputs" in pvgis_data:
            # Path to optimal tilt might vary based on PVGIS response structure for "optimalinclination=1"
            # Example path: data['inputs']['mounting_system']['fixed']['slope']['value']
            optimal_tilt_from_pvgis = pvgis_data.get("inputs", {}).get("mounting_system", {}).get("fixed", {}).get("slope", {}).get("value", 30.0)
            logger.info(f"Optimal tilt from PVGIS (mock): {optimal_tilt_from_pvgis}")
        else:
            logger.warning("Could not retrieve optimal tilt from PVGIS mock data, using default.")
    except Exception as e:
        logger.error(f"Error calling PVGIS service: {e}", exc_info=True)
        # Non-critical for now, can proceed with default tilt. In production, might be a 503.
        pass


    # 4. Calculate Shading (using geometry from step 2 and obstacles)
    # The mock geometry_service.calculate_shading_factors currently doesn't use target_building_geometry
    # or optimal_tilt_from_pvgis extensively, but they are passed for future compatibility.
    # A mock target_building_geometry would be derived from overpass_data within analyze_roof_from_overpass_data
    mock_target_building_geometry = next((el for el in overpass_data.get("elements", []) if el.get("type") == "way" and "building" in el.get("tags", {})), None)

    try:
        logger.info("Calling Geometry service for shading calculation...")
        shading_monthly, shading_annual = geometry_service.calculate_shading_factors(
            target_building_geometry=mock_target_building_geometry if mock_target_building_geometry else {}, # Pass some geometry
            roof_sections=roof_sections,
            obstacles_data=obstacles,
            lat=input_data.lat
        )
    except Exception as e:
        logger.error(f"Error during shading calculation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error calculating shading: {e}")

    # 5. Estimate Max kWp
    try:
        logger.info("Calling Geometry service for max kWp estimation...")
        max_kwp_calculated = geometry_service.estimate_max_kwp(total_roof_area=total_roof_area)
    except Exception as e:
        logger.error(f"Error during max kWp estimation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error estimating max kWp: {e}")

    # If total_roof_area is 0 or very small, it might indicate no suitable roof was found.
    if total_roof_area <= 0.1 and not roof_sections: # Using 0.1 as a small threshold
        logger.warning(f"No significant roof area found for lat={input_data.lat}, lng={input_data.lng}. Total area: {total_roof_area}")
        # Consider returning 404 or a specific message if no roof area is found.
        # For now, it will return an output with 0 area and 0 kWp.
        # raise HTTPException(status_code=404, detail="No usable roof area found for the given coordinates based on mock analysis.")


    logger.info(f"Successfully analyzed location (using mock services): lat={input_data.lat}, lng={input_data.lng}")

    # 6. Format Output
    return LocationAnalyzeOutput(
        roof_area_total=total_roof_area,
        roof_sections=roof_sections,
        shading_factor_monthly=shading_monthly,
        shading_factor_annual=shading_annual,
        max_kwp=max_kwp_calculated
    )
