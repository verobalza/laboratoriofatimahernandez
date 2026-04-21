# 📊 Módulo Registro Financiero

> Sistema completo de gestión de ingresos y tasa de cambio para laboratorio clínico

---

## 🎯 ¿Qué es?

El **Registro Financiero** es un módulo que permite:

1. **Ver ingresos totales** en diferentes períodos (día, semana, mes, año)
2. **Gestionar la tasa de cambio** entre Bs y USD
3. **Registrar movimientos** de tickets y facturas
4. **Convertir monedas** automáticamente
5. **Filtrar movimientos** por tipo

---

## 🚀 Inicio Rápido

### Acceder al módulo

1. Desde cualquier página, haz clic en ☰ (menú)
2. Selecciona **"Registro financiero"** (💰)
3. ¡Listo!

### O accede directamente
```
http://localhost:5173/registro-financiero
```

---

## 📊 Características Principales

### 1. Dashboard de Totales

Visualiza tus ingresos en 4 tarjetas:

| Tarjeta | Período | Muestra |
|---------|---------|---------|
| 📅 Día | Hoy | Totales de hoy |
| 📆 Semana | Últimos 7 días | Totales semanales |
| 📊 Mes | Mes actual | Totales mensuales |
| 📈 Año | Año actual | Totales anuales |

Cada tarjeta muestra:
- **Monto en Bs** (bolívares)
- **Monto en USD** (dólares)

### 2. Gestión de Tasa

Botón en la esquina superior derecha:
```
💱 Tasa: 1 USD = Bs 45.0000
```

**Funciones:**
- Ver tasa actual
- Actualizar a nueva tasa
- Los cambios se aplican automáticamente

### 3. Tabla de Movimientos

Visualiza todo lo que se ha registrado:

```
Fecha     | Tipo    | Monto (Bs)    | Monto (USD)
----------|---------|---------------|------------
11/03/26  | TICKET  | 1,500,000.00  | 32.97
11/03/26  | FACTURA | 2,300,000.00  | 50.55
```

**Filtros disponibles:**
- Todos
- Solo Tickets
- Solo Facturas

---

## 🔐 Integración con Otros Módulos

### Con Facturación 💳
Cuando generas un **Ticket** o **Factura**:
1. El sistema suma el total de exámenes (SIN IVA)
2. Lo convierte a USD usando la tasa actual
3. Lo registra en Registro Financiero automáticamente

### Con Pruebas 🧪
Cada prueba tiene 2 precios:
- **Bs** (bolívares): Lo que ingresas
- **USD** (dólares): Se calcula automáticamente

Si cambias la tasa, los precios en USD se recalculan automáticamente.

---

## 💡 Conceptos Importantes

### ¿Por qué no incluye IVA?

En una **Factura**:
```
Subtotal (exámenes):  1,500,000 Bs
IVA (16%):              240,000 Bs
Total a pagar:        1,740,000 Bs
```

En **Registro Financiero** se registra:
```
Ingreso real: 1,500,000 Bs (SIN IVA)
```

**Por qué?** El IVA es un impuesto que debe declararse por separado. Los ingresos reales del laboratorio son SIN IVA.

### Conversión de Moneda

```
1 USD = X Bs (tasa de cambio)

Ejemplo:
1 USD = 45 Bs

Si un examen cuesta 1,500,000 Bs:
1,500,000 ÷ 45 = 33,333.33 USD
```

---

## 📱 Funciona en Todos los Dispositivos

✅ **Desktop** - Vista completa con todas las columnas  
✅ **Tablet** - Layout optimizado para pantalla media  
✅ **Móvil** - Interfaz adaptada, tabla con scroll horizontal  

---

## 📚 Documentación Completa

Para información más detallada, consulta:

| Archivo | Contenido |
|---------|-----------|
| **GUIA_RAPIDA_FINANCIERO.md** | Guía rápida con ejemplos |
| **INTEGRACION_FINANCIERO.md** | Cómo integrar con otros módulos |
| **RESUMEN_FINANCIERO.md** | Detalles técnicos completos |

---

## 🛠️ Implementación Técnica

### Stack Usado
- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite
- **Estado**: JSON (próximamente Supabase/PostgreSQL)
- **Estilos**: CSS3 con Grid y Flexbox

### Archivos Principales
```
backend/
├── app/
│   ├── models/financiero_models.py
│   └── routes/financiero.py

frontend/
├── src/
│   ├── pages/RegistroFinanciero.jsx
│   ├── pages/RegistroFinanciero.css
│   └── services/api.js (actualizado)
```

### API Endpoints

```
GET    /api/financiero/tasa                  → Obtener tasa
POST   /api/financiero/tasa                  → Actualizar tasa
POST   /api/financiero/movimiento            → Registrar movimiento
GET    /api/financiero/movimientos           → Listar movimientos
GET    /api/financiero/movimientos/filtro    → Filtrar movimientos
GET    /api/financiero/resumen               → Resumen de totales
GET    /api/financiero/resumen/tipos         → Totales por tipo
```

---

## 💾 Almacenamiento

Los datos se almacenan en archivos JSON en el servidor:

### `tasa_cambio.json`
Guarda la tasa actual de cambio

### `movimientos_financieros.json`
Guarda el historial de todos los movimientos

---

## 🔄 Próximos Mejoras Planeadas

- [ ] Migrar a Supabase/PostgreSQL
- [ ] Reportes en PDF
- [ ] Gráficos de tendencias
- [ ] Exportar a Excel
- [ ] Auditoría de cambios
- [ ] Autenticación por usuario

---

## 📞 ¿Necesitas Ayuda?

1. **No ves datos:** Genera un ticket/factura en Facturación
2. **La tasa no cambia:** Verifica que sea un número > 0
3. **Error al cargar:** Actualiza la página (Ctrl+R)
4. **Más preguntas:** Consulta la documentación técnica

---

## ✅ Funcionalidades Completadas

- [x] Dashboard con 4 tarjetas de totales
- [x] Totales en Bs y USD
- [x] Gestión de tasa de cambio
- [x] Tabla de movimientos
- [x] Filtros por tipo
- [x] Almacenamiento de datos
- [x] API REST completa
- [x] Diseño responsive
- [x] Integración con menú

---

## 📄 Licencia

Este módulo es parte del sistema de laboratorio clínico.

---

**Creado: 11 de marzo de 2026**  
**Versión: 1.0.0**  
**Estado: ✅ Producción**
