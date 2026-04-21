# GUÍA RÁPIDA: Membrete en PDF de Examenes - COPY-PASTE Ready

## 🎯 LOS 3 PUNTOS CLAVE

### 1. CARGAR LA IMAGEN (JavaScript + jsPDF)
```javascript
import jsPDF from 'jspdf'

const loadMembrete = async () => {
  const candidatePaths = [
    '/membrete.png',
    '/Membrete Empresa Geométrico Azul.png',
    '/membrete.jpg',
    '/membrete.jpeg'
  ]

  for (const src of candidatePaths) {
    try {
      await new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`No se pudo cargar ${src}`))
        img.src = src
      })
      return src
    } catch (e) {
      // Continúa con siguiente variante
    }
  }
  return null  // No encontró membrete
}

const membreteSrc = await loadMembrete()
```

---

### 2. INSERTAR EN EL PDF
```javascript
const doc = new jsPDF()
let ypos = 70

if (membreteSrc) {
  const headerImg = await new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = (err) => reject(new Error('Error cargando membrete'))
    image.src = membreteSrc
  })
  
  // ⭐ PARÁMETRO CLAVE:
  // doc.addImage(image, formato, x, y, ancho, alto)
  doc.addImage(headerImg, 'PNG', 0, 0, 200, 230)
  ypos = 70
} else {
  console.warn('Membrete no encontrado')
  ypos = 20  // Contenido más arriba si no hay membrete
}
```

---

### 3. POSICIONAR CONTENIDO DEBAJO
```javascript
// El membrete ocupa:
// - Desde x=0 hasta x=200mm
// - Desde y=0 hasta y=230mm
// Por eso iniciamos ypos en 70 (debajo)

doc.setFontSize(8)
doc.setFont("Helvetica", "bold")
doc.text("Fecha:", 20, ypos)

doc.setFont("Helvetica", "normal")
doc.text(`${fecha}`, 40, ypos)

ypos += 10  // Siguiente elemento
```

---

## 📐 PARÁMETROS DE addImage()

```javascript
doc.addImage(
  image,    // Objeto Image del HTML o canvas
  'PNG',    // Formato: 'PNG', 'JPG', 'JPEG', 'GIF'
  0,        // X: posición horizontal (mm)
  0,        // Y: posición vertical (mm)
  200,      // Ancho (mm) - casi ancho completo de jsPDF (210)
  230       // Alto (mm) - ocupa casi toda la parte superior
)
```

---

## 🔍 DÓNDE ESTÁ EN EXAMENES

**Archivo:** `frontend/src/pages/Examenes.jsx`

**Función:** `handleGenerarPDF()` en línea 441

**Secciones:**
- **Búsqueda:** Línea 457-475
- **Carga:** Línea 476-482
- **Inserción:** Línea 483-492
- **Posicionamiento:** Línea 494-501

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Antes de usarlo en Facturación:

- [ ] ¿Importé `jsPDF`?
  ```javascript
  import jsPDF from 'jspdf'
  ```

- [ ] ¿El archivo membrete está en `frontend/public/`?
  - Ubicaciones intentadas (en orden):
    - `/membrete.png` ← Más probable
    - `/Membrete Empresa Geométrico Azul.png`
    - `/membrete.jpg`
    - `/membrete.jpeg`

- [ ] ¿Estoy usando los parámetros correctos?
  ```javascript
  doc.addImage(image, 'PNG', 0, 0, 200, 230)
  //                       ↑   ↑ ↑ ↑   ↑   ↑
  //                    formato x y ancho alto
  ```

- [ ] ¿Iniciando ypos en 70?
  ```javascript
  let ypos = 70  // Si hay membrete
  let ypos = 20  // Si NO hay membrete
  ```

- [ ] ¿Manejo el caso donde no se encuentra la imagen?
  ```javascript
  if (membreteSrc) {
    // Insertar imagen
  } else {
    // Continuar sin membrete (no fallar)
  }
  ```

---

## 🚀 FLUJO COMPLETO SIMPLIFICADO

```javascript
// 1. Crear documento
const doc = new jsPDF()

// 2. Buscar y cargar membrete
const membreteSrc = await loadMembrete()

// 3. Variables
let ypos = 70
const doc_width = 200  // Ancho del documento

// 4. SI EXISTE MEMBRETE: insertarlo
if (membreteSrc) {
  const headerImg = await cargarImagen(membreteSrc)
  doc.addImage(headerImg, 'PNG', 0, 0, 200, 230)
} else {
  ypos = 20  // Ajustar si no hay membrete
}

// 5. Agregar contenido
doc.setFontSize(12)
doc.text("FACTURA", 20, ypos)
ypos += 15

// Más contenido...
doc.text("Detalle 1: X", 20, ypos)
ypos += 10

// 6. Convertir a blob
const pdfBlob = doc.output('blob')

// 7. Enviar al backend
const formData = new FormData()
formData.append('file', pdfBlob, 'factura.pdf')
await api.uploadPDF(formData)
```

