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


@router.delete("/unidades/{unidad_id}", response_model=dict)
async def delete_unidad_medida(unidad_id: str):
    """
    Elimina una unidad de medida por ID.
    """
    supabase = get_supabase_client()

    try:
        unidad_resp = (
            supabase.table("unidades_medida")
            .select("id, nombre")
            .eq("id", unidad_id)
            .limit(1)
            .execute()
        )
        unidad = (unidad_resp.data or [None])[0]
        if not unidad:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unidad no encontrada"
            )

        delete_resp = (
            supabase.table("unidades_medida")
            .delete()
            .eq("id", unidad_id)
            .execute()
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error eliminando unidad: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar la unidad"
        )

    if not delete_resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidad no encontrada"
        )

    return {"message": "Unidad eliminada correctamente", "id": unidad_id, "nombre": unidad["nombre"]}


@router.delete("/tipos/{tipo_id}", response_model=dict)
async def delete_tipo_muestra(tipo_id: str):
    """
    Elimina un tipo de muestra por ID.
    """
    supabase = get_supabase_client()

    try:
        tipo_resp = (
            supabase.table("tipos_muestra")
            .select("id, nombre")
            .eq("id", tipo_id)
            .limit(1)
            .execute()
        )
        tipo = (tipo_resp.data or [None])[0]
        if not tipo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tipo de muestra no encontrado"
            )

        delete_resp = (
            supabase.table("tipos_muestra")
            .delete()
            .eq("id", tipo_id)
            .execute()
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error eliminando tipo de muestra: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar el tipo de muestra"
        )

    if not delete_resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de muestra no encontrado"
        )

    return {"message": "Tipo de muestra eliminado correctamente", "id": tipo_id, "nombre": tipo["nombre"]}


@router.get("/tipos-prueba", response_model=List[dict])
async def list_tipos_prueba():
    """
    Lista todos los tipos de prueba disponibles para UI.
    """
    supabase = get_supabase_client()

    try:
        resp = supabase.table("tipos_prueba").select("*").order("nombre").execute()
    except Exception as e:
        logging.error(f"Error listando tipos de prueba: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar tipos de prueba"
        )

    return resp.data or []


@router.post("/tipos-prueba", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_tipo_prueba(data: dict):
    """
    Crea un nuevo tipo de prueba para UI.
    """
    supabase = get_supabase_client()

    nombre = (data.get("nombre") or "").strip().lower()
    if not nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del tipo de prueba es obligatorio"
        )
    if nombre not in ["numerica", "serologia"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Los tipos permitidos son: numerica o serologia"
        )

    try:
        resp = supabase.table("tipos_prueba").insert({"nombre": nombre}).execute()
    except Exception as e:
        logging.error(f"Error creando tipo de prueba: {e}")
        if "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este tipo de prueba ya existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el tipo de prueba"
        )

    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se creó el tipo de prueba"
        )

    return resp.data[0]


@router.delete("/tipos-prueba/{tipo_prueba_id}", response_model=dict)
async def delete_tipo_prueba(tipo_prueba_id: str):
    """
    Elimina un tipo de prueba de catálogo por ID.
    """
    supabase = get_supabase_client()

    try:
        tipos_resp = supabase.table("tipos_prueba").select("id").execute()
        if len(tipos_resp.data or []) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe existir al menos un tipo de prueba en el catálogo"
            )

        tipo_resp = (
            supabase.table("tipos_prueba")
            .select("id, nombre")
            .eq("id", tipo_prueba_id)
            .limit(1)
            .execute()
        )
        tipo = (tipo_resp.data or [None])[0]
        if not tipo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tipo de prueba no encontrado"
            )

        delete_resp = (
            supabase.table("tipos_prueba")
            .delete()
            .eq("id", tipo_prueba_id)
            .execute()
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error eliminando tipo de prueba: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar el tipo de prueba"
        )

    if not delete_resp.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tipo de prueba no encontrado"
        )

    return {"message": "Tipo de prueba eliminado correctamente", "id": tipo_prueba_id, "nombre": tipo["nombre"]}


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


@router.delete("/areas/{area_nombre}", response_model=dict)
async def delete_area(area_nombre: str):
    """
    Elimina un área del catálogo lógico (quitándola de pruebas existentes).
    """
    supabase = get_supabase_client()
    area = (area_nombre or "").strip()
    if not area:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Área inválida"
        )

    try:
        existentes = (
            supabase.table("pruebas")
            .select("id")
            .eq("area", area)
            .execute()
        )
        if not existentes.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Área no encontrada"
            )

        updated = (
            supabase.table("pruebas")
            .update({"area": None})
            .eq("area", area)
            .execute()
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error eliminando área: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar el área"
        )

    return {
        "message": "Área eliminada correctamente",
        "area": area,
        "pruebas_actualizadas": len(updated.data or [])
    }


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
