"""
Rutas para gestión de entidades.
"""

from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status

from ..dependencies import get_supabase_client

router = APIRouter(prefix="/entidades", tags=["entidades"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_entidad(entidad: Dict[str, Any]):
    """Inserta una nueva entidad en la tabla `entidades`."""
    supabase = get_supabase_client()

    try:
        resp = supabase.table("entidades").insert(entidad).execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear entidad: {e}",
        )

    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear la entidad",
        )

    return resp.data[0]


@router.get("", response_model=List[Dict[str, Any]])
async def list_entidades():
    """Lista todas las entidades registradas."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("entidades").select("*").execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar entidades: {e}",
        )
    return resp.data or []


@router.get("/{entidad_id}", response_model=Dict[str, Any])
async def get_entidad(entidad_id: str):
    """Obtiene una entidad por su ID."""
    supabase = get_supabase_client()
    try:
        resp = (
            supabase.table("entidades")
            .select("*")
            .eq("id", entidad_id)
            .single()
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener entidad: {e}",
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entidad no encontrada",
        )

    return resp.data


@router.put("/{entidad_id}", response_model=Dict[str, Any])
async def update_entidad(entidad_id: str, entidad: Dict[str, Any]):
    """Actualiza una entidad por su ID."""
    supabase = get_supabase_client()
    payload = {k: v for k, v in entidad.items()}

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron campos para actualizar",
        )

    try:
        resp = (
            supabase.table("entidades")
            .update(payload)
            .eq("id", entidad_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar entidad: {e}",
        )

    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entidad no encontrada",
        )

    return resp.data[0]


@router.delete("/{entidad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entidad(entidad_id: str):
    """Elimina una entidad por su ID."""
    supabase = get_supabase_client()
    try:
        resp = (
            supabase.table("entidades")
            .delete()
            .eq("id", entidad_id)
            .execute()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar entidad: {e}",
        )

    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entidad no encontrada",
        )

    return None
