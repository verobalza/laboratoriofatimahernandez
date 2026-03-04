/**
 * MenuPage.jsx
 * 
 * Página de demostración del menú hamburguesa.
 * Accesible en /menu para ver el componente en desarrollo.
 */

import React, { useState } from 'react'
import MenuHamburguesa from '../components/MenuHamburguesa'
import './MenuPage.css'

function MenuPage() {
  const [userData] = useState({
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com'
  })

  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => alert('Ir a Registro pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => alert('Ir a Pruebas') },
    { label: 'Facturación', icon: '💳', onClick: () => alert('Ir a Facturación') },
    { label: 'Exámenes', icon: '📋', onClick: () => alert('Ir a Exámenes') },
    { label: 'Registro financiero', icon: '💰', onClick: () => alert('Ir a Registro financiero') }
  ]

  return (
    <div className="menu-page-container">
      <div className="menu-page-background"></div>
      
      <MenuHamburguesa items={menuItems} />

      <div className="menu-page-content">
        <div className="menu-page-card">
          <div className="menu-page-header">
            <h1 className="menu-page-title">Demostración del Menú</h1>
            <p className="menu-page-subtitle">Haz click en el ☰ en la esquina superior derecha</p>
          </div>

          <div className="menu-page-demo">
            <div className="demo-section">
              <h2>👤 Usuario</h2>
              <div className="user-info">
                <p><strong>Nombre:</strong> {userData.nombre} {userData.apellido}</p>
                <p><strong>Email:</strong> {userData.email}</p>
              </div>
            </div>

            <div className="demo-section">
              <h2>📋 Opciones del Menú</h2>
              <ul className="menu-list">
                {menuItems.map((item, idx) => (
                  <li key={idx}>
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-label">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="demo-section">
              <h2>✨ Características</h2>
              <ul className="features-list">
                <li>✅ Animación slide-in de 300ms desde la derecha</li>
                <li>✅ Botón hamburguesa fijo en la esquina superior derecha</li>
                <li>✅ Click fuera cierra automáticamente el menú</li>
                <li>✅ Responsive para móvil y desktop</li>
                <li>✅ Dark mode support</li>
                <li>✅ Icono de hamburguesa animado (lineas rotan)</li>
              </ul>
            </div>

            <div className="demo-section">
              <h2>🔗 URL de Esta Página</h2>
              <code className="code-block">http://localhost:5174/menu</code>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="back-button"
          >
            ← Volver a Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default MenuPage
