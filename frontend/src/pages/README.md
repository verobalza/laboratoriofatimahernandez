# Frontend Pages Documentation

## Estructura

Las páginas son componentes principales que se renderean mediante React Router.

## Páginas disponibles

### Home.jsx
Página principal de la aplicación.

```javascript
import Home from '../pages/Home'
```

## Crear una nueva página

1. **Crear archivo** (ej: `About.jsx`):

```jsx
export default function About() {
  return (
    <div>
      <h1>Acerca de nosotros</h1>
      <p>Información sobre el proyecto...</p>
    </div>
  )
}
```

2. **Registrar en el router** (`App.jsx`):

```jsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}
```

3. **Navegar desde componentes**:

```jsx
import { Link } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </nav>
  )
}
```

## Mejores prácticas

- Una página por archivo
- Importar dentro de App.jsx y registrar en Routes
- Usar `<Link>` para navegación interna
- Usar `useNavigate()` para navegación programática
- Pasar datos entre páginas via URL params o state
