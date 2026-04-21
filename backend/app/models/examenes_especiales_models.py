"""
Modelos Pydantic para exámenes especializados de orina y heces.
"""

from pydantic import BaseModel, field_validator, field_serializer, ConfigDict
from typing import Optional
from datetime import datetime


# ============================
#   MODELOS PARA ORINA
# ============================

class OrinaBase(BaseModel):
    examen_id: str  # FK a examenes.id

    aspecto: Optional[str] = None
    color: Optional[str] = None
    olor: Optional[str] = None
    densidad: Optional[str] = None
    ph: Optional[str] = None
    reaccion: Optional[str] = None
    albumina: Optional[str] = None
    cuerpos_cetonicos: Optional[str] = None
    hemoglobina: Optional[str] = None
    glucosa: Optional[str] = None
    nitritos: Optional[str] = None
    pigmentos_biliares: Optional[str] = None
    bilirrubina: Optional[str] = None
    urobilinogenos: Optional[str] = None
    celulas_epiteliales: Optional[str] = None
    leucocitos: Optional[str] = None
    piocitos: Optional[str] = None
    cristales: Optional[str] = None
    cilindros: Optional[str] = None
    levaduras: Optional[str] = None
    protozoarios: Optional[str] = None
    mucina: Optional[str] = None
    bacterias: Optional[str] = None
    hematies: Optional[str] = None

    @field_validator("examen_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID de examen inválido")
        return v.strip()


class OrinaCreate(OrinaBase):
    pass


class OrinaUpdate(BaseModel):
    # Examen físico
    aspecto: Optional[str] = None
    color: Optional[str] = None
    olor: Optional[str] = None
    densidad: Optional[float] = None
    ph: Optional[float] = None
    reaccion: Optional[str] = None

    # Examen químico
    albumina: Optional[str] = None
    glucosa: Optional[str] = None
    cuerpos_cetonicos: Optional[str] = None
    nitritos: Optional[str] = None
    pigmentos_biliares: Optional[str] = None
    bilirrubina: Optional[str] = None
    urobilinogeno: Optional[str] = None

    # Examen microscópico
    celulas_epiteliales: Optional[int] = None
    leucocitos: Optional[int] = None
    piocitos: Optional[int] = None
    cristales: Optional[str] = None
    cilindros: Optional[str] = None
    levaduras: Optional[str] = None
    protozoarios: Optional[str] = None
    mucina: Optional[str] = None
    bacterias: Optional[str] = None
    hematies: Optional[int] = None

    # Observaciones
    observaciones: Optional[str] = None


class OrinaOut(OrinaBase):
    id: str
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None


# ============================
#   MODELOS PARA HECES
# ============================

class HecesBase(BaseModel):
    examen_id: str  # FK a examenes.id

    color: Optional[str] = None
    consistencia: Optional[str] = None
    moco: Optional[str] = None
    sangre_oculta: Optional[str] = None
    restos_alimenticios: Optional[str] = None
    ph: Optional[str] = None
    leucocitos: Optional[str] = None
    hematies: Optional[str] = None
    parasitos: Optional[str] = None
    huevos: Optional[str] = None
    quistes: Optional[str] = None
    bacterias: Optional[str] = None
    observaciones: Optional[str] = None

    @field_validator("examen_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID de examen inválido")
        return v.strip()


class HecesCreate(HecesBase):
    pass


class HecesUpdate(BaseModel):
    color: Optional[str] = None
    consistencia: Optional[str] = None
    moco: Optional[str] = None
    sangre_oculta: Optional[str] = None
    restos_alimenticios: Optional[str] = None
    ph: Optional[float] = None
    leucocitos: Optional[int] = None
    hematies: Optional[int] = None
    parasitos: Optional[str] = None
    huevos: Optional[str] = None
    quistes: Optional[str] = None
    bacterias: Optional[str] = None
    observaciones: Optional[str] = None


class HecesOut(HecesBase):
    id: str
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None