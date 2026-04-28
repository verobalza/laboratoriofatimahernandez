# 📊 ANÁLISIS EXHAUSTIVO: unidad_medida y tipo_muestra

**Fecha:** 28 de abril de 2026  
**Objetivo:** Documentar cómo se manejan actualmente unidades de medida y tipos de muestra  
**Estado:** ✅ Búsqueda completada

---

## 🎯 RESUMEN EJECUTIVO

El proyecto maneja `unidad_medida` y `tipo_muestra` como **catálogos dinámicos** que:
- Se almacenan en tablas separadas de Supabase (`unidades_medida` y `tipos_muestra`)
- Se permiten AGREGAR nuevas unidades/tipos sobre la marcha desde la UI
- Se usan como TEXT fields en la tabla `pruebas` (por ahora no son foreign keys)
- **⚠️ PROBLEMA:** Las tablas `unidades_medida` y `tipos_muestra` **NO ESTÁN CREADAS EN SUPABASE**

---

## 1️⃣ COMPONENTE FRONTEND - Pruebas.jsx

### Ubicación
[frontend/src/pages/Pruebas.jsx](frontend/src/pages/Pruebas.jsx)

### Estados Relacionados (línea ~71-72)
```javascript
const [unidadesMedida, setUnidadesMedida] = useState([])
const [tiposMuestra, setTiposMuestra] = useState([])
```

### Funciones de Carga (línea ~128-148)
```javascript
const loadUnidadesMedida = async () => {
  try {
    const unidades = await api.getUnidadesMedida()
    setUnidadesMedida(unidades || [])
  } catch (error) {
    console.error('Error cargando unidades:', error)
  }
}

const loadTiposMuestra = async () => {
  try {
    const tipos = await api.getTiposMuestra()
    setTiposMuestra(tipos || [])
  } catch (error) {
    console.error('Error cargando tipos:', error)
  }
}
```

### Uso en useEffect (línea ~119)
```javascript
useEffect(() => {
  loadPruebas()
  loadGrupos()
  loadUnidadesMedida()  // ← Carga al abrir la página
  loadTiposMuestra()    // ← Carga al abrir la página
  loadTasaCambio()
}, [])
```

### Elementos de Formulario (línea ~890-912)

#### SELECT de Unidades de Medida
```jsx
<select
  id="unidad_medida"
  name="unidad_medida"
  value={formData.unidad_medida}
  onChange={handleFormChange}
  className={`form-input ${errors.unidad_medida ? 'error' : ''}`}
>
  <option value="">Seleccionar unidad...</option>
  <option value="__add_new_unidad__">+ Agregar nueva unidad</option>
  {unidadesMedida.map((unidad) => (
    <option key={unidad.id} value={unidad.nombre}>
      {unidad.nombre}
    </option>
  ))}
</select>
```

#### SELECT de Tipos de Muestra
```jsx
<select
  id="tipo_muestra"
  name="tipo_muestra"
  value={formData.tipo_muestra}
  onChange={handleFormChange}
  className={`form-input ${errors.tipo_muestra ? 'error' : ''}`}
>
  <option value="">Seleccionar tipo...</option>
  <option value="__add_new_tipo__">+ Agregar nuevo tipo</option>
  {tiposMuestra.map((tipo) => (
    <option key={tipo.id} value={tipo.nombre}>
      {tipo.nombre}
    </option>
  ))}
</select>
```

### Lógica para CREAR Nuevas Unidades/Tipos (línea ~555-605)

Cuando el usuario selecciona `"__add_new_unidad__"` o `"__add_new_tipo__"`:

