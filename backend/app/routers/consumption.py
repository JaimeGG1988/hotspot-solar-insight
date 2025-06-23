import logging
from fastapi import APIRouter, HTTPException, File, UploadFile, Body
from app.schemas.consumption import ConsumptionManualInput, ConsumptionOutput
# Import the service when it's created
from app.services import consumption_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Mock hourly profile for 8760 hours (summing to a predefined annual total for consistency)
# This is a very simple flat profile, just for mocking structure.
# A real profile would have daily and seasonal variations.
# MOCK_ANNUAL_KWH_MANUAL = 4500.0 # Now calculated by service
# MOCK_HOURLY_KWH_MANUAL = MOCK_ANNUAL_KWH_MANUAL / 8760.0
# MOCK_HOURLY_PROFILE_MANUAL = [MOCK_HOURLY_KWH_MANUAL] * 8760
# MOCK_MONTHLY_KWH_MANUAL = [MOCK_ANNUAL_KWH_MANUAL / 12.0] * 12
# MOCK_PEAK_POWER_KW_MANUAL = MOCK_HOURLY_KWH_MANUAL * 3 # Arbitrary peak factor for mock

MOCK_ANNUAL_KWH_CSV = 6000.0
MOCK_HOURLY_KWH_CSV = MOCK_ANNUAL_KWH_CSV / 8760.0
MOCK_HOURLY_PROFILE_CSV = [MOCK_HOURLY_KWH_CSV] * 8760 # Placeholder
MOCK_MONTHLY_KWH_CSV = [MOCK_ANNUAL_KWH_CSV / 12.0] * 12
MOCK_PEAK_POWER_KW_CSV = MOCK_HOURLY_KWH_CSV * 3.5


@router.post(
    "/predict/manual",
    response_model=ConsumptionOutput,
    summary="Predict Energy Consumption from Manual Profile",
    description="Predicts annual, monthly, and hourly energy consumption based on user-provided household characteristics using heuristic models."
)
async def predict_consumption_manual(
    input_data: ConsumptionManualInput = Body(..., description="Manual profile data for consumption prediction.")
):
    """
    Takes manual input about a household (occupants, area, EV, heat pump)
    and returns an estimated energy consumption profile (annual, monthly, hourly, peak).
    The prediction is based on heuristic models and standard consumption patterns.
    """
    logger.info(f"Received request for manual consumption prediction: {input_data.dict()}")

    try:
        logger.info("Calling consumption service for manual prediction...")
        result = consumption_service.predict_consumption_manual(input_data)
        logger.info("Successfully predicted consumption from manual input.")
        return result
    except ValueError as ve: # Catch specific errors from the service if any are defined
        logger.error(f"Validation error during manual prediction: {ve}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Unexpected error during manual prediction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred during manual consumption prediction.")


@router.post(
    "/predict/csv",
    response_model=ConsumptionOutput,
    summary="Predict Energy Consumption from CSV File",
    description=(
        "Processes an uploaded CSV file containing 8760 hourly consumption values (kWh) "
        "to generate a detailed consumption profile (annual, monthly, hourly, peak).\n\n"
        "**CSV File Format Requirements:**\n"
        "- Exactly 8760 rows of numerical data (one for each hour of a standard year).\n"
        "- Each value should represent consumption in kWh for that hour.\n"
        "- Expected: A single column of data. If multiple columns are present, the first numeric one will be used.\n"
        "- No header row is strictly expected by the parser, but it should tolerate one if present and numeric parsing still works.\n"
        "- Common separators (`,`, `;`) and decimal formats (`.`, `,`) are auto-detected.\n"
        "- File encoding: UTF-8 or Latin-1 recommended."
    )
)
async def predict_consumption_csv(
    file: UploadFile = File(..., description="CSV file with 8760 hourly consumption values (kWh).")
):
    """
    Takes a CSV file with 8760 hourly consumption values, validates its format and content,
    parses the data, and returns the calculated consumption profile (annual, monthly, hourly, peak).
    """
    logger.info(f"Received request for CSV consumption prediction. Filename: {file.filename}, Content-Type: {file.content_type}")

    # Basic validation (more detailed validation will be in the service)
    if not file.filename:
        logger.error("CSV upload: No filename provided.")
        raise HTTPException(status_code=400, detail="No filename provided.")
    if not file.content_type == "text/csv" and not file.filename.endswith(".csv"):
         # Allow application/vnd.ms-excel as it's sometimes sent for CSVs
        if file.content_type != "application/vnd.ms-excel":
            logger.warning(f"CSV upload: Suspicious Content-Type: {file.content_type}. Filename: {file.filename}")
            # Not raising an error, but logging. Service should validate content.

    # Placeholder logic: Replace with actual call to consumption_service.predict_consumption_csv
    try:
        logger.info(f"Calling consumption service for CSV prediction: {file.filename}")
        # The file object from FastAPI (UploadFile) is passed directly to the service.
        # The service is responsible for reading and processing it.
        result = await consumption_service.predict_consumption_csv(file) # Now async
        logger.info(f"Successfully predicted consumption from CSV: {file.filename}")
        return result
    except ValueError as ve: # Catch specific validation errors from the service
        logger.error(f"CSV processing validation error for {file.filename}: {ve}", exc_info=True) # Log full traceback for our debugging
        raise HTTPException(status_code=400, detail=str(ve)) # User sees clean message
    except Exception as e:
        logger.error(f"Unexpected error processing CSV {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while processing the CSV file: {file.filename}. Error: {e}")

    # --- MOCK DATA (assuming basic file validity for now) ---
    # logger.info(f"CSV prediction returning mock data for file: {file.filename}")
    # # Simulate reading the file to ensure it's accessible, then return mock.
    # # This is a very basic check. The actual parsing will be in the service.
    # try:
    #     contents = await file.read()
    #     if not contents:
    #         logger.error("CSV file is empty.")
    #         raise HTTPException(status_code=400, detail="CSV file is empty.")
    #     logger.info(f"Successfully read {len(contents)} bytes from {file.filename} (mock processing).")
    #     # Reset file pointer if service needs to read it again, though for mock it's not needed.
    #     # await file.seek(0) # Important if the file stream is consumed and needed again
    # except Exception as e:
    #     logger.error(f"Error reading uploaded CSV file ({file.filename}): {e}", exc_info=True)
    #     raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {e}")


    # return ConsumptionOutput(
    #     annual_kwh=MOCK_ANNUAL_KWH_CSV, # Different mock value to distinguish
    #     monthly_kwh=MOCK_MONTHLY_KWH_CSV,
    #     hourly_profile=MOCK_HOURLY_PROFILE_CSV,
    #     peak_power_kw=MOCK_PEAK_POWER_KW_CSV
    # )
