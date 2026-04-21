# REFERENCIA COMPLETA: Uso de Membrete.png en PDFs de Examenes

## 📍 UBICACIÓN DEL CÓDIGO DE GENERACIÓN DE PDFs

### Frontend (Donde se genera el PDF):
**Archivo:** [frontend/src/pages/Examenes.jsx](frontend/src/pages/Examenes.jsx#L440)
**Función:** `handleGenerarPDF()` (línea 441)

---

## 1️⃣ BÚSQUEDA Y CARGA DE LA IMAGEN DEL MEMBRETE

### Ubicación en el código:
[Examenes.jsx, línea 457-475](frontend/src/pages/Examenes.jsx#L457-L475)

### Código:
```javascript
// Cargar membrete como imagen (PNG) y dibujar una sola vez, con fallback si no existe
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
      // sigue intentando con otro nombre de archivo
    }
  }
  return null
}

const membreteSrc = await loadMembrete()
```

### Características de la búsqueda:
- **Método:** Búsqueda iterativa entre múltiples variantes de nombres
- **Ubicaciones buscadas:** Raíz pública del servidor (`/`)
- **Variantes soportadas:**
  - `/membrete.png`
  - `/Membrete Empresa Geométrico Azul.png`
  - `/membrete.jpg`
  - `/membrete.jpeg`
- **Fallback:** Si no encuentra la imagen, continúa sin membrete (no lanza error)
- **CORS:** Usa `crossOrigin = 'anonymous'` para permitir carga de imágenes externas

---

## 2️⃣ INSERCIÓN DE LA IMAGEN EN EL PDF

### Ubicación en el código:
[Examenes.jsx, línea 476-501](frontend/src/pages/Examenes.jsx#L476-L501)

### Código:
```javascript
let ypos = 70

if (membreteSrc) {
  const headerImg = await new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = (err) => reject(new Error('No se pudo cargar el membrete'))
    image.src = membreteSrc
  })
  doc.addImage(headerImg, 'PNG', 0, 0, 200, 230)
  ypos = 70
} else {
  console.warn('No se encontró membresía en formato PNG/JPG; se generará PDF sin membrete.')
  ypos = 20
}
```

### Parámetros de `doc.addImage()`:
| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Image** | `headerImg` | Objeto Image de JavaScript |
| **Format** | `'PNG'` | Formato de la imagen |
| **X Position** | `0` | Posición horizontal (borde izquierdo) |
| **Y Position** | `0` | Posición vertical (borde superior) |
| **Width** | `200` | Ancho de la imagen en mm |
| **Height** | `230` | Alto de la imagen en mm |

### Posicionamiento:
- **Esquina:** Superior izquierda (0, 0)
- **Tamaño:** 200mm de ancho × 230mm de alto
- **Ocupación:** Aproximadamente 80% del ancho de página (jsPDF usa 210mm estándar)
- **Altura:** Ocupa casi toda la parte superior de la página

---

## 3️⃣ FLUJO COMPLETO DE GENERACIÓN

### Diagrama del proceso:

```
1. Usuario hace clic en "Generar PDF"
   ↓
2. handleGenerarPDF() se ejecuta
   ↓
3. Validación de formulario
   ├─ ¿Paciente seleccionado?
   ├─ ¿Al menos una prueba?
   ├─ ¿Resultados ingresados?
   ↓
4. Crear documento jsPDF
   ↓
5. CARGAR MEMBRETE
   ├─ Buscar en paths alternativos
   ├─ Si no encuentra → continuar sin membrete
   ↓
6. INSERTAR MEMBRETE en (0, 0) con tamaño 200×230
   ↓
7. Posicionar contenido en ypos = 70 (debajo del membrete)
   ├─ Fecha
   ├─ Nombre + Cédula
   ├─ Edad + Dirección
   ├─ Título: "Pruebas realizadas y resultados"
   ├─ Línea decorativa
   ├─ Pruebas (agrupadas por grupo)
   ├─ Exámenes especiales (Orina/Heces si aplica)
   ↓
8. Generar blob PDF
   ↓
9. Crear FormData con:
   - Blob del PDF
   - paciente_id
   - fecha
   - pruebas (JSON array)
   - examenes_especiales (JSON)
   ↓
10. Llamar a api.uploadPDF(formData)
    ↓
11. Backend:
    - Sube PDF a Supabase Storage
    - Registra en tabla examenes_pdf
    ↓
12. Mostrar mensaje de éxito
    ↓
13. Limpiar formulario
```

---

## 4️⃣ CONTENIDO DEL PDF DESPUÉS DEL MEMBRETE

### Estructura de datos en el PDF:
```
[MEMBRETE - 200mm × 230mm en posición (0,0)]

Fecha: [fecha]                                    [posición: y=70]

Paciente: [Nombre Apellido]     Cédula: [XXX]    [posición: y=80]

Edad: [XX]                       Dirección: [dir]  [posición: y=90]

                    Pruebas realizadas y resultados    [posición: y=105, centrado]
________________________________________________________________________________
                                                        [línea decorativa, y=111]

[Pruebas agrupadas por grupo]
  - Nombre Prueba ............................ Resultado UNIDAD (rango)
  - Descripción si existe
  - Observaciones si existen

[Si hay exámenes especiales]
EXAMEN COMPLETO DE ORINA / HECES
  - Examen Físico
  - Examen Químico
  - Examen Microscópico
  - Observaciones
```

---

## 5️⃣ MANEJO DE ERRORES Y FALLBACKS

### Casos manejados:
1. **Membrete no encontrado:**
   - Continúa sin insertar imagen
   - `ypos = 20` (lugar de contenido más arriba)
   - Log: `console.warn('No se encontró membresía...')`

2. **Error al cargar imagen HTML:**
   - Catch: `reject(new Error('No se pudo cargar el membrete'))`
   - Resultado: Continúa sin membrete

3. **Múltiples variantes:**
   - Intenta hasta 4 variantes diferentes
   - Primera que cargue correctamente se usa
   - Evita error si el archivo tiene nombre diferente

---

## 6️⃣ BIBLIOTECAS UTILIZADAS

### Frontend:
- **jsPDF** v2.x - Generación de PDFs
  - Importado en línea 14: `import jsPDF from 'jspdf'`
  - Método clave: `doc.addImage()` para insertar imagen
  - Método clave: `doc.output('blob')` para exportar

- **Image API de JavaScript** - Carga de imágenes
  - Constructor nativo: `new Image()`
  - Eventos: `onload`, `onerror`
  - Propiedad: `crossOrigin = 'anonymous'`

### Backend:
- **ReportLab** - Generación de PDFs con membrete (alternativa)
  - Usado en `facturacion.py`
  - `from reportlab.platypus import Image`
  - Búsqueda de membrete desde paths locales

---

## 7️⃣ UPLOAD Y ALMACENAMIENTO

### Proceso post-generación:
[Examenes.jsx, línea 813-825](frontend/src/pages/Examenes.jsx#L813-L825)

```javascript
const pdfBlob = doc.output('blob')

// enviar al backend para que suba y registre
const formData = new FormData()
formData.append('file', pdfBlob, 'examen.pdf')
formData.append('paciente_id', selectedPaciente.id)
formData.append('fecha', selectedDate)
formData.append('pruebas', JSON.stringify(pruebasSeleccionadas.map(p => p.nombre_prueba)))
formData.append('examenes_especiales', JSON.stringify({
  orina: examenesEspeciales.orina.enabled ? examenesEspeciales.orina.data : null,
  heces: examenesEspeciales.heces.enabled ? examenesEspeciales.heces.data : null
}))

// uploadPDF ya sube y registra en examenes_pdf
await api.uploadPDF(formData)
```

### Backend - Endpoint receptor:
[backend/app/routes/examenes.py, línea 167-248](backend/app/routes/examenes.py#L167-L248)

**Endpoint:** `POST /examenes/pdf/upload`

**Acciones:**
1. Recibe el PDF en blob
2. Genera UUID para nombre de archivo
3. Sube a Supabase Storage en ruta: `examenes/{fecha}/{uuid}.pdf`
4. Obtiene URL pública
5. Registra en tabla `examenes_pdf` con:
   - `paciente_id`
   - `fecha`
   - `url_pdf` (pública)
   - `pruebas` (JSON array)

---

## 8️⃣ VARIABLE DE POSICIONAMIENTO

### `ypos` - Posición Y en el PDF:

```javascript
let ypos = 70  // Inicial (debajo del membrete de 230mm)

// O si no hay membrete:
let ypos = 20  // Más arriba en la página
```

**Uso durante generación:**
```javascript
ypos += 10    // Avanza 10mm para siguiente elemento
ypos += 15    // Avanza 15mm para secciones
ypos += 6     // Avanza 6mm para títulos

// Manejo de páginas:
if (ypos > 270) {
  doc.addPage()
  ypos = 20
}
```

---

## 9️⃣ VERIFICACIÓN DE EXISTENCIA DEL MEMBRETE

### ¿Dónde debe estar el archivo?

En el contexto de ejecución, el archivo debe ser accesible en:

**En desarrollo (si está en `public/`):**
```
frontend/public/Membrete.png
frontend/public/membrete.png
frontend/public/membrete.jpg
```

**En producción (en servidor web):**
```
https://tu-servidor.com/Membrete.png
https://tu-servidor.com/membrete.png
https://tu-servidor.com/membrete.jpg
```

**Verificación en código:**
```javascript
// El navegador intentará cargar desde:
img.src = '/membrete.png'
// Lo que equivale a:
// http://localhost:5173/membrete.png  (desarrollo)
// https://tu-dominio.com/membrete.png (producción)
```

---

## 🔟 REFERENCIA PARA FACTURACIÓN

### Comparación Backend (Facturación) vs Frontend (Examenes)

| Aspecto | Examenes (Frontend) | Facturación (Backend) |
|--------|-----------------|-----------------|
| **Ubicación** | `frontend/src/pages/Examenes.jsx` | `backend/app/routes/facturacion.py` |
| **Librería** | jsPDF | ReportLab |
| **Carga Membrete** | Desde paths públicos (`/`) | Desde paths del sistema de archivos |
| **Insertado por** | `doc.addImage()` | `Image()` class |
| **Tamaño** | 200 × 230 mm | `width=doc.width` (ancho completo) |
| **Fallback** | Continúa sin membrete | Continúa sin membrete |
| **Upload** | Frontend genera, backend almacena | Backend genera directo |

### Función equivalente en Backend:
[backend/app/routes/facturacion.py, línea 144-180](backend/app/routes/facturacion.py#L144-L180)

```python
def _load_membrete_image(membrete_url: str):
    """Intenta cargar el membrete desde archivo local primero, luego desde URL."""
    candidate_paths = [
        Path(__file__).resolve().parent.parent / 'static' / 'membrete.png',
        Path(__file__).resolve().parent.parent / 'static' / 'Membrete Empresa Geométrico Azul.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'assets' / 'Membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'assets' / 'membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'src' / 'assets' / 'Membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'src' / 'assets' / 'membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'Membrete Empresa Geométrico Azul.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'Membrete.png',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'membrete.jpg',
        Path(__file__).resolve().parents[2] / 'frontend' / 'dist' / 'Membrete.jpeg',
    ]
    
    for path in candidate_paths:
        if path.exists():
            try:
                return ImageReader(str(path))
            except Exception as e:
                logging.warning(f"Error cargando imagen desde {path}: {e}")
                continue
    
    # Si no se encuentra localmente, intentar desde URL
    try:
        response = requests.get(membrete_url, timeout=5)
        response.raise_for_status()
        return ImageReader(BytesIO(response.content))
    except Exception as e:
        logging.warning(f"Error cargando imagen desde URL {membrete_url}: {e}")
    
    return None
```

---

## 📋 RESUMEN DE IMPLEMENTACIÓN

### Para replicar en Facturación:

1. **Ubicación de imagen:** 
   - Igual que examenes (frontend/public o path público)

2. **Búsqueda:**
   - Usar lista de candidatos similar
   - Incluir fallback

3. **Inserción:**
   - Parámetros: `(image, 'PNG', 0, 0, 200, 230)`
   - Posición X: `0` (izquierda)
   - Posición Y: `0` (arriba)
   - Ancho: `200mm`
   - Alto: `230mm`

4. **Posicionamiento del contenido:**
   - Iniciar en `ypos = 70` (debajo del membrete)

5. **Error handling:**
   - Continuar sin membrete si no se encuentra
   - Logging de advertencias

---

**Última actualización:** 21 de abril de 2026
**Código referenciado:** Examenes.jsx (líneas 440-850)
