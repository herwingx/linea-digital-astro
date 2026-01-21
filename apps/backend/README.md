# 🔧 Línea Digital — Backend API

> API corporativa NestJS para servicios de Línea Digital (Distribuidor Telcel).

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

---

## 📋 Descripción

Este backend centraliza toda la lógica de negocio, integraciones con APIs externas y servicios sensibles que no deben exponerse en el cliente.

### ¿Por qué un Backend separado?

| Problema Anterior | Solución con Backend |
|-------------------|----------------------|
| API Keys expuestas en el navegador | Claves guardadas en el servidor, inaccesibles al cliente |
| Rate limits de APIs externas imposibles de controlar | Backend actúa como proxy con caché y throttling |
| Lógica de negocio duplicada entre páginas | Endpoints reutilizables para cualquier cliente |
| Sin documentación de APIs | Swagger automático en `/api/docs` |

---

## 🏗️ Arquitectura de Módulos

```
src/
├── app.module.ts          # Módulo raíz
├── main.ts                # Bootstrap + CORS + Swagger
├── chat/                  # 🤖 Chatbot Lía (Gemini AI)
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   ├── chat.module.ts
│   └── chat.constants.ts  # Knowledge base estática
├── contentful/            # 📦 CMS Headless
│   ├── contentful.controller.ts  # GET /content/*
│   ├── contentful.service.ts
│   └── contentful.module.ts
└── email/                 # 📧 Correo y Newsletter
    ├── email.controller.ts
    ├── email.service.ts   # Nodemailer + Brevo SDK
    └── email.module.ts
```

---

## 🚀 Endpoints Disponibles

### Chat (Gemini AI)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/chat` | Envía mensaje al chatbot Lía |

### Email
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/email/send` | Enviar correo de contacto |
| `POST` | `/email/subscribe` | Suscribirse al newsletter (Brevo) |

### Contentful (CMS)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/content/promos` | Promociones activas |
| `GET` | `/content/planes/libre` | Planes Telcel Libre |
| `GET` | `/content/planes/ultra` | Planes Telcel Ultra |
| `GET` | `/content/planes/internet` | Internet Móvil |
| `GET` | `/content/planes/casa-libre` | Internet en Casa |
| `GET` | `/content/planes/empresa` | Planes Empresariales |
| `GET` | `/content/knowledge` | Base de conocimiento completa |

### Documentación Swagger
Disponible en: `http://localhost:3000/api/docs`

---

## ⚙️ Variables de Entorno

Crea el archivo `.env` en la raíz del backend (`apps/backend/.env`):

```env
# Contentful CMS
CONTENTFUL_SPACE_ID="tu_space_id"
CONTENTFUL_ACCESS_TOKEN="tu_access_token"

# Google Gemini AI
GEMINI_API_KEY="tu_api_key"

# Nodemailer (SMTP)
EMAIL_HOST="mail.tudominio.com"
EMAIL_PORT="587"
EMAIL_USER="usuario"
EMAIL_PASS="contraseña"
EMAIL_FROM="noreply@tudominio.com"
EMAIL_TO="destino@tudominio.com"

# Brevo (Newsletter)
BREVO_API_KEY="xkeysib-..."
BREVO_LIST_ID="3"
```

---

## 🛠️ Scripts

```bash
# Desarrollo (watch mode)
npm run start:dev

# Producción
npm run build
npm run start:prod

# Lint
npm run lint
```

---

## 📦 Dependencias Principales

| Paquete | Propósito |
|---------|-----------|
| `@nestjs/core` | Framework base |
| `@nestjs/config` | Variables de entorno |
| `@nestjs/swagger` | Documentación API |
| `@google/generative-ai` | Gemini AI SDK |
| `contentful` | CMS Headless |
| `nodemailer` | Envío de correos SMTP |
| `@getbrevo/brevo` | Newsletter/Marketing |

---

## 📄 Licencia

Propiedad de **Línea Digital del Sureste**.
