# 🏥 PÁGINA EXÁMENES - RESUMEN VISUAL

## Flujo de Navegación

```
┌─────────────────┐
│  PÁGINA INICIO  │
│   (/examenes)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  ENCABEZADO                         │
│  - Título: "Exámenes"               │
│  - Selector fecha: [2026-03-04] 📅  │
│  - Contador: Exámenes del día: 15   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  1. SELECCIONAR PACIENTE            │
│  ┌─────────────────────────────────┐│
│  │ Buscar paciente:                ││
│  │ [_____________________________ ] ││
│  │                                 ││
│  │ Resultados:                     ││
│  │ ┌─────────────────────────────┐││
│  │ │ Juan García, 45 años        │││  ← Click aquí
│  │ │                             │││
│  │ │ María López, 32 años        │││
│  │ └─────────────────────────────┘││
│  │                                 ││
│  │ Ficha seleccionada:             ││
│  │ ┌─────────────────────────────┐││
│  │ │ Juan García                 │││
│  │ │ Edad: 45 años | Tel: 55512  │││
│  │ │ Dir: Calle 123  | Sexo: M   │││
│  │ │ [Cambiar]                   │││
│  │ └─────────────────────────────┘││
│  └─────────────────────────────────┘│
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  2. SELECCIONAR PRUEBAS             │
│  [Seleccionar Pruebas]              │
│           ▼                         │
│  ┌───────────────────────────────┐  │
│  │ ☑ Hemoglobina (g/dL)          │  │
│  │   Rango: 12.0 - 17.5          │  │
│  │                               │  │
│  │ ☐ Glucosa (mg/dL)             │  │
│  │   Rango: 70 - 100             │  │
│  │                               │  │
│  │ ☐ Colesterol (mg/dL)          │  │
│  │   Rango: 0 - 200              │  │
│  │                               │  │
│  │ ☑ Triglicéridos (mg/dL)       │  │
│  │   Rango: 0 - 150              │  │
│  │                               │  │
│  │ [Cancelar] [Aceptar (2)]      │  │
│  └───────────────────────────────┘  │
│                                     │
│  Seleccionadas: 2 pruebas           │
│  [Modificar selección]              │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  3. INGRESAR RESULTADOS             │
│  ┌─────────────────────────────────┐│
│  │ Hemoglobina (g/dL)              ││
│  │ Rango: 12.0 - 17.5              ││
│  │ Resultado: [14.2    ]           ││
│  │ Observaciones: [Dentro rango]   ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Triglicéridos (mg/dL)           ││
│  │ Rango: 0 - 150                  ││
│  │ Resultado: [120     ]           ││
│  │ Observaciones: [Elevado]        ││
│  └─────────────────────────────────┘│
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  4. FINALIZAR                       │
│  [💾 Guardar Examen]                │
│  [📄 Generar PDF]                   │
│  [💬 Enviar por WhatsApp]           │
│                                     │
│  ↓ Click en "Guardar Examen"       │
└────────┬────────────────────────────┘
         │
         ▼
    POST /examenes/batch
    [
      {
        paciente_id: "uuid-juan",
        prueba_id: "uuid-hemoglobina",
        fecha: "2026-03-04",
        resultado: "14.2",
        observaciones: "Dentro rango"
      },
      {
        paciente_id: "uuid-juan",
        prueba_id: "uuid-triglic",
        fecha: "2026-03-04",
        resultado: "120",
        observaciones: "Elevado"
      }
    ]
         │
         ▼
    ✅ Exámenes guardados
       (Se limpia formulario)
    Counter se actualiza: 16
```

---

## Estructura de Componentes

```
Examenes/
├── Encabezado (Header)
│   ├── Título "Exámenes"
│   ├── Selector de fecha
│   └── Contador
│
├── Sección 1: Búsqueda de Paciente
│   ├── Input search
│   ├── Dropdown resultados
│   └── Ficha paciente seleccionado
│
├── Sección 2: Selección de Pruebas
│   ├── Lista checkboxes
│   ├── Botón "Seleccionar"
│   ├── Modal con pruebas
│   └── Resumen de selección
│
├── Sección 3: Ingresar Resultados
│   ├── Cards de pruebas
│   ├── Inputs de resultado
│   └── Inputs de observaciones
│
├── Sección 4: Botones Finales
│   ├── Guardar
│   ├── PDF
│   └── WhatsApp
│
└── Mensajes (Toast)
    ├── Success
    ├── Error
    └── Warning
```

---

## Estados del Componente

```javascript
// ESTADO GENERAL
selectedDate       // "2026-03-04"
examenCount        // 15
mensaje            // { type: 'success', text: '...' }

// BÚSQUEDA DE PACIENTE
searchPaciente     // "Juan Ga"
searchResults      // [{ id, nombre, apellido, ... }]
showSearchResults  // true/false
selectedPaciente   // { id, nombre, apellido, edad, ... }

// GESTIÓN DE PRUEBAS
allPruebas         // [{ id, nombre_prueba, unidad_medida, ... }]
selectedPruebas    // ["uuid-1", "uuid-4"]
showPruebasSelection // false
pruebasLoading     // false

// FORMULARIO DE RESULTADOS
resultados         // { "uuid-1": "14.2", "uuid-4": "120" }
observaciones      // { "uuid-1": "Dentro rango", "uuid-4": "Elevado" }
submitting         // false
```

