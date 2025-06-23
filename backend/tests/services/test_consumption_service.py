import pytest
import os
import csv
import tempfile
from fastapi import UploadFile
import io
from typing import List

from backend.app.schemas.consumption import ConsumptionManualInput, ConsumptionOutput
from backend.app.services import consumption_service as cons_service # Alias

# --- Tests para predict_consumption_manual ---

def test_predict_consumption_manual_basic():
    """Test básico de predicción manual con valores de entrada típicos."""
    input_data = ConsumptionManualInput(
        occupants=3,
        area_m2=100,
        has_ev=False,
        has_heat_pump=False
    )
    result = cons_service.predict_consumption_manual(input_data)

    assert isinstance(result, ConsumptionOutput)
    assert result.annual_kwh > 0
    assert len(result.monthly_kwh) == 12
    assert sum(result.monthly_kwh) == pytest.approx(result.annual_kwh, rel=1e-2) # Permitir pequeña diferencia por redondeo
    assert len(result.hourly_profile) == 8760
    assert sum(result.hourly_profile) == pytest.approx(result.annual_kwh, rel=1e-2) # Permitir pequeña diferencia
    assert result.peak_power_kw >= 0
    assert result.peak_power_kw == max(result.hourly_profile)


def test_predict_consumption_manual_with_ev_and_heat_pump():
    """Test con EV y bomba de calor, esperando mayor consumo."""
    input_base = ConsumptionManualInput(occupants=2, area_m2=80)
    result_base = cons_service.predict_consumption_manual(input_base)

    input_ev_hp = ConsumptionManualInput(occupants=2, area_m2=80, has_ev=True, has_heat_pump=True)
    result_ev_hp = cons_service.predict_consumption_manual(input_ev_hp)

    assert result_ev_hp.annual_kwh > result_base.annual_kwh
    # Las heurísticas deberían sumar KWH_FOR_EV y KWH_FOR_HEAT_PUMP (más la aleatoriedad)
    expected_increase = cons_service.KWH_FOR_EV + cons_service.KWH_FOR_HEAT_PUMP
    # Comprobar que el aumento está en un rango plausible alrededor del esperado (considerando el factor random)
    actual_increase = result_ev_hp.annual_kwh - result_base.annual_kwh
    assert expected_increase * 0.90 < actual_increase < expected_increase * 1.10


# --- Tests para predict_consumption_csv ---

def _create_mock_csv_file(tmp_path, data_rows: List[List[str]], filename="test.csv", delimiter=','):
    """Helper para crear un archivo CSV temporal con los datos proporcionados."""
    file_path = tmp_path / filename
    with open(file_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile, delimiter=delimiter)
        for row_data in data_rows:
            writer.writerow(row_data) # writerow espera una lista de "columnas"
    return file_path


@pytest.mark.asyncio # Marcar el test como asíncrono
async def test_predict_consumption_csv_valid_file(tmp_path):
    """Test con un archivo CSV válido (8760 valores numéricos)."""
    # Generar 8760 valores horarios, ej. un perfil sinusoide simple para prueba
    hourly_data = [[f"{1 + 0.5 * (i % 24 / 23)}"] for i in range(8760)] # kW por hora
    expected_annual_sum = sum(float(row[0]) for row in hourly_data)

    csv_file_path = _create_mock_csv_file(tmp_path, hourly_data)

    with open(csv_file_path, 'rb') as f: # Abrir en modo binario para UploadFile
        upload_file = UploadFile(filename="valid.csv", file=f, content_type="text/csv")
        result = await cons_service.predict_consumption_csv(upload_file)

    assert isinstance(result, ConsumptionOutput)
    assert result.annual_kwh == pytest.approx(expected_annual_sum, rel=1e-2)
    assert len(result.monthly_kwh) == 12
    assert sum(result.monthly_kwh) == pytest.approx(expected_annual_sum, rel=1e-2)
    assert len(result.hourly_profile) == 8760
    assert result.hourly_profile == [float(row[0]) for row in hourly_data] # Deberían ser los mismos valores
    assert result.peak_power_kw == pytest.approx(max(float(row[0]) for row in hourly_data), rel=1e-2)


