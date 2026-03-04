"""
Ejemplo de estructura de rutas

Este archivo es una plantilla de cómo estructurar las rutas de la API.

Ejemplo de uso en main.py:
    from app.routes import example_routes
    
    app.include_router(example_routes.router, prefix="/api/examples")
"""

from fastapi import APIRouter

router = APIRouter(tags=["examples"])


@router.get("/")
async def list_examples():
    """Listar ejemplos."""
    return [
        {"id": 1, "name": "Example 1"},
        {"id": 2, "name": "Example 2"},
    ]


@router.get("/{example_id}")
async def get_example(example_id: int):
    """Obtener un ejemplo por ID."""
    return {"id": example_id, "name": f"Example {example_id}"}


@router.post("/")
async def create_example(name: str):
    """Crear un nuevo ejemplo."""
    return {"id": 3, "name": name, "created": True}
