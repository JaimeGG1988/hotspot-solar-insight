import pytest
from fastapi.testclient import TestClient # Importar TestClient
# El fixture 'client' se inyectará desde conftest.py

def test_analyze_location_valid_input(client: TestClient):
    """
    Test POST /location/analyze con input válido.
    Verifica que la respuesta sea 200 OK y que el schema de salida sea correcto.
    """
    payload = {"lat": 40.416775, "lng": -3.703790}
    response = client.post("/location/analyze", json=payload)

    assert response.status_code == 200
    data = response.json()

    # Verificar la estructura del output (basado en LocationAnalyzeOutput y los mocks actuales)
    assert "roofAreaTotal" in data
    assert "roofSections" in data
    assert "shadingFactorMonthly" in data
    assert "shadingFactorAnnual" in data
    assert "maxKwp" in data

    assert isinstance(data["roofAreaTotal"], float)
    assert isinstance(data["roofSections"], list)
    if data["roofSections"]:
        for section in data["roofSections"]:
            assert "area" in section and isinstance(section["area"], float)
            assert "azimuth" in section and isinstance(section["azimuth"], float)
            assert "tilt" in section and isinstance(section["tilt"], float)

    assert isinstance(data["shadingFactorMonthly"], list)
    assert len(data["shadingFactorMonthly"]) == 12
    assert all(isinstance(val, (float, int)) for val in data["shadingFactorMonthly"])

    assert isinstance(data["shadingFactorAnnual"], float)
    assert isinstance(data["maxKwp"], float)

    # Verificar valores mock específicos si se desea (esto hace el test más frágil a cambios en mocks)
    # Por ejemplo, si el mock de geometry_service.analyze_roof_from_overpass_data siempre devuelve
    # las mismas secciones y área total:
    # assert data["roofAreaTotal"] == 120.75
    # assert len(data["roofSections"]) == 2


def test_analyze_location_missing_fields(client: TestClient):
    """Test POST /location/analyze con campos faltantes en el payload."""
    payload_missing_lng = {"lat": 40.416775}
    response = client.post("/location/analyze", json=payload_missing_lng)
    assert response.status_code == 422 # Error de validación de Pydantic
    data = response.json()
    assert "detail" in data
    assert any(d["loc"] == ["body", "lng"] and d["type"] == "value_error.missing" for d in data["detail"])


def test_analyze_location_invalid_types(client: TestClient):
    """Test POST /location/analyze con tipos de datos inválidos."""
    payload_invalid_lat_type = {"lat": "not-a-float", "lng": -3.703790}
    response = client.post("/location/analyze", json=payload_invalid_lat_type)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any(d["loc"] == ["body", "lat"] and "type_error.float" in d["type"] for d in data["detail"])

    payload_invalid_lng_type = {"lat": 40.416775, "lng": "not-a-float"}
    response = client.post("/location/analyze", json=payload_invalid_lng_type)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert any(d["loc"] == ["body", "lng"] and "type_error.float" in d["type"] for d in data["detail"])

# Se podrían añadir más tests para validar rangos de lat/lng si se implementan
# validadores Pydantic más estrictos en el schema LocationAnalyzeInput (ej. lat entre -90 y 90).
# Ejemplo:
# def test_analyze_location_out_of_range_lat(client: TestClient):
#     """Test con latitud fuera de rango (asumiendo validación en schema)."""
#     # Asumir que LocationAnalyzeInput tiene: lat: float = Field(..., ge=-90, le=90)
#     payload = {"lat": 95.0, "lng": -3.70}
#     response = client.post("/location/analyze", json=payload)
#     assert response.status_code == 422
#     # ... verificar mensaje de error específico ...
