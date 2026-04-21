"""
Router para manejo de exámenes de laboratorio.
Flujo completo: listar pruebas, seleccionar, registrar resultados, generar reportes.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import date
from ..dependencies import get_supabase_client
from ..config import settings
from ..models.examen_models import (
    ExamenCreate,
    ExamenUpdate,
    ExamenOut,
)
import logging
import json

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
        logging.error(f"Error listando examenes: {e}")
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
        logging.error(f"Error contando examenes: {e}")
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
        logging.error(f"Error listando examenes paciente: {e}")
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
        data = examen.model_dump()
        # Convertir fecha a string ISO format para Supabase
        if isinstance(data.get('fecha'), date):
            data['fecha'] = data['fecha'].isoformat()
        resp = supabase.table("examenes").insert(data).execute()
    except Exception as e:
        logging.error(f"Error creando examen: {e}")
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
        data_to_insert = []
        for e in examenes:
            data = e.model_dump()
            # Convertir fecha a string ISO format para Supabase
            if isinstance(data.get('fecha'), date):
                data['fecha'] = data['fecha'].isoformat()
            data_to_insert.append(data)
        resp = supabase.table("examenes").insert(data_to_insert).execute()
    except Exception as e:
        logging.error(f"Error creando exámenes en lote: {e}")
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
        logging.error(f"Error actualizando examen: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al actualizar examen")
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                              detail="Examen no encontrado")
    return ExamenOut(**resp.data[0])


# ----- Nuevos endpoints para PDF -----

from ..models.examen_models import ExamenPDFCreate, ExamenPDFOut
from fastapi import UploadFile, File, Form
import uuid


@router.post("/pdf/upload", response_model=ExamenPDFOut, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    file: UploadFile = File(...),
    paciente_id: str = Form(...),
    fecha: str = Form(...),
    pruebas: str = Form(...)
):
    """Recibe PDF, lo sube a storage, guarda registro y devuelve datos completos."""
    supabase = get_supabase_client()

    # leer archivo
    content = await file.read()
    
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
    filename = f"{uuid.uuid4()}.{ext}"
    folder = f"examenes/{fecha}"
    path = f"{folder}/{filename}"

    try:
        upload_resp = supabase.storage.from_("examenes").upload(
            path=path,
            file=content,
            file_options={
                "content-type": "application/pdf",
                "x-upsert": "true"
            }
        )
        # Verificar que la respuesta sea válida
        if not upload_resp or (hasattr(upload_resp, 'status_code') and upload_resp.status_code not in (200, 201)):
            raise Exception("upload failed")
    except Exception as e:
        logging.error(f"Error subiendo PDF: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error subiendo PDF")

    # Obtener URL pública del archivo
       # Obtener URL pública del archivo
    try:
        bucket_name = "examenes"
        public_url = supabase.storage.from_(bucket_name).get_public_url(path)

        if not isinstance(public_url, str) or not public_url.startswith("https://"):
            raise Exception("URL pública generada inválida")

        logging.info(f"URL pública generada: {public_url}")

    except Exception as e:
        logging.error(f"Error generando URL pública: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error obteniendo URL del PDF"
        )

    try:
        pruebas_list = []
        if pruebas:
            pruebas_list = json.loads(pruebas)
    except Exception:
        pruebas_list = []

    record = {
        "paciente_id": paciente_id,
        "fecha": fecha,
        "url_pdf": public_url,
        "pruebas": pruebas_list
    }

    try:
        resp = supabase.table("examenes_pdf").insert(record).execute()
    except Exception as e:
        logging.error(f"Error creando registro examenes_pdf: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error guardando registro")

    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="No se creó registro")

    item = resp.data[0]
    out = ExamenPDFOut(**item)
    # anexar nombre y teléfono paciente
    try:
        paciente_resp = supabase.table("pacientes").select("nombre, apellido, telefono").eq("id", paciente_id).execute()
        if paciente_resp.data and paciente_resp.data:
            p = paciente_resp.data[0]
            out.paciente_nombre = f"{p.get('nombre','')} {p.get('apellido','')}"
            out.paciente_telefono = p.get("telefono")
    except Exception as e:
        logging.warning(f"No se pudo obtener datos paciente: {e}")

    return out

@router.get("/pdf", response_model=List[ExamenPDFOut])
async def list_pdfs(fecha: Optional[str] = Query(None, description="Filtrar por fecha (YYYY-MM-DD)")):
    """Listar registros de PDF generados. Si se especifica fecha se filtra."""
    supabase = get_supabase_client()
    try:
        query = supabase.table("examenes_pdf").select("*")
        if fecha:
            query = query.eq("fecha", fecha)
        resp = query.execute()
    except Exception as e:
        logging.error(f"Error listando PDFs: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al listar PDFs")
    
    results = []
    for x in (resp.data or []):
        try:
            out = ExamenPDFOut(**x)
            # Intentar obtener datos del paciente si está disponible paciente_id
            if x.get("paciente_id"):
                try:
                    paciente_resp = supabase.table("pacientes").select("nombre, apellido, telefono, cedula").eq("id", x.get("paciente_id")).execute()
                    if paciente_resp.data and len(paciente_resp.data) > 0:
                        p = paciente_resp.data[0]
                        out.paciente_nombre = f"{p.get('nombre','')} {p.get('apellido','')}"
                        out.paciente_telefono = p.get("telefono")
                except Exception as e:
                    logging.warning(f"No se pudo obtener datos paciente: {e}")
            results.append(out)
        except Exception as e:
            logging.warning(f"Error procesando PDF: {e}")
            continue
    
    return results


@router.get("/pdf/{pdf_id}", response_model=ExamenPDFOut)
async def get_pdf_by_id(pdf_id: int):
    """Obtener un registro PDF de examen por ID."""
    supabase = get_supabase_client()
    try:
        resp = (
            supabase.table("examenes_pdf")
            .select("*")
            .eq("id", pdf_id)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logging.error(f"Error obteniendo PDF por ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener el PDF"
        )

    if not resp.data or len(resp.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF no encontrado"
        )

    x = resp.data[0]
    out = ExamenPDFOut(**x)

    if x.get("paciente_id"):
        try:
            paciente_resp = (
                supabase.table("pacientes")
                .select("nombre, apellido, telefono, cedula")
                .eq("id", x.get("paciente_id"))
                .limit(1)
                .execute()
            )
            if paciente_resp.data and len(paciente_resp.data) > 0:
                p = paciente_resp.data[0]
                out.paciente_nombre = f"{p.get('nombre', '')} {p.get('apellido', '')}".strip()
                out.paciente_telefono = p.get("telefono")
        except Exception as e:
            logging.warning(f"No se pudo enriquecer paciente del PDF {pdf_id}: {e}")

    return out


@router.get("/pdf/paciente/{paciente_id}", response_model=List[ExamenPDFOut])
async def list_pdfs_by_paciente(paciente_id: str):
    """Listar PDFs de exámenes por paciente (todas las visitas)."""
    supabase = get_supabase_client()
    try:
        resp = (
            supabase.table("examenes_pdf")
            .select("*")
            .eq("paciente_id", paciente_id)
            .execute()
        )
    except Exception as e:
        logging.error(f"Error listando PDFs por paciente: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar PDFs del paciente"
        )

    results = []
    for x in (resp.data or []):
        try:
            out = ExamenPDFOut(**x)
            try:
                paciente_resp = (
                    supabase.table("pacientes")
                    .select("nombre, apellido, telefono, cedula")
                    .eq("id", paciente_id)
                    .execute()
                )
                if paciente_resp.data and len(paciente_resp.data) > 0:
                    p = paciente_resp.data[0]
                    out.paciente_nombre = f"{p.get('nombre','')} {p.get('apellido','')}".strip()
                    out.paciente_telefono = p.get("telefono")
            except Exception as e:
                logging.warning(f"No se pudo obtener datos paciente: {e}")

            results.append(out)
        except Exception as e:
            logging.warning(f"Error procesando PDF por paciente: {e}")
            continue

    results.sort(key=lambda item: item.fecha, reverse=True)
    return results

@router.post("/pdf", response_model=ExamenPDFOut, status_code=status.HTTP_201_CREATED)
async def create_pdf(record: ExamenPDFCreate):
    """Registrar un PDF de examen (ya subido a storage).
    El campo url_pdf debe apuntar al archivo en Supabase Storage."""
    supabase = get_supabase_client()
    try:
        data = record.model_dump()
        # Convertir fecha a string ISO format para Supabase
        if isinstance(data.get('fecha'), date):
            data['fecha'] = data['fecha'].isoformat()
        resp = supabase.table("examenes_pdf").insert(data).execute()
    except Exception as e:
        logging.error(f"Error creando registro de PDF: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="Error al guardar registro de PDF")
    if not resp.data or len(resp.data) == 0:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                              detail="No se creó el registro de PDF")
    return ExamenPDFOut(**resp.data[0])
