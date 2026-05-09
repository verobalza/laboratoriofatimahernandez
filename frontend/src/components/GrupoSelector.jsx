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

  const normalize = (value = '') => value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const HEMATOLOGIA_NOMBRE = 'hematologia completa'

  const grupoIncluyeHematologiaCompleta = (grupo) => {
    return !!grupo && normalize(grupo.nombre || '') === HEMATOLOGIA_NOMBRE
  }

  const isHematologiaGroup = (grupo) => {
    if (!grupo) return false
    const normalized = normalize(grupo.nombre || '')
    return ['serie roja', 'serie blanca', 'serie plaquetaria', 'hematologia completa', 'hematología completa'].includes(normalized)
  }

  const getHematologiaPruebas = () => {
    const seriesGroupIds = grupos
      .filter((grupo) => ['serie roja', 'serie blanca', 'serie plaquetaria'].includes(normalize(grupo.nombre || '')))
      .map((grupo) => grupo.id)

    return allPruebas.filter((p) => seriesGroupIds.includes(p.grupo_id))
  }

  const getGrupoPruebas = (grupo) => {
    const pruebas = pruebasByGrupo[grupo.id] || []
    if (grupoIncluyeHematologiaCompleta(grupo)) {
      const hemato = getHematologiaPruebas()
      const merged = [...pruebas, ...hemato]
      return Array.from(new Map(merged.map((p) => [p.id, p])).values())
    }
    return pruebas
  }

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
          const grupoPruebas = getGrupoPruebas(grupo)
          const allSelectedInGrupo = grupoPruebas.length > 0 && grupoPruebas.every((p) => selectedPruebas.includes(p.id))
          const someSelectedInGrupo = grupoPruebas.some((p) => selectedPruebas.includes(p.id))

          return (
            <button
              key={grupo.id}
              className={`grupo-button ${allSelectedInGrupo ? 'active' : ''} ${someSelectedInGrupo ? 'partial' : ''}`}
              onClick={() => handleSelectGrupo(grupo.id)}
              title={grupo.descripcion}
            >
              <div className="grupo-button-name">
                {grupo.nombre}
                {grupoIncluyeHematologiaCompleta(grupo) && (
                  <span className="grupo-hematologia-badge">Hematología Completa</span>
                )}
              </div>
              <div className="grupo-button-count">
                {grupoPruebas.filter((p) => selectedPruebas.includes(p.id)).length}/{grupoPruebas.length}
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
              .filter((p) => selectedPruebas.includes(p.id))
              .sort((a, b) => selectedPruebas.indexOf(a.id) - selectedPruebas.indexOf(b.id))
              .map(prueba => {
                const grupo = grupos.find(g => g.id === prueba.grupo_id)
                return (
                  <div key={prueba.id} className="grupo-prueba-item">
                    <span className="grupo-prueba-nombre">{prueba.nombre_prueba}</span>
                    {grupo && !isHematologiaGroup(grupo) && (
                      <span className="grupo-prueba-grupo">{grupo.nombre}</span>
                    )}
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
