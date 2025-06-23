import pytest
from typing import Optional
from backend.app.schemas.subsidy import SubsidyCreate, Subsidy
from backend.app.services import subsidy_service as sub_service # Alias para claridad
from datetime import date, timedelta

# Los fixtures 'memory_db' y 'test_subsidy_service' vienen de conftest.py
# test_subsidy_service ya está configurado para usar memory_db


def test_add_and_get_subsidy(test_subsidy_service):
    """Test añadiendo y obteniendo una subvención."""
    subsidy_data = SubsidyCreate(
        name="Test Subsidy 1",
        region_code="ES-TEST",
        type="fixed_amount",
        value=100.0,
        max_amount_eur=100.0,
        is_active=True
    )
    created_subsidy: Optional[Subsidy] = test_subsidy_service.add_subsidy(subsidy_data)

    assert created_subsidy is not None
    assert created_subsidy.id is not None
    assert created_subsidy.name == subsidy_data.name
    assert created_subsidy.value == subsidy_data.value

    retrieved_subsidy: Optional[Subsidy] = test_subsidy_service.get_subsidy_by_id(created_subsidy.id)
    assert retrieved_subsidy is not None
    assert retrieved_subsidy.name == subsidy_data.name
    assert retrieved_subsidy.id == created_subsidy.id

def test_get_subsidy_not_found(test_subsidy_service):
    """Test obteniendo una subvención que no existe."""
    retrieved_subsidy = test_subsidy_service.get_subsidy_by_id(99999)
    assert retrieved_subsidy is None

def test_get_all_subsidies(test_subsidy_service):
    """Test obteniendo todas las subvenciones, incluyendo activas e inactivas."""
    test_subsidy_service.add_subsidy_raw("Active Sub", "ES", "fixed_amount", 10, is_active=True)
    test_subsidy_service.add_subsidy_raw("Inactive Sub", "ES", "fixed_amount", 20, is_active=False)

    all_subs = test_subsidy_service.get_all_subsidies(active_only=False)
    assert len(all_subs) >= 2 # Puede haber más si tests anteriores no limpiaron (pero memory_db debería)

    active_names = {s.name for s in all_subs if s.is_active}
    inactive_names = {s.name for s in all_subs if not s.is_active}

    assert "Active Sub" in active_names
    assert "Inactive Sub" in inactive_names

    only_active_subs = test_subsidy_service.get_all_subsidies(active_only=True)
    assert len(only_active_subs) >= 1
    assert all(s.is_active for s in only_active_subs)
    assert "Active Sub" in {s.name for s in only_active_subs}
    assert "Inactive Sub" not in {s.name for s in only_active_subs}


@pytest.mark.parametrize("region_code, system_kwp, entity_type, expected_count, expected_names", [
    ("ES-MD", 5.0, "residential", 2, ["Madrid Specific Grant", "National Grant"]), # Espera específica de Madrid y Nacional
    ("ES-CT", 3.0, "residential", 1, ["National Grant"]), # Solo nacional (no hay específica para ES-CT)
    ("ES", 2.0, "business", 1, ["National Business Grant"]), # Nacional para empresas
    ("ES-MD", 0.5, "residential", 0, []), # kWp demasiado bajo para las de Madrid y Nacional
    ("ES-MD", 15.0, "residential", 1, ["National Grant"]), # Madrid Specific excede max_kwp_eligible
    ("ES-XX", 5.0, "residential", 1, ["National Grant"]), # Región no existente, solo aplica nacional
    ("ES-MD", 5.0, "community", 1, ["National Grant Community"]), # Tipo de entidad 'community'
])
def test_get_eligible_subsidies(test_subsidy_service, region_code, system_kwp, entity_type, expected_count, expected_names):
    """Test de la lógica de elegibilidad de subvenciones."""
    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()
    tomorrow_str = (date.today() + timedelta(days=1)).isoformat()

    # Datos de prueba
    test_subsidy_service.add_subsidy_raw(name="National Grant", region_code="ES", type="amount_per_kwp", value=100, min_kwp_required=1.0, max_kwp_eligible=10.0, applicable_to_entity_type="residential", start_date=yesterday_str, end_date=tomorrow_str, is_active=True)
    test_subsidy_service.add_subsidy_raw(name="Madrid Specific Grant", region_code="ES-MD", type="percentage_cost", value=0.1, min_kwp_required=2.0, max_kwp_eligible=8.0, applicable_to_entity_type="residential", start_date=yesterday_str, end_date=tomorrow_str, is_active=True)
    test_subsidy_service.add_subsidy_raw(name="Expired Grant", region_code="ES-MD", type="fixed_amount", value=50, start_date="2023-01-01", end_date="2023-12-31", is_active=True) # Activa pero expirada
    test_subsidy_service.add_subsidy_raw(name="Inactive Grant", region_code="ES-MD", type="fixed_amount", value=60, is_active=False) # Inactiva
    test_subsidy_service.add_subsidy_raw(name="Future Grant", region_code="ES", type="fixed_amount", value=70, start_date=tomorrow_str, is_active=True) # Aún no activa
    test_subsidy_service.add_subsidy_raw(name="National Business Grant", region_code="ES", type="amount_per_kwp", value=150, applicable_to_entity_type="business", is_active=True)
    test_subsidy_service.add_subsidy_raw(name="National Grant Community", region_code="ES", type="amount_per_kwp", value=120, applicable_to_entity_type="community", is_active=True)


    eligible = test_subsidy_service.get_eligible_subsidies(
        region_code=region_code,
        system_kwp=system_kwp,
        entity_type=entity_type,
        query_date_str=today_str
    )

    assert len(eligible) == expected_count
    retrieved_names = sorted([s.name for s in eligible])
    assert retrieved_names == sorted(expected_names)


