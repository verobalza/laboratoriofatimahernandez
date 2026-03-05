"""
Modelos Pydantic para la entidad "paciente".
Define esquemas de solicitud y respuesta utilizados por los endpoints.
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
import re


class PacienteBase(BaseModel):
    nombre: str
    apellido: str
    edad: int
    telefono: str
    direccion: Optional[str] = None
    sexo: Optional[str] = None

    # validaciones comunes
    @field_validator("nombre", "apellido")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El campo no puede estar vacío")
        if len(v) < 2:
            raise ValueError("Debe tener al menos 2 caracteres")
        if len(v) > 100:
            raise ValueError("Debe tener máximo 100 caracteres")
        return v.strip()

    @field_validator("edad")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v < 0 or v > 120:
            raise ValueError("Edad inválida")
        return v

    @field_validator("telefono")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if len(cleaned) < 7:
            raise ValueError("Teléfono muy corto")
        return v.strip()


class PacienteCreate(PacienteBase):
    """Datos necesarios para crear un nuevo paciente."""
    pass


class PacienteUpdate(BaseModel):
    """Modelo para actualizar paciente (campos opcionales)."""
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    edad: Optional[int] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    sexo: Optional[str] = None

    @field_validator("nombre", "apellido")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.strip():
            raise ValueError("El campo no puede estar vacío")
        if len(v) < 2:
            raise ValueError("Debe tener al menos 2 caracteres")
        if len(v) > 100:
            raise ValueError("Debe tener máximo 100 caracteres")
        return v.strip()

    @field_validator("edad")
    @classmethod
    def validate_age(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        if v < 0 or v > 120:
            raise ValueError("Edad inválida")
        return v

    @field_validator("telefono")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cleaned = re.sub(r"\D", "", v)
        if len(cleaned) < 7:
            raise ValueError("Teléfono muy corto")
        return v.strip()


class PacienteOut(PacienteBase):
    """Modelo de salida con campos adicionales."""
    id: str
    creado_en: Optional[str] = None
