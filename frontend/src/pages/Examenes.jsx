/**
 * Examenes.jsx
 *
 * Página de registro de exámenes de laboratorio.
 * Flujo completo: seleccionar paciente → seleccionar pruebas → ingresar resultados → guardar → generar PDF
 *
 * Diseño coherente con Dashboard: fondo azul suave, cards, animaciones.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import api from '../services/api'
import './Examenes.css'

function Examenes() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  // ============ ESTADO GENERAL ============
  const [selectedDate, setSelectedDate] = useState(today)
  const [examenCount, setExamenCount] = useState(0)
  const [mensaje, setMensaje] = useState({ type: '', text: '' })

  // ============ BÚSQUEDA DE PACIENTE ============
  const [searchPaciente, setSearchPaciente] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedPaciente, setSelectedPaciente] = useState(null)

  // ============ GESTIÓN DE PRUEBAS ============
  const [allPruebas, setAllPruebas] = useState([])
  const [selectedPruebas, setSelectedPruebas] = useState([])
  const [showPruebasSelection, setShowPruebasSelection] = useState(false)
  const [pruebasLoading, setpruebasLoading] = useState(false)

  // ============ FORMULARIO DE RESULTADOS ============
  const [resultados, setResultados] = useState({})
  const [observaciones, setObservaciones] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Facturación', icon: '💳', onClick: () => console.log('Facturación') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Registro financiero', icon: '💰', onClick: () => console.log('Registro financiero') }
  ]

  // Cargar todas las pruebas al montar
  useEffect(() => {
    loadAllPruebas()
    loadExamenCount()
  }, [selectedDate])

  const loadAllPruebas = async () => {
    setpruebasLoading(true)
    try {
      const data = await api.getAllPruebas()
      setAllPruebas(data || [])
    } catch (error) {
      console.error('Error cargando pruebas:', error)
      setMensaje({ type: 'error', text: 'Error al cargar pruebas' })
    } finally {
      setpruebasLoading(false)
    }
  }

  const loadExamenCount = async () => {
    try {
      const data = await api.countExamenesByDate(selectedDate)
      setExamenCount(data.count || 0)
    } catch (error) {
      console.error('Error contando exámenes:', error)
    }
  }

  // ============ BÚSQUEDA DE PACIENTE ============
  const handleSearchPaciente = async (value) => {
    setSearchPaciente(value)
    if (!value.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    try {
      const results = await api.searchPacientes(value)
      setSearchResults(results || [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Error:', error)
      setMensaje({ type: 'error', text: 'Error al buscar paciente' })
    }
  }

  const selectPaciente = (paciente) => {
    setSelectedPaciente(paciente)
    setSearchPaciente(`${paciente.nombre} ${paciente.apellido}`)
    setShowSearchResults(false)
  }

  // ============ GESTIÓN DE SELECCIÓN DE PRUEBAS ============
  const togglePrueba = (pruebaId) => {
    setSelectedPruebas((prev) => {
      if (prev.includes(pruebaId)) {
        return prev.filter((id) => id !== pruebaId)
      } else {
        return [...prev, pruebaId]
      }
    })
  }

  const handleAcceptPruebas = () => {
    if (selectedPruebas.length === 0) {
      setMensaje({ type: 'warning', text: 'Selecciona al menos una prueba' })
      return
    }
    setShowPruebasSelection(false)
    // Inicializar campos de resultado
    const newResultados = {}
    const newObservaciones = {}
    selectedPruebas.forEach((pruebaId) => {
      newResultados[pruebaId] = ''
      newObservaciones[pruebaId] = ''
    })
    setResultados(newResultados)
    setObservaciones(newObservaciones)
  }

  // ============ MANEJO DE RESULTADOS ============
  const handleResultadoChange = (pruebaId, value) => {
    setResultados((prev) => ({ ...prev, [pruebaId]: value }))
  }

  const handleObservacionesChange = (pruebaId, value) => {
    setObservaciones((prev) => ({ ...prev, [pruebaId]: value }))
  }

  // ============ GUARDAR EXÁMENES ============
  const handleGuardarExamenes = async () => {
    if (!selectedPaciente) {
      setMensaje({ type: 'error', text: 'Selecciona un paciente' })
      return
    }

    if (selectedPruebas.length === 0) {
      setMensaje({ type: 'error', text: 'Selecciona al menos una prueba' })
      return
    }

    setSubmitting(true)
    try {
      const examenesData = selectedPruebas.map((pruebaId) => ({
        paciente_id: selectedPaciente.id,
        prueba_id: pruebaId,
        fecha: selectedDate,
        resultado: resultados[pruebaId] || '',
        observaciones: observaciones[pruebaId] || ''
      }))

      await api.createExamenesBatch(examenesData)
      setMensaje({ type: 'success', text: '✅ Exámenes guardados correctamente' })

      // Limpiar forma después de 2 segundos
      setTimeout(() => {
        setSelectedPaciente(null)
        setSearchPaciente('')
        setSelectedPruebas([])
        setResultados({})
        setObservaciones({})
        setMensaje({ type: '', text: '' })
        loadExamenCount()
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje({ type: 'error', text: error.message || 'Error al guardar exámenes' })
    } finally {
      setSubmitting(false)
    }
  }

  // ============ GENERAR PDF (placeholder) ============
  const handleGenerarPDF = () => {
    if (!selectedPaciente || selectedPruebas.length === 0) {
      setMensaje({ type: 'warning', text: 'Completa el formulario antes de generar PDF' })
      return
    }
    setMensaje({ type: 'info', text: 'Generando PDF...' })
    // Implementación futura de jsPDF o similar
  }

  const handleEnviarWhatsApp = () => {
    if (!selectedPaciente || selectedPruebas.length === 0) {
      setMensaje({ type: 'warning', text: 'Completa el formulario antes de enviar por WhatsApp' })
      return
    }
    setMensaje({ type: 'info', text: 'Preparando para enviar por WhatsApp...' })
    // Implementación futura de integración con WhatsApp
  }

  // Filtrar pruebas seleccionadas para mostrar en formulario
  const pruebasSeleccionadas = allPruebas.filter((p) => selectedPruebas.includes(p.id))

  return (
    <div className="examenes-container">
      {/* Menú hamburguesa */}
      <MenuHamburguesa items={menuItems} />

      {/* Branding */}
      <div className="examenes-branding">
        <div className="examenes-branding-text">
          <h3 className="examenes-lab-name">Laboratorio Bioclínico</h3>
          <p className="examenes-lab-subtitle">Lc. Fátima Hernández</p>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="examenes-content">
        <div className="examenes-wrapper">
          {/* Encabezado con fecha y contador */}
          <div className="examenes-header">
            <div>
              <h1>Exámenes</h1>
              <div className="fecha-info">
                <label>Fecha: </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-fecha"
                />
                <span className="examen-count">
                  Exámenes del día: <strong>{examenCount}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje */}
          {mensaje.text && (
            <div className={`mensaje mensaje-${mensaje.type}`}>
              {mensaje.text}
            </div>
          )}

          {/* SECCIÓN 1: Búsqueda de Paciente */}
          <section className="seccion seccion-busqueda">
            <h2>1. Seleccionar Paciente</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Buscar paciente por nombre, apellido o teléfono..."
                value={searchPaciente}
                onChange={(e) => handleSearchPaciente(e.target.value)}
                className="input-busqueda"
                disabled={!!selectedPaciente}
              />
              {showSearchResults && (
                <div className="search-results-dropdown">
                  {searchResults.length > 0 ? (
                    <>
                      {searchResults.map((paciente) => (
                        <div
                          key={paciente.id}
                          className="search-result-item"
                          onClick={() => selectPaciente(paciente)}
                        >
                          <strong>
                            {paciente.nombre} {paciente.apellido}
                          </strong>
                          <span className="result-meta">
                            {paciente.edad} años • {paciente.telefono}
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="no-results">No se encontraron pacientes</div>
                  )}
                </div>
              )}
            </div>

            {/* Ficha del paciente seleccionado */}
            {selectedPaciente && (
              <div className="ficha-paciente-card">
                <div className="ficha-header">
                  <h3>
                    {selectedPaciente.nombre} {selectedPaciente.apellido}
                  </h3>
                  <button
                    className="btn-cambiar"
                    onClick={() => {
                      setSelectedPaciente(null)
                      setSearchPaciente('')
                    }}
                  >
                    Cambiar
                  </button>
                </div>
                <div className="ficha-details">
                  <p>
                    <span className="label">Edad:</span> {selectedPaciente.edad} años
                  </p>
                  <p>
                    <span className="label">Teléfono:</span> {selectedPaciente.telefono}
                  </p>
                  {selectedPaciente.direccion && (
                    <p>
                      <span className="label">Dirección:</span> {selectedPaciente.direccion}
                    </p>
                  )}
                  {selectedPaciente.sexo && (
                    <p>
                      <span className="label">Sexo:</span> {selectedPaciente.sexo}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* SECCIÓN 2: Seleccionar Pruebas */}
          <section className="seccion seccion-pruebas">
            <h2>2. Seleccionar Pruebas</h2>
            {selectedPaciente ? (
              <>
                {!showPruebasSelection && selectedPruebas.length === 0 ? (
                  <button
                    className="btn-primary btn-large"
                    onClick={() => setShowPruebasSelection(true)}
                    disabled={pruebasLoading}
                  >
                    {pruebasLoading ? 'Cargando pruebas...' : 'Seleccionar Pruebas'}
                  </button>
                ) : null}

                {showPruebasSelection && (
                  <div className="pruebas-grid">
                    <div className="pruebas-list">
                      {allPruebas.length > 0 ? (
                        allPruebas.map((prueba) => (
                          <label key={prueba.id} className="prueba-checkbox-item">
                            <input
                              type="checkbox"
                              checked={selectedPruebas.includes(prueba.id)}
                              onChange={() => togglePrueba(prueba.id)}
                            />
                            <div className="prueba-info">
                              <strong>{prueba.nombre_prueba}</strong>
                              <span className="prueba-unidad">
                                {prueba.unidad_medida}
                              </span>
                              {prueba.valor_referencia_min !== null &&
                                prueba.valor_referencia_max !== null && (
                                  <span className="prueba-rango">
                                    Rango: {prueba.valor_referencia_min} -{' '}
                                    {prueba.valor_referencia_max}
                                  </span>
                                )}
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="no-pruebas">No hay pruebas disponibles</div>
                      )}
                    </div>
                    <div className="pruebas-actions">
                      <button
                        className="btn-secondary"
                        onClick={() => setShowPruebasSelection(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn-primary"
                        onClick={handleAcceptPruebas}
                        disabled={selectedPruebas.length === 0}
                      >
                        Aceptar ({selectedPruebas.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* Mostrar pruebas seleccionadas */}
                {selectedPruebas.length > 0 && !showPruebasSelection && (
                  <div className="selected-pruebas-summary">
                    <p>
                      {selectedPruebas.length} prueba{selectedPruebas.length > 1 ? 's' : ''}{' '}
                      seleccionada{selectedPruebas.length > 1 ? 's' : ''}
                    </p>
                    <button
                      className="btn-text"
                      onClick={() => setShowPruebasSelection(true)}
                    >
                      Modificar selección
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted">Selecciona un paciente primero</p>
            )}
          </section>

          {/* SECCIÓN 3: Ingresar Resultados */}
          {selectedPruebas.length > 0 && (
            <section className="seccion seccion-resultados">
              <h2>3. Ingresar Resultados</h2>
              <div className="resultados-form">
                {pruebasSeleccionadas.map((prueba) => (
                  <div key={prueba.id} className="resultado-item">
                    <div className="resultado-header">
                      <h4>{prueba.nombre_prueba}</h4>
                      <span className="unidad">{prueba.unidad_medida}</span>
                    </div>
                    {(prueba.valor_referencia_min !== null ||
                      prueba.valor_referencia_max !== null) && (
                      <div className="rango-referencia">
                        Rango de referencia: {prueba.valor_referencia_min} -{' '}
                        {prueba.valor_referencia_max}
                      </div>
                    )}
                    <div className="resultado-inputs">
                      <input
                        type="text"
                        placeholder="Resultado"
                        value={resultados[prueba.id] || ''}
                        onChange={(e) =>
                          handleResultadoChange(prueba.id, e.target.value)
                        }
                        className="input-resultado"
                      />
                      <input
                        type="text"
                        placeholder="Observaciones (opcional)"
                        value={observaciones[prueba.id] || ''}
                        onChange={(e) =>
                          handleObservacionesChange(prueba.id, e.target.value)
                        }
                        className="input-observaciones"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECCIÓN 4: Acciones Finales */}
          {selectedPaciente && selectedPruebas.length > 0 && (
            <section className="seccion seccion-acciones">
              <h2>4. Finalizar</h2>
              <div className="acciones-grid">
                <button
                  className="btn-primary btn-large"
                  onClick={handleGuardarExamenes}
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : '💾 Guardar Examen'}
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleGenerarPDF}
                  disabled={submitting}
                >
                  📄 Generar PDF
                </button>
                <button
                  className="btn-whatsapp"
                  onClick={handleEnviarWhatsApp}
                  disabled={submitting}
                >
                  💬 Enviar por WhatsApp
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default Examenes

