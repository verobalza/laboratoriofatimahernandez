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

const rawApiUrl = import.meta.env.VITE_API_URL 
// Normalizar para evitar doble slash (ej. "https://host/" + "/health" => "https://host//health")
const API_URL = rawApiUrl.replace(/\/+$/,'')

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
    let errorMessage = `HTTP ${response.status}`

    try {
      const errorData = await response.json()
      const detail = errorData?.detail
      if (typeof detail === 'string') {
        errorMessage = detail
      } else if (Array.isArray(detail)) {
        errorMessage = detail
          .map((d) => {
            if (typeof d === 'string') return d
            const location = Array.isArray(d?.loc) ? d.loc.join('.') : 'campo'
            return `${location}: ${d?.msg || JSON.stringify(d)}`
          })
          .join(' | ')
      } else if (detail && typeof detail === 'object') {
        errorMessage = JSON.stringify(detail)
      } else {
        errorMessage = errorData?.message || errorMessage
      }
    } catch (parseError) {
      // Si la respuesta no es JSON (ej. HTML de error), incluir el texto en el mensaje
      const text = await response.text().catch(() => null)
      if (text) errorMessage += ` - ${text.slice(0, 200)}`
    }

    throw new Error(errorMessage)
  }

  // Manejar respuestas 204 No Content (sin body)
  if (response.status === 204) {
    const method = options.method || 'GET'
    // Para GET, retornar array vacío; para acciones, retornar success
    return method === 'GET' ? [] : { success: true }
  }

  // Intentar parsear la respuesta JSON siempre
  // (no confiar en content-length porque algunos servidores no lo envían correctamente)
  try {
    const jsonData = await response.json()
    return jsonData
  } catch (parseError) {
    // Si falla el parse JSON, significa que no hay contenido
    const method = options.method || 'GET'
    console.warn('Failed to parse JSON response:', parseError)
    // Para GET, retornar array vacío; para acciones, retornar success
    return method === 'GET' ? [] : { success: true }
  }
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

  async getMyPermissions() {
    return request(`${API_URL}/roles/me`, { method: 'GET' })
  },

  async getRoleUsers() {
    return request(`${API_URL}/roles/users`, { method: 'GET' })
  },

  async getUserPermissions(userId) {
    return request(`${API_URL}/roles/${userId}/permissions`, { method: 'GET' })
  },

  async saveUserPermissions(userId, permissions) {
    return request(`${API_URL}/roles/${userId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions })
    })
  },

  async deleteUser(userId) {
    return request(`${API_URL}/roles/${userId}`, {
      method: 'DELETE'
    })
  },

  /**
   * Cerrar sesión
   */
  async logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('user_permissions')
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
    console.debug('[api] searchPacientes URL:', url.toString())
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

  async deletePaciente(id) {
    return request(`${API_URL}/pacientes/${id}`, {
      method: 'DELETE',
    })
  },

  async createEntidad(data) {
    return request(`${API_URL}/entidades`, {
      method: 'POST',
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

  async deletePrueba(id) {
    return request(`${API_URL}/pruebas/${id}`, {
      method: 'DELETE',
    })
  },

  async getPruebasCount() {
    return request(`${API_URL}/pruebas/count/total`, { method: 'GET' })
  },

  async getAllPruebas() {
    return request(`${API_URL}/pruebas`, { method: 'GET' })
  },

  async createUnidadMedida(nombre) {
    return request(`${API_URL}/pruebas/unidades`, {
      method: 'POST',
      body: JSON.stringify({ nombre })
    })
  },

  async getUnidadesMedida() {
    return request(`${API_URL}/pruebas/unidades`, { method: 'GET' })
  },

  async createTipoMuestra(nombre) {
    return request(`${API_URL}/pruebas/tipos`, {
      method: 'POST',
      body: JSON.stringify({ nombre })
    })
  },

  async getTiposMuestra() {
    return request(`${API_URL}/pruebas/tipos`, { method: 'GET' })
  },

  async createArea(nombre) {
    return request(`${API_URL}/pruebas/areas`, {
      method: 'POST',
      body: JSON.stringify({ nombre })
    })
  },

  async getAreas() {
    return request(`${API_URL}/pruebas/areas`, { method: 'GET' })
  },

  /* Grupos de Pruebas */
  async getAllGrupos() {
    return request(`${API_URL}/grupos`, { method: 'GET' })
  },

  async getGrupo(id) {
    return request(`${API_URL}/grupos/${id}`, { method: 'GET' })
  },

  async createGrupo(data) {
    return request(`${API_URL}/grupos`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateGrupo(id, data) {
    return request(`${API_URL}/grupos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteGrupo(id) {
    return request(`${API_URL}/grupos/${id}`, {
      method: 'DELETE',
    })
  },

  async getPruebasByGrupo(grupo_id) {
    return request(`${API_URL}/grupos/${grupo_id}/pruebas`, { method: 'GET' })
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

  /* Facturación */
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
  },

  async guardarFacturaPDF(pdfData) {
    return request(`${API_URL}/facturacion/pdf`, {
      method: 'POST',
      body: JSON.stringify(pdfData),
    })
  },

  async obtenerPDFsPaciente(pacienteId) {
    return request(`${API_URL}/facturacion/pdf/${pacienteId}`, { method: 'GET' })
  },

  async obtenerPDFFactura(facturaId) {
    return request(`${API_URL}/facturacion/pdf/factura/${facturaId}`, { method: 'GET' })
  },

  /* Financiero */
  async obtenerTasaCambio() {
    return request(`${API_URL}/api/financiero/tasa`, { method: 'GET' })
  },

  async actualizarTasaCambio(tasa) {
    return request(`${API_URL}/api/financiero/tasa`, {
      method: 'POST',
      body: JSON.stringify({ tasa }),
    })
  },

  async registrarMovimientoFinanciero(datos) {
    return request(`${API_URL}/api/financiero/movimiento`, {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  },

  /* Examenes PDF */
  async getExamenesPDF(fecha) {
    const url = new URL(`${API_URL}/examenes/pdf`)
    if (fecha) url.searchParams.append('fecha', fecha)
    return request(url.toString(), { method: 'GET' })
  },

  async getExamenesPDFByPaciente(pacienteId) {
    return request(`${API_URL}/examenes/pdf/paciente/${pacienteId}`, { method: 'GET' })
  },

  async getExamenPDF(id) {
    return request(`${API_URL}/examenes/pdf/${id}`, { method: 'GET' })
  },

  async saveExamenPDF(datos) {
    return request(`${API_URL}/examenes/pdf`, {
      method: 'POST',
      body: JSON.stringify(datos),
    })
  },

  async uploadPDF(formData) {
    // usa fetch directo porque es multipart
    const response = await fetch(`${API_URL}/examenes/pdf/upload`, {
      method: 'POST',
      body: formData
    })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(err || 'Failed to upload PDF')
    }
    return await response.json()
  },

  async obtenerMovimientosFinancieros() {
    return request(`${API_URL}/api/financiero/movimientos`, { method: 'GET' })
  },

  async obtenerMovimientosFiltrando(tipo, fechaDesde, fechaHasta) {
    const url = new URL(`${API_URL}/api/financiero/movimientos/filtro`)
    if (tipo) url.searchParams.append('tipo', tipo)
    if (fechaDesde) url.searchParams.append('fecha_desde', fechaDesde)
    if (fechaHasta) url.searchParams.append('fecha_hasta', fechaHasta)
    return request(url.toString(), { method: 'GET' })
  },

  async obtenerResumenFinanciero() {
    return request(`${API_URL}/api/financiero/resumen`, { method: 'GET' })
  },

  async obtenerResumenPorTipo() {
    return request(`${API_URL}/api/financiero/resumen/tipos`, { method: 'GET' })
  },

  /* === EXÁMENES ESPECIALIZADOS: ORINA Y HECES === */

  /* ORINA */
  async createOrina(data) {
    return request(`${API_URL}/api/orina`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getOrina(orinaId) {
    return request(`${API_URL}/api/orina/${orinaId}`, { method: 'GET' })
  },

  async updateOrina(orinaId, data) {
    return request(`${API_URL}/api/orina/${orinaId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteOrina(orinaId) {
    return request(`${API_URL}/api/orina/${orinaId}`, { method: 'DELETE' })
  },

  async getOrinaByPaciente(pacienteId) {
    return request(`${API_URL}/api/orina/paciente/${pacienteId}`, { method: 'GET' })
  },

  /* HECES */
  async createHeces(data) {
    return request(`${API_URL}/api/heces`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getHeces(hecesId) {
    return request(`${API_URL}/api/heces/${hecesId}`, { method: 'GET' })
  },

  async updateHeces(hecesId, data) {
    return request(`${API_URL}/api/heces/${hecesId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteHeces(hecesId) {
    return request(`${API_URL}/api/heces/${hecesId}`, { method: 'DELETE' })
  },

  async getHecesByPaciente(pacienteId) {
    return request(`${API_URL}/api/heces/paciente/${pacienteId}`, { method: 'GET' })
  },

  /* PDF */
  async generarPDF(facturaId) {
    return request(`${API_URL}/facturacion/pdf/${facturaId}`, { method: 'POST' })
  },

  async generarPDFTicket(ticketData) {
    return request(`${API_URL}/facturacion/ticket/pdf`, {
      method: 'POST',
      body: JSON.stringify(ticketData),
    })
  },

  async obtenerPDF(id) {
    return request(`${API_URL}/facturacion/pdf/${id}`, { method: 'GET' })
  }
  
}

export default api
