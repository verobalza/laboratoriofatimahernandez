"""
Modelos Pydantic para exámenes especializados de Orina y Heces.
"""

from pydantic import BaseModel, field_validator, field_serializer
from typing import Optional
from datetime import date, datetime


# ============================
#   MODELOS PARA ORINA
# ============================

class OrinaBase(BaseModel):
    """Base para examen de orina"""
    paciente_id: str          # UUID
    prueba_id: Optional[int] = None
    fecha: date
    
    # Propiedades macroscópicas
    aspecto: Optional[str] = None
    color: Optional[str] = None
    olor: Optional[str] = None
    densidad: Optional[float] = None
    ph: Optional[float] = None
    
    # Propiedades químicas
    reaccion: Optional[str] = None
    albumina: Optional[str] = None
    glucosa: Optional[str] = None
    nitritos: Optional[str] = None
    bilirrubina: Optional[str] = None
    urobilinogenos: Optional[str] = None
    cetonas: Optional[str] = None
    hemoglobina: Optional[str] = None
    
    # Análisis microscópico
    celulas_epiteliales: Optional[int] = None
    leucocitos: Optional[int] = None
    hematíes: Optional[int] = None
    cristales: Optional[str] = None
    bacterias: Optional[str] = None
    cilindros: Optional[str] = None
    particulas_varias: Optional[str] = None
    
    # Observaciones
    observaciones: Optional[str] = None
    notas_tecnico: Optional[str] = None

    @field_validator("paciente_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID del paciente es obligatorio")
        return v.strip()
    
    @field_serializer("fecha")
    def serialize_fecha(self, value: date, _info):
        """Serializar fecha como string ISO format"""
        return value.isoformat() if isinstance(value, date) else value


class OrinaCreate(OrinaBase):
    """Datos necesarios para crear examen de orina"""
    pass


class OrinaUpdate(BaseModel):
    """Datos para actualizar examen de orina (todos opcionales)"""
    aspecto: Optional[str] = None
    color: Optional[str] = None
    olor: Optional[str] = None
    densidad: Optional[float] = None
    ph: Optional[float] = None
    
    reaccion: Optional[str] = None
    albumina: Optional[str] = None
    glucosa: Optional[str] = None
    nitritos: Optional[str] = None
    bilirrubina: Optional[str] = None
    urobilinogenos: Optional[str] = None
    cetonas: Optional[str] = None
    hemoglobina: Optional[str] = None
    
    celulas_epiteliales: Optional[int] = None
    leucocitos: Optional[int] = None
    hematíes: Optional[int] = None
    cristales: Optional[str] = None
    bacterias: Optional[str] = None
    cilindros: Optional[str] = None
    particulas_varias: Optional[str] = None
    
    observaciones: Optional[str] = None
    notas_tecnico: Optional[str] = None


class OrinaOut(OrinaBase):
    """Response para examen de orina"""
    id: str                   # UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None
    creado_por: Optional[str] = None

    class Config:
        from_attributes = True


# ============================
#   MODELOS PARA HECES
# ============================

class HecesBase(BaseModel):
    """Base para examen de heces"""
    paciente_id: str          # UUID
    prueba_id: Optional[int] = None
    fecha: date
    
    # Propiedades macroscópicas
    color: Optional[str] = None
    consistencia: Optional[str] = None
    forma: Optional[str] = None
    presencia_moco: Optional[str] = None
    presencia_sangre: Optional[str] = None
    presencia_restos_alimenticios: Optional[str] = None
    
    # Propiedades químicas
    ph: Optional[float] = None
    
    # Análisis microscópico
    leucocitos: Optional[int] = None
    hematíes: Optional[int] = None
    celulas_epiteliales: Optional[int] = None
    grasa: Optional[int] = None
    almidón: Optional[int] = None
    fibras_musculares: Optional[int] = None
    cristales_colesterol: Optional[int] = None
    cristales_otros: Optional[str] = None
    
    # Parasitología
    parasitos: Optional[str] = None
    huevos_parasitos: Optional[str] = None
    quistes_parasitos: Optional[str] = None
    bacterias: Optional[str] = None
    levaduras: Optional[str] = None
    
    # Cultivo (opcional)
    cultivo_resultado: Optional[str] = None
    microorganismos_aislados: Optional[str] = None
    
    # Observaciones
    observaciones: Optional[str] = None
    notas_tecnico: Optional[str] = None

    @field_validator("paciente_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID del paciente es obligatorio")
        return v.strip()
    
    @field_serializer("fecha")
    def serialize_fecha(self, value: date, _info):
        """Serializar fecha como string ISO format"""
        return value.isoformat() if isinstance(value, date) else value


