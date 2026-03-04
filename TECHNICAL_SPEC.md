# Especificación Técnica - Laboratorio Fullstack

## Overview

Proyecto fullstack con arquitectura moderna separando backend y frontend en un solo repositorio.

**Fecha de creación:** 4 de marzo de 2026
**Versión inicial:** 1.0.0

## Tecnología

### Backend
- **Framework:** FastAPI 0.104.1
- **Servidor:** Uvicorn 0.24.0
- **Validación:** Pydantic + Pydantic Settings
- **Configuración:** python-dotenv
- **Python:** 3.8+
- **Dependencies:** Ver `backend/requirements.txt`

### Frontend
- **librería UI:** React 18.2.0
- **Bundler:** Vite 5.0.8
- **Routing:** React Router 6.20.0
- **Plugin Vite:** @vitejs/plugin-react 4.2.1
- **Node:** 16+
- **Package Manager:** npm
- **Dependencies:** Ver `frontend/package.json`

## Arquitectura

```
Laboratorio/
├── Backend (FastAPI)
│   ├── API REST
│   ├── Manejo de CORS
│   ├── Modelos Pydantic
│   ├── Servicios de negocio
│   ├── Rutas organizadas
│   └── Utilidades
│
└── Frontend (React + Vite)
    ├── SPA (Single Page Application)
    ├── React Router
    ├── Componentes reutilizables
    ├── Custom hooks
    ├── Servicios API client
    └── Estilos CSS
```

## Comunicación

### Flujo de datos

```
Frontend (React)
    ↓
HTTP Request (Fetch API)
    ↓
Backend (FastAPI)
    ↓
Lógica de negocio (Services)
    ↓
HTTP Response (JSON)
    ↓
Frontend (React)
```

### CORS

**Configurado en:** `backend/app/config.py`

Permitidos por defecto:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:8000`
- `https://*.vercel.app`

## Endpoints Iniciales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Mensaje de bienvenida |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |

## Estructura de Carpetas Detallada

### Backend

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app + endpoints
│   ├── config.py               # Configuración global
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── README.md
│   │   ├── example_routes.py   # Ejemplo de ruta
│   │   └── [nuevas rutas...]
│   ├── models/
│   │   ├── __init__.py
│   │   ├── README.md
│   │   ├── example_models.py   # Ejemplo de modelo
│   │   └── [nuevos modelos...]
│   ├── services/
│   │   ├── __init__.py
│   │   ├── README.md
│   │   ├── example_service.py  # Ejemplo de servicio
│   │   └── [nuevos servicios...]
│   └── utils/
│       ├── __init__.py
│       ├── README.md
│       ├── helpers.py          # Funciones auxiliares
│       └── [nuevas utilidades...]
├── .env.example                # Variables de entorno
├── .gitignore
├── requirements.txt
└── README.md
```

### Frontend

```
frontend/
├── node_modules/               # (creado con npm install)
├── public/
├── src/
│   ├── App.jsx                 # Componente principal
│   ├── App.css                 # Estilos del App
│   ├── main.jsx                # Punto de entrada React
│   ├── index.css               # Estilos globales
│   ├── pages/
│   │   ├── README.md
│   │   ├── Home.jsx            # Página principal
│   │   └── [nuevas páginas...]
│   ├── components/
│   │   ├── README.md
│   │   ├── StatusBadge.jsx     # Componente de ejemplo
│   │   └── [nuevos componentes...]
│   ├── hooks/
│   │   ├── README.md
│   │   ├── useServerHealth.js  # Hook de ejemplo
│   │   └── [nuevos hooks...]
│   └── services/
│       ├── README.md
│       ├── api.js              # Cliente API
│       └── [nuevos servicios...]
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Development Workflow

### 1. Inicialización

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Desarrollo Local

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 3. Testing

```bash
# Backend
pytest backend/

# Frontend
npm test
```

### 4. Build para Producción

**Backend:**
- Railway detecta automáticamente
- Usa Python 3.11

**Frontend:**
```bash
npm run build
# Genera carpeta dist/
```

## Deployment

### Railway (Backend)

1. Conectar GitHub repo
2. Seleccionar rama `main`
3. Railway usa `requirements.txt`
4. Env vars:
   ```
   DEBUG=False
   ALLOWED_ORIGINS=https://dominio-frontend.vercel.app
   ```

### Vercel (Frontend)

1. Conectar GitHub repo
2. Framework: **Vite**
3. Build: `npm run build`
4. Output: `dist`
5. Env vars:
   ```
   VITE_API_URL=https://backend-railway.up.railway.app
   ```

## Variables de Entorno

### Backend (.env)

```env
# App
DEBUG=True
APP_NAME=Laboratorio API

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000

# Database
DATABASE_URL=sqlite:///./test.db
```

### Frontend (.env)

```env
# API
VITE_API_URL=http://localhost:8000
VITE_DEBUG=true
```

## Seguridad

- [x] CORS configurado
- [x] Variables de entorno separadas
- [ ] Autenticación (próximo paso)
- [ ] Rate limiting (próximo paso)
- [ ] HTTPS en producción (próximo paso)
- [ ] Validación de entrada (próximo paso)

## Performance

- Vite: Fast dev server + optimized build
- FastAPI: Alta performance con async/await
- CORS caché en navegador
- API proxy en dev (vite.config.js)

## Monitoreo

Health check endpoints:
- Backend: `GET /health`
- Frontend: Página visible en navegador

## Escalabilidad Futura

- Agregar WebSockets si es necesario
- Implementar caché (Redis)
- Base de datos relacional
- Autenticación JWT
- Rate limiting
- Logging centralizado
- Tests automatizados
- CI/CD pipeline

## Documentación

- [README.md](README.md) - Overview del proyecto
- [DEVELOPMENT.md](DEVELOPMENT.md) - Guía de desarrollo
- [backend/README.md](backend/README.md) - Docs del backend
- [frontend/README.md](frontend/README.md) - Docs del frontend
- [backend/app/routes/README.md](backend/app/routes/README.md)
- [backend/app/models/README.md](backend/app/models/README.md)
- [backend/app/services/README.md](backend/app/services/README.md)
- [backend/app/utils/README.md](backend/app/utils/README.md)
- [frontend/src/pages/README.md](frontend/src/pages/README.md)
- [frontend/src/components/README.md](frontend/src/components/README.md)
- [frontend/src/hooks/README.md](frontend/src/hooks/README.md)
- [frontend/src/services/README.md](frontend/src/services/README.md)

## Licenses

MIT

## Contacto / Soporte

Documentación en los archivos README de cada carpeta.
