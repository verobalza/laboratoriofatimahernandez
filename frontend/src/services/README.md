# Frontend Services Documentation

## Estructura

Los servicios contienen funciones para comunicarse con la API backend.

## Servicios disponibles

### api.js
Funciones para comunicarse con los endpoints del backend.

```javascript
import { api } from '../services/api'

// Health check
const health = await api.healthCheck()
console.log(health.status) // 'ok'

// Información del servidor
const info = await api.getInfo()
console.log(info.message) // 'Bienvenido a la API de Laboratorio'
```

## Crear un nuevo servicio

1. **Crear archivo** (ej: `userService.js`):

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const userService = {
  async getUsers() {
    const response = await fetch(`${API_URL}/api/users`)
    if (!response.ok) throw new Error('Failed to fetch users')
    return await response.json()
  },

  async getUserById(id) {
    const response = await fetch(`${API_URL}/api/users/${id}`)
    if (!response.ok) throw new Error('Failed to fetch user')
    return await response.json()
  },

  async createUser(userData) {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    })
    if (!response.ok) throw new Error('Failed to create user')
    return await response.json()
  }
}
```

2. **Usar en componentes**:

```javascript
import { userService } from '../services/userService'

async function loadUsers() {
  try {
    const users = await userService.getUsers()
    console.log(users)
  } catch (error) {
    console.error(error)
  }
}
```

## Mejores prácticas

- Usar `import.meta.env.VITE_API_URL` para la URL base
- Manejar errores con try/catch
- Documentar cada función
- Exportar como objeto con métodos o como funciones individuales
- Usar `fetch` API o librerías como `axios`
