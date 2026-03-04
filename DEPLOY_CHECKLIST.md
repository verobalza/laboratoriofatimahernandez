# ✅ Checklist Pre-Despliegue a Producción

Complete esta lista ANTES de hacer push a GitHub.

## 🔐 Configuración Backend (Railway)

- [ ] Actualicé `backend/.env` con mis credenciales REALES de Supabase producción:
  - [ ] `SUPABASE_URL=https://tu-proyecto-prod.supabase.co` ← URL de tu proyecto
  - [ ] `SUPABASE_KEY=eyJ0eXA...` ← Tu Service Role Secret (NO la anon key)
  - [ ] `JWT_SECRET=...` ← Cambié a un secret aleatorio de 32+ caracteres

- [ ] Verifiqué que existe la tabla `usuarios` en Supabase:
  ```sql
  SELECT * FROM usuarios LIMIT 1;
  ```

- [ ] Creé una cuenta de prueba localmente para verificar que el backend funciona

## 🎨 Configuración Frontend (Vercel)

- [ ] Creé `frontend/.env.production` con la URL temporal:
  ```
  VITE_API_URL=https://tu-backend-railway.up.railway.app
  ```
  (Será reemplazada después de que Railway te dé la URL real)

- [ ] Verifiqué que el build funciona localmente:
  ```bash
  npm run build
  npm run preview
  ```

- [ ] Abrí http://localhost:4173 y probé:
  - [ ] La página de home carga
  - [ ] Puedo hacer click en "Registrarse"
  - [ ] La URL API en DevTools → Network apunta a `http://localhost:8000`

## 📝 Documentación

- [ ] Leí [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) completamente
- [ ] Entiendo el flujo: Railway (backend) + Vercel (frontend)
- [ ] Tengo mis credenciales Supabase listos

## 🚀 Antes de Git Push

- [ ] Volví a leer la sección "PASO 1: Configurar Variables de Entorno" en DEPLOY_GUIDE.md
- [ ] Mi `backend/.env` tiene credenciales reales (no placeholders)
- [ ] Mi `frontend/.env.production` existe (aunque puede ser temporal)
- [ ] El build del frontend se completó: `frontend/dist/` existe

## 📤 Git & Deploy

Una vez hayas completado todo lo anterior:

```bash
# En la raíz del proyecto
git add .
git commit -m "Deploy a producción: Railway + Vercel"
git push origin main
```

Luego:
1. Ve a [Railway.app](https://railway.app) y conecta tu repo
2. Ve a [Vercel.com](https://vercel.com) y conecta tu repo
3. Sigue los pasos en DEPLOY_GUIDE.md

---

## ⚠️ IMPORTANTE

**NO hagas push a GitHub si:**
- No actualizaste `backend/.env` con credenciales reales
- No creaste `frontend/.env.production`
- No probaste localmente que funciona
- No leíste DEPLOY_GUIDE.md

**Si cometes un error:**
- No publiques credenciales en GitHub
- Si por accidente lo hiciste, ve a Supabase y revoca las keys
- Crea nuevas credenciales

---

## ✅ Status

Cuando tengas todo listo, marca cada checkbox y aplica el comando git push. ¡Tu app estará en producción! 🚀
