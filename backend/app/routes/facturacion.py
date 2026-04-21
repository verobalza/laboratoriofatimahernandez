"""
Rutas para gestión de facturación.

Proporciona endpoints para consultar datos de facturas, generar tickets y facturas.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid
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
import logging
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from io import BytesIO
from pathlib import Path
import requests

router = APIRouter(prefix="/facturacion", tags=["facturacion"])


@router.get("/pacientes", response_model=List[PacienteInfo])
async def buscar_pacientes(search: str = Query(..., min_length=1)):
    """Buscar pacientes por nombre o apellido."""
    supabase = get_supabase_client()
    try:
        # Buscar en nombre o apellido usando ilike
        resp = supabase.table("pacientes").select("*").or_(
            f"nombre.ilike.%{search}%,apellido.ilike.%{search}%"
        ).execute()
        
        return [PacienteInfo(**p) for p in (resp.data or [])]
    
    except Exception as e:
        logging.error(f"Error buscando pacientes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al buscar pacientes"
        )


@router.get("/visitas/{paciente_id}", response_model=List[VisitaInfo])
async def obtener_visitas(paciente_id: str):
    """Obtener todas las fechas en que un paciente tiene exámenes."""
    supabase = get_supabase_client()
    try:
        fechas_dict: Dict[str, int] = {}

        # Obtener fechas desde la tabla de exámenes
        resp = supabase.table("examenes").select(
            "fecha"
        ).eq("paciente_id", paciente_id).execute()

        for examen in resp.data or []:
            fecha = examen.get("fecha")
            if fecha:
                fecha_iso = fecha if isinstance(fecha, str) else (fecha.isoformat() if hasattr(fecha, "isoformat") else str(fecha))
                fechas_dict[fecha_iso] = fechas_dict.get(fecha_iso, 0) + 1

        # También incluir fechas de registros de examenes_pdf si existen pero no hay exámenes normales
        resp_pdf = supabase.table("examenes_pdf").select("fecha").eq("paciente_id", paciente_id).execute()
        for examen in resp_pdf.data or []:
            fecha = examen.get("fecha")
            if fecha:
                fecha_iso = fecha if isinstance(fecha, str) else (fecha.isoformat() if hasattr(fecha, "isoformat") else str(fecha))
                fechas_dict[fecha_iso] = fechas_dict.get(fecha_iso, 0) + 1

        if not fechas_dict:
            return []

        visitas = [
            VisitaInfo(fecha=fecha, cantidad_pruebas=cantidad)
            for fecha, cantidad in sorted(fechas_dict.items(), reverse=True)
        ]

        return visitas
    except Exception as e:
        logging.error(f"Error obteniendo visitas: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener visitas"
        )


def _escape_pdf_text(text: str) -> str:
    safe_text = str(text or "")
    safe_text = safe_text.replace("\\", "\\\\")
    safe_text = safe_text.replace("(", "\\(")
    safe_text = safe_text.replace(")", "\\)")
    return safe_text


def _build_pdf_bytes(lines: List[str]) -> bytes:
    stream_lines = ["BT", "/F1 12 Tf", "50 760 Td"]
    for line in lines:
        stream_lines.append(f"({_escape_pdf_text(line)}) Tj")
        stream_lines.append("0 -14 Td")
    stream_lines.append("ET")
    stream = "\n".join(stream_lines).encode("latin1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length %d >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    ]

    body = b""
    positions = []
    offset = len(b"%PDF-1.4\n")
    for index, obj in enumerate(objects, start=1):
        positions.append(offset)
        encoded = f"{index} 0 obj\n".encode("latin1") + obj + b"\nendobj\n"
        body += encoded
        offset += len(encoded)

    xref = b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    for pos in positions:
        xref += f"{pos:010d} 00000 n \n".encode("latin1")

    trailer = (
        b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n" % (len(objects) + 1)
        + str(offset).encode("latin1")
        + b"\n%%EOF\n"
    )

    return b"%PDF-1.4\n" + body + xref + trailer


def _load_membrete_image(membrete_url: str):
    """Intenta cargar el membrete desde archivo local primero, luego desde URL."""
    candidate_paths = [
        Path(__file__).resolve().parent.parent / 'static' / 'membrete.png',
        Path(__file__).resolve().parent.parent / 'static' / 'Membrete Empresa Geométrico Azul.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'assets' / 'Membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'assets' / 'membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'src' / 'assets' / 'Membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'src' / 'assets' / 'membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'Membrete Empresa Geométrico Azul.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'Membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'membrete.jpg',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'Membrete.jpeg',
    ]
    for path in candidate_paths:
        logging.info(f"Verificando path: {path}")
        if path.exists():
            logging.info(f"Path existe: {path}")
            try:
                return ImageReader(str(path))
            except Exception as e:
                logging.warning(f"Error cargando imagen desde {path}: {e}")
                continue
        else:
            logging.info(f"Path no existe: {path}")

    # Si no se encuentra localmente, intentar desde URL
    try:
        logging.info(f"Intentando cargar desde URL: {membrete_url}")
        response = requests.get(membrete_url, timeout=5)
        response.raise_for_status()
        return ImageReader(BytesIO(response.content))
    except Exception as e:
        logging.warning(f"Error cargando imagen desde URL {membrete_url}: {e}")
        pass

    return None


def _build_pdf_factura(factura: Dict[str, Any], paciente: Dict[str, Any], detalles: List[Dict[str, Any]], membrete_url: str) -> bytes:
    """Genera PDF de factura con membrete."""
    from reportlab.platypus import Image

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()
    story = []

    blue_dark = colors.HexColor('#1B3E73')
    blue_light = colors.HexColor('#E5EFF9')
    blue_border = colors.HexColor('#7FA8D1')
    gray_background = colors.HexColor('#F6F8FC')

    normal = ParagraphStyle(
        'normal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.black,
    )
    label_style = ParagraphStyle(
        'label',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=blue_dark,
    )
    header_style = ParagraphStyle(
        'header',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=blue_dark,
        spaceAfter=10,
    )
    total_label = ParagraphStyle(
        'total_label',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=blue_dark,
    )
    total_value = ParagraphStyle(
        'total_value',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=blue_dark,
        alignment=2,
    )

    def fetch_membrete(url: str):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return ImageReader(BytesIO(response.content))
        except Exception as e:
            logging.warning(f"No se pudo cargar el membrete desde URL {url}: {e}")
            return None

    # Cargar membrete desde archivo local o URL
    img_reader = _load_membrete_image(membrete_url)
    if img_reader:
        try:
            # Especificar dimensiones exactas: 532pt ancho x 200pt alto
            # Esto mantiene consistencia visual similar a examenes
            header_image = Image(img_reader, width=532, height=200)
            header_image.hAlign = 'LEFT'
            story.append(header_image)
            story.append(Spacer(1, 12))
        except Exception as e:
            logging.warning(f"Error creando imagen del membrete en factura: {e}")
            story.append(Spacer(1, 20))
    else:
        story.append(Spacer(1, 20))

    # Barra azul debajo del membrete
    header_bar = Table(
        [[Paragraph('FACTURA', ParagraphStyle('banner', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=15, alignment=1, textColor=colors.whitesmoke))]],
        colWidths=[doc.width],
    )
    header_bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), blue_dark),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(header_bar)
    story.append(Spacer(1, 16))

    # Datos del paciente
    datos_paciente = [
        [
            Paragraph('Nombre y apellidos:', label_style),
            Paragraph(f"{paciente.get('nombre', '')} {paciente.get('apellido', '')}", normal),
            Paragraph('Cédula:', label_style),
            Paragraph(f"{paciente.get('cedula', '') or paciente.get('id', '')}", normal),
        ],
        [
            Paragraph('Dirección:', label_style),
            Paragraph(f"{paciente.get('direccion', '')}", normal),
            Paragraph('Edad:', label_style),
            Paragraph(f"{paciente.get('edad', '')}   Sexo: {paciente.get('sexo', '')}", normal),
        ],
    ]
    datos_paciente_table = Table(datos_paciente, colWidths=[90, 190, 70, 125], hAlign='LEFT')
    datos_paciente_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), blue_light),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#D9E4F5')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#D9E4F5')),
    ]))
    story.append(datos_paciente_table)
    story.append(Spacer(1, 12))

    # Datos de factura
    datos_factura = [
        [
            Paragraph('Factura:', label_style),
            Paragraph(f"{factura.get('numero_factura', '')}", normal),
            Paragraph('Fecha de examen:', label_style),
            Paragraph(f"{factura.get('fecha_examen', '')}", normal),
        ]
    ]
    datos_factura_table = Table(datos_factura, colWidths=[70, 170, 100, 110], hAlign='LEFT')
    datos_factura_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(datos_factura_table)
    story.append(Spacer(1, 16))

    # Tabla de pruebas
    header_cell_style = ParagraphStyle('table_header', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, textColor=colors.whitesmoke)
    table_data = [[Paragraph('DETALLE', header_cell_style), Paragraph('PRECIO', header_cell_style)]]
    for d in detalles:
        table_data.append([
            Paragraph(d.get('nombre_prueba', ''), normal),
            Paragraph(f"{d.get('precio', 0):.2f}", ParagraphStyle('price', parent=normal, alignment=2)),
        ])

    line_table = Table(table_data, colWidths=[doc.width * 0.7, doc.width * 0.3], hAlign='LEFT')
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), blue_dark),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#D9E4F5')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F8FD')]),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 18))

    # Totales
    totals_data = [
        [Paragraph('Base imponible:', normal), Paragraph(f"Bs {factura.get('base_imponible', 0):.2f}", total_value)],
        [Paragraph('IVA (21%):', normal), Paragraph(f"Bs {factura.get('iva', 0):.2f}", total_value)],
        [Paragraph('<b>TOTAL:</b>', total_label), Paragraph(f"<b>Bs {factura.get('total', 0):.2f}</b>", ParagraphStyle('total_bold', parent=total_value, textColor=colors.whitesmoke))],
    ]
    totals_table = Table(totals_data, colWidths=[doc.width * 0.65, doc.width * 0.35], hAlign='RIGHT')
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('TEXTCOLOR', (0, 0), (-1, 1), blue_dark),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, 2), (-1, 2), 1, blue_border),
        ('BACKGROUND', (0, 2), (-1, 2), blue_dark),
        ('TEXTCOLOR', (0, 2), (-1, 2), colors.whitesmoke),
    ]))
    story.append(totals_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def _build_pdf_ticket(ticket: Dict[str, Any], paciente: Dict[str, Any], detalles: List[Dict[str, Any]], membrete_url: str) -> bytes:
    """Genera PDF de ticket con membrete."""
    from reportlab.platypus import Image

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()
    story = []

    blue_dark = colors.HexColor('#1B3E73')
    blue_light = colors.HexColor('#E5EFF9')
    blue_border = colors.HexColor('#7FA8D1')
    gray_background = colors.HexColor('#F6F8FC')

    normal = ParagraphStyle(
        'normal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.black,
    )
    label_style = ParagraphStyle(
        'label',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=blue_dark,
    )
    total_label = ParagraphStyle(
        'total_label',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=blue_dark,
    )
    total_value = ParagraphStyle(
        'total_value',
        parent=normal,
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=blue_dark,
        alignment=2,
    )

    def fetch_membrete(url: str):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return ImageReader(BytesIO(response.content))
        except Exception as e:
            logging.warning(f"No se pudo cargar el membrete desde URL {url}: {e}")
            return None

    # Cargar membrete desde archivo local o URL
    img_reader = _load_membrete_image(membrete_url)
    if img_reader:
        try:
            # Especificar dimensiones exactas: 532pt ancho x 200pt alto
            # Esto mantiene consistencia visual similar a examenes
            header_image = Image(img_reader, width=532, height=200)
            header_image.hAlign = 'LEFT'
            story.append(header_image)
            story.append(Spacer(1, 12))
        except Exception as e:
            logging.warning(f"Error creando imagen del membrete en ticket: {e}")
            story.append(Spacer(1, 20))
    else:
        story.append(Spacer(1, 20))

    header_bar = Table(
        [[Paragraph('TICKET', ParagraphStyle('banner_ticket', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=15, alignment=1, textColor=colors.whitesmoke))]],
        colWidths=[doc.width],
    )
    header_bar.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), blue_dark),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(header_bar)
    story.append(Spacer(1, 16))

    datos_paciente = [
        [
            Paragraph('Nombre y apellidos:', label_style),
            Paragraph(f"{paciente.get('nombre', '')} {paciente.get('apellido', '')}", normal),
            Paragraph('Cédula:', label_style),
            Paragraph(f"{paciente.get('cedula', '') or paciente.get('id', '')}", normal),
        ],
        [
            Paragraph('Dirección:', label_style),
            Paragraph(f"{paciente.get('direccion', '')}", normal),
            Paragraph('Edad:', label_style),
            Paragraph(f"{paciente.get('edad', '')}   Sexo: {paciente.get('sexo', '')}", normal),
        ],
    ]
    datos_paciente_table = Table(datos_paciente, colWidths=[90, 190, 70, 125], hAlign='LEFT')
    datos_paciente_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), blue_light),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('INNERGRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#D9E4F5')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#D9E4F5')),
    ]))
    story.append(datos_paciente_table)
    story.append(Spacer(1, 12))

    datos_ticket = [
        [
            Paragraph('Ticket:', label_style),
            Paragraph(f"{ticket.get('numero_ticket', '')}", normal),
            Paragraph('Fecha:', label_style),
            Paragraph(f"{ticket.get('fecha', '')}", normal),
        ]
    ]
    datos_ticket_table = Table(datos_ticket, colWidths=[50, 175, 70, 110], hAlign='LEFT')
    datos_ticket_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(datos_ticket_table)
    story.append(Spacer(1, 16))

    header_cell_style = ParagraphStyle('table_header', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, textColor=colors.whitesmoke)
    table_data = [[Paragraph('DETALLE', header_cell_style), Paragraph('PRECIO', header_cell_style)]]
    for d in detalles:
        table_data.append([
            Paragraph(d.get('nombre', ''), normal),
            Paragraph(f"{d.get('precio', 0):.2f}", ParagraphStyle('price', parent=normal, alignment=2)),
        ])

    line_table = Table(table_data, colWidths=[doc.width * 0.7, doc.width * 0.3], hAlign='LEFT')
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), blue_dark),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#D9E4F5')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F8FD')]),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 18))

    totals_data = [
        [Paragraph('Base imponible:', normal), Paragraph(f"Bs {ticket.get('base_imponible', 0):.2f}", total_value)],
        [Paragraph('<b>TOTAL:</b>', total_label), Paragraph(f"<b>Bs {ticket.get('total', 0):.2f}</b>", ParagraphStyle('total_bold', parent=total_value, textColor=colors.whitesmoke))],
    ]
    totals_table = Table(totals_data, colWidths=[doc.width * 0.65, doc.width * 0.35], hAlign='RIGHT')
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('TEXTCOLOR', (0, 0), (-1, 0), blue_dark),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEABOVE', (0, 1), (-1, 1), 1, blue_border),
        ('BACKGROUND', (0, 1), (-1, 1), blue_dark),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.whitesmoke),
    ]))
    story.append(totals_table)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def _get_prueba_by_id(supabase, prueba_id: Any) -> Optional[Dict[str, Any]]:
    if prueba_id is None:
        return None
    resp_prueba = supabase.table("pruebas").select(
        "id, nombre_prueba, precio_bs, precio_usd, unidad_medida"
    ).eq("id", prueba_id).limit(1).execute()
    if resp_prueba.data:
        return resp_prueba.data[0]
    return None


def _build_detalle_from_examenes(supabase, paciente_id: str, fecha_iso: str) -> Optional[DetalleVisita]:
    resp_examenes = supabase.table("examenes").select(
        "id, prueba_id, resultado, observaciones"
    ).eq("paciente_id", paciente_id).eq("fecha", fecha_iso).execute()

    if not resp_examenes.data:
        return None

    pruebas = []
    for examen in resp_examenes.data:
        prueba_id = examen.get("prueba_id")
        prueba = _get_prueba_by_id(supabase, prueba_id)
        if prueba:
            precio_bs = float(prueba.get("precio_bs") or 0)
            precio_usd = float(prueba.get("precio_usd") or 0)
            pruebas.append({
                "prueba_id": prueba.get("id"),
                "nombre_prueba": prueba.get("nombre_prueba"),
                "precio_bs": precio_bs,
                "precio_usd": precio_usd,
                "unidad_medida": prueba.get("unidad_medida"),
                "resultado": examen.get("resultado"),
                "observaciones": examen.get("observaciones"),
            })

    if not pruebas:
        return None

    return DetalleVisita(
        paciente_id=paciente_id,
        fecha=fecha_iso,
        pruebas=pruebas
    )


def _build_detalle_from_examenes_pdf(supabase, paciente_id: str, fecha_iso: str) -> Optional[DetalleVisita]:
    resp_pdf = supabase.table("examenes_pdf").select("pruebas").eq("paciente_id", paciente_id).eq("fecha", fecha_iso).limit(1).execute()
    if not resp_pdf.data:
        return None

    pruebas = []
    pdf_record = resp_pdf.data[0]
    for nombre_prueba in pdf_record.get("pruebas", []) or []:
        prueba_lookup = supabase.table("pruebas").select(
            "id, nombre_prueba, precio_bs, precio_usd, unidad_medida"
        ).eq("nombre_prueba", nombre_prueba).limit(1).execute()

        if prueba_lookup.data:
            prueba = prueba_lookup.data[0]
            precio_bs = float(prueba.get("precio_bs") or 0)
            precio_usd = float(prueba.get("precio_usd") or 0)
            pruebas.append({
                "prueba_id": prueba.get("id"),
                "nombre_prueba": prueba.get("nombre_prueba"),
                "precio_bs": precio_bs,
                "precio_usd": precio_usd,
                "unidad_medida": prueba.get("unidad_medida"),
                "resultado": None,
                "observaciones": None,
            })
        else:
            pruebas.append({
                "prueba_id": None,
                "nombre_prueba": nombre_prueba,
                "precio_bs": 0.0,
                "precio_usd": 0.0,
                "unidad_medida": None,
                "resultado": None,
                "observaciones": None,
            })

    if not pruebas:
        return None

    return DetalleVisita(
        paciente_id=paciente_id,
        fecha=fecha_iso,
        pruebas=pruebas
    )


@router.get("/visita/{paciente_id}/{fecha}", response_model=DetalleVisita)
async def obtener_detalle_visita(paciente_id: str, fecha: str):
    """Obtener todas las pruebas realizadas en una fecha específica."""
    supabase = get_supabase_client()
    try:
        try:
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
            fecha_iso = fecha_obj.isoformat()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de fecha inválido. Use YYYY-MM-DD"
            )

        detalle = _build_detalle_from_examenes(supabase, paciente_id, fecha_iso)
        if detalle is None or not detalle.pruebas:
            detalle = _build_detalle_from_examenes_pdf(supabase, paciente_id, fecha_iso)

        if detalle is None or not detalle.pruebas:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No hay exámenes en esa fecha"
            )

        return detalle

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error obteniendo detalle de visita: {e}")
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
        logging.error(f"Error generando ticket: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al generar ticket"
        )


@router.post("/factura", response_model=FacturaOut)
async def generar_factura(factura: FacturaCreate):
    """Generar factura con IVA e incrementar número autoincremental."""
    supabase = get_supabase_client()
    try:
        # Validar que IVA + base_imponible = total
        iva_calculado = round(factura.base_imponible * 0.21, 2)
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
        logging.error(f"Error generando factura: {e}")
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
        logging.error(f"Error obteniendo factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener factura"
        )


# ============================
#   ENDPOINTS PARA PDFs
# ============================

@router.post("/pdf/{factura_id}", response_model=Dict[str, Any])
async def generar_pdf_factura(factura_id: int):
    """Generar PDF de factura y subir a Storage."""
    supabase = get_supabase_client()
    try:
        # Obtener factura
        resp_factura = supabase.table("facturas").select("*").eq("id", factura_id).execute()
        if not resp_factura.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")
        factura = resp_factura.data[0]

        # Obtener paciente
        resp_paciente = supabase.table("pacientes").select("*").eq("id", factura.get("paciente_id")).execute()
        paciente = resp_paciente.data[0] if resp_paciente.data else {}

        # Detalles
        detalles = factura.get("detalles", [])

        # Membrete URL (asumir subido manualmente)
        membrete_url = "https://[project].supabase.co/storage/v1/object/public/facturas/membrete.png"  # Reemplazar [project] con el real

        # Generar PDF
        pdf_bytes = _build_pdf_factura(factura, paciente, detalles, membrete_url)

        # Subir a bucket facturas
        fecha_examen = factura.get("fecha_examen")
        path = f"{fecha_examen}/factura_{factura_id}.pdf"
        supabase.storage.from_("facturas").upload(path, pdf_bytes, {"content-type": "application/pdf"})

        # Obtener URL pública
        url = supabase.storage.from_("facturas").get_public_url(path)

        # Guardar registro en facturas_pdf
        pdf_data = {
            "factura_id": factura_id,
            "paciente_id": factura.get("paciente_id"),
            "fecha": factura.get("fecha_examen"),
            "url_pdf": url,
            "creado_en": datetime.now().isoformat(),
        }
        supabase.table("facturas_pdf").insert(pdf_data).execute()

        return {"url": url}

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error generando PDF: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al generar PDF")


@router.get("/pdf/{paciente_id}", response_model=List[Dict[str, Any]])
async def obtener_pdfs_paciente(paciente_id: str):
    """Obtener todos los PDFs de facturas de un paciente."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("facturas_pdf").select("*").eq(
            "paciente_id", paciente_id
        ).order("creado_en", desc=True).execute()

        return resp.data or []

    except Exception as e:
        logging.error(f"Error obteniendo PDFs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener PDFs"
        )


