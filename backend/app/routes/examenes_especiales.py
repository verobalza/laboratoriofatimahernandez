"""
Rutas para exámenes especializados de orina y heces.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from ..models.examenes_especiales_models import (
    OrinaCreate, OrinaUpdate, OrinaOut,
    HecesCreate, HecesUpdate, HecesOut
)
from ..dependencies import get_supabase_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================
#   ENDPOINTS PARA ORINA
# ============================

@router.post("orina", response_model=OrinaOut)
async def create_orina(orina: OrinaCreate, supabase=Depends(get_supabase_client)):
    """Crear examen de orina"""
    try:
        data = orina.model_dump()
        response = supabase.table("examenes_orina").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al crear examen de orina")
        return OrinaOut(**response.data[0])
    except Exception as e:
        logger.error(f"Error creando examen de orina: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("orina/{orina_id}", response_model=OrinaOut)
async def get_orina(orina_id: str, supabase=Depends(get_supabase_client)):
    """Obtener examen de orina por ID"""
    try:
        response = supabase.table("examenes_orina").select("*").eq("id", orina_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Examen de orina no encontrado")
        return OrinaOut(**response.data[0])
    except Exception as e:
        logger.error(f"Error obteniendo examen de orina: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("orina/{orina_id}", response_model=OrinaOut)
async def update_orina(orina_id: str, orina: OrinaUpdate, supabase=Depends(get_supabase_client)):
    """Actualizar examen de orina"""
    try:
        data = orina.model_dump(exclude_none=True)
        data["actualizado_en"] = "now()"

        response = supabase.table("examenes_orina").update(data).eq("id", orina_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Examen de orina no encontrado")
        return OrinaOut(**response.data[0])
    except Exception as e:
        logger.error(f"Error actualizando examen de orina: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("orina/{orina_id}")
async def delete_orina(orina_id: str, supabase=Depends(get_supabase_client)):
    """Eliminar examen de orina"""
    try:
        response = supabase.table("examenes_orina").delete().eq("id", orina_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Examen de orina no encontrado")
        return {"message": "Examen de orina eliminado"}
    except Exception as e:
        logger.error(f"Error eliminando examen de orina: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("orina/examen/{examen_id}", response_model=OrinaOut)
async def get_orina_by_examen(examen_id: str, supabase=Depends(get_supabase_client)):
    """Obtener examen de orina por ID de examen"""
    try:
        response = supabase.table("examenes_orina").select("*").eq("examen_id", examen_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Examen de orina no encontrado")
        return OrinaOut(**response.data[0])
    except Exception as e:
        logger.error(f"Error obteniendo examen de orina por examen_id: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================
#   ENDPOINTS PARA HECES
# ============================

@router.post("heces", response_model=HecesOut)
async def create_heces(heces: HecesCreate, supabase=Depends(get_supabase_client)):
    """Crear examen de heces"""
    try:
        data = heces.model_dump()
        response = supabase.table("examenes_heces").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Error al crear examen de heces")
        return HecesOut(**response.data[0])
    except Exception as e:
        logger.error(f"Error creando examen de heces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("heces/{heces_id}", response_model=HecesOut)
async def get_heces(heces_id: str, supabase=Depends(get_supabase_client)):
    """Obtener examen de heces por ID"""
    try:
        response = supabase.table("examenes_heces").select("*").eq("id", heces_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Examen de heces no encontrado")
        return HecesOut(**response.data[0])
    except Exception as e:
        logger.error(f"Error obteniendo examen de heces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("heces/{heces_id}", response_model=HecesOut)
async def update_heces(heces_id: str, heces: HecesUpdate, supabase=Depends(get_supabase_client)):
    """Actualizar examen de heces"""
    try:
        data = heces.model_dump(exclude_none=True)
        data["actualizado_en"] = "now()"

        response = supabase.table("examenes_heces").update(data).eq("id", heces_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Examen de heces no encontrado")
        return HecesOut(**response.data[0])
    except Exception as e:
        logger.error(f"Error actualizando examen de heces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("heces/{heces_id}")
async def delete_heces(heces_id: str, supabase=Depends(get_supabase_client)):
    """Eliminar examen de heces"""
    try:
        response = supabase.table("examenes_heces").delete().eq("id", heces_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Examen de heces no encontrado")
        return {"message": "Examen de heces eliminado"}
    except Exception as e:
        logger.error(f"Error eliminando examen de heces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("heces/examen/{examen_id}", response_model=HecesOut)
async def get_heces_by_examen(examen_id: str, supabase=Depends(get_supabase_client)):
    """Obtener examen de heces por ID de examen"""
    try:
        response = supabase.table("examenes_heces").select("*").eq("examen_id", examen_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Examen de heces no encontrado")
        return HecesOut(**response.data[0])
    except Exception as e:
        logger.error(f"Error obteniendo examen de heces por examen_id: {e}")
        raise HTTPException(status_code=500, detail=str(e))