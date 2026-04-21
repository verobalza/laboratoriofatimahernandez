/**
 * API Service
 * 
 * Este m├│dulo contiene todas las funciones para comunicarse con el backend.
 * 
 * Ejemplo de uso:
 * import { healthCheck } from './api'
 * 
 * const response = await healthCheck()
 * console.log(response) // { status: 'ok' }
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Funci├│n auxiliar para hacer requests
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
   * Obtener informaci├│n del servidor
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
   * Iniciar sesi├│n
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
   * Obtener informaci├│n del usuario actual (requiere token)
   */
  async getCurrentUser() {
    return request(`${API_URL}/auth/me`, {
      method: 'GET'
    })
  },

  /**
   * Cerrar sesi├│n
   */
  async logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },

  /* Pacientes */
  async createPaciente(data) {
    return request(`${API_URL}/pacientes`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async searchPacientes(search) {
    const url = new URL(`${API_URL}/pacientes`)
    if (search) url.searchParams.append('search', search)
    return request(url.toString(), { method: 'GET' })
  },

  async getPaciente(id) {
    return request(`${API_URL}/pacientes/${id}`, { method: 'GET' })
  },

  async updatePaciente(id, data) {
    return request(`${API_URL}/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /* Pruebas */
  async createPrueba(data) {
    return request(`${API_URL}/pruebas`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async searchPruebas(search) {
    const url = new URL(`${API_URL}/pruebas`)
    if (search) url.searchParams.append('search', search)
    return request(url.toString(), { method: 'GET' })
  },

  async getPrueba(id) {
    return request(`${API_URL}/pruebas/${id}`, { method: 'GET' })
  },

  async updatePrueba(id, data) {
    return request(`${API_URL}/pruebas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async getPruebasCount() {
    return request(`${API_URL}/pruebas/count/total`, { method: 'GET' })
  },

  async getAllPruebas() {
    return request(`${API_URL}/pruebas`, { method: 'GET' })
  },

  /* Examenes */
  async createExamen(data) {
    return request(`${API_URL}/examenes`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async createExamenesBatch(examenes) {
    return request(`${API_URL}/examenes/batch`, {
      method: 'POST',
      body: JSON.stringify(examenes),
    })
  },

  async getExamenesByDate(fecha) {
    const url = new URL(`${API_URL}/examenes`)
    url.searchParams.append('fecha', fecha)
    return request(url.toString(), { method: 'GET' })
  },

  async countExamenesByDate(fecha) {
    const url = new URL(`${API_URL}/examenes/count`)
    url.searchParams.append('fecha', fecha)
    return request(url.toString(), { method: 'GET' })
  },

  async getExamenesPaciente(paciente_id, fecha = null) {
    const url = new URL(`${API_URL}/examenes/paciente/${paciente_id}`)
    if (fecha) url.searchParams.append('fecha', fecha)
    return request(url.toString(), { method: 'GET' })
  },

  async searchExamenes(search) {
    const url = new URL(`${API_URL}/examenes`)
    if (search) url.searchParams.append('search', search)
    return request(url.toString(), { method: 'GET' })
  },

  async getExamen(id) {
    return request(`${API_URL}/examenes/${id}`, { method: 'GET' })
  },

  async updateExamen(id, data) {
    return request(`${API_URL}/examenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /* Facturaci├│n */
  async buscarPacientesFact(search) {
    const url = new URL(`${API_URL}/facturacion/pacientes`)
    if (search) url.searchParams.append('search', search)
    return request(url.toString(), { method: 'GET' })
  },

  async obtenerVisitas(pacienteId) {
    return request(`${API_URL}/facturacion/visitas/${pacienteId}`, { method: 'GET' })
  },

  async obtenerDetalleVisita(pacienteId, fecha) {
    return request(`${API_URL}/facturacion/visita/${pacienteId}/${fecha}`, { method: 'GET' })
  },

  async generarTicket(data) {
    return request(`${API_URL}/facturacion/ticket`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async generarFactura(data) {
    return request(`${API_URL}/facturacion/factura`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async obtenerFactura(facturaId) {
    return request(`${API_URL}/facturacion/factura/${facturaId}`, { method: 'GET' })
  }
}

export default api
