"""
Rutas para gesti├│n de facturaci├│n.

Proporciona endpoints para consultar datos de facturas, generar tickets y facturas.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..dependencies import get_supabase_client
from ..models.factura_models import (
    TicketCreate,
    TicketOut,
    FacturaCreate,
    FacturaOut,
    PacienteInfo,
    VisitaInfo,
    DetalleVisita,
)

router = APIRouter(prefix="/facturacion", tags=["facturacion"])


@router.get("/pacientes", response_model=List[PacienteInfo])
async def buscar_pacientes(search: str = Query(..., min_length=1)):
    """Buscar pacientes por nombre o apellido."""
    supabase = get_supabase_client()
    try:
        # Buscar en nombre o apellido
        search_lower = search.lower()
        resp = supabase.table("pacientes").select("*").execute()
        
        if not resp.data:
            return []
        
        # Filtrar por coincidencia en nombre o apellido
        resultados = [
            p for p in resp.data
            if search_lower in (p.get("nombre", "") or "").lower() or
               search_lower in (p.get("apellido", "") or "").lower()
        ]
        
        return [PacienteInfo(**p) for p in resultados]
    
    except Exception as e:
        print(f"Error buscando pacientes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al buscar pacientes"
        )


@router.get("/visitas/{paciente_id}", response_model=List[VisitaInfo])
async def obtener_visitas(paciente_id: str):
    """Obtener todas las fechas en que un paciente tiene ex├ímenes."""
    supabase = get_supabase_client()
    try:
        # Obtener todos los ex├ímenes del paciente agrupados por fecha
        resp = supabase.table("examenes").select(
            "fecha"
        ).eq("paciente_id", paciente_id).execute()
        
        if not resp.data:
            return []
        
        # Agrupar por fecha y contar
        fechas_dict: Dict[str, int] = {}
        for examen in resp.data:
            fecha = examen.get("fecha")
            if fecha:
                fechas_dict[fecha] = fechas_dict.get(fecha, 0) + 1
        
        # Convertir a lista ordenada descendente
        visitas = [
            VisitaInfo(fecha=fecha, cantidad_pruebas=cantidad)
            for fecha, cantidad in sorted(fechas_dict.items(), reverse=True)
        ]
        
        return visitas
    
    except Exception as e:
        print(f"Error obteniendo visitas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener visitas"
        )


@router.get("/visita/{paciente_id}/{fecha}", response_model=DetalleVisita)
async def obtener_detalle_visita(paciente_id: str, fecha: str):
    """Obtener todas las pruebas realizadas en una fecha espec├¡fica."""
    supabase = get_supabase_client()
    try:
        # Obtener ex├ímenes de esa fecha
        resp_examenes = supabase.table("examenes").select(
            "id, prueba_id, resultado, observaciones"
        ).eq("paciente_id", paciente_id).eq("fecha", fecha).execute()
        
        if not resp_examenes.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No hay ex├ímenes en esa fecha"
            )
        
        # Por cada examen, obtener datos de la prueba (incluido precio)
        pruebas = []
        for examen in resp_examenes.data:
            prueba_id = examen.get("prueba_id")
            resp_prueba = supabase.table("pruebas").select(
                "id, nombre_prueba, precio, unidad_medida"
            ).eq("id", prueba_id).execute()
            
            if resp_prueba.data:
                prueba = resp_prueba.data[0]
                pruebas.append({
                    "prueba_id": prueba.get("id"),
                    "nombre_prueba": prueba.get("nombre_prueba"),
                    "precio": float(prueba.get("precio", 0)),
                    "unidad_medida": prueba.get("unidad_medida"),
                    "resultado": examen.get("resultado"),
                    "observaciones": examen.get("observaciones"),
                })
        
        return DetalleVisita(
            paciente_id=paciente_id,
            fecha=fecha,
            pruebas=pruebas
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error obteniendo detalle de visita: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener detalle de visita"
        )


@router.post("/ticket", response_model=Dict[str, Any])
async def generar_ticket(ticket: TicketCreate):
    """Generar ticket de caja (sin IVA)."""
    try:
        # Validar que base_imponible sea correcto
        total_calculado = sum(d.precio * d.cantidad for d in ticket.detalles)
        
        if abs(total_calculado - ticket.total) > 0.01:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El total no coincide con la suma de pruebas"
            )
        
        # Generar ticket (respuesta, no guardar en base datos)
        ticket_response = {
            "tipo": "ticket",
            "numero_ticket": f"TKT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "fecha": ticket.fecha_examen,
            "detalles": [
                {
                    "nombre": d.nombre_prueba,
                    "precio": d.precio,
                    "cantidad": d.cantidad,
                    "subtotal": d.precio * d.cantidad
                }
                for d in ticket.detalles
            ],
            "total": round(ticket.total, 2),
            "iva": None,
            "base_imponible": round(ticket.base_imponible, 2),
        }
        
        return ticket_response
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generando ticket: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al generar ticket"
        )


@router.post("/factura", response_model=FacturaOut)
async def generar_factura(factura: FacturaCreate):
    """Generar factura con IVA e incrementar n├║mero autoincremental."""
    supabase = get_supabase_client()
    try:
        # Validar que IVA + base_imponible = total
        iva_calculado = round(factura.base_imponible * 0.19, 2)
        total_calculado = round(factura.base_imponible + iva_calculado, 2)
        
        if abs(total_calculado - factura.total) > 0.01:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El total no coincide con base + IVA"
            )
        
        # Preparar detalles en JSON
        detalles_json = [
            {
                "prueba_id": d.prueba_id,
                "nombre_prueba": d.nombre_prueba,
                "precio": d.precio,
                "cantidad": d.cantidad,
                "subtotal": d.precio * d.cantidad
            }
            for d in factura.detalles
        ]
        
        # Guardar en tabla facturas
        factura_data = {
            "numero_factura": factura.numero_factura,
            "paciente_id": factura.paciente_id,
            "fecha_examen": factura.fecha_examen,
            "base_imponible": factura.base_imponible,
            "iva": iva_calculado,
            "total": total_calculado,
            "detalles": detalles_json,
            "fecha_emision": datetime.now().isoformat(),
        }
        
        resp = supabase.table("facturas").insert(factura_data).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo crear la factura"
            )
        
        created = resp.data[0]
        return FacturaOut(
            id=created.get("id"),
            numero_factura=created.get("numero_factura"),
            paciente_id=created.get("paciente_id"),
            fecha_examen=created.get("fecha_examen"),
            detalles=[],  # Simplificado para respuesta
            base_imponible=created.get("base_imponible"),
            iva=created.get("iva"),
            total=created.get("total"),
            fechaemision=created.get("fecha_emision"),
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generando factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al generar factura"
        )


@router.get("/factura/{factura_id}", response_model=Dict[str, Any])
async def obtener_factura(factura_id: int):
    """Obtener factura generada por ID."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("facturas").select("*").eq("id", factura_id).execute()
        
        if not resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )
        
        factura = resp.data[0]
        
        # Obtener datos del paciente
        resp_paciente = supabase.table("pacientes").select("*").eq(
            "id", factura.get("paciente_id")
        ).execute()
        
        paciente = resp_paciente.data[0] if resp_paciente.data else {}
        
        return {
            "id": factura.get("id"),
            "numero_factura": factura.get("numero_factura"),
            "fecha_emision": factura.get("fecha_emision"),
            "fecha_examen": factura.get("fecha_examen"),
            "paciente": {
                "nombre": paciente.get("nombre"),
                "apellido": paciente.get("apellido"),
                "edad": paciente.get("edad"),
                "telefono": paciente.get("telefono"),
                "direccion": paciente.get("direccion"),
            },
            "detalles": factura.get("detalles", []),
            "base_imponible": factura.get("base_imponible"),
            "iva": factura.get("iva"),
            "total": factura.get("total"),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error obteniendo factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener factura"
        )
