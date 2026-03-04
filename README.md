# Laboratorio - Proyecto Fullstack

Repositorio fullstack con backend en FastAPI y frontend en React + Vite.

## Estructura del Proyecto

```
laboratorio/
├── backend/
│   ├── app/
│   │   ├── main.py              # Aplicación FastAPI principal
│   │   ├── config.py            # Configuración
│   │   ├── routes/              # Rutas de la API
│   │   ├── models/              # Modelos de datos
│   │   ├── services/            # Lógica de negocio
│   │   └── utils/               # Utilidades
│   ├── requirements.txt          # Dependencias Python
│   └── README.md                # Documentación backend
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Componente principal
│   │   ├── main.jsx             # Punto de entrada React
│   │   ├── pages/               # Páginas
│   │   ├── components/          # Componentes
│   │   ├── hooks/               # Custom hooks
│   │   └── services/            # Servicios API
│   ├── public/                  # Assets estáticos
│   ├── index.html               # HTML principal
│   ├── package.json             # Dependencias Node
│   ├── vite.config.js           # Configuración Vite
│   └── README.md                # Documentación frontend
│
└── README.md                    # Este archivo
```

## Inicio Rápido

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # En Windows
source venv/bin/activate  # En macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Servidor en: `http://localhost:8000`
Docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación en: `http://localhost:5173`

## Deployment

### Backend - Railway

1. Push el código a GitHub
2. Conectar repositorio a Railway
3. Railway detectará `requirements.txt` automáticamente
4. Variables de entorno (si es necesario)

### Frontend - Vercel

1. Push el código a GitHub
2. Conectar repositorio a Vercel
3. Configurar build command: `npm run build`
4. Output directory: `dist`

## API Endpoints

- `GET /health` - Health check
- `GET /` - Mensaje de bienvenida

## Requisitos

- Python 3.8+
- Node.js 16+
- npm o yarn

## Tecnologías

**Backend:**
- FastAPI
- Uvicorn
- Pydantic

**Frontend:**
- React 18
- Vite
- React Router 6

## Siguiente Pasos

1. Implementar rutas y servicios
2. Conectar base de datos
3. Agregar autenticación
4. Crear componentes de UI
5. Escribir tests

## Licencia

MIT
