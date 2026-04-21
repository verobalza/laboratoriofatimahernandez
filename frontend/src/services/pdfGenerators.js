/**
 * pdfGenerators.js
 * 
 * Funciones para generar PDFs especializados para exámenes de orina y heces.
 * Utiliza jsPDF para crear documentos con formato estructurado y profesional.
 */

import jsPDF from 'jspdf'

// ============ UTILIDADES ============

/**
 * Obtener fecha formateada en español
 */
const formatFecha = (fecha) => {
  if (!fecha) return ''
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Agregar encabezado al documento
 */
const agregarEncabezado = (doc, titulo, subtitulo) => {
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Fondo azul
  doc.setFillColor(52, 152, 219)
  doc.rect(0, 0, pageWidth, 35, 'F')
  
  // Título
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.text(titulo, pageWidth / 2, 18, { align: 'center' })
  
  // Subtítulo
  if (subtitulo) {
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(subtitulo, pageWidth / 2, 27, { align: 'center' })
  }
  
  doc.setTextColor(0, 0, 0)
  return 40
}

/**
 * Agregar información del paciente
 */
const agregarInfoPaciente = (doc, startY, paciente, fecha) => {
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  
  const lineHeight = 5
  let y = startY
  
  // Encabezado de sección
  doc.setFillColor(236, 240, 241)
  doc.rect(10, y, 190, 6, 'F')
  doc.setFont(undefined, 'bold')
  doc.text('INFORMACIÓN DEL PACIENTE', 12, y + 4)
  
  y += 10
  doc.setFont(undefined, 'normal')
  
  // Datos
  doc.text(`Paciente: ${paciente?.nombre || ''} ${paciente?.apellido || ''}`, 12, y)
  y += lineHeight
  
  doc.text(`Edad: ${paciente?.edad || 'N/A'} años`, 12, y)
  y += lineHeight
  
  doc.text(`Fecha de Examen: ${formatFecha(fecha)}`, 12, y)
  y += lineHeight
  
  return y + 5
}

/**
 * Agregar footer con información de laboratorio
 */
const agregarFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Laboratorio Clínico - Sistema de Gestión de Exámenes', pageWidth / 2, pageHeight - 10, { align: 'center' })
  doc.text('Todos los derechos reservados', pageWidth / 2, pageHeight - 5, { align: 'center' })
}

// ============ GENERADOR DE PDF ORINA ============

