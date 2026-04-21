"""
Modelos Pydantic para la entidad factura.
Define esquemas para facturaci├│n.
"""

from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class FacturaDetalleItem(BaseModel):
    """Detalle de prueba en una factura."""
    prueba_id: str
    nombre_prueba: str
    precio: float
    cantidad: int = 1

    @field_validator("precio")
    @classmethod
    def validate_price(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El precio no puede ser negativo")
        return round(v, 2)


class TicketBase(BaseModel):
    """Base para ticket (sin IVA)."""
    paciente_id: str
    fecha_examen: str  # ISO format date
    detalles: List[FacturaDetalleItem]
    base_imponible: float
    total: float

    @field_validator("base_imponible", "total")
    @classmethod
    def validate_amounts(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El monto no puede ser negativo")
        return round(v, 2)


class FacturaBase(BaseModel):
    """Base para factura (con IVA)."""
    numero_factura: str
    paciente_id: str
    fecha_examen: str  # ISO format date
    detalles: List[FacturaDetalleItem]
    base_imponible: float
    iva: float
    total: float

    @field_validator("numero_factura")
    @classmethod
    def validate_numero(cls, v: str) -> str:
        if not v.startswith("FAC-"):
            raise ValueError("N├║mero de factura debe iniciar con 'FAC-'")
        return v

    @field_validator("base_imponible", "iva", "total")
    @classmethod
    def validate_amounts(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El monto no puede ser negativo")
        return round(v, 2)


class TicketCreate(TicketBase):
    """Datos necesarios para crear un ticket."""
    pass


class FacturaCreate(FacturaBase):
    """Datos necesarios para crear una factura."""
    pass


class TicketOut(TicketBase):
    """Respuesta de ticket."""
    id: Optional[str] = None
    creado_en: Optional[datetime] = None


class FacturaOut(FacturaBase):
    """Respuesta de factura."""
    id: Optional[int] = None
    fechaemision: Optional[datetime] = None

    class Config:
        from_attributes = True


class PacienteInfo(BaseModel):
    """Informaci├│n del paciente para facturaci├│n."""
    id: str
    nombre: str
    apellido: str
    edad: int
    telefono: str
    direccion: Optional[str] = None


class VisitaInfo(BaseModel):
    """Informaci├│n de una visita (fecha)."""
    fecha: str
    cantidad_pruebas: int


class DetalleVisita(BaseModel):
    """Detalle completo de una visita."""
    paciente_id: str
    fecha: str
    pruebas: List[Dict[str, Any]]
