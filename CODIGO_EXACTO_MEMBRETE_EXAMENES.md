# CÓDIGO EXACTO: handleGenerarPDF en Examenes.jsx

**Archivo:** `frontend/src/pages/Examenes.jsx`
**Línea inicio:** 441
**Línea fin:** 850 (aprox)

---

## 🔴 SECCIÓN 1: INICIO DE FUNCIÓN Y CONFIGURACIÓN

```javascript
// ============ GENERAR PDF ============
const handleGenerarPDF = async () => {
  // Validaciones
  if (!selectedPaciente || (selectedPruebas.length === 0 && !examenesEspeciales.orina && !examenesEspeciales.heces)) {
    setMensaje({ type: 'warning', text: 'Completa el formulario antes de generar PDF' })
    return
  }
  if (!isFormComplete()) {
    setMensaje({ type: 'warning', text: 'Ingresa al menos un resultado antes de generar PDF' })
    return
  }

  setMensaje({ type: 'info', text: 'Generando PDF...' })
  setSubmitting(true)

  try {
    // Crear documento jsPDF
    const doc = new jsPDF()
```

---

## 🟠 SECCIÓN 2: CARGA DEL MEMBRETE (CRÍTICA)

```javascript
    // Cargar membrete como imagen (PNG) y dibujar una sola vez, con fallback si no existe
    const loadMembrete = async () => {
      const candidatePaths = [
        '/membrete.png',
        '/Membrete Empresa Geométrico Azul.png',
        '/membrete.jpg',
        '/membrete.jpeg'
      ]

      for (const src of candidatePaths) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve(img)
            img.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
            img.src = src
          })
          return src
        } catch (e) {
          // sigue intentando con otro nombre de archivo
        }
      }
      return null
    }

    const membreteSrc = await loadMembrete()
```

---

## 🟡 SECCIÓN 3: INSERCIÓN DE MEMBRETE EN PDF

```javascript
    let ypos = 70

    if (membreteSrc) {
      const headerImg = await new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.onload = () => resolve(image)
        image.onerror = (err) => reject(new Error('No se pudo cargar el membrete'))
        image.src = membreteSrc
      })
      doc.addImage(headerImg, 'PNG', 0, 0, 200, 230)  // ⭐ LÍNEA CLAVE
      ypos = 70
    } else {
      console.warn('No se encontró membresía en formato PNG/JPG; se generará PDF sin membrete.')
      ypos = 20
    }
```

---

## 🟢 SECCIÓN 4: CONTENIDO DESPUÉS DEL MEMBRETE

```javascript
    // Posicionar contenido debajo del membrete
    doc.setFontSize(8)

    // FECHA (justo debajo del membrete)
    doc.setFont("Helvetica", "bold")
    doc.text("Fecha:", 20, ypos)
    doc.setFont("Helvetica", "normal")
    doc.text(`${selectedDate}`, 40, ypos)
    ypos += 10

    // NOMBRE + CÉDULA (misma línea)
    doc.setFont("Helvetica", "bold")
    doc.text("Paciente:", 20, ypos)
    doc.setFont("Helvetica", "normal")
    doc.text(`${selectedPaciente.nombre} ${selectedPaciente.apellido}`, 40, ypos)

    doc.setFont("Helvetica", "bold")
    doc.text("Cédula:", 100, ypos)
    doc.setFont("Helvetica", "normal")
    doc.text(`${selectedPaciente.cedula || ''}`, 118, ypos)
    ypos += 10

    // EDAD + DIRECCIÓN (misma línea)
    doc.setFont("Helvetica", "bold")
    doc.text("Edad:", 20, ypos)
    doc.setFont("Helvetica", "normal")
    doc.text(`${selectedPaciente.edad || ''}`, 40, ypos)

    doc.setFont("Helvetica", "bold")
    doc.text("Dirección:", 70, ypos)
    doc.setFont("Helvetica", "normal")
    doc.text(`${selectedPaciente.direccion || ''}`, 100, ypos)
    ypos += 15

    // TÍTULO CENTRADO Y MÁS GRANDE
    doc.setFontSize(14)
    doc.setFont("Helvetica", "bold")
    doc.text("Pruebas realizadas y resultados", 90, ypos, { align: "center" })
    ypos += 6

    // Línea decorativa
    doc.setLineWidth(0.5)
    doc.line(20, ypos, 190, ypos)
    ypos += 12

    // Volver a tamaño normal
    doc.setFontSize(10)
    doc.setFont("Helvetica", "normal")
```

---

## 🔵 SECCIÓN 5: PRUEBAS AGRUPADAS POR GRUPO

