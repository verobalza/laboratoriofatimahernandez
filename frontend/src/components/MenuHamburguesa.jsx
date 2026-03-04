/**
 * MenuHamburguesa.jsx
 * 
 * Componente de menú hamburguesa con animación suave (slide-in).
 * - Ícono hamburguesa en la esquina superior derecha
 * - Menú adaptable a props
 * - Animación de deslizamiento suave
 * - Cierre al hacer clic fuera
 */

import React, { useState } from 'react'
import './MenuHamburguesa.css'

function MenuHamburguesa({ items = [] }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleItemClick = (onClick) => {
    if (onClick) {
      onClick()
    }
    setIsOpen(false)
  }

  const handleBackdropClick = () => {
    setIsOpen(false)
  }

  // Items por defecto si no se proporcionan
  const defaultItems = [
    { label: 'Registro pacientes', icon: '👤' },
    { label: 'Pruebas', icon: '🧪' },
    { label: 'Facturación', icon: '💳' },
    { label: 'Exámenes', icon: '📋' },
    { label: 'Registro financiero', icon: '💰' }
  ]

  const menuItems = items.length > 0 ? items : defaultItems

  return (
    <>
      {/* Botón hamburguesa */}
      <button
        className={`hamburger-button ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Abrir menú"
        title="Menú"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Fondo oscuro (backdrop) */}
      {isOpen && (
        <div className="menu-backdrop" onClick={handleBackdropClick}></div>
      )}

      {/* Menú desplegable */}
      <nav className={`hamburger-menu ${isOpen ? 'open' : ''}`}>
        <ul className="menu-list">
          {menuItems.map((item, index) => (
            <li key={index} className="menu-item">
              <button
                className="menu-link"
                onClick={() => handleItemClick(item.onClick)}
              >
                {item.icon && <span className="menu-icon">{item.icon}</span>}
                <span className="menu-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

export default MenuHamburguesa
