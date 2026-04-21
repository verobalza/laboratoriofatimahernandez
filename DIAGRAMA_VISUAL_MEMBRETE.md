# RESUMEN VISUAL: Membrete en PDFs de Examenes

## 🎨 ARQUITECTURA DE CARGA

```
┌─────────────────────────────────────────┐
│ Frontend/src/pages/Examenes.jsx         │
│ Función: handleGenerarPDF()             │
│ (Línea 441)                             │
└─────────────────────────┬───────────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │ Buscar Membrete     │
                │ (loadMembrete)      │
                │ Línea: 457-475      │
                └────────┬────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   /membrete.png   Membrete.png    /membrete.jpg
   (Público)      Empresa...       (Público)
                  (Público)
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ¿Encontrado?
                    /
                   / SÍ                NO \
                  /                        \
                 ▼                          ▼
         ┌──────────────┐          ┌──────────────┐
         │ Cargar Imagen│          │ ypos = 20    │
         │ (new Image)  │          │ Continuar    │
         │ Línea: 476   │          │ sin membrete │
         └──────┬───────┘          └──────────────┘
                │
                ▼
         ┌──────────────────┐
         │ Insertar en PDF  │
         │ doc.addImage()   │
         │ (0, 0, 200, 230) │
         │ Línea: 483-492   │
         └──────┬───────────┘
                │
                ▼
         ┌──────────────────┐
         │ ypos = 70        │
         │ Posicionar       │
         │ contenido        │
         └──────┬───────────┘
                │
                ▼
         Generar PDF completo
```

---

## 📐 DISPOSICIÓN EN LA PÁGINA

```
┌─────────────────────────────────────────────┐
│  PÁGINA A4 (210mm × 297mm)                  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │    MEMBRETE                         │   │
│  │    (200mm × 230mm)                  │   │
│  │    En posición: (0, 0)              │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                    ▲                        │
│                    │                        │
│                ypos = 230 (fin del membrete)│
│                    │                        │
│                    ▼                        │
│  ┌─────────────────────────────────────┐   │
│  │ Fecha: [fecha]              ypos=70 │   │
│  │                                     │   │
│  │ Paciente: Juan García               │   │
│  │           Cédula: 1234567           │   │
│  │                              ypos=80│   │
│  │                                     │   │
│  │ Edad: 35      Dir: Calle Principal  │   │
│  │                              ypos=90│   │
│  │                                     │   │
│  │     Pruebas realizadas y resultados │   │
│  │ ─────────────────────────────────── │   │
│  │                                     │   │
│  │ Glucosa ................... 95 mg/dL│   │
│  │ Colesterol ............... 200 mg/dL│   │
│  │ etc...                              │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 PARÁMETROS DE doc.addImage()

```javascript
doc.addImage(
  image,      // Objeto Image de JavaScript
  format,     // 'PNG' - Formato de la imagen
  x,          // 0 - Posición X (mm desde izquierda)
  y,          // 0 - Posición Y (mm desde arriba)
  width,      // 200 - Ancho de la imagen (mm)
  height      // 230 - Alto de la imagen (mm)
)

Ejemplo:
┌────────────────────────────────────┐
│ (0,0) ← Esquina superior izquierda │
│    ┌──────────────────────────┐    │
│    │                          │    │
│    │      MEMBRETE            │    │
│    │      200mm × 230mm       │    │
│    │                          │    │
│    │                          │    │
│    │                          │    │
│    │                          │    │
│    │                          │    │
│    └──────────────────────────┘    │
│      200mm →                       │
│      ↓ 230mm                       │
└────────────────────────────────────┘
```

---

## 🔄 FLUJO DE VARIABLES

```
ENTRADA (desde formulario)
  │
  ├─ selectedPaciente
  │  └─ nombre, apellido, cedula, edad, direccion
  │
  ├─ selectedDate
  │  └─ fecha (YYYY-MM-DD)
  │
  ├─ pruebasSeleccionadas
  │  └─ Array de objetos con nombre_prueba, grupo_id, etc
  │
  ├─ resultados
  │  └─ { [pruebaId]: valor, ... }
  │
  ├─ observaciones
  │  └─ { [pruebaId]: texto, ... }
  │
  └─ examenesEspeciales
     ├─ orina { enabled, data }
     └─ heces { enabled, data }
            │
            ▼
        FUNCIÓN handleGenerarPDF()
            │
            ├─ Crear jsPDF
            │  doc = new jsPDF()
            │
            ├─ Buscar membrete
            │  membreteSrc = await loadMembrete()
            │
            ├─ Insertar membrete
            │  doc.addImage(image, 'PNG', 0, 0, 200, 230)
            │
            ├─ Iniciar ypos
            │  let ypos = 70 (o 20 si sin membrete)
            │
            ├─ Agregar contenido
            │  doc.text(content, x, ypos)
            │  ypos += avance
            │
            ├─ Generar blob
            │  pdfBlob = doc.output('blob')
            │
            └─ Upload al backend
               formData → api.uploadPDF()
                            │
                            ▼
                    Backend recibe blob
                    └─ Sube a Supabase
                    └─ Registra en DB
                    
