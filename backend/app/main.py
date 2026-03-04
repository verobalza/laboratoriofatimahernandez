from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routes import auth

app = FastAPI(
    title="Laboratorio API",
    description="API para el proyecto fullstack",
    version="1.0.0"
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


@app.get("/health")
def health_check():
    """Endpoint para verificar que el servidor está funcionando."""
    return {"status": "ok"}


@app.get("/")
def read_root():
    """Endpoint raíz."""
    return {"message": "Bienvenido a la API de Laboratorio"}
