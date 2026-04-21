"""
Modelos Pydantic para la entidad financiera (Tasa de Cambio y Movimientos Financieros).
"""

from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class TasaCambioBase(BaseModel):
    """Base para tasa de cambio (1 USD = X Bs)"""
    tasa: float

    @field_validator("tasa")
    @classmethod
    def validate_tasa(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("La tasa debe ser mayor a 0")
        return round(v, 4)


class TasaCambioCreate(TasaCambioBase):
    """Datos para crear/actualizar tasa de cambio"""
    pass


class TasaCambioOut(TasaCambioBase):
    """Respuesta de tasa de cambio"""
    id: str
    creado_en: Optional[str] = None
    actualizado_en: Optional[str] = None

    class Config:
        from_attributes = True


class MovimientoFinancieroBase(BaseModel):
    """Base para movimiento financiero"""
    paciente_id: str
    monto_bs: float
    monto_usd: float
    tipo: str  # "ticket" o "factura"
    fecha: Optional[datetime] = None

    @field_validator("monto_bs", "monto_usd")
    @classmethod
    def validate_montos(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El monto no puede ser negativo")
        return round(v, 2)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        if v not in ["ticket", "factura"]:
            raise ValueError("El tipo debe ser 'ticket' o 'factura'")
        return v.lower()


class MovimientoFinancieroCreate(MovimientoFinancieroBase):
    """Datos para registrar movimiento financiero"""
    pass


class MovimientoFinancieroOut(MovimientoFinancieroBase):
    """Respuesta de movimiento financiero"""
    id: str
    creado_en: Optional[str] = None

    class Config:
        from_attributes = True


class ResumenFinanciero(BaseModel):
    """Resumen de totales financieros"""
    total_diario_bs: float
    total_diario_usd: float
    total_semanal_bs: float
    total_semanal_usd: float
    total_mensual_bs: float
    total_mensual_usd: float
    total_anual_bs: float
    total_anual_usd: float
    tasa_actual: float


class TotalesPorTipo(BaseModel):
    """Totales separados por tipo de documento"""
    tickets_bs: float
    tickets_usd: float
    facturas_bs: float
    facturas_usd: float
