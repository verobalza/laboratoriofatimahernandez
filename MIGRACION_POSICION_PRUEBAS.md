# 🔄 Migración: Agregar Campo de Posición a Pruebas

## 📋 Resumen
Agregar un campo `posicion` a la tabla `pruebas` para preservar el orden de selección cuando se asignan a un grupo.

## 🗄️ SQL Migration

Ejecutar en Supabase SQL Editor o usar el archivo:

`backend/db/ADD_POSICION_PRUEBAS.sql`

Si usas el SQL editor, ejecuta:

```sql
-- 1. Agregar columna posicion (nullable inicialmente)
ALTER TABLE pruebas ADD COLUMN posicion INTEGER DEFAULT NULL;

-- 2. Actualizar pruebas existentes: asignar posiciones por nombre alfabético
WITH ranked_pruebas AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY nombre_prueba) as rn
  FROM pruebas
)
UPDATE pruebas
SET posicion = ranked_pruebas.rn
FROM ranked_pruebas
WHERE pruebas.id = ranked_pruebas.id;

-- 3. Crear índice para optimizar ordenamiento
CREATE INDEX idx_pruebas_grupo_posicion ON pruebas(grupo_id, posicion);

-- 4. Crear índice parcial para pruebas sin asignar
CREATE INDEX idx_pruebas_sin_grupo ON pruebas(nombre_prueba) 
WHERE grupo_id IS NULL;
```

## 🔄 Cambios en el Backend

### 1. Modelo Pydantic (prueba_models.py)
```python
class PruebaUpdate(BaseModel):
    # ... campos existentes ...
    posicion: Optional[int] = None
```

### 2. Ruta de Grupos (grupos.py)
Cambiar orden de:
```python
.order("nombre_prueba")
```
A:
```python
.order("posicion", desc=False)  # NULL values go last
```

## 🎨 Cambios en el Frontend

### Pruebas.jsx - handleGuardarGrupo
```javascript
// Cuando se guarda un grupo:
for (let i = 0; i < selectedPruebasGrupo.length; i++) {
  const pruebaId = selectedPruebasGrupo[i];
  await api.updatePrueba(pruebaId, { 
    grupo_id: nuevoGrupo.id,
    posicion: i + 1  // Posición basada en índice
  });
}
```

### Examenes.jsx - Después de cargar pruebas
```javascript
// Asegurar que allPruebas estén ordenadas por posicion
const sortedByPosition = allPruebas.sort((a, b) => {
  if (a.posicion === null || a.posicion === undefined) return 1;
  if (b.posicion === null || b.posicion === undefined) return 1;
  return (a.posicion || 0) - (b.posicion || 0);
});
```

## ✅ Beneficios
- Preserva el orden exacto de selección
- Compatible con búsquedas por nombre
- Mejora rendimiento con índices
- No rompe código existente (posicion es opcional)
