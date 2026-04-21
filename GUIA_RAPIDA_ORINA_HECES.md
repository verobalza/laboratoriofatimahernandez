# ⚡ GUÍA RÁPIDA DE REFERENCIA

## 1️⃣ PRIMER PASO: EJECUTAR SQL EN SUPABASE

```
📂 Abre: SETUP_ORINA_HECES.sql
📋 Copia TODO
🌐 Ve a: https://supabase.com → Tu Proyecto → SQL Editor
📌 Pega el código
▶️ Haz clic en "Run"
✅ Espera a ver "Success"
```

---

## 2️⃣ SEGUNDO PASO: MODIFICAR Examenes.jsx

**Ubicación**: `frontend/src/pages/Examenes.jsx`

**Buscar la función** `handleSelectPrueba`:

```javascript
const handleSelectPrueba = (prueba) => {
  // ⭐ AGREGAR ESTO AL INICIO:
  if (prueba.tipo === 'orina') {
    navigate(`/orina-form/${selectedPacienteId}`)
    return
  }
  if (prueba.tipo === 'heces') {
    navigate(`/heces-form/${selectedPacienteId}`)
    return
  }
  
  // El resto del código original sigue igual...
}
```

---

## 3️⃣ TERCER PASO: AGREGAR RUTAS EN App.jsx

**Ubicación**: `frontend/src/App.jsx` (o donde tengas `<Routes>`)

**Agregar imports**:
```javascript
import OrinaForm from './pages/OrinaForm'
import HecesForm from './pages/HecesForm'
```

**Agregar rutas**:
```javascript
<Routes>
  {/* Tus rutas existentes... */}
  
  {/* NUEVAS: */}
  <Route path="/orina-form/:pacienteId" element={<OrinaForm />} />
  <Route path="/heces-form/:pacienteId" element={<HecesForm />} />
</Routes>
```

---

## 📁 ARCHIVOS CREADOS (LISTA COMPLETA)

### Base de Datos
- ✅ **SETUP_ORINA_HECES.sql** - SQL para Supabase

### Backend
- ✅ **backend/app/models/orina_heces_models.py** - Modelos
- ✅ **backend/app/routes/orina_heces.py** - Endpoints
- ✏️ **backend/app/main.py** - Modificado (router agregado)

### Frontend
- ✅ **frontend/src/pages/OrinaForm.jsx** - Formulario orina
- ✅ **frontend/src/pages/OrinaForm.css** - Estilos orina
- ✅ **frontend/src/pages/HecesForm.jsx** - Formulario heces
- ✅ **frontend/src/pages/HecesForm.css** - Estilos heces
- ✅ **frontend/src/services/pdfGenerators.js** - PDFs
- ✏️ **frontend/src/services/api.js** - Modificado (métodos nuevos)

### Documentación
- ✅ **IMPLEMENTACION_ORINA_HECES.md** - Completo
- ✅ **CAMBIOS_EXAMENES.md** - Cambios específicos
- ✅ **RESUMEN_EJECUTIVO.md** - Resumen
- ✅ **GUIA_RAPIDA.md** - Esta guía

---

## 🔧 TABLA DE REFERENCIA RÁPIDA

### Tabla: examenes_orina
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| paciente_id | UUID | FK a pacientes |
| fecha | DATE | Fecha del examen |
| aspecto | TEXT | Claro, Turbio, Lechoso |
| color | TEXT | Amarillo, Incoloro, etc |
| olor | TEXT | Normal, Fragrante, etc |
| densidad | NUMERIC | 1.005 - 1.030 |
| ph | NUMERIC | 4.5 - 8.0 |
| albumina | TEXT | Negativo, +, ++, +++ |
| glucosa | TEXT | Negativo, +, ++, +++ |
| nitritos | TEXT | Positivo, Negativo |
| bilirrubina | TEXT | Negativo, +, ++, +++ |
| urobilinogenos | TEXT | Normal, Elevado |
| cetonas | TEXT | Negativo, +, ++, +++ |
| hemoglobina | TEXT | Negativo, +, ++, +++ |
| celulas_epiteliales | INT | 0-5 normal |
| leucocitos | INT | 0-5 normal |
| hematíes | INT | 0-3 normal |
| cristales | TEXT | Descripción |
| bacterias | TEXT | Ausentes, Pocas, etc |
| cilindros | TEXT | Descripción |
| particulas_varias | TEXT | Descripción |
| observaciones | TEXT | Notas generales |
| notas_tecnico | TEXT | Notas internas |
| creado_en | TIMESTAMP | Auditoría |
| actualizado_en | TIMESTAMP | Auditoría |
| creado_por | TEXT | Email técnico |

