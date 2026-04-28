# 🎯 Plan Rápido: Activar Unidades y Tipos de Muestra

## ⏱️ Tiempo Total: 5 minutos

---

## 📌 EL PROBLEMA (en 30 segundos)

```
Tenías: Botones "Agregar nueva unidad" y "Agregar nuevo tipo"
Pero: Las tablas unidades_medida y tipos_muestra NO EXISTEN en Supabase
Resultado: Los botones no guardaban nada
```

---

## ✅ LA SOLUCIÓN (también rápida)

He creado un script SQL que:
1. Crea las 2 tablas
2. Configura seguridad
3. Carga datos iniciales

---

## 🚀 PASOS EXACTOS

### 1️⃣ Abre Supabase (1 minuto)

```
https://app.supabase.com 
→ Tu Proyecto 
→ SQL Editor (menú izquierdo)
→ New Query
```

### 2️⃣ Copia y Ejecuta el Script (2 minutos)

1. Abre: `SETUP_UNIDADES_TIPOS_MUESTRA.sql`
2. **Copia DESDE la línea 1 HASTA justo antes de `-- SCRIPT DE LIMPIEZA`**
3. Pega en Supabase SQL Editor
4. Haz clic en **Run** (botón azul)
5. **Espera el checkmark verde ✅**

### 3️⃣ Verifica en Supabase (1 minuto)

En **Table Editor** (menú izquierdo):
- [ ] Ves tabla `unidades_medida`
- [ ] Ves tabla `tipos_muestra`
- [ ] Ambas tienen datos iniciales

### 4️⃣ Verifica en tu App (1 minuto)

1. Abre tu app frontend
2. Ve a **Pruebas → Crear Nueva Prueba**
3. En el selector **"Unidad de Medida"** deberías ver:
   - g/dL
   - mg/dL
   - U/L
   - mmol/L
   - ... (más opciones)
4. En el selector **"Tipo de Muestra"** deberías ver:
   - Sangre
   - Orina
   - Heces
   - LCR
   - ... (más opciones)

5. **Prueba esto:** Selecciona "+ Agregar nueva unidad"
   - Te pedirá un nombre (ej: "nmol/L")
   - Ingrésalo
   - **Debe guardarse y aparecer inmediatamente en la lista**

---

## 📋 Checklist Rápido

- [ ] Ejecuté el script SQL en Supabase
- [ ] Veo las tablas en Table Editor
- [ ] Los datos iniciales están cargados
- [ ] Veo las opciones en Pruebas
- [ ] Puedo crear una nueva unidad
- [ ] Puedo crear un nuevo tipo
- [ ] Ambos se guardan y aparecen en los selectores

---

## 🐛 Si No Funciona

### "Relation 'unidades_medida' does not exist"
→ No ejecutaste el script SQL (repite pasos 1-2)

### "Duplicate key value violates unique constraint"
→ Intentaste crear una unidad que ya existe, selecciona la existente

### Los selectores están vacíos
→ Abre **F12 (DevTools)** → Console → Verifica que no haya errores rojo

### Creé una unidad pero no aparece
→ Recarga la página (Ctrl+R)

---

## 📂 Archivos Creados

```
laboratorio/
├── SETUP_UNIDADES_TIPOS_MUESTRA.sql      ← Ejecuta esto en Supabase
├── GUIA_UNIDADES_TIPOS_MUESTRA.md         ← Guía detallada (opcional)
└── PLAN_RAPIDO_UNIDADES_TIPOS.md          ← Este archivo
```

---

## 💡 Qué Sucede Internamente

```
1. Usuario abre Pruebas
   ↓
2. Frontend carga unidades y tipos (automático)
   ↓
3. User selecciona "+ Agregar nueva unidad"
   ↓
4. Prompt pide el nombre
   ↓
5. API POST /pruebas/unidades → Supabase
   ↓
6. Se inserta en tabla unidades_medida
   ↓
7. Frontend recarga la lista
   ↓
8. Nueva opción aparece en selector ✨
```

---

## ❓ Preguntas Frecuentes

**¿Qué si borro una unidad accidentalmente?**
- Ejecuta el script de limpieza y luego el script principal de nuevo

**¿Pueden los usuarios crear unidades?**
- Sí, si están autenticados (configurado en RLS)

**¿Qué unidades inicial cargo?**
- Las 13 más comunes en laboratorio: g/dL, mg/dL, U/L, mmol/L, etc.
- Puedes agregar más después

**¿Qué si necesito editar una unidad?**
- No está implementado aún, pero puedes agregar la funcionalidad después
- Por ahora: delete + create nueva

---

## 🎉 Eso es Todo!

Una vez ejecutes el script:
- ✅ Los botones funcionarán
- ✅ Los datos se guardarán en Supabase
- ✅ Las opciones serán seleccionables
- ✅ Los usuarios pueden agregar más

**Tiempo estimado:** 5 minutos
