import logging
import random
from typing import List, Tuple
from app.schemas.consumption import ConsumptionManualInput, ConsumptionOutput
import numpy as np # For more advanced profile generation if needed

logger = logging.getLogger(__name__)

# --- Constants for manual prediction heuristics ---
# Base consumption per person per year (kWh)
BASE_KWH_PER_PERSON = 1200
# Additional kWh per m2 per year (for general appliances, lighting, not heating)
KWH_PER_M2 = 10
# Additional kWh per year if EV is present
KWH_FOR_EV = 2000
# Additional kWh per year if Heat Pump is present (can vary wildly)
KWH_FOR_HEAT_PUMP = 3000 # This is a rough average, depends on climate, house insulation etc.

# Typical peak factors (multiplier of average hourly consumption)
PEAK_FACTOR_RESIDENTIAL = 4.0 # Can be higher, e.g. 4-6x

# Define a very simple standard hourly profile (sum should be 1.0 over 24 hours)
# This represents the fraction of daily energy used each hour.
# Hour: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
HOURLY_DISTRIBUTION_FLAT = [1/24] * 24 # Flat for now, will make it more realistic
STANDARD_HOURLY_PROFILE_FRACTIONS_24H = [
    0.025, 0.020, 0.018, 0.015, 0.015, 0.020, 0.035, 0.050, # 0-7h (night, morning prep)
    0.045, 0.040, 0.038, 0.035, 0.035, 0.038, 0.040, 0.045, # 8-15h (daytime)
    0.055, 0.065, 0.075, 0.080, 0.070, 0.060, 0.045, 0.035  # 16-23h (evening peak, night fall)
]
# Ensure it sums to 1 (or close enough for this mock)
profile_sum = sum(STANDARD_HOURLY_PROFILE_FRACTIONS_24H)
if not (0.99 < profile_sum < 1.01):
    logger.warning(f"Standard hourly profile sum is {profile_sum}, not 1.0. Normalizing...")
    STANDARD_HOURLY_PROFILE_FRACTIONS_24H = [x / profile_sum for x in STANDARD_HOURLY_PROFILE_FRACTIONS_24H]


# Simple monthly distribution (fraction of annual energy per month)
# More in winter/summer depending on heating/cooling. For now, slightly higher in winter.
# Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
STANDARD_MONTHLY_PROFILE_FRACTIONS = [
    0.10, 0.09, 0.08, 0.07, 0.07, 0.06, # Winter, Spring, Early Summer
    0.07, 0.08, 0.08, 0.09, 0.10, 0.11  # Late Summer, Autumn, Winter
]
monthly_sum = sum(STANDARD_MONTHLY_PROFILE_FRACTIONS)
if not (0.99 < monthly_sum < 1.01):
    logger.warning(f"Standard monthly profile sum is {monthly_sum}, not 1.0. Normalizing...")
    STANDARD_MONTHLY_PROFILE_FRACTIONS = [x / monthly_sum for x in STANDARD_MONTHLY_PROFILE_FRACTIONS]


DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] # Non-leap year