export const generarPDFOrina = (paciente, examenOrina) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = agregarEncabezado(doc, '🧪 EXAMEN DE ORINA COMPLETO', 'Análisis Macroscópico, Químico y Microscópico')
  
  // Información del paciente
  y = agregarInfoPaciente(doc, y, paciente, examenOrina.fecha)
  
  // ========== PROPIEDADES MACROSCÓPICAS ==========
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setFillColor(236, 240, 241)
  doc.rect(10, y, 190, 6, 'F')
  doc.text('PROPIEDADES MACROSCÓPICAS', 12, y + 4)
  
  y += 10
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  
  const macroscopicas = [
    ['Aspecto', examenOrina.aspecto],
    ['Color', examenOrina.color],
    ['Olor', examenOrina.olor],
    ['Densidad', examenOrina.densidad],
    ['pH', examenOrina.ph],
    ['Reacción', examenOrina.reaccion]
  ]
  
  macroscopicas.forEach(([label, valor]) => {
    if (valor) {
      doc.text(`${label}:`, 12, y)
      doc.setFont(undefined, 'bold')
      doc.text(String(valor), 60, y)
      doc.setFont(undefined, 'normal')
      y += 5
    }
  })
  
  y += 5
  
  // ========== PROPIEDADES QUÍMICAS ==========
  doc.setFont(undefined, 'bold')
  doc.setFillColor(236, 240, 241)
  doc.rect(10, y, 190, 6, 'F')
  doc.text('PROPIEDADES QUÍMICAS', 12, y + 4)
  doc.setFont(undefined, 'normal')
  
  y += 10
  
  const quimicas = [
    ['Albúmina', examenOrina.albumina],
    ['Glucosa', examenOrina.glucosa],
    ['Nitritos', examenOrina.nitritos],
    ['Bilirrubina', examenOrina.bilirrubina],
    ['Urobilinógenos', examenOrina.urobilinogenos],
    ['Cetonas', examenOrina.cetonas],
    ['Hemoglobina', examenOrina.hemoglobina]
  ]
  
  quimicas.forEach(([label, valor]) => {
    if (valor) {
      doc.text(`${label}:`, 12, y)
      doc.setFont(undefined, 'bold')
      doc.text(String(valor), 60, y)
      doc.setFont(undefined, 'normal')
      y += 5
    }
  })
  
  y += 5
  
  // ========== ANÁLISIS MICROSCÓPICO ==========
  doc.setFont(undefined, 'bold')
  doc.setFillColor(236, 240, 241)
  doc.rect(10, y, 190, 6, 'F')
  doc.text('ANÁLISIS MICROSCÓPICO', 12, y + 4)
  doc.setFont(undefined, 'normal')
  
  y += 10
  
  const microscopicas = [
    ['Células Epiteliales', examenOrina.celulas_epiteliales],
    ['Leucocitos', examenOrina.leucocitos],
    ['Hematíes', examenOrina.hematíes],
    ['Cristales', examenOrina.cristales],
    ['Bacterias', examenOrina.bacterias],
    ['Cilindros', examenOrina.cilindros],
    ['Partículas Varias', examenOrina.particulas_varias]
  ]
  
  microscopicas.forEach(([label, valor]) => {
    if (valor) {
      doc.text(`${label}:`, 12, y)
      doc.setFont(undefined, 'bold')
      doc.text(String(valor), 60, y)
      doc.setFont(undefined, 'normal')
      y += 5
      
      // Nueva página si es necesario
      if (y > 260) {
        agregarFooter(doc)
        doc.addPage()
        y = 20
      }
    }
  })
  
  // ========== OBSERVACIONES ==========
  if (examenOrina.observaciones || examenOrina.notas_tecnico) {
    y += 5
    doc.setFont(undefined, 'bold')
    doc.setFillColor(236, 240, 241)
    doc.rect(10, y, 190, 6, 'F')
    doc.text('OBSERVACIONES', 12, y + 4)
    doc.setFont(undefined, 'normal')
    
    y += 10
    
    if (examenOrina.observaciones) {
      doc.text('Observaciones Generales:', 12, y)
      y += 4
      const splitObs = doc.splitTextToSize(examenOrina.observaciones, 180)
      doc.text(splitObs, 12, y)
      y += splitObs.length * 4 + 3
    }
    
    if (examenOrina.notas_tecnico) {
      doc.text('Notas del Técnico:', 12, y)
      y += 4
      const splitNotas = doc.splitTextToSize(examenOrina.notas_tecnico, 180)
      doc.text(splitNotas, 12, y)
      y += splitNotas.length * 4
    }
  }
  
  agregarFooter(doc)
  return doc
}

// ============ GENERADOR DE PDF HECES ============

