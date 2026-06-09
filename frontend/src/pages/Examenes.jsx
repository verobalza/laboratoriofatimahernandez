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
  const [hematologiaObservacionGeneral, setHematologiaObservacionGeneral] = useState('')
  const [hematologiaOtros, setHematologiaOtros] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // ============ EXÁMENES ESPECIALES ============
  const [examenesEspeciales, setExamenesEspeciales] = useState({
    orina: { enabled: false, data: {} },
    heces: { enabled: false, data: {} },
    miscelaneos: { enabled: false, data: {} },
    coagulacion: { enabled: false, data: {} },
    perfil20: { enabled: false, data: {
      hemoglobina: "",
      hematocrito: "",
      chcm: "",
      leucocitos: "",
      plaquetas: "",
      segmentados: "",
      linfocitos: "",
      eosinofilos: "",
      monocitos: "",
      bastones: "",
      basofilos: "",
      glicemia: "",
      urea: "",
      creatinina: "",
      acido_urico: "",
      colesterol: "",
      trigliceridos: "",
      hdl: "",
      ldl: "",
      vldl: "",
      bilirrubina_total: "",
      bilirrubina_directa: "",
      bilirrubina_indirecta: "",
      tgo: "",
      tgp: "",
      proteinas_totales: "",
      albumina: "",
      globulinas: "",
      relacion_ag: "",
      fosfatasas_alcalinas: "",
      observaciones: ""
    } }
  })
  const [showCamposEspeciales, setShowCamposEspeciales] = useState({
    orina: false,
    heces: false,
    miscelaneos: false,
    coagulacion: false,
    perfil20: false
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
      
      // Ordenar pruebas: primero por grupo_id y posición, luego por nombre
      const sortedPruebas = (data || [])
        .map((item, index) => ({ ...item, __originalIndex: index }))
        .sort((a, b) => {
          // Agrupar por grupo_id
          if (a.grupo_id !== b.grupo_id) {
            if (a.grupo_id && b.grupo_id) {
              return a.grupo_id.localeCompare(b.grupo_id)
            }
            return a.grupo_id ? -1 : 1
          }

          // Mismo grupo: ordenar por posición
          const posA = a.posicion ?? Infinity
          const posB = b.posicion ?? Infinity
          if (posA !== posB) return posA - posB

          // Misma posición o sin posición: conservar el orden original del backend
          return a.__originalIndex - b.__originalIndex
        })
        .map(({ __originalIndex, ...item }) => item)
      
      setAllPruebas(sortedPruebas)
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

  const HEMATOLOGIA_GRUPO_PRINCIPAL = 'hematología completa'
  const HEMATOLOGIA_SERIES = ['roja', 'blanca', 'plaquetaria']
  const HEMATOLOGIA_ORDER = HEMATOLOGIA_SERIES
  const HEMATOLOGIA_LABELS = {
    roja: 'SERIE ROJA',
    blanca: 'SERIE BLANCA',
    plaquetaria: 'SERIE PLAQUETARIA'
  }

  const normalizeHematologiaSerie = (value = '') => value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const getGrupoByNombre = (nombre) => {
    const target = normalizeHematologiaSerie(nombre)
    return allGrupos.find((g) => normalizeHematologiaSerie(g.nombre || '') === target)
  }

  const gruposSeriesHematologia = HEMATOLOGIA_SERIES.reduce((acc, serie) => {
    const grupoSerie = getGrupoByNombre(`serie ${serie}`)
    if (grupoSerie) acc[serie] = grupoSerie
    return acc
  }, {})

  const getHematologiaPruebas = () => {
    const seriesIds = Object.values(gruposSeriesHematologia).map((g) => g.id)
    return allPruebas.filter((p) => seriesIds.includes(p.grupo_id))
  }

  const getPruebasBySerie = (serie) => {
    const grupoSerie = gruposSeriesHematologia[serie]
    if (!grupoSerie) return []
    return allPruebas.filter((p) => p.grupo_id === grupoSerie.id)
  }

  const getSerieByPrueba = (prueba) => {
    if (!prueba) return ''
    return HEMATOLOGIA_SERIES.find((serie) => gruposSeriesHematologia[serie]?.id === prueba.grupo_id) || ''
  }

  const isHematologiaPrueba = (prueba) => !!getSerieByPrueba(prueba)

  const grupoIncluyeHematologiaCompleta = (grupo) => {
    if (!grupo) return false
    return normalizeHematologiaSerie(grupo.nombre || '') === normalizeHematologiaSerie(HEMATOLOGIA_GRUPO_PRINCIPAL)
  }

  const getPruebasIdsForGrupo = (grupoId) => {
    const pruebasDelGrupo = allPruebas.filter((p) => p.grupo_id === grupoId).map((p) => p.id)
    const grupo = allGrupos.find((g) => g.id === grupoId)
    if (grupo && grupoIncluyeHematologiaCompleta(grupo)) {
      const hematoIds = getHematologiaPruebas().map((p) => p.id)
      // Mantener orden: primero pruebas del grupo, luego hematología (sin duplicados)
      const merged = [...pruebasDelGrupo, ...hematoIds]
      return [...new Map(merged.map(id => [id, id])).keys()]
    }
    return pruebasDelGrupo
  }

  const hematoPruebaIds = getHematologiaPruebas().map((p) => p.id)
  const selectedHematologiaPruebas = getHematologiaPruebas().filter((p) => selectedPruebas.includes(p.id))
  const hematologiaCompleta = hematoPruebaIds.length > 0 && hematoPruebaIds.every((id) => selectedPruebas.includes(id))

  const toggleGrupo = (grupoId) => {
    const grupo = allGrupos.find((g) => g.id === grupoId)
    if (!grupo) return

    const pruebasDelGrupo = getPruebasIdsForGrupo(grupoId)

    setSelectedGrupos((prev) => {
      if (prev.includes(grupoId)) {
        // Deseleccionar grupo
        setSelectedPruebas((prevPruebas) => prevPruebas.filter((id) => !pruebasDelGrupo.includes(id)))
        return prev.filter((id) => id !== grupoId)
      } else {
        // Seleccionar grupo: mantener orden de pruebas
        setSelectedPruebas((prevPruebas) => {
          const merged = [...prevPruebas, ...pruebasDelGrupo]
          // Eliminar duplicados manteniendo orden (Map preserva orden de inserción)
          return [...new Map(merged.map(id => [id, id])).keys()]
        })
        return [...prev, grupoId]
      }
    })
  }

  // ============ FUNCIONES PARA HEMATOLOGÍA ============
  const toggleHematologiaCompleta = () => {
    const hematologiaIds = getHematologiaPruebas().map((p) => p.id)
    if (hematologiaIds.length === 0) return

    if (hematologiaCompleta) {
      setSelectedPruebas((prev) => prev.filter((id) => !hematologiaIds.includes(id)))
    } else {
      setSelectedPruebas((prev) => [...new Set([...prev, ...hematologiaIds])])
    }
  }

  const clearForm = () => {
    setSelectedPaciente(null)
    setSearchPaciente('')
    setSelectedPruebas([])
    setSelectedGrupos([])
    setResultados({})
    setObservaciones({})
    setHematologiaObservacionGeneral('')
    setHematologiaOtros([])
    setExamenesEspeciales({
      orina: { enabled: false, data: {} },
      heces: { enabled: false, data: {} },
      miscelaneos: { enabled: false, data: {} },
      coagulacion: { enabled: false, data: {} },
      perfil20: { enabled: false, data: {} }
    })
    setShowCamposEspeciales({
      orina: false,
      heces: false,
      miscelaneos: false,
      coagulacion: false,
      perfil20: false
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
    if (!hematologiaCompleta) {
      setHematologiaObservacionGeneral('')
    }
  }

  // ============ MANEJO DE RESULTADOS ============
  const handleResultadoChange = (pruebaId, value) => {
    setResultados((prev) => ({ ...prev, [pruebaId]: value }))
  }

  const handleObservacionesChange = (pruebaId, value) => {
    setObservaciones((prev) => ({ ...prev, [pruebaId]: value }))
  }

  // ============ MANEJO DE OTROS EN HEMATOLOGÍA ============
  const handleHematologiaOtroChange = (index, field, value) => {
    const newOtros = [...hematologiaOtros]
    newOtros[index] = { ...newOtros[index], [field]: value }
    setHematologiaOtros(newOtros)
  }

  const addHematologiaOtro = () => {
    setHematologiaOtros([...hematologiaOtros, { celula: '', porcentaje: '' }])
  }

  const removeHematologiaOtro = (index) => {
    setHematologiaOtros(hematologiaOtros.filter((_, i) => i !== index))
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

    if (selectedPruebas.length === 0 && !examenesEspeciales.orina.enabled && !examenesEspeciales.heces.enabled && !examenesEspeciales.miscelaneos.enabled && !examenesEspeciales.coagulacion.enabled && !examenesEspeciales.perfil20.enabled) {
      setMensaje({ type: 'error', text: 'Selecciona al menos una prueba o examen especial' })
      return
    }

    setSubmitting(true)
    try {
      let examenesCreados = []

      // Guardar exámenes normales si hay pruebas seleccionadas
      if (selectedPruebas.length > 0) {
        const examenesData = selectedPruebas.map((pruebaId) => ({
          ...(() => {
            const prueba = allPruebas.find((p) => p.id === pruebaId)
            const isHematologia = !!prueba && getHematologiaPruebas().some((hp) => hp.id === pruebaId)
            const observacionPrueba = observaciones[pruebaId] || ''
            const observacionGeneral = (hematologiaObservacionGeneral || '').trim()
            const mergedObservacion = isHematologia && observacionGeneral
              ? [observacionPrueba, `Observación general hematología: ${observacionGeneral}`].filter(Boolean).join(' | ')
              : observacionPrueba
            return { observaciones: mergedObservacion }
          })(),
          paciente_id: selectedPaciente.id,
          prueba_id: pruebaId,
          fecha: selectedDate,
          resultado: resultados[pruebaId] || ''
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

      if (examenesEspeciales.miscelaneos.enabled) {
        const miscelaneosData = {
          paciente_id: selectedPaciente.id,
          fecha: selectedDate,
          vsg_1hora: examenesEspeciales.miscelaneos.data.vsg_1hora,
          vsg_2hora: examenesEspeciales.miscelaneos.data.vsg_2hora,
          k: examenesEspeciales.miscelaneos.data.k,
          metodo: 'Westergreen',
        }
        await api.createMiscelaneos(miscelaneosData)
      }

      if (examenesEspeciales.coagulacion.enabled) {
        const coagulacionData = {
          paciente_id: selectedPaciente.id,
          fecha: selectedDate,
          pt_paciente: examenesEspeciales.coagulacion.data.pt_paciente,
          seg_control_pt: examenesEspeciales.coagulacion.data.seg_control_pt,
          razon_pc: examenesEspeciales.coagulacion.data.razon_pc,
          v_r: examenesEspeciales.coagulacion.data.v_r,
          isi: examenesEspeciales.coagulacion.data.isi,
          inr: examenesEspeciales.coagulacion.data.inr,
          ptt_paciente: examenesEspeciales.coagulacion.data.ptt_paciente,
          seg_control_ptt: examenesEspeciales.coagulacion.data.seg_control_ptt,
          dif_pc: examenesEspeciales.coagulacion.data.dif_pc,
          vr_diferencia: examenesEspeciales.coagulacion.data.vr_diferencia,
          observaciones: examenesEspeciales.coagulacion.data.observaciones
        }
        await api.createCoagulacion(coagulacionData)
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
    if (!selectedPaciente || (selectedPruebas.length === 0 && !examenesEspeciales.orina.enabled && !examenesEspeciales.heces.enabled && !examenesEspeciales.miscelaneos.enabled && !examenesEspeciales.coagulacion.enabled && !examenesEspeciales.perfil20.enabled)) {
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

      const loadImage = async (src) => {
        return await new Promise((resolve, reject) => {
          const image = new Image()
          image.crossOrigin = 'anonymous'
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
          image.src = src
        })
      }

      const loadImageFromCandidates = async (paths) => {
        for (const src of paths) {
          try {
            const image = await loadImage(src)
            return { image, src }
          } catch (e) {
            // sigue intentando con otro nombre de archivo
          }
        }
        return null
      }

      const membreteResult = await loadImageFromCandidates([
        '/membrete.png',
        '/Membrete Empresa Geométrico Azul.png',
        '/membrete.jpg',
        '/membrete.jpeg'
      ])

      const firmaResult = await loadImageFromCandidates([
        '/firma.png',
        'firma.png',
        '/Firma.png',
        'Firma.png',
        '/firma.jpg',
        '/firma.jpeg'
      ])

      let ypos = 70

      if (membreteResult) {
        const { image: headerImg } = membreteResult
        const headerFormat = membreteResult.src.toLowerCase().endsWith('.jpg') || membreteResult.src.toLowerCase().endsWith('.jpeg') ? 'JPEG' : 'PNG'
        doc.addImage(headerImg, headerFormat, 0, 0, 200, 230)
        ypos = 70
      } else {
        console.warn('No se encontró membresía en formato PNG/JPG; se generará PDF sin membrete.')
        ypos = 10
      }

      // Posicionar contenido debajo del membrete
      doc.setFontSize(10)

      // Línea decorativa
      doc.setLineWidth(0.5)
      doc.setDrawColor(214, 166, 124);
      doc.line(20, ypos, 195, ypos)
      ypos += 7

      // NOMBRE + CÉDULA + SEXO (misma línea)
      doc.setFont("Helvetica", "bold")
      doc.text("Paciente:", 22, ypos)
      doc.setFont("Helvetica", "normal")
      doc.text(`${selectedPaciente.nombre} ${selectedPaciente.apellido}`, 38, ypos)

      doc.setFont("Helvetica", "bold")
      doc.text("Cédula:", 96, ypos)
      doc.setFont("Helvetica", "normal")
      doc.text(`${selectedPaciente.cedula || ''}`, 110, ypos)

      doc.setFont("Helvetica", "bold")
      doc.text("Sexo:", 130, ypos)
      doc.setFont("Helvetica", "normal")
      doc.text(`${selectedPaciente.sexo || ''}`, 148, ypos)
      ypos += 6

      // DIRECCIÓN + EDAD + TELÉFONO
      doc.setFont("Helvetica", "bold")
      doc.text("Dirección:", 22, ypos)
      doc.setFont("Helvetica", "normal")
      doc.text(`${selectedPaciente.direccion || ''}`, 40, ypos)

      doc.setFont("Helvetica", "bold")
      doc.text("Edad:", 96, ypos)
      doc.setFont("Helvetica", "normal")
      doc.text(`${selectedPaciente.edad || ''}`, 110, ypos)

      doc.setFont("Helvetica", "bold")
      doc.text("Teléfono:", 130, ypos)
      doc.setFont("Helvetica", "normal")
      doc.text(`${selectedPaciente.telefono || ''}`, 148, ypos)
      ypos += 6

      // CONVENIO + FECHA
      doc.setFont("Helvetica", "bold")
      doc.text("Convenio:", 22, ypos)
      doc.setFont("Helvetica", "normal")
      doc.text(`${selectedPaciente.convenio || ''}`, 38, ypos)

      doc.setFont("Helvetica", "bold")
      doc.text("Fecha:", 96, ypos)
      doc.setFont("Helvetica", "normal")
      doc.text(`${selectedDate}`, 110, ypos)
      ypos += 7



      // Línea decorativa
      doc.setLineWidth(0.5)
      doc.setDrawColor(214, 166, 126);
      doc.line(20, ypos, 190, ypos)
      ypos += 5
      
      // Volver a tamaño normal
      doc.setFontSize(10)
      doc.setFont("Helvetica", "normal")

      const MAX_PDF_PAGES = 10
      const maxYpos = 270
      const ensurePageSpace = (requiredHeight = 4) => {
        if (ypos + requiredHeight > maxYpos) {
          if (doc.internal.getNumberOfPages() < MAX_PDF_PAGES) {
            doc.addPage()
            ypos = 20
            return true
          }
          console.warn('Límite de 10 páginas alcanzado. El contenido adicional no será agregado.')
          return false
        }
        return true
      }

      function printTwoPerLine(doc, items, x1, x2, x3, ypos) {
        for (let i = 0; i < items.length; i += 3) {

          const col1 = items[i]
          const col2 = items[i + 1] || ""
          const col3 = items[i + 2] || ""

          doc.text(col1, x1, ypos)
          if (col2) doc.text(col2, x2, ypos)
          if (col3) doc.text(col3, x3, ypos)

          ypos += 5
        }
        return ypos
      }


      const printPrueba = (p) => {
        const res = resultados[String(p.id)] || '—'
        const unidad = p.unidad_medida || ''

        let rango = ''
        if (p.tipo_prueba !== 'serologia' && p.valor_referencia_min !== null && p.valor_referencia_max !== null) {
          rango = `(${p.valor_referencia_min} - ${p.valor_referencia_max})`
        }

        if (ypos > 270) {
          doc.addPage()
          ypos = 20
        }

        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.text(p.nombre_prueba, 20, ypos)

        const resultadoUnidad = p.tipo_prueba === 'serologia'
          ? res.toUpperCase()
          : [res, unidad].filter(Boolean).join(' ').trim() || '—'

        const valorNumerico = parseFloat(res)
        const fueraDeRango = (
          p.tipo_prueba === 'numerica' &&
          p.valor_referencia_min !== null &&
          p.valor_referencia_max !== null &&
          !Number.isNaN(valorNumerico) &&
          (valorNumerico < p.valor_referencia_min || valorNumerico > p.valor_referencia_max)
        )

        doc.setFont('Helvetica', 'normal')
        doc.setTextColor(fueraDeRango ? 0 : 80, fueraDeRango ? 0 : 80, fueraDeRango ? 0 : 80)
        doc.text(resultadoUnidad, 140, ypos, 'right')

        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(80, 80, 80)
        if (rango) {
          doc.text(rango, 190, ypos, 'right')
        }
        ypos += 7

        if (p.descripcion) {
          if (ypos > 270) {
            doc.addPage()
            ypos = 20
          }
          doc.setFont('Helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(122, 123, 127)
          const descripcionLines = p.descripcion
            .split('\n')
            .flatMap((line) => doc.splitTextToSize(line, 170))

          descripcionLines.forEach((line) => {
            if (ypos > 270) {
              doc.addPage()
              ypos = 20
            }
            doc.text(line, 140, ypos)
            ypos += 5
          })
          ypos += 2
        }

        if (observaciones[String(p.id)]) {
          if (ypos > 270) {
            doc.addPage()
            ypos = 20
          }
          doc.setFont('Helvetica', 'italic')
          doc.setFontSize(8)
          doc.setTextColor(0, 0, 0)
          doc.text('Observaciones:', 20, ypos)
          ypos += 4
          const obsLines = doc.splitTextToSize(observaciones[String(p.id)], 160)
          obsLines.forEach((line) => {
            if (ypos > 270) {
              doc.addPage()
              ypos = 20
            }
            doc.text(line, 20, ypos)
            ypos += 4
          })
          doc.setFont('Helvetica', 'normal')
          doc.setFontSize(9)
          ypos += 4
        }
      }

      const printGrupoEncabezado = (grupo) => {
        if (!grupo) return
        if (ypos > 270) {
          doc.addPage()
          ypos = 20
        }
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(grupo.nombre.toUpperCase(), 20, ypos)
        ypos += 6
        doc.setLineWidth(0.3)
        doc.line(20, ypos, 190, ypos)
        ypos += 8
      }

      const hematologiaPruebas = pruebasSeleccionadas.filter(isHematologiaPrueba)
      const hematologiaPorSerie = {}
      hematologiaPruebas.forEach((p) => {
        const serie = getSerieByPrueba(p)
        if (!serie) return
        if (!hematologiaPorSerie[serie]) {
          hematologiaPorSerie[serie] = []
        }
        hematologiaPorSerie[serie].push(p)
      })

      const orderedNoHematologia = pruebasSeleccionadas.filter((p) => !isHematologiaPrueba(p))

      const printedGrupoIds = new Set()
      const renderPruebasLista = (listaPruebas) => {
        listaPruebas.forEach((p) => {
          const grupoId = p.grupo_id
          if (grupoId && !printedGrupoIds.has(grupoId)) {
            const grupo = allGrupos.find((g) => g.id === grupoId)
            printGrupoEncabezado(grupo)
            printedGrupoIds.add(grupoId)
          }
          printPrueba(p)
        })
      }

      // Primero imprimir hematología completa
      if (hematologiaPruebas.length > 0) {
        if (ypos > 270) {
          doc.addPage()
          ypos = 20
        }
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(0, 0, 0)
        doc.text('HEMATOLOGÍA COMPLETA', 20, ypos)
        ypos += 8
        doc.setLineWidth(0.4)
        doc.line(20, ypos, 190, ypos)
        ypos += 10

        HEMATOLOGIA_ORDER.forEach((serie, index) => {
          if (hematologiaPorSerie[serie] && hematologiaPorSerie[serie].length > 0) {
            if (ypos > 270) {
              doc.addPage()
              ypos = 20
            }

            // Agregar línea divisoria arriba si no es la primera serie (roja)
            if (index > 0) {
              doc.setLineWidth(0.3)
              doc.line(20, ypos, 190, ypos)
              ypos += 8
            }

            doc.setFont('Helvetica', 'bold')
            doc.setFontSize(11)
            doc.setTextColor(0, 0, 0)
            doc.text(HEMATOLOGIA_LABELS[serie], 20, ypos)
            ypos += 6
            doc.setLineWidth(0.3)
            doc.line(20, ypos, 190, ypos)
            ypos += 8

            hematologiaPorSerie[serie].forEach((p) => {
              printPrueba(p)
            })

            if (serie === 'blanca' && hematologiaOtros.length > 0) {
              if (ypos > 270) {
                doc.addPage()
                ypos = 15
              }

              doc.setFont('Helvetica', 'bold')
              doc.setFontSize(10)
              doc.setTextColor(0, 0, 0)
              doc.text('OTROS', 20, ypos)
              ypos += 5

              hematologiaOtros.forEach((otro) => {
                if (!otro.celula && !otro.porcentaje) return
                if (ypos > 270) {
                  doc.addPage()
                  ypos = 20
                }
                doc.setFont('Helvetica', 'normal')
                doc.setFontSize(9)
                doc.setTextColor(0, 0, 0)
                const celulaNombre = otro.celula || '—'
                const porcentajeText = otro.porcentaje ? `${otro.porcentaje}%` : '—'
                doc.text(celulaNombre, 20, ypos)
                doc.text(porcentajeText, 140, ypos, 'right')
                ypos += 5
              })
              ypos += 4

              if (ypos > 270) {
                doc.addPage()
                ypos = 20
              }
              doc.setLineWidth(0.3)
              doc.line(20, ypos, 190, ypos)
              ypos += 8
            }

            if (serie === 'plaquetaria' && hematologiaObservacionGeneral.trim()) {
              if (ypos > 270) {
                doc.addPage()
                ypos = 20
              }
              doc.setLineWidth(0.3)
              doc.line(20, ypos, 190, ypos)
              ypos += 8
              doc.setFont('Helvetica', 'italic', 'bold')
              doc.setFontSize(9)
              doc.setTextColor(0, 0, 0)
              doc.text('OBSERVACIONES EN SANGRE PERIFÉRICA:', 20, ypos)
              ypos += 5

              const hematoObsLines = doc.splitTextToSize(hematologiaObservacionGeneral.trim(), 160)
              hematoObsLines.forEach((line) => {
                if (ypos > 270) {
                  doc.addPage()
                  ypos = 20
                }
                doc.text(line, 20, ypos)
                ypos += 4
              })
              ypos += 15
            }

            
          }
        })
      }

      // Luego imprimir todas las pruebas no hematológicas
      renderPruebasLista(orderedNoHematologia)

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
        doc.text("EXAMEN FÍSICO", 20, ypos)
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
        ypos = printTwoPerLine(doc, fisicoData, 25, 90, 155, ypos)


        // Examen Químico
        ypos += 3
        doc.setFont("Helvetica", "bold")
        doc.text("EXAMEN QUÍMICO", 20, ypos)
        ypos += 5
        doc.setFont("Helvetica", "normal")
        const quimicoData = [
          `Albúmina: ${examenesEspeciales.orina.data.albumina || 'No especificado'}`,
          `Glucosa: ${examenesEspeciales.orina.data.glucosa || 'No especificado'}`,
          `Cuerpos cetónicos: ${examenesEspeciales.orina.data.cuerpos_cetonicos || 'No especificado'}`,
          `Nitritos: ${examenesEspeciales.orina.data.nitritos || 'No especificado'}`,
          `Pigmentos biliares: ${examenesEspeciales.orina.data.pigmentos_biliares || 'No especificado'}`,
          `Bilirrubina: ${examenesEspeciales.orina.data.bilirrubina || 'No especificado'}`,
          `Urobilinógeno: ${examenesEspeciales.orina.data.urobilinogenos || 'No especificado'}`,
          `Hemoglobina: ${examenesEspeciales.orina.data.hemoglobina || 'No especificado'}`
        ]
        ypos = printTwoPerLine(doc, quimicoData, 25, 90, 155, ypos)


        // Examen Microscópico
        ypos += 3
        doc.setFont("Helvetica", "bold")
        doc.text("EXAMEN MICROSCÓPICO", 20, ypos)
        ypos += 5
        doc.setFont("Helvetica", "normal")
        const microscopicoData = [
          `Células epiteliales: ${examenesEspeciales.orina.data.celulas_epiteliales || 'No especificado'}`,
          `Leucocitos: ${examenesEspeciales.orina.data.leucocitos || 'No especificado'}`,
          `Piocitos: ${examenesEspeciales.orina.data.piocitos || 'No especificado'}`,
          `Bacterias: ${examenesEspeciales.orina.data.bacterias || 'No especificado'}`,
          `Hematíes: ${examenesEspeciales.orina.data.hematies || 'No especificado'}`,
          `Mucina: ${examenesEspeciales.orina.data.mucina || 'No especificado'}`,
          `Cilindros: ${examenesEspeciales.orina.data.cilindros || 'No especificado'}`,
          `Levaduras: ${examenesEspeciales.orina.data.levaduras || 'No especificado'}`,
          `Protozoarios: ${examenesEspeciales.orina.data.protozoarios || 'No especificado'}`
        ]
        // Imprimir en columnas con formato especial para Protozoarios
        for (let i = 0; i < microscopicoData.length; i += 3) {
          const col1 = microscopicoData[i]
          const col2 = microscopicoData[i + 1] || ""
          const col3 = microscopicoData[i + 2] || ""

          doc.text(col1, 25, ypos)
          if (col2) doc.text(col2, 90, ypos)
          if (col3) {
            if (col3.startsWith("Protozoarios: ")) {
              const prefix = "Protozoarios: "
              const value = col3.substring(prefix.length)
              doc.text(prefix, 155, ypos)
              if (value === "Trichomonas vaginalis") {
                const prefixWidth = doc.getTextWidth(prefix)
                doc.setFont("Helvetica", "bolditalic")
                doc.text(value, 155 + prefixWidth, ypos)
                doc.setFont("Helvetica", "normal")
              } else {
                doc.text(value, 155 + doc.getTextWidth(prefix), ypos)
              }
            } else {
              doc.text(col3, 155, ypos)
            }
          }
          ypos += 5
        }

        if (examenesEspeciales.orina.data.observaciones_microscopicas && ensurePageSpace(15)) {
          ypos += 3
          doc.setFont("Helvetica", "bold")
          doc.text("Observaciones:", 20, ypos)
          ypos += 4
          doc.setFont("Helvetica", "normal")
          const obsLines = doc.splitTextToSize(examenesEspeciales.orina.data.observaciones_microscopicas, 160)
          obsLines.forEach(line => {
            if (!ensurePageSpace(4)) return
            doc.text(line, 25, ypos)
            ypos += 4
          })
        }

      }

      if (examenesEspeciales.miscelaneos.enabled) {
        if (ensurePageSpace(20)) {
          ypos += 5
          doc.setFont("Helvetica", "bold")
          doc.setFontSize(11)
          doc.text("MISCELÁNEOS", 20, ypos)
          ypos += 4
          doc.setLineWidth(0.3)
          doc.line(20, ypos, 190, ypos)
          ypos += 4
          doc.setFont("Helvetica", "normal")
          doc.setFontSize(9)

          // VSG 1er Hora
          if (ensurePageSpace(6)) {
            doc.setFont("Helvetica", "bold")
            doc.text("Velocidad sedimentación globular (V.S.G.)", 25, ypos)
            ypos += 5
            
          }

          // VSG 2da Hora
          if (ensurePageSpace(6)) {
            doc.setFont("Helvetica","bold")
            doc.text("1er Hora", 25, ypos)
            ypos += 5
            doc.setFont("Helvetica", "normal")
            doc.text(examenesEspeciales.miscelaneos.data.vsg_1hora ? `${examenesEspeciales.miscelaneos.data.vsg_1hora} mm/h` : 'No especificado', 25, ypos)
            ypos += 5
            doc.setFont("Helvetica", "bold")
            doc.text("2da Hora", 25, ypos)
            ypos += 5
            doc.setFont("Helvetica", "normal")
            doc.text(examenesEspeciales.miscelaneos.data.vsg_2hora ? `${examenesEspeciales.miscelaneos.data.vsg_2hora} mm/h` : 'No especificado', 25, ypos)
            ypos += 5
          }

          // K y Método en dos líneas
          if (ensurePageSpace(8)) {
            doc.text("I.K:", 25, ypos)
            doc.text(examenesEspeciales.miscelaneos.data.k || 'No especificado', 30, ypos)
           
            doc.text("Método:", 50, ypos)
            doc.text("Westergreen", 65, ypos)
            ypos += 5
          }

        }
      }

      if (examenesEspeciales.heces.enabled) {
        if (ensurePageSpace(20)) {
          ypos += 5
          doc.setFont("Helvetica", "bold")
          doc.setFontSize(11)
          doc.text("EXAMEN DE HECES", 20, ypos)
          ypos += 4
          doc.setLineWidth(0.3)
          doc.line(20, ypos, 190, ypos)
          ypos += 4
          doc.setFont("Helvetica", "normal")
          doc.setFontSize(9)

          // Examen Macroscópico
          if (ensurePageSpace(12)) {
            doc.setFont("Helvetica", "bold")
            doc.text("EXAMEN MACROSCÓPICO", 20, ypos)
            ypos += 5
            doc.setFont("Helvetica", "normal")
            const macroData = [
              `Aspecto: ${examenesEspeciales.heces.data.aspecto || 'No especificado'}`,
              `Consistencia: ${examenesEspeciales.heces.data.consistencia || 'No especificado'}`,
              `Color: ${examenesEspeciales.heces.data.color || 'No especificado'}`,
              `Olor: ${examenesEspeciales.heces.data.olor || 'No especificado'}`,
              `Moco: ${examenesEspeciales.heces.data.moco || 'No especificado'}`,
              `Sangre oculta: ${examenesEspeciales.heces.data.sangre_oculta || 'No especificado'}`,
              `Restos alimenticios: ${examenesEspeciales.heces.data.restos_alimenticios || 'No especificado'}`
            ]
            ypos = printTwoPerLine(doc, macroData, 25, 90, 155, ypos)


            // Examen Microscópico
            ypos += 3
            if (ensurePageSpace(12)) {
              doc.setFont("Helvetica", "bold")
              doc.text("EXAMEN MICROSCÓPICO", 20, ypos)
              ypos += 5
              doc.setFont("Helvetica", "normal")
              if (!ensurePageSpace(4)) return
              doc.text("En la muestra se observó:", 25, ypos)
              ypos += 4
              
              const observacionTexto = examenesEspeciales.heces.data.observacion_microscopica || 'No especificado'
              const splitText = doc.splitTextToSize(observacionTexto, 165)
              splitText.forEach(line => {
                if (!ensurePageSpace(4)) return
                doc.text(line, 25, ypos)
                ypos += 10
              })

              const detalleMicroscopico = []
              if (examenesEspeciales.heces.data.recuento) {
                detalleMicroscopico.push(`Recuento Leucocitario: Seg. N.: ${examenesEspeciales.heces.data.recuento}`)
              }
              
              if (examenesEspeciales.heces.data.linf) {
                detalleMicroscopico.push(`Linf: ${examenesEspeciales.heces.data.linf}`)
              }
              if (examenesEspeciales.heces.data.eos) {
                detalleMicroscopico.push(`Eos: ${examenesEspeciales.heces.data.eos}`)
              }
              if (examenesEspeciales.heces.data.mon) {
                detalleMicroscopico.push(`Mon: ${examenesEspeciales.heces.data.mon}`)
              }

              if (detalleMicroscopico.length > 0) {
                if (!ensurePageSpace(6)) return
                const detalleLinea = detalleMicroscopico.join(' / ')
                const splitDetalle = doc.splitTextToSize(detalleLinea, 165)
                splitDetalle.forEach((line) => {
                  if (!ensurePageSpace(4)) return
                  doc.text(line, 25, ypos)
                  ypos += 4
                })
              }
            }
          }

            if (examenesEspeciales.perfil20.enabled) {
              if (ensurePageSpace(20)) {
                ypos += 5
                doc.setFont("Helvetica", "bold")
                doc.setFontSize(11)
                doc.text("EXAMEN DE QUÍMICA SANGUÍNEA (PERFIL 20)", 20, ypos)
                ypos += 6
                doc.setLineWidth(0.3)
                doc.line(20, ypos, 190, ypos)
                ypos += 6
                doc.setFont("Helvetica", "normal")
                doc.setFontSize(9)

                const perfilData = [
                  `Hemoglobina (g/dl): ${examenesEspeciales.perfil20.data.hemoglobina || 'No especificado'}`,
                  `Hematocrito (%): ${examenesEspeciales.perfil20.data.hematocrito || 'No especificado'}`,
                  `C.H.C.M. (%): ${examenesEspeciales.perfil20.data.chcm || 'No especificado'}`,
                  `Leucocitos (mm³): ${examenesEspeciales.perfil20.data.leucocitos || 'No especificado'}`,
                  `Plaquetas (mm³): ${examenesEspeciales.perfil20.data.plaquetas || 'No especificado'}`,
                  `Segmentados (%): ${examenesEspeciales.perfil20.data.segmentados || 'No especificado'}`,
                  `Linfocitos (%): ${examenesEspeciales.perfil20.data.linfocitos || 'No especificado'}`,
                  `Eosinófilos (%): ${examenesEspeciales.perfil20.data.eosinofilos || 'No especificado'}`,
                  `Monocitos (%): ${examenesEspeciales.perfil20.data.monocitos || 'No especificado'}`,
                  `Bastones (%): ${examenesEspeciales.perfil20.data.bastones || 'No especificado'}`,
                  `Basófilos (%): ${examenesEspeciales.perfil20.data.basofilos || 'No especificado'}`,
                  `Glicemia (mg/dl): ${examenesEspeciales.perfil20.data.glicemia || 'No especificado'}`,
                  `Urea (mg/dl): ${examenesEspeciales.perfil20.data.urea || 'No especificado'}`,
                  `Creatinina (mg/dl): ${examenesEspeciales.perfil20.data.creatinina || 'No especificado'}`,
                  `Ácido úrico (mg/dl): ${examenesEspeciales.perfil20.data.acido_urico || 'No especificado'}`,
                  `Colesterol (mg/dl): ${examenesEspeciales.perfil20.data.colesterol || 'No especificado'}`,
                  `Triglicéridos (mg/dl): ${examenesEspeciales.perfil20.data.trigliceridos || 'No especificado'}`,
                  `HDL (mg/dl): ${examenesEspeciales.perfil20.data.hdl || 'No especificado'}`,
                  `LDL (mg/dl): ${examenesEspeciales.perfil20.data.ldl || 'No especificado'}`,
                  `VLDL (mg/dl): ${examenesEspeciales.perfil20.data.vldl || 'No especificado'}`,
                  `Bilirrubina total (mg/dl): ${examenesEspeciales.perfil20.data.bilirrubina_total || 'No especificado'}`,
                  `Bilirrubina directa (mg/dl): ${examenesEspeciales.perfil20.data.bilirrubina_directa || 'No especificado'}`,
                  `Bilirrubina indirecta (mg/dl): ${examenesEspeciales.perfil20.data.bilirrubina_indirecta || 'No especificado'}`,
                  `TGO (U/L): ${examenesEspeciales.perfil20.data.tgo || 'No especificado'}`,
                  `TGP (U/L): ${examenesEspeciales.perfil20.data.tgp || 'No especificado'}`,
                  `Proteínas totales (g/dl): ${examenesEspeciales.perfil20.data.proteinas_totales || 'No especificado'}`,
                  `Albúmina (g/dl): ${examenesEspeciales.perfil20.data.albumina || 'No especificado'}`,
                  `Globulinas (g/dl): ${examenesEspeciales.perfil20.data.globulinas || 'No especificado'}`,
                  `Relación Alb/Glob: ${examenesEspeciales.perfil20.data.relacion_ag || 'No especificado'}`,
                  `Fosfatasas alcalinas (IU/L): ${examenesEspeciales.perfil20.data.fosfatasas_alcalinas || 'No especificado'}`
                ]

                ypos = printTwoPerLine(doc, perfilData, 25, 90, 155, ypos)

                if (examenesEspeciales.perfil20.data.observaciones && ensurePageSpace(10)) {
                  ypos += 4
                  doc.setFont("Helvetica", "bold")
                  doc.text("Observaciones:", 20, ypos)
                  ypos += 4
                  doc.setFont("Helvetica", "normal")
                  const obsLines = doc.splitTextToSize(examenesEspeciales.perfil20.data.observaciones, 160)
                  obsLines.forEach(line => {
                    if (!ensurePageSpace(4)) return
                    doc.text(line, 25, ypos)
                    ypos += 4
                  })
                }
              }
            }
        }
      }

      if (examenesEspeciales.coagulacion.enabled) {
        if (ensurePageSpace(20)) {
          ypos += 5
          doc.setFont("Helvetica", "bold")
          doc.setFontSize(11)
          doc.text("COAGULACIÓN", 20, ypos)
          ypos += 4
          doc.setLineWidth(0.3)
          doc.line(20, ypos, 190, ypos)
          ypos += 4
          doc.setFont("Helvetica", "normal")
          doc.setFontSize(9)
          // 1era línea: P.T. paciente | Control PT | Razón P/C
          if (ensurePageSpace(5)) {
            doc.setFont("Helvetica", "bold")
            doc.text("P.T. paciente:", 25, ypos)
            doc.setFont("Helvetica", "normal")
            doc.text(examenesEspeciales.coagulacion.data.pt_paciente ? `${examenesEspeciales.coagulacion.data.pt_paciente} Seg` : 'No especificado', 50, ypos)
            
            doc.setFont("Helvetica", "bold")
            doc.text("Control P.T.:", 90, ypos)
            doc.setFont("Helvetica", "normal")
            doc.text(examenesEspeciales.coagulacion.data.seg_control_pt ? `${examenesEspeciales.coagulacion.data.seg_control_pt} Seg` : 'No especificado', 110, ypos)
            
            doc.text("Razón P/C:", 155, ypos)
            doc.text(examenesEspeciales.coagulacion.data.razon_pc || 'No especificado', 175, ypos)
            ypos += 5
          }

          // 2da línea: ISI | INR
          if (ensurePageSpace(5)) {
            doc.text("ISI:", 25, ypos)
            doc.text(examenesEspeciales.coagulacion.data.isi || 'No especificado', 31, ypos)
            
            doc.text("INR:", 90, ypos)
            doc.text(examenesEspeciales.coagulacion.data.inr || 'No especificado', 100, ypos)
            ypos += 5
          }

          // 3era línea: P.T.T. Paciente | Control PTT | Dif. P-C | V.R.
          if (ensurePageSpace(5)) {
            doc.setFont("Helvetica", "bold")
            doc.text("P.T.T. Paciente:", 25, ypos)
            doc.setFont("Helvetica", "normal")
            doc.text(examenesEspeciales.coagulacion.data.ptt_paciente ? `${examenesEspeciales.coagulacion.data.ptt_paciente} Seg` : 'No especificado', 50, ypos)
            
            doc.setFont("Helvetica", "bold")
            doc.text("Control P.T.T.:", 90, ypos)
            doc.setFont("Helvetica", "normal")
            doc.text(examenesEspeciales.coagulacion.data.seg_control_ptt ? `${examenesEspeciales.coagulacion.data.seg_control_ptt} Seg` : 'No especificado', 120, ypos)
            
            doc.text("Dif. P-C:", 155, ypos)
            doc.text(examenesEspeciales.coagulacion.data.dif_pc || 'No especificado', 180, ypos)
            ypos += 5
          }

          // Referencias
          if (ensurePageSpace(4)) {
            doc.setFont("Helvetica", "italic")
            doc.setFontSize(8)
            doc.text("Referencia Razón P/C: 0,8 - 1,20", 25, ypos)
            doc.text("V.R. (+/-6seg. diferencia P-C)", 155, ypos)
            doc.setFont("Helvetica", "normal")
            doc.setFontSize(9)
            ypos += 2
          }

          if (examenesEspeciales.coagulacion.data.observaciones && ensurePageSpace(20)) {
            ypos += 1
            doc.setFont("Helvetica", "bold")
            doc.text("Observaciones:", 20, ypos)
            ypos += 5
            doc.setFont("Helvetica", "normal")
            const coagulacionObsLines = doc.splitTextToSize(examenesEspeciales.coagulacion.data.observaciones, 160)
            coagulacionObsLines.forEach(line => {
              if (!ensurePageSpace(4)) return
              doc.text(line, 25, ypos)
              ypos += 4
            })
          }
        }
      }

      if (firmaResult) {
        const firmaFormat = firmaResult.src.toLowerCase().endsWith('.jpg') || firmaResult.src.toLowerCase().endsWith('.jpeg') ? 'JPEG' : 'PNG'
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const firmaWidth = 180
        const firmaHeight = 55
        const firmaX = (pageWidth - firmaWidth) / 2
        const espacioReservado = 20
        const margenFinal = 15

        // Verificar si hay espacio en la página actual para la firma
        if (!ensurePageSpace(espacioReservado)) {
          // Si no hay espacio, la función ensurePageSpace ya creó una nueva página
          // y resetea ypos a 20
        }

        // Posicionar la firma con margen adicional
        const firmaY = Math.max(ypos + margenFinal, pageHeight - 60)

        // Colocar la firma solo en la última página
        const ultimaPagina = doc.internal.getNumberOfPages()
        doc.setPage(ultimaPagina)
        doc.addImage(firmaResult.image, firmaFormat, firmaX, firmaY, firmaWidth, firmaHeight)
      } else {
        console.warn('No se encontró la firma en PDF; se generará el documento sin ella.')
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
        heces: examenesEspeciales.heces.enabled ? examenesEspeciales.heces.data : null,
        miscelaneos: examenesEspeciales.miscelaneos.enabled ? {
          ...examenesEspeciales.miscelaneos.data,
          metodo: 'Wistergreen'
        } : null,
        coagulacion: examenesEspeciales.coagulacion.enabled ? examenesEspeciales.coagulacion.data : null,
        perfil20: examenesEspeciales.perfil20.enabled ? examenesEspeciales.perfil20.data : null
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

    // Permitir generar si hay resultados en pruebas normales o si algún examen especial está habilitado
    const hasEspeciales = examenesEspeciales.orina.enabled || examenesEspeciales.heces.enabled || examenesEspeciales.miscelaneos.enabled || examenesEspeciales.coagulacion.enabled || examenesEspeciales.perfil20.enabled

    return hasResults || hasEspeciales
  }

  const handleEnviarWhatsApp = () => {
    if (!selectedPaciente || (selectedPruebas.length === 0 && !examenesEspeciales.orina.enabled && !examenesEspeciales.heces.enabled && !examenesEspeciales.miscelaneos.enabled && !examenesEspeciales.coagulacion.enabled && !examenesEspeciales.perfil20.enabled)) {
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
    const url = `https://wa.me/58${telefono}?text=${encodeURIComponent(mensajeTxt)}`
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
  const pruebasSeleccionadas = selectedPruebas
    .map((id) => allPruebas.find((p) => p.id === id))
    .filter(Boolean)

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
                    {/* Hematología Completa - Botón especial */}
                    <div className="hematologia-completa-section">
                      <h3 className="section-title">🧬 Hematología</h3>
                      <label className="hematologia-checkbox">
                        <input
                          type="checkbox"
                          checked={hematologiaCompleta}
                          onChange={toggleHematologiaCompleta}
                        />
                        <span className="checkmark"></span>
                        <span className="label-text">
                          <strong>Hematología Completa</strong>
                          <small>(Selecciona automáticamente Serie Roja, Blanca y Plaquetaria)</small>
                        </span>
                      </label>
                    </div>

                    {/* Exámenes Especiales - Checkboxes Globales */}
                    <div className="examenes-especiales-section">
                      <h3 className="section-title">Uronálisis, Copronálisis, Miscelaneos y Coagulación</h3>
                      <div className="examenes-especiales-checkboxes">
                        <label className="examen-especial-checkbox">
                          <input
                            type="checkbox"
                            checked={examenesEspeciales.orina.enabled}
                            onChange={() => toggleExamenEspecial('orina')}
                          />
                          <span className="checkmark"></span>
                          EXAMEN DE ORINA
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
                        <label className="examen-especial-checkbox">
                          <input
                            type="checkbox"
                            checked={examenesEspeciales.perfil20.enabled}
                            onChange={() => toggleExamenEspecial('perfil20')}
                          />
                          <span className="checkmark"></span>
                          PERFIL 20 (Química Sanguínea)
                        </label>
                        <label className="examen-especial-checkbox">
                          <input
                            type="checkbox"
                            checked={examenesEspeciales.miscelaneos.enabled}
                            onChange={() => toggleExamenEspecial('miscelaneos')}
                          />
                          <span className="checkmark"></span>
                          Misceláneos
                        </label>
                        <label className="examen-especial-checkbox">
                          <input
                            type="checkbox"
                            checked={examenesEspeciales.coagulacion.enabled}
                            onChange={() => toggleExamenEspecial('coagulacion')}
                          />
                          <span className="checkmark"></span>
                          Coagulación
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
                                      <option value="turbio">Ligeramente turbio</option>
                                      <option value="lechoso">Turbio</option>
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
                                      <option value="amarillo">Amarillo</option>
                                      <option value="incoloro">Rojizo</option>
                                      <option value="incoloro">Ambar</option>
                                      <option value="rojo">incoloro</option>
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
                                      <option value="normal">Amoniacal</option>
                                      <option value="fragrante">Característico</option>
                                      <option value="fuerte">Suigeneris</option>
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
                                      onChange={(e) => handleExamenEspecialChange('orina', 'densidad', e.target.value)}
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
                                      onChange={(e) => handleExamenEspecialChange('orina', 'ph', e.target.value)}
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
                                      <option value="ácida">Ácida</option>
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
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Cuerpos cetónicos</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.cuerpos_cetonicos || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'cuerpos_cetonicos', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Pigmentos biliares</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.pigmentos_biliares || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'pigmentos_biliares', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Hemoglobina</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.hemoglobina || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'hemoglobina', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="negativo">Negativo</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
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
                                      <option value="negativo">+</option>
                                      <option value="negativo">-</option>
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
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.celulas_epiteliales || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'celulas_epiteliales', e.target.value)}
                                      placeholder="Cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Leucocitos</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.leucocitos || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'leucocitos', e.target.value)}
                                      placeholder="Cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Piocitos</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.piocitos || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'piocitos', e.target.value)}
                                      placeholder="Cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Bacterias</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.bacterias || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'bacterias', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="Escasas">Escasas</option>
                                      <option value="Moderadas">Moderadas</option>
                                      <option value="Abundantes">Abundantes</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Hematíes</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.hematies || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'hematies', e.target.value)}
                                      placeholder="Cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Mucina</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.mucina || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'mucina', e.target.value)}
                                      placeholder="Texto libre"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Cilindros</label>
                                    <input
                                      type="text"
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.cilindros || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'cilindros', e.target.value)}
                                      placeholder="Tipo/cantidad"
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Levaduras</label>
                                    <input
                                      type='text'
                                      className="field-input"
                                      value={examenesEspeciales.orina.data.levaduras || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'levaduras', e.target.value)}
                                      placeholder='Levadura'
                                    />
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Protozoarios</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.protozoarios || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'protozoarios', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="Trichomonas vaginalis">Trichomonas vaginalis</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Cristales</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.orina.data.cristales || ''}
                                      onChange={(e) => handleExamenEspecialChange('orina', 'cristales', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="oxalatos">Oxalatos</option>
                                      <option value="ácido úrico">Ácido úrico</option>
                                      <option value="uratos">Uratos</option>
                                      <option value="otros">-</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Observaciones */}
                                <div className="examen-section">
                                  <h5 className="section-title">Observaciones Microscópicas</h5>
                                  <textarea
                                    className="field-textarea"
                                    value={examenesEspeciales.orina.data.observaciones_microscopicas || ''}
                                    onChange={(e) => handleExamenEspecialChange('orina', 'observaciones_microscopicas', e.target.value)}
                                    placeholder="Ingrese observaciones..."
                                    rows="4"
                                  />
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
                                <h3>EXAMEN DE HECES</h3>
                                <p>Análisis macroscópico y microscópico</p>
                              </div>
                            </div>

                            <div className="examen-content">
                              {/* Examen Macroscópico */}
                              <div className="examen-section">
                                <h4 className="section-title">👁️ Examen Macroscópico</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Aspecto</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.aspecto || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'aspecto', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="Homogéneo">Homogéneo</option>
                                      <option value="Heterogéneo">Heterogéneo</option>
                                    
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
                                    <label className="field-label">Color</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.color || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'color', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="Marrón">Marrón</option>
                                      <option value="Marrón claro">Marrón claro</option>
                                      <option value="Marrón oscuro">Marrón oscuro</option>
                                      <option value="amarillo">Amarillo</option>
                                      <option value="verdozo">Verdozo</option>
                                      <option value="Rojizo">Rojizo</option>
                                      <option value="Negro">Negro</option>
                                      <option value="Blanco">Blanco</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Olor</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.olor || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'olor', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="Normal">Normal</option>
                                      <option value="Fecal">Fecal</option>
                                      <option value="Fétido">Fétido</option>
                                    
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
                                      <option value="abundante">Moderado</option>
                                    </select>
                                  </div>

                                  <div className="field-group">
                                    <label className="field-label">Sangre oculta</label>
                                    <select
                                      className="field-select"
                                      value={examenesEspeciales.heces.data.sangre_oculta || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'sangre_oculta', e.target.value)}
                                    >
                                      <option value="">Seleccionar</option>
                                      <option value="-">-</option>
                                      <option value="+">+</option>
                                      <option value="++">++</option>
                                      <option value="+++">+++</option>
                                      <option value="NO ESPECIFICADO">NO ESPECIFICADO</option>
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
                                </div>
                              </div>

                              {/* Examen Microscópico */}
                              <div className="examen-section">
                                <h4 className="section-title">🔍 Examen Microscópico</h4>
                                <div className="fields-grid">
                                  <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="field-label">En la muestra se observó:</label>
                                    <textarea
                                      className="field-textarea"
                                      value={examenesEspeciales.heces.data.observacion_microscopica || ''}
                                      onChange={(e) => handleExamenEspecialChange('heces', 'observacion_microscopica', e.target.value)}
                                      rows="4"
                                      placeholder="Descripción de hallazgos microscópicos"
                                    />
                                  </div>

                                  <div className="fields-row">
                                    <div className="field-group">
                                      <label className="field-label">Recuento Leucocitario: Seg. N.</label>
                                      <input
                                        type="text"
                                        className="field-input"
                                        value={examenesEspeciales.heces.data.recuento || ''}
                                        onChange={(e) => handleExamenEspecialChange('heces', 'recuento', e.target.value)}
                                        placeholder="Recuento"
                                      />
                                    </div>

                                    <div className="field-group">
                                      <label className="field-label">Linf</label>
                                      <input
                                        type="text"
                                        className="field-input"
                                        value={examenesEspeciales.heces.data.linf || ''}
                                        onChange={(e) => handleExamenEspecialChange('heces', 'linf', e.target.value)}
                                        placeholder="Linf"
                                      />
                                    </div>
                                    <div className="field-group">
                                      <label className="field-label">Eos</label>
                                      <input
                                        type="text"
                                        className="field-input"
                                        value={examenesEspeciales.heces.data.eos || ''}
                                        onChange={(e) => handleExamenEspecialChange('heces', 'eos', e.target.value)}
                                        placeholder="Eos"
                                      />
                                    </div>
                                    <div className="field-group">
                                      <label className="field-label">Mon</label>
                                      <input
                                        type="text"
                                        className="field-input"
                                        value={examenesEspeciales.heces.data.mon || ''}
                                        onChange={(e) => handleExamenEspecialChange('heces', 'mon', e.target.value)}
                                        placeholder="Mon"
                                      />
                                    </div>
                                  </div>

                                  <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={examenesEspeciales.heces.data.no_se_observaron_parasitos || false}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked
                                          if (isChecked) {
                                            handleExamenEspecialChange('heces', 'observacion_microscopica', 'NO SE OBSERVARON FORMAS PARASITARIAS EN LA MUESTRA EXAMINADA.')
                                            handleExamenEspecialChange('heces', 'no_se_observaron_parasitos', true)
                                          } else {
                                            handleExamenEspecialChange('heces', 'observacion_microscopica', '')
                                            handleExamenEspecialChange('heces', 'no_se_observaron_parasitos', false)
                                          }
                                        }}
                                      />
                                      <span>NO SE OBSERVARON FORMAS PARASITARIAS EN LA MUESTRA EXAMINADA</span>
                                    </label>
                                  </div>

                                  <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={examenesEspeciales.heces.data.no_hay_recuento_leucocitario || false}
                                        onChange={(e) => {
                                          handleExamenEspecialChange('heces', 'no_hay_recuento_leucocitario', e.target.checked)
                                        }}
                                      />
                                      <span>NO HAY CRITERIO PARA RECUENTO LEUCOCITARIO</span>
                                    </label>
                                  </div>
                                </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      )}

                    {examenesEspeciales.miscelaneos.enabled && (
                      <div className="examen-especial-form-container">
                        <div className="examen-especial-card">
                          <div className="examen-header">
                            <div className="examen-icon">🧾</div>
                            <div className="examen-title">
                              <h3>Misceláneos</h3>
                              <p>Examen de VSG, K y método</p>
                            </div>
                          </div>

                          <div className="examen-content">
                            <div className="examen-section">
                              <h4 className="section-title">Resultados</h4>
                              <div className="fields-grid">
                                <div className="field-group">
                                  <label className="field-label"> (V.S.G.) 1er Hora</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.miscelaneos.data.vsg_1hora || ''}
                                    onChange={(e) => handleExamenEspecialChange('miscelaneos', 'vsg_1hora', e.target.value)}
                                    placeholder="mm/h"
                                  />
                                </div>
                                <div className="field-group">
                                  <label className="field-label"> (V.S.G.) 2da Hora</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.miscelaneos.data.vsg_2hora || ''}
                                    onChange={(e) => handleExamenEspecialChange('miscelaneos', 'vsg_2hora', e.target.value)}
                                    placeholder="mm/h"
                                  />
                                </div>
                                <div className="field-group">
                                  <label className="field-label">I.K.</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.miscelaneos.data.k || ''}
                                    onChange={(e) => handleExamenEspecialChange('miscelaneos', 'k', e.target.value)}
                                    placeholder="I.K."
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="examen-section">
                              <h4 className="section-title">Método</h4>
                              <p className="field-value">Westergreen</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                      {examenesEspeciales.perfil20.enabled && (
                        <div className="examen-especial-form-container">
                          <div className="examen-especial-card">
                            <div className="examen-header">
                              <div className="examen-icon">🧪</div>
                              <div className="examen-title">
                                <h3>PERFIL 20 (Química Sanguínea)</h3>
                                <p>Hematología básica, diferencial y química sanguínea</p>
                              </div>
                            </div>

                            <div className="examen-content">
                              <div className="examen-section">
                                <h4 className="section-title">1. Hematología básica</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Hemoglobina (g/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.hemoglobina || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'hemoglobina', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Hematocrito (%)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.hematocrito || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'hematocrito', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">C.H.C.M. (%)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.chcm || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'chcm', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Leucocitos (mm³)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.leucocitos || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'leucocitos', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Plaquetas (mm³)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.plaquetas || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'plaquetas', e.target.value)} />
                                  </div>
                                </div>
                              </div>

                              <div className="examen-section">
                                <h4 className="section-title">2. Hemograma diferencial</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Segmentados (%)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.segmentados || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'segmentados', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Linfocitos (%)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.linfocitos || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'linfocitos', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Eosinófilos (%)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.eosinofilos || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'eosinofilos', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Monocitos (%)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.monocitos || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'monocitos', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Bastones (%)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.bastones || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'bastones', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Basófilos (%)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.basofilos || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'basofilos', e.target.value)} />
                                  </div>
                                </div>
                              </div>

                              <div className="examen-section">
                                <h4 className="section-title">3. Química sanguínea (Perfil 20)</h4>
                                <div className="fields-grid">
                                  <div className="field-group">
                                    <label className="field-label">Glicemia (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.glicemia || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'glicemia', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Urea (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.urea || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'urea', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Creatinina (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.creatinina || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'creatinina', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Ácido úrico (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.acido_urico || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'acido_urico', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Colesterol (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.colesterol || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'colesterol', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Triglicéridos (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.trigliceridos || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'trigliceridos', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">HDL (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.hdl || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'hdl', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">LDL (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.ldl || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'ldl', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">VLDL (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.vldl || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'vldl', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Bilirrubina total (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.bilirrubina_total || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'bilirrubina_total', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Bilirrubina directa (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.bilirrubina_directa || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'bilirrubina_directa', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Bilirrubina indirecta (mg/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.bilirrubina_indirecta || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'bilirrubina_indirecta', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">TGO (U/L)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.tgo || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'tgo', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">TGP (U/L)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.tgp || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'tgp', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Proteínas totales (g/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.proteinas_totales || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'proteinas_totales', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Albúmina (g/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.albumina || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'albumina', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Globulinas (g/dl)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.globulinas || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'globulinas', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Relación Alb/Glob</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.relacion_ag || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'relacion_ag', e.target.value)} />
                                  </div>
                                  <div className="field-group">
                                    <label className="field-label">Fosfatasas alcalinas (IU/L)</label>
                                    <input type="text" className="field-input" value={examenesEspeciales.perfil20.data.fosfatasas_alcalinas || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'fosfatasas_alcalinas', e.target.value)} />
                                  </div>
                                </div>
                              </div>

                              <div className="examen-section">
                                <h5 className="section-title">Observaciones</h5>
                                <textarea className="field-textarea" rows="4" value={examenesEspeciales.perfil20.data.observaciones || ''} onChange={(e) => handleExamenEspecialChange('perfil20', 'observaciones', e.target.value)} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {examenesEspeciales.coagulacion.enabled && (
                      <div className="examen-especial-form-container">
                        <div className="examen-especial-card">
                          <div className="examen-header">
                            <div className="examen-icon">🩸</div>
                            <div className="examen-title">
                              <h3>Coagulación</h3>
                              <p>PT, PTT, INR y parámetros de coagulación</p>
                            </div>
                          </div>

                          <div className="examen-content">
                            <div className="examen-section">
                              <h4 className="section-title">Resultados</h4>
                              <div className="fields-grid">
                                <div className="field-group">
                                  <label className="field-label">P.T. paciente</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.coagulacion.data.pt_paciente || ''}
                                    onChange={(e) => handleExamenEspecialChange('coagulacion', 'pt_paciente', e.target.value)}
                                    placeholder="Segundos"
                                  />
                                </div>
                                <div className="field-group">
                                  <label className="field-label">Control</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.coagulacion.data.seg_control_pt || ''}
                                    onChange={(e) => handleExamenEspecialChange('coagulacion', 'seg_control_pt', e.target.value)}
                                    placeholder="Segundos"
                                  />
                                </div>
                                <div className="field-group">
                                  <label className="field-label">Razón P/C</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.coagulacion.data.razon_pc || ''}
                                    onChange={(e) => handleExamenEspecialChange('coagulacion', 'razon_pc', e.target.value)}
                                    placeholder="Razón P/C"
                                  />
                                  <div className="rango-referencia">Referencia V.R.: 0,8 - 1,20</div>
                                </div>
                                <div className="field-group">
                                  <label className="field-label">ISI</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.coagulacion.data.isi || ''}
                                    onChange={(e) => handleExamenEspecialChange('coagulacion', 'isi', e.target.value)}
                                   placeholder='ISI'
                                  />
                                </div>
                                <div className="field-group">
                                  <label className="field-label">INR</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.coagulacion.data.inr || ''}
                                    onChange={(e) => handleExamenEspecialChange('coagulacion', 'inr', e.target.value)}
                                    placeholder="Valor"
                                  />
                                </div>
                                <div className="field-group">
                                  <label className="field-label">P.T.T. Paciente</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.coagulacion.data.ptt_paciente || ''}
                                    onChange={(e) => handleExamenEspecialChange('coagulacion', 'ptt_paciente', e.target.value)}
                                    placeholder="Segundos"
                                  />
                                </div>
                                <div className="field-group">
                                  <label className="field-label">Control</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.coagulacion.data.seg_control_ptt || ''}
                                    onChange={(e) => handleExamenEspecialChange('coagulacion', 'seg_control_ptt', e.target.value)}
                                    placeholder="Segundos"
                                  />
                                </div>
                                <div className="field-group">
                                  <label className="field-label">Dif. P-C</label>
                                  <input
                                    type="text"
                                    className="field-input"
                                    value={examenesEspeciales.coagulacion.data.dif_pc || ''}
                                    onChange={(e) => handleExamenEspecialChange('coagulacion', 'dif_pc', e.target.value)}
                                    placeholder="Valor"
                                  />
                                  <div className="rango-referencia">V.R. (+/-6seg. diferencia P-C)</div>
                                </div>
                              </div>
                            </div>

                            <div className="examen-section">
                              <h4 className="section-title">Observaciones</h4>
                              <div className="field-group">
                                <label className="field-label">Observaciones</label>
                                <textarea
                                  className="field-textarea"
                                  value={examenesEspeciales.coagulacion.data.observaciones || ''}
                                  onChange={(e) => handleExamenEspecialChange('coagulacion', 'observaciones', e.target.value)}
                                  rows="3"
                                  placeholder="Observaciones adicionales"
                                />
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
                {/* Bloque especial de Hematología si hay pruebas de hematología seleccionadas */}
                {selectedHematologiaPruebas.length > 0 && (
                  <div className="hematologia-resultados-section">
                    <h3 className="hematologia-titulo">
                      🧬 {hematologiaCompleta ? 'Hematología Completa' : 'Hematología'}
                    </h3>

                    {/* Serie Roja */}
                    <div className="hematologia-serie">
                      <h4 className="serie-titulo">Serie Roja</h4>
                      {getPruebasBySerie('roja')
                        .filter((p) => selectedPruebas.includes(p.id))
                        .map((prueba) => (
                          <div key={prueba.id} className="resultado-item hematologia-item">
                            <div className="resultado-header">
                              <h5>{prueba.nombre_prueba}</h5>
                              {prueba.unidad_medida && <span className="unidad">{prueba.unidad_medida}</span>}
                            </div>
                            {prueba.valor_referencia_min !== null && prueba.valor_referencia_max !== null && (
                              <div className="rango-referencia">
                                Rango: {prueba.valor_referencia_min} - {prueba.valor_referencia_max}
                              </div>
                            )}
                            <div className="resultado-inputs">
                              <input
                                type="text"
                                placeholder="Resultado"
                                value={resultados[prueba.id] || ''}
                                onChange={(e) => handleResultadoChange(prueba.id, e.target.value)}
                                className="input-resultado"
                              />
                            </div>
                          
                          </div>
                        ))}
                    </div>

                    <hr className="serie-divider" />

                    {/* Serie Blanca */}
                    <div className="hematologia-serie">
                      <h4 className="serie-titulo">Serie Blanca</h4>
                      {getPruebasBySerie('blanca')
                        .filter((p) => selectedPruebas.includes(p.id))
                        .map((prueba) => (
                          <div key={prueba.id} className="resultado-item hematologia-item">
                            <div className="resultado-header">
                              <h5>{prueba.nombre_prueba}</h5>
                              {prueba.unidad_medida && <span className="unidad">{prueba.unidad_medida}</span>}
                            </div>
                            {prueba.valor_referencia_min !== null && prueba.valor_referencia_max !== null && (
                              <div className="rango-referencia">
                                Rango: {prueba.valor_referencia_min} - {prueba.valor_referencia_max}
                              </div>
                            )}
                            <div className="resultado-inputs">
                              <input
                                type="text"
                                placeholder="Resultado"
                                value={resultados[prueba.id] || ''}
                                onChange={(e) => handleResultadoChange(prueba.id, e.target.value)}
                                className="input-resultado"
                              />
                            </div>
                            
                          </div>
                        ))}
                    </div>

                    <hr className="serie-divider" />

                    {/* Otros en Hematología */}
                    <div className="hematologia-otros">
                      <h4 className="serie-titulo">Otros</h4>
                      {hematologiaOtros.map((otro, index) => (
                        <div key={index} className="otro-item">
                          <div className="otro-inputs">
                            <input
                              type="text"
                              placeholder="Nombre de la célula"
                              value={otro.celula || ''}
                              onChange={(e) => handleHematologiaOtroChange(index, 'celula', e.target.value)}
                              className="input-celula"
                            />
                            <input
                              type="number"
                              placeholder="Porcentaje"
                              value={otro.porcentaje || ''}
                              onChange={(e) => handleHematologiaOtroChange(index, 'porcentaje', e.target.value)}
                              className="input-porcentaje"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="porcentaje-symbol">%</span>
                            <button
                              type="button"
                              onClick={() => removeHematologiaOtro(index)}
                              className="btn-remove-otro"
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addHematologiaOtro}
                        className="btn-add-otro"
                      >
                        + Agregar
                      </button>
                    </div>

                    {/* Serie Plaquetaria */}
                    <div className="hematologia-serie">
                      <h4 className="serie-titulo">Serie Plaquetaria</h4>
                      {getPruebasBySerie('plaquetaria')
                        .filter((p) => selectedPruebas.includes(p.id))
                        .map((prueba) => (
                          <div key={prueba.id} className="resultado-item hematologia-item">
                            <div className="resultado-header">
                              <h5>{prueba.nombre_prueba}</h5>
                              {prueba.unidad_medida && <span className="unidad">{prueba.unidad_medida}</span>}
                            </div>
                            {prueba.valor_referencia_min !== null && prueba.valor_referencia_max !== null && (
                              <div className="rango-referencia">
                                Rango: {prueba.valor_referencia_min} - {prueba.valor_referencia_max}
                              </div>
                            )}
                            <div className="resultado-inputs">
                              <input
                                type="text"
                                placeholder="Resultado"
                                value={resultados[prueba.id] || ''}
                                onChange={(e) => handleResultadoChange(prueba.id, e.target.value)}
                                className="input-resultado"
                              />
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="hematologia-observacion-general">
                      <h4 className="serie-titulo">Observaciones en sangre periférica</h4>
                      <textarea
                        placeholder="Escribe aquí las observaciones en sangre periférica..."
                        value={hematologiaObservacionGeneral}
                        onChange={(e) => setHematologiaObservacionGeneral(e.target.value)}
                        className="input-observaciones"
                        rows="3"
                      />
                    </div>
                  </div>
                )}

                {pruebasSeleccionadas
                  .filter((prueba) => {
                    // Excluir pruebas de hematología si Hematología Completa está activada
                    if (hematologiaCompleta) {
                      const serie = getSerieByPrueba(prueba)
                      return !['roja', 'blanca', 'plaquetaria'].includes(serie)
                    }
                    return true
                  })
                  .map((prueba) => (
                  <div key={prueba.id} className="resultado-item">
                    <div className="resultado-header">
                      <h4>{prueba.nombre_prueba}</h4>
                      {prueba.tipo_prueba === 'numerica' && (
                        <span className="unidad">{prueba.unidad_medida}</span>
                      )}
                    </div>
                    {prueba.tipo_prueba === 'numerica' && (
                      prueba.valor_referencia_min !== null ||
                      prueba.valor_referencia_max !== null
                    ) && (
                      <div className="rango-referencia">
                        Rango de referencia: {prueba.valor_referencia_min} -{' '}
                        {prueba.valor_referencia_max}
                      </div>
                    )}
                    <div className="resultado-inputs">
                      {prueba.tipo_prueba === 'serologia' ? (
                        <select
                          value={resultados[prueba.id] || ''}
                          onChange={(e) =>
                            handleResultadoChange(prueba.id, e.target.value)
                          }
                          className="input-resultado"
                        >
                          <option value="">Seleccionar resultado...</option>
                          <option value="positivo">Positivo</option>
                          <option value="negativo">Negativo</option>
                          <option value="reactivo">Reactivo</option>
                          <option value="no reactivo">No reactivo</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Resultado"
                          value={resultados[prueba.id] || ''}
                          onChange={(e) =>
                            handleResultadoChange(prueba.id, e.target.value)
                          }
                          className="input-resultado"
                        />
                      )}
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
          {selectedPaciente && (selectedPruebas.length > 0 || examenesEspeciales.orina.enabled || examenesEspeciales.heces.enabled || examenesEspeciales.miscelaneos.enabled || examenesEspeciales.coagulacion.enabled || examenesEspeciales.perfil20.enabled) && (
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

