"""
Router para manejo de exámenes de laboratorio.
Flujo completo: listar pruebas, seleccionar, registrar resultados, generar reportes.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import date
from ..dependencies import get_supabase_client
from ..models.examen_models import (
    ExamenCreate,
    ExamenUpdate,
    ExamenOut,
)

router = APIRouter(prefix="/examenes", tags=["examenes"])


@router.get("/", response_model=List[ExamenOut])
async def list_examenes(fecha: Optional[str] = Query(None, description="Filtrar por fecha (YYYY-MM-DD)")):
    """
    Listar todos los exámenes. 
    Si se proporciona fecha, filtra por esa fecha específica.
    """
    supabase = get_supabase_client()
    try:
        query = supabase.table("examenes").select("*")
        if fecha:
            query = query.eq("fecha", fecha)
        resp = query.execute()
    except Exception as e:
        print(f"Error listando examenes: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al listar exámenes")
    return [ExamenOut(**x) for x in (resp.data or [])]


@router.get("/count", response_model=dict)
async def count_examenes(fecha: Optional[str] = Query(None, description="Fecha (YYYY-MM-DD)")):
    """
    Retorna la cantidad de exámenes en una fecha específica.
    """
    supabase = get_supabase_client()
    try:
        query = supabase.table("examenes").select("id", count="exact")
        if fecha:
            query = query.eq("fecha", fecha)
        resp = query.execute()
        count = resp.count or 0
    except Exception as e:
        print(f"Error contando examenes: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al contar exámenes")
    return {"count": count}


@router.get("/paciente/{paciente_id}", response_model=List[ExamenOut])
async def list_examenes_paciente(
    paciente_id: str,
    fecha: Optional[str] = Query(None, description="Fecha opcional (YYYY-MM-DD)")
):
    """
    Obtener todos los exámenes de un paciente.
    Si se proporciona fecha, filtra por esa fecha.
    """
    supabase = get_supabase_client()
    try:
        query = supabase.table("examenes").select("*").eq("paciente_id", paciente_id)
        if fecha:
            query = query.eq("fecha", fecha)
        resp = query.execute()
    except Exception as e:
        print(f"Error listando examenes paciente: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al listar exámenes del paciente")
    return [ExamenOut(**x) for x in (resp.data or [])]


@router.post("/", response_model=ExamenOut, status_code=status.HTTP_201_CREATED)
async def create_examen(examen: ExamenCreate):
    """
    Registrar un examen individual.
    """
    supabase = get_supabase_client()
    try:
        resp = supabase.table("examenes").insert(examen.dict()).execute()
    except Exception as e:
        print(f"Error creando examen: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al crear examen")
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="No se creó el examen")
    return ExamenOut(**resp.data[0])


@router.post("/batch", response_model=List[ExamenOut], status_code=status.HTTP_201_CREATED)
async def create_examenes_batch(examenes: List[ExamenCreate]):
    """
    Registrar múltiples exámenes a la vez.
    Útil para cuando se registran varias pruebas de un paciente en una sesión.
    """
    supabase = get_supabase_client()
    if not examenes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                              detail="Se requiere al menos un examen")
    try:
        data_to_insert = [e.dict() for e in examenes]
        resp = supabase.table("examenes").insert(data_to_insert).execute()
    except Exception as e:
        print(f"Error creando exámenes en lote: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al crear exámenes")
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="No se crearon los exámenes")
    return [ExamenOut(**x) for x in resp.data]


@router.put("/{examen_id}", response_model=ExamenOut)
async def update_examen(examen_id: str, examen: ExamenUpdate):
    """
    Actualizar un examen existente (resultado u observaciones).
    """
    supabase = get_supabase_client()
    payload = examen.dict(exclude_none=True)
    if not payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                              detail="No se proporcionaron campos a actualizar")
    try:
        resp = (
            supabase.table("examenes")
            .update(payload)
            .eq("id", examen_id)
            .execute()
        )
    except Exception as e:
        print(f"Error actualizando examen: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al actualizar examen")
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                              detail="Examen no encontrado")
    return ExamenOut(**resp.data[0])
