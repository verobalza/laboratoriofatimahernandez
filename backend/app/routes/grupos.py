"""
Router para manejo de grupos de pruebas.
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from ..dependencies import get_supabase_client
from ..models.prueba_models import (
    GrupoPruebaCreate,
    GrupoPruebaOut,
    PruebaOut,
)
import logging

router = APIRouter(prefix="/grupos", tags=["grupos"])


@router.post("", response_model=GrupoPruebaOut, status_code=status.HTTP_201_CREATED)
async def create_grupo(grupo: GrupoPruebaCreate):
    """
    Crea un nuevo grupo de pruebas.
    """
    supabase = get_supabase_client()

    try:
        payload = grupo.dict()
        resp = supabase.table("grupos").insert(payload).execute()
    except Exception as e:
        logging.error(f"Error creando grupo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el grupo"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se creó el grupo"
        )

    return GrupoPruebaOut(**resp.data[0])


@router.get("", response_model=List[GrupoPruebaOut])
async def list_grupos():
    """
    Lista todos los grupos de pruebas.
    """
    supabase = get_supabase_client()

    try:
        resp = supabase.table("grupos").select("*").order("nombre").execute()
    except Exception as e:
        logging.error(f"Error listando grupos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar grupos"
        )

    return [GrupoPruebaOut(**g) for g in (resp.data or [])]


@router.get("{grupo_id}", response_model=GrupoPruebaOut)
async def get_grupo(grupo_id: str):
    """
    Obtiene un grupo por su ID.
    """
    supabase = get_supabase_client()

    try:
        resp = (
            supabase.table("grupos")
            .select("*")
            .eq("id", grupo_id)
            .single()
            .execute()
        )
    except Exception as e:
        logging.error(f"Error obteniendo grupo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener grupo"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo no encontrado"
        )

    return GrupoPruebaOut(**resp.data)


@router.get("{grupo_id}/pruebas", response_model=List[PruebaOut])
async def get_pruebas_by_grupo(grupo_id: str):
    """
    Obtiene todas las pruebas de un grupo específico.
    """
    supabase = get_supabase_client()

    try:
        resp = (
            supabase.table("pruebas")
            .select("*")
            .eq("grupo_id", grupo_id)
            .order("nombre_prueba")
            .execute()
        )
    except Exception as e:
        logging.error(f"Error obteniendo pruebas del grupo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener pruebas del grupo"
        )

    return [PruebaOut(**p) for p in (resp.data or [])]


@router.put("/{grupo_id}", response_model=GrupoPruebaOut)
async def update_grupo(grupo_id: str, grupo: GrupoPruebaCreate):
    """
    Actualiza un grupo de pruebas.
    """
    supabase = get_supabase_client()

    try:
        payload = grupo.dict(exclude_unset=True)
        resp = (
            supabase.table("grupos")
            .update(payload)
            .eq("id", grupo_id)
            .execute()
        )
    except Exception as e:
        logging.error(f"Error actualizando grupo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar grupo"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grupo no encontrado"
        )

    return GrupoPruebaOut(**resp.data[0])


@router.delete("/{grupo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grupo(grupo_id: str):
    """
    Elimina un grupo de pruebas.
    Nota: Las pruebas asociadas no serán eliminadas, solo se descsociará su grupo_id.
    """
    supabase = get_supabase_client()

    try:
        # Primero desasociar todas las pruebas del grupo
        supabase.table("pruebas").update({"grupo_id": None}).eq("grupo_id", grupo_id).execute()

        # Luego eliminar el grupo
        resp = supabase.table("grupos").delete().eq("id", grupo_id).execute()
    except Exception as e:
        logging.error(f"Error eliminando grupo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar grupo"
        )

    return
