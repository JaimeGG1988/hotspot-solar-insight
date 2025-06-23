import pytest
import sqlite3
import os

# Importar el módulo database y subsidy_service para monkeypatching si es necesario
from backend.app.db import database as app_database # Renombrar para evitar conflicto con variable 'database'
from backend.app.services import subsidy_service


@pytest.fixture(scope="function") # "function" scope para que se ejecute para cada test
def memory_db(monkeypatch):
    """
    Fixture para usar una base de datos SQLite en memoria para los tests.
    Esto asegura que los tests no afecten la base de datos de desarrollo/producción
    y que cada test (o módulo de test) comience con una base de datos limpia.
    """
    # Guardar la ruta original de la base de datos
    original_db_path = app_database.DATABASE_PATH
    original_db_dir = app_database.DATABASE_DIR

    # Definir la ruta a la base de datos en memoria
    # Usar un archivo temporal con nombre único también es una opción si :memory: da problemas con múltiples conexiones
    # o si se necesita inspeccionar la BD después. Pero :memory: es más rápido.
    memory_path = ":memory:"

    # Monkeypatch DATABASE_PATH en el módulo database.py
    monkeypatch.setattr(app_database, 'DATABASE_PATH', memory_path)
    # No necesitamos monkeypatch DATABASE_DIR si usamos :memory:
    # monkeypatch.setattr(app_database, 'DATABASE_DIR', '') # O un dir temporal

    # Crear las tablas en la base de datos en memoria
    # La función get_db_connection ahora usará memory_path debido al monkeypatch
    app_database.create_tables()

    # logger.info(f"Usando base de datos en memoria: {memory_path} para el test.")

    yield # Aquí es donde se ejecuta el test

    # Cleanup: No es estrictamente necesario para :memory: ya que se descarta,
    # pero si se usara un archivo temporal, aquí se borraría.
    # Restaurar la ruta original de la base de datos para evitar efectos secundarios
    monkeypatch.setattr(app_database, 'DATABASE_PATH', original_db_path)
    monkeypatch.setattr(app_database, 'DATABASE_DIR', original_db_dir)
    # logger.info(f"Restaurada la ruta de la base de datos a: {original_db_path}")


@pytest.fixture
def test_subsidy_service(memory_db):
    """
    Fixture que proporciona una instancia del subsidy_service que opera
    sobre la base de datos en memoria.
    El fixture memory_db se pasa como argumento para asegurar que se configura
    la BD en memoria antes de que este fixture se use.
    """
    # El subsidy_service usará automáticamente la BD en memoria porque
    # el módulo app_database.py ha sido monkeypatcheado por memory_db.
    return subsidy_service

from fastapi.testclient import TestClient
from backend.app.main import app # Importar la app FastAPI

@pytest.fixture(scope="module") # "module" scope para que el cliente se cree una vez por módulo de test
def client():
    """
    Cliente de Test para la API FastAPI.
    Este cliente permite hacer peticiones HTTP a la aplicación FastAPI en un entorno de test.
    """
    with TestClient(app) as c:
        yield c
