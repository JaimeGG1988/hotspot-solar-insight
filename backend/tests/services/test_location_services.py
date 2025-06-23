import pytest
from backend.app.services import overpass_service
from backend.app.services import pvgis_service
from backend.app.services import geometry_service
from backend.app.schemas.location import RoofSection # Para verificar tipos

# --- Tests para Overpass Service ---

def test_get_building_and_obstacle_data_mock():
    """
    Test que el servicio Overpass (mock) devuelve la estructura esperada.
    """
    lat, lng = 40.0, -3.0
    data = overpass_service.get_building_and_obstacle_data(lat, lng)

    assert isinstance(data, dict)
    assert "elements" in data
    assert isinstance(data["elements"], list)

    # Verificar que los elementos mock tengan la estructura esperada (ej. type, id, tags/geometry)
    # Esto depende de la estructura exacta de los datos mock devueltos por el servicio.
    if data["elements"]:
        for el in data["elements"]:
            assert "type" in el
            assert "id" in el
            # Podríamos ser más específicos si conocemos los IDs o tipos de los mocks
            if el["type"] == "way":
                assert "geometry" in el or "nodes" in el # 'geometry' es lo que usamos más
            elif el["type"] == "node":
                assert "lat" in el and "lon" in el


# --- Tests para PVGIS Service ---

def test_get_pvgis_data_mock():
    """
    Test que el servicio PVGIS (mock para PVcalc) devuelve la estructura esperada.
    """
    lat, lng = 40.0, -3.0
    data = pvgis_service.get_pvgis_data(lat, lng)

    assert isinstance(data, dict)
    assert "inputs" in data
    assert "outputs" in data
    assert "monthly" in data["outputs"]
    assert "totals" in data["outputs"]

    # Verificar que la estructura de 'inputs' tenga la información de inclinación óptima (si se solicitó)
    # Esto depende de la estructura mock de PVGIS.
    assert "mounting_system" in data["inputs"]
    assert "fixed" in data["inputs"]["mounting_system"]
    assert "slope" in data["inputs"]["mounting_system"]["fixed"]
    assert "value" in data["inputs"]["mounting_system"]["fixed"]["slope"]
    # optimal_tilt = data["inputs"]["mounting_system"]["fixed"]["slope"]["value"]
    # assert isinstance(optimal_tilt, (float, int))

    assert len(data["outputs"]["monthly"]["fixed"]) == 12


def test_get_pvgis_terrain_horizon_mock():
    """
    Test que el servicio PVGIS (mock para SHcalc/horizon) devuelve la estructura esperada.
    """
    lat, lng = 40.0, -3.0
    data = pvgis_service.get_pvgis_terrain_horizon(lat, lng)

    assert isinstance(data, dict)
    assert "inputs" in data
    assert "outputs" in data
    assert "terrain_profile" in data["outputs"]
    assert isinstance(data["outputs"]["terrain_profile"], list)
    if data["outputs"]["terrain_profile"]:
        for point in data["outputs"]["terrain_profile"]:
            assert "azimuth" in point
            assert "height" in point


# --- Tests para Geometry Service ---

def test_analyze_roof_from_overpass_data_mock():
    """
    Test de analyze_roof_from_overpass_data con datos mock de Overpass.
    Verifica que devuelve la estructura esperada.
    """
    mock_overpass_elements = [
        { # Mocked target building (polygon)
            "type": "way", "id": 1, "tags": {"building": "residential"},
            "geometry": [ {"lat": 40.00005, "lon": -3.00005}, {"lat": 40.00005, "lon": -2.99995}, {"lat": 39.99995, "lon": -2.99995}, {"lat": 40.00005, "lon": -3.00005}]
        },
        { # Mocked tree (node)
            "type": "node", "id": 2, "lat": 40.00010, "lon": -3.00015, "tags": {"natural": "tree", "height": "15"}
        }
    ]
    total_area, roof_sections, obstacles = geometry_service.analyze_roof_from_overpass_data(
        overpass_elements=mock_overpass_elements, target_lat=40.0, target_lng=-3.0
    )

    assert isinstance(total_area, float)
    assert total_area >= 0 # El mock actual da 120.75

    assert isinstance(roof_sections, list)
    if roof_sections: # El mock actual devuelve 2 secciones
        for section in roof_sections:
            assert isinstance(section, RoofSection) # Verifica que se creen instancias del schema Pydantic
            assert section.area > 0
            assert -180 <= section.azimuth <= 360 # Rango típico para azimut
            assert 0 <= section.tilt <= 90       # Rango típico para inclinación

    assert isinstance(obstacles, list)
    if obstacles: # El mock actual devuelve 1 obstáculo (el árbol)
        assert "type" in obstacles[0]


def test_analyze_roof_from_empty_overpass_data():
    """Test con datos de Overpass vacíos."""
    total_area, roof_sections, obstacles = geometry_service.analyze_roof_from_overpass_data(
        overpass_elements=[], target_lat=40.0, target_lng=-3.0
    )
    assert total_area == 0.0
    assert len(roof_sections) == 0
    assert len(obstacles) == 0


def test_calculate_shading_factors_mock():
    """
    Test de calculate_shading_factors (actualmente devuelve mock).
    """
    # Los inputs son placeholders ya que la lógica es mock
    mock_building_geom = {}
    mock_roof_sections = [RoofSection(area=50, azimuth=180, tilt=30)]
    mock_obstacles = []

    monthly_factors, annual_factor = geometry_service.calculate_shading_factors(
        target_building_geometry=mock_building_geom,
        roof_sections=mock_roof_sections,
        obstacles_data=mock_obstacles,
        lat=40.0
    )

    assert isinstance(monthly_factors, list)
    assert len(monthly_factors) == 12
    assert all(0.0 <= f <= 1.0 for f in monthly_factors)

    assert isinstance(annual_factor, float)
    assert 0.0 <= annual_factor <= 1.0
    # Comprobar que annual_factor es el promedio de los mensuales (según la lógica mock actual)
    assert annual_factor == pytest.approx(sum(monthly_factors) / 12)


def test_estimate_max_kwp():
    """Test de la estimación de kWp máximos."""
    assert geometry_service.estimate_max_kwp(total_roof_area=0) == 0.0
    assert geometry_service.estimate_max_kwp(total_roof_area=100) > 0.0

    # Basado en la lógica actual: m2_per_kwp = 6.5
    area = 65.0
    expected_kwp = area / 6.5
    assert geometry_service.estimate_max_kwp(area) == pytest.approx(expected_kwp)

    area_small = 10.0
    expected_kwp_small = round(area_small / 6.5, 2)
    assert geometry_service.estimate_max_kwp(area_small) == pytest.approx(expected_kwp_small)
