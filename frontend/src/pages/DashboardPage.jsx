/**
 * DashboardPage.jsx
 * 
 * Página dashboard protegida con menú hamburguesa.
 * Diseño minimalista:
 * - Fondo azul suave con degradación
 * - Menú hamburguesa en esquina superior derecha
 * - Card central con bienvenida
 * - Botón de logout
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

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menuItems = [
    {
      label: 'Registro pacientes',
      icon: '👤',
      onClick: () => console.log('Registro pacientes')
    },
    {
      label: 'Pruebas',
      icon: '🧪',
      onClick: () => console.log('Pruebas')
    },
    {
      label: 'Facturación',
      icon: '💳',
      onClick: () => console.log('Facturación')
    },
    {
      label: 'Exámenes',
      icon: '📋',
      onClick: () => console.log('Exámenes')
    },
    {
      label: 'Registro financiero',
      icon: '💰',
      onClick: () => console.log('Registro financiero')
    }
  ]

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="dashboard-container">
      {/* Menú hamburguesa */}
      <MenuHamburguesa items={menuItems} />

      {/* Contenido principal */}
      <main className="dashboard-content">
        {/* Card de bienvenida */}
        <div className="welcome-card">
          <div className="welcome-icon">👋</div>
          <h1 className="welcome-title">Bienvenido/a, {user.nombre}!</h1>
          <p className="welcome-subtitle">
            {user.email}
          </p>
          
          <div className="user-info">
            <div className="info-item">
              <span className="info-label">Nombre completo:</span>
              <span className="info-value">{user.nombre} {user.apellido}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Correo:</span>
              <span className="info-value">{user.email}</span>
            </div>
            {user.creado_en && (
              <div className="info-item">
                <span className="info-label">Cuenta creada:</span>
                <span className="info-value">
                  {new Date(user.creado_en).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="logout-button">
            Cerrar sesión
          </button>
        </div>

        {/* Grid de accesos rápidos */}
        <div className="quick-access">
          <h2 className="quick-access-title">Acceso rápido</h2>
          <div className="quick-access-grid">
            {menuItems.map((item, index) => (
              <button
                key={index}
                className="quick-access-item"
                onClick={item.onClick}
              >
                <div className="quick-access-icon">{item.icon}</div>
                <div className="quick-access-label">{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage

