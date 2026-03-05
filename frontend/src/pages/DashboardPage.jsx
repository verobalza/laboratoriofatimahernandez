/**
 * DashboardPage.jsx
 * 
 * Dashboard rediseñado con branding minimalista.
 * - Menú hamburguesa intacto en esquina superior derecha
 * - Branding del laboratorio en esquina superior izquierda (fijo)
 * - Imagen alusiva a análisis de laboratorio
 * - Fondo azul suave y moderno
 * - Glass effect y overlay elegante
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import './Dashboard.css'

function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener usuario del localStorage
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')

    if (!storedUser || !token) {
      navigate('/login')
      return
    }

    try {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setLoading(false)
    } catch (error) {
      console.error('Error parsing user:', error)
      navigate('/login')
    }
  }, [navigate])

  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Facturación', icon: '💳', onClick: () => console.log('Facturación') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Registro financiero', icon: '💰', onClick: () => console.log('Registro financiero') }
  ]

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Menú hamburguesa - Se mantiene intacto */}
      <MenuHamburguesa items={menuItems} />

      {/* Branding del laboratorio - Esquina superior izquierda */}
      <div className="lab-branding">
        <div className="lab-branding-text">
          <h3 className="lab-name">Laboratorio Bioclínico</h3>
          <p className="lab-subtitle">Lc. Fátima Hernández</p>
        </div>
      </div>

      {/* Contenido principal - Imagen + Overlay */}
      <main className="dashboard-content">
        <div className="lab-visual-container">
          {/* Imagen de laboratorio con overlay */}
          <div className="lab-image-wrapper">
            <svg className="lab-image" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
              {/* Microscopio */}
              <g className="microscope-illustration">
                {/* Base del microscopio */}
                <ellipse cx="200" cy="350" rx="80" ry="20" fill="#4f46e5" opacity="0.3" />
                
                {/* Tubo principal */}
                <rect x="190" y="120" width="20" height="200" fill="#6366f1" rx="10" />
                
                {/* Lentes objetivos */}
                <circle cx="200" cy="280" r="25" fill="none" stroke="#3b82f6" strokeWidth="3" />
                <circle cx="200" cy="280" r="20" fill="#dbeafe" opacity="0.5" />
                
                {/* Ocular */}
                <circle cx="200" cy="100" r="20" fill="none" stroke="#3b82f6" strokeWidth="3" />
                <circle cx="200" cy="100" r="15" fill="#e0e7ff" opacity="0.6" />
                
                {/* Especie (preparado) */}
                <rect x="175" y="295" width="50" height="3" fill="#10b981" />
                <circle cx="200" cy="298" r="35" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" opacity="0.5" />
              </g>

              {/* Tubos de ensayo */}
              <g className="test-tubes">
                {/* Tubo 1 */}
                <rect x="70" y="150" width="30" height="140" fill="none" stroke="#7c3aed" strokeWidth="3" rx="8" />
                <ellipse cx="85" cy="150" rx="15" ry="8" fill="#c4b5fd" opacity="0.4" />
                <path d="M 85 170 Q 90 200 85 220" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.6" />

                {/* Tubo 2 */}
                <rect x="310" y="180" width="30" height="110" fill="none" stroke="#06b6d4" strokeWidth="3" rx="8" />
                <ellipse cx="325" cy="180" rx="15" ry="8" fill="#cffafe" opacity="0.4" />
                <path d="M 325 200 Q 330 230 325 250" stroke="#67e8f9" strokeWidth="2" fill="none" opacity="0.6" />
              </g>

              {/* Partículas/Células decorativas */}
              <g className="particles" opacity="0.5">
                <circle cx="120" cy="100" r="4" fill="#ec4899" />
                <circle cx="280" cy="120" r="3" fill="#f59e0b" />
                <circle cx="150" cy="250" r="3" fill="#14b8a6" />
                <circle cx="300" cy="280" r="4" fill="#3b82f6" />
                <circle cx="250" cy="80" r="3" fill="#8b5cf6" />
              </g>
            </svg>

            {/* Overlay elegante con glass effect */}
            <div className="lab-overlay"></div>
          </div>

          {/* Información del usuario (subtil) */}
          {user && (
            <div className="user-welcome-subtle">
              <p className="welcome-text">Bienvenido/a, <strong>{user.nombre}</strong></p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default DashboardPage

