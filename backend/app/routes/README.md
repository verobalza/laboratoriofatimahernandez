# Backend Routes Documentation

## Estructura

Las rutas se organizan en módulos separados dentro de la carpeta `routes/`.

## Ejemplo de uso

Para crear una nueva ruta:

1. **Crear un archivo de ruta** (ej: `users_routes.py`):

```python
from fastapi import APIRouter

router = APIRouter(tags=["users"])

@router.get("/users")
async def list_users():
    return [{"id": 1, "name": "User 1"}]
```

2. **Registrar la ruta en** `main.py`:

```python
from app.routes import users_routes

app.include_router(users_routes.router, prefix="/api")
```

## Archivos disponibles

- `example_routes.py` - Estructura de ejemplo para nuevas rutas

Ver [backend README](../README.md) para más información.
