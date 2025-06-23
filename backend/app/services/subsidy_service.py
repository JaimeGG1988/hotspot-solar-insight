import logging
from typing import List, Optional, Dict, Any
from app.db.database import execute_query, execute_modification # Usaremos estas funciones helper
from app.schemas.subsidy import Subsidy, SubsidyCreate, AppliedSubsidy # Importamos los schemas Pydantic
from datetime import date

logger = logging.getLogger(__name__)

def _map_row_to_subsidy_schema(row: Dict[str, Any]) -> Subsidy:
    """Mapea una fila de la base de datos (dict) al schema Pydantic Subsidy."""
    # SQLite guarda booleanos como 0 o 1. Pydantic los maneja bien si el tipo es bool.
    # Aseguramos que is_active se convierta a bool si es necesario (aunque Pydantic v1 lo hace).
    if 'is_active' in row:
        row['is_active'] = bool(row['is_active'])
    return Subsidy(**row)

def add_subsidy_raw(
    name: str, region_code: str, type: str, value: float,
    max_amount_eur: Optional[float] = None, min_kwp_required: Optional[float] = 0.0,
    max_kwp_eligible: Optional[float] = None, conditions_text: Optional[str] = None,
    applicable_to_entity_type: str = 'residential', source_url: Optional[str] = None,
    start_date: Optional[str] = None, end_date: Optional[str] = None, is_active: bool = True
) -> int:
    """
    Añade una nueva subvención a la base de datos usando parámetros directos.
    Devuelve el ID de la subvención insertada o -1 en caso de error.
    """
    query = """
        INSERT INTO subsidies (
            name, region_code, type, value, max_amount_eur, min_kwp_required,
            max_kwp_eligible, conditions_text, applicable_to_entity_type, source_url,
            start_date, end_date, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (
        name, region_code, type, value, max_amount_eur, min_kwp_required,
        max_kwp_eligible, conditions_text, applicable_to_entity_type, source_url,
        start_date, end_date, 1 if is_active else 0
    )
    try:
        new_id = execute_modification(query, params)
        logger.info(f"Subvención '{name}' añadida con ID: {new_id}")
        return new_id
    except Exception as e:
        logger.error(f"Error al añadir subvención '{name}': {e}", exc_info=True)
        return -1

def add_subsidy(subsidy_data: SubsidyCreate) -> Optional[Subsidy]:
    """
    Añade una nueva subvención a la base de datos usando un schema Pydantic.
    Devuelve el objeto Subsidy creado o None en caso de error.
    """
    new_id = add_subsidy_raw(**subsidy_data.dict())
    if new_id != -1 and new_id is not None: # execute_modification devuelve lastrowid o rowcount
        return get_subsidy_by_id(new_id)
    return None


def get_subsidy_by_id(subsidy_id: int) -> Optional[Subsidy]:
    """Obtiene una subvención por su ID."""
    query = "SELECT * FROM subsidies WHERE id = ?"
    rows = execute_query(query, (subsidy_id,))
    if rows:
        return _map_row_to_subsidy_schema(rows[0])
    return None

def get_all_subsidies(active_only: bool = False) -> List[Subsidy]:
    """Obtiene todas las subvenciones, opcionalmente solo las activas."""
    query = "SELECT * FROM subsidies"
    params = ()
    if active_only:
        query += " WHERE is_active = ?"
        params = (1,)

    rows = execute_query(query, params)
    return [_map_row_to_subsidy_schema(row) for row in rows]


def get_eligible_subsidies(
    region_code: str,
    system_kwp: float,
    # total_investment_cost: float, # El cálculo del monto se hará después
    entity_type: str = 'residential',
    query_date_str: Optional[str] = None # YYYY-MM-DD, defaults to today
) -> List[Subsidy]:
    """
    Recupera subvenciones activas y válidas para una región, tamaño de sistema,
    tipo de entidad y fecha dadas.
    La lógica de elegibilidad más compleja (ej. max_amount_eur vs calculated)
    se aplicará en el servicio de finanzas al calcular el monto.
    """
    if query_date_str is None:
        query_date_str = date.today().isoformat()

    # Construcción de la consulta SQL
    # Prioridad de regiones: específica (ES-MD-XX) > provincial (ES-MD) > autonómica (ES) > nacional (ES)
    # Esto se puede manejar buscando en orden o con un `region_code LIKE ?` pero es más complejo.
    # Por ahora, buscaremos una coincidencia exacta y también la nacional 'ES' si la región no es 'ES'.

    # Lista de códigos de región a buscar: específico y nacional.
    # Si region_code es "ES-MD-MADRID", buscaremos "ES-MD-MADRID", "ES-MD", "ES"
    # Esto requiere una lógica de "sub-regiones" o un manejo más sofisticado.
    # Simplificación por ahora: buscar región exacta Y 'ES' (nacional)

    # region_codes_to_check = [region_code]
    # if region_code != "ES": # Siempre incluir la nacional si no es la consultada
    #     region_codes_to_check.append("ES")
    # region_placeholders = ','.join('?' for _ in region_codes_to_check)

    # La consulta busca subvenciones que:
    # 1. Estén activas.
    # 2. Coincidan con la región O sean nacionales (ES). (Simplificado)
    # 3. El tipo de entidad coincida o sea 'any'.
    # 4. La fecha de consulta esté dentro del rango de validez (si se especifican fechas).
    # 5. El system_kwp cumpla con min_kwp_required.
    # 6. El system_kwp cumpla con max_kwp_eligible (si está definido).

    # Construcción de la query base
    # Nota: La búsqueda por jerarquía de region_code (ej. ES-MD-001, ES-MD, ES) se simplifica.
    # Una forma más robusta sería tener una tabla de jerarquía de regiones o pasar una lista de regiones relevantes.
    # Por ahora, se buscará la región exacta Y la nacional 'ES'.

    conditions = [
        "s.is_active = 1",
        "(s.region_code = ? OR s.region_code = 'ES')", # Región específica o Nacional
        "(s.applicable_to_entity_type = ? OR s.applicable_to_entity_type = 'any')",
        "(s.start_date IS NULL OR s.start_date <= ?)",
        "(s.end_date IS NULL OR s.end_date >= ?)",
        "(s.min_kwp_required IS NULL OR s.min_kwp_required <= ?)",
        "(s.max_kwp_eligible IS NULL OR s.max_kwp_eligible >= ?)" # kWp del sistema debe ser menor o igual al max elegible de la subvención
    ]

    query_params_list = [
        region_code, # para s.region_code = ?
        entity_type, # para s.applicable_to_entity_type = ?
        query_date_str, # para s.start_date <= ?
        query_date_str, # para s.end_date >= ?
        system_kwp,     # para s.min_kwp_required <= ?
        system_kwp      # para s.max_kwp_eligible >= ?
    ]

    final_query = f"SELECT * FROM subsidies s WHERE {' AND '.join(conditions)} ORDER BY s.type, s.value DESC" # Priorizar ciertos tipos o valores

    logger.debug(f"Executing get_eligible_subsidies query: {final_query} with params: {query_params_list}")

    try:
        rows = execute_query(final_query, tuple(query_params_list))
        eligible_subsidies = [_map_row_to_subsidy_schema(row) for row in rows]

        # Filtrado adicional si la región es 'ES' para evitar duplicados si region_code también era 'ES'
        if region_code == 'ES':
            # No es necesario filtrar más aquí porque la query ya lo maneja con OR
            pass
        else:
            # Si region_code no es 'ES', la query trae la específica y la nacional.
            # Podríamos querer una lógica para que la específica sobreescriba la nacional si son del mismo 'tipo' o 'nombre'.
            # Por ahora, se devuelven todas las que coinciden.
            pass

        logger.info(f"Found {len(eligible_subsidies)} eligible subsidies for region '{region_code}', kwp={system_kwp}, entity='{entity_type}', date='{query_date_str}'.")
        return eligible_subsidies
    except Exception as e:
        logger.error(f"Error fetching eligible subsidies: {e}", exc_info=True)
        return []


def calculate_subsidy_amount(subsidy: Subsidy, system_kwp: float, total_investment_cost: float) -> float:
    """
    Calcula el monto de una subvención específica para un sistema y coste dados.
    """
    calculated_amount = 0.0
    if not subsidy.is_active:
        return 0.0

    # Verificar elegibilidad por kWp (aunque get_eligible_subsidies ya debería haber filtrado)
    if subsidy.min_kwp_required is not None and system_kwp < subsidy.min_kwp_required:
        return 0.0
    # Para max_kwp_eligible, la subvención podría aplicar solo hasta ese límite de kWp.
    # Ej: subvención para los primeros 10 kWp. Si el sistema es de 15kWp, se calcula sobre 10kWp.

    kwp_to_calculate_on = system_kwp
    if subsidy.max_kwp_eligible is not None and system_kwp > subsidy.max_kwp_eligible:
        kwp_to_calculate_on = subsidy.max_kwp_eligible


    if subsidy.type == 'percentage_cost':
        # Para 'percentage_cost', el coste base podría ser sobre el kwp elegible
        # Si system_kwp > max_kwp_eligible, el coste sobre el que se aplica el % es proporcional
        cost_eligible_for_percentage = total_investment_cost
        if subsidy.max_kwp_eligible is not None and system_kwp > subsidy.max_kwp_eligible and system_kwp > 0:
            cost_eligible_for_percentage = (total_investment_cost / system_kwp) * subsidy.max_kwp_eligible

        calculated_amount = cost_eligible_for_percentage * subsidy.value

    elif subsidy.type == 'fixed_amount':
        calculated_amount = subsidy.value

    elif subsidy.type == 'amount_per_kwp':
        calculated_amount = kwp_to_calculate_on * subsidy.value

    # Aplicar el límite máximo de la subvención si existe
    if subsidy.max_amount_eur is not None and calculated_amount > subsidy.max_amount_eur:
        calculated_amount = subsidy.max_amount_eur

    return round(calculated_amount, 2)
