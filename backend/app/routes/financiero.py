"""
Rutas para gestión de finanzas y movimientos financieros.
"""

from fastapi import APIRouter, Depends, HTTPException, Query

from datetime import datetime, timedelta

from ..dependencies import get_supabase_client
from ..models.financiero_models import (
    TasaCambioOut, TasaCambioCreate,
    MovimientoFinancieroOut, MovimientoFinancieroCreate,
    ResumenFinanciero, TotalesPorTipo
)
import json
import os

router = APIRouter(
    prefix="/api/financiero",
    tags=["Financiero"]
)

# ============ ARCHIVO DE CONFIGURACIÓN PARA TASA ============
# En producción, usar una base de datos real
TASA_FILE = "tasa_cambio.json"


def get_tasa_actual() -> float:
    """Obtiene la tasa de cambio actual"""
    try:
        if os.path.exists(TASA_FILE):
            with open(TASA_FILE, 'r') as f:
                data = json.load(f)
                return data.get("tasa", 45.0)
    except:
        pass
    return 45.0  # Tasa por defecto: 1 USD = 45 Bs


def guardar_tasa(tasa: float):
    """Guarda la tasa de cambio"""
    data = {
        "tasa": round(tasa, 4),
        "actualizado_en": datetime.now().isoformat()
    }
    with open(TASA_FILE, 'w') as f:
        json.dump(data, f)


def recalcular_precios_usd(tasa: float):
    """Recalcula precio_usd de todas las pruebas según la nueva tasa"""
    try:
        supabase = get_supabase_client()
        resp = supabase.table("pruebas").select("id, precio_bs").execute()
        pruebas = resp.data or []
        for prueba in pruebas:
            if prueba.get("precio_bs") is None:
                continue
            precio_bs = float(prueba["precio_bs"])
            precio_usd = round(precio_bs / tasa, 2) if tasa else 0.0
            supabase.table("pruebas").update({"precio_usd": precio_usd}).eq("id", prueba["id"]).execute()
    except Exception:
        # No queremos bloquear la actualización de la tasa si la recalculación falla,
        # pero sí debugearemos en el backend si es necesario.
        pass


def obtener_movimientos() -> list:
    """Obtiene los movimientos registrados"""
    try:
        if os.path.exists("movimientos_financieros.json"):
            with open("movimientos_financieros.json", 'r') as f:
                return json.load(f)
    except:
        pass
    return []


def guardar_movimientos(movimientos: list):
    """Guarda los movimientos"""
    with open("movimientos_financieros.json", 'w') as f:
        json.dump(movimientos, f)


# ============ ENDPOINTS TASA DE CAMBIO ============

@router.get("/tasa", response_model=TasaCambioOut)
async def obtener_tasa():
    """Obtiene la tasa de cambio actual"""
    tasa = get_tasa_actual()
    return TasaCambioOut(
        id="tasa-actual",
        tasa=tasa,
        actualizado_en=datetime.now().isoformat()
    )


