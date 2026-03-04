import { useState, useEffect } from 'react'
import api from '../services/api'

/**
 * Custom hook para verificar el estado del servidor
 * 
 * @returns {Object} { isHealthy, loading, error }
 * 
 * Ejemplo:
 * const { isHealthy, loading, error } = useServerHealth()
 */
export function useServerHealth() {
  const [isHealthy, setIsHealthy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await api.healthCheck()
        setIsHealthy(response.status === 'ok')
        setError(null)
      } catch (err) {
        setIsHealthy(false)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkHealth()
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkHealth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return { isHealthy, loading, error }
}

export default useServerHealth
