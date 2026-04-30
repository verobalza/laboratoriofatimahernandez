import React, { useState, useEffect } from 'react'
import MenuHamburguesa from '../components/MenuHamburguesa'
import api from '../services/api'
import './Facturacion.css'

export default function Facturacion() {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState('')
  const [pacientes, setPacientes] = useState([])
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null)
  const [visitas, setVisitas] = useState([])
  const [visitaSeleccionada, setVisitaSeleccionada] = useState(null)
  const [detalleVisita, setDetalleVisita] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState({ type: '', text: '' })
  const [generando, setGenerando] = useState(false)
  const [facturaGenerada, setFacturaGenerada] = useState(null)

  // Buscar pacientes
  const buscarPacientes = async (valor) => {
    setSearchTerm(valor)
    if (!valor || valor.length < 2) {
      setPacientes([])
      setPacienteSeleccionado(null)
      setVisitas([])
      setVisitaSeleccionada(null)
      setDetalleVisita(null)
      return
    }

    setLoading(true)
    try {
      const datos = await api.buscarPacientesFact(valor)
      setPacientes(datos || [])
      setMensaje({ type: '', text: '' })
    } catch (error) {
      console.error('Error buscando pacientes:', error)
      setMensaje({ type: 'error', text: 'Error al buscar pacientes' })
      setPacientes([])
    } finally {
      setLoading(false)
    }
  }

  // Seleccionar paciente
  const seleccionarPaciente = async (paciente) => {
    setPacienteSeleccionado(paciente)
    setSearchTerm(`${paciente.nombre} ${paciente.apellido}`)
    setPacientes([])
    setVisitaSeleccionada(null)
    setDetalleVisita(null)
    setFacturaGenerada(null)

    // Cargar visitas
    setLoading(true)
    try {
      const visitasData = await api.obtenerVisitas(paciente.id)
      setVisitas(visitasData || [])
      if (!visitasData || visitasData.length === 0) {
        setMensaje({ type: 'warning', text: 'Este paciente no tiene visitas registradas' })
      }
    } catch (error) {
      console.error('Error cargando visitas:', error)
      setMensaje({ type: 'error', text: 'Error al cargar visitas' })
      setVisitas([])
    } finally {
      setLoading(false)
    }
  }

  // Seleccionar visita y cargar detalle
  const seleccionarVisita = async (visita) => {
    setVisitaSeleccionada(visita)
    setFacturaGenerada(null)
    setLoading(true)

    try {
      const detalle = await api.obtenerDetalleVisita(pacienteSeleccionado.id, visita.fecha)
      setDetalleVisita(detalle)
      setMensaje({ type: '', text: '' })
    } catch (error) {
      console.error('Error cargando detalle:', error)
      setMensaje({ type: 'error', text: 'Error al cargar detalle de visita' })
    } finally {
      setLoading(false)
    }
  }

  // Generar ticket (sin IVA)
  const generarTicket = async () => {
    if (!detalleVisita) return

    setGenerando(true)
    try {
      const totalSinIva = detalleVisita.pruebas.reduce((sum, p) => sum + p.precio, 0)

      const ticketData = {
        paciente_id: pacienteSeleccionado.id,
        fecha_examen: visitaSeleccionada.fecha,
        detalles: detalleVisita.pruebas.map(p => ({
          prueba_id: p.prueba_id,
          nombre_prueba: p.nombre_prueba,
          precio: p.precio,
          cantidad: 1
        })),
        base_imponible: totalSinIva,
        total: totalSinIva
      }

      const ticket = await api.generarTicket(ticketData)
      setFacturaGenerada(ticket)
      setMensaje({ type: 'success', text: 'Ticket generado correctamente' })
    } catch (error) {
      console.error('Error generando ticket:', error)
      setMensaje({ type: 'error', text: 'Error al generar ticket' })
    } finally {
      setGenerando(false)
    }
  }

  // Generar factura (con IVA)
  const generarFactura = async () => {
    if (!detalleVisita) return

    setGenerando(true)
    try {
      const totalSinIva = detalleVisita.pruebas.reduce((sum, p) => sum + p.precio, 0)
      const ivaCalculado = Math.round(totalSinIva * 0.19 * 100) / 100
      const totalConIva = Math.round((totalSinIva + ivaCalculado) * 100) / 100

      // Generar n├║mero de factura (FAC-0001, FAC-0002, etc.)
      const numeroFactura = `FAC-${String(Math.floor(Math.random() * 99999) + 1).padStart(4, '0')}`

      const facturaData = {
        numero_factura: numeroFactura,
        paciente_id: pacienteSeleccionado.id,
        fecha_examen: visitaSeleccionada.fecha,
        detalles: detalleVisita.pruebas.map(p => ({
          prueba_id: p.prueba_id,
          nombre_prueba: p.nombre_prueba,
          precio: p.precio,
          cantidad: 1
        })),
        base_imponible: totalSinIva,
        iva: ivaCalculado,
        total: totalConIva
      }

      const factura = await api.generarFactura(facturaData)
      setFacturaGenerada({
        ...factura,
        tipo: 'factura',
        detalles_pruebas: detalleVisita.pruebas
      })
      setMensaje({ type: 'success', text: `Factura ${numeroFactura} generada correctamente` })
    } catch (error) {
      console.error('Error generando factura:', error)
      setMensaje({ type: 'error', text: 'Error al generar factura' })
    } finally {
      setGenerando(false)
    }
  }

  // Enviar por WhatsApp
  const enviarWhatsApp = () => {
    if (!detalleVisita || !pacienteSeleccionado) return

    const telefono = pacienteSeleccionado.telefono?.replace(/[^\d]/g, '') || ''
    if (!telefono) {
      setMensaje({ type: 'error', text: 'El paciente no tiene tel├®fono registrado' })
      return
    }

    const totalSinIva = detalleVisita.pruebas.reduce((sum, p) => sum + p.precio, 0)
    const ivaCalculado = Math.round(totalSinIva * 0.19 * 100) / 100
    const totalConIva = Math.round((totalSinIva + ivaCalculado) * 100) / 100

    const detallesPruebas = detalleVisita.pruebas
      .map(p => `ÔÇó ${p.nombre_prueba}: $${p.precio.toFixed(2)}`)
      .join('\n')

    const mensaje = `
*Laboratorio Biocl├¡nico*
Lc. F├ítima Hern├índez

Hola ${pacienteSeleccionado.nombre},

Te compartimos tu factura:

*Paciente:* ${pacienteSeleccionado.nombre} ${pacienteSeleccionado.apellido}
*Edad:* ${pacienteSeleccionado.edad} a├▒os
*Tel├®fono:* ${pacienteSeleccionado.telefono}
*Fecha de examen:* ${visitaSeleccionada.fecha}

*Pruebas realizadas:*
${detallesPruebas}

*Base imponible:* $${totalSinIva.toFixed(2)}
*IVA (19%):* $${ivaCalculado.toFixed(2)}
*Total:* $${totalConIva.toFixed(2)}

Gracias por confiar en nosotros.
    `.trim()

    const urlWhatsApp = `https://wa.me/58${telefono}?text=${encodeURIComponent(mensaje)}`
    window.open(urlWhatsApp, '_blank')
  }

  return (
    <div className="facturacion-container">
      <MenuHamburguesa />

      {/* Branding */}
      <div className="branding">
        <h2>Laboratorio</h2>
        <p>Biocl├¡nico</p>
      </div>

      {/* Contenido principal */}
      <div className="facturacion-content">
        <div className="page-header">
          <h1>Facturaci├│n</h1>
          <p>Genera tickets y facturas de servicios m├®dicos</p>
        </div>

        {/* Mensaje de estado */}
        {mensaje.text && (
          <div className={`message-box message-${mensaje.type}`}>
            {mensaje.text}
          </div>
        )}

        <div className="facturacion-layout">
          {/* Columna izquierda: B├║squeda y visitas */}
          <div className="facturacion-sidebar">
            {/* B├║squeda */}
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar paciente por nombre..."
                value={searchTerm}
                onChange={(e) => buscarPacientes(e.target.value)}
                className="search-input-large"
              />
              {loading && <p className="loading-text">Buscando...</p>}
            </div>

            {/* Lista de pacientes encontrados */}
            {pacientes.length > 0 && (
              <div className="pacientes-list">
                <h3>Pacientes encontrados</h3>
                {pacientes.map(p => (
                  <div
                    key={p.id}
                    className={`paciente-item ${pacienteSeleccionado?.id === p.id ? 'active' : ''}`}
                    onClick={() => seleccionarPaciente(p)}
                  >
                    <div className="paciente-info">
                      <p className="paciente-nombre">{p.nombre} {p.apellido}</p>
                      <p className="paciente-edad">{p.edad} a├▒os</p>
                    </div>
                    <p className="paciente-telefono">{p.telefono}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Visitas del paciente */}
            {pacienteSeleccionado && visitas.length > 0 && (
              <div className="visitas-list">
                <h3>Visitas registradas</h3>
                {visitas.map(visita => (
                  <div
                    key={visita.fecha}
                    className={`visita-item ${visitaSeleccionada?.fecha === visita.fecha ? 'active' : ''}`}
                    onClick={() => seleccionarVisita(visita)}
                  >
                    <div className="visita-info">
                      <p className="visita-fecha">{new Date(visita.fecha).toLocaleDateString('es-ES')}</p>
                      <p className="visita-pruebas">{visita.cantidad_pruebas} prueba(s)</p>
                    </div>
                    <span className="visita-arrow">ÔåÆ</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna derecha: Detalle de visita y factura */}
          <div className="facturacion-main">
            {detalleVisita && visitaSeleccionada ? (
              <div className="factura-panel">
                {/* Encabezado de factura */}
                <div className="factura-header">
                  <div className="factura-branding">
                    <h2>Laboratorio Biocl├¡nico</h2>
                    <p>Lc. F├ítima Hern├índez</p>
                  </div>
                  <div className="factura-numero">
                    {facturaGenerada?.numero_factura && (
                      <p className="numero-factura">{facturaGenerada.numero_factura}</p>
                    )}
                    {facturaGenerada?.numero_ticket && (
                      <p className="numero-ticket">{facturaGenerada.numero_ticket}</p>
                    )}
                  </div>
                </div>

                {/* Datos del paciente */}
                <div className="factura-paciente">
                  <h3>Datos del Paciente</h3>
                  <div className="paciente-datos">
                    <div className="dato-row">
                      <span className="dato-label">Nombre:</span>
                      <span className="dato-valor">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</span>
                    </div>
                    <div className="dato-row">
                      <span className="dato-label">Edad:</span>
                      <span className="dato-valor">{pacienteSeleccionado.edad} a├▒os</span>
                    </div>
                    <div className="dato-row">
                      <span className="dato-label">Tel├®fono:</span>
                      <span className="dato-valor">{pacienteSeleccionado.telefono}</span>
                    </div>
                    <div className="dato-row">
                      <span className="dato-label">Direcci├│n:</span>
                      <span className="dato-valor">{pacienteSeleccionado.direccion || 'No registrada'}</span>
                    </div>
                    <div className="dato-row">
                      <span className="dato-label">Fecha examen:</span>
                      <span className="dato-valor">{new Date(visitaSeleccionada.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Pruebas realizadas */}
                <div className="factura-pruebas">
                  <h3>Pruebas Realizadas</h3>
                  <div className="tabla-pruebas">
                    <div className="tabla-header">
                      <div className="col-nombre">Prueba</div>
                      <div className="col-unidad">Unidad</div>
                      <div className="col-precio">Precio</div>
                    </div>
                    {detalleVisita.pruebas.map((prueba, idx) => (
                      <div key={idx} className="tabla-row">
                        <div className="col-nombre">{prueba.nombre_prueba}</div>
                        <div className="col-unidad">{prueba.unidad_medida}</div>
                        <div className="col-precio">${prueba.precio.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totales */}
                <div className="factura-totales">
                  <div className="total-row base">
                    <span>Base Imponible:</span>
                    <span>${(detalleVisita.pruebas.reduce((sum, p) => sum + p.precio, 0)).toFixed(2)}</span>
                  </div>
                  <div className="total-row iva">
                    <span>IVA (19%):</span>
                    <span>${(detalleVisita.pruebas.reduce((sum, p) => sum + p.precio, 0) * 0.19).toFixed(2)}</span>
                  </div>
                  <div className="total-row total">
                    <span>Total:</span>
                    <span>${(detalleVisita.pruebas.reduce((sum, p) => sum + p.precio, 0) * 1.19).toFixed(2)}</span>
                  </div>
                  {facturaGenerada?.iva && (
                    <div className="total-row generada">
                      <span>Factura generada: {facturaGenerada.numero_factura}</span>
                    </div>
                  )}
                </div>

                {/* Botones de acci├│n */}
                <div className="factura-acciones">
                  <button
                    className="btn btn-ticket"
                    onClick={generarTicket}
                    disabled={generando}
                  >
                    {generando ? 'Generando...' : '­ƒº¥ Ticket de Caja'}
                  </button>
                  <button
                    className="btn btn-factura"
                    onClick={generarFactura}
                    disabled={generando}
                  >
                    {generando ? 'Generando...' : '­ƒôä Factura'}
                  </button>
                  <button
                    className="btn btn-whatsapp"
                    onClick={enviarWhatsApp}
                    disabled={generando}
                  >
                    ­ƒô▒ WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">­ƒôï</div>
                <h3>Selecciona una visita</h3>
                <p>
                  {!pacienteSeleccionado ? (
                    'Busca un paciente y selecciona una de sus visitas para ver el detalle'
                  ) : visitas.length === 0 ? (
                    'Este paciente no tiene visitas registradas'
                  ) : (
                    'Haz clic en una visita para ver el detalle'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
