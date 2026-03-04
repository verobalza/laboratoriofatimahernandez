# 🚀 Guía de Despliegue a Producción

Este documento te guía paso a paso para desplegar tu aplicación en producción usando **Railway** (backend) y **Vercel** (frontend).

## 📋 Pre-requisitos

- [x] GitHub con el código pusheado
- [x] Cuenta Railway.app
- [x] Cuenta Vercel
- [x] Proyecto Supabase con credenciales de producción
- [x] Tabla `usuarios` creada en Supabase

---

## 🔧 PASO 1: Configurar Variables de Entorno

### A) Backend (Railway)

**Actualizar `backend/.env` con credenciales de PRODUCCIÓN:**

```env
SUPABASE_URL=https://tu-proyecto-prod.supabase.co
SUPABASE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...  # Tu Service Role Secret
JWT_SECRET=tu-secret-super-seguro-minimo-32-caracteres-aleatorio
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
DEBUG=False
```

**⚠️ IMPORTANTE:**
- Usa diferentes credenciales de Supabase para DEV vs PROD
- El JWT_SECRET debe ser aleatorio y seguro (mínimo 32 caracteres)
- DEBUG=False en producción

### B) Frontend (Vercel)

**Actualizar `frontend/.env.production`:**

```env
VITE_API_URL=https://tu-backend-railway.up.railway.app
```

(Reemplaza con la URL real de tu backend en Railway)

---

## 📤 PASO 2: Hacer Push a GitHub

```bash
# En la raíz del proyecto
git add .
git commit -m "Preparar para producción: Railway + Vercel"
git push origin main
```

---

## 🚂 PASO 3: Desplegar Backend en Railway

### 1. Conectar Repositorio

1. Ve a [Railway.app](https://railway.app)
2. Click en "Create New Project" → "Deploy from GitHub"
3. Autoriza a Railway y selecciona tu repositorio
4. Selecciona la rama `main`

### 2. Configurar Variables de Entorno

1. En Railway, ve a "Variables"
2. Agrega estas variables:

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | Tu URL de Supabase producción |
| `SUPABASE_KEY` | Tu Service Role Secret |
| `JWT_SECRET` | Tu secret seguro |
| `JWT_ALGORITHM` | HS256 |
| `JWT_EXPIRATION_HOURS` | 24 |
| `DEBUG` | False |

### 3. Configurar Deploy

1. En "Settings" → "Root Directory": `backend`
2. Railway detectará automáticamente que es Python (Procfile)
3. Click "Deploy" - Railway hará el build automático

### 4. Copiar URL del Backend

Una vez deployado, Railway te dará una URL como:
```
https://tune-hospital-backend.up.railway.app
```

**Esta URL es importante para el paso siguiente.**

---

## 🎨 PASO 4: Desplegar Frontend en Vercel

### 1. Conectar Repositorio

1. Ve a [Vercel.com](https://vercel.com)
2. Click en "Add New" → "Project"
3. Importa tu repositorio GitHub
4. Selecciona la rama `main`

### 2. Configurar Proyecto

**Settings del proyecto:**
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (ya está configurado)
- **Output Directory**: `dist`

### 3. Agregar Variables de Entorno

En "Environment Variables", agrega:

```
VITE_API_URL = https://tu-backend-railway.up.railway.app
```

### 4. Desplegar

Click "Deploy" - Vercel hará el build automático y tu frontend estará en vivo en:
```
https://tu-proyecto.vercel.app
```

---

## 🔒 PASO 5: Actualizar CORS en Backend

Si recibe errores de CORS, actualiza `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Dev
        "https://tu-proyecto.vercel.app"  # Prod (tu dominio Vercel)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✅ PASO 6: Verificar Despliegue

### 1. Verificar Backend Alive

Abre en el navegador:
```
https://tu-backend-railway.up.railway.app/health
```

Deberías ver:
```json
{"status": "ok"}
```

### 2. Verificar Frontend

Abre:
```
https://tu-proyecto.vercel.app
```

Deberías ver tu Home page.

### 3. Probar Flujo Completo

1. Ve a `/register`
2. Crea una nueva cuenta
3. Deberías ver el success screen
4. Ve a `/login`
5. Inicia sesión
6. Deberías ver el Dashboard con tu menú hamburguesa

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Error: "Cannot register user"
**Causa**: Credenciales de Supabase inválidas o tabla no creada
**Solución**: 
- Verifica SUPABASE_URL y SUPABASE_KEY en Railway
- Asegúrate que la tabla `usuarios` existe en Supabase
- Revisa logs en Railway: Settings → Logs

### Error: "API not found"
**Causa**: Frontend apunta a URL backend incorrecta
**Solución**:
- En Vercel, verifica VITE_API_URL
- En navegador, abre DevTools → Network y ve qué URL está siendo llamada
- Debe ser `https://tu-backend-railway.up.railway.app/auth/...`

### Error: CORS
**Causa**: Dominio Vercel no está en allow_origins del backend
**Solución**: 
- Actualiza backend/app/main.py con tu dominio Vercel
- Re-deploya en Railway

---

## 📚 Comandos Útiles

```bash
# Ver logs del backend en Railway
railway logs

# Redeploy sin cambios (si necesitas)
git commit --allow-empty -m "Trigger redeploy"
git push

# Build local del frontend para probar
cd frontend
npm run build
npm run preview
```

---

## 🎉 Siguiente Paso

Una vez en producción:
- Usa dominio personalizado (⚙️ en Vercel/Railway)
- Configura HTTPS (automático en ambas plataformas)
- Monitorea logs y errores
- Configura respaldos automatizados en Supabase

**¡Tu aplicación está lista para usuarios reales! 🚀**
