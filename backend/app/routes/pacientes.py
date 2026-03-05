"""
Rutas para gestión de pacientes.

Proporciona CRUD básico utilizando Supabase como almacenamiento.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from ..dependencies import get_supabase_client
from ..models.paciente_models import (
    PacienteCreate,
    PacienteUpdate,
    PacienteOut,
)

router = APIRouter(prefix="/pacientes", tags=["pacientes"])


@router.post("/", response_model=PacienteOut, status_code=status.HTTP_201_CREATED)
async def create_paciente(paciente: PacienteCreate):
    """Inserta un nuevo paciente en la tabla `pacientes`."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("pacientes").insert(paciente.dict()).execute()
    except Exception as e:
        print(f"Error insertando paciente: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el paciente"
        )

    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el paciente"
        )

    created = resp.data[0]
    return PacienteOut(**created)


@router.get("/", response_model=List[PacienteOut])
async def list_pacientes(search: Optional[str] = Query(None, description="Texto para buscar por nombre, apellido o teléfono")):
    """Lista pacientes; si se pasa `search` filtra por nombre, apellido o teléfono."""
    supabase = get_supabase_client()

    try:
        if search and search.strip():
            term = f"%{search.strip()}%"
            resp = (
                supabase.table("pacientes")
                .select("*")
                .or_(
                    f"nombre.ilike.{term},apellido.ilike.{term},telefono.ilike.{term}"
                )
                .execute()
            )
        else:
            resp = supabase.table("pacientes").select("*").execute()
    except Exception as e:
        print(f"Error consultando pacientes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar pacientes"
        )

    return [PacienteOut(**p) for p in (resp.data or [])]


@router.get("/{paciente_id}", response_model=PacienteOut)
async def get_paciente(paciente_id: str):
    """Devuelve la ficha completa de un paciente por su ID."""
    supabase = get_supabase_client()
    try:
        resp = (
            supabase.table("pacientes")
            .select("*")
            .eq("id", paciente_id)
            .single()
            .execute()
        )
    except Exception as e:
        print(f"Error obteniendo paciente: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener el paciente"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    return PacienteOut(**resp.data)


@router.put("/{paciente_id}", response_model=PacienteOut)
async def update_paciente(paciente_id: str, paciente: PacienteUpdate):
    """Actualiza los datos de un paciente existente."""
    supabase = get_supabase_client()
    payload = paciente.dict(exclude_none=True)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron campos para actualizar"
        )
    try:
        resp = (
            supabase.table("pacientes")
            .update(payload)
            .eq("id", paciente_id)
            .execute()
        )
    except Exception as e:
        print(f"Error actualizando paciente: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el paciente"
        )

    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    return PacienteOut(**resp.data[0])
