# Guía: Agregar Campo tipo_prueba en Supabase

## Problema
El código ya está listo para soportar serología, pero necesitamos agregar la columna `tipo_prueba` a la tabla `pruebas` en Supabase.

---

## Solución: Agregar Columna Manualmente en Supabase UI

### Pasos:

1. **Acceder a Supabase Dashboard**
   - Ir a https://app.supabase.com
   - Seleccionar tu proyecto

2. **Navegar a la tabla de pruebas**
   - En el panel izquierdo, busca "SQL Editor" o "Tables"
   - Abre la tabla "pruebas"

3. **Agregar la columna** (opción recomendada)
   - Click en el botón "+" en la esquina superior derecha de la tabla
   - O, en la sección de columnas, busca "Agregar columna"
   
4. **Configurar la columna:**
   - **Nombre:** `tipo_prueba`
   - **Tipo:** `text` o `varchar(20)`
   - **Default value:** `'numerica'`
   - **Nullable:** ✅ Sí (solo para compatibilidad)
   - **Unique:** ❌ No
   - **Primary key:** ❌ No
   - Presionar "Guardar"

### Alternativa: SQL Directo

Si prefieres usar SQL, ve a "SQL Editor" y ejecuta:

```sql
ALTER TABLE pruebas 
ADD COLUMN tipo_prueba VARCHAR(20) DEFAULT 'numerica';
```

---

## Validación

Después de agregar la columna, verifica:

1. **En Supabase Dashboard:**
   - Abre tabla "pruebas"
   - Verifica que la columna `tipo_prueba` aparezca
   - Verifica que existing records tienen valor `'numerica'`

2. **En la aplicación:**
   - Intenta crear una nueva prueba numérica
   - Intenta crear una prueba de serología
   - Verifica que funcione sin errores

---

## Posibles Errores y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `Column not found` | La columna no existe aún | Ejecutar el script SQL arriba |
| `Invalid enum value` | Valor incorrecto para tipo_prueba | Solo usar `'numerica'` o `'serologia'` |
| `Null value in column` | Prueba vieja sin tipo_prueba | Default automático es `'numerica'` |

---

## Script SQL Completo (respaldo)

Si algo sale mal, puedes usar este script SQL:

```sql
-- Crear tabla de pruebas con tipo_prueba si no existe
CREATE TABLE IF NOT EXISTS pruebas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_prueba VARCHAR(255) NOT NULL,
    tipo_prueba VARCHAR(20) DEFAULT 'numerica',
    unidad_medida VARCHAR(100),
    tipo_muestra VARCHAR(100) NOT NULL,
    valor_referencia_min FLOAT,
    valor_referencia_max FLOAT,
    descripcion TEXT,
    precio_bs FLOAT NOT NULL,
    precio_usd FLOAT,
    grupo_id UUID,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- O, si la tabla ya existe, solo agregar la columna:
ALTER TABLE pruebas 
ADD COLUMN tipo_prueba VARCHAR(20) DEFAULT 'numerica';
```

---

## Notas Importantes

⚠️ **IMPORTANTE:**
- Este cambio solo afecta la base de datos
- No requiere redeploy del código
- No requiere cambios en el frontend
- Es completamente retro-compatible

✅ **Después de hacer esto:**
- Las pruebas existentes automáticamente tendrán `tipo_prueba = 'numerica'`
- El selector de tipo de prueba aparecerá en el UI para crear nuevas pruebas
- Las nuevas pruebas de serología se guardarán correctamente

---

## Verificación Post-Implementación

Para verificar que todo está correctamente, ejecuta esta query en Supabase SQL Editor:

```sql
SELECT 
    nombre_prueba,
    tipo_prueba,
    unidad_medida,
    valor_referencia_min,
    valor_referencia_max
FROM pruebas
LIMIT 5;
```

Deberías ver algo como:
```
nombre_prueba       | tipo_prueba | unidad_medida | valor_referencia_min | valor_referencia_max
--------------------|-------------|---------------|----------------------|---------------------
Glucosa             | numerica    | mg/dL         | 70                   | 100
Colesterol          | numerica    | mg/dL         | 0                    | 200
[Nueva prueba VIH]  | serologia   | (vacío)       | NULL                 | NULL
```

¡Listo! El sistema de serología está completamente operativo.
