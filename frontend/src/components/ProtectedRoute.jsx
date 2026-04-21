import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  getStoredUser,
  getStoredPermissions,
  isMasterUser,
  saveStoredPermissions
} from '../utils/permissions'

export default function ProtectedRoute({ children, permissionKey }) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    const user = getStoredUser()
    const token = localStorage.getItem('access_token')

    if (!token || !user) {
      navigate('/login')
      return
    }

    const checkAccess = async () => {
      let permissions = getStoredPermissions()

      if (!permissionKey) {
        setIsLoading(false)
        return
      }

      if (permissions[permissionKey] === undefined) {
        try {
          const response = await api.getMyPermissions()
          if (response?.permissions) {
            saveStoredPermissions(response.permissions)
            permissions = response.permissions
            window.dispatchEvent(new Event('permissionsUpdated'))
          }
        } catch (error) {
          console.error('Error obteniendo permisos:', error)
        }
      }

      if (isMasterUser(user) || permissions[permissionKey] === true) {
        setIsLoading(false)
        return
      }

      setBlocked(true)
      setIsLoading(false)
      setTimeout(() => {
        navigate('/dashboard')
      }, 1800)
    }

    checkAccess()
  }, [navigate, permissionKey])

  if (isLoading) {
    return null
  }

  if (blocked) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h2 style={styles.title}>Acceso denegado</h2>
          <p style={styles.message}>Este apartado está bloqueado para tu usuario.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    zIndex: 9999,
    padding: '1rem'
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    padding: '2rem',
    borderRadius: '24px',
    background: '#ffffff',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
    textAlign: 'center'
  },
  title: {
    margin: 0,
    fontSize: '1.45rem',
    color: '#2563eb'
  },
  message: {
    marginTop: '1rem',
    color: '#334155',
    fontSize: '1rem',
    lineHeight: 1.6
  }
}
