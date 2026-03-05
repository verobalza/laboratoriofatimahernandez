# 📖 GUÍA RÁPIDA: Página de Exámenes - Paso a Paso

## ⏱️ Tiempo total: ~10 minutos

---

## PASO 1: Crear tablas en Supabase (2 min)

1. Abre tu proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** (parte izquierda)
3. Copia y pega esto:

```sql
-- Tabla de pruebas (catálogo)
CREATE TABLE pruebas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_prueba TEXT NOT NULL UNIQUE,
  unidad_medida TEXT NOT NULL,
  tipo_muestra TEXT NOT NULL,
  valor_referencia_min FLOAT,
  valor_referencia_max FLOAT,
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pruebas_nombre ON pruebas(nombre_prueba);
ALTER TABLE pruebas ENABLE ROW LEVEL SECURITY;

-- Tabla de exámenes (resultados)
CREATE TABLE examenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  prueba_id UUID REFERENCES pruebas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  resultado TEXT,
  observaciones TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_examenes_paciente ON examenes(paciente_id);
CREATE INDEX idx_examenes_prueba ON examenes(prueba_id);
CREATE INDEX idx_examenes_fecha ON examenes(fecha);
ALTER TABLE examenes ENABLE ROW LEVEL SECURITY;

-- Insertar pruebas de ejemplo
INSERT INTO pruebas (nombre_prueba, unidad_medida, tipo_muestra, valor_referencia_min, valor_referencia_max) VALUES
('Hemoglobina', 'g/dL', 'Sangre', 12.0, 17.5),
('Hematocrito', '%', 'Sangre', 36.0, 46.0),
('Glucosa', 'mg/dL', 'Sangre en ayunas', 70, 100),
('Colesterol Total', 'mg/dL', 'Sangre', 0, 200),
('LDL Colesterol', 'mg/dL', 'Sangre', 0, 130),
('HDL Colesterol', 'mg/dL', 'Sangre', 40, 999),
('Triglicéridos', 'mg/dL', 'Sangre', 0, 150),
('Creatinina', 'mg/dL', 'Sangre', 0.6, 1.2),
('BUN (Nitrógeno Ureico)', 'mg/dL', 'Sangre', 7, 20),
('ALT (TGP)', 'U/L', 'Sangre', 0, 40),
('AST (TGO)', 'U/L', 'Sangre', 0, 35);
```

4. Click en **"Run"** (botón azul arriba)
5. Espera que se ejecute ✅

---

## PASO 2: Verificar archivos del proyecto (1 min)

✅ Archivos **ya creados/actualizados** por el sistema:

### Backend
- `backend/app/routes/examenes.py` - Router con todos los endpoints
- `backend/app/models/examen_models.py` - Modelos Pydantic
- `backend/app/models/prueba_models.py` - Modelos de pruebas

### Frontend  
- `frontend/src/pages/Examenes.jsx` - Página completa
- `frontend/src/pages/Examenes.css` - Estilos
- `frontend/src/services/api.js` - Métodos API (actualizados)

### Documentación
- `EXAMENES_IMPLEMENTACION.md` - Guía técnica completa
- `EXAMENES_VISUAL.md` - Flujos visuales

---

## PASO 3: Iniciar servidor backend (2 min)

```bash
cd backend

# Activar entorno
# En Windows:
.venv\Scripts\activate

# En Mac/Linux:
source .venv/bin/activate

# Instalar dependencias (si es primera vez)
pip install -r requirements.txt

# Iniciar servidor
uvicorn app.main:app --reload
```

**Deberías ver:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

✅ Backend listo en `http://localhost:8000`

---

## PASO 4: Iniciar servidor frontend (2 min)

En **otra terminal** (mantén el backend corriendo):

```bash
cd frontend

# Instalar dependencias (si es primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Deberías ver:**
```
VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

✅ Frontend listo en `http://localhost:5173`

---

## PASO 5: Probar la página (3 min)

1. Abre tu navegador: `http://localhost:5173`

2. Navega a **Exámenes** (menú hamburguesa o URL `/examenes`)

