import React, { useEffect } from 'react'
import MenuHamburguesa from '../components/MenuHamburguesa'
import { Outlet, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { saveStoredPermissions, getStoredUser } from '../utils/permissions'

export default function DashboardLayout() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const user = getStoredUser()

    if (!token || !user) {
      return
    }

    api.getMyPermissions()
      .then((response) => {
        if (response?.permissions) {
          saveStoredPermissions(response.permissions)
          window.dispatchEvent(new Event('permissionsUpdated'))
        }
      })
      .catch((error) => {
        console.warn('No se pudieron cargar los permisos:', error)
      })
  }, [])

  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Facturación', icon: '💳', onClick: () => navigate('/facturacion') },
    { label: 'Inventario', icon: '📦', onClick: () => navigate('/inventario') },
    { label: 'Registro financiero', icon: '💰', onClick: () => navigate('/registro-financiero') },
    { label: 'Administración de Roles', icon: '🛡️', onClick: () => navigate('/roles') }
  ]

  return (
    <div className="dashboard-layout">
      <MenuHamburguesa items={menuItems} />
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  )
}
