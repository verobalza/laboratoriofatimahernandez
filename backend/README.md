# Backend - FastAPI

API desarrollada con FastAPI para el proyecto Laboratorio fullstack.

## Descripción

Este es el backend de la aplicación, construido con FastAPI. Proporciona los endpoints necesarios para la comunicación con el frontend.

## Estructura del Proyecto

```
backend/
├── app/
│   ├── main.py          # Configuración principal de FastAPI
│   ├── config.py        # Configuración de la aplicación
│   ├── routes/          # Rutas de la API
│   ├── models/          # Modelos de datos
│   ├── services/        # Lógica de negocio
│   └── utils/           # Utilidades
├── requirements.txt     # Dependencias de Python
└── README.md           # Este archivo
```

## Requisitos Previos

- Python 3.8+
- pip

## Instalación

1. **Crear un entorno virtual:**

```bash
python -m venv venv
```

2. **Activar el entorno virtual:**

En Windows:
```bash
venv\Scripts\activate
```

En macOS/Linux:
```bash
source venv/bin/activate
```

3. **Instalar dependencias:**

```bash
pip install -r requirements.txt
```

## Ejecutar la Aplicación

### Desarrollo

```bash
uvicorn app.main:app --reload
```

La API estará disponible en: `http://localhost:8000`

### Documentación Interactiva

Swagger UI: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

### Producción (con Gunicorn)

```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

## Endpoints Disponibles

- `GET /health` - Verifica que el servidor está funcionando
- `GET /` - Mensaje de bienvenida

### Pacientes
- `POST /pacientes` - Crear paciente (nombre, apellido, edad, telefono obligatorios)
- `GET /pacientes` - Listar pacientes; acepta query `search` para filtrar por nombre, apellido o teléfono
- `GET /pacientes/{id}` - Obtener ficha completa de un paciente
- `PUT /pacientes/{id}` - Actualizar datos del paciente

### Pruebas (Catálogo de pruebas disponibles)
- `POST /pruebas` - Crear prueba de laboratorio
- `GET /pruebas` - Listar todas las pruebas
- `GET /pruebas?search=` - Buscar prueba por nombre
- `GET /pruebas/{id}` - Obtener datos de una prueba
- `PUT /pruebas/{id}` - Actualizar prueba

### Exámenes (Resultados de pruebas para pacientes)
- `POST /examenes` - Registrar examen individual
- `POST /examenes/batch` - Registrar múltiples exámenes a la vez (array)
- `GET /examenes` - Listar todos los exámenes
- `GET /examenes?fecha=YYYY-MM-DD` - Listar exámenes de una fecha específica
- `GET /examenes/count?fecha=YYYY-MM-DD` - Contar exámenes de un día
- `GET /examenes/paciente/{paciente_id}` - Listar exámenes de un paciente
- `GET /examenes/paciente/{paciente_id}?fecha=` - Exámenes de paciente en fecha específica
- `PUT /examenes/{id}` - Actualizar resultados u observaciones


## Deployment

### Railway

1. Conectar el repositorio a Railway
2. Configurar la variable de entorno `PYTHON_VERSION` en `3.11`
3. Railway detectará automáticamente `requirements.txt`
4. El comando de start será: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Variables de Entorno

Crear un archivo `.env` en la raíz del backend con las siguientes variables:

```env
DEBUG=False
ALLOWED_ORIGINS=https://tu-frontend.vercel.app,https://otro-dominio.com
DATABASE_URL=sqlite:///./test.db
```

## Desarrollo Futuro

- [ ] Conectar a base de datos
- [ ] Implementar autenticación
- [ ] Crear modelos y servicios
- [ ] Tests unitarios e integración

## Licencia

MIT
