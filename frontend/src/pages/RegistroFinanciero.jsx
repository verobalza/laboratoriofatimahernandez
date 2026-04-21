/**
 * RegistroFinanciero.jsx
 * 
 * Módulo de Registro Financiero del laboratorio
 * Muestra totales diarios, semanales, mensuales y anuales
 * Gestiona la tasa de cambio y visualiza movimientos
 * 
 * Funcionalidad:
 * - Dashboard con totales en Bs y USD
 * - Gestión de tasa de cambio
 * - Tabla de movimientos financieros
 * - Filtrado por tipo y fecha
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import api from '../services/api'
import './RegistroFinanciero.css'

function RegistroFinanciero() {
  const navigate = useNavigate()

  // ============ ESTADO GENERAL ============
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState({ type: '', text: '' })

  // ============ DATOS FINANCIEROS ============
  const [tasaCambio, setTasaCambio] = useState(45)
  const [resumen, setResumen] = useState({
    total_diario_bs: 0,
    total_diario_usd: 0,
    total_semanal_bs: 0,
    total_semanal_usd: 0,
    total_mensual_bs: 0,
    total_mensual_usd: 0,
    total_anual_bs: 0,
    total_anual_usd: 0
  })

  // ============ MOVIMIENTOS ============
  const [movimientos, setMovimientos] = useState([])
  const [filtroTipo, setFiltroTipo] = useState('')
  const [displayedMovimientos, setDisplayedMovimientos] = useState([])
  const [totalesPorTipo, setTotalesPorTipo] = useState({
    tickets_bs: 0,
    tickets_usd: 0,
    facturas_bs: 0,
    facturas_usd: 0
  })

  // ============ FILTROS DE FECHA ============
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  // ============ TASA DE CAMBIO ============
  const [nuevaTasa, setNuevaTasa] = useState('')
  const [submittingTasa, setSubmittingTasa] = useState(false)
  const [errorTasa, setErrorTasa] = useState('')

  // ============ MENÚ HAMBURGUESA ============
  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Facturación', icon: '💳', onClick: () => navigate('/facturacion') },
    { label: 'Inventario', icon: '📦', onClick: () => navigate('/inventario') },
    { label: 'Registro financiero', icon: '💰', onClick: () => navigate('/registro-financiero') }
  ]

  // ============ EFECTOS ============
  useEffect(() => {
    loadDatos()
  }, [])

  // ============ FUNCIONES PRINCIPALES ============
  const loadDatos = async () => {
    setLoading(true)
    try {
      // Cargar tasa de cambio
      const tasaData = await api.obtenerTasaCambio()
      setTasaCambio(tasaData.tasa)
      setNuevaTasa(tasaData.tasa.toString())

      // Cargar resumen financiero
      const resumenData = await api.obtenerResumenFinanciero()
      setResumen(resumenData)

      // Cargar totales por tipo
      const totalesPorTipoData = await api.obtenerResumenPorTipo()
      setTotalesPorTipo(totalesPorTipoData)

      // Cargar movimientos
      const movimientosData = await api.obtenerMovimientosFinancieros()
      setMovimientos(movimientosData || [])
      aplicarFiltros('', '', '')

      setMensaje({ type: '', text: '' })
    } catch (error) {
      console.error('Error cargando datos:', error)
      setMensaje({ type: 'error', text: 'Error al cargar datos financieros' })
    } finally {
      setLoading(false)
    }
  }

  // ============ TASA DE CAMBIO ============
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
      await loadDatos()
    } catch (error) {
      console.error('Error actualizando tasa:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al actualizar tasa' })
    } finally {
      setSubmittingTasa(false)
    }
  }

  // ============ FILTRADO DE MOVIMIENTOS ============
  const handleFiltroTipo = (tipo) => {
    setFiltroTipo(tipo)
    aplicarFiltros(tipo, fechaInicio, fechaFin)
  }

  const handleFiltroFecha = (inicio, fin) => {
    setFechaInicio(inicio)
    setFechaFin(fin)
    aplicarFiltros(filtroTipo, inicio, fin)
  }

  const aplicarFiltros = (tipo, inicio, fin) => {
    let filtered = movimientos

    if (tipo) {
      filtered = filtered.filter(m => m.tipo === tipo)
    }

    if (inicio) {
      const fechaInicioDate = new Date(inicio)
      filtered = filtered.filter(m => new Date(m.fecha) >= fechaInicioDate)
    }

    if (fin) {
      const fechaFinDate = new Date(fin)
      fechaFinDate.setHours(23, 59, 59, 999) // Fin del día
      filtered = filtered.filter(m => new Date(m.fecha) <= fechaFinDate)
    }

    setDisplayedMovimientos(filtered)
  }

  // ============ UTILIDADES ============
  const formatearMoneda = (valor) => {
    return valor.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const calcularTotalesPorTipo = (movimientosList, tasa) => {
    const ahora = new Date()
    const diaSemana = ahora.getDay()
    const inicioSemana = new Date(ahora)
    inicioSemana.setDate(ahora.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1))
    inicioSemana.setHours(0, 0, 0, 0)

    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const inicioAnio = new Date(ahora.getFullYear(), 0, 1)

    const initPeriodo = () => ({
      diario_bs: 0,
      diario_usd: 0,
      semanal_bs: 0,
      semanal_usd: 0,
      mensual_bs: 0,
      mensual_usd: 0,
      anual_bs: 0,
      anual_usd: 0
    })

    const totales = {
      ticket: initPeriodo(),
      factura: initPeriodo(),
      combinado: initPeriodo()
    }

    movimientosList.forEach((mov) => {
      const fechaMov = new Date(mov.fecha)
      const tipo = mov.tipo.toLowerCase()
      const monto_bs = Number(mov.monto_bs) || 0
      const monto_usd = monto_bs / tasa  // Calcular USD con tasa actual

      const sumar = (destino) => {
        destino.diario_bs += monto_bs
        destino.diario_usd += monto_usd
        if (fechaMov >= inicioSemana) {
          destino.semanal_bs += monto_bs
          destino.semanal_usd += monto_usd
        }
        if (fechaMov >= inicioMes) {
          destino.mensual_bs += monto_bs
          destino.mensual_usd += monto_usd
        }
        if (fechaMov >= inicioAnio) {
          destino.anual_bs += monto_bs
          destino.anual_usd += monto_usd
        }
      }

      if (tipo === 'ticket' || tipo === 'factura') {
        sumar(totales[tipo])
      }
      sumar(totales.combinado)
    })

    return totales
  }

  const totalesPorTipoPeriodo = calcularTotalesPorTipo(movimientos, tasaCambio)

  // ============ RENDERIZADO ============
  return (
    <div className="registro-financiero-container">
      <MenuHamburguesa items={menuItems} />

      {/* Branding */}
      <div className="financiero-branding">
        <div className="financiero-branding-text">
          <h3 className="financiero-lab-name">Laboratorio Bioclínico</h3>
          <p className="financiero-lab-subtitle">Lc. Fátima Hernández</p>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="financiero-content">
        <div className="financiero-wrapper">
          {/* Encabezado */}
          <div className="page-header financiero-header">
            <div className="header-left">
              <h1 className="page-title">Registro Financiero</h1>
              <p className="financiero-subtitle">Gestiona ingresos y tasa de cambio</p>
            </div>
            <div className="header-right">
              <div className="tasa-chip">
                💱 Tasa actual: 1 USD = Bs {tasaCambio.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Mensaje de estado */}
          {mensaje.text && (
            <div className={`message-box message-${mensaje.type}`}>
              {mensaje.text}
            </div>
          )}

          {/* Tasa de cambio visible y acción rápida */}
          <div className="tasa-panel">
            <div className="tasa-panel-info">
              <p className="tasa-panel-label">Tasa vigente</p>
              <p className="tasa-panel-value">1 USD = Bs {tasaCambio.toFixed(4)}</p>
              <p className="tasa-panel-note">Actualiza la tasa aquí y recalcula los precios en USD de las pruebas.</p>
              <p className="tasa-panel-note">
                Totales actuales: Tickets Bs {formatearMoneda(totalesPorTipo.tickets_bs)} / ${formatearMoneda(totalesPorTipo.tickets_usd)} · Facturas Bs {formatearMoneda(totalesPorTipo.facturas_bs)} / ${formatearMoneda(totalesPorTipo.facturas_usd)}
              </p>
            </div>
            <form onSubmit={handleSubmitTasa} className="tasa-inline-form">
              <label htmlFor="tasa" className="form-label">
                Nuevo valor de tasa
              </label>
              <div className="tasa-input-group">
                <span className="currency-prefix">1 USD = </span>
                <input
                  id="tasa"
                  type="number"
                  placeholder="45"
                  min="0"
                  value={nuevaTasa}
                  onChange={(e) => {
                    setNuevaTasa(e.target.value)
                    setErrorTasa('')
                  }}
                  className={`form-input ${errorTasa ? 'error' : ''}`}
                />
                <span className="currency-suffix">Bs</span>
              </div>
              {errorTasa && <span className="error-message">{errorTasa}</span>}
              <button type="submit" className="btn-primary" disabled={submittingTasa}>
                {submittingTasa ? 'Actualizando...' : 'Actualizar tasa'}
              </button>
            </form>
          </div>

          {/* Dashboard de Totales */}
          {loading ? (
            <div className="loading-message">Cargando datos financieros...</div>
          ) : (
            <>
              {/* Tarjetas de Totales */}
              <div className="totales-grid">
                <div className="totales-card ticket-card">
                  <h3 className="card-title">Tickets (sin IVA)</h3>
                  <div className="card-amounts">
                    <div className="amount-row">
                      <span>Semana</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.ticket.semanal_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.ticket.semanal_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Mes</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.ticket.mensual_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.ticket.mensual_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Año</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.ticket.anual_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.ticket.anual_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Hoy</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.ticket.diario_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.ticket.diario_usd)}</span>
                    </div>
                  </div>
                </div>

                <div className="totales-card factura-card">
                  <h3 className="card-title">Facturas (con IVA)</h3>
                  <div className="card-amounts">
                    <div className="amount-row">
                      <span>Hoy</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.factura.diario_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.factura.diario_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Semana</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.factura.semanal_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.factura.semanal_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Mes</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.factura.mensual_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.factura.mensual_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Año</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.factura.anual_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.factura.anual_usd)}</span>
                    </div>
                  </div>
                </div>

                <div className="totales-card total-card">
                  <h3 className="card-title">Totales combinados</h3>
                  <div className="card-amounts">
                    <div className="amount-row">
                      <span>Semana</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.combinado.semanal_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.combinado.semanal_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Mes</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.combinado.mensual_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.combinado.mensual_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Año</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.combinado.anual_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.combinado.anual_usd)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Hoy</span>
                      <span className="amount-text">Bs {formatearMoneda(totalesPorTipoPeriodo.combinado.diario_bs)} / ${formatearMoneda(totalesPorTipoPeriodo.combinado.diario_usd)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Movimientos */}
              <div className="movimientos-section">
                <div className="section-header">
                  <h2 className="section-title">Movimientos Financieros</h2>
                </div>

                {/* Filtros */}
                <div className="filtros-container">
                  <div className="filtros-tipo">
                    <button
                      className={`filtro-btn ${filtroTipo === '' ? 'active' : ''}`}
                      onClick={() => handleFiltroTipo('')}
                    >
                      Todos
                    </button>
                    <button
                      className={`filtro-btn ${filtroTipo === 'ticket' ? 'active' : ''}`}
                      onClick={() => handleFiltroTipo('ticket')}
                    >
                      Tickets
                    </button>
                    <button
                      className={`filtro-btn ${filtroTipo === 'factura' ? 'active' : ''}`}
                      onClick={() => handleFiltroTipo('factura')}
                    >
                      Facturas
                    </button>
                  </div>
                  <div className="filtros-fecha">
                    <label className="filtro-label">Desde:</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => handleFiltroFecha(e.target.value, fechaFin)}
                      className="filtro-date-input"
                    />
                    <label className="filtro-label">Hasta:</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => handleFiltroFecha(fechaInicio, e.target.value)}
                      className="filtro-date-input"
                    />
                    {(fechaInicio || fechaFin) && (
                      <button
                        className="filtro-clear-btn"
                        onClick={() => handleFiltroFecha('', '')}
                      >
                        Limpiar fechas
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabla de Movimientos */}
                <div className="movimientos-table-container">
                  {displayedMovimientos.length > 0 ? (
                    <table className="movimientos-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Monto (Bs)</th>
                          <th>Monto (USD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedMovimientos.map((mov) => (
                          <tr key={mov.id} className={`row-${mov.tipo}`}>
                            <td>{formatearFecha(mov.fecha)}</td>
                            <td>
                              <span className={`tipo-badge tipo-${mov.tipo}`}>
                                {mov.tipo.toUpperCase()}
                              </span>
                            </td>
                            <td className="monto-bs">Bs {formatearMoneda(mov.monto_bs)}</td>
                            <td className="monto-usd">${formatearMoneda(mov.monto_usd)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="empty-message">
                      {filtroTipo ? 'No hay movimientos de este tipo' : 'No hay movimientos financieros registrados'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

    </div>
  )
}

export default RegistroFinanciero