```javascript
const handleFormChange = async (e) => {
  const { name, value } = e.target

  // ===== CREAR NUEVA UNIDAD =====
  if (name === 'unidad_medida' && value === '__add_new_unidad__') {
    const nueva = prompt('Ingrese la nueva unidad de medida (ej: mg/mL, U/L, etc.):')
    if (nueva && nueva.trim()) {
      try {
        // 1. Guardar en Supabase
        await api.createUnidadMedida(nueva.trim())
        
        // 2. Recargar unidades
        await loadUnidadesMedida()
        
        // 3. Seleccionar la nueva unidad
        setFormData((prev) => ({ 
          ...prev, 
          unidad_medida: nueva.trim()
        }))
        
        setMensaje({ type: 'success', text: 'Unidad agregada correctamente' })
      } catch (error) {
        console.error('Error guardando unidad:', error)
        setMensaje({ type: 'error', text: 'Error al guardar la unidad' })
        setFormData((prev) => ({ ...prev, unidad_medida: '' }))
      }
    } else {
      setFormData((prev) => ({ ...prev, unidad_medida: '' }))
    }
    return
  }

  // ===== CREAR NUEVO TIPO =====
  if (name === 'tipo_muestra' && value === '__add_new_tipo__') {
    const nuevo = prompt('Ingrese el nuevo tipo de muestra (ej: LCR, sinovia, etc.):')
    if (nuevo && nuevo.trim()) {
      try {
        // 1. Guardar en Supabase
        await api.createTipoMuestra(nuevo.trim())
        
        // 2. Recargar tipos
        await loadTiposMuestra()
        
        // 3. Seleccionar el nuevo tipo
        setFormData((prev) => ({ 
          ...prev, 
          tipo_muestra: nuevo.trim()
        }))
        
        setMensaje({ type: 'success', text: 'Tipo agregado correctamente' })
      } catch (error) {
        console.error('Error guardando tipo:', error)
        setMensaje({ type: 'error', text: 'Error al guardar el tipo' })
        setFormData((prev) => ({ ...prev, tipo_muestra: '' }))
      }
    } else {
      setFormData((prev) => ({ ...prev, tipo_muestra: '' }))
    }
    return
  }

  // ... resto del código
}
```

### Validación del Formulario (línea ~234-246)
```javascript
if (!formData.unidad_medida.trim()) {
  newErrors.unidad_medida = 'La unidad de medida es obligatoria'
}

if (!formData.tipo_muestra.trim()) {
  newErrors.tipo_muestra = 'El tipo de muestra es obligatorio'
}
```

---

## 2️⃣ ENDPOINTS DEL BACKEND

### Ubicación
[backend/app/routes/pruebas.py](backend/app/routes/pruebas.py)

### Endpoints Implementados

#### 1. Crear Unidad de Medida
```python
@router.post("unidades", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_unidad_medida(data: dict):
    """
    Crea una nueva unidad de medida.
    """
    supabase = get_supabase_client()
    
    nombre = data.get("nombre", "").strip()
    if not nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la unidad es obligatorio"
        )
    
    try:
        resp = supabase.table("unidades_medida").insert({"nombre": nombre}).execute()
    except Exception as e:
        logging.error(f"Error creando unidad: {e}")
        if "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esta unidad ya existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear la unidad"
        )
    
    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se creó la unidad"
        )
    
    return resp.data[0]
```

**Endpoint:** `POST /pruebas/unidades`  
**Request Body:**
```json
{
  "nombre": "mg/mL"
}
```
**Response:** `201 Created`
```json
{
  "id": "uuid-1",
  "nombre": "mg/mL",
  "creado_en": "2026-04-28T10:30:00Z"
}
```

---

#### 2. Listar Unidades de Medida
```python
@router.get("unidades", response_model=List[dict])
async def list_unidades_medida():
    """
    Lista todas las unidades de medida.
    """
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("unidades_medida").select("*").order("nombre").execute()
    except Exception as e:
        logging.error(f"Error listando unidades: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar unidades"
        )
    
    return resp.data or []
```

**Endpoint:** `GET /pruebas/unidades`  
**Response:** `200 OK`
```json
[
  {
    "id": "uuid-1",
    "nombre": "g/dL",
    "creado_en": "2026-04-28T10:00:00Z"
  },
  {
    "id": "uuid-2",
    "nombre": "mg/dL",
    "creado_en": "2026-04-28T10:05:00Z"
  },
  {
    "id": "uuid-3",
    "nombre": "U/L",
    "creado_en": "2026-04-28T10:10:00Z"
  }
]
```

---

#### 3. Crear Tipo de Muestra
```python
@router.post("tipos", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_tipo_muestra(data: dict):
    """
    Crea un nuevo tipo de muestra.
    """
    supabase = get_supabase_client()
    
    nombre = data.get("nombre", "").strip()
    if not nombre:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del tipo es obligatorio"
        )
    
    try:
        resp = supabase.table("tipos_muestra").insert({"nombre": nombre}).execute()
    except Exception as e:
        logging.error(f"Error creando tipo: {e}")
        if "duplicate" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este tipo ya existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el tipo"
        )
    
    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se creó el tipo"
        )
    
    return resp.data[0]
```