3. **Prueba el flujo:**

   **a) Buscar paciente**
   - Escribe un nombre de paciente existente
   - Ej: "Juan" (si existe paciente registrado)
   - Click en el resultado
   
   **b) Seleccionar pruebas**
   - Click en "Seleccionar Pruebas"
   - Marca 3-4 checkboxes (ej: Hemoglobina, Glucosa, Colesterol)
   - Click "Aceptar (3)"
   
   **c) Ingresar resultados**
   - Llena los campos:
     - Hemoglobina: `14.2`
     - Glucosa: `95`
     - Colesterol: `180`
   - Agrega observaciones opcionales
   
   **d) Guardar**
   - Click en "💾 Guardar Examen"
   - Deberías ver: "✅ Exámenes guardados correctamente"

4. **Verificar en Supabase:**
   - Abre Supabase → Table Editor
   - Busca tabla `examenes`
   - Deberías ver los registros que creaste

✅ ¡Funciona!

---

## PASO 6: Próximos pasos opcionales (futuros)

### Para mejorar:
- [ ] Descomentar generador de PDF (usar jsPDF)
- [ ] Integrar With WhatsApp (con Twilio)
- [ ] Agregar búsqueda de exámenes históricos
- [ ] Mostrar gráficos de valores
- [ ] Validar si resultado está en rango

---

## 🚨 Si algo no funciona

### Error: "No se pueden cargar las pruebas"
**Solución:**
- Verifica que Supabase esté conectado
- Abre browser DevTools (F12)
- Ve a Network tab
- Busca GET `/pruebas`
- ¿Qué error devuelve?

### Error: "paciente no encontrado"
**Solución:**
- Asegúrate de tener pacientes registrados en la BD
- Primero ve a "Registro pacientes" y crea algunos

### Estilos raros/no carga CSS
**Solución:**
- Limpia caché: `Ctrl+Shift+R`
- Reinicia servidor frontend: `npm run dev`

### Las pruebas no guardan
**Solución:**
```bash
# Abre consola del navegador (F12)
# Copia el error
# Verifica que:
# 1. Backend está corriendo (http://localhost:8000)
# 2. Archivo .env del backend tiene SUPABASE_* correctos
# 3. Tabla examenes existe en Supabase
```

---

## 📊 Datos de prueba para copiar/pegar

Si necesitas crear más pacientes para probar, usa esto (en Supabase SQL):

```sql
INSERT INTO pacientes (nombre, apellido, edad, telefono, direccion, sexo) VALUES
('Juan', 'García', 45, '555-1234', 'Calle Principal 123', 'M'),
('María', 'López', 32, '555-5678', 'Avenida Central 456', 'F'),
('Carlos', 'Rodríguez', 55, '555-9012', 'Calle Secundaria 789', 'M'),
('Ana', 'Martínez', 28, '555-3456', 'Avenida Norte 234', 'F');
```

---

## 🎯 Checklist de validación

Antes de usar en producción:

- [ ] Backend responde en `http://localhost:8000/examenes`
- [ ] Frontend muestra lista de pruebas sin errores
- [ ] Puedo buscar y seleccionar un paciente
- [ ] Puedo seleccionar pruebas (checkboxes)
- [ ] Puedo ingresar resultados
- [ ] El botón "Guardar" crea registros en BD
- [ ] Los datos aparecen en Supabase (tabla `examenes`)
- [ ] El contador de exámenes se actualiza
- [ ] Puedo cambiar la fecha

---

## 📞 Acceso rápido a URLs

```
Frontend:     http://localhost:5173/examenes
Backend API:  http://localhost:8000

Documentación interactiva:
Swagger:      http://localhost:8000/docs
ReDoc:        http://localhost:8000/redoc

Supabase:     https://supabase.com
  → Tabla examenes
  → Tabla pruebas
  → Tabla pacientes
```

---

## 🎓 Recursos

Documentos detallados en el proyecto:

1. **EXAMENES_IMPLEMENTACION.md** - Documentación técnica completa
2. **EXAMENES_VISUAL.md** - Flujos visuales y mockups
3. **SETUP_SUPABASE.md** - Setup de base de datos
4. **backend/README.md** - API endpoints

---

**¡Listo! Ahora puedes empezar a registrar exámenes.** ✨

Cualquier duda, revisa los archivos de documentación.
