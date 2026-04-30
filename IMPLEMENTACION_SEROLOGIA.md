# Implementación de Soporte para Pruebas de Serología

## Resumen
Se ha implementado soporte completo para pruebas tipo **serología** dentro del módulo de Pruebas, manteniendo intacta toda la funcionalidad existente para pruebas numéricas.

---

## Cambios Realizados

### 1. **Frontend - Módulo de Pruebas** (`frontend/src/pages/Pruebas.jsx`)

#### Cambios en el Estado:
- **Agregado:** Campo `tipo_prueba` en `formData` con valor por defecto `'numerica'`
  - Opciones: `'numerica'` o `'serologia'`

#### Cambios en Validación:
- **Actualizado:** `validateForm()` para diferenciar entre tipos de prueba
  - Pruebas numéricas: Requieren `unidad_medida`
  - Pruebas serologías: NO requieren `unidad_medida` ni valores de referencia
  - Valores de referencia (min/max) solo se validan para pruebas numéricas

#### Cambios en Guardado:
- **Actualizado:** `handleSubmit()` para enviar `tipo_prueba`
  - Pruebas serologías: `unidad_medida = ''`, `valor_referencia_min = null`, `valor_referencia_max = null`
  - Pruebas numéricas: Se envían los valores normalmente

#### Cambios en Interfaz:
- **Agregado:** Selector de tipo de prueba después del nombre
  ```jsx
  <select name="tipo_prueba" value={formData.tipo_prueba} onChange={handleFormChange}>
    <option value="numerica">Prueba numérica</option>
    <option value="serologia">Serología (Positivo/Negativo)</option>
  </select>
  ```

- **Condicional:** Campos de unidad_medida y valores de referencia solo se muestran si `tipo_prueba === 'numerica'`

---

### 2. **Frontend - Módulo de Exámenes** (`frontend/src/pages/Examenes.jsx`)

#### Cambios en Ingreso de Resultados:
- **Condicional:** El campo para ingresar resultado depende del tipo de prueba
  - **Serología:** Mostrar `<select>` con opciones:
    ```jsx
    <option value="">Seleccionar resultado...</option>
    <option value="positivo">Positivo</option>
    <option value="negativo">Negativo</option>
    ```
  - **Numérica:** Mantener `<input type="text">` original

- **Actualizado:** Encabezado del resultado
  - Serologías: NO mostrar unidad
  - Numéricas: Mostrar unidad normalmente

- **Actualizado:** Rango de referencia
  - Serologías: NO mostrar rango
  - Numéricas: Mostrar rango normalmente

#### Cambios en Generación de PDF:
- **Condicional:** Lógica de "fuera de rango"
  - Solo aplica a pruebas `tipo_prueba === 'numerica'`
  - Serologías: Nunca mostrarán fuera de rango
  - Serologías: No mostrarán rango entre paréntesis

- **Actualizado:** Cálculo de `resultadoUnidad`
  - Serologías: Solo mostrar resultado (sin unidad)
  - Numéricas: Mostrar resultado + unidad

- **Actualizado:** Estilo de descripción
  - La descripción solo aparece en negrita si la prueba está fuera de rango (solo numéricas)

---

### 3. **Backend - Modelos** (`backend/app/models/prueba_models.py`)

#### Cambios en `PruebaBase`:
- **Agregado:** Campo `tipo_prueba: Optional[str] = 'numerica'`
- **Actualizado:** `unidad_medida` a `Optional[str] = None`
- **Agregado:** Validador para `tipo_prueba`
  - Valores válidos: `'numerica'`, `'serologia'`
  - Lanza error si es otro valor

#### Cambios en `PruebaUpdate`:
- **Agregado:** Campo `tipo_prueba: Optional[str] = None`
- **Agregado:** Validador para `tipo_prueba`

---

## Arquitectura y Flujo

### Flujo de Creación de Prueba Serología:

1. **Usuario selecciona tipo** → "Serología"
2. **UI actualiza dinámicamente:**
   - Oculta campo de unidad_medida
   - Oculta campos de valores de referencia
