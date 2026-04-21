"""
Rutas para exámenes especializados de Orina y Heces.

Endpoints:
- POST /orina          → Crear examen de orina
- GET /orina/{id}      → Obtener examen de orina
- PUT /orina/{id}      → Actualizar examen de orina
- DELETE /orina/{id}   → Eliminar examen de orina
- GET /orina/paciente/{paciente_id}  → Obtener exámenes de orina de paciente

- POST /heces          → Crear examen de heces
- GET /heces/{id}      → Obtener examen de heces
- PUT /heces/{id}      → Actualizar examen de heces
- DELETE /heces/{id}   → Eliminar examen de heces
- GET /heces/paciente/{paciente_id}  → Obtener exámenes de heces de paciente
"""

import logging
from fastapi import APIRouter, HTTPException, status
from datetime import date
from typing import List

from backend.app.dependencies import get_supabase_client
from backend.app.models.orina_heces_models import (

    OrinaCreate, OrinaOut, OrinaUpdate,
    HecesCreate, HecesOut, HecesUpdate
)

router = APIRouter(prefix="/api", tags=["Exámenes Especializados"])
logger = logging.getLogger(__name__)

# ============================
#   EXÁMENES DE ORINA
# ============================

@router.post("/orina", response_model=OrinaOut, status_code=status.HTTP_201_CREATED)
async def create_orina(orina: OrinaCreate):
    """
    Crear nuevo examen de orina.
    
    Guarda todos los campos del análisis completo de orina:
    - Propiedades macroscópicas (aspecto, color, olor, densidad, pH)
    - Propiedades químicas (albúmina, glucosa, nitritos, etc.)
    - Análisis microscópico (células, leucocitos, hematíes, etc.)
    """
    supabase = get_supabase_client()
    
    try:
        payload = orina.dict(exclude_none=False)
        
        # Convertir UUID a string si es necesario
        if isinstance(payload.get("paciente_id"), str):
            payload["paciente_id"] = payload["paciente_id"].strip()
        
        resp = supabase.table("examenes_orina").insert(payload).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se creó el examen de orina"
            )
        
        return OrinaOut(**resp.data[0])
        
    except Exception as e:
        logger.error(f"Error creando examen de orina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear examen de orina: {str(e)}"
        )


@router.get("/orina/{orina_id}", response_model=OrinaOut)
async def get_orina(orina_id: str):
    """Obtener examen de orina por ID"""
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("examenes_orina").select("*").eq("id", orina_id).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Examen de orina no encontrado"
            )
        
        return OrinaOut(**resp.data[0])
        
    except Exception as e:
        logger.error(f"Error obteniendo examen de orina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener examen de orina"
        )


@router.put("/orina/{orina_id}", response_model=OrinaOut)
async def update_orina(orina_id: str, orina: OrinaUpdate):
    """Actualizar examen de orina"""
    supabase = get_supabase_client()
    
    try:
        payload = orina.dict(exclude_none=True)
        
        resp = supabase.table("examenes_orina").update(payload).eq("id", orina_id).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Examen de orina no encontrado"
            )
        
        return OrinaOut(**resp.data[0])
        
    except Exception as e:
        logger.error(f"Error actualizando examen de orina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar examen de orina"
        )


@router.delete("/orina/{orina_id}")
async def delete_orina(orina_id: str):
    """Eliminar examen de orina"""
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("examenes_orina").delete().eq("id", orina_id).execute()
        
        return {"message": "Examen de orina eliminado correctamente"}
        
    except Exception as e:
        logger.error(f"Error eliminando examen de orina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar examen de orina"
        )


@router.get("/orina/paciente/{paciente_id}", response_model=List[OrinaOut])
async def get_orina_by_paciente(paciente_id: str):
    """
    Obtener todos los exámenes de orina de un paciente.
    Ordenados por fecha descendente (más reciente primero).
    """
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("examenes_orina")\
            .select("*")\
            .eq("paciente_id", paciente_id)\
            .order("fecha", desc=True)\
            .execute()
        
        return [OrinaOut(**item) for item in resp.data]
        
    except Exception as e:
        logger.error(f"Error obteniendo exámenes de orina: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener exámenes de orina"
        )


# ============================
#   EXÁMENES DE HECES
# ============================

@router.post("/heces", response_model=HecesOut, status_code=status.HTTP_201_CREATED)
async def create_heces(heces: HecesCreate):
    """
    Crear nuevo examen de heces.
    
    Guarda todos los campos del análisis completo de heces:
    - Propiedades macroscópicas (color, consistencia, forma, etc.)
    - Propiedades químicas (pH)
    - Análisis microscópico (leucocitos, hematíes, grasa, etc.)
    - Parasitología (parásitos, huevos, quistes, etc.)
    - Cultivo (si se realizó)
    """
    supabase = get_supabase_client()
    
    try:
        payload = heces.dict(exclude_none=False)
        
        # Convertir UUID a string si es necesario
        if isinstance(payload.get("paciente_id"), str):
            payload["paciente_id"] = payload["paciente_id"].strip()
        
        resp = supabase.table("examenes_heces").insert(payload).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se creó el examen de heces"
            )
        
        return HecesOut(**resp.data[0])
        
    except Exception as e:
        logger.error(f"Error creando examen de heces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear examen de heces: {str(e)}"
        )


@router.get("/heces/{heces_id}", response_model=HecesOut)
async def get_heces(heces_id: str):
    """Obtener examen de heces por ID"""
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("examenes_heces").select("*").eq("id", heces_id).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Examen de heces no encontrado"
            )
        
        return HecesOut(**resp.data[0])
        
    except Exception as e:
        logger.error(f"Error obteniendo examen de heces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener examen de heces"
        )


@router.put("/heces/{heces_id}", response_model=HecesOut)
async def update_heces(heces_id: str, heces: HecesUpdate):
    """Actualizar examen de heces"""
    supabase = get_supabase_client()
    
    try:
        payload = heces.dict(exclude_none=True)
        
        resp = supabase.table("examenes_heces").update(payload).eq("id", heces_id).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Examen de heces no encontrado"
            )
        
        return HecesOut(**resp.data[0])
        
    except Exception as e:
        logger.error(f"Error actualizando examen de heces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar examen de heces"
        )


@router.delete("/heces/{heces_id}")
async def delete_heces(heces_id: str):
    """Eliminar examen de heces"""
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("examenes_heces").delete().eq("id", heces_id).execute()
        
        return {"message": "Examen de heces eliminado correctamente"}
        
    except Exception as e:
        logger.error(f"Error eliminando examen de heces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar examen de heces"
        )


@router.get("/heces/paciente/{paciente_id}", response_model=List[HecesOut])
async def get_heces_by_paciente(paciente_id: str):
    """
    Obtener todos los exámenes de heces de un paciente.
    Ordenados por fecha descendente (más reciente primero).
    """
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("examenes_heces")\
            .select("*")\
            .eq("paciente_id", paciente_id)\
            .order("fecha", desc=True)\
            .execute()
        
        return [HecesOut(**item) for item in resp.data]
        
    except Exception as e:
        logger.error(f"Error obteniendo exámenes de heces: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener exámenes de heces"
        )
