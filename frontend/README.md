# Frontend - React + Vite

Frontend de la aplicación Laboratorio desarrollado con React, Vite y React Router.

## Descripción

Este es el frontend de la aplicación, construido con React para proporcionar una interfaz de usuario moderna y reactiva.

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── App.jsx              # Componente principal de la aplicación
│   ├── App.css              # Estilos del componente App
│   ├── main.jsx             # Punto de entrada de React
│   ├── index.css            # Estilos globales
│   ├── pages/               # Páginas de la aplicación
│   │   └── Home.jsx
│   ├── components/          # Componentes reutilizables
│   ├── hooks/               # Custom hooks
│   ├── services/            # Servicios para llamadas a API
│   └── assets/              # Imágenes y otros assets
├── public/                  # Archivos públicos
├── index.html               # HTML principal
├── package.json             # Dependencias y scripts
├── vite.config.js           # Configuración de Vite
└── README.md               # Este archivo
```

## Requisitos Previos

- Node.js 16+
- npm o yarn

## Instalación

1. **Instalar dependencias:**

```bash
npm install
```

o con yarn:

```bash
yarn install
```

## Ejecutar la Aplicación

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

### Build para Producción

```bash
npm run build
```

### Preview de la Build

```bash
npm run preview
```

## Deployment

### Vercel

1. Conectar el repositorio a Vercel
2. Configurar el framework: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Vercel detectará automáticamente la configuración

#### Configuración necesaria para comunicarse con el backend:

Crear un archivo `.env.production` con:

```env
VITE_API_URL=https://tu-backend-railway.up.railway.app
```

Y usarlo en los servicios de la aplicación:

```javascript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Visualiza la construcción de producción localmente
- `npm run lint` - Ejecuta ESLint para revisar el código

## Tecnologías Utilizadas

- **React 18** - Librería de UI
- **Vite** - Herramienta de construcción y servidor de desarrollo
- **React Router 6** - Enrutamiento de la aplicación
- **CSS** - Estilos nativos

## Estructura de Carpetas

- **pages/** - Páginas principales de la aplicación
- **components/** - Componentes reutilizables
- **hooks/** - Custom hooks personalizados
- **services/** - Servicios para comunicación con la API
- **public/** - Archivos estáticos

## Configuración de CORS

La aplicación tiene configurado un proxy en `vite.config.js` que redirige las llamadas a `/api` al backend local.

Para producción, el backend debe tener configurado CORS correctamente:

```python
ALLOWED_ORIGINS = ["https://tu-frontend.vercel.app"]
```

## Desarrollo Futuro

- [ ] Implementar consumo de API
- [ ] Componentes adicionales
- [ ] Gestión de estado (Zustand, Redux, etc.)
- [ ] Validación de formularios
- [ ] Tests unitarios

## Licencia

MIT
