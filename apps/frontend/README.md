# 🌐 Línea Digital — Frontend

> Sitio web corporativo de Línea Digital construido con Astro, React y TailwindCSS.

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 📋 Descripción

Frontend ultra-rápido que combina la generación estática de Astro con componentes interactivos de React. Se comunica con el backend para funcionalidades dinámicas.

### ¿Por qué Astro?

| Característica | Beneficio |
|----------------|-----------|
| **Islands Architecture** | Solo se hidrata el JavaScript necesario |
| **SSG/SSR Híbrido** | SEO perfecto + contenido dinámico |
| **View Transitions** | Navegación fluida tipo SPA |
| **Zero JS por defecto** | Páginas estáticas ultrarrápidas |

---

## 🏗️ Estructura del Proyecto

```
src/
├── assets/                # Imágenes y recursos estáticos
├── components/
│   ├── features/          # Componentes de funcionalidad (planes, promos)
│   ├── sections/          # Secciones de página (Hero, Newsletter, etc.)
│   └── ui/                # Componentes reutilizables (botones, cards)
├── layouts/
│   └── BaseLayout.astro   # Layout principal con head, nav, footer
├── lib/
│   └── chatbot-client.ts  # Cliente del chatbot (connect to backend)
├── pages/
│   ├── index.astro        # Página principal
│   ├── personas.astro     # Planes para personas
│   ├── empresas.astro     # Planes empresariales
│   ├── contacto.astro     # Formulario de contacto
│   └── ...
├── services/
│   └── contentful.ts      # Cliente de Contentful (para SSG)
├── styles/
│   └── global.css         # Estilos globales + Tailwind
└── types/                 # TypeScript definitions
```

---

## 🔌 Integración con Backend

El frontend se comunica con el backend NestJS para:

| Funcionalidad | Endpoint Backend | Archivo Frontend |
|---------------|------------------|------------------|
| **Chatbot** | `POST /chat` | `lib/chatbot-client.ts` |
| **Contacto** | `POST /email/send` | `pages/contacto.astro` |
| **Newsletter** | `POST /email/subscribe` | `components/sections/Newsletter.astro` |

### Contentful (Datos de Planes)

El frontend **también** usa Contentful directamente para:
- Generar páginas estáticas en Build Time (SSG)
- Renderizar planes y promociones sin depender del backend

Esto permite:
- ✅ Páginas pre-renderizadas = máximo rendimiento
- ✅ SEO perfecto (HTML generado en servidor)
- ✅ Funciona aunque el backend esté caído

---

## ⚙️ Variables de Entorno

Crea el archivo `.env` en la raíz del frontend (`apps/frontend/.env`):

```env
# URL del Backend API
PUBLIC_API_URL=http://localhost:3000

# Contentful (para SSG - NO expuestas al cliente)
CONTENTFUL_SPACE_ID="tu_space_id"
CONTENTFUL_ACCESS_TOKEN="tu_access_token"

# Google (públicas, pueden verse en cliente)
GOOGLE_API_KEY="tu_maps_api_key"
GOOGLE_PLACE_ID="tu_place_id"
```

> ⚠️ **Nota:** Las variables sin prefijo `PUBLIC_` solo están disponibles en el servidor (Astro SSR/SSG), nunca llegan al navegador.

---

## 🛠️ Scripts

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Preview del build
npm run preview
```

---

## 🎨 Componentes Destacados

### Chatbot (`lib/chatbot-client.ts`)
Widget flotante que se comunica con el backend para respuestas de IA.

### Newsletter (`components/sections/Newsletter.astro`)
Formulario de suscripción con feedback visual dinámico:
- ✅ Verde = Nuevo suscriptor
- 🟠 Ámbar = Ya estaba registrado

### Planes (`components/features/plans/`)
Cards de planes Telcel con datos de Contentful, ordenados por precio.

---

## 📦 Dependencias Principales

| Paquete | Propósito |
|---------|-----------|
| `astro` | Framework SSG/SSR |
| `@astrojs/react` | Integración React |
| `@astrojs/tailwind` | Integración TailwindCSS |
| `@astrojs/node` | Adapter SSR |
| `contentful` | Cliente CMS (solo servidor) |

---

## 🚀 Deploy

### Cloudflare Pages (Recomendado)
```bash
npm run build
# Output en dist/
```

### Node.js (SSR)
```bash
npm run build
node dist/server/entry.mjs
```

---

## 📄 Licencia

Propiedad de **Línea Digital del Sureste**.
