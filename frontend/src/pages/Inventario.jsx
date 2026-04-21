import React from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'

function Inventario() {
  const navigate = useNavigate()

  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Facturación', icon: '💳', onClick: () => navigate('/facturacion') },
    { label: 'Inventario', icon: '📦', onClick: () => navigate('/inventario') },
    { label: 'Registro financiero', icon: '💰', onClick: () => navigate('/registro-financiero') }
  ]

  return (
    <div className="inventario-container">
      <MenuHamburguesa items={menuItems} />
      <div className="inventario-branding">
        <div className="inventario-branding-text">
          <h3 className="inventario-lab-name">Inventario</h3>
          <p className="inventario-lab-subtitle">Gestión de stocks y entradas/salidas</p>
        </div>
      </div>

      <main className="inventario-content">
        <section className="inventario-section">
          <h1>Inventario</h1>
          <p>Esta sección está disponible para gestionar inventario del laboratorio.</p>
        </section>
      </main>
    </div>
  )
}

export default Inventario