@pytest.mark.parametrize("subsidy_type, value, max_amount, sys_kwp, cost, expected_calc", [
    ("percentage_cost", 0.20, 1000.0, 5.0, 6000.0, 1000.0), # 20% de 6000 = 1200, capado a 1000
    ("percentage_cost", 0.10, None, 3.0, 4000.0, 400.0),   # 10% de 4000 = 400
    ("fixed_amount", 500.0, None, 5.0, 6000.0, 500.0),
    ("fixed_amount", 700.0, 600.0, 5.0, 6000.0, 600.0),    # Capado a 600
    ("amount_per_kwp", 100.0, 1000.0, 5.0, 6000.0, 500.0), # 100 * 5 = 500
    ("amount_per_kwp", 100.0, 400.0, 5.0, 6000.0, 400.0),  # 100 * 5 = 500, capado a 400
    # Caso con max_kwp_eligible
    ("amount_per_kwp", 100.0, None, 15.0, 20000.0, 1000.0), # max_kwp_eligible es 10 en la subvención de prueba, así que 100 * 10 = 1000
    ("percentage_cost", 0.20, None, 15.0, 20000.0, 2666.67), # 20% de (20000/15 * 10) = 20% de 13333.33
])
def test_calculate_subsidy_amount(test_subsidy_service, subsidy_type, value, max_amount, sys_kwp, cost, expected_calc):
    """Test del cálculo del monto de la subvención."""
    # Crear una subvención de prueba para este test específico
    # Usamos add_subsidy_raw para simplificar, ya que test_subsidy_service usa memory_db
    # y se limpia para cada test (debido al scope="function" del fixture memory_db)

    subsidy_id = test_subsidy_service.add_subsidy_raw(
        name=f"CalcTestSub-{subsidy_type}",
        region_code="ES-CALC",
        type=subsidy_type,
        value=value,
        max_amount_eur=max_amount,
        min_kwp_required=0.1, # Asegurar que sea elegible por kWp
        max_kwp_eligible=10.0 if "max_kwp_eligible" in subsidy_type or "15.0" in str(sys_kwp) else None, # Aplicar solo si el test lo espera
        is_active=True
    )
    assert subsidy_id is not None and subsidy_id != -1

    subsidy_obj = test_subsidy_service.get_subsidy_by_id(subsidy_id)
    assert subsidy_obj is not None

    calculated = test_subsidy_service.calculate_subsidy_amount(subsidy_obj, sys_kwp, cost)
    assert round(calculated, 2) == round(expected_calc, 2)

def test_calculate_subsidy_amount_inactive(test_subsidy_service):
    """Test que una subvención inactiva calcula 0."""
    subsidy_id = test_subsidy_service.add_subsidy_raw("InactiveCalc", "ES", "fixed_amount", 100, is_active=False)
    subsidy_obj = test_subsidy_service.get_subsidy_by_id(subsidy_id)
    assert subsidy_obj is not None

    calculated = test_subsidy_service.calculate_subsidy_amount(subsidy_obj, 5.0, 6000.0)
    assert calculated == 0.0

def test_calculate_subsidy_min_kwp_not_met(test_subsidy_service):
    """Test que si no se cumple min_kwp_required, calcula 0."""
    subsidy_id = test_subsidy_service.add_subsidy_raw("MinKwpTest", "ES", "fixed_amount", 100, min_kwp_required=3.0, is_active=True)
    subsidy_obj = test_subsidy_service.get_subsidy_by_id(subsidy_id)
    assert subsidy_obj is not None

    # system_kwp (2.0) es menor que min_kwp_required (3.0)
    calculated = test_subsidy_service.calculate_subsidy_amount(subsidy_obj, 2.0, 3000.0)
    assert calculated == 0.0

    # system_kwp (3.0) cumple con min_kwp_required (3.0)
    calculated_ok = test_subsidy_service.calculate_subsidy_amount(subsidy_obj, 3.0, 4000.0)
    assert calculated_ok == 100.0
