/**
 * RegistroPacientes.jsx
 * 
 * Página de registro y gestión de pacientes con diseño en dos paneles:
 * - Panel izquierdo: Lista ordenada de todos los pacientes
 * - Panel derecho: Formulario para crear o editar paciente
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import api from '../services/api'
import './RegistroPacientes.css'

function RegistroPacientes() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  // Estado: Lista de pacientes
  const [pacientes, setPacientes] = useState([])
  const [pacientesLoading, setPacientesLoading] = useState(false)

  // Estado: Paciente seleccionado / en edición
  const [selectedPacienteId, setSelectedPacienteId] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Estado: Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    edad: '',
    telefono: '',
    direccion: '',
    sexo: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Cargar usuario si existe
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing user:', error)
      }
    }
  }, [])

  // Cargar lista completa de pacientes al montar
  useEffect(() => {
    loadPacientes()
  }, [])

  /**
   * Cargar todos los pacientes y ordenar alfabéticamente
   */
  const loadPacientes = async () => {
    setPacientesLoading(true)
    try {
      const results = await api.searchPacientes('')
      const sorted = (results || []).sort((a, b) => {
        return (a.nombre || '').localeCompare(b.nombre || '')
      })
      setPacientes(sorted)
    } catch (error) {
      console.error('Error cargando pacientes:', error)
      setMessage({ type: 'error', text: 'Error al cargar pacientes' })
    } finally {
      setPacientesLoading(false)
    }
  }

  /**
   * Cuando el usuario selecciona un paciente de la lista
   */
  const handleSelectPaciente = (paciente) => {
    setSelectedPacienteId(paciente.id)
    setIsEditMode(true)
    setFormData({
      nombre: paciente.nombre || '',
      apellido: paciente.apellido || '',
      cedula: paciente.cedula || '',
      edad: paciente.edad || '',
      telefono: paciente.telefono || '',
      direccion: paciente.direccion || '',
      sexo: paciente.sexo || ''
    })
    setMessage({ type: '', text: '' })
  }

  /**
   * Limpiar formulario para crear nuevo paciente
   */
  const handleNewPaciente = () => {
    setSelectedPacienteId(null)
    setIsEditMode(false)
    setFormData({
      nombre: '',
      apellido: '',
      cedula: '',
      edad: '',
      telefono: '',
      direccion: '',
      sexo: ''
    })
    setMessage({ type: '', text: '' })
  }

  /**
   * Cambiar campo del formulario
   */
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Validar formulario
   */
  const validateForm = () => {
    const errors = []
    
    if (!formData.nombre.trim()) errors.push('Nombre requerido')
    if (!formData.apellido.trim()) errors.push('Apellido requerido')
    if (!formData.edad || parseInt(formData.edad) < 0 || parseInt(formData.edad) > 120) {
      errors.push('Edad inválida')
    }
    if (!formData.telefono.trim()) errors.push('Teléfono requerido')
    if (formData.telefono.replace(/\D/g, '').length < 7) {
      errors.push('Teléfono muy corto')
    }

    return errors
  }

  /**
   * Enviar formulario (crear o actualizar)
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors[0] })
      return
    }

    setLoading(true)
    try {
      let response
      let successMsg

      if (isEditMode && selectedPacienteId) {
        // Actualizar paciente existente
        response = await api.updatePaciente(selectedPacienteId, formData)
        successMsg = `✅ ${formData.nombre} ${formData.apellido} actualizado correctamente`

        // Actualizar lista local para reflejar cambio inmediato
        if (response && response.id) {
          const updated = pacientes.map(p => (p.id === selectedPacienteId ? response : p))
          updated.sort((a, b) => a.nombre.localeCompare(b.nombre))
          setPacientes(updated)
        } else {
          // Si la respuesta no tiene ID, recargar desde el servidor
          await loadPacientes()
        }
      } else {
        // Crear nuevo paciente
        response = await api.createPaciente(formData)
        successMsg = `✅ ${formData.nombre} ${formData.apellido} registrado correctamente`
        
        // Agregar a la lista y reordenar solo si la respuesta tiene ID
        if (response && response.id) {
          const newList = [...pacientes, response]
          const sorted = newList.sort((a, b) => a.nombre.localeCompare(b.nombre))
          setPacientes(sorted)
        } else {
          // Si la respuesta no tiene estructura de paciente, recargar desde el servidor
          await loadPacientes()
        }
      }

      setMessage({ type: 'success', text: successMsg })
      
      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        handleNewPaciente()
        setMessage({ type: '', text: '' })
      }, 2000)

    } catch (error) {
      console.error('Error guardando paciente:', error)
      setMessage({ type: 'error', text: error.message || 'Error al guardar paciente' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePaciente = async () => {
    if (!selectedPacienteId) return

    const confirmDelete = window.confirm('¿De verdad quieres borrar este paciente?')
    if (!confirmDelete) return

    setLoading(true)
    try {
      await api.deletePaciente(selectedPacienteId)
      setPacientes(prev => prev.filter(p => p.id !== selectedPacienteId))
      setMessage({ type: 'success', text: '✅ Paciente eliminado correctamente' })
      setSelectedPacienteId(null)
      setIsEditMode(false)
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        edad: '',
        telefono: '',
        direccion: '',
        sexo: ''
      })
    } catch (error) {
      console.error('Error eliminando paciente:', error)
      setMessage({ type: 'error', text: error.message || 'Error al eliminar paciente' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Facturación', icon: '💳', onClick: () => navigate('/facturacion') },
    { label: 'Inventario', icon: '📦', onClick: () => navigate('/inventario') },
    { label: 'Registro financiero', icon: '💰', onClick: () => navigate('/registro-financiero') }
  ]

  return (
    <div className="registro-pacientes-container">

      {/* Menú hamburguesa */}
      <MenuHamburguesa items={menuItems} />

      {/* Branding */}
      <div className="registro-branding">
        <div className="registro-branding-text">
          <h3 className="registro-lab-name">Laboratorio Bioclínico</h3>
          <p className="registro-lab-subtitle">Lc. Fátima Hernández</p>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="registro-content">
        <div className="registro-wrapper">
          
          {/* PANEL IZQUIERDO: Lista de Pacientes */}
          <section className="pacientes-list-panel">
            <div className="list-header">
              <h2>Pacientes Registrados</h2>
              <span className="pacientes-count">{pacientes.length}</span>
            </div>

            {pacientesLoading ? (
              <div className="list-loading">Cargando pacientes...</div>
            ) : pacientes.length > 0 ? (
              <ul className="pacientes-list">
                {pacientes.map(paciente => (
                  <li 
                    key={paciente.id} 
                    className={`paciente-item ${selectedPacienteId === paciente.id ? 'active' : ''}`}
                    onClick={() => handleSelectPaciente(paciente)}
                  >
                    <div className="paciente-info">
                      <div className="paciente-nombre">
                        {paciente.nombre} {paciente.apellido}
                      </div>

                      {paciente.cedula && (
                        <div className="paciente-cedula">
                          Cédula: {paciente.cedula}
                        </div>
                      )}

                      <div className="paciente-telefono">
                        Tel: {paciente.telefono}
                      </div>
                    </div>

                    <div className="item-arrow">›</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-pacientes">
                <p>No hay pacientes registrados</p>
              </div>
            )}
          </section>

          {/* PANEL DERECHO: Formulario */}
          <section className="paciente-form-panel">
            <div className="form-header">
              <h2>{isEditMode ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}</h2>
              {isEditMode && (
                <button className="btn-cancel" onClick={handleNewPaciente} title="Crear nuevo">
                  ➕ Nuevo
                </button>
              )}
            </div>

            {message.text && (
              <div className={`message message-${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="paciente-form">

              {/* Fila 1: Nombre y Apellido */}
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    placeholder="Ej: Juan"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Apellido *</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleFormChange}
                    placeholder="Ej: Pérez"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Fila 2: Cédula y Edad */}
              <div className="form-row">
                <div className="form-group">
                  <label>Cédula</label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleFormChange}
                    placeholder="Ej: V-12345678"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Edad *</label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleFormChange}
                    placeholder="Ej: 30"
                    className="form-input"
                    min="0"
                    max="120"
                  />
                </div>
              </div>

              {/* Fila 3: Teléfono y Sexo */}
              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleFormChange}
                    placeholder="Ej: +58 412-1234567"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Sexo</label>
                  <select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleFormChange}
                    className="form-input"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>

              {/* Dirección */}
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleFormChange}
                  placeholder="Ej: Calle Principal 123"
                  className="form-input"
                />
              </div>

              {/* Botones */}
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Registrar'}
                </button>

                {isEditMode && (
                  <>
                    <button 
                      type="button" 
                      className="btn-delete"
                      onClick={handleDeletePaciente}
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                    <button 
                      type="button" 
                      className="btn-cancel"
                      onClick={handleNewPaciente}
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            </form>
          </section>

        </div>
      </main>
    </div>
  )
}

export default RegistroPacientes
