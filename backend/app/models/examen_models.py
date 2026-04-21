"""
Modelos Pydantic para la entidad examen.
"""

from pydantic import BaseModel, field_validator, field_serializer, ConfigDict
from typing import Optional, List
from datetime import date, datetime


# ============================
#   MODELOS PARA EXAMENES
# ============================

class ExamenBase(BaseModel):
    paciente_id: str          # uuid
    prueba_id: int            # bigint
    fecha: date
    resultado: Optional[str] = None
    observaciones: Optional[str] = None

    @field_validator("paciente_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID inválido")
        return v.strip()
    
    @field_serializer("fecha")
    def serialize_fecha(self, value: date, _info):
        """Serializar fecha como string ISO format"""
        return value.isoformat() if isinstance(value, date) else value


class ExamenCreate(ExamenBase):
    pass


class ExamenUpdate(BaseModel):
    resultado: Optional[str] = None
    observaciones: Optional[str] = None


class ExamenOut(ExamenBase):
    id: str                   # uuid
    creado_en: Optional[datetime] = None



# ============================
#   MODELOS PARA EXAMENES PDF
# ============================

class ExamenPDFBase(BaseModel):
    paciente_id: str
    fecha: date
    url_pdf: str
    pruebas: List[str]        # jsonb NOT NULL

    @field_validator("paciente_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID inválido")
        return v.strip()
    
    @field_serializer("fecha")
    def serialize_fecha(self, value: date, _info):
        """Serializar fecha como string ISO format"""
        return value.isoformat() if isinstance(value, date) else value


class ExamenPDFCreate(ExamenPDFBase):
    pass


class ExamenPDFOut(ExamenPDFBase):
    id: int                   # BIGINT
    factura_id: Optional[int] = None
    creado_en: Optional[datetime] = None

    # Campos agregados manualmente
    paciente_nombre: Optional[str] = None
    paciente_telefono: Optional[str] = None
