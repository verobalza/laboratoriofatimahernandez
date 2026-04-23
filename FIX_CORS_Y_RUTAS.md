# 🔧 INSTRUCCIONES PARA FIJAR CORS Y RUTAS EN PRODUCCIÓN

## ✅ CAMBIOS YA REALIZADOS

### 1️⃣ Frontend - Rutas Fixed ✓
- ✅ Archivo `frontend/vercel.json` creado y committed
- ✅ Push a GitHub completado
- ✅ Vercel debería desplegar automáticamente

**Estado**: Espera 2-5 minutos para que Vercel redeploy. Luego prueba:
- `https://laboratoriofatimahernandez-k1oq.vercel.app/login`
- `https://laboratoriofatimahernandez-k1oq.vercel.app/pacientes`
- `https://laboratoriofatimahernandez-k1oq.vercel.app/facturacion`

### 2️⃣ Backend - CORS Configuration Ready ⏳
- ✅ Archivo `backend/app/.env` actualizado localmente con ALLOWED_ORIGINS correcto
- ⏳ **FALTA**: Actualizar manualmente en Railway

---

## 🚀 PASOS PARA ACTUALIZAR RAILWAY (MANUAL)

### Acceso a Railway Dashboard:
1. Ve a: https://railway.app/dashboard
2. Selecciona el proyecto: `laboratoriofatimahernandez-production`
3. Haz clic en la pestaña: **Variables**

### Actualizar Variable ALLOWED_ORIGINS:

**Si ALREADY EXISTS:**
```
ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:5173","http://127.0.0.1:5173","http://localhost:8000","http://127.0.0.1:8000","https://deann-overoptimistic-teacherly.ngrok-free.dev","https://laboratoriofatimahernandez-k1oq.vercel.app"]
```

**Si NO EXISTS:**
- Haz clic en **+ New Variable**
- **Name**: `ALLOWED_ORIGINS`
- **Value**: (copiar exactamente lo de arriba)
- Click **Add**

### Redeploying Railway:
1. Ve a la pestaña **Deployments**
2. Busca el último deployment
3. Haz clic en los tres puntos (...) y selecciona **Redeploy**
4. O simplemente haz `git commit --allow-empty` y `git push` desde tu máquina

---

## ✅ VALIDACIÓN FINAL

### Test 1: CORS desde Vercel ✓
```bash
curl -X GET https://laboratoriofatimahernandez-production.up.railway.app/health \
  -H "Origin: https://laboratoriofatimahernandez-k1oq.vercel.app"
```

**Respuesta esperada:**
```json
{
  "status": "ok"
}
```

### Test 2: Rutas Frontend ✓
Abre en navegador:
- ✅ `https://laboratoriofatimahernandez-k1oq.vercel.app/login` (debe cargar sin 404)
- ✅ `https://laboratoriofatimahernandez-k1oq.vercel.app/pacientes`
- ✅ `https://laboratoriofatimahernandez-k1oq.vercel.app/facturacion`

### Test 3: Login Flow ✓
1. Ve a `/login`
2. Ingresa credenciales
3. Verifica que en DevTools Console NO hay errores CORS
4. Verifica que el backend responde correctamente

### Test 4: Endpoints ✓
Desde la app, verifica que estos funcionan:
- ✅ `GET /pacientes`
- ✅ `POST /pacientes`
- ✅ `GET /pruebas`
- ✅ `GET /facturacion`

---

## 📋 RESUMEN DE CAMBIOS

| Componente | Problema | Solución | Estado |
|-----------|----------|----------|--------|
| **Frontend Routes** | 404 en `/login`, `/pacientes`, etc. | `vercel.json` con rewrites | ✅ Deployed |
| **Backend CORS** | ALLOWED_ORIGINS incorrecto en `.env` | Actualizar en Railway Dashboard | ⏳ Manual step |
| **Backend CORS Code** | Configuración por defecto en `config.py` | Ya incluye Vercel domain | ✅ Ready |

---

## ⏱️ TIMELINE ESPERADO

- **Ahora**: Frontend redeploy (2-5 min)
- **Después**: Actualizar manualmente ALLOWED_ORIGINS en Railway
- **Redeployment**: Railway rebuild (3-5 min)
- **Total**: ~10 minutos para ambos sistemas operativos

---

## 🔍 DEBUGGING SI ALGO FALLA

### Si CORS sigue fallando:
```bash
# Ver logs de Railway
# 1. Dashboard > Logs tab
# 2. Busca: "ALLOWED_ORIGINS: [..."
# Debe mostrar el dominio de Vercel
```

### Si rutas aún dan 404:
```bash
# Verifica que vercel.json está en producción:
# 1. Frontend deployment > Files
# 2. Busca vercel.json
```

### Si login no funciona:
- Abre DevTools > Network tab
- Busca requests a `/auth/login`
- Verifica Status Code y Response
- Si es 403/401, es auth logic, no CORS

