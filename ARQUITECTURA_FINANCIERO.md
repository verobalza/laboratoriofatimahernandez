# 🏗️ Arquitectura - Módulo Registro Financiero

## Diagrama General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           RegistroFinanciero.jsx                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   4 Cards    │  │   Modal      │  │   Table      │  │   │
│  │  │   Totales    │  │   Tasa       │  │   Movs       │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        api.js (Servicios HTTP)                          │   │
│  │  ├─ obtenerTasaCambio()                                 │   │
│  │  ├─ actualizarTasaCambio()                              │   │
│  │  ├─ registrarMovimientoFinanciero()                     │   │
│  │  ├─ obtenerMovimientosFinancieros()                     │   │
│  │  ├─ obtenerResumenFinanciero()                          │   │
│  │  └─ obtenerResumenPorTipo()                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                    │
│              HTTP REST (JSON)                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      financiero.py (Routes)                             │   │
│  │  GET    /api/financiero/tasa                            │   │
│  │  POST   /api/financiero/tasa                            │   │
│  │  POST   /api/financiero/movimiento                      │   │
│  │  GET    /api/financiero/movimientos                     │   │
│  │  GET    /api/financiero/movimientos/filtro              │   │
│  │  GET    /api/financiero/resumen                         │   │
│  │  GET    /api/financiero/resumen/tipos                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    financiero_models.py (Validación)                    │   │
│  │  • TasaCambioOut                                         │   │
│  │  • MovimientoFinancieroOut                              │   │
│  │  • ResumenFinanciero                                    │   │
│  │  • TotalesPorTipo                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↕                                    │
│         Lógica de Negocio (Cálculos y Filtros)                   │
│                              ↕                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         JSON Storage                                    │   │
│  │  • tasa_cambio.json                                     │   │
│  │  • movimientos_financieros.json                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

### 1️⃣ Cargar Página (al abrir Registro Financiero)

```
┌─────────────────────────────────────────┐
│  Usuario abre /registro-financiero      │
└──────────────┬──────────────────────────┘
               │
               ↓
    ┌─────────────────────────┐
    │ RegistroFinanciero.jsx  │
    │ componentDidMount()     │
    └──────────┬──────────────┘
               │
               ↓
    ┌──────────────────────────────────────────┐
    │ Llamadas Paralelas:                      │
    │  • obtenerTasaCambio()                   │
    │  • obtenerResumenFinanciero()            │
    │  • obtenerMovimientosFinancieros()       │
    └──────────┬───────────────────────────────┘
               │
               ├─→ GET /api/financiero/tasa
               ├─→ GET /api/financiero/resumen
               └─→ GET /api/financiero/movimientos
                         ↓
               ┌──────────────────────┐
               │ Backend procesa      │
               │ calcula totales      │
               │ devuelve JSON        │
               └──────────┬───────────┘
                         ↓
               ┌──────────────────────┐
               │ Frontend renderiza   │
               │ 4 tarjetas + tabla    │
               └──────────────────────┘
```

### 2️⃣ Actualizar Tasa

```
┌─────────────────────────┐
│ Usuario hace clic en    │
│ botón "💱 Tasa"         │
└──────────┬──────────────┘
           │
           ↓
  ┌────────────────────────┐
  │ Se abre Modal           │
  │ (RegistroFinanciero.jsx)│
  └──────────┬─────────────┘
             │
             ↓
  ┌──────────────────────────┐
  │ Usuario ingresa tasa     │
  │ Ej: 50.5                 │
  └──────────┬───────────────┘
             │
             ↓
  ┌──────────────────────────────────────┐
  │ actualizarTasaCambio(50.5)           │
  └──────────┬─────────────────────────┘
             │
             ↓
  POST /api/financiero/tasa
  Body: { tasa: 50.5 }
             │
             ↓
  ┌──────────────────────────┐
  │ Backend:                 │
  │ guarda en JSON           │
  │ return { tasa: 50.5 }    │
  └──────────┬───────────────┘
             │
             ↓
  ┌──────────────────────────┐
  │ Frontend:                │
  │ • Actualiza estado       │
  │ • Cierra modal           │
  │ • Recarga resumen        │
  │ • Muestra "éxito"        │
  └──────────────────────────┘
```

### 3️⃣ Generar Ticket/Factura (Integración)

```
┌─────────────────────────────────────────────┐
│ Usuario en Facturación.jsx genera Ticket    │
└──────────┬──────────────────────────────────┘
           │
           ↓
  ┌─────────────────────────────────────┐
  │ Se suman exámenes:                  │
  │ Total: 1,500,000 Bs (SIN IVA)       │
  └──────────┬────────────────────────┘
             │
             ↓
  ┌───────────────────────────────────────────┐
  │ api.generarTicket({                       │
  │    examen_ids: [...],                     │
  │    paciente_id: "pac-123"                 │
  │ })                                        │
  └──────────┬──────────────────────────────┘
             │
             ↓
  Backend genera ticket exitosamente
  response.total_sin_iva = 1,500,000
             │
             ↓
  ┌──────────────────────────────────────────────────┐
  │ [NUEVO] Facturacion.jsx llama:                   │
  │ • obtenerTasaCambio() → 45                       │
  │ • 1,500,000 ÷ 45 = 33,333.33 USD                │
  │ • registrarMovimientoFinanciero({                │
  │     paciente_id: "pac-123",                      │
  │     monto_bs: 1,500,000,                         │
  │     monto_usd: 33,333.33,                        │
  │     tipo: "ticket"                               │
  │   })                                             │
  └──────────┬───────────────────────────────────────┘
             │
             ↓
  POST /api/financiero/movimiento
  (Se guarda en movimientos_financieros.json)
             │
             ↓
  ┌────────────────────────────────────────┐
  │ Registro Financiero se actualiza       │
  │ (próxima vez que se abre la página)    │
  └────────────────────────────────────────┘
```

