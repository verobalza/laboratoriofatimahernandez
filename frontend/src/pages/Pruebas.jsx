/**
 * Pruebas.jsx
 * 
 * Página de gestión de pruebas de laboratorio.
 * Permite crear, buscar, listar y editar pruebas.
 * 
 * Funcionalidad:
 * - Listar todas las pruebas con su cantidad total
 * - Buscar pruebas por nombre
 * - Crear nuevas pruebas mediante modal
 * - Validación de campos obligatorios
 * - Diseño coherente con dashboard (azul suave, minimalista, profesional)
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import BrandingLink from '../components/BrandingLink'
import api from '../services/api'
import './Pruebas.css'

function Pruebas() {
  const navigate = useNavigate()

  // ============ ESTADO GENERAL ============
  const [pruebasTotal, setPruebasTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState({ type: '', text: '' })

  // ============ BÚSQUEDA ============
  const [searchTerm, setSearchTerm] = useState('')
  const [pruebas, setPruebas] = useState([])
  const [displayedPruebas, setDisplayedPruebas] = useState([])

  // ============ MODAL FORMULARIO ============
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre_prueba: '',
    unidad_medida: '',
    tipo_muestra: '',
    valor_referencia_min: '',
    valor_referencia_max: '',
    descripcion: '',
    precio_bs: '',
    precio_usd: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [selectedPruebaId, setSelectedPruebaId] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // ============ TASA DE CAMBIO ============
  const [tasaCambio, setTasaCambio] = useState(45)

  // ============ MODAL CREAR GRUPO ============
  const [modalGrupoOpen, setModalGrupoOpen] = useState(false)
  const [grupoFormData, setGrupoFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  })
  const [selectedPruebasGrupo, setSelectedPruebasGrupo] = useState([])
  const [grupoErrors, setGrupoErrors] = useState({})
  const [grupoSubmitting, setGrupoSubmitting] = useState(false)

  // ============ LISTA DE GRUPOS ============
  const [grupos, setGrupos] = useState([])
  const [gruposLoading, setGruposLoading] = useState(false)
  const [grupoEnEdicion, setGrupoEnEdicion] = useState(null)
  const [modalEditarGrupoOpen, setModalEditarGrupoOpen] = useState(false)
  const [gruposExpandidos, setGruposExpandidos] = useState({}) // Rastrear qué grupos están expandidos

  // ============ UNIDADES Y TIPOS ============
  const [unidadesMedida, setUnidadesMedida] = useState([])
  const [tiposMuestra, setTiposMuestra] = useState([])

  // ============ MENÚ HAMBURGUESA ============
  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Facturación', icon: '💳', onClick: () => navigate('/facturacion') },
    { label: 'Inventario', icon: '📦', onClick: () => navigate('/inventario') },
    { label: 'Registro financiero', icon: '💰', onClick: () => navigate('/registro-financiero') }
  ]

  // ============ EFECTOS ============
  useEffect(() => {
    loadPruebas()
    loadGrupos()
    loadUnidadesMedida()
    loadTiposMuestra()
    loadTasaCambio()
  }, [])

  // ============ FUNCIONES PRINCIPALES ============
  const loadPruebas = async () => {
    setLoading(true)
    try {
      // Cargar todas las pruebas
      const pruebasData = await api.getAllPruebas()
      setPruebas(pruebasData || [])
      setDisplayedPruebas(pruebasData || [])

      // Cargar cantidad total
      const countData = await api.getPruebasCount()
      setPruebasTotal(countData.count || 0)

      setMensaje({ type: '', text: '' })
    } catch (error) {
      console.error('Error cargando pruebas:', error)
      setMensaje({ type: 'error', text: 'Error al cargar pruebas' })
    } finally {
      setLoading(false)
    }
  }

  const loadGrupos = async () => {
    setGruposLoading(true)
    try {
      const gruposData = await api.getAllGrupos()
      setGrupos(gruposData || [])
    } catch (error) {
      console.error('Error cargando grupos:', error)
    } finally {
      setGruposLoading(false)
    }
  }

  const loadUnidadesMedida = async () => {
    try {
      const unidades = await api.getUnidadesMedida()
      setUnidadesMedida(unidades || [])
    } catch (error) {
      console.error('Error cargando unidades:', error)
    }
  }

  const loadTiposMuestra = async () => {
    try {
      const tipos = await api.getTiposMuestra()
      setTiposMuestra(tipos || [])
    } catch (error) {
      console.error('Error cargando tipos:', error)
    }
  }

  const loadTasaCambio = async () => {
    try {
      const tasaData = await api.obtenerTasaCambio()
      setTasaCambio(tasaData.tasa)
    } catch (error) {
      console.error('Error cargando tasa:', error)
    }
  }

  // ============ BÚSQUEDA ============
  const handleSearch = async (value) => {
    setSearchTerm(value)

    if (!value.trim()) {
      setDisplayedPruebas(pruebas)
      return
    }

    try {
      const results = await api.searchPruebas(value)
      setDisplayedPruebas(results || [])
    } catch (error) {
      console.error('Error buscando:', error)
      setMensaje({ type: 'error', text: 'Error al buscar pruebas' })
    }
  }

  // ============ MODAL CONTROL ============
  const openModal = () => {
    setSelectedPruebaId(null)
    setIsEditMode(false)
    setFormData({
      nombre_prueba: '',
      unidad_medida: '',
      tipo_muestra: '',
      valor_referencia_min: '',
      valor_referencia_max: '',
      descripcion: '',
      precio_bs: '',
      precio_usd: ''
    })
    setErrors({})
    setMensaje({ type: '', text: '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setMensaje({ type: '', text: '' })
    setErrors({})
    setSelectedPruebaId(null)
    setIsEditMode(false)
  }

  const handleSelectPrueba = (prueba) => {
    setSelectedPruebaId(prueba.id)
    setIsEditMode(true)
    setFormData({
      nombre_prueba: prueba.nombre_prueba || '',
      unidad_medida: prueba.unidad_medida || '',
      tipo_muestra: prueba.tipo_muestra || '',
      valor_referencia_min: prueba.valor_referencia_min ?? '',
      valor_referencia_max: prueba.valor_referencia_max ?? '',
      descripcion: prueba.descripcion || '',
      precio_bs: prueba.precio_bs != null ? String(prueba.precio_bs) : '',
      precio_usd: prueba.precio_usd != null ? String(prueba.precio_usd.toFixed(2)) : ''
    })
    setErrors({})
    setMensaje({ type: '', text: '' })
    setModalOpen(true)
  }

  // ============ VALIDACIÓN ============
  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre_prueba.trim()) {
      newErrors.nombre_prueba = 'El nombre es obligatorio'
    }

    if (!formData.unidad_medida.trim()) {
      newErrors.unidad_medida = 'La unidad de medida es obligatoria'
    }

    if (!formData.tipo_muestra.trim()) {
      newErrors.tipo_muestra = 'El tipo de muestra es obligatorio'
    }

    // Validar valores numéricos si se proporcionan
    if (formData.valor_referencia_min && isNaN(parseFloat(formData.valor_referencia_min))) {
      newErrors.valor_referencia_min = 'Ingrese un número válido'
    }

    if (formData.valor_referencia_max && isNaN(parseFloat(formData.valor_referencia_max))) {
      newErrors.valor_referencia_max = 'Ingrese un número válido'
    }

    if (!formData.precio_bs.trim()) {
      newErrors.precio_bs = 'El precio en BS es obligatorio'
    } else if (isNaN(parseFloat(formData.precio_bs)) || parseFloat(formData.precio_bs) <= 0) {
      newErrors.precio_bs = 'Ingrese un precio válido en BS (mayor a 0)'
    }

    // Validar que min <= max si ambos están presentes
    if (
      formData.valor_referencia_min &&
      formData.valor_referencia_max &&
      parseFloat(formData.valor_referencia_min) > parseFloat(formData.valor_referencia_max)
    ) {
      newErrors.valores = 'El valor mínimo no puede ser mayor que el máximo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============ ENVÍO DE FORMULARIO ============
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setMensaje({ type: 'error', text: 'Por favor corrija los errores en el formulario' })
      return
    }

    setSubmitting(true)

    const dataToSend = {
      nombre_prueba: formData.nombre_prueba.trim(),
      unidad_medida: formData.unidad_medida.trim(),
      tipo_muestra: formData.tipo_muestra.trim(),
      precio_bs: parseFloat(formData.precio_bs),
      descripcion: formData.descripcion.trim() || undefined
    }

    if (formData.valor_referencia_min !== '') {
      dataToSend.valor_referencia_min = parseFloat(formData.valor_referencia_min)
    }
    if (formData.valor_referencia_max !== '') {
      dataToSend.valor_referencia_max = parseFloat(formData.valor_referencia_max)
    }

    try {
      if (isEditMode && selectedPruebaId) {
        const response = await api.updatePrueba(selectedPruebaId, dataToSend)
        setMensaje({ type: 'success', text: 'Prueba actualizada exitosamente' })

        setPruebas((prev) => prev.map((p) => (p.id === selectedPruebaId ? response : p)))
        setDisplayedPruebas((prev) => prev.map((p) => (p.id === selectedPruebaId ? response : p)))
      } else {
        const response = await api.createPrueba(dataToSend)
        setMensaje({ type: 'success', text: 'Prueba registrada exitosamente' })

        setPruebas((prev) => [...prev, response])
        setDisplayedPruebas((prev) => [...prev, response])
      }

      setTimeout(() => {
        loadPruebas()
        closeModal()
      }, 800)
    } catch (error) {
      console.error('Error guardando prueba:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al guardar prueba' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePrueba = async () => {
    if (!selectedPruebaId) return

    const confirmDelete = window.confirm('¿Seguro que deseas eliminar esta prueba?')
    if (!confirmDelete) return

    try {
      await api.deletePrueba(selectedPruebaId)
      setMensaje({ type: 'success', text: 'Prueba eliminada correctamente' })
      setPruebas((prev) => prev.filter((p) => p.id !== selectedPruebaId))
      setDisplayedPruebas((prev) => prev.filter((p) => p.id !== selectedPruebaId))
      closeModal()
    } catch (error) {
      console.error('Error eliminando prueba:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al eliminar prueba' })
    }
  }

  // ============ FUNCIONES PARA CREAR GRUPO ============
  const openModalGrupo = () => {
    setGrupoFormData({
      nombre: '',
      descripcion: '',
      activo: true
    })
    setSelectedPruebasGrupo([])
    setGrupoErrors({})
    setMensaje({ type: '', text: '' })
    setModalGrupoOpen(true)
  }

  const closeModalGrupo = () => {
    setModalGrupoOpen(false)
    setGrupoFormData({ nombre: '', descripcion: '', activo: true })
    setSelectedPruebasGrupo([])
    setGrupoErrors({})
  }

  const handleGrupoFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setGrupoFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Limpiar error
    if (grupoErrors[name]) {
      setGrupoErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const togglePruebaEnGrupo = (pruebaId) => {
    setSelectedPruebasGrupo((prev) => {
      if (prev.includes(pruebaId)) {
        return prev.filter((id) => id !== pruebaId)
      } else {
        return [...prev, pruebaId]
      }
    })
  }

  const validateGrupoForm = () => {
    const newErrors = {}
    
    if (!grupoFormData.nombre.trim()) {
      newErrors.nombre = 'El nombre del grupo es obligatorio'
    }
    
    if (selectedPruebasGrupo.length === 0) {
      newErrors.pruebas = 'Debes seleccionar al menos una prueba'
    }
    
    setGrupoErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGuardarGrupo = async (e) => {
    e.preventDefault()
    
    if (!validateGrupoForm()) return
    
    setGrupoSubmitting(true)
    
    try {
      // 1. Crear el grupo
      const nuevoGrupo = await api.createGrupo({
        nombre: grupoFormData.nombre.trim(),
        descripcion: grupoFormData.descripcion.trim() || undefined,
        activo: grupoFormData.activo
      })
      
      // 2. Actualizar las pruebas seleccionadas con el grupo_id
      for (const pruebaId of selectedPruebasGrupo) {
        await api.updatePrueba(pruebaId, { grupo_id: nuevoGrupo.id })
      }
      
      setMensaje({ type: 'success', text: `✅ Grupo "${nuevoGrupo.nombre}" creado con ${selectedPruebasGrupo.length} prueba(s)` })
      
      // Recargar sin setTimeout
      await loadPruebas()
      await loadGrupos()
      closeModalGrupo()
    } catch (error) {
      console.error('Error creando grupo:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al crear el grupo' })
    } finally {
      setGrupoSubmitting(false)
    }
  }

  // ============ FUNCIONES PARA EDITAR GRUPO ============
  const openModalEditarGrupo = async (grupo) => {
    setGrupoEnEdicion(grupo)
    setGrupoFormData({
      nombre: grupo.nombre,
      descripcion: grupo.descripcion || '',
      activo: grupo.activo ?? true
    })
    
    // Cargar pruebas del grupo
    try {
      const pruebasDelGrupo = await api.getPruebasByGrupo(grupo.id)
      setSelectedPruebasGrupo(pruebasDelGrupo.map(p => p.id))
    } catch (error) {
      console.error('Error cargando pruebas del grupo:', error)
      setSelectedPruebasGrupo([])
    }
    
    setGrupoErrors({})
    setModalEditarGrupoOpen(true)
  }

  const closeModalEditarGrupo = () => {
    setModalEditarGrupoOpen(false)
    setGrupoEnEdicion(null)
    setGrupoFormData({ nombre: '', descripcion: '', activo: true })
    setSelectedPruebasGrupo([])
    setGrupoErrors({})
  }

  const handleActualizarGrupo = async (e) => {
    e.preventDefault()
    
    if (!validateGrupoForm()) return
    
    setGrupoSubmitting(true)
    
    try {
      // 1. Actualizar datos del grupo
      await api.updateGrupo(grupoEnEdicion.id, {
        nombre: grupoFormData.nombre.trim(),
        descripcion: grupoFormData.descripcion.trim() || undefined,
        activo: grupoFormData.activo
      })
      
      // 2. Desasociar todas las pruebas antiguas del grupo
      const pruebasActuales = pruebas.filter(p => p.grupo_id === grupoEnEdicion.id)
      for (const prueba of pruebasActuales) {
        if (!selectedPruebasGrupo.includes(prueba.id)) {
          await api.updatePrueba(prueba.id, { grupo_id: null })
        }
      }
      
      // 3. Asignar nuevas pruebas
      for (const pruebaId of selectedPruebasGrupo) {
        await api.updatePrueba(pruebaId, { grupo_id: grupoEnEdicion.id })
      }
      
      setMensaje({ type: 'success', text: `✅ Grupo "${grupoFormData.nombre}" actualizado` })
      
      // Recargar sin setTimeout
      await loadPruebas()
      await loadGrupos()
      closeModalEditarGrupo()
    } catch (error) {
      console.error('Error actualizando grupo:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al actualizar el grupo' })
    } finally {
      setGrupoSubmitting(false)
    }
  }

  const handleEliminarGrupo = async (grupoId) => {
    const confirmDelete = window.confirm('¿Estás seguro que deseas eliminar este grupo? Las pruebas no serán eliminadas.')
    if (!confirmDelete) return
    
    try {
      await api.deleteGrupo(grupoId)
      setMensaje({ type: 'success', text: '✅ Grupo eliminado correctamente' })
      
      // Recargar sin setTimeout
      await loadGrupos()
      await loadPruebas()
      closeModalEditarGrupo()
    } catch (error) {
      console.error('Error eliminando grupo:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al eliminar el grupo' })
    }
  }

  // ============ FUNCIONES PARA EXPANDIR/COLAPSAR GRUPOS ============
  const toggleGrupoExpanded = (grupoId) => {
    setGruposExpandidos((prev) => ({
      ...prev,
      [grupoId]: !prev[grupoId]
    }))
  }

  // ============ MANEJADORES DE FORMULARIO ============
  const handleFormChange = async (e) => {
    const { name, value } = e.target

    if (name === 'unidad_medida' && value === '__add_new_unidad__') {
      const nueva = prompt('Ingrese la nueva unidad de medida (ej: mg/mL, U/L, etc.):')
      if (nueva && nueva.trim()) {
        try {
          // Guardar en Supabase
          await api.createUnidadMedida(nueva.trim())
          // Recargar unidades
          await loadUnidadesMedida()
          // Seleccionar la nueva unidad
          setFormData((prev) => ({ 
            ...prev, 
            unidad_medida: nueva.trim()
          }))
          setMensaje({ type: 'success', text: 'Unidad agregada correctamente' })
        } catch (error) {
          console.error('Error guardando unidad:', error)
          setMensaje({ type: 'error', text: 'Error al guardar la unidad' })
          setFormData((prev) => ({ ...prev, unidad_medida: '' }))
        }
      } else {
        // Resetear select si el usuario cancela
        setFormData((prev) => ({ ...prev, unidad_medida: '' }))
      }
      return
    }

    if (name === 'tipo_muestra' && value === '__add_new_tipo__') {
      const nuevo = prompt('Ingrese el nuevo tipo de muestra (ej: LCR, sinovia, etc.):')
      if (nuevo && nuevo.trim()) {
        try {
          // Guardar en Supabase
          await api.createTipoMuestra(nuevo.trim())
          // Recargar tipos
          await loadTiposMuestra()
          // Seleccionar el nuevo tipo
          setFormData((prev) => ({ 
            ...prev, 
            tipo_muestra: nuevo.trim()
          }))
          setMensaje({ type: 'success', text: 'Tipo agregado correctamente' })
        } catch (error) {
          console.error('Error guardando tipo:', error)
          setMensaje({ type: 'error', text: 'Error al guardar el tipo' })
          setFormData((prev) => ({ ...prev, tipo_muestra: '' }))
        }
      } else {
        // Resetear select si el usuario cancela
        setFormData((prev) => ({ ...prev, tipo_muestra: '' }))
      }
      return
    }

    let updatedData = { ...formData, [name]: value }

    // Calcular precio_usd cuando cambia precio_bs
    if (name === 'precio_bs' && value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      const precioBs = parseFloat(value)
      const precioUsd = precioBs / tasaCambio
      updatedData.precio_usd = precioUsd.toFixed(2)
    }

    setFormData(updatedData)

    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // ============ RENDERIZADO ============
  return (
    <div className="pruebas-container">
      <MenuHamburguesa items={menuItems} />

      {/* Branding */}
      <BrandingLink />

      {/* Contenido Principal */}
      <main className="pruebas-content">
        <div className="pruebas-wrapper">
          {/* Encabezado */}
          <div className="page-header">
            <div className="header-left">
              <h1 className="page-title">Pruebas</h1>
              <p className="pruebas-count">Pruebas registradas: <span className="count-number">{pruebasTotal}</span></p>
            </div>
          </div>

          {/* Barra de búsqueda con botón */}
          <div className="search-container">
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Buscar prueba por nombre..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input-large"
              />
              <button className="btn-add" onClick={openModal} title="Agregar nueva prueba">
                +
              </button>
            </div>
          </div>

          {/* Lista de pruebas */}
          <div className="pruebas-list">
            {loading ? (
              <div className="loading-message">Cargando pruebas...</div>
            ) : displayedPruebas.length > 0 ? (
              <table className="pruebas-table">
                <thead>
                  <tr>
                    <th>Nombre de la prueba</th>
                    <th>Unidad</th>
                    <th>Tipo de muestra</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPruebas.map((prueba) => (
                    <tr
                      key={prueba.id}
                      className={`prueba-row ${selectedPruebaId === prueba.id ? 'prueba-row-selected' : ''}`}
                      onClick={() => handleSelectPrueba(prueba)}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPrueba(prueba) }}
                    >
                      <td className="prueba-nombre">{prueba.nombre_prueba}</td>
                      <td className="prueba-unidad">{prueba.unidad_medida || '—'}</td>
                      <td className="prueba-tipo">{prueba.tipo_muestra}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-message">
                {searchTerm ? 'No se encontraron pruebas con ese nombre' : 'No hay pruebas registradas. Crea la primera prueba.'}
              </div>
            )}
          </div>

          {/* Botón para crear grupo */}
          {pruebas.length > 0 && (
            <div className="grupo-section">
              <button 
                className="btn-crear-grupo" 
                onClick={openModalGrupo}
                title="Crear grupo de pruebas"
              >
                📋 Crear Grupo
              </button>
              <p className="grupo-info">Agrupa pruebas relacionadas para facilitar la selección en exámenes</p>
            </div>
          )}

          {/* Lista de grupos creados */}
          {grupos.length > 0 && (
            <div className="grupos-list-section">
              <h3 className="grupos-list-title">Grupos de Pruebas</h3>
              <div className="grupos-grid">
                {grupos.map((grupo) => {
                  const pruebasDelGrupo = pruebas.filter(p => p.grupo_id === grupo.id)
                  const isExpanded = gruposExpandidos[grupo.id] || false
                  return (
                    <div key={grupo.id} className="grupo-card">
                      <div 
                        className="grupo-card-header"
                        onClick={() => toggleGrupoExpanded(grupo.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="grupo-header-content">
                          <span className="grupo-expand-icon">{isExpanded ? '▼' : '▶'}</span>
                          <h4>{grupo.nombre}</h4>
                        </div>
                        <span className="grupo-badge">{pruebasDelGrupo.length} pruebas</span>
                      </div>
                      
                      {grupo.descripcion && (
                        <p className="grupo-card-descripcion">{grupo.descripcion}</p>
                      )}

                      {/* Pruebas del grupo - Se muestran cuando se expande */}
                      {isExpanded && pruebasDelGrupo.length > 0 && (
                        <div className="grupo-pruebas-list">
                          <div className="grupo-pruebas-title">Pruebas incluidas:</div>
                          <ul className="grupo-pruebas">
                            {pruebasDelGrupo.map((prueba) => (
                              <li key={prueba.id} className="grupo-prueba-item">
                                <span className="prueba-nombre-item">{prueba.nombre_prueba}</span>
                                <span className="prueba-medida-item">{prueba.unidad_medida || '—'}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {isExpanded && pruebasDelGrupo.length === 0 && (
                        <div className="grupo-pruebas-empty">
                          <p>Este grupo no tiene pruebas asignadas</p>
                        </div>
                      )}

                      <div className="grupo-card-actions">
                        <button
                          className="btn-editar-grupo"
                          onClick={() => openModalEditarGrupo(grupo)}
                          title="Editar grupo"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn-eliminar-grupo"
                          onClick={() => handleEliminarGrupo(grupo.id)}
                          title="Eliminar grupo"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Mensaje de estado */}
          {mensaje.text && (
            <div className={`message-box message-${mensaje.type}`}>
              {mensaje.text}
            </div>
          )}
        </div>
      </main>

      {/* Modal de formulario */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? 'Editar Prueba' : 'Nueva Prueba'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {/* Nombre de la prueba */}
              <div className="form-group">
                <label htmlFor="nombre_prueba" className="form-label">
                  Nombre de la prueba <span className="required">*</span>
                </label>
                <input
                  id="nombre_prueba"
                  type="text"
                  name="nombre_prueba"
                  placeholder="Ej: Glucosa en sangre"
                  value={formData.nombre_prueba}
                  onChange={handleFormChange}
                  className={`form-input ${errors.nombre_prueba ? 'error' : ''}`}
                />
                {errors.nombre_prueba && (
                  <span className="error-message">{errors.nombre_prueba}</span>
                )}
              </div>

              {/* Unidad de medida */}
              <div className="form-group">
                <label htmlFor="unidad_medida" className="form-label">
                  Unidad de medida <span className="required">*</span>
                </label>
                <select
                  id="unidad_medida"
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleFormChange}
                  className={`form-input ${errors.unidad_medida ? 'error' : ''}`}
                >
                  <option value="">Seleccionar unidad...</option>
                  <option value="__add_new_unidad__">+ Agregar nueva unidad</option>
                  {unidadesMedida.map((unidad) => (
                    <option key={unidad.id} value={unidad.nombre}>
                      {unidad.nombre}
                    </option>
                  ))}
                </select>
                {errors.unidad_medida && (
                  <span className="error-message">{errors.unidad_medida}</span>
                )}
              </div>

              {/* Tipo de muestra */}
              <div className="form-group">
                <label htmlFor="tipo_muestra" className="form-label">
                  Tipo de muestra <span className="required">*</span>
                </label>
                <select
                  id="tipo_muestra"
                  name="tipo_muestra"
                  value={formData.tipo_muestra}
                  onChange={handleFormChange}
                  className={`form-input ${errors.tipo_muestra ? 'error' : ''}`}
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="__add_new_tipo__">+ Agregar nuevo tipo</option>
                  {tiposMuestra.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
                {errors.tipo_muestra && (
                  <span className="error-message">{errors.tipo_muestra}</span>
                )}
              </div>

              {/* Valores de referencia */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="valor_referencia_min" className="form-label">
                    Valor mín. de referencia
                  </label>
                  <input
                    id="valor_referencia_min"
                    type="number"
                    name="valor_referencia_min"
                    placeholder="Ej: 70"
                    step="0.01"
                    value={formData.valor_referencia_min}
                    onChange={handleFormChange}
                    className={`form-input ${errors.valor_referencia_min ? 'error' : ''}`}
                  />
                  {errors.valor_referencia_min && (
                    <span className="error-message">{errors.valor_referencia_min}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="valor_referencia_max" className="form-label">
                    Valor máx. de referencia
                  </label>
                  <input
                    id="valor_referencia_max"
                    type="number"
                    name="valor_referencia_max"
                    placeholder="Ej: 100"
                    step="0.01"
                    value={formData.valor_referencia_max}
                    onChange={handleFormChange}
                    className={`form-input ${errors.valor_referencia_max ? 'error' : ''}`}
                  />
                  {errors.valor_referencia_max && (
                    <span className="error-message">{errors.valor_referencia_max}</span>
                  )}
                </div>
              </div>

              {errors.valores && (
                <div className="error-message">{errors.valores}</div>
              )}

              {/* Descripción */}
              <div className="form-group">
                <label htmlFor="descripcion" className="form-label">
                  Descripción (opcional)
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  placeholder="Información adicional sobre la prueba..."
                  value={formData.descripcion}
                  onChange={handleFormChange}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              {/* Precio BS */}
              <div className="form-group">
                <label htmlFor="precio_bs" className="form-label">
                  Precio Bs <span className="required">*</span>
                </label>
                <input
                  id="precio_bs"
                  type="number"
                  name="precio_bs"
                  placeholder="Ej: 25000"
                  step="0.01"
                  min="0"
                  value={formData.precio_bs}
                  onChange={handleFormChange}
                  className={`form-input ${errors.precio_bs ? 'error' : ''}`}
                />
                {errors.precio_bs && (
                  <span className="error-message">{errors.precio_bs}</span>
                )}
              </div>

              {/* Precio USD (calculado automáticamente) */}
              <div className="form-group">
                <label htmlFor="precio_usd" className="form-label">
                  Precio USD (calculado)
                </label>
                <input
                  id="precio_usd"
                  type="text"
                  name="precio_usd"
                  value={formData.precio_usd}
                  readOnly
                  className="form-input readonly"
                  placeholder="Se calcula automáticamente"
                />
                <small className="form-hint">Se actualiza automáticamente basado en la tasa de cambio actual (1 USD = Bs {tasaCambio.toFixed(4)})</small>
              </div>

              {/* Mensaje de error/éxito del formulario */}
              {mensaje.text && (
                <div className={`form-message message-${mensaje.type}`}>
                  {mensaje.text}
                </div>
              )}

              {/* Botones */}
              <div className="modal-actions">
                {isEditMode && selectedPruebaId && (
                  <button
                    type="button"
                    className="btn-eliminar"
                    onClick={handleDeletePrueba}
                    disabled={submitting}
                  >
                    🗑️ Eliminar
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : isEditMode ? 'Actualizar Prueba' : 'Guardar Prueba'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para crear grupo */}
      {modalGrupoOpen && (
        <div className="modal-overlay" onClick={closeModalGrupo}>
          <div className="modal-content modal-grupo" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Crear Grupo de Pruebas</h2>
              <button className="modal-close" onClick={closeModalGrupo}>✕</button>
            </div>

            <form onSubmit={handleGuardarGrupo} className="modal-form">
              {/* Nombre del grupo */}
              <div className="form-group">
                <label htmlFor="grupo_nombre" className="form-label">
                  Nombre del grupo <span className="required">*</span>
                </label>
                <input
                  id="grupo_nombre"
                  type="text"
                  name="nombre"
                  placeholder="Ej: Perfil Tiroideo Básico"
                  value={grupoFormData.nombre}
                  onChange={handleGrupoFormChange}
                  className={`form-input ${grupoErrors.nombre ? 'error' : ''}`}
                />
                {grupoErrors.nombre && (
                  <span className="error-message">{grupoErrors.nombre}</span>
                )}
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label htmlFor="grupo_descripcion" className="form-label">
                  Descripción (opcional)
                </label>
                <textarea
                  id="grupo_descripcion"
                  name="descripcion"
                  placeholder="Ej: Pruebas hormonales de tiroides"
                  value={grupoFormData.descripcion}
                  onChange={handleGrupoFormChange}
                  className="form-input form-textarea"
                  rows={2}
                />
              </div>

              {/* Activo */}
              <div className="form-group form-checkbox">
                <input
                  id="grupo_activo"
                  type="checkbox"
                  name="activo"
                  checked={grupoFormData.activo}
                  onChange={handleGrupoFormChange}
                  className="form-checkbox-input"
                />
                <label htmlFor="grupo_activo" className="form-checkbox-label">
                  Grupo activo
                </label>
              </div>

              {/* Selección de pruebas */}
              <div className="form-group">
                <label className="form-label">
                  Seleccionar pruebas del grupo <span className="required">*</span>
                </label>
                {grupoErrors.pruebas && (
                  <span className="error-message">{grupoErrors.pruebas}</span>
                )}
                
                <div className="pruebas-seleccion-grupo">
                  {pruebas.length > 0 ? (
                    <div className="pruebas-checkboxes">
                      {pruebas.map((prueba) => (
                        <label key={prueba.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={selectedPruebasGrupo.includes(prueba.id)}
                            onChange={() => togglePruebaEnGrupo(prueba.id)}
                            className="checkbox-input"
                          />
                          <div className="checkbox-label">
                            <strong>{prueba.nombre_prueba}</strong>
                            <small>{prueba.unidad_medida}</small>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="sin-pruebas">No hay pruebas disponibles. Crea pruebas primero.</p>
                  )}
                </div>

                <div className="grupo-selected-count">
                  Seleccionadas: <strong>{selectedPruebasGrupo.length}</strong> de {pruebas.length}
                </div>
              </div>

              {/* Botones */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModalGrupo}
                  disabled={grupoSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={grupoSubmitting || selectedPruebasGrupo.length === 0}
                >
                  {grupoSubmitting ? 'Guardando...' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para editar grupo */}
      {modalEditarGrupoOpen && grupoEnEdicion && (
        <div className="modal-overlay" onClick={closeModalEditarGrupo}>
          <div className="modal-content modal-grupo" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Grupo</h2>
              <button className="modal-close" onClick={closeModalEditarGrupo}>✕</button>
            </div>

            <form onSubmit={handleActualizarGrupo} className="modal-form">
              {/* Nombre del grupo */}
              <div className="form-group">
                <label htmlFor="edit_grupo_nombre" className="form-label">
                  Nombre del grupo <span className="required">*</span>
                </label>
                <input
                  id="edit_grupo_nombre"
                  type="text"
                  name="nombre"
                  value={grupoFormData.nombre}
                  onChange={handleGrupoFormChange}
                  className={`form-input ${grupoErrors.nombre ? 'error' : ''}`}
                />
                {grupoErrors.nombre && (
                  <span className="error-message">{grupoErrors.nombre}</span>
                )}
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label htmlFor="edit_grupo_descripcion" className="form-label">
                  Descripción (opcional)
                </label>
                <textarea
                  id="edit_grupo_descripcion"
                  name="descripcion"
                  value={grupoFormData.descripcion}
                  onChange={handleGrupoFormChange}
                  className="form-input form-textarea"
                  rows={2}
                />
              </div>

              {/* Activo */}
              <div className="form-group form-checkbox">
                <input
                  id="edit_grupo_activo"
                  type="checkbox"
                  name="activo"
                  checked={grupoFormData.activo}
                  onChange={handleGrupoFormChange}
                  className="form-checkbox-input"
                />
                <label htmlFor="edit_grupo_activo" className="form-checkbox-label">
                  Grupo activo
                </label>
              </div>

              {/* Selección de pruebas */}
              <div className="form-group">
                <label className="form-label">
                  Pruebas en este grupo <span className="required">*</span>
                </label>
                {grupoErrors.pruebas && (
                  <span className="error-message">{grupoErrors.pruebas}</span>
                )}
                
                <div className="pruebas-seleccion-grupo">
                  {pruebas.length > 0 ? (
                    <div className="pruebas-checkboxes">
                      {pruebas.map((prueba) => (
                        <label key={prueba.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={selectedPruebasGrupo.includes(prueba.id)}
                            onChange={() => togglePruebaEnGrupo(prueba.id)}
                            className="checkbox-input"
                          />
                          <div className="checkbox-label">
                            <strong>{prueba.nombre_prueba}</strong>
                            <small>{prueba.unidad_medida}</small>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="sin-pruebas">No hay pruebas disponibles.</p>
                  )}
                </div>

                <div className="grupo-selected-count">
                  Seleccionadas: <strong>{selectedPruebasGrupo.length}</strong> de {pruebas.length}
                </div>
              </div>

              {/* Botones */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeModalEditarGrupo}
                  disabled={grupoSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleEliminarGrupo(grupoEnEdicion.id)}
                  disabled={grupoSubmitting}
                >
                  🗑️ Eliminar Grupo
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={grupoSubmitting || selectedPruebasGrupo.length === 0}
                >
                  {grupoSubmitting ? 'Guardando...' : 'Actualizar Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pruebas
