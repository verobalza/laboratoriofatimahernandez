# 🚀 Guía Rápida - Registro Financiero

## Acceso al Módulo

### Desde la interfaz
1. Haz clic en el menú hamburguesa (≡)
2. Selecciona "Registro financiero" (💰)
3. Se abrirá la página de Registro Financiero

### URL directa
```
http://localhost:5173/registro-financiero
```

---

## 📊 Entender el Dashboard

### 4 Tarjetas de Totales

Cada tarjeta muestra:

#### 1️⃣ Total del Día
- Ingresos de hoy
- Muestra: Bs | USD

#### 2️⃣ Total de la Semana
- Ingresos de los últimos 7 días
- Muestra: Bs | USD

#### 3️⃣ Total del Mes
- Ingresos del mes actual
- Muestra: Bs | USD

#### 4️⃣ Total del Año
- Ingresos del año actual
- Muestra: Bs | USD

---

## 💱 Gestionar la Tasa de Cambio

### Ubicación
Botón azul en la esquina superior derecha:
```
💱 Tasa: 1 USD = Bs 45.0000
```

### Pasos
1. Haz clic en el botón "💱 Tasa"
2. Se abrirá un modal
3. Ingresa la nueva tasa (ej: 50.5)
4. Haz clic en "Actualizar Tasa"
5. La página se recargará con los nuevos valores

### Ejemplo
```
Tasa actual: 1 USD = Bs 45.0000
Nueva tasa: 1 USD = Bs 50.5000
```

---

## 📋 Tabla de Movimientos

### Qué se muestra
- **Fecha**: Cuándo se registró
- **Tipo**: Ticket o Factura
- **Monto (Bs)**: En bolívares
- **Monto (USD)**: En dólares

### Filtros
Encima de la tabla hay 3 botones:
- **Todos**: Muestra todos los movimientos
- **Tickets**: Solo tickets (sin IVA)
- **Facturas**: Solo facturas (con IVA en documento, pero sin incluir en financiero)

### Ejemplo de Movimiento
```
Fecha: 11/03/2026
Tipo: TICKET
Monto (Bs): 1,500,000.00
Monto (USD): 32.97
```

---

## 🔢 Cálculos Importantes

### Conversión Bs → USD
```
Monto en USD = Monto en Bs ÷ Tasa de Cambio

Ejemplo:
Monto Bs: 1,500,000
Tasa: 45
Monto USD: 1,500,000 ÷ 45 = 33,333.33
```

### Sin IVA
```
Los totales financieros NO incluyen IVA
✓ Se registra: Monto de exámenes
✗ NO se registra: IVA de la factura
```

### Períodos
```
Diario:   Movimientos de HOY
Semanal:  Movimientos de los últimos 7 días
Mensual:  Movimientos del mes actual
Anual:    Movimientos del año actual
```

---

## ⚙️ Flujo de Datos

### Cuando se genera un Ticket

```
1. Usuario selecciona exámenes
2. Sistema suma: $1,500,000 Bs
3. Genera ticket (sin IVA)
4. Registra movimiento:
   - paciente_id: pac-123
   - monto_bs: 1,500,000
   - monto_usd: 33,333.33
   - tipo: "ticket"
5. El Registro Financiero se actualiza automáticamente
```

### Cuando se genera una Factura

```
1. Usuario selecciona exámenes
2. Sistema suma: $1,500,000 Bs
3. Calcula IVA: 1,500,000 × 0.16 = $240,000
4. Factura total: $1,740,000 (con IVA)
5. Pero registra movimiento SIN IVA:
   - monto_bs: 1,500,000
   - tipo: "factura"
6. El registro financiero solo ve: $1,500,000
```

---

## 🔄 Integración con Otros Módulos

### Pruebas 🧪
Cada prueba tiene 2 precios:
```
- Precio en Bs: 50,000 (ingresado)
- Precio en USD: 1,111.11 (calculado automáticamente)
```

Al cambiar la tasa, todos los precios en USD se recalculan.

### Facturación 💳
Al generar Ticket o Factura:
```
1. Se suma el total de exámenes
2. Se registra automáticamente en Registro Financiero
3. Se categoriza como "ticket" o "factura"
```

---

## 📱 Vista Móvil

En dispositivos pequeños (< 768px):
- Las tarjetas se apilan verticalmente
- La tabla se hace horizontal scrollable
- El modal se adapta al tamaño
- Los filtros se organizan en columnas

---

## 🐛 Resolución de Problemas

### "No aparecen movimientos"
✓ Genera un ticket o factura en el módulo de Facturación
✓ El movimiento debe aparecer en la tabla

### "La tasa no cambia"
✓ Cerciórate de ingresar un número válido > 0
✓ Haz clic en "Actualizar Tasa"
✓ Espera a que se recargue

### "Los totales no coinciden"
✓ Verifica que solo haya movimientos del período
✓ Recuerda que el cálculo es: suma de movimientos ÷ cantidad
✓ Verifica la tasa de cambio actual

### "El módulo no carga"
✓ Actualiza la página
✓ Verifica que el backend esté funcionando
✓ Revisa la consola (F12) para ver errores

---

## 💾 Datos Almacenados

Los datos se guardan en JSON en el servidor:

### `tasa_cambio.json`
La tasa actual de cambio

### `movimientos_financieros.json`
Histórico de todos los movimientos

Estos archivos se crean automáticamente la primera vez que se usan.

---

## 📞 Dónde Encontrar Más Información

- **Detalles técnicos**: `INTEGRACION_FINANCIERO.md`
- **Resumen completo**: `RESUMEN_FINANCIERO.md`
- **Código fuente**: 
  - Backend: `backend/app/routes/financiero.py`
  - Frontend: `frontend/src/pages/RegistroFinanciero.jsx`

---

## ✅ Checklist de Uso

- [ ] Accedí al módulo desde el menú
- [ ] Vi las 4 tarjetas de totales
- [ ] Probé cambiar la tasa de cambio
- [ ] Vi la tabla de movimientos
- [ ] Probé los filtros (Todos, Tickets, Facturas)
- [ ] Verifiqué los cálculos en USD
- [ ] Generé un movimiento (Ticket/Factura) y lo ví en la tabla

**¡Si todo funciona, estás listo para usar el Registro Financiero!**
