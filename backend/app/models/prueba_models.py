"""
Modelos Pydantic para la entidad prueba.
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID


class PruebaBase(BaseModel):
    nombre_prueba: str
    tipo_prueba: Optional[str] = 'numerica'
    unidad_medida: Optional[str] = None
    tipo_muestra: str
    valor_referencia_min: Optional[float] = None
    valor_referencia_max: Optional[float] = None
    descripcion: Optional[str] = None
    precio_bs: float
    grupo_id: Optional[str] = None

    @field_validator("nombre_prueba", "tipo_muestra")
    @classmethod
    def validate_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Este campo es obligatorio")
        return v.strip()

    @field_validator("tipo_prueba")
    @classmethod
    def validate_tipo_prueba(cls, v: str) -> str:
        if v not in ['numerica', 'serologia']:
            raise ValueError("El tipo de prueba debe ser 'numerica' o 'serologia'")
        return v

    @field_validator("precio_bs")
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
    tipo_prueba: Optional[str] = None
    unidad_medida: Optional[str] = None
    tipo_muestra: Optional[str] = None
    valor_referencia_min: Optional[float] = None
    valor_referencia_max: Optional[float] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    grupo_id: Optional[str] = None

    @field_validator("nombre_prueba", "unidad_medida", "tipo_muestra")
    @classmethod
    def validate_optional_required(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.strip():
            raise ValueError("Este campo no puede estar vacío")
        return v.strip()

    @field_validator("tipo_prueba")
    @classmethod
    def validate_tipo_prueba(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ['numerica', 'serologia']:
            raise ValueError("El tipo de prueba debe ser 'numerica' o 'serologia'")
        return v

    @field_validator("precio")
    @classmethod
    def validate_price(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        return round(v, 2)


class PruebaOut(PruebaBase):
    id: int
    creado_en: Optional[str] = None
    precio_usd: Optional[float] = None

    class Config:
        from_attributes = True


# ============================
#   MODELOS PARA GRUPOS
# ============================

class GrupoPruebaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    activo: Optional[bool] = True

    @field_validator("nombre")
    @classmethod
    def validate_nombre(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El nombre del grupo es obligatorio")
        return v.strip()


class GrupoPruebaCreate(GrupoPruebaBase):
    pass


class GrupoPruebaOut(GrupoPruebaBase):
    id: str
    creado_en: Optional[str] = None

    class Config:
        from_attributes = True