```javascript
    // Agrupar pruebas por grupo
    const pruebasPorGrupo = {}
    pruebasSeleccionadas.forEach(p => {
      const grupoId = p.grupo_id || 'sin_grupo'
      if (!pruebasPorGrupo[grupoId]) {
        pruebasPorGrupo[grupoId] = []
      }
      pruebasPorGrupo[grupoId].push(p)
    })

    // Renderizar pruebas organizadas por grupo
    Object.keys(pruebasPorGrupo).forEach((grupoId) => {
      // Mostrar nombre del grupo solo si fue seleccionado explícitamente como grupo
      if (grupoId !== 'sin_grupo' && selectedGrupos.includes(grupoId)) {
        const grupo = allGrupos.find(g => g.id === grupoId)
        if (grupo) {
          if (ypos > 270) {
            doc.addPage()
            ypos = 20
          }
          doc.setFont("Helvetica", "bold")
          doc.setFontSize(11)
          doc.setTextColor(0, 0, 0)
          doc.text(grupo.nombre.toUpperCase(), 20, ypos)
          ypos += 6
          doc.setLineWidth(0.3)
          doc.line(20, ypos, 190, ypos)
          ypos += 8
        }
      }

      // Pruebas del grupo
      pruebasPorGrupo[grupoId].forEach(p => {
        const res = resultados[String(p.id)] || '—'
        const unidad = p.unidad_medida || ''

        let rango = ''
        if (p.valor_referencia_min !== null && p.valor_referencia_max !== null) {
          rango = `(${p.valor_referencia_min} - ${p.valor_referencia_max})`
        }

        if (ypos > 270) {
          doc.addPage()
          ypos = 20
        }

        doc.setFont("Helvetica", "normal")
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.text(p.nombre_prueba, 20, ypos)

        const resultadoUnidad = [res, unidad].filter(Boolean).join(' ').trim() || '—'
        const valorNumerico = parseFloat(res)
        const fueraDeRango = (
          p.valor_referencia_min !== null &&
          p.valor_referencia_max !== null &&
          !Number.isNaN(valorNumerico) &&
          (valorNumerico < p.valor_referencia_min || valorNumerico > p.valor_referencia_max)
        )
        doc.setFont("Helvetica", "normal")
        doc.setTextColor(fueraDeRango ? 0 : 80, fueraDeRango ? 0 : 80, fueraDeRango ? 0 : 80)
        doc.text(resultadoUnidad, 140, ypos, { align: 'right' })

        doc.setFont("Helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        if (rango) {
          doc.text(rango, 190, ypos, { align: 'right' })
        }
        ypos += 7

        if (p.descripcion) {
          if (ypos > 270) {
            doc.addPage()
            ypos = 20
          }
          doc.setFont("Helvetica", fueraDeRango ? "bold":"normal")
          doc.setFontSize(8)
          doc.setTextColor(0, 0, 0)
          const descripcionLines = doc.splitTextToSize(p.descripcion, 60)
          descripcionLines.forEach(line => {
            if (ypos > 270) {
              doc.addPage()
              ypos = 20
            }
            doc.text(line, 170, ypos, { align: 'right' })
            ypos += 5
          })
          ypos += 2
        }

        if (observaciones[String(p.id)]) {
          if (ypos > 270) {
            doc.addPage()
            ypos = 20
          }
          doc.setFont("Helvetica", "italic")
          doc.setFontSize(8)
          doc.setTextColor(0, 0, 0)
          const obsLines = doc.splitTextToSize(observaciones[String(p.id)], 160)
          obsLines.forEach(line => {
            if (ypos > 270) {
              doc.addPage()
              ypos = 20
            }
            doc.text(line, 20, ypos)
            ypos += 4
          })
          doc.setFont("Helvetica", "normal")
          doc.setFontSize(9)
          ypos += 4
        }
      })

      ypos += 4
    })
```

---

## 🟣 SECCIÓN 6: EXÁMENES ESPECIALES (ORINA)