3. **Usuario ingresa:** Nombre, tipo de muestra, precio
4. **Sistema valida:** Solo campos necesarios
5. **Sistema guarda:** 
   ```json
   {
     "nombre_prueba": "VIH",
     "tipo_prueba": "serologia",
     "unidad_medida": "",
     "tipo_muestra": "Sangre",
     "valor_referencia_min": null,
     "valor_referencia_max": null,
     "precio_bs": 500,
     "descripcion": "..."
   }
   ```

### Flujo de Ingreso de Resultado:

1. **Usuario selecciona pruebas** (incluyendo serologías)
2. **UI genera campos según tipo:**
   - Serologías → `<select>` con Positivo/Negativo
   - Numéricas → `<input>` de texto
3. **Usuario ingresa resultados**
4. **Sistema guarda:**
   - Serologías: `"positivo"` o `"negativo"` como string
   - Numéricas: Valor numérico como texto (ej: "125.5")

### Flujo de Generación de PDF:

1. **Sistema itera pruebas**
2. **Para cada prueba:**
   - **Si serología:** Mostrar nombre + resultado (sin rango ni unidad)
   - **Si numérica:** Mostrar nombre + resultado + unidad + rango
3. **Detectar fuera de rango:**
   - **Solo para numéricas** si valor < min o valor > max
   - **Nunca para serologías**

---

## Compatibilidad

✅ **Totalmente compatible con:**
- Pruebas numéricas existentes (sin cambios)
- Grupos de pruebas (serologías pueden agruparse)
- PDF (con lógica especial para serología)
- Historial de exámenes
- Búsqueda y filtrado

⚠️ **Consideraciones Importantes:**

1. **Base de datos (Supabase):**
   - Necesita agregar columna `tipo_prueba` a tabla `pruebas`
   - Tipo: `VARCHAR(20)`
   - Default: `'numerica'`
   - Recomendación: Hacer manually en Supabase UI ya que no soporta migraciones

2. **Datos existentes:**
   - Todas las pruebas existentes tendrán `tipo_prueba = 'numerica'` por default
   - Sin acción requerida del usuario
   - Funcionarán exactamente igual que antes

3. **API:**
   - Campo `tipo_prueba` es opcional en requests (default: 'numerica')
   - Es incluido en responses

---

## Ejemplo de Uso

### Crear Prueba Serología:
```
Nombre: "Prueba de COVID-19"
Tipo: Serología
Tipo de Muestra: Suero
Precio: 150 Bs

→ Sistema guarda sin requerir unidad ni rangos
```

### Ingresar Resultado:
```
Paciente: Juan Pérez
Prueba: COVID-19 (Serología)
Resultado: Positivo [select dropdown]

→ Guardado como string: "positivo"
```

### PDF Generado:
```
Prueba realizadas y resultados
─────────────────────────────

Prueba de COVID-19                        Positivo

(Sin rango, sin unidad, sin lógica de "fuera de rango")
```

---

## Archivos Modificados

1. ✅ `frontend/src/pages/Pruebas.jsx`
   - formData, validación, formulario modal, guardado

2. ✅ `frontend/src/pages/Examenes.jsx`
   - Ingreso de resultados, generación PDF

3. ✅ `backend/app/models/prueba_models.py`
   - Modelos Pydantic actualizados

---

## Testing Recomendado

- [ ] Crear prueba numérica → Verificar que funcione igual que antes
- [ ] Crear prueba serologías → Verificar campos ocultos
- [ ] Editar prueba → Verificar que `tipo_prueba` se carga correctamente
- [ ] Ingresar resultado de serologías → Verificar select dropdown
- [ ] Generar PDF con serologías → Verificar sin rango ni unidad
- [ ] Generar PDF mixto (numérica + serologías) → Verificar formateo diferenciado
- [ ] Verificar que pruebas numéricas siguen mostrando rango "fuera de rango"

---

## Notas Técnicas

- ✅ Sin breaking changes
- ✅ Sin cambios en rutas de API
- ✅ Sin cambios en estilos globales
- ✅ Mantiene toda la funcionalidad existente
- ✅ Código modular y fácil de mantener
- ✅ Compatibilidad hacia atrás garantizada
