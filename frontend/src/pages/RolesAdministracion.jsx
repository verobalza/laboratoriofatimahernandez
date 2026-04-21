import React, { useEffect, useState } from 'react'
import api from '../services/api'
import './RolesAdministracion.css'

const SECTIONS = [
  { key: 'registro_pacientes', label: 'Registro de Pacientes' },
  { key: 'pruebas', label: 'Pruebas' },
  { key: 'examenes', label: 'Exámenes' },
  { key: 'facturacion', label: 'Facturación' },
  { key: 'registro_financiero', label: 'Registro Financiero' },
  { key: 'inventario', label: 'Inventario' },
  { key: 'roles', label: 'Administración de Roles' }
]

const initialPermissions = SECTIONS.reduce((acc, section) => {
  acc[section.key] = false
  return acc
}, {})

export default function RolesAdministracion() {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [permissions, setPermissions] = useState(initialPermissions)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    loadUsers()
    // Obtener usuario actual desde localStorage
    const stored = localStorage.getItem('user')
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing current user:', error)
      }
    }
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await api.getRoleUsers()
      setUsers(response || [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      setMessage({ type: 'error', text: 'No se pudo cargar la lista de usuarios.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectUser = async (user) => {
    setSelectedUser(user)
    setMessage({ type: '', text: '' })
    setLoading(true)

    try {
      const response = await api.getUserPermissions(user.id)
      setPermissions(response.permissions || initialPermissions)
    } catch (error) {
      console.error('Error cargando permisos:', error)
      setMessage({ type: 'error', text: 'No se pudieron cargar los permisos del usuario.' })
      setPermissions(initialPermissions)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) {
      setMessage({ type: 'error', text: 'Selecciona primero un usuario.' })
      return
    }

    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      await api.saveUserPermissions(selectedUser.id, permissions)
      setMessage({ type: 'success', text: 'Permisos guardados correctamente.' })
      window.dispatchEvent(new Event('permissionsUpdated'))
    } catch (error) {
      console.error('Error guardando permisos:', error)
      setMessage({ type: 'error', text: 'No se pudieron guardar los permisos. Intenta de nuevo.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      setMessage({ type: 'error', text: 'Selecciona primero un usuario.' })
      return
    }

    // Verificar que no sea master
    const masterEmail = 'veronicabalza19@gmail.com'
    if (selectedUser.email.toLowerCase() === masterEmail.toLowerCase()) {
      setMessage({ type: 'error', text: 'No puedes eliminar al usuario master.' })
      return
    }

    // Verificar que no sea el usuario actual
    if (currentUser && selectedUser.id === currentUser.id) {
      setMessage({ type: 'error', text: 'No puedes eliminar tu propio usuario.' })
      return
    }

    // Pedir confirmación
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.\n\n${selectedUser.nombre} ${selectedUser.apellido}`
    )

    if (!confirmed) {
      return
    }

    setDeleting(true)
    setMessage({ type: '', text: '' })

    try {
      await api.deleteUser(selectedUser.id)
      setMessage({ type: 'success', text: 'Usuario eliminado correctamente.' })
      setSelectedUser(null)
      setPermissions(initialPermissions)
      // Recargar lista de usuarios
      await loadUsers()
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      setMessage({ type: 'error', text: 'No se pudo eliminar el usuario. Intenta de nuevo.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="roles-page">
      <div className="roles-panel">
        <header className="roles-header">
          <div>
            <p className="roles-badge">Administración de Roles</p>
            <h1 className="roles-title">Control de permisos</h1>
            <p className="roles-subtitle">
              Selecciona un usuario y edita los apartados a los que puede acceder.
            </p>
          </div>
        </header>

        {message.text && (
          <div className={`roles-message ${message.type}`}>{message.text}</div>
        )}

        <div className="roles-grid">
          <section className="roles-card roles-users-card">
            <h2 className="roles-card-title">Usuarios registrados</h2>
            <div className="roles-user-list">
              {loading && !users.length ? (
                <p className="roles-empty">Cargando usuarios...</p>
              ) : users.length === 0 ? (
                <p className="roles-empty">No se encontraron usuarios.</p>
              ) : (
                <ul>
                  {users.map((user) => (
                    <li
                      key={user.id}
                      className={`roles-user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                      onClick={() => handleSelectUser(user)}
                    >
                      <span>{user.nombre} {user.apellido}</span>
                      <small>{user.email}</small>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="roles-card roles-permissions-card">
            <div className="roles-card-top">
              <div>
                <h2 className="roles-card-title">Permisos</h2>
                <p className="roles-card-description">
                  Marca los apartados que este usuario puede usar.
                </p>
              </div>
            </div>

            {selectedUser ? (
              <>
                <div className="roles-selected-user">
                  <p className="roles-selected-label">Usuario seleccionado</p>
                  <p className="roles-selected-name">{selectedUser.nombre} {selectedUser.apellido}</p>
                  <p className="roles-selected-email">{selectedUser.email}</p>
                </div>

                <div className="roles-checkbox-list">
                  {SECTIONS.map((section) => (
                    <label key={section.key} className="roles-checkbox-row">
                      <input
                        type="checkbox"
                        checked={permissions[section.key] || false}
                        onChange={() => handleTogglePermission(section.key)}
                      />
                      <span>{section.label}</span>
                    </label>
                  ))}
                </div>

                <button
                  className="roles-save-button"
                  onClick={handleSavePermissions}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar permisos'}
                </button>

                <button
                  className="roles-delete-button"
                  onClick={handleDeleteUser}
                  disabled={deleting}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar usuario'}
                </button>
              </>
            ) : (
              <div className="roles-empty-state">
                <p>Selecciona un usuario para administrar sus permisos.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