def predict_consumption_manual(data: ConsumptionManualInput) -> ConsumptionOutput:
    """
    Predicts energy consumption based on manual user inputs using heuristics.
    """
    logger.info(f"Predicting consumption manually for: {data.dict()}")

    # 1. Calculate Annual kWh
    annual_kwh = (data.occupants * BASE_KWH_PER_PERSON) + \
                 (data.area_m2 * KWH_PER_M2)
    if data.has_ev:
        annual_kwh += KWH_FOR_EV
    if data.has_heat_pump:
        annual_kwh += KWH_FOR_HEAT_PUMP

    # Add some randomness to make it seem more "estimated"
    annual_kwh *= random.uniform(0.95, 1.05)
    annual_kwh = round(annual_kwh, 2)

    # 2. Calculate Monthly kWh
    monthly_kwh = [round(annual_kwh * fraction, 2) for fraction in STANDARD_MONTHLY_PROFILE_FRACTIONS]
    # Adjust sum of monthly to match annual due to rounding
    current_monthly_sum = sum(monthly_kwh)
    if current_monthly_sum != annual_kwh:
        diff = annual_kwh - current_monthly_sum
        monthly_kwh[0] += round(diff, 2) # Add difference to the first month

    # 3. Generate Hourly Profile (8760 values)
    hourly_profile: List[float] = []
    for month_idx, monthly_consumption_for_month in enumerate(monthly_kwh):
        days = DAYS_IN_MONTH[month_idx]
        daily_consumption = monthly_consumption_for_month / days
        for _ in range(days): # For each day in the month
            for hourly_fraction in STANDARD_HOURLY_PROFILE_FRACTIONS_24H:
                hourly_kwh_value = daily_consumption * hourly_fraction
                hourly_profile.append(round(hourly_kwh_value, 4)) # Round to Wh or 0.1Wh

    # Ensure hourly profile has 8760 values (it should by calculation)
    # And adjust sum of hourly to match annual_kwh due to cumulative rounding
    current_hourly_sum = sum(hourly_profile)
    if len(hourly_profile) != 8760:
        # This case should ideally not happen with current logic.
        # If it does, it's a bug in day/month/profile generation.
        # Fallback: Distribute the annual_kwh flatly or based on a simplified pattern.
        logger.error(f"Generated hourly profile has {len(hourly_profile)} values, expected 8760. Re-generating flat.")
        flat_hourly_value = annual_kwh / 8760.0
        hourly_profile = [round(flat_hourly_value, 4)] * 8760
        # Recalculate sum after flattening
        current_hourly_sum = sum(hourly_profile)


    if abs(current_hourly_sum - annual_kwh) > 0.1: # Allow small tolerance for float precision
        logger.warning(f"Sum of generated hourly profile ({current_hourly_sum:.2f} kWh) does not match annual_kwh ({annual_kwh:.2f} kWh). Adjusting...")
        # Simple adjustment: scale all hourly values
        if current_hourly_sum != 0:
            scaling_factor = annual_kwh / current_hourly_sum
            hourly_profile = [round(h * scaling_factor, 4) for h in hourly_profile]
        else: # Avoid division by zero if somehow sum is 0
            flat_hourly_value = annual_kwh / 8760.0
            hourly_profile = [round(flat_hourly_value, 4)] * 8760


    # 4. Calculate Peak Power (kW)
    # Peak power is the max value in the hourly_profile (which is in kWh per hour, so it's already kW)
    peak_power_kw = 0.0
    if hourly_profile:
        peak_power_kw = round(max(hourly_profile), 2)
    else: # Should not happen if profile is generated
        logger.warning("Hourly profile is empty, cannot determine peak power. Defaulting to a value.")
        peak_power_kw = round((annual_kwh / 8760) * PEAK_FACTOR_RESIDENTIAL, 2)


    logger.info(f"Manual prediction results: Annual kWh={annual_kwh}, Peak kW={peak_power_kw}")

    return ConsumptionOutput(
        annual_kwh=annual_kwh,
        monthly_kwh=monthly_kwh,
        hourly_profile=hourly_profile,
        peak_power_kw=peak_power_kw
    )

import pandas as pd
from fastapi import UploadFile
import io

