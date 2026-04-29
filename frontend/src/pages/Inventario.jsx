import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MenuHamburguesa from '../components/MenuHamburguesa'
import BrandingLink from '../components/BrandingLink'
import './Inventario.css'

function Inventario() {
  const navigate = useNavigate()
  const menuItems = [
    { label: 'Registro pacientes', icon: '👤', onClick: () => navigate('/registro-pacientes') },
    { label: 'Pruebas', icon: '🧪', onClick: () => navigate('/pruebas') },
    { label: 'Exámenes', icon: '📋', onClick: () => navigate('/examenes') },
    { label: 'Facturación', icon: '💳', onClick: () => navigate('/facturacion') },
    { label: 'Inventario', icon: '📦', onClick: () => navigate('/inventario') },
    { label: 'Registro financiero', icon: '💰', onClick: () => navigate('/registro-financiero') }
  ]

  const emptyForm = {
    nombre: '',
    unidad: 'unidades',
    categoria: 'General',
    stock: '',
    ubicacion: '',
    observaciones: ''
  }

  const [supplies, setSupplies] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [mensaje, setMensaje] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const saved = window.localStorage.getItem('inventario_insumos')
    if (saved) {
      try {
        setSupplies(JSON.parse(saved))
      } catch (error) {
        setSupplies([])
      }
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('inventario_insumos', JSON.stringify(supplies))
  }, [supplies])

  const filteredSupplies = useMemo(() => {
    const texto = searchTerm.trim().toLowerCase()
    if (!texto) return supplies
    return supplies.filter((item) => {
      return (
        item.nombre.toLowerCase().includes(texto) ||
        item.categoria.toLowerCase().includes(texto) ||
        item.unidad.toLowerCase().includes(texto) ||
        item.ubicacion.toLowerCase().includes(texto)
      )
    })
  }, [searchTerm, supplies])

  const totalInsumos = supplies.length
  const totalStock = supplies.reduce((sum, item) => sum + Number(item.stock || 0), 0)
  const lowStockCount = supplies.filter((item) => Number(item.stock) <= 3).length

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setIsEditMode(false)
    setSelectedId(null)
    setMensaje({ type: '', text: '' })
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!formData.nombre.trim()) {
      setMensaje({ type: 'error', text: 'El nombre del insumo es obligatorio.' })
      return
    }

    const stockValue = Number(formData.stock)
    if (Number.isNaN(stockValue) || stockValue < 0) {
      setMensaje({ type: 'error', text: 'El stock debe ser un número válido igual o mayor a 0.' })
      return
    }

    const payload = {
      ...formData,
      stock: stockValue,
      nombre: formData.nombre.trim()
    }

    if (isEditMode && selectedId !== null) {
      setSupplies((current) =>
        current.map((item) => (item.id === selectedId ? { ...item, ...payload } : item))
      )
      setMensaje({ type: 'success', text: 'Insumo actualizado correctamente.' })
    } else {
      const nextItem = {
        ...payload,
        id: Date.now().toString()
      }
      setSupplies((current) => [nextItem, ...current])
      setMensaje({ type: 'success', text: 'Insumo agregado al inventario.' })
    }

    resetForm()
  }

  const handleEdit = (item) => {
    setSelectedId(item.id)
    setIsEditMode(true)
    setFormData({
      nombre: item.nombre,
      unidad: item.unidad,
      categoria: item.categoria,
      stock: item.stock.toString(),
      ubicacion: item.ubicacion,
      observaciones: item.observaciones
    })
    setMensaje({ type: '', text: '' })
  }

  const handleDelete = (itemId) => {
    const confirmDelete = window.confirm('¿Seguro que deseas eliminar este insumo?')
    if (!confirmDelete) return
    setSupplies((current) => current.filter((item) => item.id !== itemId))
    if (selectedId === itemId) {
      resetForm()
    }
    setMensaje({ type: 'success', text: 'Insumo eliminado del inventario.' })
  }

  const updateStock = (itemId, amount) => {
    setSupplies((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item
        const nextStock = Math.max(0, Number(item.stock) + amount)
        return { ...item, stock: nextStock }
      })
    )
  }

  return (
    <div className="inventario-container">
      <MenuHamburguesa items={menuItems} />
      <BrandingLink />
      <main className="inventario-content">
        <div className="inventario-header">
          <div className="inventario-intro">
            <p className="inventario-eyebrow">Inventario</p>
            <h1 className="inventario-title">Gestiona los insumos del laboratorio</h1>
            <p className="inventario-subtitle">
              Registra entradas, edita cantidades, borra insumos y lleva el control de lo que queda en stock.
            </p>
          </div>
          <button className="btn btn-primary btn-inventario-action" type="button" onClick={resetForm}>
            Nuevo insumo
          </button>
        </div>

        <div className="inventario-wrapper">
          <section className="inventario-panel">
            <h2>{isEditMode ? 'Editar insumo' : 'Agregar insumo'}</h2>
            {mensaje.text && (
              <div className={`inventario-alert ${mensaje.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {mensaje.text}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="inventario-form-group">
                <label htmlFor="nombre">Nombre del insumo</label>
                <input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Guantes descartables"
                />
              </div>

              <div className="inventario-form-group">
                <label htmlFor="unidad">Unidad de medida</label>
                <select id="unidad" name="unidad" value={formData.unidad} onChange={handleChange}>
                  <option value="unidades">Unidades</option>
                  <option value="cajas">Cajas</option>
                  <option value="paquetes">Paquetes</option>
                  <option value="litros">Litros</option>
                  <option value="mL">mL</option>
                </select>
              </div>

              <div className="inventario-form-group">
                <label htmlFor="categoria">Categoría</label>
                <select id="categoria" name="categoria" value={formData.categoria} onChange={handleChange}>
                  <option value="General">General</option>
                  <option value="Reactivos">Reactivos</option>
                  <option value="Papelería">Papelería</option>
                  <option value="Limpieza">Limpieza</option>
                  <option value="Protección">Protección</option>
                </select>
              </div>

              <div className="inventario-form-group">
                <label htmlFor="stock">Stock disponible</label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="inventario-form-group">
                <label htmlFor="ubicacion">Ubicación</label>
                <input
                  id="ubicacion"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  placeholder="Ej. Bodega 1"
                />
              </div>

              <div className="inventario-form-group">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="inventario-form-actions">
                <button className="btn btn-primary" type="submit">
                  {isEditMode ? 'Actualizar insumo' : 'Agregar al inventario'}
                </button>
                {isEditMode && (
                  <button className="btn btn-secondary" type="button" onClick={resetForm}>
                    Cancelar edición
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="inventario-panel">
            <h2>Lista de insumos</h2>
            <div className="inventario-summary">
              <div className="inventario-summary-card">
                <span>Total de insumos</span>
                <strong>{totalInsumos}</strong>
              </div>
              <div className="inventario-summary-card">
                <span>Stock total</span>
                <strong>{totalStock}</strong>
              </div>
              <div className="inventario-summary-card">
                <span>Stock bajo</span>
                <strong>{lowStockCount}</strong>
              </div>
            </div>

            <div className="inventario-form-group">
              <label htmlFor="search">Buscar insumo</label>
              <input
                id="search"
                type="search"
                placeholder="Buscar por nombre, categoría o ubicación"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            {filteredSupplies.length === 0 ? (
              <p>Agrega tu primer insumo para empezar a llevar control de stock.</p>
            ) : (
              <div className="inventario-table-wrapper">
                <table className="inventario-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Stock</th>
                      <th>Ubicación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSupplies.map((item) => (
                      <tr key={item.id}>
                        <td>{item.nombre}</td>
                        <td>{item.categoria}</td>
                        <td>
                          <span className="inventario-highlight">
                            {item.stock} {item.unidad}
                          </span>
                        </td>
                        <td>{item.ubicacion || '—'}</td>
                        <td>
                          <div className="inventario-actions">
                            <button
                              type="button"
                              className="inventario-small-btn btn-stock"
                              onClick={() => updateStock(item.id, -1)}
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              className="inventario-small-btn btn-stock"
                              onClick={() => updateStock(item.id, 1)}
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              className="inventario-small-btn btn-edit"
                              onClick={() => handleEdit(item)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="inventario-small-btn btn-delete"
                              onClick={() => handleDelete(item.id)}
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Inventario
