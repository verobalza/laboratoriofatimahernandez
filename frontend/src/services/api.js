/**
 * API Service
 * 
 * Este módulo contiene todas las funciones para comunicarse con el backend.
 * 
 * Ejemplo de uso:
 * import { healthCheck } from './api'
 * 
 * const response = await healthCheck()
 * console.log(response) // { status: 'ok' }
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  /**
   * Health check del servidor
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_URL}/health`)
      if (!response.ok) throw new Error('Health check failed')
      return await response.json()
    } catch (error) {
      console.error('Health check error:', error)
      throw error
    }
  },

  /**
   * Obtener información del servidor
   */
  async getInfo() {
    try {
      const response = await fetch(`${API_URL}/`)
      if (!response.ok) throw new Error('Failed to get info')
      return await response.json()
    } catch (error) {
      console.error('Info fetch error:', error)
      throw error
    }
  }
}

export default api
