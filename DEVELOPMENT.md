# Guía de Desarrollo Local

## Requisitos Previos

- Python 3.8+
- Node.js 16+
- Git

## Setup Inicial del Backend

```bash
# Navegar a la carpeta backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env (opcional)
# Copiar .env.example a .env y configurar si es necesario
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux
```

## Setup Inicial del Frontend

```bash
# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env (opcional)
# Copiar .env.example a .env
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux
```

## Ejecutar en Desarrollo

### Terminal 1 - Backend

```bash
cd backend

# Activar venv si está desactivado
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**API disponible en:** `http://localhost:8000`
**Documentación:** `http://localhost:8000/docs`

### Terminal 2 - Frontend

```bash
cd frontend

# Iniciar servidor de desarrollo
npm run dev
```

**Frontend disponible en:** `http://localhost:5173`

## Verificación

1. **Backend funcionando:**
   ```bash
   curl http://localhost:8000/health
   # Debe retornar: {"status":"ok"}
   ```

2. **Frontend funcionando:**
   - Abrir `http://localhost:5173` en el navegador
   - Debe mostrar "Frontend funcionando ✨"

3. **API Response:**
   ```bash
   curl http://localhost:8000/
   # Debe retornar: {"message":"Bienvenido a la API de Laboratorio"}
   ```

## Troubleshooting

### Puerto 8000 en uso
```bash
# En Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# En macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Puerto 5173 en uso
```bash
# En Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# En macOS/Linux
lsof -ti:5173 | xargs kill -9
```

### ModuleNotFoundError en Python
- Verificar que el entorno virtual está activado
- Verificar que `requirements.txt` está actualizado
- Reinstalar: `pip install -r requirements.txt --force-reinstall`

### npm install falla
- Limpiar caché: `npm cache clean --force`
- Borrar `node_modules`: `rm -rf node_modules package-lock.json`
- Reinstalar: `npm install`

## Variables de Entorno

### Backend (.env)
```env
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000
DATABASE_URL=sqlite:///./test.db
APP_NAME=Laboratorio API
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
VITE_DEBUG=true
```

## Próximos Pasos

1. ✅ Estructura base lista
2. 🔄 Personalizar componentes
3. 🔄 Implementar rutas de API
4. 🔄 Conectar base de datos
5. 🔄 Agregar autenticación
6. 🔄 Deployment a Railway (backend) y Vercel (frontend)