**Endpoint:** `POST /pruebas/tipos`  
**Request Body:**
```json
{
  "nombre": "LCR"
}
```
**Response:** `201 Created`
```json
{
  "id": "uuid-1",
  "nombre": "LCR",
  "creado_en": "2026-04-28T10:30:00Z"
}
```

---

#### 4. Listar Tipos de Muestra
```python
@router.get("tipos", response_model=List[dict])
async def list_tipos_muestra():
    """
    Lista todos los tipos de muestra.
    """
    supabase = get_supabase_client()
    
    try:
        resp = supabase.table("tipos_muestra").select("*").order("nombre").execute()
    except Exception as e:
        logging.error(f"Error listando tipos: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al listar tipos"
        )
    
    return resp.data or []
```

**Endpoint:** `GET /pruebas/tipos`  
**Response:** `200 OK`
```json
[
  {
    "id": "uuid-1",
    "nombre": "LCR",
    "creado_en": "2026-04-28T10:00:00Z"
  },
  {
    "id": "uuid-2",
    "nombre": "Sangre",
    "creado_en": "2026-04-28T10:05:00Z"
  },
  {
    "id": "uuid-3",
    "nombre": "Orina",
    "creado_en": "2026-04-28T10:10:00Z"
  },
  {
    "id": "uuid-4",
    "nombre": "Heces",
    "creado_en": "2026-04-28T10:15:00Z"
  }
]
```

---

## 3️⃣ SERVICIO DEL FRONTEND (api.js)

### Ubicación
[frontend/src/services/api.js](frontend/src/services/api.js)

### Funciones Implementadas

#### 1. Crear Unidad de Medida (línea ~264-269)
```javascript
async createUnidadMedida(nombre) {
  return request(`${API_URL}/pruebas/unidades`, {
    method: 'POST',
    body: JSON.stringify({ nombre })
  })
}
```

#### 2. Obtener Unidades de Medida (línea ~271-273)
```javascript
async getUnidadesMedida() {
  return request(`${API_URL}/pruebas/unidades`, { method: 'GET' })
}
```

#### 3. Crear Tipo de Muestra (línea ~275-280)
```javascript
async createTipoMuestra(nombre) {
  return request(`${API_URL}/pruebas/tipos`, {
    method: 'POST',
    body: JSON.stringify({ nombre })
  })
}
```

#### 4. Obtener Tipos de Muestra (línea ~282-284)
```javascript
async getTiposMuestra() {
  return request(`${API_URL}/pruebas/tipos`, { method: 'GET' })
}
```

---

## 4️⃣ MODELOS BACKEND (Pydantic)

### Ubicación
[backend/app/models/prueba_models.py](backend/app/models/prueba_models.py)

### Modelos Relacionados

#### PruebaBase (línea ~7-23)
```python
class PruebaBase(BaseModel):
    nombre_prueba: str
    unidad_medida: str                      # ← Campo obligatorio
    tipo_muestra: str                       # ← Campo obligatorio
    valor_referencia_min: Optional[float] = None
    valor_referencia_max: Optional[float] = None
    descripcion: Optional[str] = None
    precio_bs: float
    grupo_id: Optional[str] = None

    @field_validator("nombre_prueba", "unidad_medida", "tipo_muestra")
    @classmethod
    def validate_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Este campo es obligatorio")
        return v.strip()
```

#### PruebaCreate (línea ~26-28)
```python
class PruebaCreate(PruebaBase):
    """Datos necesarios para crear prueba"""
    pass
```

#### PruebaOut (línea ~60-66)
```python
class PruebaOut(PruebaBase):
    id: int
    creado_en: Optional[str] = None
    precio_usd: Optional[float] = None

    class Config:
        from_attributes = True
```

---

## 5️⃣ ESTRUCTURA DE TABLAS EN SUPABASE

### ⚠️ PROBLEMA CRÍTICO

**Las siguientes tablas NO EXISTEN en Supabase y DEBEN SER CREADAS:**

### Tabla: unidades_medida (FALTA CREAR)
```sql
CREATE TABLE unidades_medida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_unidades_medida_nombre ON unidades_medida(nombre);

ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;
```

**Estructura:**
| Campo | Tipo | Restricciones |
|-------|------|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `nombre` | TEXT | NOT NULL, UNIQUE |
| `creado_en` | TIMESTAMP | DEFAULT now() |

