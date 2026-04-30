import os
from dotenv import load_dotenv

# Cargar variables de entorno desde .env antes de instanciar Settings
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import auth, pacientes, pruebas, examenes, facturacion, financiero, grupos, orina_heces
from .routes import roles
import logging

print("SUPABASE_URL:", settings.SUPABASE_URL)
print("ALLOWED_ORIGINS:", settings.ALLOWED_ORIGINS)


logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Laboratorio API",
    description="API para el proyecto fullstack",
    version="1.0.0",
    redirect_slashes=False


)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(pacientes.router)
app.include_router(pruebas.router)
app.include_router(grupos.router)
app.include_router(examenes.router)
app.include_router(facturacion.router)
app.include_router(financiero.router)
app.include_router(orina_heces.router)
app.include_router(roles.router)


@app.get("/health")
def health_check():
    """Endpoint para verificar que el servidor está funcionando."""
    return {"status": "ok"}


@app.get("/")
def read_root():
    """Endpoint raíz."""
    return {"message": "Bienvenido a la API de Laboratorio"}
print("FORZANDO DEPLOY RAILWAY")