export const generarPDFHeces = (paciente, examenHeces) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = agregarEncabezado(doc, '🔬 EXAMEN DE HECES COMPLETO', 'Análisis Macroscópico, Microscópico y Parasitología')
  
  // Información del paciente
  y = agregarInfoPaciente(doc, y, paciente, examenHeces.fecha)
  
  // ========== PROPIEDADES MACROSCÓPICAS ==========
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  doc.setFillColor(236, 240, 241)
  doc.rect(10, y, 190, 6, 'F')
  doc.text('PROPIEDADES MACROSCÓPICAS', 12, y + 4)
  
  y += 10
  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  
  const macroscopicas = [
    ['Color', examenHeces.color],
    ['Consistencia', examenHeces.consistencia],
    ['Forma', examenHeces.forma],
    ['Presencia de Moco', examenHeces.presencia_moco],
    ['Presencia de Sangre', examenHeces.presencia_sangre],
    ['Restos Alimenticios', examenHeces.presencia_restos_alimenticios],
    ['pH', examenHeces.ph]
  ]
  
  macroscopicas.forEach(([label, valor]) => {
    if (valor) {
      doc.text(`${label}:`, 12, y)
      doc.setFont(undefined, 'bold')
      doc.text(String(valor), 60, y)
      doc.setFont(undefined, 'normal')
      y += 5
    }
  })
  
  y += 5
  
  // ========== ANÁLISIS MICROSCÓPICO ==========
  doc.setFont(undefined, 'bold')
  doc.setFillColor(236, 240, 241)
  doc.rect(10, y, 190, 6, 'F')
  doc.text('ANÁLISIS MICROSCÓPICO', 12, y + 4)
  doc.setFont(undefined, 'normal')
  
  y += 10
  
  const microscopicas = [
    ['Leucocitos', examenHeces.leucocitos],
    ['Hematíes', examenHeces.hematíes],
    ['Células Epiteliales', examenHeces.celulas_epiteliales],
    ['Grasa', examenHeces.grasa],
    ['Almidón', examenHeces.almidón],
    ['Fibras Musculares', examenHeces.fibras_musculares],
    ['Cristales Colesterol', examenHeces.cristales_colesterol],
    ['Otros Cristales', examenHeces.cristales_otros]
  ]
  
  microscopicas.forEach(([label, valor]) => {
    if (valor) {
      doc.text(`${label}:`, 12, y)
      doc.setFont(undefined, 'bold')
      doc.text(String(valor), 60, y)
      doc.setFont(undefined, 'normal')
      y += 5
    }
  })
  
  y += 5
  
  // ========== PARASITOLOGÍA ==========
  doc.setFont(undefined, 'bold')
  doc.setFillColor(236, 240, 241)
  doc.rect(10, y, 190, 6, 'F')
  doc.text('PARASITOLOGÍA', 12, y + 4)
  doc.setFont(undefined, 'normal')
  
  y += 10
  
  const parasitologia = [
    ['Parásitos', examenHeces.parasitos],
    ['Huevos de Parásitos', examenHeces.huevos_parasitos],
    ['Quistes de Parásitos', examenHeces.quistes_parasitos],
    ['Bacterias', examenHeces.bacterias],
    ['Levaduras', examenHeces.levaduras]
  ]
  
  parasitologia.forEach(([label, valor]) => {
    if (valor) {
      doc.text(`${label}:`, 12, y)
      doc.setFont(undefined, 'bold')
      doc.text(String(valor), 60, y)
      doc.setFont(undefined, 'normal')
      y += 5
      
      // Nueva página si es necesario
      if (y > 260) {
        agregarFooter(doc)
        doc.addPage()
        y = 20
      }
    }
  })
  
  // ========== CULTIVO ==========
  if (examenHeces.cultivo_resultado || examenHeces.microorganismos_aislados) {
    y += 5
    doc.setFont(undefined, 'bold')
    doc.setFillColor(236, 240, 241)
    doc.rect(10, y, 190, 6, 'F')
    doc.text('CULTIVO', 12, y + 4)
    doc.setFont(undefined, 'normal')
    
    y += 10
    
    if (examenHeces.cultivo_resultado) {
      doc.text(`Resultado del Cultivo: ${examenHeces.cultivo_resultado}`, 12, y)
      y += 5
    }
    
    if (examenHeces.microorganismos_aislados) {
      doc.text('Microorganismos Aislados:', 12, y)
      y += 4
      const splitMicro = doc.splitTextToSize(examenHeces.microorganismos_aislados, 180)
      doc.text(splitMicro, 12, y)
      y += splitMicro.length * 4 + 3
    }
  }
  
  // ========== OBSERVACIONES ==========
  if (examenHeces.observaciones || examenHeces.notas_tecnico) {
    y += 5
    doc.setFont(undefined, 'bold')
    doc.setFillColor(236, 240, 241)
    doc.rect(10, y, 190, 6, 'F')
    doc.text('OBSERVACIONES', 12, y + 4)
    doc.setFont(undefined, 'normal')
    
    y += 10
    
    if (examenHeces.observaciones) {
      doc.text('Observaciones Generales:', 12, y)
      y += 4
      const splitObs = doc.splitTextToSize(examenHeces.observaciones, 180)
      doc.text(splitObs, 12, y)
      y += splitObs.length * 4 + 3
    }
    
    if (examenHeces.notas_tecnico) {
      doc.text('Notas del Técnico:', 12, y)
      y += 4
      const splitNotas = doc.splitTextToSize(examenHeces.notas_tecnico, 180)
      doc.text(splitNotas, 12, y)
      y += splitNotas.length * 4
    }
  }
  
  agregarFooter(doc)
  return doc
}

/**
 * Función auxiliar para descargar PDF
 */
export const descargarPDF = (doc, nombreArchivo) => {
  doc.save(`${nombreArchivo}.pdf`)
}
