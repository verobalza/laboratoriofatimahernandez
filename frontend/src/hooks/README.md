# Frontend Custom Hooks Documentation

## Estructura

Los custom hooks se organizan en esta carpeta. Los hooks son funciones JavaScript reutilizables.

## Hooks disponibles

### useServerHealth
Verifica el estado de salud del servidor.

```jsx
import { useServerHealth } from '../hooks/useServerHealth'

export default function Component() {
  const { isHealthy, loading, error } = useServerHealth()
  
  if (loading) return <p>Verificando...</p>
  if (error) return <p>Error: {error}</p>
  
  return <p>{isHealthy ? 'Servidor online' : 'Servidor offline'}</p>
}
```

## Crear un nuevo custom hook

1. **Crear archivo** (ej: `useFetch.js`):

```javascript
import { useState, useEffect } from 'react'

export function useFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
  }, [url])

  return { data, loading, error }
}
```

2. **Usar en componentes**:

```jsx
import { useFetch } from '../hooks/useFetch'

export default function Page() {
  const { data, loading, error } = useFetch('/api/data')
  
  if (loading) return <p>Loading...</p>
  if (error) return <p>Error</p>
  
  return <pre>{JSON.stringify(data)}</pre>
}
```

## Mejores prácticas

- Lógica compleja en custom hooks
- Nombres que comienzan con "use"
- Retornar un objeto o array bien estructurado
- Documentar parámetros y retorno con JSDoc