```javascript
    // Agregar exámenes especiales si están habilitados
    if (examenesEspeciales.orina.enabled) {
      ypos += 10
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(11)
      doc.text("EXAMEN COMPLETO DE ORINA", 20, ypos)
      ypos += 8
      doc.setLineWidth(0.3)
      doc.line(20, ypos, 190, ypos)
      ypos += 6
      doc.setFont("Helvetica", "normal")
      doc.setFontSize(9)

      // Examen Físico
      doc.setFont("Helvetica", "bold")
      doc.text("Examen Físico:", 20, ypos)
      ypos += 5
      doc.setFont("Helvetica", "normal")
      const fisicoData = [
        `Aspecto: ${examenesEspeciales.orina.data.aspecto || 'No especificado'}`,
        `Color: ${examenesEspeciales.orina.data.color || 'No especificado'}`,
        `Olor: ${examenesEspeciales.orina.data.olor || 'No especificado'}`,
        `Densidad: ${examenesEspeciales.orina.data.densidad || 'No especificado'}`,
        `pH: ${examenesEspeciales.orina.data.ph || 'No especificado'}`,
        `Reacción: ${examenesEspeciales.orina.data.reaccion || 'No especificado'}`
      ]
      fisicoData.forEach(item => {
        doc.text(item, 25, ypos)
        ypos += 4
      })

      // Examen Químico
      ypos += 3
      doc.setFont("Helvetica", "bold")
      doc.text("Examen Químico:", 20, ypos)
      ypos += 5
      doc.setFont("Helvetica", "normal")
      const quimicoData = [
        `Albúmina: ${examenesEspeciales.orina.data.albumina || 'No especificado'}`,
        `Glucosa: ${examenesEspeciales.orina.data.glucosa || 'No especificado'}`,
        `Nitritos: ${examenesEspeciales.orina.data.nitritos || 'No especificado'}`,
        `Bilirrubina: ${examenesEspeciales.orina.data.bilirrubina || 'No especificado'}`,
        `Urobilinógenos: ${examenesEspeciales.orina.data.urobilinogenos || 'No especificado'}`
      ]
      quimicoData.forEach(item => {
        doc.text(item, 25, ypos)
        ypos += 4
      })

      // Examen Microscópico
      ypos += 3
      doc.setFont("Helvetica", "bold")
      doc.text("Examen Microscópico:", 20, ypos)
      ypos += 5
      doc.setFont("Helvetica", "normal")
      const microscopicoData = [
        `Células epiteliales: ${examenesEspeciales.orina.data.celulas_epiteliales || 'No especificado'}`,
        `Leucocitos: ${examenesEspeciales.orina.data.leucocitos || 'No especificado'}`,
        `Hematíes: ${examenesEspeciales.orina.data.hematies || 'No especificado'}`,
        `Cristales: ${examenesEspeciales.orina.data.cristales || 'No especificado'}`,
        `Bacterias: ${examenesEspeciales.orina.data.bacterias || 'No especificado'}`
      ]
      microscopicoData.forEach(item => {
        doc.text(item, 25, ypos)
        ypos += 4
      })
    }
```

---

## 🟠 SECCIÓN 7: EXÁMENES ESPECIALES (HECES)

```javascript
    if (examenesEspeciales.heces.enabled) {
      ypos += 10
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(11)
      doc.text("EXAMEN COMPLETO DE HECES", 20, ypos)
      ypos += 8
      doc.setLineWidth(0.3)
      doc.line(20, ypos, 190, ypos)
      ypos += 6
      doc.setFont("Helvetica", "normal")
      doc.setFontSize(9)

      // Propiedades Macroscópicas
      doc.setFont("Helvetica", "bold")
      doc.text("Propiedades Macroscópicas:", 20, ypos)
      ypos += 5
      doc.setFont("Helvetica", "normal")
      const macroData = [
        `Color: ${examenesEspeciales.heces.data.color || 'No especificado'}`,
        `Consistencia: ${examenesEspeciales.heces.data.consistencia || 'No especificado'}`,
        `Moco: ${examenesEspeciales.heces.data.moco || 'No especificado'}`,
        `Sangre visible: ${examenesEspeciales.heces.data.sangre_visible || 'No especificado'}`,
        `Restos alimenticios: ${examenesEspeciales.heces.data.restos_alimenticios || 'No especificado'}`,
        `pH: ${examenesEspeciales.heces.data.ph || 'No especificado'}`
      ]
      macroData.forEach(item => {
        doc.text(item, 25, ypos)
        ypos += 4
      })

      // Examen Microscópico - Parasitológico
      ypos += 3
      doc.setFont("Helvetica", "bold")
      doc.text("Examen Microscópico - Parasitológico:", 20, ypos)
      ypos += 5
      doc.setFont("Helvetica", "normal")
      const parasitoData = [
        `Quistes de protozoarios: ${examenesEspeciales.heces.data.quistes_protozoarios || 'No especificado'}`,
        `Trofozoítos: ${examenesEspeciales.heces.data.trofozoitos || 'No especificado'}`,
        `Huevos de helmintos: ${examenesEspeciales.heces.data.huevos_helmintos || 'No especificado'}`,
        `Larvas de helmintos: ${examenesEspeciales.heces.data.larvas_helmintos || 'No especificado'}`,
        `Leucocitos: ${examenesEspeciales.heces.data.leucocitos || 'No especificado'}`,
        `Hematíes: ${examenesEspeciales.heces.data.hematies || 'No especificado'}`
      ]
      parasitoData.forEach(item => {
        doc.text(item, 25, ypos)
        ypos += 4
      })

      // Examen Microscópico - Coprológico
      ypos += 3
      doc.setFont("Helvetica", "bold")
      doc.text("Examen Microscópico - Coprológico:", 20, ypos)
      ypos += 5
      doc.setFont("Helvetica", "normal")
      const coproData = [
        `Almidón: ${examenesEspeciales.heces.data.almidon || 'No especificado'}`,
        `Fibras musculares: ${examenesEspeciales.heces.data.fibras_musculares || 'No especificado'}`,
        `Grasas neutras: ${examenesEspeciales.heces.data.grasas_neutras || 'No especificado'}`,
        `Jabón: ${examenesEspeciales.heces.data.jabon || 'No especificado'}`,
        `Ácidos grasos: ${examenesEspeciales.heces.data.acidos_grasos || 'No especificado'}`
      ]
      coproData.forEach(item => {
        doc.text(item, 25, ypos)
        ypos += 4
      })

      // Observaciones
      if (examenesEspeciales.heces.data.observaciones) {
        ypos += 3
        doc.setFont("Helvetica", "bold")
        doc.text("Observaciones:", 20, ypos)
        ypos += 5
        doc.setFont("Helvetica", "normal")
        doc.text(examenesEspeciales.heces.data.observaciones, 25, ypos)
        ypos += 4
      }
    }
```

