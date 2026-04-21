/**
 * DashboardPage.jsx
 * 
 * Dashboard con branding + imagen personalizada + menú desde el layout.
 */

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandingLink from '../components/BrandingLink'
import api from '../services/api'
import './Dashboard.css'

function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ============ ESTADO PARA TASA DE CAMBIO ============
  const [tasaCambio, setTasaCambio] = useState(45)
  const [nuevaTasa, setNuevaTasa] = useState('')
  const [submittingTasa, setSubmittingTasa] = useState(false)
  const [errorTasa, setErrorTasa] = useState('')
  const [mensaje, setMensaje] = useState({ type: '', text: '' })

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')

    if (!storedUser || !token) {
      navigate('/login')
      return
    }

    try {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setLoading(false)
    } catch (error) {
      console.error('Error parsing user:', error)
      navigate('/login')
    }

    // Cargar tasa de cambio
    loadTasaCambio()
  }, [navigate])

  // ============ FUNCIONES PARA TASA DE CAMBIO ============
  const loadTasaCambio = async () => {
    try {
      const tasaData = await api.obtenerTasaCambio()
      setTasaCambio(tasaData.tasa)
      setNuevaTasa(tasaData.tasa.toString())
    } catch (error) {
      console.error('Error cargando tasa:', error)
    }
  }

  const handleSubmitTasa = async (e) => {
    e.preventDefault()
    setErrorTasa('')

    if (!nuevaTasa.trim()) {
      setErrorTasa('Ingrese la tasa')
      return
    }

    const tasaNum = parseFloat(nuevaTasa)
    if (isNaN(tasaNum) || tasaNum <= 0) {
      setErrorTasa('Ingrese un valor válido (> 0)')
      return
    }

    setSubmittingTasa(true)

    try {
      const response = await api.actualizarTasaCambio(tasaNum)
      setTasaCambio(response.tasa)
      setMensaje({ type: 'success', text: 'Tasa actualizada correctamente. Precios en USD recalculados.' })
      setTimeout(() => setMensaje({ type: '', text: '' }), 3000)
    } catch (error) {
      console.error('Error actualizando tasa:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al actualizar tasa' })
      setTimeout(() => setMensaje({ type: '', text: '' }), 3000)
    } finally {
      setSubmittingTasa(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">

         <BrandingLink />

         {/* Panel de Tasa de Cambio */}
         <div className="dashboard-tasa-panel">
           <div className="tasa-panel-header">
             <div className="tasa-current">
               <span className="tasa-label">💱 Tasa actual:</span>
               <span className="tasa-value">1 USD = Bs {tasaCambio.toFixed(4)}</span>
             </div>
           </div>
           <form onSubmit={handleSubmitTasa} className="tasa-compact-form">
             <div className="tasa-input-row">
               <span className="currency-prefix">1 USD =</span>
               <input
                 id="dashboard-tasa"
                 type="number"
                 placeholder="45"
                 min="0"
                 value={nuevaTasa}
                 onChange={(e) => {
                   setNuevaTasa(e.target.value)
                   setErrorTasa('')
                 }}
                 className={`form-input-compact ${errorTasa ? 'error' : ''}`}
               />
               <span className="currency-suffix">Bs</span>
               <button type="submit" className="btn-compact" disabled={submittingTasa}>
                 {submittingTasa ? '...' : '✓'}
               </button>
             </div>
             {errorTasa && <span className="error-message-compact">{errorTasa}</span>}
           </form>
         </div>

         {/* Mensaje de estado */}
         {mensaje.text && (
           <div className={`dashboard-message message-${mensaje.type}`}>
             {mensaje.text}
           </div>
         )}

      {/* Contenido principal */}
      <main className="dashboard-content">
        <div className="lab-visual-container">

          {/* Imagen personalizada */}
          

          {/* Bienvenida al usuario */}
          {user && (
            <div className="user-welcome-subtle">
              <p className="welcome-text">
                Bienvenido/a, <strong>{user.nombre}</strong>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
