/**
 * LoginPage.jsx
 * 
 * Pantalla de login con diseño moderno y responsivo.
 * - Formulario centrado en una card con glassmorphism
 * - Fondo con gradiente moderno
 * - Validaciones en tiempo real
 * - Manejo de estados de carga y error
 * - Enlace a la página de registro
 * - Guardado de token y redirección
 */

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import './AuthPages.css'

function LoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('') // Limpiar error al empezar a escribir
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await api.login({
        email: formData.email,
        password: formData.password
      })

      // Guardar token y datos del usuario en localStorage
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))

      setSuccess('Login exitoso. Redirigiendo...')
      
      // Redirigir al dashboard después de 500ms
      setTimeout(() => {
        navigate('/dashboard')
      }, 500)
    } catch (err) {
      console.error('Error en login:', err)
      setError(err.message || 'Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-background"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Bienvenido/a</h1>
          <p className="auth-subtitle">Inicia sesión en tu cuenta</p>
        </div>

        {error && <div className="auth-alert error">{error}</div>}
        {success && <div className="auth-alert success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
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
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <span className="auth-text">¿No estás registrado/a?</span>
          <Link to="/register" className="auth-link">
            Regístrate
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
