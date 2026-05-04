"""
Router para manejo de pruebas.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional, Dict
from ..dependencies import get_supabase_client
from ..models.prueba_models import (
    PruebaCreate,
    PruebaUpdate,
    PruebaOut,
)
from ..routes.financiero import get_tasa_actual
import logging

router = APIRouter(prefix="/pruebas", tags=["pruebas"])

HEMATOLOGIA_SERIE_NOMBRES = {
    'roja': 'Serie Roja',
    'blanca': 'Serie Blanca',
    'plaquetaria': 'Serie Plaquetaria',
}


def get_serie_group_name(serie: str) -> str:
    return HEMATOLOGIA_SERIE_NOMBRES.get(serie.strip().lower(), '')


async def get_or_create_serie_group_id(supabase, serie: str) -> str:
    serie_normalizada = serie.strip().lower()
    nombre_serie = get_serie_group_name(serie_normalizada)
    if not nombre_serie:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La serie hematológica debe ser 'roja', 'blanca' o 'plaquetaria'"
        )

    try:
        resp = (
            supabase.table('grupos')
            .select('*')
            .ilike('nombre', nombre_serie)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logging.error(f"Error buscando grupo de serie hematológica: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al identificar el grupo de hematología"
        )

    grupo = (resp.data or [None])[0]
    if grupo:
        return grupo['id']

    try:
        nuevo_resp = supabase.table('grupos').insert({
            'nombre': nombre_serie,
            'descripcion': 'Grupo interno para pruebas de hematología',
            'activo': True
        }).execute()
    except Exception as e:
        logging.error(f"Error creando grupo de serie hematológica: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el grupo de hematología"
        )

    if not nuevo_resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el grupo de hematología"
        )

    return nuevo_resp.data[0]['id']


def get_serie_from_group_name(nombre_grupo: Optional[str]) -> Optional[str]:
    if not nombre_grupo:
        return None
    valor = nombre_grupo.strip().lower()
    if valor == 'serie roja':
        return 'roja'
    if valor == 'serie blanca':
        return 'blanca'
    if valor == 'serie plaquetaria':
        return 'plaquetaria'
    return None


def annotate_pruebas_with_serie(pruebas: List[Dict], grupos_map: Dict[str, str]) -> List[Dict]:
    for prueba in pruebas:
        serie = None
        grupo_id = prueba.get('grupo_id')
        if grupo_id and grupos_map.get(grupo_id):
            serie = get_serie_from_group_name(grupos_map[grupo_id])
        prueba['serie'] = serie
    return pruebas


@router.post("", response_model=PruebaOut, status_code=status.HTTP_201_CREATED)
async def create_prueba(prueba: PruebaCreate):
    """
    Crea una nueva prueba de laboratorio.
    """
    supabase = get_supabase_client()

    try:
        payload = prueba.dict(exclude={"serie"})

        if prueba.serie:
            payload["grupo_id"] = await get_or_create_serie_group_id(supabase, prueba.serie)
            payload["area"] = "Hematología"

        tasa = get_tasa_actual()
        payload["precio_usd"] = round(payload["precio_bs"] / tasa, 2) if payload.get("precio_bs") is not None else None

        resp = supabase.table("pruebas").insert(payload).execute()
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creando prueba: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la prueba"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se creó la prueba"
        )

    created = resp.data[0]
    return PruebaOut(**created)

@router.get("", response_model=List[PruebaOut])
async def list_pruebas(search: Optional[str] = Query(None, description="Texto para buscar por nombre")):
    """
    Lista pruebas; si se pasa `search` filtra por nombre.
    """
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
        logging.error(f"Error listando pruebas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar pruebas"
        )

    pruebas = resp.data or []
    grupo_ids = list({p.get('grupo_id') for p in pruebas if p.get('grupo_id')})
    grupos_map = {}

    if grupo_ids:
        try:
            grupos_resp = (
                supabase.table('grupos')
                .select('id, nombre')
                .in_('id', grupo_ids)
                .execute()
            )
            grupos_map = {g['id']: g['nombre'] for g in (grupos_resp.data or [])}
        except Exception as e:
            logging.error(f"Error obteniendo grupos para series: {e}")
            grupos_map = {}

    pruebas_annotated = annotate_pruebas_with_serie(pruebas, grupos_map)
    return [PruebaOut(**p) for p in pruebas_annotated]


@router.get("/count/total", response_model=dict)
async def count_pruebas():
    """
    Obtener cantidad total de pruebas registradas.
    """
    supabase = get_supabase_client()

    try:
        resp = supabase.table("pruebas").select("id", count="exact").execute()
        count = len(resp.data) if resp.data else 0
        return {"count": count}
    except Exception as e:
        logging.error(f"Error contando pruebas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al contar pruebas"
        )


@router.post("/unidades", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_unidad_medida(data: dict):
    """
    Crea una nueva unidad de medida.
    """
    supabase = get_supabase_client()
    
    nombre = data.get("nombre", "").strip()
    if not nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la unidad es obligatorio"
        )
    
    try:
        resp = supabase.table("unidades_medida").insert({"nombre": nombre}).execute()
    except Exception as e:
        logging.error(f"Error creando unidad: {e}")
        if "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esta unidad ya existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la unidad"
        )
    
    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se creó la unidad"
        )
    
    return resp.data[0]


@router.get("/unidades", response_model=List[dict])
async def list_unidades_medida():
    """
    Lista todas las unidades de medida.
    """
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("unidades_medida").select("*").order("nombre").execute()
    except Exception as e:
        logging.error(f"Error listando unidades: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar unidades"
        )
    
    return resp.data or []


@router.post("/tipos", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_tipo_muestra(data: dict):
    """
    Crea un nuevo tipo de muestra.
    """
    supabase = get_supabase_client()
    
    nombre = data.get("nombre", "").strip()
    if not nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del tipo es obligatorio"
        )
    
    try:
        resp = supabase.table("tipos_muestra").insert({"nombre": nombre}).execute()
    except Exception as e:
        logging.error(f"Error creando tipo: {e}")
        if "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este tipo ya existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el tipo"
        )
    
    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se creó el tipo"
        )
    
    return resp.data[0]


@router.get("/tipos", response_model=List[dict])
async def list_tipos_muestra():
    """
    Lista todos los tipos de muestra.
    """
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("tipos_muestra").select("*").order("nombre").execute()
    except Exception as e:
        logging.error(f"Error listando tipos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar tipos"
        )
    
    return resp.data or []


@router.get("/areas", response_model=List[str])
async def list_areas():
    """
    Lista áreas únicas tomadas desde la columna `area` de `pruebas`.
    """
    supabase = get_supabase_client()

    try:
        resp = supabase.table("pruebas").select("area").execute()
    except Exception as e:
        logging.error(f"Error listando áreas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar áreas"
        )

    areas = sorted(
        {
            (item.get("area") or "").strip()
            for item in (resp.data or [])
            if item.get("area") is not None and str(item.get("area")).strip()
        }
    )
    return areas


@router.post("/areas", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_area(data: dict):
    """
    Recibe una nueva área y la devuelve sin persistir en base de datos.
    """
    area = (data.get("area") or "").strip()
    if not area:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del área es obligatorio"
        )
    return {"area": area}


@router.get("/{prueba_id}", response_model=PruebaOut)
async def get_prueba(prueba_id: str):
    """
    Obtiene una prueba por su ID.
    """
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
        logging.error(f"Error obteniendo prueba: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener prueba"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prueba no encontrada"
        )

    return PruebaOut(**resp.data)


@router.put("/{prueba_id}", response_model=PruebaOut)
async def update_prueba(prueba_id: str, prueba: PruebaUpdate):
    """
    Actualiza una prueba existente.
    """
    supabase = get_supabase_client()

    payload = prueba.dict(exclude_unset=True, exclude={"serie"})

    if prueba.serie is not None:
        if prueba.serie == '':
            payload["grupo_id"] = None
        else:
            payload["grupo_id"] = await get_or_create_serie_group_id(supabase, prueba.serie)
            payload["area"] = "Hematología"

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se proporcionaron campos a actualizar"
        )

    try:
        if payload.get("precio_bs") is not None:
            tasa = get_tasa_actual()
            payload["precio_usd"] = round(payload["precio_bs"] / tasa, 2)

        resp = (
            supabase.table("pruebas")
            .update(payload)
            .eq("id", prueba_id)
            .execute()
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error actualizando prueba: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar prueba"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prueba no encontrada"
        )

    return PruebaOut(**resp.data[0])


@router.delete("/{prueba_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prueba(prueba_id: str):
    """
    Elimina una prueba por su ID.
    """
    supabase = get_supabase_client()

    try:
        resp = (
            supabase.table("pruebas")
            .delete()
            .eq("id", prueba_id)
            .execute()
        )
    except Exception as e:
        logging.error(f"Error eliminando prueba: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar prueba"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prueba no encontrada"
        )

    return
