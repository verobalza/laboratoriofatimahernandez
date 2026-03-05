"""
Modelos Pydantic para la entidad prueba.
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID


class PruebaBase(BaseModel):
    nombre_prueba: str
    unidad_medida: str
    tipo_muestra: str
    valor_referencia_min: Optional[float] = None
    valor_referencia_max: Optional[float] = None
    descripcion: Optional[str] = None
    precio: float

    @field_validator("nombre_prueba", "unidad_medida", "tipo_muestra")
    @classmethod
    def validate_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Este campo es obligatorio")
        return v.strip()

    @field_validator("precio")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return round(v, 2)


class PruebaCreate(PruebaBase):
    """Datos necesarios para crear prueba"""
    pass


class PruebaUpdate(BaseModel):
    nombre_prueba: Optional[str] = None
    unidad_medida: Optional[str] = None
    tipo_muestra: Optional[str] = None
    valor_referencia_min: Optional[float] = None
    valor_referencia_max: Optional[float] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None

    @field_validator("nombre_prueba", "unidad_medida", "tipo_muestra")
    @classmethod
    def validate_optional_required(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.strip():
            raise ValueError("Este campo no puede estar vacío")
        return v.strip()

    @field_validator("precio")
    @classmethod
    def validate_price(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return round(v, 2)


class PruebaOut(PruebaBase):
    id: str
    creado_en: Optional[str] = None

    class Config:
        from_attributes = True
