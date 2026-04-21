# 📊 Guía de Integración - Módulo Registro Financiero

## Descripción General

El módulo Registro Financiero se ha integrado completamente con los siguientes componentes:
- **Backend**: Modelos, rutas y servicios de financiero
- **Frontend**: Página de Registro Financiero con dashboard de totales
- **API**: Endpoints para tasa de cambio, movimientos y resumen financiero

---

## 🔌 1. Integración con Facturación

### Objetivo
Cuando se genera un **Ticket** o **Factura**, el sistema debe registrar automáticamente un movimiento financiero.

### Flujo de Datos

```
Facturacion.jsx
    ↓
(Usuario genera Ticket/Factura)
    ↓
api.generarTicket() o api.generarFactura()
    ↓
Backend registra la factura
    ↓
[NUEVO] Backend llama api.registrarMovimientoFinanciero()
    ↓
Se guarda en movimientos_financieros.json
```

### Implementación en Facturacion.jsx

En el archivo `frontend/src/pages/Facturacion.jsx`, después de que se genera un ticket o factura exitosamente:

```jsx
// Después de generarTicket o generarFactura
const handleGenerarTicket = async () => {
  try {
    const response = await api.generarTicket(datosTicket)
    
    // Obtener tasa de cambio actual
    const tasaData = await api.obtenerTasaCambio()
    const tasaCambio = tasaData.tasa
    
    // Registrar movimiento financiero
    await api.registrarMovimientoFinanciero({
      paciente_id: pacienteId,
      monto_bs: response.total_sin_iva,  // SIN IVA
      monto_usd: response.total_sin_iva / tasaCambio,
      tipo: "ticket",
      fecha: new Date().toISOString()
    })
    
    // Mostrar confirmación
    setMensaje({ type: 'success', text: 'Ticket generado y registrado' })
  } catch (error) {
    console.error('Error:', error)
  }
}

// Hacer lo mismo para factura pero con tipo: "factura"
```

### Campos Importantes

- `total_sin_iva`: El total de los exámenes SIN incluir IVA
- `tipo`: "ticket" o "factura"
- `monto_usd`: Se calcula dividiendo monto_bs entre la tasa de cambio
- **IMPORTANTE**: El IVA NO se incluye en ningún movimiento financiero

---

## 🧪 2. Integración con Pruebas

### Objetivo
Cada prueba debe tener dos precios:
1. **Precio en Bs** (ingresado manualmente)
2. **Precio en USD** (calculado automáticamente)

Cuando la tasa cambia, todos los precios en USD se deben recalcular.

### Implementación en Pruebas.jsx

#### Paso 1: Agregar campo precio_usd al modelo Prueba

En `backend/app/models/prueba_models.py`:

```python
class PruebaOut(PruebaBase):
    id: str
    precio_usd: Optional[float] = None  # AGREGAR ESTO
    creado_en: Optional[str] = None

    class Config:
        from_attributes = True
```

#### Paso 2: Calcular precio en USD en Pruebas.jsx

```jsx
// Cuando se cargan las pruebas
const loadPruebas = async () => {
  const tasaData = await api.obtenerTasaCambio()
  const tasa = tasaData.tasa
  
  const pruebasData = await api.getAllPruebas()
  
  // Calcular precio en USD para cada prueba
  const pruebasConUSD = pruebasData.map(prueba => ({
    ...prueba,
    precio_usd: prueba.precio / tasa
  }))
  
  setPruebas(pruebasConUSD)
  setDisplayedPruebas(pruebasConUSD)
}

// Mostrar en la tarjeta de prueba
{prueba.precio && (
  <div className="prueba-info-row">
    <span className="info-label">Precio:</span>
    <span className="info-value precio-badge">
      Bs {prueba.precio.toFixed(2)} / ${(prueba.precio_usd || 0).toFixed(2)}
    </span>
  </div>
)}
```

#### Paso 3: Recalcular precios cuando cambia la tasa

En `Pruebas.jsx` o crear un hook personalizado:

