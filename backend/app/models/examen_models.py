"""
Modelos Pydantic para la entidad examen.
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import date


class ExamenBase(BaseModel):
    paciente_id: str
    prueba_id: str
    fecha: date
    resultado: Optional[str] = None
    observaciones: Optional[str] = None

    @field_validator("paciente_id", "prueba_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID inválido")
        return v.strip()


class ExamenCreate(ExamenBase):
    pass


class ExamenUpdate(BaseModel):
    resultado: Optional[str] = None
    observaciones: Optional[str] = None


class ExamenOut(ExamenBase):
    id: str
    creado_en: Optional[str] = None
