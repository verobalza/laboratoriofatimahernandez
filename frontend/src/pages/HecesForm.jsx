/**
 * HecesForm.jsx
 * 
 * Formulario especializado para exámenes de heces.
 * Incluye todos los campos específicos para un análisis completo de heces:
 * - Propiedades macroscópicas
 * - Análisis microscópico
 * - Parasitología
 * - Cultivo (opcional)
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import api from '../services/api'
import './HecesForm.css'

function HecesForm() {
  const navigate = useNavigate()
  const { pacienteId, hecesId } = useParams()

  // ============ ESTADO GENERAL ============
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState({ type: '', text: '' })
  const [isEditMode, setIsEditMode] = useState(!!hecesId)

  // ============ DATOS DEL PACIENTE ============
  const [paciente, setPaciente] = useState(null)

  // ============ FORMULARIO ============
  const [formData, setFormData] = useState({
    paciente_id: pacienteId || '',
    fecha: new Date().toISOString().split('T')[0],
    // Propiedades macroscópicas
    color: '',
    consistencia: '',
    forma: '',
    presencia_moco: '',
    presencia_sangre: '',
    presencia_restos_alimenticios: '',
    // Propiedades químicas
    ph: '',
    // Análisis microscópico
    leucocitos: '',
    hematíes: '',
    celulas_epiteliales: '',
    grasa: '',
    almidón: '',
    fibras_musculares: '',
    cristales_colesterol: '',
    cristales_otros: '',
    // Parasitología
    parasitos: '',
    huevos_parasitos: '',
    quistes_parasitos: '',
    bacterias: '',
    levaduras: '',
    // Cultivo
    cultivo_resultado: '',
    microorganismos_aislados: '',
    // Observaciones
    observaciones: '',
    notas_tecnico: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

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
    loadPaciente()
    if (isEditMode && hecesId) {
      loadHeces()
    }
  }, [])

  // ============ CARGAR DATOS ============
  const loadPaciente = async () => {
    if (!pacienteId) return

    try {
      const result = await api.getPaciente(pacienteId)
      setPaciente(result)
    } catch (error) {
      console.error('Error cargando paciente:', error)
      setMensaje({ type: 'error', text: 'Error al cargar datos del paciente' })
    }
  }

  const loadHeces = async () => {
    try {
      const result = await api.getHeces(hecesId)
      // Convertir fecha a formato YYYY-MM-DD si es necesario
      if (result.fecha && typeof result.fecha === 'string') {
        result.fecha = result.fecha.split('T')[0]
      }
      setFormData(result)
    } catch (error) {
      console.error('Error cargando heces:', error)
      setMensaje({ type: 'error', text: 'Error al cargar examen de heces' })
    }
  }

  // ============ MANEJADORES ============
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es obligatoria'
    }

    // Validar valores numéricos opcionales
    if (formData.ph && isNaN(parseFloat(formData.ph))) {
      newErrors.ph = 'Ingrese un número válido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      setMensaje({ type: 'error', text: 'Por favor corrija los errores en el formulario' })
      return
    }

    setSubmitting(true)

    try {
      // Preparar datos (excluir campos vacíos para que sean null en BD)
      const dataToSend = { ...formData }
      
      // Convertir valores numéricos
      if (dataToSend.ph) dataToSend.ph = parseFloat(dataToSend.ph)
      else dataToSend.ph = null

      if (dataToSend.leucocitos) dataToSend.leucocitos = parseInt(dataToSend.leucocitos)
      else dataToSend.leucocitos = null

      if (dataToSend.hematíes) dataToSend.hematíes = parseInt(dataToSend.hematíes)
      else dataToSend.hematíes = null

      if (dataToSend.celulas_epiteliales) dataToSend.celulas_epiteliales = parseInt(dataToSend.celulas_epiteliales)
      else dataToSend.celulas_epiteliales = null

      if (dataToSend.grasa) dataToSend.grasa = parseInt(dataToSend.grasa)
      else dataToSend.grasa = null

      if (dataToSend.almidón) dataToSend.almidón = parseInt(dataToSend.almidón)
      else dataToSend.almidón = null

      if (dataToSend.fibras_musculares) dataToSend.fibras_musculares = parseInt(dataToSend.fibras_musculares)
      else dataToSend.fibras_musculares = null

      if (dataToSend.cristales_colesterol) dataToSend.cristales_colesterol = parseInt(dataToSend.cristales_colesterol)
      else dataToSend.cristales_colesterol = null

      if (isEditMode && hecesId) {
        await api.updateHeces(hecesId, dataToSend)
        setMensaje({ type: 'success', text: '✅ Examen de heces actualizado correctamente' })
      } else {
        await api.createHeces(dataToSend)
        setMensaje({ type: 'success', text: '✅ Examen de heces guardado correctamente' })
      }

      setTimeout(() => {
        navigate(`/ficha-paciente/${pacienteId}`)
      }, 1500)
    } catch (error) {
      console.error('Error guardando heces:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al guardar examen' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate(`/ficha-paciente/${pacienteId}`)
  }

  // ============ RENDERIZADO ============
  return (
    <div className="heces-form-container">
      <MenuHamburguesa items={menuItems} />

      <div className="heces-form-content">
        <div className="heces-form-header">
          <h1>🔬 Examen de Heces Completo</h1>
          {paciente && (
            <p className="paciente-info">
              Paciente: <strong>{paciente.nombre} {paciente.apellido}</strong>
            </p>
          )}
        </div>

        {mensaje.text && (
          <div className={`mensaje mensaje-${mensaje.type}`}>
            {mensaje.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="heces-form">
          {/* FECHA */}
          <div className="form-section">
            <h2>Información General</h2>
            <div className="form-group">
              <label htmlFor="fecha">Fecha del Examen *</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                disabled={submitting}
              />
              {errors.fecha && <span className="error">{errors.fecha}</span>}
            </div>
          </div>

          {/* PROPIEDADES MACROSCÓPICAS */}
          <div className="form-section">
            <h2>Propiedades Macroscópicas</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="color">Color</label>
                <select
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Café">Café</option>
                  <option value="Café oscuro">Café oscuro</option>
                  <option value="Gris-arcilla">Gris-arcilla</option>
                  <option value="Claro">Claro</option>
                  <option value="Amarillento">Amarillento</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="consistencia">Consistencia</label>
                <select
                  id="consistencia"
                  name="consistencia"
                  value={formData.consistencia}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Dura">Dura</option>
                  <option value="Normal">Normal</option>
                  <option value="Blanda">Blanda</option>
                  <option value="Diarreica">Diarreica</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="forma">Forma</label>
                <select
                  id="forma"
                  name="forma"
                  value={formData.forma}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Cilíndrica">Cilíndrica</option>
                  <option value="Fecaloide">Fecaloide</option>
                  <option value="Líquida">Líquida</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="presencia_moco">Presencia de Moco</label>
                <select
                  id="presencia_moco"
                  name="presencia_moco"
                  value={formData.presencia_moco}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Presente">Presente</option>
                  <option value="Abundante">Abundante</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="presencia_sangre">Presencia de Sangre</label>
                <select
                  id="presencia_sangre"
                  name="presencia_sangre"
                  value={formData.presencia_sangre}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Presente">Presente</option>
                  <option value="Abundante">Abundante</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="presencia_restos_alimenticios">Restos Alimenticios</label>
                <select
                  id="presencia_restos_alimenticios"
                  name="presencia_restos_alimenticios"
                  value={formData.presencia_restos_alimenticios}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Presente">Presente</option>
                  <option value="Abundante">Abundante</option>
                </select>
              </div>
            </div>
          </div>

          {/* PROPIEDADES QUÍMICAS */}
          <div className="form-section">
            <h2>Propiedades Químicas</h2>
            
            <div className="form-group">
              <label htmlFor="ph">pH</label>
              <input
                type="number"
                id="ph"
                name="ph"
                value={formData.ph}
                onChange={handleChange}
                placeholder="5.5 - 7.5"
                step="0.1"
                disabled={submitting}
              />
              {errors.ph && <span className="error">{errors.ph}</span>}
              <small>Rango normal: 5.5 - 7.5</small>
            </div>
          </div>

          {/* ANÁLISIS MICROSCÓPICO */}
          <div className="form-section">
            <h2>Análisis Microscópico</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="leucocitos">Leucocitos</label>
                <input
                  type="number"
                  id="leucocitos"
                  name="leucocitos"
                  value={formData.leucocitos}
                  onChange={handleChange}
                  placeholder="0-5"
                  min="0"
                  disabled={submitting}
                />
                <small>Normal: 0-5</small>
              </div>

              <div className="form-group">
                <label htmlFor="hematíes">Hematíes</label>
                <input
                  type="number"
                  id="hematíes"
                  name="hematíes"
                  value={formData.hematíes}
                  onChange={handleChange}
                  placeholder="0-3"
                  min="0"
                  disabled={submitting}
                />
                <small>Normal: 0-3</small>
              </div>

              <div className="form-group">
                <label htmlFor="celulas_epiteliales">Células Epiteliales</label>
                <input
                  type="number"
                  id="celulas_epiteliales"
                  name="celulas_epiteliales"
                  value={formData.celulas_epiteliales}
                  onChange={handleChange}
                  min="0"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grasa">Grasa</label>
                <input
                  type="number"
                  id="grasa"
                  name="grasa"
                  value={formData.grasa}
                  onChange={handleChange}
                  placeholder="0-2"
                  min="0"
                  disabled={submitting}
                />
                <small>Normal: 0-2</small>
              </div>

              <div className="form-group">
                <label htmlFor="almidón">Almidón</label>
                <input
                  type="number"
                  id="almidón"
                  name="almidón"
                  value={formData.almidón}
                  onChange={handleChange}
                  placeholder="0-2"
                  min="0"
                  disabled={submitting}
                />
                <small>Normal: 0-2</small>
              </div>

              <div className="form-group">
                <label htmlFor="fibras_musculares">Fibras Musculares</label>
                <input
                  type="number"
                  id="fibras_musculares"
                  name="fibras_musculares"
                  value={formData.fibras_musculares}
                  onChange={handleChange}
                  min="0"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cristales_colesterol">Cristales Colesterol</label>
                <input
                  type="number"
                  id="cristales_colesterol"
                  name="cristales_colesterol"
                  value={formData.cristales_colesterol}
                  onChange={handleChange}
                  min="0"
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cristales_otros">Otros Cristales</label>
                <textarea
                  id="cristales_otros"
                  name="cristales_otros"
                  value={formData.cristales_otros}
                  onChange={handleChange}
                  placeholder="Descripción de otros cristales"
                  disabled={submitting}
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* PARASITOLOGÍA */}
          <div className="form-section">
            <h2>Parasitología</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="parasitos">Parásitos</label>
                <textarea
                  id="parasitos"
                  name="parasitos"
                  value={formData.parasitos}
                  onChange={handleChange}
                  placeholder="Descripción de parásitos encontrados"
                  disabled={submitting}
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label htmlFor="huevos_parasitos">Huevos de Parásitos</label>
                <textarea
                  id="huevos_parasitos"
                  name="huevos_parasitos"
                  value={formData.huevos_parasitos}
                  onChange={handleChange}
                  placeholder="Descripción de huevos encontrados"
                  disabled={submitting}
                  rows="2"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="quistes_parasitos">Quistes de Parásitos</label>
                <textarea
                  id="quistes_parasitos"
                  name="quistes_parasitos"
                  value={formData.quistes_parasitos}
                  onChange={handleChange}
                  placeholder="Descripción de quistes encontrados"
                  disabled={submitting}
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bacterias">Bacterias</label>
                <select
                  id="bacterias"
                  name="bacterias"
                  value={formData.bacterias}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Ausentes">Ausentes</option>
                  <option value="Pocas">Pocas</option>
                  <option value="Moderadas">Moderadas</option>
                  <option value="Abundantes">Abundantes</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="levaduras">Levaduras</label>
                <select
                  id="levaduras"
                  name="levaduras"
                  value={formData.levaduras}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Ausentes">Ausentes</option>
                  <option value="Pocas">Pocas</option>
                  <option value="Moderadas">Moderadas</option>
                  <option value="Abundantes">Abundantes</option>
                </select>
              </div>
            </div>
          </div>

          {/* CULTIVO */}
          <div className="form-section">
            <h2>Cultivo (Opcional)</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cultivo_resultado">Resultado del Cultivo</label>
                <select
                  id="cultivo_resultado"
                  name="cultivo_resultado"
                  value={formData.cultivo_resultado}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="">No realizó cultivo</option>
                  <option value="Negativo">Negativo</option>
                  <option value="Positivo">Positivo</option>
                  <option value="Contaminado">Contaminado</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="microorganismos_aislados">Microorganismos Aislados</label>
                <textarea
                  id="microorganismos_aislados"
                  name="microorganismos_aislados"
                  value={formData.microorganismos_aislados}
                  onChange={handleChange}
                  placeholder="Nombres de microorganismos encontrados"
                  disabled={submitting}
                  rows="2"
                />
              </div>
            </div>
          </div>

          {/* OBSERVACIONES */}
          <div className="form-section">
            <h2>Observaciones</h2>
            
            <div className="form-group full-width">
              <label htmlFor="observaciones">Observaciones Generales</label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Observaciones del examen..."
                disabled={submitting}
                rows="3"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="notas_tecnico">Notas del Técnico</label>
              <textarea
                id="notas_tecnico"
                name="notas_tecnico"
                value={formData.notas_tecnico}
                onChange={handleChange}
                placeholder="Notas internas del técnico..."
                disabled={submitting}
                rows="3"
              />
            </div>
          </div>

          {/* BOTONES */}
          <div className="form-buttons">
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? '⏳ Guardando...' : '💾 Guardar Examen'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={submitting}
            >
              ✕ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HecesForm
