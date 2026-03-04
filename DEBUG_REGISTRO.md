# 🔍 Diagnóstico: Error "Error al registrar el usuario"

## ❌ El Error

Cuando intentas registrarte, obtienes: **"Error al registrar el usuario"**

## 🎯 Causas Posibles (en orden de probabilidad)

### 1. **Credenciales de Supabase Faltantes o Inválidas** (90% probable)

**Verifica esto primero:**

```bash
# Abre backend/.env
cat backend/.env
```

**Deberías ver:**
```env
SUPABASE_URL=https://tu-proyecto-PROD.supabase.co
SUPABASE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**SI tienes placeholders o está vacío:**
- ❌ **INCORRECTO**: `SUPABASE_URL=https://tu-proyecto.supabase.co`
- ✅ **CORRECTO**: `SUPABASE_URL=https://tu-proyecto-REAL-UUID.supabase.co`

**Solución:**
1. Ve a [supabase.com](https://supabase.com) → Tu Proyecto
2. Settings → API
3. Copia estos valores:
   - `Project URL` → Pega como `SUPABASE_URL`
   - `Service Role Secret` (NO "anon key") → Pega como `SUPABASE_KEY`
4. Guarda el archivo
5. **Reinicia el backend**: Mata uvicorn (Ctrl+C) y corre de nuevo

---

### 2. **Tabla `usuarios` No Existe**

**Verifica esto en Supabase:**

1. Ve a Supabase → SQL Editor
2. Corre esta consulta:
   ```sql
   SELECT * FROM usuarios LIMIT 1;
   ```

**Si recibe error "does not exist":**
- ❌ La tabla no existe

**Solución: Crea la tabla**

1. En SQL Editor, corre esto:
   ```sql
   CREATE TABLE usuarios (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     nombre TEXT NOT NULL,
     apellido TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     creado_en TIMESTAMP DEFAULT now()
   );

   CREATE INDEX idx_usuarios_email ON usuarios(email);
   ```

2. Click "Run"
3. Deberías ver: `✓ Success`

---

### 3. **El Backend No Está Corriendo**

**Verifica:**
```bash
# En otra terminal
curl http://localhost:8000/health
```

**Deberías ver:**
```json
{"status": "ok"}
```

**Si no funciona:**
- Asegúrate que uvicorn esté corriendo: `uvicorn app.main:app --reload --port 8000`

---

## ✅ Checklist de Verificación

- [ ] `backend/.env` tiene valores reales (no placeholders)
- [ ] Tabla `usuarios` existe en Supabase (corrí la query SQL exitosamente)
- [ ] Backend está corriendo (`/health` responde 200)
- [ ] El URL de Supabase en .env coincide con tu proyecto real

---

## 🧪 Test Manual

Una vez que hayas verificado todo:

### 1. Test del Backend Directamente

```bash
# En PowerShell
$body = @{
    nombre = "Test"
    apellido = "User"
    email = "test@example.com"
    password = "Secure123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/auth/register" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

**Resultado esperado:**
- Status: `201 Created`
- Body: Usuario con id, nombre, apellido, email, creado_en

**Si ves error:**
- Cópialo aquí y analiza qué dice exactamente

---

## 📋 Pasos de Recuperación Rápida

Si sigue sin funcionar, haz esto en orden:

1. **Detén el backend**: Ctrl+C en terminal uvicorn
2. **Actualiza .env** con credenciales reales
3. **Reinicia backend**: `cd backend && uvicorn app.main:app --reload`
4. **Prueba directo**: Ejecuta el curl de arriba
5. **Si sigue fallando**: Reviertelo en la sección de abajo

---

## 🚨 Último Recurso: Abrir Logs Detallados

En `backend/app/routes/auth.py`, línea 90, el error imprime el error exacto con:
```
print(f"Error insertando usuario: {str(e)}")
```

**En la terminal donde corre uvicorn deberías ver algo como:**
```
Error insertando usuario: [object has no attribute 'id']
```
O
```
Error insertando usuario: dict() missing 1 required positional argument: 'name'
```

**Si ves esto, cópialo y dime exactamente qué error está en los logs.**

---

## 💡 Resumen

**La mayoría de veces es:**
1. credentials en `.env` no son válidas
2. Tabla `usuarios` no existe

**Haz esto:**
1. Verifica/actualiza `.env`
2. Crea la tabla en Supabase
3. Reinicia backend
4. Intenta registrarte de nuevo

¿Cuál es el error exacto que ves en los logs del backend cuando intentas registrarte? 👀
