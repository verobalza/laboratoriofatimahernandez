# Fix: Serialización de fechas en Exámenes API

## Problema
Al intentar guardar exámenes en lote (`POST /examenes/batch`) o listar PDFs (`GET /examenes/pdf`), el servidor retornaba error 500:
```
ERROR: Object of type date is not JSON serializable
```

## Causa
Los modelos Pydantic definían campos `fecha` como tipo `date`. Cuando estos modelos se convertían a diccionarios con `.dict()` para enviar a Supabase, los objetos `date` no podían serializarse a JSON.

## Solución Implementada

### 1. Agregar Field Serializers a los Modelos (`examen_models.py`)
Se agregó el decorador `@field_serializer` a los modelos que contienen fechas:
- `ExamenBase` (que heredan `ExamenCreate` y `ExamenOut`)
- `ExamenPDFBase` (que heredan `ExamenPDFCreate` y `ExamenPDFOut`)

El serializer convierte automáticamente objetos `date` a strings en formato ISO (YYYY-MM-DD).

### 2. Actualizar Endpoints para Convertir Fechas Explícitamente
Se modificaron tres endpoints para asegurar que las fechas se convierten a strings antes de enviar a Supabase:

- `POST /examenes/` - Crear examen individual
- `POST /examenes/batch` - Crear exámenes en lote  
- `POST /examenes/pdf` - Crear registro de PDF

Cada uno ahora hace:
```python
data = model.model_dump()
if isinstance(data.get('fecha'), date):
    data['fecha'] = data['fecha'].isoformat()
```

## Pruebas
El cambio ha sido validado para que:
1. Las fechas se reciban correctamente desde el frontend (como strings YYYY-MM-DD)
2. Pydantic las convierта a objetos `date` para validación
3. Al enviar a Supabase, se conviertan de vuelta a strings
4. Las respuestas JSON serializen correctamente las fechas

## Archivos Modificados
- `backend/app/models/examen_models.py` - Agregados field_serializers
- `backend/app/routes/examenes.py` - Actualizados 3 endpoints