**Ejemplo de datos:**
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "nombre": "g/dL",
  "creado_en": "2026-04-28T10:00:00Z"
}
```

---

### Tabla: tipos_muestra (FALTA CREAR)
```sql
CREATE TABLE tipos_muestra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_tipos_muestra_nombre ON tipos_muestra(nombre);

ALTER TABLE tipos_muestra ENABLE ROW LEVEL SECURITY;
```

**Estructura:**
| Campo | Tipo | Restricciones |
|-------|------|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `nombre` | TEXT | NOT NULL, UNIQUE |
| `creado_en` | TIMESTAMP | DEFAULT now() |

**Ejemplo de datos:**
```json
{
  "id": "a47ac10b-58cc-4372-a567-0e02b2c3d480",
  "nombre": "Sangre",
  "creado_en": "2026-04-28T10:05:00Z"
}
```

---

### Tabla: pruebas (EXISTE)
```sql
CREATE TABLE pruebas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_prueba TEXT NOT NULL UNIQUE,
  unidad_medida TEXT NOT NULL,         -- ← Almacena el NOMBRE, no es FK
  tipo_muestra TEXT NOT NULL,          -- ← Almacena el NOMBRE, no es FK
  valor_referencia_min FLOAT,
  valor_referencia_max FLOAT,
  descripcion TEXT,
  precio_bs FLOAT,
  precio_usd FLOAT,
  grupo_id UUID REFERENCES grupos(id) ON DELETE SET NULL,
  creado_en TIMESTAMP DEFAULT now()
);
```

**Nota importante:** `unidad_medida` y `tipo_muestra` son campos TEXT que almacenan el NOMBRE de la unidad/tipo, NO foreign keys a las tablas catálogo.

---

## 6️⃣ FLUJO COMPLETO

### Diagrama de Flujo: Crear Nueva Prueba

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO ABRE PÁGINA /pruebas (Pruebas.jsx)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ useEffect carga:                                                │
│  1. loadPruebas() → GET /pruebas                               │
│  2. loadGrupos() → GET /grupos                                 │
│  3. loadUnidadesMedida() → GET /pruebas/unidades     ← AQUÍ   │
│  4. loadTiposMuestra() → GET /pruebas/tipos         ← AQUÍ   │
│  5. loadTasaCambio() → GET /api/financiero/tasa               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Selects se llenan con opciones del backend:                    │
│  - unidadesMedida.map() para llenar <option>                  │
│  - tiposMuestra.map() para llenar <option>                    │
│  - Incluyen opción "+ Agregar nueva..." en ambos              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO SELECCIONA "+ Agregar nueva unidad"                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ handleFormChange() detecta value === "__add_new_unidad__"      │
│ ↓                                                               │
│ Abre prompt() para que ingrese nombre (ej: "U/L")              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
         ┌─────────────────────┴─────────────────────┐
         │                                           │
    Usuario cancela                     Usuario OK con "U/L"
         │                                           │
         ↓                                           ↓
    Reset select                        api.createUnidadMedida("U/L")
                                                    ↓
                                        POST /pruebas/unidades
                                        Body: { "nombre": "U/L" }
                                                    ↓
                                        Backend: supabase.table(
                                          "unidades_medida"
                                        ).insert(...)
                                                    ↓
                                        201 Created
                                        Response: { id, nombre, creado_en }
                                                    ↓
                                        Frontend: loadUnidadesMedida()
                                        GET /pruebas/unidades
                                                    ↓
                                        Recarga lista, setUnidadesMedida()
                                                    ↓
                                        Select ahora muestra "U/L"
                                        formData.unidad_medida = "U/L"
```

---

## 7️⃣ CÓMO USAR ACTUALMENTE

### Crear una Prueba con Nueva Unidad

1. **Ir a `/pruebas`**
2. **Clic en "+ Agregar nueva prueba"**
3. **En el select "Unidad de medida":**
   - Seleccionar "+ Agregar nueva unidad"
   - Ingresar en prompt: `mg/mL`
   - ✅ La unidad se crea en BD y se selecciona automáticamente
4. **Completa otros campos:**
   - Nombre: "Glucosa"
   - Tipo de muestra: "Sangre" (o crear uno nuevo)
   - Valores de referencia: 70-100
   - Precio: 25000 BS
5. **Clic en "Guardar Prueba"**
   - Se crea en tabla `pruebas` con `unidad_medida='mg/mL'`

---

