# Backend Models Documentation

## Estructura

Los modelos definen la estructura de datos usando Pydantic. Sirven para validar entrada/salida de endpoints.

## Modelos disponibles

### example_models.py
Modelos de ejemplo.

```python
from app.models.example_models import ExampleModel

# Crear instancia
example = ExampleModel(
    name="Test",
    value=42,
    description="Un ejemplo"
)

# Convertir a dict
data = example.dict()
# {"name": "Test", "value": 42, "description": "Un ejemplo"}

# Convertir a JSON
json_str = example.model_dump_json()
```

## Crear un nuevo modelo

1. **Crear archivo** (ej: `user_models.py`):

```python
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Datos base del usuario."""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Juan",
                "email": "juan@example.com"
            }
        }

class UserCreate(UserBase):
    """Modelo para crear usuario."""
    password: str = Field(..., min_length=8)

class User(UserBase):
    """Modelo de usuario completo."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
```

2. **Usar en rutas**:

```python
from fastapi import APIRouter
from app.models.user_models import UserCreate, User

router = APIRouter()

@router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    # Procesar y crear usuario
    return {"id": 1, "name": user.name, "email": user.email, "created_at": "2024-01-01"}
```

## Mejores prácticas

- Heredar de BaseModel de Pydantic
- Usar type hints claros
- Validar con `Field`
- Usar `Optional` para campos opcionales
- Documentar con Config.json_schema_extra
- Separar modelos para create/update/response
- Usar `from_attributes = True` para modelos de BD
