import React from 'react'

/**
 * Componente StatusBadge
 * 
 * Muestra el estado del servidor (online/offline)
 * 
 * Props:
 * - isHealthy (bool): si el servidor está online
 * - loading (bool): si se está verificando el estado
 */
export function StatusBadge({ isHealthy, loading }) {
  return (
    <div style={{
      display: 'inline-block',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      backgroundColor: loading ? '#fbbf24' : isHealthy ? '#10b981' : '#ef4444',
      color: 'white'
    }}>
      {loading ? '⏳ Verificando...' : isHealthy ? '✅ Servidor Online' : '❌ Servidor Offline'}
    </div>
  )
}

export default StatusBadge
