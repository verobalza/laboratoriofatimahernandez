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
    precio: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // ============ MENÚ HAMBURGUESA ============
  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Facturación', icon: '💳', onClick: () => navigate('/facturacion') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Registro financiero', icon: '💰', onClick: () => console.log('Registro financiero') }
  ]

  // ============ EFECTOS ============
  useEffect(() => {
    loadPruebas()
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
    setFormData({
      nombre_prueba: '',
      unidad_medida: '',
      tipo_muestra: '',
      valor_referencia_min: '',
      valor_referencia_max: '',
      descripcion: '',
      precio: ''
    })
    setErrors({})
    setMensaje({ type: '', text: '' })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setMensaje({ type: '', text: '' })
    setErrors({})
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

    if (!formData.precio.trim()) {
      newErrors.precio = 'El precio es obligatorio'
    } else if (isNaN(parseFloat(formData.precio)) || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'Ingrese un precio válido (mayor a 0)'
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

    try {
      const dataToSend = {
        nombre_prueba: formData.nombre_prueba.trim(),
        unidad_medida: formData.unidad_medida.trim(),
        tipo_muestra: formData.tipo_muestra.trim(),
        precio: parseFloat(formData.precio),
        descripcion: formData.descripcion.trim() || undefined
      }

      // Agregar valores de referencia si no están vacíos
      if (formData.valor_referencia_min) {
        dataToSend.valor_referencia_min = parseFloat(formData.valor_referencia_min)
      }
      if (formData.valor_referencia_max) {
        dataToSend.valor_referencia_max = parseFloat(formData.valor_referencia_max)
      }

      await api.createPrueba(dataToSend)

      setMensaje({ type: 'success', text: 'Prueba registrada exitosamente' })

      // Recargar lista
      setTimeout(() => {
        loadPruebas()
        closeModal()
      }, 1500)
    } catch (error) {
      console.error('Error creando prueba:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al guardar prueba' })
    } finally {
      setSubmitting(false)
    }
  }

  // ============ MANEJADORES DE FORMULARIO ============
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
      <div className="pruebas-branding">
        <div className="pruebas-branding-text">
          <h3 className="pruebas-lab-name">Laboratorio Bioclínico</h3>
          <p className="pruebas-lab-subtitle">Lc. Fátima Hernández</p>
        </div>
      </div>

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

          {/* Mensaje de estado */}
          {mensaje.text && (
            <div className={`message-box message-${mensaje.type}`}>
              {mensaje.text}
            </div>
          )}

          {/* Lista de pruebas */}
          <div className="pruebas-list">
            {loading ? (
              <div className="loading-message">Cargando pruebas...</div>
            ) : displayedPruebas.length > 0 ? (
              displayedPruebas.map((prueba) => (
                <div key={prueba.id} className="prueba-card">
                  <div className="card-header">
                    <h3 className="prueba-nombre">{prueba.nombre_prueba}</h3>
                    <span className="prueba-badge">{prueba.tipo_muestra}</span>
                  </div>

                  <div className="card-body">
                    <div className="prueba-info-row">
                      <span className="info-label">Unidad de medida:</span>
                      <span className="info-value">{prueba.unidad_medida}</span>
                    </div>

                    {prueba.precio && (
                      <div className="prueba-info-row">
                        <span className="info-label">Precio:</span>
                        <span className="info-value precio-badge">${prueba.precio.toFixed(2)}</span>
                      </div>
                    )}

                    {(prueba.valor_referencia_min !== null || prueba.valor_referencia_max !== null) && (
                      <div className="prueba-info-row">
                        <span className="info-label">Rango de referencia:</span>
                        <span className="info-value">
                          {prueba.valor_referencia_min || '—'} — {prueba.valor_referencia_max || '—'}
                        </span>
                      </div>
                    )}

                    {prueba.descripcion && (
                      <div className="prueba-info-row">
                        <span className="info-label">Descripción:</span>
                        <span className="info-value">{prueba.descripcion}</span>
                      </div>
                    )}

                    {prueba.creado_en && (
                      <div className="prueba-info-row">
                        <span className="info-label">Fecha de registro:</span>
                        <span className="info-value">
                          {new Date(prueba.creado_en).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-message">
                {searchTerm ? 'No se encontraron pruebas con ese nombre' : 'No hay pruebas registradas. Crea la primera prueba.'}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de formulario */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Prueba</h2>
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
                  <option value="mg/dL">mg/dL</option>
                  <option value="%">%</option>
                  <option value="UI/L">UI/L</option>
                  <option value="ng/mL">ng/mL</option>
                  <option value="μg/mL">μg/mL</option>
                  <option value="mEq/L">mEq/L</option>
                  <option value="mmol/L">mmol/L</option>
                  <option value="g/dL">g/dL</option>
                  <option value="células/μL">células/μL</option>
                  <option value="IU/mL">IU/mL</option>
                  <option value="otro">Otro</option>
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
                  <option value="sangre">Sangre</option>
                  <option value="orina">Orina</option>
                  <option value="suero">Suero</option>
                  <option value="plasma">Plasma</option>
                  <option value="saliva">Saliva</option>
                  <option value="heces">Heces</option>
                  <option value="líquido cefalorraquídeo">Líquido cefalorraquídeo</option>
                  <option value="otro">Otro</option>
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

              {/* Precio */}
              <div className="form-group">
                <label htmlFor="precio" className="form-label">
                  Precio <span className="required">*</span>
                </label>
                <input
                  id="precio"
                  type="number"
                  name="precio"
                  placeholder="Ej: 25000"
                  step="0.01"
                  min="0"
                  value={formData.precio}
                  onChange={handleFormChange}
                  className={`form-input ${errors.precio ? 'error' : ''}`}
                />
                {errors.precio && (
                  <span className="error-message">{errors.precio}</span>
                )}
              </div>

              {/* Mensaje de error/éxito del formulario */}
              {mensaje.text && (
                <div className={`form-message message-${mensaje.type}`}>
                  {mensaje.text}
                </div>
              )}

              {/* Botones */}
              <div className="modal-actions">
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
                  {submitting ? 'Guardando...' : 'Guardar Prueba'}
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
