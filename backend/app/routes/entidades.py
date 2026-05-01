"""
Rutas para gestión de entidades.
"""

from typing import Any, Dict

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
