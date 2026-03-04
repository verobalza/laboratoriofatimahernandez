/**
 * MenuPage.jsx
 * 
 * Página de demostración del menú hamburgesa.
 * Rediseñada con el mismo estilo minimalista del dashboard:
 * - Branding del laboratorio en esquina superior izquierda
 * - Imagen SVG alusiva a laboratorio centrada
 * - Menú hamburguesa en esquina superior derecha
 * - Accesible en /menu para desarrollo
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
      {/* Menú hamburguesa */}
      <MenuHamburguesa items={menuItems} />

      {/* Branding del laboratorio - Esquina superior izquierda */}
      <div className="menu-lab-branding">
        <div className="menu-lab-branding-text">
          <h3 className="menu-lab-name">Laboratorio Bioclínico</h3>
          <p className="menu-lab-subtitle">Lc. Fátima Hernández</p>
        </div>
      </div>

      {/* Contenido principal - Imagen + Overlay */}
      <main className="menu-page-content">
        <div className="menu-lab-visual-container">
          {/* Imagen de laboratorio con overlay */}
          <div className="menu-lab-image-wrapper">
            <svg className="menu-lab-image" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
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
            <div className="menu-lab-overlay"></div>
          </div>

          {/* Información del usuario (subtil) */}
          <div className="menu-user-welcome-subtle">
            <p className="menu-welcome-text">Modo de Demostración - Menú Hamburguesa</p>
            <p className="menu-info-text">Haz click en el ☰ para ver la animación del menú</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default MenuPage

