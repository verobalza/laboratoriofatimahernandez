/**
 * Examenes.jsx
 *
 * Página de registro de exámenes de laboratorio.
 * Flujo completo: seleccionar paciente → seleccionar pruebas → ingresar resultados → guardar → generar PDF
 *
 * Diseño coherente con Dashboard: fondo azul suave, cards, animaciones.
 */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import GrupoSelector from '../components/GrupoSelector'
import api from '../services/api'
import jsPDF from 'jspdf'
import './Examenes.css'
import BrandingLink from '../components/BrandingLink'





function Examenes() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  // ============ ESTADO GENERAL ============
  const [selectedDate, setSelectedDate] = useState(today)
  const [examenCount, setExamenCount] = useState(0)
  const [mensaje, setMensaje] = useState({ type: '', text: '' })
  const [examenesDelDia, setExamenesDelDia] = useState([])
  const [showModalExamenes, setShowModalExamenes] = useState(false)
  const [examenesConDetalles, setExamenesConDetalles] = useState([])
  const [searchExamenPacienteTerm, setSearchExamenPacienteTerm] = useState('')
  const [searchExamenPacienteResults, setSearchExamenPacienteResults] = useState([])
  const [showSearchExamenPacienteResults, setShowSearchExamenPacienteResults] = useState(false)
  const [selectedExamenPaciente, setSelectedExamenPaciente] = useState(null)
  const [historialExamenesPaciente, setHistorialExamenesPaciente] = useState([])

  // ============ BÚSQUEDA DE PACIENTE ============
  const [searchPaciente, setSearchPaciente] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState(null)

  // ============ GESTIÓN DE PRUEBAS ============
  const [allPruebas, setAllPruebas] = useState([])
  const [selectedPruebas, setSelectedPruebas] = useState([])
  const [selectedGrupos, setSelectedGrupos] = useState([])
  const [showPruebasSelection, setShowPruebasSelection] = useState(false)
  const [pruebasLoading, setpruebasLoading] = useState(false)
  const [allGrupos, setAllGrupos] = useState([])

  // ============ FORMULARIO DE RESULTADOS ============
  const [resultados, setResultados] = useState({})
  const [observaciones, setObservaciones] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // ============ EXÁMENES ESPECIALES ============
  const [examenesEspeciales, setExamenesEspeciales] = useState({
    orina: { enabled: false, data: {} },
    heces: { enabled: false, data: {} }
  })
  const [showCamposEspeciales, setShowCamposEspeciales] = useState({
    orina: false,
    heces: false
  })

 

  // Cargar todas las pruebas y grupos al montar
  useEffect(() => {
    loadAllPruebas()
    loadAllGrupos()
    loadExamenCount()
    loadExamenesDelDia()
  }, [selectedDate])

  const loadAllPruebas = async () => {
    setpruebasLoading(true)
    try {
      const data = await api.getAllPruebas()
      setAllPruebas(data || [])
    } catch (error) {
      console.error('Error cargando pruebas:', error)
      setMensaje({ type: 'error', text: 'Error al cargar pruebas' })
    } finally {
      setpruebasLoading(false)
    }
  }

  const loadAllGrupos = async () => {
    try {
      const data = await api.getAllGrupos()
      setAllGrupos(data || [])
    } catch (error) {
      console.error('Error cargando grupos:', error)
      console.warn('Los grupos no están disponibles aún')
    }
  }

  const loadExamenCount = async () => {
    try {
      const data = await api.getExamenesPDF(selectedDate)
      if (!Array.isArray(data)) {
        setExamenCount(0)
        return
      }

      // Evitar contar duplicados históricos (misma fecha/paciente/url)
      const uniqueByKey = data.filter((examen, index, self) => {
        const key = `${examen.paciente_id || ''}|${examen.fecha || ''}|${examen.url_pdf || ''}`
        return index === self.findIndex((e) => `${e.paciente_id || ''}|${e.fecha || ''}|${e.url_pdf || ''}` === key)
      })
      setExamenCount(uniqueByKey.length)
    } catch (error) {
      console.error('Error contando exámenes:', error)
    }
  }

  // Traer lista de exámenes del día desde el registro de PDFs
  const loadExamenesDelDia = async () => {
    try {
      const data = await api.getExamenesPDF(selectedDate)
      // Evitar repetidos exactos (doble registro del mismo PDF)
      const uniqueExamenes = data ? data.filter((examen, index, self) => {
        const key = `${examen.paciente_id || ''}|${examen.fecha || ''}|${examen.url_pdf || ''}`
        return index === self.findIndex((e) => `${e.paciente_id || ''}|${e.fecha || ''}|${e.url_pdf || ''}` === key)
      }
      ) : []
      setExamenesDelDia(uniqueExamenes)
    } catch (error) {
      console.error('Error cargando examenes del dia:', error)
    }
  }

  // Cargar detalles de exámenes (obtener cédula del paciente)
  const loadExamenesConDetalles = async () => {
    if (!examenesDelDia || examenesDelDia.length === 0) {
      setExamenesConDetalles([])
      return
    }

    try {
      const detalles = await Promise.all(
        examenesDelDia.map(async (examen) => {
          try {
            const paciente = await api.getPaciente(examen.paciente_id)
            return {
              ...examen,
              paciente_cedula: paciente?.cedula || '-'
            }
          } catch (error) {
            console.warn('Error obteniendo detalles del paciente:', error)
            return { ...examen, paciente_cedula: '-' }
          }
        })
      )
      setExamenesConDetalles(detalles)
    } catch (error) {
      console.error('Error cargando detalles:', error)
    }
  }

  // Manejador para abrir el modal de exámenes
  const handleAbrirModalExamenes = async () => {
    setShowModalExamenes(true)
    await loadExamenesConDetalles()
  }

  // ============ BÚSQUEDA DE PACIENTE ============
  const handleSearchPaciente = async (value) => {
    setSearchPaciente(value)
    if (!value.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      const results = await api.searchPacientes(value)
      setSearchResults(results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Error:', error)
      setMensaje({ type: 'error', text: 'Error al buscar paciente' })
    }
  }

  const selectPaciente = (paciente) => {
    setSelectedPaciente(paciente)
    setSearchPaciente(`${paciente.nombre} ${paciente.apellido}`)
    setShowSearchResults(false)
  }

  const handleSearchExamenPaciente = async (value) => {
    setSearchExamenPacienteTerm(value)
    if (!value.trim()) {
      setSearchExamenPacienteResults([])
      setShowSearchExamenPacienteResults(false)
      setSelectedExamenPaciente(null)
      setHistorialExamenesPaciente([])
      return
    }

    try {
      const results = await api.searchPacientes(value)
      setSearchExamenPacienteResults(results || [])
      setShowSearchExamenPacienteResults(true)
    } catch (error) {
      console.error('Error buscando paciente para exámenes:', error)
      setMensaje({ type: 'error', text: 'Error al buscar historial de exámenes' })
    }
  }

  const selectPacienteForExamenSearch = async (paciente) => {
    setSelectedExamenPaciente(paciente)
    setSearchExamenPacienteTerm(`${paciente.nombre} ${paciente.apellido}`)
    setShowSearchExamenPacienteResults(false)
    setHistorialExamenesPaciente([])

    try {
      const data = await api.getExamenesPDFByPaciente(paciente.id)
      const uniqueRecords = (data || []).filter((item, index, self) => {
        const key = `${item.fecha || ''}|${item.url_pdf || ''}|${item.id || ''}`
        return index === self.findIndex((x) => `${x.fecha || ''}|${x.url_pdf || ''}|${x.id || ''}` === key)
      })
      uniqueRecords.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      setHistorialExamenesPaciente(uniqueRecords)
    } catch (error) {
      console.error('Error cargando historial de exámenes:', error)
      setMensaje({ type: 'error', text: 'Error al cargar visitas del paciente' })
    }
  }

  // ============ GESTIÓN DE SELECCIÓN DE PRUEBAS ============
  const togglePrueba = (pruebaId) => {
    setSelectedPruebas((prev) => {
      if (prev.includes(pruebaId)) {
        return prev.filter((id) => id !== pruebaId)
      } else {
        return [...prev, pruebaId]
      }
    })
  }

  const toggleGrupo = (grupoId) => {
    const grupo = allGrupos.find(g => g.id === grupoId)
    if (!grupo) return

    const pruebasDelGrupo = allPruebas.filter(p => p.grupo_id === grupoId).map(p => p.id)
    
    setSelectedGrupos((prev) => {
      if (prev.includes(grupoId)) {
        // Deseleccionar grupo
        setSelectedPruebas((prevPruebas) => prevPruebas.filter(id => !pruebasDelGrupo.includes(id)))
        return prev.filter((id) => id !== grupoId)
      } else {
        // Seleccionar grupo
        setSelectedPruebas((prevPruebas) => [...new Set([...prevPruebas, ...pruebasDelGrupo])])
        return [...prev, grupoId]
      }
    })
  }

  const clearForm = () => {
    setSelectedPaciente(null)
    setSearchPaciente('')
    setSelectedPruebas([])
    setSelectedGrupos([])
    setResultados({})
    setObservaciones({})
    setExamenesEspeciales({
      orina: { enabled: false, data: {} },
      heces: { enabled: false, data: {} }
    })
    setShowCamposEspeciales({
      orina: false,
      heces: false
    })
  }

  const handleAcceptPruebas = () => {
    if (selectedPruebas.length === 0) {
      setMensaje({ type: 'warning', text: 'Selecciona al menos una prueba' })
      return
    }
    setShowPruebasSelection(false)
    // Inicializar campos de resultado
    const newResultados = {}
    const newObservaciones = {}
    selectedPruebas.forEach((pruebaId) => {
      newResultados[pruebaId] = ''
      newObservaciones[pruebaId] = ''
    })
    setResultados(newResultados)
    setObservaciones(newObservaciones)
  }

  // ============ MANEJO DE RESULTADOS ============
  const handleResultadoChange = (pruebaId, value) => {
    setResultados((prev) => ({ ...prev, [pruebaId]: value }))
  }

  const handleObservacionesChange = (pruebaId, value) => {
    setObservaciones((prev) => ({ ...prev, [pruebaId]: value }))
  }

  // ============ MANEJO DE EXÁMENES ESPECIALES ============
  const toggleExamenEspecial = (tipo) => {
    setExamenesEspeciales((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        enabled: !prev[tipo].enabled
      }
    }))
    setShowCamposEspeciales((prev) => ({
      ...prev,
      [tipo]: !prev[tipo]
    }))
  }

  const handleExamenEspecialChange = (tipo, field, value) => {
    setExamenesEspeciales((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        data: {
          ...prev[tipo].data,
          [field]: value
        }
      }
    }))
  }

  // ============ GUARDAR EXÁMENES ============
  const handleGuardarExamenes = async () => {
    if (!selectedPaciente) {
      setMensaje({ type: 'error', text: 'Selecciona un paciente' })
      return
    }

    if (selectedPruebas.length === 0 && !examenesEspeciales.orina.enabled && !examenesEspeciales.heces.enabled) {
      setMensaje({ type: 'error', text: 'Selecciona al menos una prueba o examen especial' })
      return
    }

    setSubmitting(true)
    try {
      let examenesCreados = []

      // Guardar exámenes normales si hay pruebas seleccionadas
      if (selectedPruebas.length > 0) {
        const examenesData = selectedPruebas.map((pruebaId) => ({
          paciente_id: selectedPaciente.id,
          prueba_id: pruebaId,
          fecha: selectedDate,
          resultado: resultados[pruebaId] || '',
          observaciones: observaciones[pruebaId] || ''
        }))

        examenesCreados = await api.createExamenesBatch(examenesData)
      }

      // Guardar exámenes especiales si están habilitados
      if (examenesEspeciales.orina.enabled) {
        const orinaData = {
          paciente_id: selectedPaciente.id,
          fecha: selectedDate,
          aspecto: examenesEspeciales.orina.data.aspecto,
          color: examenesEspeciales.orina.data.color,
          olor: examenesEspeciales.orina.data.olor,
          densidad: examenesEspeciales.orina.data.densidad,
          ph: examenesEspeciales.orina.data.ph,
          reaccion: examenesEspeciales.orina.data.reaccion,
          albumina: examenesEspeciales.orina.data.albumina,
          glucosa: examenesEspeciales.orina.data.glucosa,
          nitritos: examenesEspeciales.orina.data.nitritos,
          bilirrubina: examenesEspeciales.orina.data.bilirrubina,
          urobilinogenos: examenesEspeciales.orina.data.urobilinogenos,
          celulas_epiteliales: examenesEspeciales.orina.data.celulas_epiteliales,
          leucocitos: examenesEspeciales.orina.data.leucocitos,
          hematíes: examenesEspeciales.orina.data.hematies,
          cristales: examenesEspeciales.orina.data.cristales,
          bacterias: examenesEspeciales.orina.data.bacterias,
          observaciones: examenesEspeciales.orina.data.observaciones
        }
        await api.createOrina(orinaData)
      }

      if (examenesEspeciales.heces.enabled) {
        const hecesData = {
          paciente_id: selectedPaciente.id,
          fecha: selectedDate,
          color: examenesEspeciales.heces.data.color,
          consistencia: examenesEspeciales.heces.data.consistencia,
          presencia_moco: examenesEspeciales.heces.data.moco,
          presencia_sangre: examenesEspeciales.heces.data.sangre_visible,
          presencia_restos_alimenticios: examenesEspeciales.heces.data.restos_alimenticios,
          ph: examenesEspeciales.heces.data.ph,
          quistes_parasitos: examenesEspeciales.heces.data.quistes_protozoarios,
          trofozoitos: examenesEspeciales.heces.data.trofozoitos,
          huevos_parasitos: examenesEspeciales.heces.data.huevos_helmintos,
          larvas_helmintos: examenesEspeciales.heces.data.larvas_helmintos,
          leucocitos: examenesEspeciales.heces.data.leucocitos,
          hematíes: examenesEspeciales.heces.data.hematies,
          almidón: examenesEspeciales.heces.data.almidon,
          fibras_musculares: examenesEspeciales.heces.data.fibras_musculares,
          grasa: examenesEspeciales.heces.data.grasas_neutras,
          jabon: examenesEspeciales.heces.data.jabon,
          acidos_grasos: examenesEspeciales.heces.data.acidos_grasos,
          bacterias: examenesEspeciales.heces.data.bacterias,
          observaciones: examenesEspeciales.heces.data.observaciones
        }
        await api.createHeces(hecesData)
      }

      setMensaje({ type: 'success', text: '✅ Exámenes guardados correctamente' })

      // Notificar a otras páginas que se agregó un nuevo examen
      localStorage.setItem('examenes_updated', Date.now().toString())

      // Limpiar forma después de 2 segundos
      setTimeout(() => {
        clearForm()
        setMensaje({ type: '', text: '' })
        loadExamenCount()
        loadExamenesDelDia() // Refrescar lista de exámenes del día
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al guardar exámenes' })
    } finally {
      setSubmitting(false)
    }
  }

  // ============ GENERAR PDF ============
  const handleGenerarPDF = async () => {
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
      const doc = new jsPDF()

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
      let ypos = 70

      if (membreteSrc) {
        const headerImg = await new Promise((resolve, reject) => {
          const image = new Image()
          image.crossOrigin = 'anonymous'
          image.onload = () => resolve(image)
          image.onerror = (err) => reject(new Error('No se pudo cargar el membrete'))
          image.src = membreteSrc
        })
        doc.addImage(headerImg, 'PNG', 0, 0, 200, 230)
        ypos = 70
      } else {
        console.warn('No se encontró membresía en formato PNG/JPG; se generará PDF sin membrete.')
        ypos = 20
      }

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

  // ============ VALIDACIÓN DEL FORMULARIO ============
  const isFormComplete = () => {
    // Verificar que hay al menos un resultado ingresado en pruebas normales
    const hasResults = Object.values(resultados).some((valor) => valor && valor.trim() !== '')

    // Verificar que exámenes especiales están completados si están habilitados
    const orinaComplete = !examenesEspeciales.orina.enabled || Object.values(examenesEspeciales.orina.data).some(val => val !== null && val !== '')
    const hecesComplete = !examenesEspeciales.heces.enabled || Object.values(examenesEspeciales.heces.data).some(val => val !== null && val !== '')

    return hasResults || (orinaComplete && hecesComplete && (examenesEspeciales.orina.enabled || examenesEspeciales.heces.enabled))
  }

  const handleEnviarWhatsApp = () => {
    if (!selectedPaciente || (selectedPruebas.length === 0 && !examenesEspeciales.orina && !examenesEspeciales.heces)) {
      setMensaje({ type: 'warning', text: 'Completa el formulario antes de enviar por WhatsApp' })
      return
    }
    if (!isFormComplete()) {
      setMensaje({ type: 'warning', text: 'Ingresa al menos un resultado antes de enviar por WhatsApp' })
      return
    }
    setMensaje({ type: 'info', text: 'Preparando para enviar por WhatsApp...' })
  }

  const handleWhatsAppForRecord = (record) => {
    const nombre = record.paciente_nombre || ''
    const telefono = (record.paciente_telefono || '').replace(/[^\d]/g, '')

    if (!telefono) {
      setMensaje({ type: 'error', text: 'Paciente sin teléfono' })
      return
    }
    const pruebasText = (record.pruebas || [])
      .map((p) => `• ${p}`)
      .join('\n')
    const mensajeTxt = `*Laboratorio Bioclínico*\nLc. Fátima Hernández\n\nHola ${nombre},\n\nAquí tienes tu examen correspondiente al ${record.fecha}.\n\nPruebas realizadas:\n${pruebasText}\n\nPuedes descargar tu examen aquí:\n${record.url_pdf}\n\nGracias por confiar en nosotros.`
    const url = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensajeTxt)}`
    window.open(url, '_blank')
  }

  const handleVerExamen = async (examenId, fallbackUrl = null) => {
    try {
      const response = await api.getExamenPDF(examenId)
      const pdfUrl = response?.url_pdf || fallbackUrl

      if (!pdfUrl) {
        setMensaje({ type: 'error', text: 'No se encontró el PDF del examen' })
        return
      }

      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `examen_${examenId}.pdf`
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      if (fallbackUrl) {
        const link = document.createElement('a')
        link.href = fallbackUrl
        link.download = `examen_${examenId}.pdf`
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      console.error('Error obteniendo PDF del examen:', error)
      setMensaje({ type: 'error', text: 'No se pudo descargar el PDF del examen' })
    }
  }


  // Filtrar pruebas seleccionadas para mostrar en formulario
  const pruebasSeleccionadas = allPruebas.filter((p) => selectedPruebas.includes(p.id))

  return (
    <div className="examenes-container">
      {/* Menú hamburguesa */}
      

      {/* Branding */}
      <BrandingLink />

      {/* Contenido principal */}
      <main className="examenes-content">
        <div className="examenes-wrapper">
          {/* Encabezado con fecha y contador */}
          <div className="examenes-header">
            <div>
              <h1>Exámenes</h1>
              <div className="fecha-info">
                <label>Fecha: </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-fecha"
                />
                <button 
                  className="examen-count btn-examen-count"
                  onClick={handleAbrirModalExamenes}
                  title="Ver exámenes del día"
                >
                  Exámenes del día: <strong>{examenCount}</strong>
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje */}
          {mensaje.text && (
            <div className={`mensaje mensaje-${mensaje.type}`}>
              {mensaje.text}
            </div>
          )}

          {/* Listado de exámenes del día */}
          <div className="examenes-dia-info">
            <span>📅 Exámenes generados el {selectedDate}</span>
            {examenesDelDia.length > 0 && (
              <div className="examenes-dia-list">
                {examenesDelDia.map((rec) => (
                  <div key={rec.id} className="examen-card">
                    <div className="card-header">
                      <strong>
                        {`${rec.paciente?.nombre || rec.paciente_nombre || ''} ${rec.paciente?.apellido || rec.paciente_apellido || ''}`.trim() || 'Paciente'}
                      </strong>
                    </div>
                    <div className="card-body">
                      <p>Fecha: {rec.fecha || selectedDate}</p>
                      <p>Tipo: {rec.tipo || rec.tipo_examen || 'No especificado'}</p>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-secondary btn-ver-examen"
                        onClick={() => handleVerExamen(rec.id, rec.url_pdf)}
                      >
                        Ver examen
                      </button>
                      {rec.url_pdf && (
                        <button
                          className="btn-whatsapp"
                          onClick={() => handleWhatsAppForRecord(rec)}
                        >
                          WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <section className="seccion seccion-busqueda">
            <h2>Buscar Exámenes por Paciente</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o cédula..."
                value={searchExamenPacienteTerm}
                onChange={(e) => handleSearchExamenPaciente(e.target.value)}
                className="input-busqueda"
              />
              {showSearchExamenPacienteResults && searchExamenPacienteResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchExamenPacienteResults.map((paciente) => (
                    <div
                      key={paciente.id}
                      className="search-result-item"
                      onClick={() => selectPacienteForExamenSearch(paciente)}
                    >
                      <strong>{paciente.nombre} {paciente.apellido}</strong>
                      <span className="result-meta">
                        Cédula: {paciente.cedula || '-'} • Tel: {paciente.telefono || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedExamenPaciente && (
              <div className="ficha-paciente-card">
                <div className="ficha-header">
                  <h3>
                    Historial de {selectedExamenPaciente.nombre} {selectedExamenPaciente.apellido}
                  </h3>
                </div>
                {historialExamenesPaciente.length > 0 ? (
                  <div className="examenes-dia-list">
                    {historialExamenesPaciente.map((rec) => (
                      <div key={`hist-${rec.id}`} className="examen-card">
                        <div className="card-body">
                          <p><strong>Fecha:</strong> {rec.fecha || '-'}</p>
                          <p><strong>Pruebas:</strong> {rec.pruebas?.join(', ') || 'Sin pruebas especificadas'}</p>
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn-secondary btn-ver-examen"
                            onClick={() => handleVerExamen(rec.id, rec.url_pdf)}
                          >
                            Generar PDF
                          </button>
                          {rec.url_pdf && (
                            <button
                              className="btn-whatsapp"
                              onClick={() => handleWhatsAppForRecord(rec)}
                            >
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">No hay visitas con PDF para este paciente.</p>
                )}
              </div>
            )}
          </section>

          {/* MODAL: Exámenes del día */}
          {showModalExamenes && (
            <div className="modal-overlay" onClick={() => setShowModalExamenes(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Exámenes del {selectedDate}</h2>
                  <button 
                    className="modal-close"
                    onClick={() => setShowModalExamenes(false)}
                  >
                    ✕
                  </button>
                </div>
                
                {examenesConDetalles.length > 0 ? (
                  <div className="modal-table-container">
                    <table className="modal-table">
                      <thead>
                        <tr>
                          <th>Nombre y Apellido</th>
                          <th>Cédula</th>
                          <th>Teléfono</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examenesConDetalles.map((examen) => (
                          <tr key={examen.id}>
                            <td>{examen.paciente_nombre || '-'}</td>
                            <td>{examen.paciente_cedula || '-'}</td>
                            <td>{examen.paciente_telefono || '-'}</td>
                            <td>
                              <div className="modal-actions">
                                {examen.url_pdf && (
                                  <button
                                    className="btn-small"
                                    onClick={() => window.open(examen.url_pdf, '_blank')}
                                  >
                                    Ver PDF
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="modal-empty">
                    <p>No hay exámenes para esta fecha</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN 1: Búsqueda de Paciente */}
          <section className="seccion seccion-busqueda">
            <h2>1. Seleccionar Paciente</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar paciente por nombre, apellido, cédula o teléfono..."
                value={searchPaciente}
                onChange={(e) => handleSearchPaciente(e.target.value)}
                className="input-busqueda"
                disabled={!!selectedPaciente}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                  {searchResults.map((paciente) => (
                    <div
                      key={paciente.id}
                      className="search-result-item"
                      onClick={() => selectPaciente(paciente)}
                    >
                      <strong>
                        {paciente.nombre} {paciente.apellido}
                      </strong>
                      <span className="result-meta">
                        {paciente.edad} años • {paciente.telefono}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ficha del paciente seleccionado */}
            {selectedPaciente && (
              <div className="ficha-paciente-card">
                <div className="ficha-header">
                  <h3>
                    {selectedPaciente.nombre} {selectedPaciente.apellido}
                  </h3>
                  <button
                    className="btn-cambiar"
                    onClick={() => {
                      setSelectedPaciente(null)
                      setSearchPaciente('')
                    }}
                  >
                    Cambiar
                  </button>
                </div>
                <div className="ficha-details">
                  <p>
                    <span className="label">Edad:</span> {selectedPaciente.edad} años
                  </p>
                  <p>
                    <span className="label">Teléfono:</span> {selectedPaciente.telefono}
                  </p>
                  {selectedPaciente.direccion && (
                    <p>
                      <span className="label">Dirección:</span> {selectedPaciente.direccion}
                    </p>
                  )}
                  {selectedPaciente.sexo && (
                    <p>
                      <span className="label">Sexo:</span> {selectedPaciente.sexo}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* SECCIÓN 2: Seleccionar Pruebas */}
          <section className="seccion seccion-pruebas">
            <h2>2. Seleccionar Pruebas</h2>
            {selectedPaciente ? (
              <>
                {!showPruebasSelection && selectedPruebas.length === 0 ? (
                  <button
                    className="btn-primary btn-large"
                    onClick={() => setShowPruebasSelection(true)}
                    disabled={pruebasLoading}
                  >
                    {pruebasLoading ? 'Cargando pruebas...' : 'Seleccionar Pruebas'}
                  </button>
                ) : null}

                {showPruebasSelection && (
                  <>
                    {/* Exámenes Especiales - Checkboxes Globales */}
                    <div className="examenes-especiales-section">
                      <h3 className="section-title">Exámenes Especiales</h3>
                      <div className="examenes-especiales-checkboxes">
                        <label className="examen-especial-checkbox">
                          <input
                            type="checkbox"
                            checked={examenesEspeciales.orina.enabled}
                            onChange={() => toggleExamenEspecial('orina')}
                          />
                          <span className="checkmark"></span>
                          Examen de Orina
                        </label>
                        <label className="examen-especial-checkbox">
                          <input
                            type="checkbox"
                            checked={examenesEspeciales.heces.enabled}
                            onChange={() => toggleExamenEspecial('heces')}
                          />
                          <span className="checkmark"></span>
                          Examen de Heces
                        </label>
                      </div>

                      {/* Formularios de Exámenes Especiales - desplegables abajo */}
                      {examenesEspeciales.orina.enabled && (
                        <div className="examen-especial-form-container">
                          <div className="examen-especial-card">
                            <div className="examen-header">
                              <div className="examen-icon">📊</div>
                              <div className="examen-title">
                                <h3>Examen Completo de Orina</h3>
                                <p>Análisis físico, químico y microscópico</p>
                              </div>
                            </div>

                            <div className="examen-content">
                              {/* Examen Físico */}
                              <div className="examen-section">
                                <h4 className="section-title">🔬 Examen Físico</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Aspecto</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.aspecto || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'aspecto', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="claro">Claro</option>
                                      <option value="ligeramente_turbio">Ligeramente turbio</option>
                                      <option value="turbio">Turbio</option>
                                      <option value="lechoso">Lechoso</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Color</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.color || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'color', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="amarillo_pajizo">Amarillo pajizo</option>
                                      <option value="amarillo">Amarillo</option>
                                      <option value="amarillo_oscuro">Amarillo oscuro</option>
                                      <option value="incoloro">Incoloro</option>
                                      <option value="rojo">Rojo</option>
                                      <option value="naranja">Naranja</option>
                                      <option value="verde">Verde</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Olor</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.olor || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'olor', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="normal">Normal (aromático)</option>
                                      <option value="amoniacal">Amoniacal</option>
                                      <option value="frutal">Frutal (acetona)</option>
                                      <option value="fecal">Fecal</option>
                                      <option value="otro">Otro</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Densidad</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      min="1.000"
                                      max="1.050"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.densidad || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'densidad', parseFloat(e.target.value) || null)}
                                      placeholder="1.015"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">pH</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="4.0"
                                      max="9.0"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.ph || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'ph', parseFloat(e.target.value) || null)}
                                      placeholder="6.0"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Reacción</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.reaccion || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'reaccion', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="acida">Ácida</option>
                                      <option value="alcalina">Alcalina</option>
                                      <option value="neutra">Neutra</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Examen Químico */}
                              <div className="examen-section">
                                <h4 className="section-title">🧪 Examen Químico</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Albúmina</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.albumina || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'albumina', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                      <option value="++++">++++</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Glucosa</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.glucosa || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'glucosa', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                      <option value="++++">++++</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Nitritos</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.nitritos || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'nitritos', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="positivo">Positivo</option>
                                      <option value="negativo">Negativo</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Bilirrubina</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.bilirrubina || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'bilirrubina', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Urobilinógenos</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.urobilinogenos || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'urobilinogenos', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="normal">Normal</option>
                                      <option value="elevado">Elevado</option>
                                      <option value="ausente">Ausente</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Examen Microscópico */}
                              <div className="examen-section">
                                <h4 className="section-title">🔍 Examen Microscópico</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Células epiteliales</label>
                                    <input
                                      type="number"
                                      min="0"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.celulas_epiteliales || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'celulas_epiteliales', parseInt(e.target.value) || null)}
                                      placeholder="0"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Leucocitos</label>
                                    <input
                                      type="number"
                                      min="0"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.leucocitos || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'leucocitos', parseInt(e.target.value) || null)}
                                      placeholder="0"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Hematíes</label>
                                    <input
                                      type="number"
                                      min="0"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.hematies || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'hematies', parseInt(e.target.value) || null)}
                                      placeholder="0"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Cristales</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.cristales || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'cristales', e.target.value)}
                                      placeholder="Tipo de cristales"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Bacterias</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.bacterias || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'bacterias', e.target.value)}
                                      placeholder="Presencia/ausencia"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Formulario de Examen de Heces */}
                      {examenesEspeciales.heces.enabled && (
                        <div className="examen-especial-form-container">
                          <div className="examen-especial-card">
                            <div className="examen-header">
                              <div className="examen-icon">🧫</div>
                              <div className="examen-title">
                                <h3>Examen Completo de Heces</h3>
                                <p>Análisis macroscópico, parasitológico y coprológico</p>
                              </div>
                            </div>

                            <div className="examen-content">
                              {/* Propiedades Macroscópicas */}
                              <div className="examen-section">
                                <h4 className="section-title">👁️ Propiedades Macroscópicas</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Color</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.color || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'color', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="cafe_claro">Café claro</option>
                                      <option value="cafe">Café</option>
                                      <option value="cafe_oscuro">Café oscuro</option>
                                      <option value="amarillo">Amarillo</option>
                                      <option value="verde">Verde</option>
                                      <option value="negro">Negro</option>
                                      <option value="rojo">Rojo</option>
                                      <option value="blanco">Blanco</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Consistencia</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.consistencia || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'consistencia', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="dura">Dura</option>
                                      <option value="normal">Normal</option>
                                      <option value="blanda">Blanda</option>
                                      <option value="liquida">Líquida</option>
                                      <option value="pastosa">Pastosa</option>
                                      <option value="diarreica">Diarreica</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Moco</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.moco || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'moco', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="ausente">Ausente</option>
                                      <option value="escaso">Escaso</option>
                                      <option value="presente">Presente</option>
                                      <option value="abundante">Abundante</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Sangre visible</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.sangre_visible || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'sangre_visible', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="ausente">Ausente</option>
                                      <option value="escasa">Escasa</option>
                                      <option value="presente">Presente</option>
                                      <option value="abundante">Abundante</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Restos alimenticios</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.restos_alimenticios || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'restos_alimenticios', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="ausentes">Ausentes</option>
                                      <option value="escasos">Escasos</option>
                                      <option value="presentes">Presentes</option>
                                      <option value="abundantes">Abundantes</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">pH</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="4.0"
                                      max="9.0"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.ph || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'ph', parseFloat(e.target.value) || null)}
                                      placeholder="6.5"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Examen Microscópico - Parasitológico */}
                              <div className="examen-section">
                                <h4 className="section-title">🦠 Examen Microscópico - Parasitológico</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Quistes de protozoarios</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.quistes_protozoarios || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'quistes_protozoarios', e.target.value)}
                                      placeholder="Tipo y cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Trofozoítos</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.trofozoitos || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'trofozoitos', e.target.value)}
                                      placeholder="Tipo y cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Huevos de helmintos</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.huevos_helmintos || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'huevos_helmintos', e.target.value)}
                                      placeholder="Tipo y cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Larvas de helmintos</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.larvas_helmintos || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'larvas_helmintos', e.target.value)}
                                      placeholder="Tipo y cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Leucocitos</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.leucocitos || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'leucocitos', e.target.value)}
                                      placeholder="Presencia/ausencia"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Hematíes</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.hematies || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'hematies', e.target.value)}
                                      placeholder="Presencia/ausencia"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Examen Microscópico - Coprológico */}
                              <div className="examen-section">
                                <h4 className="section-title">🍽️ Examen Microscópico - Coprológico</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Almidón</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.almidon || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'almidon', e.target.value)}
                                      placeholder="Presencia/ausencia"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Fibras musculares</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.fibras_musculares || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'fibras_musculares', e.target.value)}
                                      placeholder="Presencia/ausencia"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Grasas neutras</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.grasas_neutras || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'grasas_neutras', e.target.value)}
                                      placeholder="Presencia/ausencia"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Jabón</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.jabon || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'jabon', e.target.value)}
                                      placeholder="Presencia/ausencia"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Ácidos grasos</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.heces.data.acidos_grasos || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'acidos_grasos', e.target.value)}
                                      placeholder="Presencia/ausencia"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Observaciones</label>
                                    <textarea
                                      className="field-textarea"
                                      value={examenesEspeciales.heces.data.observaciones || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'observaciones', e.target.value)}
                                      rows="3"
                                      placeholder="Observaciones adicionales del examen"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selector de Grupos */}
                    {allGrupos.length > 0 && (
                      <GrupoSelector
                        grupos={allGrupos}
                        allPruebas={allPruebas}
                        selectedPruebas={selectedPruebas}
                        onTogglePrueba={togglePrueba}
                        onToggleGrupo={toggleGrupo}
                      />
                    )}

                    <div className="pruebas-grid">
                      <div className="pruebas-list">
                        {allPruebas.length > 0 ? (
                          allPruebas.map((prueba) => (
                            <label key={prueba.id} className="prueba-checkbox-item">
                              <input
                                type="checkbox"
                                checked={selectedPruebas.includes(prueba.id)}
                                onChange={() => togglePrueba(prueba.id)}
                              />
                              <div className="prueba-info">
                                <strong>{prueba.nombre_prueba}</strong>
                                <span className="prueba-unidad">
                                  {prueba.unidad_medida}
                                </span>
                                {prueba.valor_referencia_min !== null &&
                                  prueba.valor_referencia_max !== null && (
                                    <span className="prueba-rango">
                                      Rango: {prueba.valor_referencia_min} -{' '}
                                      {prueba.valor_referencia_max}
                                    </span>
                                  )}
                              </div>
                            </label>
                          ))
                        ) : (
                          <div className="no-pruebas">No hay pruebas disponibles</div>
                        )}
                      </div>
                      <div className="pruebas-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => setShowPruebasSelection(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn-primary"
                          onClick={handleAcceptPruebas}
                          disabled={selectedPruebas.length === 0}
                        >
                          Aceptar ({selectedPruebas.length})
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Mostrar pruebas seleccionadas */}
                {selectedPruebas.length > 0 && !showPruebasSelection && (
                  <div className="selected-pruebas-summary">
                    <p>
                      {selectedPruebas.length} prueba{selectedPruebas.length > 1 ? 's' : ''}{' '}
                      seleccionada{selectedPruebas.length > 1 ? 's' : ''}
                    </p>
                    <button
                      className="btn-text"
                      onClick={() => setShowPruebasSelection(true)}
                    >
                      Modificar selección
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted">Selecciona un paciente primero</p>
            )}
          </section>

          {/* SECCIÓN 3: Ingresar Resultados */}
          {selectedPruebas.length > 0 && (
            <section className="seccion seccion-resultados">
              <h2>3. Ingresar Resultados</h2>
              <div className="resultados-form">
                {pruebasSeleccionadas.map((prueba) => (
                  <div key={prueba.id} className="resultado-item">
                    <div className="resultado-header">
                      <h4>{prueba.nombre_prueba}</h4>
                      <span className="unidad">{prueba.unidad_medida}</span>
                    </div>
                    {(prueba.valor_referencia_min !== null ||
                      prueba.valor_referencia_max !== null) && (
                      <div className="rango-referencia">
                        Rango de referencia: {prueba.valor_referencia_min} -{' '}
                        {prueba.valor_referencia_max}
                      </div>
                    )}
                    <div className="resultado-inputs">
                      <input
                        type="text"
                        placeholder="Resultado"
                        value={resultados[prueba.id] || ''}
                        onChange={(e) =>
                          handleResultadoChange(prueba.id, e.target.value)
                        }
                        className="input-resultado"
                      />
                      <input
                        type="text"
                        placeholder="Observaciones (opcional)"
                        value={observaciones[prueba.id] || ''}
                        onChange={(e) =>
                          handleObservacionesChange(prueba.id, e.target.value)
                        }
                        className="input-observaciones"
                      />
                    </div>

                    {/* Campos especiales para exámenes detallados */}
                    {examenesEspeciales[prueba.id] && (
                      <div className="examen-especial-container">
                        <label className="checkbox-especial">
                          <input
                            type="checkbox"
                            checked={examenesEspeciales[prueba.id].enabled}
                            onChange={() => toggleExamenEspecial(prueba.id)}
                          />
                          <span>Incluir examen {examenesEspeciales[prueba.id].tipo} detallado</span>
                        </label>

                        {showCamposEspeciales[prueba.id] && examenesEspeciales[prueba.id].enabled && (
                          <div className="campos-especiales">
                            {examenesEspeciales[prueba.id].tipo === 'orina' && (
                              <div className="campos-orina">
                                <h5>Examen Físico</h5>
                                <div className="form-grid">
                                  <div className="form-field">
                                    <label>Aspecto</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.aspecto || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'aspecto', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="claro">Claro</option>
                                      <option value="turbio">Turbio</option>
                                      <option value="lechoso">Lechoso</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Color</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.color || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'color', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="amarillo">Amarillo</option>
                                      <option value="incoloro">Incoloro</option>
                                      <option value="rojo">Rojo</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Olor</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.olor || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'olor', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="normal">Normal</option>
                                      <option value="fragrante">Fragrante</option>
                                      <option value="fuerte">Fuerte</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Densidad</label>
                                    <input
                                      type="number"
                                      step="0.001"
                                      min="1.000"
                                      max="1.050"
                                      value={examenesEspeciales[prueba.id].data.densidad || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'densidad', parseFloat(e.target.value) || null)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>pH</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="4.0"
                                      max="9.0"
                                      value={examenesEspeciales[prueba.id].data.ph || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'ph', parseFloat(e.target.value) || null)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Reacción</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.reaccion || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'reaccion', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="acida">Ácida</option>
                                      <option value="alcalina">Alcalina</option>
                                      <option value="neutra">Neutra</option>
                                    </select>
                                  </div>
                                </div>

                                <h5>Examen Químico</h5>
                                <div className="form-grid">
                                  <div className="form-field">
                                    <label>Albúmina</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.albumina || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'albumina', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Glucosa</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.glucosa || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'glucosa', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Cuerpos cetónicos</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.cuerpos_cetonicos || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'cuerpos_cetonicos', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Nitritos</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.nitritos || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'nitritos', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="positivo">Positivo</option>
                                      <option value="negativo">Negativo</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Pigmentos biliares</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.pigmentos_biliares || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'pigmentos_biliares', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Bilirrubina</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.bilirrubina || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'bilirrubina', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Urobilinógeno</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.urobilinogeno || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'urobilinogeno', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="normal">Normal</option>
                                      <option value="elevado">Elevado</option>
                                    </select>
                                  </div>
                                </div>

                                <h5>Examen Microscópico</h5>
                                <div className="form-grid">
                                  <div className="form-field">
                                    <label>Células epiteliales</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={examenesEspeciales[prueba.id].data.celulas_epiteliales || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'celulas_epiteliales', parseInt(e.target.value) || null)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Leucocitos</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={examenesEspeciales[prueba.id].data.leucocitos || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'leucocitos', parseInt(e.target.value) || null)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Piocitos</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={examenesEspeciales[prueba.id].data.piocitos || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'piocitos', parseInt(e.target.value) || null)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Cristales</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.cristales || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'cristales', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Cilindros</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.cilindros || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'cilindros', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Levaduras</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.levaduras || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'levaduras', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Protozoarios</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.protozoarios || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'protozoarios', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Mucina</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.mucina || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'mucina', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Bacterias</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.bacterias || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'bacterias', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Hematíes</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={examenesEspeciales[prueba.id].data.hematies || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'hematies', parseInt(e.target.value) || null)}
                                    />
                                  </div>
                                </div>

                                <div className="form-field">
                                  <label>Observaciones</label>
                                  <textarea
                                    value={examenesEspeciales[prueba.id].data.observaciones || ''}
                                    onChange={(e) => handleExamenEspecialChange(prueba.id, 'observaciones', e.target.value)}
                                    rows="3"
                                  />
                                </div>
                              </div>
                            )}

                            {examenesEspeciales[prueba.id].tipo === 'heces' && (
                              <div className="campos-heces">
                                <h5>Propiedades Macroscópicas</h5>
                                <div className="form-grid">
                                  <div className="form-field">
                                    <label>Color</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.color || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'color', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="cafe">Café</option>
                                      <option value="cafe_oscuro">Café oscuro</option>
                                      <option value="amarillo">Amarillo</option>
                                      <option value="verde">Verde</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Consistencia</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.consistencia || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'consistencia', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="dura">Dura</option>
                                      <option value="normal">Normal</option>
                                      <option value="blanda">Blanda</option>
                                      <option value="liquida">Líquida</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Moco</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.moco || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'moco', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="ausente">Ausente</option>
                                      <option value="presente">Presente</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Sangre oculta</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.sangre_oculta || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'sangre_oculta', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="positivo">Positivo</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>Restos alimenticios</label>
                                    <select
                                      value={examenesEspeciales[prueba.id].data.restos_alimenticios || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'restos_alimenticios', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="ausente">Ausente</option>
                                      <option value="presente">Presente</option>
                                    </select>
                                  </div>
                                  <div className="form-field">
                                    <label>pH</label>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="5.0"
                                      max="8.0"
                                      value={examenesEspeciales[prueba.id].data.ph || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'ph', parseFloat(e.target.value) || null)}
                                    />
                                  </div>
                                </div>

                                <h5>Análisis Microscópico</h5>
                                <div className="form-grid">
                                  <div className="form-field">
                                    <label>Leucocitos</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={examenesEspeciales[prueba.id].data.leucocitos || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'leucocitos', parseInt(e.target.value) || null)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Hematíes</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={examenesEspeciales[prueba.id].data.hematies || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'hematies', parseInt(e.target.value) || null)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Parásitos</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.parasitos || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'parasitos', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Huevos</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.huevos || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'huevos', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Quistes</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.quistes || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'quistes', e.target.value)}
                                    />
                                  </div>
                                  <div className="form-field">
                                    <label>Bacterias</label>
                                    <input
                                      type="text"
                                      value={examenesEspeciales[prueba.id].data.bacterias || ''}
                                      onChange={(e) => handleExamenEspecialChange(prueba.id, 'bacterias', e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="form-field">
                                  <label>Observaciones</label>
                                  <textarea
                                    value={examenesEspeciales[prueba.id].data.observaciones || ''}
                                    onChange={(e) => handleExamenEspecialChange(prueba.id, 'observaciones', e.target.value)}
                                    rows="3"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}



          {/* SECCIÓN 4: Acciones Finales */}
          {selectedPaciente && (selectedPruebas.length > 0 || examenesEspeciales.orina.enabled || examenesEspeciales.heces.enabled) && (
            <section className="seccion seccion-acciones">
              <h2>4. Finalizar</h2>
              <div className="acciones-grid">
                <button
                  className="btn-secondary"
                  onClick={handleGenerarPDF}
                  disabled={submitting || !isFormComplete()}
                  title={!isFormComplete() ? 'Ingresa al menos un resultado' : ''}
                >
                  📄 Generar PDF
                </button>
                <button
                  className="btn-whatsapp"
                  onClick={handleEnviarWhatsApp}
                  disabled={submitting || !isFormComplete()}
                  title={!isFormComplete() ? 'Ingresa al menos un resultado' : ''}
                >
                  💬 Enviar por WhatsApp
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default Examenes