SALIDA
  ├─ PDF guardado en Supabase Storage
  ├─ Registro en tabla examenes_pdf
  └─ URL pública disponible
```

---

## 🌳 ESTRUCTURA DE BÚSQUEDA DE MEMBRETE

```javascript
loadMembrete()
    │
    ├─ Intento 1: '/membrete.png'
    │  ├─ ¿Existe?
    │  │  ├─ SÍ → Retorna '/membrete.png' ✓
    │  │  └─ NO ↓
    │  └─ Catch: continúa
    │
    ├─ Intento 2: '/Membrete Empresa Geométrico Azul.png'
    │  ├─ ¿Existe?
    │  │  ├─ SÍ → Retorna path ✓
    │  │  └─ NO ↓
    │  └─ Catch: continúa
    │
    ├─ Intento 3: '/membrete.jpg'
    │  ├─ ¿Existe?
    │  │  ├─ SÍ → Retorna path ✓
    │  │  └─ NO ↓
    │  └─ Catch: continúa
    │
    ├─ Intento 4: '/membrete.jpeg'
    │  ├─ ¿Existe?
    │  │  ├─ SÍ → Retorna path ✓
    │  │  └─ NO ↓
    │  └─ Catch: continúa
    │
    └─ Sin más intentos
       └─ Retorna: null (no encontrado)
```

---

## 📊 COMPARACIÓN: Frontend vs Backend

```
╔════════════════════════════════════════════════════════════╗
║                  FRONTEND (Examenes)                       ║
╠════════════════════════════════════════════════════════════╣
║ Ubicación: frontend/src/pages/Examenes.jsx                ║
║ Función: handleGenerarPDF()                               ║
║ Librería: jsPDF                                            ║
║ Búsqueda: Paths públicos (/membrete.png)                  ║
║ Inserción: doc.addImage()                                 ║
║ Tamaño: 200 × 230 mm                                      ║
║ Upload: FormData → Backend                                ║
║ Estado: ✓ FUNCIONA PERFECTAMENTE                          ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════╗
║                 BACKEND (Facturación)                      ║
╠════════════════════════════════════════════════════════════╣
║ Ubicación: backend/app/routes/facturacion.py              ║
║ Función: _build_pdf_factura()                             ║
║ Librería: ReportLab                                       ║
║ Búsqueda: Paths del sistema (Path.__file__.parent...)     ║
║ Inserción: Image() class                                  ║
║ Tamaño: width=doc.width (ancho completo)                  ║
║ Generación: Directa en backend                            ║
║ Estado: ⚠ FALTA IMPLEMENTAR                               ║
╚════════════════════════════════════════════════════════════╝
```

---

## ⚡ PUNTOS CRÍTICOS

```
1. UBICACIÓN DEL ARCHIVO
   ✓ Debe estar en: frontend/public/membrete.png
   ✗ NO: backend/static/membrete.png (no es públicamente accesible)

2. VARIANTES DE NOMBRE
   ✓ Intenta 4 variantes automáticamente
   ✓ Continúa sin membrete si no encuentra (no falla)
   ✓ Primer match que funciona se usa

3. POSICIÓN (0, 0)
   ✓ Esquina superior izquierda
   ✓ Importante: ypos inicia en 70 (no 0, no 50)
   ✗ Incorrecto: ypos = 0 → contenido se superpone