## 8️⃣ PROBLEMAS IDENTIFICADOS

### 🔴 Problema 1: Tablas No Existen
**Severidad:** CRÍTICA

**Síntoma:** El frontend intenta cargar unidades/tipos pero falla
```javascript
GET /pruebas/unidades → 404 Not Found o error de Supabase
GET /pruebas/tipos → 404 Not Found o error de Supabase
```

**Causa:** Las tablas `unidades_medida` y `tipos_muestra` **NO HAN SIDO CREADAS EN SUPABASE**

**Solución:** Ejecutar en Supabase SQL Editor:
```sql
-- COPIAR Y EJECUTAR EN SUPABASE CONSOLE
CREATE TABLE unidades_medida (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_unidades_medida_nombre ON unidades_medida(nombre);
ALTER TABLE unidades_medida ENABLE ROW LEVEL SECURITY;

CREATE TABLE tipos_muestra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_tipos_muestra_nombre ON tipos_muestra(nombre);
ALTER TABLE tipos_muestra ENABLE ROW LEVEL SECURITY;

-- OPCIONAL: Insertar valores iniciales
INSERT INTO unidades_medida (nombre) VALUES
('g/dL'),
('mg/dL'),
('U/L'),
('mmol/L'),
('mg/mL'),
('mcg/mL'),
('IU/mL');

INSERT INTO tipos_muestra (nombre) VALUES
('Sangre'),
('Orina'),
('Heces'),
('LCR'),
('Sinovia'),
('Saliva'),
('Semen');
```

---

### 🟡 Problema 2: No Hay Validación de Foreign Keys
**Severidad:** MEDIA

**Descripción:** 
- `unidad_medida` y `tipo_muestra` en tabla `pruebas` son TEXT, no UUID
- No hay constraint que valide que el nombre existe en las tablas catálogo
- Un usuario podría entrar un valor inválido manualmente (aunque la UI no lo permite)

**Recomendación futura:** Cambiar a arquitectura con foreign keys:
```sql
ALTER TABLE pruebas 
  ADD COLUMN unidad_medida_id UUID REFERENCES unidades_medida(id),
  ADD COLUMN tipo_muestra_id UUID REFERENCES tipos_muestra(id),
  DROP COLUMN unidad_medida,
  DROP COLUMN tipo_muestra;
```

---

### 🟡 Problema 3: No Hay Endpoint para Actualizar/Eliminar
**Severidad:** MEDIA

**Descripción:** Falta implementar:
- `PUT /pruebas/unidades/{id}` - editar nombre
- `DELETE /pruebas/unidades/{id}` - eliminar (con validación de uso)
- `PUT /pruebas/tipos/{id}` - editar nombre
- `DELETE /pruebas/tipos/{id}` - eliminar (con validación de uso)

---

## 9️⃣ RESUMEN DE ARCHIVOS INVOLUCRADOS

| Ubicación | Rol | Tipo |
|-----------|-----|------|
| [frontend/src/pages/Pruebas.jsx](frontend/src/pages/Pruebas.jsx) | UI para crear/listar pruebas + modal para nuevas unidades/tipos | React JSX |
| [frontend/src/services/api.js](frontend/src/services/api.js) | Funciones HTTP para llamar endpoints | JavaScript |
| [backend/app/routes/pruebas.py](backend/app/routes/pruebas.py) | 4 endpoints para CRUD de unidades y tipos | FastAPI |
| [backend/app/models/prueba_models.py](backend/app/models/prueba_models.py) | Validación de datos (unidad_medida y tipo_muestra obligatorios) | Pydantic |
| Supabase Console | Almacenamiento de catálogos (FALTA CREAR TABLAS) | SQL |

---

## 🔟 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear tabla `unidades_medida` en Supabase
- [ ] Crear tabla `tipos_muestra` en Supabase
- [ ] Insertar valores iniciales en ambas tablas
- [ ] Probar GET /pruebas/unidades (debería devolver lista)
- [ ] Probar GET /pruebas/tipos (debería devolver lista)
- [ ] Crear nueva prueba desde /pruebas
- [ ] Agregar nueva unidad desde el prompt
- [ ] Agregar nuevo tipo desde el prompt
- [ ] Verificar que se guardaron en BD
- [ ] Recargar página y ver que aparecen en selects

---

**Última actualización:** 28 de abril de 2026  
**Documento:** Exhaustivo y verificado en código fuente