@pytest.mark.asyncio
async def test_predict_consumption_csv_valid_file_semicolon_decimal_comma(tmp_path):
    """Test con CSV válido, delimitador ; y decimal ,"""
    hourly_data_str_comma_decimal = [[f"{1 + 0.5 * (i % 24 / 23):.2f}".replace('.', ',')] for i in range(8760)]
    expected_annual_sum = sum(float(row[0].replace(',', '.')) for row in hourly_data_str_comma_decimal)

    csv_file_path = _create_mock_csv_file(tmp_path, hourly_data_str_comma_decimal, delimiter=';')

    with open(csv_file_path, 'rb') as f:
        upload_file = UploadFile(filename="valid_semicolon.csv", file=f, content_type="text/csv")
        result = await cons_service.predict_consumption_csv(upload_file)

    assert isinstance(result, ConsumptionOutput)
    assert result.annual_kwh == pytest.approx(expected_annual_sum, rel=1e-2)
    assert len(result.hourly_profile) == 8760


@pytest.mark.asyncio
@pytest.mark.parametrize("num_rows", [100, 8759, 8761])
async def test_predict_consumption_csv_invalid_row_count(tmp_path, num_rows):
    """Test con CSV que no tiene 8760 filas."""
    hourly_data = [[str(i*0.1)] for i in range(num_rows)]
    csv_file_path = _create_mock_csv_file(tmp_path, hourly_data)

    with open(csv_file_path, 'rb') as f, \
         pytest.raises(ValueError, match=r"CSV file must contain exactly 8760 hourly values"):
        upload_file = UploadFile(filename="invalid_rows.csv", file=f, content_type="text/csv")
        await cons_service.predict_consumption_csv(upload_file)


@pytest.mark.asyncio
async def test_predict_consumption_csv_non_numeric_data(tmp_path):
    """Test con CSV que contiene datos no numéricos."""
    hourly_data = [[str(i*0.1)] for i in range(8759)] + [["not_a_number"]]
    csv_file_path = _create_mock_csv_file(tmp_path, hourly_data)

    with open(csv_file_path, 'rb') as f, \
         pytest.raises(ValueError, match=r"could not convert string to float|Error processing CSV file"):
        # El mensaje exacto puede variar dependiendo de dónde falle la conversión en pandas
        upload_file = UploadFile(filename="non_numeric.csv", file=f, content_type="text/csv")
        await cons_service.predict_consumption_csv(upload_file)


@pytest.mark.asyncio
async def test_predict_consumption_csv_negative_values(tmp_path):
    """Test con CSV que contiene valores negativos."""
    hourly_data = [[str(i*0.1)] for i in range(8759)] + [["-5.0"]]
    csv_file_path = _create_mock_csv_file(tmp_path, hourly_data)

    with open(csv_file_path, 'rb') as f, \
         pytest.raises(ValueError, match="Consumption values in CSV cannot be negative"):
        upload_file = UploadFile(filename="negative_values.csv", file=f, content_type="text/csv")
        await cons_service.predict_consumption_csv(upload_file)


@pytest.mark.asyncio
async def test_predict_consumption_csv_empty_file(tmp_path):
    """Test con un archivo CSV vacío."""
    csv_file_path = _create_mock_csv_file(tmp_path, []) # Archivo vacío

    with open(csv_file_path, 'rb') as f, \
         pytest.raises(ValueError, match=r"CSV file does not appear to contain any parsable data columns|No columns to parse"):
        upload_file = UploadFile(filename="empty.csv", file=f, content_type="text/csv")
        await cons_service.predict_consumption_csv(upload_file)

@pytest.mark.asyncio
async def test_predict_consumption_csv_multi_column_first_numeric(tmp_path):
    """Test con CSV de múltiples columnas, la primera es numérica."""
    # (valor_numerico, texto_ignorado)
    hourly_data = [[f"{1 + 0.5 * (i % 24 / 23)}", f"text_{i}"] for i in range(8760)]
    expected_annual_sum = sum(float(row[0]) for row in hourly_data)

    csv_file_path = _create_mock_csv_file(tmp_path, hourly_data)

    with open(csv_file_path, 'rb') as f:
        upload_file = UploadFile(filename="multi_column.csv", file=f, content_type="text/csv")
        result = await cons_service.predict_consumption_csv(upload_file)

    assert isinstance(result, ConsumptionOutput)
    assert result.annual_kwh == pytest.approx(expected_annual_sum, rel=1e-2)
    assert len(result.hourly_profile) == 8760
    assert result.hourly_profile == [float(row[0]) for row in hourly_data]
    assert result.peak_power_kw == pytest.approx(max(float(row[0]) for row in hourly_data), rel=1e-2)
