/**
 * MenuHamburguesa.jsx
 * 
 * Componente de menú hamburguesa con animación suave (slide-in).
 * - Ícono hamburguesa en la esquina superior derecha
 * - Menú adaptable a props
 * - Animación de deslizamiento suave
 * - Cierre al hacer clic fuera
 */

import React, { useEffect, useState } from 'react'
import './MenuHamburguesa.css'
import { getStoredPermissions, getStoredUser, getPermissionKeyFromLabel } from '../utils/permissions'

function MenuHamburguesa({ items = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [permissions, setPermissions] = useState(getStoredPermissions())

  useEffect(() => {
    const handleUpdate = () => {
      setPermissions(getStoredPermissions())
    }

    window.addEventListener('permissionsUpdated', handleUpdate)
    return () => window.removeEventListener('permissionsUpdated', handleUpdate)
  }, [])

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
    { label: 'Exámenes', icon: '📋' },
    { label: 'Facturación', icon: '💳' },
    { label: 'Inventario', icon: '📦' },
    { label: 'Registro financiero', icon: '💰' }
  ]

  const user = getStoredUser()

  const allowedItems = (items.length > 0 ? items : defaultItems).filter((item) => {
    const permissionKey = item.permissionKey || getPermissionKeyFromLabel(item.label)
    if (!permissionKey) {
      return true
    }

    if (user && user.email?.toLowerCase() === 'veronicabalza19@gmail.com') {
      return true
    }

    return Boolean(permissions[permissionKey])
  })

  const menuItems = allowedItems

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
