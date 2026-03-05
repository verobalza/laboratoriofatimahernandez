/**
 * RegistroPacientes.jsx
 * 
 * Página para el registro y búsqueda de pacientes.
 * Integrada con Supabase y API REST.
 * Mismo estilo visual que dashboard.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import api from '../services/api'
import './RegistroPacientes.css'

function RegistroPacientes() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  
  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    edad: '',
    telefono: '',
    direccion: '',
    sexo: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Cargar usuario si existe (opcional)
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

  // Búsqueda en tiempo real
  const handleSearch = async (value) => {
    setSearchTerm(value)
    
    if (!value.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      const results = await api.searchPacientes(value)
      setSearchResults(results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Error searching:', error)
      setMessage({ type: 'error', text: 'Error al buscar pacientes' })
    } finally {
      setSearchLoading(false)
    }
  }

  // Ver ficha del paciente
  const handleViewPaciente = (id) => {
    navigate(`/ficha-paciente/${id}`)
  }

  // Cambiar campo del formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Validar formulario
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

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors[0] })
      return
    }

    setLoading(true)
    try {
      const response = await api.createPaciente(formData)
      setMessage({ 
        type: 'success', 
        text: `✅ ${formData.nombre} ${formData.apellido} registrado correctamente` 
      })
      setFormData({
        nombre: '',
        apellido: '',
        edad: '',
        telefono: '',
        direccion: '',
        sexo: ''
      })
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error creating paciente:', error)
      setMessage({ type: 'error', text: error.message || 'Error al guardar paciente' })
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Facturación', icon: '💳', onClick: () => console.log('Facturación') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Registro financiero', icon: '💰', onClick: () => console.log('Registro financiero') }
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
          {/* Sección búsqueda */}
          <section className="search-section">
            <h2>Buscar Paciente</h2>
            <div className="search-container">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o teléfono..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="search-input"
                />
              </div>

              {showSearchResults && (
                <div className="search-results">
                  {searchLoading ? (
                    <div className="search-loading">Buscando...</div>
                  ) : searchResults.length > 0 ? (
                    <ul className="results-list">
                      {searchResults.map(paciente => (
                        <li key={paciente.id} className="result-item">
                          <div className="result-info">
                            <strong>{paciente.nombre} {paciente.apellido}</strong>
                            <span className="result-phone">{paciente.telefono}</span>
                          </div>
                          <button
                            className="btn-ver-ficha"
                            onClick={() => handleViewPaciente(paciente.id)}
                          >
                            Ver ficha
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="no-results">No se encontraron pacientes</div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Sección formulario */}
          <section className="form-section">
            <h2>Registrar Nuevo Paciente</h2>
            
            {message.text && (
              <div className={`message message-${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="paciente-form">
              {/* Fila 1: Nombre y Apellido */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Nombre *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleFormChange}
                    placeholder="Juan"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apellido">Apellido *</label>
                  <input
                    type="text"
                    id="apellido"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleFormChange}
                    placeholder="Pérez"
                    required
                  />
                </div>
              </div>

              {/* Fila 2: Edad y Teléfono */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edad">Edad * (años)</label>
                  <input
                    type="number"
                    id="edad"
                    name="edad"
                    value={formData.edad}
                    onChange={handleFormChange}
                    placeholder="30"
                    min="0"
                    max="120"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleFormChange}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              {/* Fila 3: Dirección y Sexo */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="direccion">Dirección (opcional)</label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleFormChange}
                    placeholder="Calle Principal 123"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="sexo">Sexo (opcional)</label>
                  <select
                    id="sexo"
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleFormChange}
                  >
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Botón envío */}
              <button
                type="submit"
                className="btn-guardar"
                disabled={loading}
              >
                {loading ? '⏳ Guardando...' : '💾 Guardar paciente'}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}

export default RegistroPacientes
