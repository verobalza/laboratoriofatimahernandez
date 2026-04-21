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
      const [tasaCambio, setTasaCambio] = useState(37) // Default mientras carga

    // Estados para calendario y exámenes del día
    const today = new Date().toISOString().split('T')[0]
    const [selectedDate, setSelectedDate] = useState(today)
    const [examenesDelDia, setExamenesDelDia] = useState([])
    const [loadingExamenes, setLoadingExamenes] = useState(false)

    const obtenerTasaActual = async () => {
      try {
        const respuesta = await api.obtenerTasaCambio()
        if (respuesta && respuesta.tasa) {
          setTasaCambio(respuesta.tasa)
        }
      } catch (error) {
        console.warn('Error obteniendo tasa de cambio, usando valor actual:', error)
      }
    }

    // Obtener tasa de cambio al montar el componente
    useEffect(() => {
      obtenerTasaActual()
    }, [])

    // Refrescar tasa cuando la ventana vuelve al foco (cambios desde Registro Financiero)
    useEffect(() => {
      const handleFocus = () => {
        obtenerTasaActual()
      }
      window.addEventListener('focus', handleFocus)
      return () => window.removeEventListener('focus', handleFocus)
    }, [])

    // Escuchar cambios en localStorage para refrescar lista cuando se agregan exámenes
    useEffect(() => {
      const handleStorageChange = (e) => {
        if (e.key === 'examenes_updated') {
          loadExamenesDelDia()
        }
      }

      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    // Cargar exámenes del día cuando cambia la fecha
    useEffect(() => {
      loadExamenesDelDia()
    }, [selectedDate])

    // Función para cargar exámenes del día
    const loadExamenesDelDia = async () => {
      setLoadingExamenes(true)
      try {
        const examenes = await api.getExamenesPDF(selectedDate)
        // Dedupe por paciente+fecha+url para evitar duplicados históricos
        const uniqueExamenes = examenes ? examenes.filter((examen, index, self) =>
          index === self.findIndex(
            (e) => `${e.paciente_id || ''}|${e.fecha || ''}|${e.url_pdf || ''}` === `${examen.paciente_id || ''}|${examen.fecha || ''}|${examen.url_pdf || ''}`
          )
        ) : []
        setExamenesDelDia(uniqueExamenes)
      } catch (error) {
        console.error('Error cargando exámenes del día:', error)
        setExamenesDelDia([])
      } finally {
        setLoadingExamenes(false)
      }
    }

      // Manejar cambio de fecha
      const handleDateChange = (e) => {
        setSelectedDate(e.target.value)
      }

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
          const visitasUnicasOrdenadas = (visitasData || [])
            .filter((v, idx, arr) => idx === arr.findIndex((x) => x.fecha === v.fecha))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

          setVisitas(visitasUnicasOrdenadas)
          if (visitasUnicasOrdenadas.length === 0) {
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

    const seleccionarExamenDelDia = async (examen) => {
      if (!examen?.paciente_id || !examen?.fecha) return

      setLoading(true)
      try {
        const paciente = await api.getPaciente(examen.paciente_id)
        setPacienteSeleccionado(paciente)
        setSearchTerm(`${paciente?.nombre || ''} ${paciente?.apellido || ''}`.trim())
        setPacientes([])
        setFacturaGenerada(null)

        const visitasData = await api.obtenerVisitas(examen.paciente_id)
        const visitasUnicasOrdenadas = (visitasData || [])
          .filter((v, idx, arr) => idx === arr.findIndex((x) => x.fecha === v.fecha))
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

        setVisitas(visitasUnicasOrdenadas)

        const visitaObjetivo = visitasUnicasOrdenadas.find((v) => v.fecha === examen.fecha) || {
          fecha: examen.fecha,
          cantidad_pruebas: Array.isArray(examen.pruebas) ? examen.pruebas.length : 0
        }

        setVisitaSeleccionada(visitaObjetivo)

        const detalle = await api.obtenerDetalleVisita(examen.paciente_id, examen.fecha)
        setDetalleVisita(detalle)
        setMensaje({ type: '', text: '' })
      } catch (error) {
        console.error('Error seleccionando examen del día:', error)
        setMensaje({ type: 'error', text: 'No se pudieron cargar los datos de facturación del examen' })
      } finally {
        setLoading(false)
      }
    }

      // Generar ticket (sin IVA)
      const generarTicket = async () => {
        if (!detalleVisita) return

        setGenerando(true)
        try {
          const totalSinIva = detalleVisita.pruebas.reduce((sum, p) => sum + (p.precio_bs || 0), 0)

          const ticketData = {
            paciente_id: pacienteSeleccionado.id,
            fecha_examen: visitaSeleccionada.fecha,
          detalles: detalleVisita.pruebas.map((p) => ({
            prueba_id: p.prueba_id ?? null,
            nombre_prueba: p.nombre_prueba,
            precio: Number(p.precio_bs) || 0,
            cantidad: 1
          })),
          base_imponible: totalSinIva,
          total: totalSinIva
        }

        const ticket = await api.generarTicket(ticketData)
        setFacturaGenerada({
          ...ticket,
          tipo: 'ticket',
          detalles_pruebas: detalleVisita.pruebas
        })
        
        // Registrar movimiento financiero
        try {
          await api.registrarMovimientoFinanciero({
            paciente_id: pacienteSeleccionado.id,
            fecha: visitaSeleccionada.fecha,
            monto_bs: totalSinIva,
            monto_usd: totalSinIva / tasaCambio,
            tipo: 'ticket'
          })
        } catch (errorFinanciero) {
          console.warn('Error registrando movimiento financiero:', errorFinanciero)
        }
        
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
        const totalSinIva = detalleVisita.pruebas.reduce((sum, p) => sum + (p.precio_bs || 0), 0)
        const ivaCalculado = Math.round(totalSinIva * 0.21 * 100) / 100
        const totalConIva = Math.round((totalSinIva + ivaCalculado) * 100) / 100

        // Generar número de factura (FAC-0001, FAC-0002, etc.)
        const numeroFactura = `FAC-${String(Math.floor(Math.random() * 99999) + 1).padStart(4, '0')}`

        const facturaData = {
          numero_factura: numeroFactura,
          paciente_id: pacienteSeleccionado.id,
          fecha_examen: visitaSeleccionada.fecha,
          detalles: detalleVisita.pruebas.map((p) => ({
            prueba_id: p.prueba_id ?? null,
            nombre_prueba: p.nombre_prueba,
            precio: Number(p.precio_bs) || 0,
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
        
        // Registrar movimiento financiero
        try {
          await api.registrarMovimientoFinanciero({
            paciente_id: pacienteSeleccionado.id,
            fecha: visitaSeleccionada.fecha,
            monto_bs: totalConIva,
            monto_usd: totalConIva / tasaCambio,
            tipo: 'factura'
          })
        } catch (errorFinanciero) {
          console.warn('Error registrando movimiento financiero:', errorFinanciero)
        }
        
        setMensaje({ type: 'success', text: `Factura ${numeroFactura} generada correctamente` })
      } catch (error) {
        console.error('Error generando factura:', error)
        setMensaje({ type: 'error', text: 'Error al generar factura' })
      } finally {
        setGenerando(false)
      }
    }

    // Generar PDF
    const generarPDF = async () => {
      if (!facturaGenerada) {
        setMensaje({ type: 'error', text: 'No hay documento válido para generar PDF' })
        return
      }

      setGenerando(true)
      try {
        let pdf
        if (facturaGenerada.tipo === 'ticket') {
          // Para tickets, enviar los datos directamente
          const ticketData = {
            paciente_id: pacienteSeleccionado.id,
            numero_ticket: facturaGenerada.numero_ticket,
            fecha: facturaGenerada.fecha,
            detalles: facturaGenerada.detalles_pruebas.map(p => ({
              nombre: p.nombre_prueba,
              precio: p.precio_bs
            })),
            base_imponible: facturaGenerada.base_imponible,
            total: facturaGenerada.total
          }
          pdf = await api.generarPDFTicket(ticketData)
        } else {
          // Para facturas, usar el ID
          pdf = await api.generarPDF(facturaGenerada.id)
        }
        window.open(pdf.url, '_blank')
      } catch (error) {
        console.error('Error generando PDF:', error)
        setMensaje({ type: 'error', text: 'Error al generar PDF' })
      } finally {
        setGenerando(false)
      }
    }

    // Enviar por WhatsApp
    const enviarWhatsApp = () => {
      if (!detalleVisita || !pacienteSeleccionado || !facturaGenerada) return

      const telefono = pacienteSeleccionado.telefono?.replace(/[^\d]/g, '') || ''
      if (!telefono) {
        setMensaje({ type: 'error', text: 'El paciente no tiene teléfono registrado' })
        return
      }

      const totalSinIva = detalleVisita.pruebas.reduce((sum, p) => sum + (p.precio_bs || 0), 0)
      const ivaCalculado = Math.round(totalSinIva * 0.21 * 100) / 100
      const totalConIva = Math.round((totalSinIva + ivaCalculado) * 100) / 100

      const detallesPruebas = detalleVisita.pruebas
        .map(p => `• ${p.nombre_prueba}: Bs ${(p.precio_bs || 0).toFixed(2)}`)
        .join('\n')

      const tipoDocumento = facturaGenerada.tipo === 'factura' ? 'FACTURA' : 'TICKET'
      const fechaFormato = new Date(visitaSeleccionada.fecha).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })

      const mensaje = `
*Laboratorio Bioclínico*
Lc. Fátima Hernández

Hola ${pacienteSeleccionado.nombre},

Aquí tienes tu ${tipoDocumento} correspondiente a tu visita del ${fechaFormato}.

*Pruebas realizadas:*
${detallesPruebas}

*Base imponible:* Bs ${totalSinIva.toFixed(2)}
${facturaGenerada.tipo === 'factura' ? `*IVA (21%):* Bs ${ivaCalculado.toFixed(2)}\n` : ''}*Total:* Bs ${facturaGenerada.tipo === 'factura' ? totalConIva.toFixed(2) : totalSinIva.toFixed(2)}

Gracias por confiar en nosotros.
      `.trim()

      const urlWhatsApp = `https://wa.me/57${telefono}?text=${encodeURIComponent(mensaje)}`
      window.open(urlWhatsApp, '_blank')
    }

    return (
      <div className="facturacion-container">
        <MenuHamburguesa />

        {/* Branding */}
        <div className="branding">
          <h2>Laboratorio</h2>
          <p>Bioclínico</p>
        </div>

        {/* Contenido principal */}
        <div className="facturacion-content">
          <div className="page-header">
            <h1>Facturación</h1>
            <p>Genera tickets y facturas de servicios médicos</p>
          </div>

          {/* Calendario y exámenes del día */}
          <div className="facturacion-controls">
            <div className="date-selector">
              <label htmlFor="fecha-facturacion">Fecha de facturación:</label>
              <input
                id="fecha-facturacion"
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="date-input"
              />
            </div>
          </div>

          {/* Lista de exámenes del día */}
          <div className="examenes-dia-section">
            <h3>📋 Exámenes del día ({new Date(selectedDate).toLocaleDateString('es-ES')})</h3>
            {loadingExamenes ? (
              <p className="loading-text">Cargando exámenes...</p>
            ) : examenesDelDia.length > 0 ? (
              <div className="examenes-dia-list">
                {examenesDelDia.map((examen) => (
                  <div
                    key={examen.id || `${examen.paciente_id}-${examen.fecha}-${examen.url_pdf || 'sin-url'}`}
                    className="examen-dia-item"
                    onClick={() => seleccionarExamenDelDia(examen)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        seleccionarExamenDelDia(examen)
                      }
                    }}
                  >
                    <div className="examen-info">
                      <p className="examen-paciente">
                        <strong>{examen.paciente_nombre || 'Paciente'}</strong>
                      </p>
                      <p className="examen-detalles">
                        {examen.pruebas?.join(', ') || 'Sin pruebas especificadas'}
                      </p>
                      <p className="examen-fecha">
                        {new Date(examen.fecha).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-examenes">No hay exámenes registrados para esta fecha</p>
            )}
          </div>

          {/* Mensaje de estado */}
          {mensaje.text && (
            <div className={`message-box message-${mensaje.type}`}>
              {mensaje.text}
            </div>
          )}

          <div className="facturacion-layout">
            {/* Columna izquierda: Búsqueda y visitas */}
            <div className="facturacion-sidebar">
              {/* Búsqueda */}
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
                        <p className="paciente-edad">{p.edad} años</p>
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
                      <span className="visita-arrow">→</span>
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
                      <h2>Laboratorio Bioclínico</h2>
                      <p>Lc. Fátima Hernández</p>
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
                        <span className="dato-valor">{pacienteSeleccionado.edad} años</span>
                      </div>
                      <div className="dato-row">
                        <span className="dato-label">Teléfono:</span>
                        <span className="dato-valor">{pacienteSeleccionado.telefono}</span>
                      </div>
                      <div className="dato-row">
                        <span className="dato-label">Dirección:</span>
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
                      {detalleVisita.pruebas.map((prueba, idx) => {
                        const precioBs = prueba.precio_bs || 0
                        const precioUsd = ((prueba.precio_usd || 0) > 0 ? prueba.precio_usd : precioBs / tasaCambio).toFixed(2)
                        return (
                          <div key={idx} className="tabla-row">
                            <div className="col-nombre">{prueba.nombre_prueba}</div>
                            <div className="col-unidad">{prueba.unidad_medida}</div>
                            <div className="col-precio">
                              <div className="precio-bs">Bs {precioBs.toFixed(2)}</div>
                              <div className="precio-usd">US$ {precioUsd}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="factura-totales">
                    {(() => {
                      const totalSinIva = detalleVisita.pruebas.reduce((sum, p) => sum + (p.precio_bs || 0), 0)
                      const ivaCalculado = Math.round(totalSinIva * 0.21 * 100) / 100
                      const totalConIva = Math.round((totalSinIva + ivaCalculado) * 100) / 100
                      const isMostrarIva = facturaGenerada?.tipo === 'factura'
                      const totalMostrar = isMostrarIva ? totalConIva : totalSinIva

                      return (
                        <>
                          <div className="total-row base">
                            <span>Base Imponible:</span>
                            <div className="total-valores">
                              <span>Bs {totalSinIva.toFixed(2)}</span>
                              <span className="valor-usd">US$ {(totalSinIva / tasaCambio).toFixed(2)}</span>
                            </div>
                          </div>
                          {isMostrarIva && (
                            <div className="total-row iva">
                              <span>IVA (21%):</span>
                              <div className="total-valores">
                                <span>Bs {ivaCalculado.toFixed(2)}</span>
                                <span className="valor-usd">US$ {(ivaCalculado / tasaCambio).toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                          <div className="total-row total">
                            <span>Total:</span>
                            <div className="total-valores">
                              <span>Bs {totalMostrar.toFixed(2)}</span>
                              <span className="valor-usd">US$ {(totalMostrar / tasaCambio).toFixed(2)}</span>
                            </div>
                          </div>
                          {facturaGenerada && (
                            <div className="total-row generada">
                              <span>{facturaGenerada.tipo === 'factura' ? `Factura: ${facturaGenerada.numero_factura}` : `Ticket: ${facturaGenerada.numero_ticket || facturaGenerada.id}`}</span>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  {/* Botones de acción */}
                  <div className="factura-acciones">
                    <div className="acciones-generacion">
                      <button
                        className="btn btn-ticket"
                        onClick={generarTicket}
                        disabled={generando}
                      >
                        {generando ? 'Generando...' : '🧾 Ticket de Caja'}
                      </button>
                      <button
                        className="btn btn-factura"
                        onClick={generarFactura}
                        disabled={generando}
                      >
                        {generando ? 'Generando...' : '📄 Factura'}
                      </button>
                    </div>
                    {facturaGenerada && (
                      <div className="acciones-compartir">
                        <button
                          className="btn btn-pdf"
                          onClick={generarPDF}
                          disabled={generando}
                        >
                          {generando ? 'Generando...' : '📋 PDF'}
                        </button>
                        <button
                          className="btn btn-whatsapp"
                          onClick={enviarWhatsApp}
                          disabled={generando}
                        >
                          📱 WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
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