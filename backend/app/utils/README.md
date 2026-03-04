# Backend Utils Documentation

## Estructura

Las utilidades contienen funciones auxiliares reutilizables.

## Archivos disponibles

### helpers.py
Funciones auxiliares para manejo de respuestas y errores.

```python
from app.utils.helpers import format_response, handle_error

# Formattear una respuesta exitosa
response = format_response(
    data={"user_id": 1},
    success=True,
    message="Usuario creado"
)
# {"success": True, "data": {"user_id": 1}, "message": "Usuario creado"}

# Manejar un error
error = handle_error(ValueError("El email ya existe"))
# {"success": False, "data": None, "message": "El email ya existe"}
```

## Crear una nueva utilidad

1. **Crear archivo** (ej: `validators.py`):

```python
import re
from typing import Tuple

def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validar email.
    
    Args:
        email: Email a validar
        
    Returns:
        Tupla (es_válido, mensaje_error)
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if re.match(pattern, email):
        return True, ""
    else:
        return False, "Email inválido"
```

2. **Usar en servicios o rutas**:

```python
from app.utils.validators import validate_email

is_valid, error = validate_email("user@example.com")
if not is_valid:
    return {"error": error}
```

## Mejores prácticas

- Funciones simples y específicas
- Documentar con docstrings
- Manejar excepciones adecuadamente
- Tipos de datos claros (type hints)
- Nombres descriptivos
