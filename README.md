# 🌿 Kiwi Latino — API

Backend REST para la app Kiwi Latino. Construido con **Express + TypeScript + Prisma + PostgreSQL**.

## Stack

- **Runtime:** Node.js 20+
- **Framework:** Express 4
- **ORM:** Prisma 5 + PostgreSQL
- **Auth:** JWT (access token 15min + refresh token 7d con rotación)
- **Validación:** Zod
- **Uploads:** Multer + Cloudinary
- **Seguridad:** express-rate-limit, CORS configurado

---

## Requisitos previos

- Node.js 20+
- PostgreSQL 14+ (local o [Neon](https://neon.tech) para producción)
- Cuenta en [Cloudinary](https://cloudinary.com) (free tier)

---

## Instalación

```bash
git clone https://github.com/tu-usuario/kiwi-latino-api.git
cd kiwi-latino-api
npm install
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de entorno)
npm run db:migrate
npm run dev
```

La API estará disponible en `http://localhost:3000`.  
Verificar con `GET http://localhost:3000/health`.

---

## Variables de entorno

Copia `.env.example` a `.env` y completa cada valor:

```env
# ── Servidor ────────────────────────────────────────────────────────────────
PORT=3000
# Puerto en el que escucha Express. Por defecto: 3000.

NODE_ENV=development
# Entorno de ejecución. Valores: development | production | test.
# En producción cambia el manejo de errores (no expone stack traces).

# ── Base de datos ────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/kiwi_latino_db"
# Connection string de PostgreSQL (formato: postgresql://USER:PASSWORD@HOST:PORT/DB_NAME).
# Local:      postgresql://postgres:password@localhost:5432/kiwi_latino_db
# Producción: obtener desde Neon → Project → Connection String

# ── JWT ──────────────────────────────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_here
# Clave para firmar access tokens. Usar mínimo 32 caracteres aleatorios.
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
# Clave DISTINTA para firmar refresh tokens. Misma longitud mínima.
# Nunca usar el mismo valor que JWT_SECRET.

JWT_EXPIRES_IN=15m
# Duración del access token. Formato: 15m, 1h, 2d, etc.

JWT_REFRESH_EXPIRES_IN=7d
# Duración del refresh token. Por defecto: 7 días.

# ── Cloudinary ───────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
# Nombre del cloud. Se encuentra en: Cloudinary Dashboard → Settings → Account.

CLOUDINARY_API_KEY=your_api_key
# API Key. Se encuentra en: Cloudinary Dashboard → Settings → Access Keys.

CLOUDINARY_API_SECRET=your_api_secret
# API Secret (tratar como contraseña, nunca commitear). Mismo lugar que la API Key.

# ── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:8081
# Orígenes permitidos para CORS, separados por coma.
# Desarrollo:  http://localhost:8081
# Producción:  https://tu-dominio.com,exp://...
```

### Cómo generar claves seguras para JWT

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ejecutar dos veces y usar un valor distinto para `JWT_SECRET` y `JWT_REFRESH_SECRET`.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Levanta el servidor con hot-reload (`tsx watch`) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta el build de producción |
| `npm run db:migrate` | Ejecuta migraciones pendientes de Prisma |
| `npm run db:generate` | Regenera el Prisma Client |
| `npm run db:studio` | Abre Prisma Studio (UI para la BD) |
| `npm run lint` | Ejecuta ESLint en `src/` |
| `npm run format` | Formatea `src/` con Prettier |

---

## Endpoints disponibles

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Registrar usuario |
| `POST` | `/api/auth/login` | No | Iniciar sesión |
| `POST` | `/api/auth/refresh` | No | Renovar tokens |
| `POST` | `/api/auth/logout` | Sí | Cerrar sesión |
| `GET` | `/api/users/me` | Sí | Perfil propio |
| `PATCH` | `/api/users/me` | Sí | Editar perfil |
| `GET` | `/api/users/:id` | Sí | Perfil público |
| `GET` | `/api/posts` | Sí | Listar posts |
| `POST` | `/api/posts` | Sí | Crear post |
| `GET` | `/api/posts/:id` | Sí | Detalle de post |
| `PATCH` | `/api/posts/:id` | Sí | Editar post |
| `DELETE` | `/api/posts/:id` | Sí | Eliminar post |
| `POST` | `/api/posts/:id/report` | Sí | Reportar post |
| `GET` | `/api/trips` | Sí | Listar viajes |
| `POST` | `/api/trips` | Sí | Crear viaje |
| `GET` | `/api/trips/:id` | Sí | Detalle de viaje |
| `POST` | `/api/trips/:id/book` | Sí | Reservar asiento |
| `DELETE` | `/api/trips/:id/book` | Sí | Cancelar reserva |
| `GET` | `/api/messages/conversations` | Sí | Listar conversaciones |
| `GET` | `/api/messages/:userId` | Sí | Historial con usuario |
| `POST` | `/api/messages` | Sí | Enviar mensaje |
| `POST` | `/api/upload/image` | Sí | Subir imagen a Cloudinary |

> Los endpoints marcados con **Sí** requieren el header `Authorization: Bearer <accessToken>`.

---

## Estructura del proyecto

```
src/
├── index.ts              # Punto de entrada
├── app.ts                # Configuración de Express (middlewares, rutas)
├── routes/               # Definición de rutas por módulo
├── middlewares/          # authenticate, errorHandler, notFound
├── utils/
│   ├── jwt.ts            # Generación y verificación de tokens
│   └── apiResponse.ts    # Helpers para respuestas estandarizadas
└── types/                # Tipos TypeScript compartidos
prisma/
├── schema.prisma         # Modelo de datos
└── migrations/           # Historial de migraciones
```

---

*Kiwi Latino · kiwi-latino-api · Mayo 2026*
