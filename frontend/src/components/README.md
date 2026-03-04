# Frontend Components Documentation

## Estructura

Los componentes reutilizables se organizan en esta carpeta.

## Componentes disponibles

### StatusBadge
Muestra el estado del servidor (online/offline).

```jsx
import { StatusBadge } from '../components/StatusBadge'

export default function Page() {
  return <StatusBadge isHealthy={true} loading={false} />
}
```

## Crear un nuevo componente

1. **Crear archivo** (ej: `Button.jsx`):

```jsx
export function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>
}
```

2. **Usar en páginas**:

```jsx
import { Button } from '../components/Button'

export default function Home() {
  return <Button label="Click me" onClick={() => alert('Clicked!')} />
}
```

## Mejores prácticas

- Componentes simples y reutilizables
- Props bien documentadas
- Default props cuando sea apropiado
- Exportar como named export
