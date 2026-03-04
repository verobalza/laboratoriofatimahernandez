/**
 * RegisterPage.jsx
 * 
 * Pantalla de registro con validaciones en tiempo real.
 * - Formulario con campos: nombre, apellido, email, password
 * - Validaciones de complejidad de contraseña
 * - Indicador visual de requisitos de contraseña
 * - Manejo de estados de carga y error
 * - Flujo de éxito sin redirección automática
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './AuthPages.css'

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUppercase: false,
    hasPunctuation: false
  })

  const validatePassword = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasPunctuation: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
    setPasswordRequirements(requirements)
    return Object.values(requirements).every(v => v)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')

    if (name === 'password') {
      validatePassword(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validar que todos los campos estén completos
    if (!formData.nombre || !formData.apellido || !formData.email || !formData.password) {
      setError('Todos los campos son requeridos')
      return
    }

    // Validar contraseña
    if (!Object.values(passwordRequirements).every(v => v)) {
      setError('La contraseña no cumple con los requisitos')
      return
    }

    setLoading(true)

    try {
      const response = await api.register({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password
      })

      // Registro exitoso - redirigir a login automáticamente
      setTimeout(() => {
        navigate('/login')
      }, 500)
    } catch (err) {
      console.error('Error en registro:', err)
      setError(err.message || 'Error al registrarse. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const isPasswordValid = Object.values(passwordRequirements).every(v => v)

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Crear Cuenta</h1>
          <p className="auth-subtitle">Regístrate para comenzar</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}
        {success && <div className="auth-alert success">{success}</div>}

          <div className="form-group">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="apellido"
              placeholder="Apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              disabled={loading}
            />
            
            {/* Indicador de requisitos de contraseña */}
            {formData.password && (
              <div className="password-requirements">
                <div className={`requirement ${passwordRequirements.minLength ? 'met' : ''}`}>
                  <span className="requirement-icon">
                    {passwordRequirements.minLength ? '✓' : '○'}
                  </span>
                  Mínimo 8 caracteres
                </div>
                <div className={`requirement ${passwordRequirements.hasUppercase ? 'met' : ''}`}>
                  <span className="requirement-icon">
                    {passwordRequirements.hasUppercase ? '✓' : '○'}
                  </span>
                  Al menos 1 mayúscula
                </div>
                <div className={`requirement ${passwordRequirements.hasPunctuation ? 'met' : ''}`}>
                  <span className="requirement-icon">
                    {passwordRequirements.hasPunctuation ? '✓' : '○'}
                  </span>
                  Al menos 1 signo de puntuación (!@#$%^&*...)
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !isPasswordValid}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <span className="auth-text">¿Ya tienes cuenta?</span>
          <Link to="/login" className="auth-link">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