```jsx
// Hook personalizado: useTasaCambio.js
import { useEffect, useState } from 'react'
import api from '../services/api'

export const useTasaCambio = () => {
  const [tasa, setTasa] = useState(45)

  const actualizarTasa = async (nuevaTasa) => {
    const response = await api.actualizarTasaCambio(nuevaTasa)
    setTasa(response.tasa)
    // Notificar a otros componentes que la tasa cambió
    window.dispatchEvent(new CustomEvent('tasaCambioActualizada', { detail: response.tasa }))
  }

  return { tasa, actualizarTasa }
}

// Usar en Pruebas.jsx
useEffect(() => {
  const handleTasaCambio = (e) => {
    loadPruebas()  // Recalcular precios
  }
  
  window.addEventListener('tasaCambioActualizada', handleTasaCambio)
  return () => window.removeEventListener('tasaCambioActualizada', handleTasaCambio)
}, [])
```

---

## 💱 3. Gestión de Tasa de Cambio

### Ubicación
Botón "Tasa" en la esquina superior derecha del Registro Financiero

### Endpoints

#### Obtener tasa actual
```
GET /api/financiero/tasa
Response: { id, tasa, actualizado_en }
```

#### Actualizar tasa
```
POST /api/financiero/tasa
Body: { tasa: 45.5 }
Response: { id, tasa, actualizado_en }
```

### Efecto en cascada cuando se actualiza la tasa

1. ✅ Se guarda la nueva tasa en `tasa_cambio.json`
2. ✅ Se envía evento para actualizar precios en USD en Pruebas
3. ✅ Se recalculan los totales en USD en Registro Financiero
4. ✅ Se recalculan las conversiones en Facturación

---

## 📊 4. Endpoints del Registro Financiero

### Movimientos

```
GET /api/financiero/movimientos
Response: [{ id, paciente_id, monto_bs, monto_usd, tipo, fecha, creado_en }, ...]

POST /api/financiero/movimiento
Body: { paciente_id, monto_bs, monto_usd, tipo, fecha? }
Response: { id, paciente_id, monto_bs, monto_usd, tipo, fecha, creado_en }

GET /api/financiero/movimientos/filtro?tipo=ticket&fecha_desde=...&fecha_hasta=...
Response: [movimientos filtrados]
```

### Resumen Financiero

```
GET /api/financiero/resumen
Response: {
  total_diario_bs, total_diario_usd,
  total_semanal_bs, total_semanal_usd,
  total_mensual_bs, total_mensual_usd,
  total_anual_bs, total_anual_usd,
  tasa_actual
}

GET /api/financiero/resumen/tipos
Response: {
  tickets_bs, tickets_usd,
  facturas_bs, facturas_usd
}
```

---

## 💡 5. Resumen de Cambios Necesarios

### Backend ✅ (Completado)
- [x] Modelo `financiero_models.py`
- [x] Rutas `routes/financiero.py`
- [x] Integración en `main.py`

### Frontend ✅ (Completado)
- [x] API methods en `services/api.js`
- [x] Página `RegistroFinanciero.jsx`
- [x] Estilos `RegistroFinanciero.css`
- [x] Ruta en `App.jsx`
- [x] Navegación en menú

### Frontend 🔄 (Próximos Pasos)
- [ ] Actualizar `Facturacion.jsx` para registrar movimientos
- [ ] Actualizar `Pruebas.jsx` para mostrar precios en USD
- [ ] Crear hook `useTasaCambio` para compartir estado
- [ ] Pruebas de integración

---

## 🧮 6. Datos Almacenados

### Archivo: `tasa_cambio.json`
```json
{
  "tasa": 45.5,
  "actualizado_en": "2026-03-11T10:30:00"
}
```

### Archivo: `movimientos_financieros.json`
```json
[
  {
    "id": "mov-1234567890",
    "paciente_id": "pac-123",
    "monto_bs": 1500000,
    "monto_usd": 32.97,
    "tipo": "ticket",
    "fecha": "2026-03-11T10:30:00",
    "creado_en": "2026-03-11T10:30:00"
  }
]
```

---

## ✅ Checklist de Integración

- [ ] Actualizar `Facturacion.jsx` para registrar movimientos
- [ ] Verificar que los IVA NO se incluyan en movimientos
- [ ] Actualizar `Pruebas.jsx` para mostrar USD
- [ ] Probar cambio de tasa de cambio
- [ ] Verificar recálculo de totales en USD
- [ ] Pruebas de filtrado por tipo
- [ ] Pruebas responsivas en móvil
- [ ] Documentación final

---

## 📞 Soporte

Si encuentras problemas, verifica:
1. ¿Los archivos de configuración JSON están siendo creados?
2. ¿El backend está devolviendo la tasa correcta?
3. ¿Los movimientos se están guardando correctamente?
4. ¿La tasa se actualiza en tiempo real en el frontend?