---

## 🟤 SECCIÓN 8: GENERACIÓN Y UPLOAD

```javascript
    // Validar si el contenido cabe en la página
    const maxYpos = 270 // Altura aproximada de la página en jsPDF
    if (ypos > maxYpos) {
      console.warn('El PDF es muy largo. Considera dividir en múltiples páginas.')
    }

    const pdfBlob = doc.output('blob')

    // enviar al backend para que suba y registre
    const formData = new FormData()
    formData.append('file', pdfBlob,'examen.pdf')
    formData.append('paciente_id', selectedPaciente.id)
    formData.append('fecha', selectedDate)
    formData.append('pruebas', JSON.stringify(pruebasSeleccionadas.map(p => p.nombre_prueba)))
    formData.append('examenes_especiales', JSON.stringify({
      orina: examenesEspeciales.orina.enabled ? examenesEspeciales.orina.data : null,
      heces: examenesEspeciales.heces.enabled ? examenesEspeciales.heces.data : null
    }))

    // uploadPDF ya sube y registra en examenes_pdf; no duplicar con saveExamenPDF
    await api.uploadPDF(formData)

    setMensaje({ type: 'success', text: 'PDF generado y guardado correctamente' })
    await loadExamenesDelDia()
    await loadExamenCount()
    setTimeout(() => {
      clearForm()
      setMensaje({ type: '', text: '' })
    }, 2000)
  } catch (err) {
    console.error('Error generando/uploading PDF:', err)
    setMensaje({ type: 'error', text: 'Error al generar PDF' })
  } finally {
    setSubmitting(false)
  }
}
```

---

## 📋 RESUMEN DE LA FUNCIÓN

| Aspecto | Detalles |
|---------|----------|
| **Líneas** | 441-850 (aprox) |
| **Imports necesarios** | `jsPDF` (línea 14) |
| **Paso 1** | Validar formulario |
| **Paso 2** | Crear documento jsPDF |
| **Paso 3** | Buscar membrete (4 variantes) |
| **Paso 4** | Insertar membrete en (0,0) con tamaño 200×230 |
| **Paso 5** | Posicionar contenido desde ypos=70 |
| **Paso 6** | Generar blob con `output('blob')` |
| **Paso 7** | Enviar al backend con `uploadPDF()` |

---

## ⭐ LA LÍNEA MÁS IMPORTANTE

```javascript
doc.addImage(headerImg, 'PNG', 0, 0, 200, 230)
```

Esta línea inserta la imagen del membrete:
- En posición X=0, Y=0 (esquina superior izquierda)
- Con tamaño 200mm × 230mm
- En formato PNG

---

**Referencia:** frontend/src/pages/Examenes.jsx, línea 441-850  
**Última actualización:** 21 de abril de 2026