---

## API Endpoints Usados

```
┌─────────────────────────────────────────────────┐
│  PÁGINA EXAMENES - LLAMADAS A API               │
├─────────────────────────────────────────────────┤
│                                                 │
│  Al cargar la página:                           │
│  ├─ GET  /pruebas                               │
│  └─ GET  /examenes/count?fecha=2026-03-04       │
│                                                 │
│  Al buscar paciente:                            │
│  └─ GET  /pacientes?search=Juan                 │
│                                                 │
│  Al cambiar de fecha:                           │
│  └─ GET  /examenes/count?fecha=2026-03-05       │
│                                                 │
│  Al guardar exámenes:                           │
│  └─ POST /examenes/batch                        │
│     Payload: []
│                                                 │
│  Después de guardar:                            │
│  └─ GET  /examenes/count?fecha=2026-03-04       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Ejemplo de Datos

### Caso: Registrar 3 pruebas de Juan García

**1. Paciente (buscado)**
```javascript
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  nombre: "Juan",
  apellido: "García",
  edad: 45,
  telefono: "555-1234",
  direccion: "Calle Principal 123",
  sexo: "M"
}
```

**2. Pruebas disponibles (catálogo)**
```javascript
[
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    nombre_prueba: "Hemoglobina",
    unidad_medida: "g/dL",
    tipo_muestra: "Sangre",
    valor_referencia_min: 12.0,
    valor_referencia_max: 17.5
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440002",
    nombre_prueba: "Glucosa",
    unidad_medida: "mg/dL",
    tipo_muestra: "Sangre en ayunas",
    valor_referencia_min: 70,
    valor_referencia_max: 100
  },
  // ... más
]
```

**3. Exámenes a guardar (form submitido)**
```javascript
[
  {
    paciente_id: "550e8400-e29b-41d4-a716-446655440000",
    prueba_id: "660e8400-e29b-41d4-a716-446655440001",
    fecha: "2026-03-04",
    resultado: "14.2",
    observaciones: "Dentro del rango normal"
  },
  {
    paciente_id: "550e8400-e29b-41d4-a716-446655440000",
    prueba_id: "660e8400-e29b-41d4-a716-446655440002",
    fecha: "2026-03-04",
    resultado: "95",
    observaciones: ""
  },
  {
    paciente_id: "550e8400-e29b-41d4-a716-446655440000",
    prueba_id: "660e8400-e29b-41d4-a716-446655440003",
    fecha: "2026-03-04",
    resultado: "180",
    observaciones: "Colesterol ligeramente elevado"
  }
]
```

**4. Respuesta del backend**
```javascript
[
  {
    id: "770e8400-e29b-41d4-a716-446655440010",
    paciente_id: "550e8400-e29b-41d4-a716-446655440000",
    prueba_id: "660e8400-e29b-41d4-a716-446655440001",
    fecha: "2026-03-04",
    resultado: "14.2",
    observaciones: "Dentro del rango normal",
    creado_en: "2026-03-04T14:30:00Z"
  },
  // ... más
]
```

---

## Pantalla (Preview)

```
╔════════════════════════════════════════════════════════════════╗
║ Laboratorio Bioclínico                                         ║
║ Lc. Fátima Hernández  ☰                                        ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  EXÁMENES                                                      ║
║  Fecha: [2026-03-04]  📅   Exámenes del día: 15               ║
║                                                                ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                ║
║  1. SELECCIONAR PACIENTE                                      ║
║                                                                ║
║  Buscar paciente:                                             ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ Buscar por nombre, apellido o teléfono...               │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  Paciente seleccionado:                                       ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ Juan García                                  [Cambiar]  │  ║
║  │ Edad: 45 años  │  Teléfono: 555-1234                   │  ║
║  │ Dirección: Calle Principal 123  │  Sexo: Masculino    │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                ║
║  2. SELECCIONAR PRUEBAS                                       ║
║                                                                ║
║  Seleccionadas: 3 pruebas  [Modificar selección]             ║
║                                                                ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                ║
║  3. INGRESAR RESULTADOS                                       ║
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ Hemoglobina                          g/dL               │  ║
║  │ Rango de referencia: 12.0 - 17.5                       │  ║
║  │ Resultado: [14.2     ]   Obs: [Dentro del rango]       │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ Glucosa                              mg/dL              │  ║
║  │ Rango de referencia: 70 - 100                          │  ║
║  │ Resultado: [95      ]   Obs: []                        │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ Colesterol                           mg/dL              │  ║
║  │ Rango de referencia: 0 - 200                           │  ║
║  │ Resultado: [180     ]   Obs: [Elevado]                 │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                                ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                ║
║  4. FINALIZAR                                                  ║
║                                                                ║
║  [💾 Guardar Examen]  [📄 Generar PDF]  [💬 WhatsApp]        ║
║                                                                ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║                                                                ║
║  ✅ Exámenes guardados correctamente (mensaje flotante)      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

**Creado:** 4 de Marzo 2026
**Última actualización:** Hoy mismo
**Estado:** Listo para producción ✅
