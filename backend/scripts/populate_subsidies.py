import sys
import os
import logging

# Añadir el directorio raíz del proyecto (un nivel por encima de backend) al sys.path
# para permitir importaciones de app.services, etc.
# Esto es útil si ejecutas el script desde el directorio backend/scripts/
# o desde la raíz del proyecto como python backend/scripts/populate_subsidies.py
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Ahora podemos importar desde backend.app
from backend.app.db.database import create_tables, DATABASE_PATH, get_db_connection # Para verificar si la BD existe
from backend.app.services import subsidy_service # Usaremos la función add_subsidy_raw
from backend.app.schemas.subsidy import SubsidyCreate # Para validar datos de entrada si usamos add_subsidy

# Configurar logging básico para el script
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def clear_existing_subsidies():
    """Elimina todas las subvenciones existentes de la tabla."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM subsidies")
        conn.commit()
        logger.info("Todas las subvenciones existentes han sido eliminadas.")
    except Exception as e:
        logger.error(f"Error al eliminar subvenciones existentes: {e}", exc_info=True)
    finally:
        conn.close()

def populate():
    """Puebla la base de datos con subvenciones de ejemplo."""
    logger.info(f"Asegurando que la tabla 'subsidies' exista en {DATABASE_PATH}...")
    create_tables() # Asegura que la tabla esté creada

    # Opcional: limpiar datos existentes antes de poblar
    # Descomentar si quieres que el script siempre empiece con una tabla limpia.
    # clear_existing_subsidies()
    # logger.info("Tabla 'subsidies' limpiada antes de poblar.")


    subsidies_data = [
        {
            "name": "Ayuda Nacional Autoconsumo Residencial 2024",
            "region_code": "ES", # Nacional
            "type": "amount_per_kwp",
            "value": 300.0, # 300 € por kWp
            "max_amount_eur": 3000.0, # Máximo 3000 €
            "min_kwp_required": 1.0,
            "max_kwp_eligible": 10.0, # Aplica a los primeros 10 kWp
            "conditions_text": "Para instalaciones residenciales conectadas a red. Requiere factura de empresa instaladora certificada.",
            "applicable_to_entity_type": "residential",
            "source_url": "http://example.com/ayuda-nacional-2024",
            "start_date": "2024-01-01",
            "end_date": "2024-12-31",
            "is_active": True
        },
        {
            "name": "Subvención Comunidad de Madrid - Eficiencia Energética",
            "region_code": "ES-MD", # Comunidad de Madrid
            "type": "percentage_cost",
            "value": 0.20, # 20% del coste de la instalación
            "max_amount_eur": 4000.0,
            "min_kwp_required": 2.0,
            "conditions_text": "IVA no incluido en la base subvencionable. Solo para la Comunidad de Madrid.",
            "applicable_to_entity_type": "residential",
            "source_url": "http://example.com/ayuda-madrid-2024",
            "start_date": "2024-03-01",
            "end_date": "2024-11-30",
            "is_active": True
        },
        {
            "name": "Plan Impulso Solar Barcelona (Empresas)",
            "region_code": "ES-CT-B", # Barcelona (provincia o ciudad, definir granularidad)
            "type": "amount_per_kwp",
            "value": 200.0,
            "max_amount_eur": 10000.0,
            "min_kwp_required": 5.0,
            "max_kwp_eligible": 50.0,
            "conditions_text": "Para PYMES y grandes empresas en el término municipal de Barcelona.",
            "applicable_to_entity_type": "business",
            "start_date": "2024-02-01",
            "is_active": True
        },
        {
            "name": "Ayuda Fija Ayuntamiento XYZ",
            "region_code": "ES-XX-XYZ", # Ejemplo de código municipal
            "type": "fixed_amount",
            "value": 500.0, # 500 € fijos
            "max_amount_eur": 500.0, # El máximo es la propia ayuda
            "conditions_text": "Para cualquier tipo de instalación en el municipio XYZ. Unifamiliar.",
            "applicable_to_entity_type": "residential",
            "is_active": True
        },
        {
            "name": "Subvención Inactiva de Ejemplo",
            "region_code": "ES",
            "type": "percentage_cost",
            "value": 0.50, # 50%
            "max_amount_eur": 1000.0,
            "start_date": "2023-01-01",
            "end_date": "2023-12-31", # Ya expiró
            "is_active": False # Marcada como inactiva
        }
    ]

    logger.info(f"Intentando insertar/actualizar {len(subsidies_data)} subvenciones de ejemplo...")
    count_added = 0
    count_exists = 0

    for data in subsidies_data:
        # Podríamos añadir una lógica para verificar si una subvención con el mismo nombre y región ya existe
        # y decidir si actualizarla o saltarla. Por simplicidad, este script las insertará.
        # Si se ejecuta múltiples veces sin `clear_existing_subsidies`, se duplicarán.
        # Para un script de población real, se necesitaría una lógica de "upsert" o borrado previo.

        # Usando add_subsidy_raw para simplificar la inserción directa.
        # Si quisiéramos usar add_subsidy(SubsidyCreate(**data)), necesitaríamos asegurar
        # que todos los campos opcionales que no están en SubsidyCreate (como 'id')
        # no se pasen o se manejen adecuadamente.

        # Para evitar duplicados simples por nombre y región en esta ejecución:
        # (Esta es una comprobación muy básica, no un "upsert" completo)
        existing = subsidy_service.execute_query(
            "SELECT id FROM subsidies WHERE name = ? AND region_code = ?",
            (data["name"], data["region_code"])
        )
        if not existing or (existing and "clear_existing_subsidies()" in open(__file__).read() and "# clear_existing_subsidies()" not in open(__file__).read()): # si se limpia, siempre se inserta
            # El chequeo de "clear_existing_subsidies()" es un hack para el ejemplo, no para producción.
            # La idea es que si no se limpia, y ya existe, no la inserta de nuevo.
            # Si se limpia, el `existing` será false.

            subsidy_id = subsidy_service.add_subsidy_raw(
                name=data["name"],
                region_code=data["region_code"],
                type=data["type"],
                value=data["value"],
                max_amount_eur=data.get("max_amount_eur"),
                min_kwp_required=data.get("min_kwp_required", 0.0),
                max_kwp_eligible=data.get("max_kwp_eligible"),
                conditions_text=data.get("conditions_text"),
                applicable_to_entity_type=data.get("applicable_to_entity_type", 'residential'),
                source_url=data.get("source_url"),
                start_date=data.get("start_date"),
                end_date=data.get("end_date"),
                is_active=data.get("is_active", True)
            )
            if subsidy_id != -1:
                count_added += 1
            else:
                logger.warning(f"No se pudo añadir la subvención: {data['name']}")
        else:
            logger.info(f"La subvención '{data['name']}' para la región '{data['region_code']}' ya existe. Omitiendo.")
            count_exists +=1


    logger.info(f"Población de la base de datos completada. {count_added} subvenciones añadidas, {count_exists} ya existían (o fueron omitidas).")

if __name__ == "__main__":
    logger.info("Iniciando script para poblar la base de datos de subvenciones...")
    # Descomenta la siguiente línea si quieres limpiar la tabla cada vez que ejecutas el script.
    # CUIDADO: Esto borrará todos los datos de la tabla 'subsidies'.
    # clear_existing_subsidies()
    populate()
    logger.info("Script de población finalizado.")

    # Para verificar, puedes consultar la base de datos directamente o usar el servicio:
    # all_subs = subsidy_service.get_all_subsidies(active_only=False)
    # logger.info(f"Total de subvenciones en la BD: {len(all_subs)}")
    # for s in all_subs:
    #     logger.info(f" - {s.name} (ID: {s.id}, Activa: {s.is_active})")
