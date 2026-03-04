# Backend Services Documentation

## Estructura

Los servicios contienen la lógica de negocio de la aplicación. Se usan desde las rutas.

## Servicios disponibles

### example_service.py
Servicio de ejemplo.

```python
from app.services.example_service import ExampleService

service = ExampleService()
result = service.get_something()
# {"message": "Hello from Example Service"}

data = service.process_data({"key": "value"})
# {"original": {"key": "value"}, "processed": True}
```

## Crear un nuevo servicio

1. **Crear archivo** (ej: `user_service.py`):

```python
from typing import List, Optional
from app.models.user_models import UserCreate, User

class UserService:
    """Servicio para gestionar usuarios."""
    
    def __init__(self):
        # Aquí se puede inyectar dependencias (DB, etc.)
        self.users_db = []  # Simulación de BD
    
    def create_user(self, user: UserCreate) -> User:
        """Crear un nuevo usuario."""
        new_user = User(
            id=len(self.users_db) + 1,
            name=user.name,
            email=user.email,
            created_at="2024-01-01"
        )
        self.users_db.append(new_user)
        return new_user
    
    def get_user(self, user_id: int) -> Optional[User]:
        """Obtener usuario por ID."""
        for user in self.users_db:
            if user.id == user_id:
                return user
        return None
    
    def get_all_users(self) -> List[User]:
        """Obtener todos los usuarios."""
        return self.users_db
    
    def update_user(self, user_id: int, user_data: UserCreate) -> Optional[User]:
        """Actualizar usuario."""
        user = self.get_user(user_id)
        if user:
            user.name = user_data.name
            user.email = user_data.email
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """Eliminar usuario."""
        self.users_db = [u for u in self.users_db if u.id != user_id]
        return True
```

2. **Usar en rutas**:

```python
from fastapi import APIRouter
from app.services.user_service import UserService
from app.models.user_models import UserCreate, User

router = APIRouter(prefix="/users")
user_service = UserService()

@router.post("/", response_model=User)
async def create_user(user: UserCreate):
    return user_service.create_user(user)

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int):
    user = user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/", response_model=List[User])
async def get_users():
    return user_service.get_all_users()
```

## Mejores prácticas

- Separación de lógica de negocio de las rutas
- Usar inyección de dependencias
- Documentar métodos con docstrings
- Type hints en todos los métodos
- Manejar excepciones adecuadamente
- Reutilizar lógica entre métodos
