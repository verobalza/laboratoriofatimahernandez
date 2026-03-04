"""
Ejemplo de estructura de modelo (Pydantic)

Los modelos definen la estructura de los datos que se envían y reciben.

Ejemplo de uso:
    from app.models.example_models import ExampleModel
    
    example = ExampleModel(name="Test", value=123)
    print(example.dict())  # {"name": "Test", "value": 123}
"""

from pydantic import BaseModel
from typing import Optional


class ExampleModel(BaseModel):
    """Modelo de ejemplo."""
    
    name: str
    value: int
    description: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Example",
                "value": 42,
                "description": "Un ejemplo de modelo"
            }
        }