### 4️⃣ Filtrar Movimientos

```
┌───────────────────────────────────────┐
│ Usuario clic en filtro "Tickets"      │
└──────────┬────────────────────────────┘
           │
           ↓
┌──────────────────────────────────────────┐
│ handleFiltroTipo('ticket')               │
│ • Filtra estado local                    │
│ • displayedMovimientos = movimientos     │
│   .filter(m => m.tipo === 'ticket')      │
│ • Re-renderiza tabla                     │
└──────────────────────────────────────────┘
```

---

## Componentes y Responsabilidades

### Frontend

#### `RegistroFinanciero.jsx`
```
Responsabilidades:
✓ Mantener estado (datos financieros)
✓ Cargar datos al montar
✓ Manejar modal de tasa
✓ Filtrar movimientos localmente
✓ Renderizar UI
```

#### `api.js` (métodos nuevos)
```
Responsabilidades:
✓ Comunicación HTTP con backend
✓ Manejo de tokens de autenticación
✓ Serialización/deserialización JSON
✓ Manejo de errores HTTP
```

### Backend

#### `routes/financiero.py`
```
Responsabilidades:
✓ Recibir peticiones HTTP
✓ Validar datos con Pydantic
✓ Procesar lógica de negocio
✓ Leer/escribir archivos JSON
✓ Devolver respuestas JSON
```

#### `models/financiero_models.py`
```
Responsabilidades:
✓ Validar datos de entrada
✓ Definir estructura de respuestas
✓ Validar rangos y tipos
✓ Documentación de API (OpenAPI)
```

---

## Flujo de Cálculos

### Cálculo de Totales

```
Para cada movimiento en el período:
  total_bs += movimiento.monto_bs
  total_usd += movimiento.monto_usd

Períodos:
- Diario: fecha_movimiento == hoy
- Semanal: fecha_movimiento >= (hoy - 7 días)
- Mensual: fecha_movimiento >= primer día del mes
- Anual: fecha_movimiento >= 1 enero
```

### Conversión USD

```
tasa = obtener tasa actual de tasa_cambio.json

Para cada precio:
  precio_usd = precio_bs / tasa

Ejemplo:
  precio_bs = 1,500,000
  tasa = 45
  precio_usd = 1,500,000 / 45 = 33,333.33
```

### Filtrado Local

```
Si filtro_tipo = "":
  mostrar todos los movimientos
  
Si filtro_tipo = "ticket":
  mostrar solo m.tipo == "ticket"
  
Si filtro_tipo = "factura":
  mostrar solo m.tipo == "factura"
```

---

## Almacenamiento

### Archivo: `tasa_cambio.json`

```json
{
  "tasa": 45.5,
  "actualizado_en": "2026-03-11T10:30:00"
}
```

**Ubicación**: Raíz del backend  
**Creado**: Primera vez que se actualiza la tasa  
**Lectura**: Cada vez que se necesita convertir moneda  

### Archivo: `movimientos_financieros.json`

```json
[
  {
    "id": "mov-1234567890",
    "paciente_id": "pac-123",
    "monto_bs": 1500000.00,
    "monto_usd": 32.97,
    "tipo": "ticket",
    "fecha": "2026-03-11T10:30:00",
    "creado_en": "2026-03-11T10:30:00"
  },
  {
    "id": "mov-1234567891",
    "paciente_id": "pac-456",
    "monto_bs": 2300000.50,
    "monto_usd": 50.55,
    "tipo": "factura",
    "fecha": "2026-03-11T11:00:00",
    "creado_en": "2026-03-11T11:00:00"
  }
]
```

**Ubicación**: Raíz del backend  
**Creado**: Primera vez que se registra un movimiento  
**Actualizado**: Cada nuevo ticket/factura  

---

## Flujo de Integración Futura

### Cuando se complete la integración con Facturación

```
Facturación.jsx
    ↓
Usuario genera Ticket
    ↓
api.generarTicket()
    ↓
Backend:
  - Crea ticket en BD
  - Calcula total SIN IVA
  - Return { success, total_sin_iva }
    ↓
Facturacion.jsx recibe:
  - tasa = await api.obtenerTasaCambio()
  - monto_usd = total_sin_iva / tasa.tasa
  - await api.registrarMovimientoFinanciero({
      paciente_id,
      monto_bs: total_sin_iva,
      monto_usd,
      tipo: "ticket"
    })
    ↓
Movimiento se registra
    ↓
RegistroFinanciero se actualiza automáticamente
```

---

## Seguridad

```
✓ Validación de datos con Pydantic
✓ Rango de tasas (> 0)
✓ Rango de montos (>= 0)
✓ Tipos validados ("ticket" o "factura")
✓ Tokens JWT (cuando se implemente autenticación)
```

---

## Escalabilidad Futura

```
Actual: JSON en servidor
   ↓
Futuro: Supabase/PostgreSQL
   - Tablas: tasa_cambio, movimientos_financieros
   - Índices en fecha, tipo, paciente_id
   - Backups automáticos
   - Escalabilidad horizontal
   - Autenticación por usuario
   - Auditoría de cambios
```

---

**Diagrama creado: 11 de marzo de 2026**
