# 🚀 SETUP RÁPIDO - SUPABASE + BACKEND + FRONTEND

## ❌ EL PROBLEMA: Error "Error al registrarse" aunque envía datos válidos

### Causa raíz:
**El backend `.env` no tiene `SUPABASE_URL` y `SUPABASE_KEY`**, así que cuando intenta conectar a Supabase, falla silenciosamente.

---

## ✅ SOLUCIÓN PASO A PASO

### **PASO 1: Obtener Credenciales de Supabase**

1. Abre [https://supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto
3. Ve a **Settings** → **API** 
4. Copia estos valores:
   - ✅ `URL` → Este es `SUPABASE_URL`
   - ✅ `Service Role Secret` → Este es `SUPABASE_KEY` (usa el secret, NO la anon key)

**Ejemplo** (NO USES ESTOS, SON FICTICIOS):
```
SUPABASE_URL=https://xyzabc.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### **PASO 2: Configurar Backend (.env)**

1. Abre `backend/.env` (ya fue creado)
2. Reemplaza los valores ficticios con los reales:

```bash
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_KEY=eyJ0eXA... (el service role secret)
JWT_SECRET=mi-secreto-super-seguro-123
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
DEBUG=True
```

3. **Guarda el archivo**

---

### **PASO 3: Verificar que la tabla `usuarios` existe en Supabase**

En la consola de Supabase:

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

```sql
-- tabla de pacientes
CREATE TABLE pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  edad INT NOT NULL,
  telefono TEXT NOT NULL,
  direccion TEXT,
  sexo TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pacientes_nombre ON pacientes(nombre);
CREATE INDEX idx_pacientes_apellido ON pacientes(apellido);
CREATE INDEX idx_pacientes_telefono ON pacientes(telefono);

ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

-- tabla de pruebas (catálogo de pruebas disponibles)
CREATE TABLE pruebas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_prueba TEXT NOT NULL UNIQUE,
  unidad_medida TEXT NOT NULL,
  tipo_muestra TEXT NOT NULL,
  valor_referencia_min FLOAT,
  valor_referencia_max FLOAT,
  descripcion TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pruebas_nombre ON pruebas(nombre_prueba);

ALTER TABLE pruebas ENABLE ROW LEVEL SECURITY;

-- tabla de exámenes (resultados de pruebas para pacientes)
CREATE TABLE examenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  prueba_id UUID REFERENCES pruebas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  resultado TEXT,
  observaciones TEXT,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_examenes_paciente ON examenes(paciente_id);
CREATE INDEX idx_examenes_prueba ON examenes(prueba_id);
CREATE INDEX idx_examenes_fecha ON examenes(fecha);

ALTER TABLE examenes ENABLE ROW LEVEL SECURITY;
```
  fecha DATE NOT NULL,
  creado_en TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_examenes_paciente ON examenes(paciente_id);
CREATE INDEX idx_examenes_nombre ON examenes(nombre);

ALTER TABLE examenes ENABLE ROW LEVEL SECURITY;
```

CREATE INDEX idx_usuarios_email ON usuarios(email);

-- Permitir acceso
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
```

---

### **PASO 4: Reiniciar el Backend**

```bash
# En la terminal donde corre uvicorn:
# Presiona Ctrl+C para detener
# Luego:
uvicorn app.main:app --reload --port 8000
```

Deberías ver:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### **PASO 5: Frontend ya está listo**

El archivo `frontend/.env.local` ya fue creado con:
```
VITE_API_URL=http://localhost:8000
```

---

## 🧪 PROBAR AHORA

### **1. Abre en tu navegador:**
```
http://localhost:5173
```

### **2. Clic en "Regístrate"**

### **3. Completa el formulario:**
```
Nombre: Juan
Apellido: Pérez
Correo: juan@example.com
Contraseña: TestPass@123
```

✅ Requisitos de contraseña:
- 8+ caracteres
- Al menos 1 mayúscula
- Al menos 1 signo de puntuación (!@#$%...)

### **4. Clic en "Registrarse"**

#### 🎉 Si funcionó, verás:
```
✨ ¡Éxito!
Tu cuenta ha sido creada correctamente.
Ya puedes iniciar sesión con tu correo y contraseña.

[Botón: Ir a Iniciar Sesión]
```

#### ❌ Si sigue errando:
1. Abre DevTools (F12)
2. Pestaña **Console**
3. Haz clic en "Registrarse" de nuevo
4. Copia el error completo y compartelo

---

## 🔍 DEBUGGING (Si sigue errando)

### **En DevTools → Network:**
1. Haz clic en "Registrarse"
2. Busca POST `/auth/register`
3. Click en ese request
4. Pestaña **Response** → ¿Qué ves?

**Posibles respuestas y soluciones:**
- `{"detail": "SUPABASE_URL y SUPABASE_KEY deben estar configurados"}` 
  → Falta configurar `.env` del backend
- `500 Internal Server Error`
  → Error de Supabase (URL o KEY incorrectos)
- `201 Created + {"message": "...", "user": {...}}`
  → ✅ FUNCIONA CORRECTAMENTE

### **En DevTools → Application:**
- Local Storage
- Busca `access_token` y `user`
- Si los ves después de login, ✅ todo funciona

---

## 📋 CHECKLIST

- [ ] Obtuve credenciales de Supabase (URL + Service Role Secret)
- [ ] Actualicé `backend/.env` con valores reales
- [ ] Creé tabla `usuarios` en Supabase
- [ ] Reinicié el backend (uvicorn)
- [ ] Frontend tiene `.env.local` con VITE_API_URL
- [ ] Probé registro en http://localhost:5173/register
- [ ] Vi la pantalla de éxito ✅
- [ ] Hice login y llegué a /dashboard
- [ ] Vi el menú hamburguesa (arriba-derecha)

---

## ⚡ TL;DR (Resumen Rápido)

1. **Backend `.env`** → Agrega SUPABASE_URL y SUPABASE_KEY reales
2. **Supabase** → Crea tabla `usuarios` si no existe
3. **Reinicia** → Ctrl+C en uvicorn, luego `npm run dev` en frontend
4. **Prueba** → http://localhost:5173/register
5. **Verifica** → DevTools → Console para ver logs

Una vez que SUPABASE_URL y SUPABASE_KEY estén configurados, todo debería funcionar. 🎉

---

## 🆘 Aún sigue errando?

Dime:
1. ¿Qué error específico ves en la consola (DevTools)?
2. ¿Cuál es la respuesta del server en Network tab?
3. ¿Los valores de SUPABASE_URL y SUPABASE_KEY son válidos?

Con eso podré diagnosticar el problema real. 🔧