4. TAMAÑO 200 × 230
   ✓ 200mm ≈ 95% del ancho A4 (210mm)
   ✓ 230mm ≈ 77% del alto de página
   ✓ Deja espacio para contenido sin solaparse

5. CROSSORIGIN
   ✓ img.crossOrigin = 'anonymous'
   ✓ Permite cargar desde diferentes orígenes

6. PROMISE WRAPPER
   ✓ await new Promise(...) espera carga de imagen
   ✓ Garantiza que la imagen esté lista antes de usarla
   ✗ Sin esto: la imagen podría no estar cargada
```

---

## 🎯 CÓMO APLICAR EN FACTURACIÓN

```
Paso 1: COPIAR función loadMembrete() de Examenes.jsx
        ↓
Paso 2: ADAPTAR a HTML5 Image (si está en frontend)
        O a requests.get() (si está en backend)
        ↓
Paso 3: INSERTAR imagen con addImage()
        doc.addImage(image, 'PNG', 0, 0, 200, 230)
        ↓
Paso 4: POSICIONAR contenido
        ypos = membrete ? 70 : 20
        ↓
Paso 5: AJUSTAR todas las coordenadas Y
        Todas las posiciones Y deben sumar al ypos base
        ↓
Paso 6: PROBAR con membrete existente
        Verificar que el tamaño sea correcto
        ↓
Paso 7: PROBAR sin membrete
        Verificar que continúe funcionando
```

---

## 📈 TAMAÑOS RELATIVOS

```
jsPDF A4 estándar: 210mm × 297mm

Membrete actual: 200mm × 230mm
                ↓
Porcentaje de ancho:  200/210 = 95.2%
Porcentaje de alto:   230/297 = 77.4%

Área ocupada por membrete:
┌──────────────────────────────────────┐
│████████████████████████████████████  │  95.2% ancho
│████████████████████████████████████  │
│████████████████████████████████████  │
│████████████████████████████████████  │
│████████████████████████████████████  │
│████████████████████████████████████  │
│████████████████████████████████████  │
│████████████████████████████████████  │
│████████████████████████████████████  │
│████████████████████████████████████  │  77.4% alto
│████████████████████████████████████  │
│████████████████████████████████████  │
└──────────────────────────────────────┘
     Espacio restante:                    
     - Ancho: 10mm (márgenes)
     - Alto: ~67mm (contenido)
```

---

## 🔒 MANEJO DE ERRORES

```
try {
  await loadMembrete()  ← Busca
    │
    ├─ Encontrado → Retorna path
    └─ NO encontrado → Retorna null
      │
      ▼
  if (membreteSrc) {
    ← Cargar e insertar
    doc.addImage(...)
    ypos = 70
  } else {
    ← Continuar sin membrete
    console.warn('No se encontró...')
    ypos = 20
  }
} catch (error) {
  ← Error general
  setMensaje({ type: 'error', ... })
}
```

---

## 📝 LOGGING Y DEBUG

```javascript
// En consola del navegador:

if (membreteSrc) {
  console.log('✓ Membrete cargado desde:', membreteSrc)
  // Salida: ✓ Membrete cargado desde: /membrete.png
} else {
  console.warn('✗ Membrete no encontrado')
  // Salida: ✗ Membrete no encontrado
}

if (ypos > 270) {
  console.warn('PDF muy largo, agregando página')
  doc.addPage()
  // Salida: PDF muy largo, agregando página
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Archivo membrete está en `frontend/public/`
- [ ] Nombre del archivo es una variante de `membrete.png`
- [ ] Función `loadMembrete()` implementada
- [ ] `doc.addImage(image, 'PNG', 0, 0, 200, 230)` correctamente
- [ ] `ypos = 70` para inicio de contenido
- [ ] Fallback a `ypos = 20` si sin membrete
- [ ] Todos los text() ajustan al nuevo ypos
- [ ] Manejo de saltos de página (`ypos > 270`)
- [ ] Prueba sin membrete funciona
- [ ] Prueba con membrete funciona
- [ ] Tamaño visual es correcto (no pixelado)
- [ ] Contenido no se superpone
- [ ] Upload al backend funciona

---

**Documento de referencia visual**  
**Generado:** 21 de abril de 2026  
**Para:** Equipo de Desarrollo - Facturación
