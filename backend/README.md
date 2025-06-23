# HotSpot360 Solar Calculator API Backend

Este directorio contiene el backend de la API para la Calculadora Solar HotSpot360, desarrollada con FastAPI.

## Configuración del Entorno

Se recomienda utilizar un entorno virtual de Python para gestionar las dependencias de este proyecto.

1.  **Crear un entorno virtual:**
    Desde el directorio `backend/`, ejecuta:
    ```bash
    python -m venv venv
    ```
    o si usas `python3`:
    ```bash
    python3 -m venv venv
    ```
    Esto creará un directorio `venv/` dentro de `backend/`.

2.  **Activar el entorno virtual:**
    *   En macOS y Linux:
        ```bash
        source venv/bin/activate
        ```
    *   En Windows (Git Bash o similar):
        ```bash
        source venv/Scripts/activate
        ```
    *   En Windows (Command Prompt):
        ```bash
        .\venv\Scripts\activate
        ```
    Sabrás que el entorno está activado porque el prompt de tu terminal cambiará para incluir `(venv)`.

3.  **Instalar dependencias:**
    Asegúrate de que tu entorno virtual esté activado. Luego, desde el directorio `backend/`, ejecuta:
    ```bash
    pip install -r requirements.txt
    ```

## Ejecutar la Aplicación

Una vez que las dependencias estén instaladas y el entorno virtual activado:

1.  **Navega al directorio `backend/`** si aún no estás allí.
2.  **Ejecuta el servidor Uvicorn:**
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
    *   `app.main:app`: Le dice a Uvicorn dónde encontrar la instancia de FastAPI (`app`) dentro del archivo `main.py` en el paquete `app`.
    *   `--reload`: Hace que el servidor se reinicie automáticamente después de los cambios en el código (útil para desarrollo).
    *   `--port 8000`: Especifica el puerto en el que se ejecutará el servidor.

Alternativamente, si estás en el directorio raíz del proyecto (un nivel por encima de `backend/`), puedes ejecutar:
```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```

## Acceder a la API y Documentación

Una vez que el servidor esté en funcionamiento:

*   **API Root:** [http://localhost:8000/](http://localhost:8000/)
*   **Documentación Interactiva (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
*   **Documentación Alternativa (ReDoc):** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Endpoints Principales

*   `/location/analyze` (POST): Analiza una ubicación para su potencial solar.
    *   Input: `{ "lat": float, "lng": float }`
    *   Output: Detalles del tejado, sombreado, kWp máximos.
*   `/consumption/predict/manual` (POST): Predice el consumo energético basado en un perfil manual.
    *   Input: `{ "occupants": int, "area_m2": int, "has_ev": bool, "has_heat_pump": bool, "clp": Optional[str] }`
    *   Output: Perfil de consumo anual, mensual y horario.
*   `/consumption/predict/csv` (POST): Predice el consumo energético a partir de un archivo CSV.
    *   Input: Un archivo CSV (`multipart/form-data`) con una única columna de 8760 valores horarios de consumo en kWh.
    *   Output: Perfil de consumo anual, mensual y horario.

    **Formato del archivo CSV para `/consumption/predict/csv`:**
    *   El archivo debe contener exactamente 8760 filas.
    *   Cada fila debe representar el consumo en kWh para una hora del año.
    *   Se espera una única columna de datos numéricos. Si hay varias columnas, se intentará usar la primera.
    *   No se espera una fila de encabezado por defecto.
    *   Los separadores de columnas comunes (coma, punto y coma) y los separadores decimales (punto, coma) se intentarán detectar automáticamente.
    *   Se recomienda codificación UTF-8 o Latin-1.

## Variables de Entorno

La aplicación puede utilizar variables de entorno definidas en un archivo `.env` dentro del directorio `backend/`. Consulta `backend/.env.example` (si existe) o el código fuente (ej. `app/services/overpass_service.py`) para ver las variables que se pueden configurar.

Actualmente, las variables de entorno potenciales son:
*   `OVERPASS_API_URL`: URL del servidor de la API Overpass (por defecto: `https://overpass-api.de/api/interpreter`)
*   `PVGIS_API_URL_CALC`: URL de la API PVGIS para cálculos PV (por defecto: `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc`)
*   `PVGIS_API_URL_HORIZON`: URL de la API PVGIS para cálculos de horizonte (por defecto: `https://re.jrc.ec.europa.eu/api/v5_2/SHcalc`)

Crea un archivo `backend/.env` y añade las configuraciones que necesites:
```env
# backend/.env
# OVERPASS_API_URL=tu_url_overpass_si_es_diferente
# PVGIS_API_URL_CALC=tu_url_pvgis_calc_si_es_diferente
```

## Estructura del Proyecto

*   `app/`: Contiene la lógica principal de la aplicación FastAPI.
    *   `main.py`: Punto de entrada de la aplicación, configuración de FastAPI, middlewares.
    *   `routers/`: Módulos que definen los endpoints de la API.
    *   `schemas/`: Modelos Pydantic para validación de datos y serialización.
    *   `services/`: Lógica de negocio, interacción con APIs externas, cálculos.
    *   `models/`: (Potencialmente para modelos de base de datos si se usa un ORM).
*   `requirements.txt`: Lista de dependencias de Python.
*   `venv/`: (Si se crea) Directorio del entorno virtual.
*   `.env`: (Opcional, no versionado) Para variables de entorno locales.
*   `.gitignore`: Especifica los archivos y directorios ignorados por Git.
*   `README.md`: Este archivo.
```