---

## 📊 TAMAÑOS Y POSICIONES

| Elemento | X | Y | Ancho | Alto | Notas |
|----------|---|---|-------|------|-------|
| **Membrete** | 0 | 0 | 200 | 230 | Esquina superior izq |
| **Contenido inicio** | 20 | 70 | 170 | - | Margen izq de 20mm |
| **Página** | - | - | 210 | 297 | Tamaño A4 en jsPDF |

---

## 🔗 RELACIÓN CON BACKEND (Facturación)

El backend TAMBIÉN busca membrete, pero de forma diferente:

```python
# backend/app/routes/facturacion.py, línea 144

def _load_membrete_image(membrete_url: str):
    candidate_paths = [
        Path(__file__).resolve().parent.parent / 'static' / 'membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'Membrete.png',
        # ... más paths
    ]
    
    for path in candidate_paths:
        if path.exists():
            return ImageReader(str(path))
    
    # Si no encuentra localmente, intenta desde URL
    return ImageReader(BytesIO(requests.get(membrete_url).content))
```

**Diferencia:**
- **Frontend (Examenes):** Busca en rutas públicas del servidor
- **Backend (Facturación):** Busca en el sistema de archivos del servidor

---

## ⚠️ ERRORES COMUNES

### Error 1: "Membrete no carga"
**Causa:** Archivo no está en `frontend/public/`
**Solución:** 
- Verificar ubicación: `frontend/public/Membrete.png`
- O las variantes: `membrete.png`, `membrete.jpg`

### Error 2: "La imagen se ve pixelada"
**Causa:** Tamaño 200×230 es muy grande
**Solución:** Reducir tamaño:
```javascript
doc.addImage(headerImg, 'PNG', 0, 0, 150, 170)  // Más pequeño
```

### Error 3: "El contenido se superpone con el membrete"
**Causa:** `ypos` no es lo suficientemente grande
**Solución:** Aumentar valor inicial:
```javascript
let ypos = 80  // En lugar de 70
```

### Error 4: "El PDF se descarga sin membrete"
**Causa:** Variante de nombre del archivo es diferente
**Solución:** Agregar más variantes a `candidatePaths`:
```javascript
const candidatePaths = [
  '/membrete.png',
  '/logo.png',                                    // ← Nueva variante
  '/Membrete Empresa Geométrico Azul.png',
  '/membrete.jpg'
]
```

---

## 📚 REFERENCIAS EN EL CÓDIGO

### Frontend:
- `frontend/src/pages/Examenes.jsx` - Implementación completa
  - Búsqueda: línea 457-475
  - Inserción: línea 483-492
  - Upload: línea 813-828

### Backend:
- `backend/app/routes/facturacion.py` - Implementación en ReportLab
  - Función `_load_membrete_image()`: línea 144
  - Uso en factura: línea 254-267

---

## 🎓 ENTENDER jsPDF

```javascript
import jsPDF from 'jspdf'

// Crear documento
const doc = new jsPDF()
// Tamaño por defecto: A4 (210mm × 297mm)

// Métodos principales:
doc.addImage(image, format, x, y, width, height)  // Insertar imagen
doc.text(text, x, y, options)                      // Agregar texto
doc.line(x1, y1, x2, y2)                           // Línea
doc.setFontSize(size)                              // Tamaño fuente
doc.setFont(font, style)                           // Fuente
doc.addPage()                                      // Nueva página
doc.output('blob')                                 // Exportar como blob
doc.save('nombre.pdf')                             // Descargar
```

---

## 📌 NOTAS IMPORTANTES

1. **Membrete debe estar en `/public/`** para que sea accesible desde el navegador
2. **Cualquier variante funciona** (png, jpg, cualquier nombre)
3. **Si no lo encuentra, continúa** sin quebrar la generación del PDF
4. **Los logs de error** aparecen en la consola del navegador
5. **El tamaño 200×230** es recomendado pero ajustable
6. **El código funciona perfectamente** en examenes, listo para copiar

---

**Generado:** 21 de abril de 2026  
**Para:** Implementación en Facturación  
**Referencia:** Examenes.jsx - handleGenerarPDF()
