/**
 * FichaPaciente.jsx
 * 
 * Página para ver y editar la ficha de un paciente.
 * Accesible desde búsqueda o registro.
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import BrandingLink from '../components/BrandingLink'
import api from '../services/api'
import './FichaPaciente.css'

function FichaPaciente() {
  const { id } = useParams()
  const navigate = useNavigate()

  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Facturación', icon: '💳', onClick: () => navigate('/facturacion') },
    { label: 'Inventario', icon: '📦', onClick: () => navigate('/inventario') },
    { label: 'Registro financiero', icon: '💰', onClick: () => navigate('/registro-financiero') }
  ]
  
  const [paciente, setPaciente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Cargar paciente
  useEffect(() => {
    loadPaciente()
  }, [id])

  const loadPaciente = async () => {
    try {
      const data = await api.getPaciente(id)
      setPaciente(data)
      setEditData(data)
    } catch (error) {
      console.error('Error loading paciente:', error)
      setMessage({ type: 'error', text: 'No se pudo cargar el paciente' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdit = async () => {
    try {
      const response = await api.updatePaciente(id, editData)
      setPaciente(response)
      setEditMode(false)
      setMessage({ type: 'success', text: '✅ Paciente actualizado correctamente' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error updating paciente:', error)
      setMessage({ type: 'error', text: 'Error al actualizar paciente' })
    }
  }

  const handleCancelEdit = () => {
    setEditData(paciente)
    setEditMode(false)
  }

  const handleDeletePaciente = async () => {
    const confirmDelete = window.confirm('¿De verdad quieres borrar este paciente?')
    if (!confirmDelete) return

    try {
      await api.deletePaciente(id)
      setMessage({ type: 'success', text: '✅ Paciente eliminado correctamente' })
      setTimeout(() => {
        navigate('/registro-pacientes')
      }, 1000)
    } catch (error) {
      console.error('Error eliminando paciente:', error)
      setMessage({ type: 'error', text: 'Error al eliminar paciente' })
    }
  }

  if (loading) {
    return (
      <div className="ficha-container">
        <MenuHamburguesa items={menuItems} />
        <div className="ficha-loading">Cargando ficha...</div>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="ficha-container">
        <MenuHamburguesa items={menuItems} />
        <div className="ficha-error">Paciente no encontrado</div>
      </div>
    )
  }

  return (
    <div className="ficha-container">
      {/* Menú */}
      <MenuHamburguesa items={menuItems} />

      {/* Branding */}
      <BrandingLink />

      {/* Botón volver */}
      <button className="btn-volver" onClick={() => navigate('/registro-pacientes')}>
        ← Volver
      </button>

      {/* Contenido */}
      <main className="ficha-content">
        <div className="ficha-wrapper">
          {/* Encabezado */}
          <div className="ficha-header">
            <div className="ficha-title">
              <h1>
                {editMode ? 'Editar Paciente' : `${paciente.nombre} ${paciente.apellido}`}
              </h1>
              {!editMode && (
                <button
                  className="btn-edit"
                  onClick={() => setEditMode(true)}
                  title="Editar"
                >
                  ✏️
                </button>
              )}
            </div>
            {paciente.creado_en && (
              <p className="ficha-date">
                Registrado: {new Date(paciente.creado_en).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>

          {/* Mensaje */}
          {message.text && (
            <div className={`message message-${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Ficha datos */}
          <div className="ficha-data">
            {editMode ? (
              // Formulario edición
              <div className="edit-form">
                <div className="edit-row">
                  <div className="edit-field">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={editData.nombre}
                      onChange={(e) => handleEditChange('nombre', e.target.value)}
                    />
                  </div>
                  <div className="edit-field">
                    <label>Apellido</label>
                    <input
                      type="text"
                      value={editData.apellido}
                      onChange={(e) => handleEditChange('apellido', e.target.value)}
                    />
                  </div>
                </div>

                <div className="edit-row">
                  <div className="edit-field">
                    <label>Edad</label>
                    <input
                      type="number"
                      value={editData.edad}
                      onChange={(e) => handleEditChange('edad', e.target.value)}
                    />
                  </div>
                  <div className="edit-field">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      value={editData.telefono}
                      onChange={(e) => handleEditChange('telefono', e.target.value)}
                    />
                  </div>
                </div>

                <div className="edit-row">
                  <div className="edit-field">
                    <label>Dirección</label>
                    <input
                      type="text"
                      value={editData.direccion || ''}
                      onChange={(e) => handleEditChange('direccion', e.target.value)}
                    />
                  </div>
                  <div className="edit-field">
                    <label>Sexo</label>
                    <select
                      value={editData.sexo || ''}
                      onChange={(e) => handleEditChange('sexo', e.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Botones */}
                <div className="edit-buttons">
                  <button className="btn-guardar" onClick={handleSaveEdit}>
                    💾 Guardar cambios
                  </button>
                  <button className="btn-eliminar" onClick={handleDeletePaciente}>
                    🗑️ Eliminar
                  </button>
                  <button className="btn-cancelar" onClick={handleCancelEdit}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Vista datos
              <div className="view-data">
                <div className="data-grid">
                  <div className="data-item">
                    <span className="data-label">Nombre</span>
                    <span className="data-value">{paciente.nombre}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Apellido</span>
                    <span className="data-value">{paciente.apellido}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Edad</span>
                    <span className="data-value">{paciente.edad} años</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Teléfono</span>
                    <span className="data-value">{paciente.telefono}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Dirección</span>
                    <span className="data-value">{paciente.direccion || '—'}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">Sexo</span>
                    <span className="data-value">
                      {paciente.sexo === 'M' ? 'Masculino' : paciente.sexo === 'F' ? 'Femenino' : paciente.sexo || '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default FichaPaciente
