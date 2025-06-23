import pytest
import os
import io
from fastapi.testclient import TestClient

# El fixture 'client' se inyectará desde conftest.py
# El fixture 'tmp_path' es un fixture integrado de pytest para crear archivos/directorios temporales

# --- Tests para /consumption/predict/manual ---

def test_predict_manual_valid_input(client: TestClient):
    """Test POST /consumption/predict/manual con input válido."""
    payload = {
        "occupants": 3,
        "area_m2": 120,
        "has_ev": True,
        "has_heat_pump": False,
        "clp": "ES0001000000000001AB"
    }
    response = client.post("/consumption/predict/manual", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "annual_kwh" in data and isinstance(data["annual_kwh"], float)
    assert "monthly_kwh" in data and isinstance(data["monthly_kwh"], list) and len(data["monthly_kwh"]) == 12
    assert "hourly_profile" in data and isinstance(data["hourly_profile"], list) and len(data["hourly_profile"]) == 8760
    assert "peak_power_kw" in data and isinstance(data["peak_power_kw"], float)

    assert data["annual_kwh"] > 0
    assert sum(data["monthly_kwh"]) == pytest.approx(data["annual_kwh"], rel=1e-2)
    assert sum(data["hourly_profile"]) == pytest.approx(data["annual_kwh"], rel=1e-2)
    assert data["peak_power_kw"] == pytest.approx(max(data["hourly_profile"]), rel=1e-2) if data["hourly_profile"] else True


def test_predict_manual_invalid_input_missing_field(client: TestClient):
    """Test con campo 'occupants' faltante."""
    payload = {
        "area_m2": 100,
        # "occupants" is missing
    }
    response = client.post("/consumption/predict/manual", json=payload)
    assert response.status_code == 422 # Unprocessable Entity
    assert "occupants" in response.text # Pydantic error message should mention 'occupants'

def test_predict_manual_invalid_input_wrong_type(client: TestClient):
    """Test con 'occupants' de tipo incorrecto."""
    payload = {
        "occupants": "tres", # Debería ser int
        "area_m2": 100,
    }
    response = client.post("/consumption/predict/manual", json=payload)
    assert response.status_code == 422
    assert "occupants" in response.text and "value is not a valid integer" in response.text.lower()

def test_predict_manual_invalid_input_value_constraint(client: TestClient):
    """Test con 'occupants' fuera del rango permitido (ej. <=0)."""
    payload = {
        "occupants": 0, # gt=0 en el schema
        "area_m2": 100,
    }
    response = client.post("/consumption/predict/manual", json=payload)
    assert response.status_code == 422
    # El mensaje puede variar, pero debería indicar un error de validación para 'occupants'
    assert "occupants" in response.text and ("ensure this value is greater than 0" in response.text.lower() or "value_error.number.not_gt" in response.text.lower())


# --- Tests para /consumption/predict/csv ---

def test_predict_csv_valid_file(client: TestClient, tmp_path):
    """Test POST /consumption/predict/csv con un archivo CSV válido."""
    # Crear un archivo CSV válido temporal
    file_path = tmp_path / "valid_consumption.csv"
    hourly_data_content = "\n".join([f"{1.0 + (i%5)*0.1}" for i in range(8760)]) # kW por hora
    file_path.write_text(hourly_data_content)

    with open(file_path, "rb") as f:
        files = {"file": ("valid_consumption.csv", f, "text/csv")}
        response = client.post("/consumption/predict/csv", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "annual_kwh" in data and isinstance(data["annual_kwh"], float)
    assert len(data["hourly_profile"]) == 8760

    # Verificar que la suma anual coincida con la suma de los datos del archivo
    expected_sum = sum(float(line) for line in hourly_data_content.splitlines())
    assert data["annual_kwh"] == pytest.approx(expected_sum, rel=1e-2)


def test_predict_csv_invalid_row_count(client: TestClient, tmp_path):
    """Test con archivo CSV con número incorrecto de filas."""
    file_path = tmp_path / "invalid_rows.csv"
    file_path.write_text("\n".join(["1.0"] * 100)) # Solo 100 filas

    with open(file_path, "rb") as f:
        files = {"file": ("invalid_rows.csv", f, "text/csv")}
        response = client.post("/consumption/predict/csv", files=files)

    assert response.status_code == 400 # Error de validación del servicio
    data = response.json()
    assert "detail" in data
    assert "CSV file must contain exactly 8760 hourly values" in data["detail"]


def test_predict_csv_non_numeric_data(client: TestClient, tmp_path):
    """Test con archivo CSV con datos no numéricos."""
    file_path = tmp_path / "non_numeric.csv"
    content = "\n".join([f"{i*0.1}" for i in range(8759)] + ["not_a_number"])
    file_path.write_text(content)

    with open(file_path, "rb") as f:
        files = {"file": ("non_numeric.csv", f, "text/csv")}
        response = client.post("/consumption/predict/csv", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    # El mensaje exacto puede depender de pandas o de nuestra validación
    assert "could not convert string to float" in data["detail"].lower() or "error processing csv file" in data["detail"].lower()


def test_predict_csv_no_file(client: TestClient):
    """Test intentando llamar a /predict/csv sin adjuntar un archivo."""
    # TestClient(app).post("/consumption/predict/csv") sin 'files' debería dar error
    # La forma de hacerlo con TestClient es no pasar el argumento 'files'
    response = client.post("/consumption/predict/csv")
    assert response.status_code == 422 # FastAPI detecta que el campo 'file' es requerido
    data = response.json()
    assert "detail" in data
    assert any(d["loc"] == ["body", "file"] and d["type"] == "value_error.missing" for d in data["detail"])


def test_predict_csv_empty_file_content(client: TestClient, tmp_path):
    """Test con un archivo CSV que está vacío (0 bytes o solo línea vacía)."""
    file_path = tmp_path / "empty_content.csv"
    file_path.write_text("") # Archivo vacío

    with open(file_path, "rb") as f:
        files = {"file": ("empty_content.csv", f, "text/csv")}
        response = client.post("/consumption/predict/csv", files=files)

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "CSV file does not appear to contain any parsable data columns" in data["detail"].lower() or "no columns to parse" in data["detail"].lower()