@router.post("/tasa", response_model=TasaCambioOut)
async def actualizar_tasa(data: TasaCambioCreate):
    """Actualiza la tasa de cambio"""
    try:
        guardar_tasa(data.tasa)
        recalcular_precios_usd(data.tasa)
        return TasaCambioOut(
            id="tasa-actual",
            tasa=data.tasa,
            actualizado_en=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============ ENDPOINTS MOVIMIENTOS FINANCIEROS ============

@router.post("/movimiento", response_model=MovimientoFinancieroOut)
async def registrar_movimiento(datos: MovimientoFinancieroCreate):
    """Registra un movimiento financiero (ticket o factura)"""
    try:
        movimientos = obtener_movimientos()
        
        nuevo_movimiento = {
            "id": f"mov-{datetime.now().timestamp()}",
            "paciente_id": datos.paciente_id,
            "monto_bs": datos.monto_bs,
            "monto_usd": datos.monto_usd,
            "tipo": datos.tipo,
            "fecha": datos.fecha.isoformat() if datos.fecha else datetime.now().isoformat(),
            "creado_en": datetime.now().isoformat()
        }
        
        movimientos.append(nuevo_movimiento)
        guardar_movimientos(movimientos)
        
        return MovimientoFinancieroOut(**nuevo_movimiento)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/movimientos", response_model=list[MovimientoFinancieroOut])
async def obtener_movimientos_list():
    """Obtiene todos los movimientos financieros"""
    movimientos = obtener_movimientos()
    return [MovimientoFinancieroOut(**m) for m in movimientos]


@router.get("/movimientos/filtro")
async def obtener_movimientos_filtro(
    tipo: str = Query(None),
    fecha_desde: str = Query(None),
    fecha_hasta: str = Query(None)
):
    """Obtiene movimientos filtrados por tipo y fecha"""
    movimientos = obtener_movimientos()
    
    if tipo:
        movimientos = [m for m in movimientos if m["tipo"] == tipo]
    
    if fecha_desde and fecha_hasta:
        desde = datetime.fromisoformat(fecha_desde)
        hasta = datetime.fromisoformat(fecha_hasta)
        movimientos = [
            m for m in movimientos
            if desde <= datetime.fromisoformat(m["fecha"]) <= hasta
        ]
    
    return movimientos


# ============ ENDPOINTS RESUMEN FINANCIERO ============

@router.get("/resumen", response_model=ResumenFinanciero)
async def obtener_resumen_financiero():
    """Obtiene el resumen financiero (totales por período)"""
    movimientos = obtener_movimientos()
    tasa = get_tasa_actual()
    ahora = datetime.now()
    
    # Calcular períodos
    inicio_semana = ahora - timedelta(days=ahora.weekday())
    inicio_mes = ahora.replace(day=1)
    inicio_año = ahora.replace(month=1, day=1)
    
    # Inicializar totales
    totales = {
        'diario': {'bs': 0, 'usd': 0},
        'semanal': {'bs': 0, 'usd': 0},
        'mensual': {'bs': 0, 'usd': 0},
        'anual': {'bs': 0, 'usd': 0}
    }
    
    # Procesar movimientos
    for mov in movimientos:
        fecha_mov = datetime.fromisoformat(mov["fecha"])
        monto_bs = mov["monto_bs"]
        monto_usd = mov["monto_usd"]
        
        # Diario
        if fecha_mov.date() == ahora.date():
            totales['diario']['bs'] += monto_bs
            totales['diario']['usd'] += monto_usd
        
        # Semanal
        if fecha_mov >= inicio_semana:
            totales['semanal']['bs'] += monto_bs
            totales['semanal']['usd'] += monto_usd
        
        # Mensual
        if fecha_mov >= inicio_mes:
            totales['mensual']['bs'] += monto_bs
            totales['mensual']['usd'] += monto_usd
        
        # Anual
        if fecha_mov >= inicio_año:
            totales['anual']['bs'] += monto_bs
            totales['anual']['usd'] += monto_usd
    
    return ResumenFinanciero(
        total_diario_bs=round(totales['diario']['bs'], 2),
        total_diario_usd=round(totales['diario']['usd'], 2),
        total_semanal_bs=round(totales['semanal']['bs'], 2),
        total_semanal_usd=round(totales['semanal']['usd'], 2),
        total_mensual_bs=round(totales['mensual']['bs'], 2),
        total_mensual_usd=round(totales['mensual']['usd'], 2),
        total_anual_bs=round(totales['anual']['bs'], 2),
        total_anual_usd=round(totales['anual']['usd'], 2),
        tasa_actual=tasa
    )


@router.get("/resumen/tipos", response_model=TotalesPorTipo)
async def obtener_resumen_por_tipo():
    """Obtiene totales separados por tipo (ticket/factura)"""
    movimientos = obtener_movimientos()
    
    totales = {
        'tickets': {'bs': 0, 'usd': 0},
        'facturas': {'bs': 0, 'usd': 0}
    }
    
    for mov in movimientos:
        tipo = mov["tipo"].lower()
        monto_bs = mov["monto_bs"]
        monto_usd = mov["monto_usd"]
        
        if tipo == "ticket":
            totales['tickets']['bs'] += monto_bs
            totales['tickets']['usd'] += monto_usd
        elif tipo == "factura":
            totales['facturas']['bs'] += monto_bs
            totales['facturas']['usd'] += monto_usd
    
    return TotalesPorTipo(
        tickets_bs=round(totales['tickets']['bs'], 2),
        tickets_usd=round(totales['tickets']['usd'], 2),
        facturas_bs=round(totales['facturas']['bs'], 2),
        facturas_usd=round(totales['facturas']['usd'], 2)
    )
