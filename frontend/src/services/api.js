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

/**
 * Función auxiliar para hacer requests
 */
async function request(url, options = {}) {
  const token = localStorage.getItem('access_token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || `HTTP ${response.status}`)
  }

  return await response.json()
}

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
  },

  /**
   * Registrar un nuevo usuario
   * @param {Object} data - { nombre, apellido, email, password }
   * @returns {Object} - { message, user: { id, nombre, apellido, email, creado_en } }
   */
  async register(data) {
    return request(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Iniciar sesión
   * @param {Object} data - { email, password }
   * @returns {Object} - { access_token, token_type, user: { id, nombre, apellido, email, creado_en } }
   */
  async login(data) {
    return request(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  /**
   * Obtener información del usuario actual (requiere token)
   */
  async getCurrentUser() {
    return request(`${API_URL}/auth/me`, {
      method: 'GET'
    })
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }
}

export default api