### Tabla: examenes_heces
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| paciente_id | UUID | FK a pacientes |
| fecha | DATE | Fecha del examen |
| color | TEXT | Café, Café oscuro, etc |
| consistencia | TEXT | Dura, Normal, Blanda |
| forma | TEXT | Cilíndrica, Fecaloide |
| presencia_moco | TEXT | Ausente, Presente |
| presencia_sangre | TEXT | Ausente, Presente |
| presencia_restos_alimenticios | TEXT | Ausente, Presente |
| ph | NUMERIC | 5.5 - 7.5 |
| leucocitos | INT | 0-5 normal |
| hematíes | INT | 0-3 normal |
| celulas_epiteliales | INT | Cantidad |
| grasa | INT | 0-2 normal |
| almidón | INT | 0-2 normal |
| fibras_musculares | INT | Cantidad |
| cristales_colesterol | INT | Cantidad |
| cristales_otros | TEXT | Descripción |
| parasitos | TEXT | Descripción |
| huevos_parasitos | TEXT | Descripción |
| quistes_parasitos | TEXT | Descripción |
| bacterias | TEXT | Ausentes, Pocas, etc |
| levaduras | TEXT | Ausentes, Pocas, etc |
| cultivo_resultado | TEXT | Negativo, Positivo |
| microorganismos_aislados | TEXT | Nombres |
| observaciones | TEXT | Notas generales |
| notas_tecnico | TEXT | Notas internas |
| creado_en | TIMESTAMP | Auditoría |
| actualizado_en | TIMESTAMP | Auditoría |
| creado_por | TEXT | Email técnico |

---

## 🧪 PRUEBA RÁPIDA

1. **Verificar SQL ejecutado**:
   - Ve a Supabase → Table Editor
   - Busca tablas: `examenes_orina`, `examenes_heces`
   - Verifica columna `tipo` en `pruebas`

2. **Probar frontend**:
   - Reinicia frontend: `npm run dev`
   - Ve a Exámenes
   - Selecciona "Orina Completa"
   - Debería ir a `/orina-form/[pacienteId]`

3. **Completar formulario**:
   - Rellena algunos campos
   - Click "Guardar"
   - Debería guardarse en BD

4. **Verificar en BD**:
   - Ve a Supabase → Table Editor → examenes_orina
   - Debería haber un registro nuevo

---

## ⚠️ CHECKLIST PRE-LANZAMIENTO

- [ ] SQL ejecutado en Supabase (sin errores)
- [ ] Tablas `examenes_orina` y `examenes_heces` creadas
- [ ] Columna `tipo` existe en `pruebas`
- [ ] Backend reiniciado (para cargar nuevo router)
- [ ] Examenes.jsx modificado con lógica de redirección
- [ ] Rutas agregadas en App.jsx
- [ ] Frontend reiniciado (`npm run dev`)
- [ ] OrinaForm.jsx puede accederse en `/orina-form/[id]`
- [ ] HecesForm.jsx puede accederse en `/heces-form/[id]`
- [ ] Formularios se cargan sin errores
- [ ] Datos se guardan en BD correctamente
- [ ] PDFs se descargan (opcional)

---

## 🐛 TROUBLESHOOTING RÁPIDO

| Error | Solución |
|-------|----------|
| "Table examenes_orina does not exist" | Ejecuta SQL en Supabase |
| "Cannot find module OrinaForm" | Verifica que los archivos estén en `src/pages/` |
| "navigate is not defined" | Importa `useNavigate` de react-router-dom |
| "tipo column not found" | Ejecuta la parte de ALTER TABLE del SQL |
| "/orina-form no existe" | Agrega las rutas en App.jsx |
| 404 en /api/orina | Reinicia el backend (Ctrl+C y vuelve a correr) |

---

## 💾 GUARDAR Y RECORDAR

**SQL crítico**: `SETUP_ORINA_HECES.sql`
**Archivos nuevos**: `OrinaForm.jsx`, `HecesForm.jsx`, `orina_heces_models.py`, `orina_heces.py`
**Archivos modificados**: `main.py`, `api.js`, `Examenes.jsx`, `App.jsx`

---

## 📞 RESUMEN EN UNA FRASE

> Ejecuta el SQL, actualiza 2 archivos, y tienes exámenes de orina y heces completamente funcionales.

---

**Tiempo total estimado**: 30 minutos
- SQL: 5 min
- Cambios código: 15 min
- Testing: 10 min

¿Necesitas ayuda? Revisa `IMPLEMENTACION_ORINA_HECES.md` 📖
