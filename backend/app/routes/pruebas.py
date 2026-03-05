"""
Router para manejo de pruebas.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from ..dependencies import get_supabase_client
from ..models.prueba_models import (
    PruebaCreate,
    PruebaUpdate,
    PruebaOut,
)

router = APIRouter(prefix="/pruebas", tags=["pruebas"])


@router.post("/", response_model=PruebaOut, status_code=status.HTTP_201_CREATED)
async def create_prueba(prueba: PruebaCreate):
    supabase = get_supabase_client()
    try:
        resp = supabase.table("pruebas").insert(prueba.dict()).execute()
    except Exception as e:
        print(f"Error creando prueba: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la prueba"
        )
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="No se creó la prueba")
    return PruebaOut(**resp.data[0])


@router.get("/", response_model=List[PruebaOut])
async def list_pruebas(search: Optional[str] = Query(None, description="Texto para buscar por nombre")):
    supabase = get_supabase_client()
    try:
        if search and search.strip():
            term = f"%{search.strip()}%"
            resp = (
                supabase.table("pruebas")
                .select("*")
                .ilike("nombre_prueba", term)
                .execute()
            )
        else:
            resp = supabase.table("pruebas").select("*").execute()
    except Exception as e:
        print(f"Error listando pruebas: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al listar pruebas")
    return [PruebaOut(**p) for p in (resp.data or [])]


@router.get("/{prueba_id}", response_model=PruebaOut)
async def get_prueba(prueba_id: str):
    supabase = get_supabase_client()
    try:
        resp = (
            supabase.table("pruebas")
            .select("*")
            .eq("id", prueba_id)
            .single()
            .execute()
        )
    except Exception as e:
        print(f"Error obteniendo prueba: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al obtener prueba")
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                              detail="Prueba no encontrada")
    return PruebaOut(**resp.data)


@router.put("/{prueba_id}", response_model=PruebaOut)
async def update_prueba(prueba_id: str, prueba: PruebaUpdate):
    supabase = get_supabase_client()
    payload = prueba.dict(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                              detail="No se proporcionaron campos a actualizar")
    try:
        resp = (
            supabase.table("pruebas")
            .update(payload)
            .eq("id", prueba_id)
            .execute()
        )
    except Exception as e:
        print(f"Error actualizando prueba: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al actualizar prueba")
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                              detail="Prueba no encontrada")
    return PruebaOut(**resp.data[0])


@router.get("/count/total", response_model=dict)
async def count_pruebas():
    """Obtener cantidad total de pruebas registradas."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("pruebas").select("id", count="exact").execute()
        count = len(resp.data) if resp.data else 0
        return {"count": count}
    except Exception as e:
        print(f"Error contando pruebas: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al contar pruebas")
