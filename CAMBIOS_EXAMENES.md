/**
 * CAMBIOS NECESARIOS EN Examenes.jsx
 * 
 * Este archivo contiene el código exacto que debes agregar/modificar
 * en frontend/src/pages/Examenes.jsx para soportar orina y heces
 */

// ============================================================
// PASO 1: Agregar en el import de React Router
// ============================================================
// ACTUAL:
import { useNavigate } from 'react-router-dom'

// CAMBIAR A:
import { useNavigate } from 'react-router-dom'


// ============================================================
// PASO 2: En la función handleSelectPrueba()
// ============================================================
// BUSCAR la función handleSelectPrueba (aproximadamente línea 300+)

// ACTUAL (aproximado):
const handleSelectPrueba = (prueba) => {
  setSelectedPruebaId(prueba.id)
  setIsEditMode(true)
  // ... más código ...
  setModalOpen(true)
}

// CAMBIAR A:
const handleSelectPrueba = (prueba) => {
  // ⭐ AGREGAR ESTA LÓGICA AL INICIO:
  // Si es una prueba especial (orina o heces), redirigir a formulario especizado
  if (prueba.tipo === 'orina') {
    // Asumir que tienes paciente_id en algún lugar disponible
    // O si viene del contexto/props, úsalo
    navigate(`/orina-form/${selectedPacienteId}`)
    return
  }
  
  if (prueba.tipo === 'heces') {
    navigate(`/heces-form/${selectedPacienteId}`)
    return
  }
  
  // RESTO DEL CÓDIGO ACTUAL (sin cambios)
  setSelectedPruebaId(prueba.id)
  setIsEditMode(true)
  setFormData({
    nombre_prueba: prueba.nombre_prueba || '',
    unidad_medida: prueba.unidad_medida || '',
    tipo_muestra: prueba.tipo_muestra || '',
    valor_referencia_min: prueba.valor_referencia_min ?? '',
    valor_referencia_max: prueba.valor_referencia_max ?? '',
    descripcion: prueba.descripcion || '',
    precio_bs: prueba.precio_bs != null ? String(prueba.precio_bs) : ''
  })
  setErrors({})
  setMensaje({ type: '', text: '' })
  setModalOpen(true)
}


// ============================================================
// PASO 3: Agregar en App.jsx (o donde tengas rutas)
// ============================================================
// En el archivo de rutas (probablemente App.jsx o main.jsx)

// AGREGAR ESTOS IMPORTS AL INICIO:
import OrinaForm from './pages/OrinaForm'
import HecesForm from './pages/HecesForm'

// AGREGAR ESTAS RUTAS en tu <Routes>:
<Routes>
  {/* Rutas existentes... */}
  
  {/* NUEVAS RUTAS PARA ORINA Y HECES */}
  <Route path="/orina-form/:pacienteId" element={<OrinaForm />} />
  <Route path="/heces-form/:pacienteId" element={<HecesForm />} />
  
  {/* Más rutas... */}
</Routes>


// ============================================================
// PASO 4: Opcional - Mostrar badge especial en listado
// ============================================================
// Si quieres mostrar un indicador visual de que la prueba es especial:

// BUSCAR DONDE SE RENDERIZAN LAS PRUEBAS (aproximadamente línea 800+)
// En el renderizado de cada prueba, agregar:

<div className="prueba-item">
  <h3>{prueba.nombre_prueba}</h3>
  
  {/* AGREGAR ESTO: */}
  {prueba.tipo === 'orina' && (
    <span className="badge badge-orina">🧪 Examen Completo Orina</span>
  )}
  {prueba.tipo === 'heces' && (
    <span className="badge badge-heces">🔬 Examen Completo Heces</span>
  )}
  {prueba.tipo === 'normal' && (
    <span className="badge badge-normal">Prueba Estándar</span>
  )}
  
  {/* Resto del código... */}
</div>


// ============================================================
// PASO 5: CSS para badges (agregar a Examenes.css)
// ============================================================

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 8px;
}

.badge-orina {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #28a745;
}

.badge-heces {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
}

.badge-normal {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}


// ============================================================
// PASO 6: Si quieres botón para generar PDF en formulario
// ============================================================
// En OrinaForm.jsx, agregar un botón junto a "Guardar":

import { generarPDFOrina, descargarPDF } from '../services/pdfGenerators'

// En el componente OrinaForm:
// Agregar state para generar PDF:
const [generandoPDF, setGenerandoPDF] = useState(false)

// Función para generar y descargar:
const handleGenerarPDF = async () => {
  setGenerandoPDF(true)
  try {
    const doc = generarPDFOrina(paciente, formData)
    const nombreArchivo = `Orina_${paciente.nombre}_${formData.fecha}`
    descargarPDF(doc, nombreArchivo)
    setMensaje({ type: 'success', text: '✅ PDF generado y descargado' })
  } catch (error) {
    console.error('Error generando PDF:', error)
    setMensaje({ type: 'error', text: 'Error al generar PDF' })
  } finally {
    setGenerandoPDF(false)
  }
}

// Agregar botón en form-buttons:
<div className="form-buttons">
  <button
    type="button"
    className="btn-pdf"
    onClick={handleGenerarPDF}
    disabled={submitting || generandoPDF}
  >
    {generandoPDF ? '⏳ Generando PDF...' : '📄 Descargar PDF'}
  </button>
  
  <button
    type="submit"
    className="btn-primary"
    disabled={submitting || generandoPDF}
  >
    {submitting ? '⏳ Guardando...' : '💾 Guardar Examen'}
  </button>
  
  <button
    type="button"
    className="btn-secondary"
    onClick={handleCancel}
    disabled={submitting || generandoPDF}
  >
    ✕ Cancelar
  </button>
</div>

// Agregar CSS:
.btn-pdf {
  padding: 12px 40px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #f39c12 0%, #e8861a 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
  transition: all 0.3s ease;
}

.btn-pdf:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
}