@router.get("/pdf/factura/{factura_id}", response_model=Optional[Dict[str, Any]])
async def obtener_pdf_factura(factura_id: int):
    """Obtener PDF de una factura específica."""
    supabase = get_supabase_client()
    try:
        resp = supabase.table("facturas_pdf").select("*").eq(
            "factura_id", factura_id
        ).execute()

        if not resp.data:
            return None

        return resp.data[0]

    except Exception as e:
        logging.error(f"Error obteniendo PDF de factura: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener PDF"
        )


@router.post("/ticket/pdf", response_model=Dict[str, Any])
async def generar_pdf_ticket(ticket_data: Dict[str, Any]):
    """Generar PDF de ticket y devolver URL temporal."""
    supabase = get_supabase_client()
    try:
        # Obtener datos del paciente
        paciente_id = ticket_data.get("paciente_id")
        resp_paciente = supabase.table("pacientes").select("*").eq("id", paciente_id).execute()
        if not resp_paciente.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")
        paciente = resp_paciente.data[0]

        detalles = ticket_data.get("detalles", [])

        # Membrete URL
        membrete_url = "https://[project].supabase.co/storage/v1/object/public/facturas/membrete.png"

        # Generar PDF
        pdf_bytes = _build_pdf_ticket(ticket_data, paciente, detalles, membrete_url)

        # Generar nombre único para el archivo temporal
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = f"temporal/ticket_{timestamp}.pdf"

        # Subir a bucket temporal (o usar el mismo facturas)
        supabase.storage.from_("facturas").upload(path, pdf_bytes, {"content-type": "application/pdf"})

        url = supabase.storage.from_("facturas").get_public_url(path)

        return {"url": url, "path": path}

    except Exception as e:
        logging.error(f"Error generando PDF de ticket: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al generar PDF de ticket"
        )
