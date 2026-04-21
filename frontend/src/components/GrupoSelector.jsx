/**
 * GrupoSelector.jsx
 *
 * Componente para seleccionar grupos de pruebas.
 * Cuando se selecciona un grupo, automáticamente se seleccionan todas sus pruebas.
 *
 * Props:
 * - grupos: Array de objetos {id, nombre, descripcion}
 * - allPruebas: Array de todas las pruebas disponibles
 * - selectedPruebas: Array de IDs de pruebas seleccionadas
 * - onTogglePrueba: Función callback que recibe pruebaId
 * - onSelectGrupo: Función callback opcional que recibe grupoId
 */

import React, { useState, useEffect } from 'react'
import api from '../services/api'
import './GrupoSelector.css'

function GrupoSelector({ grupos, allPruebas, selectedPruebas, onTogglePrueba, onToggleGrupo }) {
  const [pruebasByGrupo, setPruebasByGrupo] = useState({})
  const [loadingGrupo, setLoadingGrupo] = useState(null)

  // Cargar pruebas de cada grupo cuando se reciben los grupos
  useEffect(() => {
    loadPruebasByGrupo()
  }, [grupos])

  const loadPruebasByGrupo = async () => {
    if (!grupos || grupos.length === 0) return

    const groupMap = {}
    for (const grupo of grupos) {
      try {
        const pruebas = await api.getPruebasByGrupo(grupo.id)
        groupMap[grupo.id] = pruebas || []
      } catch (error) {
        console.error(`Error cargando pruebas del grupo ${grupo.id}:`, error)
        groupMap[grupo.id] = []
      }
    }
    setPruebasByGrupo(groupMap)
  }

  const handleSelectGrupo = async (grupoId) => {
    if (onToggleGrupo) {
      onToggleGrupo(grupoId)
    }

    // Obtener pruebas del grupo
    if (pruebasByGrupo[grupoId]) {
      const grupoProuebas = pruebasByGrupo[grupoId]
      const allSelected = grupoProuebas.every(p => selectedPruebas.includes(p.id))

      // Si todas están seleccionadas, deseleccionar todas. Si no, seleccionar todas.
      if (allSelected) {
        grupoProuebas.forEach(p => {
          if (selectedPruebas.includes(p.id)) {
            onTogglePrueba(p.id)
          }
        })
      } else {
        grupoProuebas.forEach(p => {
          if (!selectedPruebas.includes(p.id)) {
            onTogglePrueba(p.id)
          }
        })
      }
    }
  }

  if (!grupos || grupos.length === 0) {
    return (
      <div className="grupo-selector">
        <p className="sin-grupos">No hay grupos disponibles</p>
      </div>
    )
  }

  return (
    <div className="grupo-selector">
      <h3 className="grupo-titulo">📋 Seleccionar por Grupo</h3>

      <div className="grupo-buttons-container">
        {grupos.map(grupo => {
          const grupoProuebas = pruebasByGrupo[grupo.id] || []
          const allSelectedInGrupo = grupoProuebas.length > 0 && grupoProuebas.every(p => selectedPruebas.includes(p.id))
          const someSelectedInGrupo = grupoProuebas.some(p => selectedPruebas.includes(p.id))

          return (
            <button
              key={grupo.id}
              className={`grupo-button ${allSelectedInGrupo ? 'active' : ''} ${someSelectedInGrupo ? 'partial' : ''}`}
              onClick={() => handleSelectGrupo(grupo.id)}
              title={grupo.descripcion}
            >
              <div className="grupo-button-name">{grupo.nombre}</div>
              <div className="grupo-button-count">
                {grupoProuebas.filter(p => selectedPruebas.includes(p.id)).length}/{grupoProuebas.length}
              </div>
            </button>
          )
        })}
      </div>

      {/* Mostrar pruebas del grupo seleccionado */}
      <div className="grupo-pruebas-lista">
        <h4>✓ Pruebas Seleccionadas</h4>
        {selectedPruebas.length === 0 ? (
          <p className="sin-seleccion">No hay pruebas seleccionadas</p>
        ) : (
          <div className="grupo-pruebas-items">
            {allPruebas
              .filter(p => selectedPruebas.includes(p.id))
              .sort((a, b) => {
                const grupoA = grupos.find(g => g.id === a.grupo_id)?.nombre || 'Sin grupo'
                const grupoB = grupos.find(g => g.id === b.grupo_id)?.nombre || 'Sin grupo'
                return grupoA.localeCompare(grupoB) || a.nombre_prueba.localeCompare(b.nombre_prueba)
              })
              .map(prueba => {
                const grupo = grupos.find(g => g.id === prueba.grupo_id)
                return (
                  <div key={prueba.id} className="grupo-prueba-item">
                    <span className="grupo-prueba-nombre">{prueba.nombre_prueba}</span>
                    {grupo && <span className="grupo-prueba-grupo">{grupo.nombre}</span>}
                    <button
                      className="grupo-prueba-remove"
                      onClick={() => onTogglePrueba(prueba.id)}
                      title="Remover"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}

export default GrupoSelector
