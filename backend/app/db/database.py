import sqlite3
import logging
import os
from typing import List, Any, Dict

logger = logging.getLogger(__name__)

# Define la ruta a la base de datos dentro del directorio backend/data/
# __file__ es la ruta al archivo actual (database.py)
# os.path.dirname(__file__) es backend/app/db/
# os.path.join(..., '..', '..', 'data') sube dos niveles y luego va a data/
DATABASE_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
DATABASE_NAME = 'subsidies.db'
DATABASE_PATH = os.path.join(DATABASE_DIR, DATABASE_NAME)

def get_db_connection() -> sqlite3.Connection:
    """Establece y devuelve una conexión a la base de datos SQLite."""
    # Asegurarse de que el directorio data/ exista
    os.makedirs(DATABASE_DIR, exist_ok=True)

    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row # Permite acceder a las columnas por nombre
    return conn

def create_tables():
    """Crea las tablas de la base de datos si no existen."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subsidies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                region_code TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('percentage_cost', 'fixed_amount', 'amount_per_kwp')),
                value REAL NOT NULL,
                max_amount_eur REAL,
                min_kwp_required REAL DEFAULT 0,
                max_kwp_eligible REAL,
                conditions_text TEXT,
                applicable_to_entity_type TEXT DEFAULT 'residential' CHECK(applicable_to_entity_type IN ('residential', 'business', 'community', 'any')),
                source_url TEXT,
                start_date TEXT, -- ISO 8601 YYYY-MM-DD
                end_date TEXT,   -- ISO 8601 YYYY-MM-DD
                is_active INTEGER NOT NULL DEFAULT 1 -- Boolean (0 or 1)
            )
        """)
        # Se podrían añadir índices aquí para mejorar el rendimiento de las búsquedas
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_subsidies_region_code ON subsidies (region_code);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_subsidies_is_active ON subsidies (is_active);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_subsidies_type ON subsidies (type);")

        conn.commit()
        logger.info(f"Tabla 'subsidies' verificada/creada en la base de datos: {DATABASE_PATH}")
    except sqlite3.Error as e:
        logger.error(f"Error al crear/verificar tablas en SQLite: {e}", exc_info=True)
    finally:
        conn.close()

# --- Funciones CRUD básicas (opcionales para el alcance inicial, pero útiles) ---

def execute_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Ejecuta una consulta SELECT y devuelve todas las filas como una lista de diccionarios."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows] # Convertir sqlite3.Row a dict
    except sqlite3.Error as e:
        logger.error(f"Error en la consulta SQLite: {query} con params {params} - {e}", exc_info=True)
        return []
    finally:
        conn.close()

def execute_modification(query: str, params: tuple = ()) -> int:
    """Ejecuta una consulta de modificación (INSERT, UPDATE, DELETE) y devuelve el ID de la fila insertada o el número de filas afectadas."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid if cursor.lastrowid else cursor.rowcount # lastrowid para INSERT, rowcount para UPDATE/DELETE
    except sqlite3.Error as e:
        logger.error(f"Error en la modificación SQLite: {query} con params {params} - {e}", exc_info=True)
        # Podríamos querer re-lanzar la excepción o devolver un valor que indique fallo, ej -1
        return -1
    finally:
        conn.close()

# Llamar a create_tables() cuando este módulo se importe por primera vez
# para asegurar que la tabla exista antes de que cualquier servicio intente usarla.
# Esto es adecuado para una configuración simple. En aplicaciones más grandes,
# las migraciones de bases de datos se manejan de forma más explícita (ej. con Alembic).
if __name__ == '__main__':
    # Esto permite ejecutar el script directamente para crear la BD/tabla
    logger.info("Ejecutando database.py directamente para asegurar que la base de datos y las tablas se creen.")
    create_tables()
    # Ejemplo de inserción (solo si se ejecuta directamente y para testing)
    # test_insert_id = execute_modification(
    #     "INSERT INTO subsidies (name, region_code, type, value, is_active) VALUES (?, ?, ?, ?, ?)",
    #     ("Test Subvención Nacional", "ES", "percentage_cost", 0.15, 1)
    # )
    # logger.info(f"Subvención de prueba insertada con ID: {test_insert_id}")
    # results = execute_query("SELECT * FROM subsidies WHERE region_code = ? AND is_active = ?", ("ES", 1))
    # logger.info(f"Subvenciones de prueba encontradas: {results}")
else:
    # Si se importa, solo crear las tablas. No ejecutar código de prueba.
    create_tables()
