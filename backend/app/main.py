import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers
from app.routers import location, consumption # Added consumption router

# Load environment variables from .env file
load_dotenv()

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HotSpot360 Solar Calculator API",
    description="API para la calculadora solar de HotSpot360, parte del proyecto Lovable.",
    version="0.1.0"
)

# CORS (Cross-Origin Resource Sharing)
# Esto permitirá que el frontend (que se ejecutará en un origen diferente)
# pueda hacer peticiones a esta API.
# Por ahora, permitimos todos los orígenes, métodos y headers.
# En producción, se deberían restringir a los orígenes conocidos.
origins = [
    "http://localhost",
    "http://localhost:3000", # Si el frontend React corre en el puerto 3000
    "http://localhost:5173", # Puerto común para Vite dev server
    # Añadir aquí los dominios de producción/staging cuando se despliegue
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # O ["*"] para permitir todos.
    allow_credentials=True,
    allow_methods=["*"], # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"], # Permite todos los headers
)

# Include routers
app.include_router(location.router, prefix="/location", tags=["Location Analysis"])
app.include_router(consumption.router, prefix="/consumption", tags=["Consumption Prediction"])

@app.get("/", tags=["Root"])
async def read_root():
    logger.info("Root endpoint was called.")
    return {"message": "Welcome to the HotSpot360 Solar Calculator API!"}

# Aquí se podrían añadir más configuraciones globales, como event handlers para startup/shutdown, etc.

# Para correr la aplicación (desde el directorio backend/):
# uvicorn app.main:app --reload --port 8000
# O si tienes uvicorn instalado globalmente y estás en el directorio raíz del proyecto:
# uvicorn backend.app.main:app --reload --port 8000
