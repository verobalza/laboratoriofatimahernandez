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
from fastapi import Request

import logging

router = APIRouter(prefix="/pacientes", tags=["pacientes"])


@router.post("", response_model=PacienteOut, status_code=status.HTTP_201_CREATED)
async def create_paciente(request: Request,paciente: PacienteCreate):
    """Inserta un nuevo paciente en la tabla `pacientes`."""

    supabase = get_supabase_client()
    try:
        resp = supabase.table("pacientes").insert(paciente.dict()).execute()
    except Exception as e:
        error_str = str(e)
        logging.error(f"Error insertando paciente: {e}")
        
        # Verificar si es un error de cédula duplicada (código PostgreSQL 23505 = unique constraint violation)
        if "'code': '23505'" in error_str or ("cedula" in error_str.lower() and ("duplicate" in error_str.lower() or "already exists" in error_str.lower())):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un paciente con esta cédula. Verifica los datos e intenta nuevamente."
            )
        
        # Detectar otros errores de restricción de base de datos
        if "'code': '23505'" in error_str or "duplicate" in error_str.lower():
            field_name = "Este dato"
            if "cedula" in error_str.lower():
                field_name = "La cédula"
            elif "telefono" in error_str.lower():
                field_name = "El teléfono"
            elif "email" in error_str.lower():
                field_name = "El email"
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field_name} ya está registrado en el sistema."
            )
        
        # Errores de validación de datos (código 23502 = NOT NULL violation, 23514 = CHECK violation, etc)
        if "'code': '23502'" in error_str or "not null" in error_str.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faltan datos requeridos. Verifica que todos los campos obligatorios estén completos."
            )
        
        # Error genérico de base de datos
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el paciente. Verifica que todos los datos sean válidos."
        )

    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el paciente"
        )

    created = resp.data[0]
    return PacienteOut(**created)


@router.get("", response_model=List[PacienteOut])
async def list_pacientes(search: Optional[str] = Query(None, description="Texto para buscar por nombre, apellido, cédula o teléfono")):
    """
    Lista pacientes; si se pasa `search` filtra por nombre, apellido, cédula o teléfono.
    """
    supabase = get_supabase_client()

    try:
        if search and search.strip():
            term = f"%{search.strip()}%"
            resp = (
                supabase.table("pacientes")
                .select("*")
                .or_(
                    f"nombre.ilike.{term},apellido.ilike.{term},cedula.ilike.{term},telefono.ilike.{term}"
                )
                .execute()
            )
        else:
            resp = supabase.table("pacientes").select("*").execute()
    except Exception as e:
        logging.error(f"Error consultando pacientes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar pacientes"
        )

    return [PacienteOut(**p) for p in (resp.data or [])]


@router.get("{paciente_id}", response_model=PacienteOut)
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
        logging.error(f"Error obteniendo paciente: {e}")
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
    """
    Actualiza los datos de un paciente existente.
    """
    supabase = get_supabase_client()
    payload = paciente.dict(exclude_unset=True)

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
        logging.error(f"Error actualizando paciente: {e}")
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


@router.delete("/{paciente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_paciente(paciente_id: str):
    """Elimina un paciente por su ID."""
    supabase = get_supabase_client()
    try:
        resp = (
            supabase.table("pacientes")
            .delete()
            .eq("id", paciente_id)
            .execute()
        )
    except Exception as e:
        logging.error(f"Error eliminando paciente: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar el paciente"
        )

    # resp.data será [] si no existía.
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    return None