class HecesCreate(HecesBase):
    """Datos necesarios para crear examen de heces"""
    pass


class HecesUpdate(BaseModel):
    """Datos para actualizar examen de heces (todos opcionales)"""
    color: Optional[str] = None
    consistencia: Optional[str] = None
    forma: Optional[str] = None
    presencia_moco: Optional[str] = None
    presencia_sangre: Optional[str] = None
    presencia_restos_alimenticios: Optional[str] = None
    
    ph: Optional[float] = None
    
    leucocitos: Optional[int] = None
    hematíes: Optional[int] = None
    celulas_epiteliales: Optional[int] = None
    grasa: Optional[int] = None
    almidón: Optional[int] = None
    fibras_musculares: Optional[int] = None
    cristales_colesterol: Optional[int] = None
    cristales_otros: Optional[str] = None
    
    parasitos: Optional[str] = None
    huevos_parasitos: Optional[str] = None
    quistes_parasitos: Optional[str] = None
    bacterias: Optional[str] = None
    levaduras: Optional[str] = None
    
    cultivo_resultado: Optional[str] = None
    microorganismos_aislados: Optional[str] = None
    
    observaciones: Optional[str] = None
    notas_tecnico: Optional[str] = None


class HecesOut(HecesBase):
    """Response para examen de heces"""
    id: str                   # UUID
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None
    creado_por: Optional[str] = None

    class Config:
        from_attributes = True


# ============================
#   MODELOS PARA MISCELÁNEOS
# ============================

class MiscelaneosBase(BaseModel):
    paciente_id: str
    prueba_id: Optional[int] = None
    fecha: date

    vsg_1hora: Optional[float] = None
    vsg_2hora: Optional[float] = None
    k: Optional[float] = None
    metodo: Optional[str] = None
    observaciones: Optional[str] = None

    @field_validator("paciente_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID del paciente es obligatorio")
        return v.strip()

    @field_serializer("fecha")
    def serialize_fecha(self, value: date, _info):
        return value.isoformat() if isinstance(value, date) else value


class MiscelaneosCreate(MiscelaneosBase):
    pass


class MiscelaneosOut(MiscelaneosBase):
    id: str
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None
    creado_por: Optional[str] = None

    class Config:
        from_attributes = True


# ============================
#   MODELOS PARA COAGULACIÓN
# ============================

class CoagulacionBase(BaseModel):
    paciente_id: str
    prueba_id: Optional[int] = None
    fecha: date

    pt_paciente: Optional[float] = None
    seg_control_pt: Optional[float] = None
    razon_pc: Optional[float] = None
    v_r: Optional[float] = None
    isi: Optional[float] = None
    inr: Optional[float] = None
    ptt_paciente: Optional[float] = None
    seg_control_ptt: Optional[float] = None
    dif_pc: Optional[float] = None
    vr_diferencia: Optional[float] = None
    observaciones: Optional[str] = None

    @field_validator("paciente_id")
    @classmethod
    def validate_uuid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ID del paciente es obligatorio")
        return v.strip()

    @field_serializer("fecha")
    def serialize_fecha(self, value: date, _info):
        return value.isoformat() if isinstance(value, date) else value


class CoagulacionCreate(CoagulacionBase):
    pass


class CoagulacionOut(CoagulacionBase):
    id: str
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None
    creado_por: Optional[str] = None

    class Config:
        from_attributes = True