# Placeholder for CSV prediction logic
async def predict_consumption_csv(file: UploadFile) -> ConsumptionOutput: # Changed to async
    """
    Predicts energy consumption based on an uploaded CSV file containing 8760 hourly values.
    """
    logger.info(f"Predicting consumption from CSV file: {file.filename}, content type: {file.content_type}")

    try:
        # Read the file content
        # file.file is a SpooledTemporaryFile, which acts like a file object
        contents = await file.read() # Changed to await
        # file.file.seek(0) # Reset pointer in case it's needed again, though pandas reads from buffer fine
                          # For UploadFile, after read(), the stream might be at the end.
                          # Pandas needs a readable stream from the beginning.
                          # It's better to pass contents to StringIO or BytesIO.

        # Attempt to decode contents, assuming UTF-8, but be flexible for common CSV encodings
        try:
            csv_data_io = io.StringIO(contents.decode('utf-8'))
        except UnicodeDecodeError:
            logger.warning(f"UTF-8 decoding failed for {file.filename}, trying latin-1.")
            try:
                csv_data_io = io.StringIO(contents.decode('latin-1')) # Common alternative
            except UnicodeDecodeError as ude:
                logger.error(f"Could not decode CSV {file.filename} with UTF-8 or latin-1: {ude}")
                raise ValueError(f"File encoding not supported. Please use UTF-8 or Latin-1 for {file.filename}.")


        # Use pandas to read the CSV.
        # We expect a single column of 8760 values.
        # Try to be robust against common separators and decimal formats.
        # Pass the 'contents' (bytes) directly to BytesIO for pandas
        try:
            # Attempt with common separators and standard decimal format
            # We need to wrap 'contents' (bytes) in a BytesIO object for pandas
            df = pd.read_csv(io.BytesIO(contents), header=None, sep=None, engine='python', decimal='.')

            if df.shape[1] == 1 and pd.api.types.is_numeric_dtype(df.iloc[:, 0]):
                 hourly_profile_kw = df.iloc[:, 0].astype(float).tolist()
            # If not a single numeric column, try with comma as decimal
            elif df.shape[1] > 0 : # Check if there's at least one column
                logger.info(f"Initial parse of {file.filename} (decimal='.') resulted in {df.shape[1]} cols or non-numeric first col. Trying decimal=',', or taking first numeric column.")
                try:
                    df_alt = pd.read_csv(io.BytesIO(contents), header=None, sep=None, engine='python', decimal=',')
                    if df_alt.shape[1] == 1 and pd.api.types.is_numeric_dtype(df_alt.iloc[:, 0]):
                        hourly_profile_kw = df_alt.iloc[:, 0].astype(float).tolist()
                    elif df_alt.shape[1] > 0 and pd.api.types.is_numeric_dtype(df_alt.iloc[:, 0]): # Take first col if numeric
                        logger.info(f"Using first column of {df_alt.shape[1]} columns from {file.filename} (parsed with decimal ',').")
                        hourly_profile_kw = df_alt.iloc[:, 0].astype(float).tolist()
                    # Fallback to first df if its first column is numeric
                    elif df.shape[1] > 0 and pd.api.types.is_numeric_dtype(df.iloc[:, 0]):
                        logger.info(f"Using first column of {df.shape[1]} columns from {file.filename} (original parse with decimal '.').")
                        hourly_profile_kw = df.iloc[:, 0].astype(float).tolist()
                    else:
                        raise ValueError("Could not identify a single numeric column for hourly data after trying common decimal separators.")
                except Exception as e_alt_parse:
                    # If alternative parsing also fails, and original first column was not numeric
                    if not (df.shape[1] > 0 and pd.api.types.is_numeric_dtype(df.iloc[:, 0])):
                         logger.error(f"Alternative parsing for {file.filename} also failed: {e_alt_parse}")
                         raise ValueError("Could not parse CSV into a usable numeric column.")
                    # Otherwise, stick with the original df's first column if it was numeric
                    logger.info(f"Using first column of {df.shape[1]} columns from {file.filename} (original parse with decimal '.').")
                    hourly_profile_kw = df.iloc[:, 0].astype(float).tolist()
            else: # df.shape[1] is 0 or first column not numeric
                 raise ValueError("CSV file does not appear to contain any parsable data columns.")


        except pd.errors.ParserError as pe:
            logger.error(f"Pandas ParserError for {file.filename}: {pe}")
            raise ValueError(f"Could not parse CSV file '{file.filename}'. Ensure it's a valid CSV. Error: {pe}")
        except Exception as e:
            logger.error(f"Error processing CSV {file.filename} with pandas: {e}", exc_info=True)
            raise ValueError(f"Error processing CSV file '{file.filename}'. Details: {e}")


        # Validate number of values
        if len(hourly_profile_kw) != 8760:
            logger.error(f"CSV file '{file.filename}' contains {len(hourly_profile_kw)} rows, expected 8760.")
            raise ValueError(f"CSV file must contain exactly 8760 hourly values. Found {len(hourly_profile_kw)}.")

        # Ensure all values are non-negative
        if any(val < 0 for val in hourly_profile_kw):
            logger.error(f"CSV file '{file.filename}' contains negative consumption values.")
            raise ValueError("Consumption values in CSV cannot be negative.")

        # 1. Hourly Profile (is directly from CSV)
        # Ensure values are rounded appropriately if needed, though usually they are direct measurements
        hourly_profile = [round(val, 4) for val in hourly_profile_kw]

        # 2. Annual kWh
        annual_kwh = round(sum(hourly_profile), 2)

        # 3. Monthly kWh
        monthly_kwh: List[float] = []
        hour_counter = 0
        for days_in_month_count in DAYS_IN_MONTH:
            hours_in_month = days_in_month_count * 24
            month_sum = sum(hourly_profile[hour_counter : hour_counter + hours_in_month])
            monthly_kwh.append(round(month_sum, 2))
            hour_counter += hours_in_month

        # Adjust sum of monthly to match annual due to potential rounding differences
        current_monthly_sum = sum(monthly_kwh)
        if abs(current_monthly_sum - annual_kwh) > 0.01 * len(monthly_kwh): # Tolerate small diffs
            diff = annual_kwh - current_monthly_sum
            monthly_kwh[0] += round(diff, 2) # Add difference to the first month


        # 4. Peak Power (kW)
        peak_power_kw = round(max(hourly_profile), 2) if hourly_profile else 0.0

        logger.info(f"Successfully processed CSV '{file.filename}': Annual kWh={annual_kwh}, Peak kW={peak_power_kw}")

        return ConsumptionOutput(
            annual_kwh=annual_kwh,
            monthly_kwh=monthly_kwh,
            hourly_profile=hourly_profile,
            peak_power_kw=peak_power_kw
        )

    except ValueError as ve: # Catch our own validation errors
        logger.warning(f"Validation error processing CSV {file.filename}: {ve}")
        raise ve # Re-raise to be caught by the router
    except Exception as e:
        logger.error(f"Unexpected error processing CSV {file.filename}: {e}", exc_info=True)
        # This is a fallback for truly unexpected errors during file operations or initial parsing
        raise ValueError(f"An unexpected error occurred while processing the CSV file {file.filename}.")
    finally:
        await file.close() # Ensure the temporary file is closed
