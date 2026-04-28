# 📋 Guía Completa: Unidades de Medida y Tipos de Muestra

## 🔍 Resumen del Problema

Actualmente, los botones **"+ Agregar nueva unidad"** y **"+ Agregar nuevo tipo"** en la página de Pruebas no estaban guardando datos porque:

- ✅ El código frontend está correctamente implementado
- ✅ El código backend está correctamente implementado
- ❌ **Las tablas `unidades_medida` y `tipos_muestra` NO EXISTEN en Supabase**

---

## ✨ Solución

He creado un script SQL que:
1. Crea las tablas `unidades_medida` y `tipos_muestra`
2. Configura índices y restricciones UNIQUE
3. Habilita Row Level Security (RLS)
4. Carga datos iniciales (opcional)

---

## 🚀 Pasos para Implementar

### Paso 1: Abrir Supabase Console

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. En el menú izquierdo, ve a **SQL Editor**

### Paso 2: Crear Nueva Consulta

1. Haz clic en **New Query** (Botón azul)
2. Se abrirá una pestaña en blanco

### Paso 3: Ejecutar el Script

1. Abre el archivo `SETUP_UNIDADES_TIPOS_MUESTRA.sql` en tu editor
2. **Copia TODO el contenido** (hasta antes de los comentarios de limpieza)
3. Pégalo en el editor de Supabase
4. Haz clic en **Run** (Botón azul superior)

✅ Espera a ver el mensaje de éxito

---

## 📊 Estructura de las Tablas

### Tabla: `unidades_medida`
```sql
id         UUID (PK)              -- Identificador único
nombre     TEXT UNIQUE NOT NULL   -- Nombre de la unidad (ej: mg/dL)
creado_en  TIMESTAMP              -- Fecha de creación
actualizado_en TIMESTAMP          -- Fecha de actualización
```

**Ejemplos de valores iniciales:**
- g/dL
- mg/dL
- U/L
- mmol/L
- µIU/mL

### Tabla: `tipos_muestra`
```sql
id         UUID (PK)              -- Identificador único
nombre     TEXT UNIQUE NOT NULL   -- Nombre del tipo (ej: Sangre)
creado_en  TIMESTAMP              -- Fecha de creación
actualizado_en TIMESTAMP          -- Fecha de actualización
```

**Ejemplos de valores iniciales:**
- Sangre
- Orina
- Heces
- LCR
- Saliva

---

## 🔒 Seguridad (RLS Habilitado)

Las políticas están configuradas para:
- **Lectura (SELECT):** Pública (todos pueden ver)
- **Crear (INSERT):** Solo usuarios autenticados
- **Actualizar (UPDATE):** Solo usuarios autenticados
- **Eliminar (DELETE):** Solo usuarios autenticados

---

## 🧪 Verificación

Después de ejecutar el script, verifica que todo funciona:

### En Supabase Console

1. Ve a **Table Editor**
2. Deberías ver las tablas:
   - `unidades_medida`
   - `tipos_muestra`
3. Verifica que tienen datos iniciales

### En la Aplicación

1. Ve a **Pruebas → Crear Nueva Prueba**
2. En los selectores encontrarás:
   - "Unidad de Medida" con opciones: g/dL, mg/dL, U/L, etc.
   - "Tipo de Muestra" con opciones: Sangre, Orina, Heces, etc.
3. Prueba a **"+ Agregar nueva unidad"**:
   - Ingresa un nombre (ej: "mmol/L")
   - Debería aparecer inmediatamente en el selector
   - Debería guardarse en Supabase

---

## 📝 Flujo Completo de Uso

```
Usuario abre Pruebas/Nueva Prueba
    ↓
Frontend carga unidades y tipos: getUnidadesMedida() / getTiposMuestra()
    ↓
    GET /pruebas/unidades  →  Lee de unidades_medida
    GET /pruebas/tipos     →  Lee de tipos_muestra
    ↓
Selectores se llenan con opciones
    ↓
Usuario selecciona "+ Agregar nueva unidad"
    ↓
    Prompt pide nombre (ej: "U/L")
    ↓
Frontend llama: api.createUnidadMedida("U/L")
    ↓
    POST /pruebas/unidades { "nombre": "U/L" }
    ↓
Backend inserta en Supabase: unidades_medida
    ↓
Respuesta: { "id": "uuid...", "nombre": "U/L", "creado_en": "..." }
    ↓
Frontend recarga: getUnidadesMedida()
    ↓
Nueva unidad aparece en selector y está seleccionada
```

---

## 🔧 Troubleshooting

### Error: "relation 'unidades_medida' does not exist"
- ✓ Ejecuta el script SQL en Supabase Console

### Error: "duplicate key value violates unique constraint"
- ✓ Significa que intentaste crear una unidad que ya existe
- ✓ Selecciona la existente en lugar de crear una nueva

### Las opciones no aparecen en el selector
- ✓ Abre la consola del navegador (F12)
- ✓ Verifica que `getTiposMuestra()` y `getUnidadesMedida()` responden correctamente
- ✓ Comprueba que el servidor backend está corriendo

### Las opciones no se guardan después de crearlas
- ✓ Verifica que el token de autenticación esté presente
- ✓ Comprueba los logs del backend para errores

---

## 📂 Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `SETUP_UNIDADES_TIPOS_MUESTRA.sql` | Script para crear tablas en Supabase |
| `frontend/src/pages/Pruebas.jsx` | Interfaz de usuario |
| `frontend/src/services/api.js` | Funciones para comunicarse con backend |
| `backend/app/routes/pruebas.py` | Endpoints de unidades y tipos |

---

## ✅ Checklist Final

- [ ] Ejecuté el script SQL en Supabase Console
- [ ] Las tablas aparecen en Table Editor
- [ ] Los datos iniciales se cargaron
- [ ] Puedo ver las opciones en el selector "Unidad de Medida"
- [ ] Puedo ver las opciones en el selector "Tipo de Muestra"
- [ ] Puedo agregar una nueva unidad y se guarda
- [ ] Puedo agregar un nuevo tipo y se guarda
- [ ] La nueva unidad/tipo aparece inmediatamente en el selector

---

## 🆘 Si Necesitas Revertir

En Supabase SQL Editor, ejecuta:

```sql
DROP TABLE IF EXISTS public.tipos_muestra CASCADE;
DROP TABLE IF EXISTS public.unidades_medida CASCADE;
```

Luego vuelve a ejecutar el script `SETUP_UNIDADES_TIPOS_MUESTRA.sql`.
