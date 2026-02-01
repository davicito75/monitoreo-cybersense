# Cybersense (Monitoreo Lite) - Monorepo

Proyecto MVP "lite" para monitoreo de servicios (HTTP, TCP, Ping fallback, DNS) con scheduler central, SQLite y Web Push.

## � Documentación Rápida

| Documentación | Audiencia | Descripción |
|---|---|---|
| **[SETUP.md](SETUP.md)** | Nuevos desarrolladores | Instalación paso a paso en tu máquina |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | DevOps/SysAdmin | Guía completa para VPS (Ubuntu/Debian) con Nginx y PM2 |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Desarrolladores | Convenciones de código, tests, pull requests |
| **[CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)** | Revisor del código | Cambios realizados, seguridad, estructura |

## 📋 Requisitos

- **Node.js**: 18+
- **Package Manager**: pnpm (recomendado) o npm
- **Base de Datos**: PostgreSQL (Supabase para producción, SQLite para desarrollo local)

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Clonar y Configurar

```bash
git clone <tu-repositorio>
cd monitoreo
cp .env.example .env
# Edita .env con tus valores
```

### 2. Instalar Dependencias

```powershell
pnpm install
cd server
pnpm install
cd ../web
pnpm install
cd ..
```

### 3. Configurar Base de Datos

```powershell
cd server
npx prisma generate
npx prisma migrate dev --name init
pnpm run seed
cd ..
```

**Credenciales de prueba**: `admin@local` / `Admin123!`

### 4. Ejecutar en Modo Desarrollo

```powershell
# Terminal 1: Backend (puerto 4000)
pnpm --filter server dev

# Terminal 2: Frontend (puerto 5173)
pnpm --filter web dev
```

Accede a `http://localhost:5173`

## 📚 Documentación

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía completa de deployment en VPS (Ubuntu/Debian) con Nginx, PM2 y SSL

## 🔌 API Ejemplos

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@local","password":"Admin123!"}'
```

### Crear Monitor
```bash
curl -X POST http://localhost:4000/api/monitors \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Mi sitio",
    "type":"HTTP",
    "urlOrHost":"https://example.com",
    "intervalSec":60,
    "timeoutMs":5000,
    "expectedStatus":200
  }'
```

### Pausar Monitor
```bash
curl -X PATCH http://localhost:4000/api/monitors/1/pause \
  -H "Authorization: Bearer <token>"
```

### Suscribirse a Web Push (desde navegador)
```javascript
POST /api/push/subscribe
Body: { endpoint, keys: { p256dh, auth } }
```

## 🏗️ Arquitectura

```
monitoreo/
├── server/              # Backend Node.js (Express + Prisma)
│   ├── src/
│   ├── prisma/         # Schema y migraciones
│   ├── scripts/        # Utilidades de administración
│   └── dist/           # Compilado (generado)
├── web/                # Frontend React (Vite)
│   ├── src/
│   └── dist/           # Build (generado)
└── docs/               # Documentación
```

### Tecnologías

**Backend:**
- Express.js
- Prisma ORM + PostgreSQL (Supabase) / SQLite (desarrollo local)
- JWT para autenticación
- Web Push (VAPID)
- p-limit para concurrencia
- Scheduler central (Node.js cron)

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS
- Service Worker (Web Push)

## ⚙️ Variables de Entorno

Copiar `.env.example` y ajustar:

```env
# === SERVER ===
PORT=4000
NODE_ENV=development
DATABASE_URL="file:./dev.db"

# === AUTH ===
JWT_SECRET="your-secret-key"
ADMIN_EMAIL="admin@local"
ADMIN_PASSWORD="Admin123!"

# === WEB PUSH ===
VAPID_PUBLIC_KEY="your-vapid-public"
VAPID_PRIVATE_KEY="your-vapid-private"
VAPID_SUBJECT="mailto:your-email@example.com"

# === URLs ===
WEB_URL="http://localhost:5173"
SERVER_URL="http://localhost:4000/api"
CORS_ORIGIN="http://localhost:5173"
```

Para generar VAPID Keys:
```bash
cd server
npx web-push generate-vapid-keys
```

## 🔧 Operaciones Comunes

### Build de producción
```bash
pnpm run build:all
```

### Tests
```bash
pnpm --filter server test
pnpm --filter web test
```

### Lint & Format
```bash
pnpm run lint
pnpm run format
```

## 📦 Deployment

### Opción 1: Vercel (Recomendado para Producción)

Despliegue serverless con Supabase como base de datos:

👉 **[Leer DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)**

**Características:**
- Despliegue automático desde GitHub
- Base de datos PostgreSQL (Supabase)
- SSL automático
- Escalado automático
- Sin configuración de servidor

### Opción 2: VPS Tradicional (Ubuntu/Debian)

Para instalación en servidor propio con Nginx y PM2:

👉 **[Leer DEPLOYMENT.md](DEPLOYMENT.md)**

Incluye:
- Instalación de Node.js y pnpm
- Configuración de PM2
- Setup de Nginx como reverse proxy
- SSL con Let's Encrypt
- Backups automáticos
- Guía de seguridad

## 🏭 Características

✅ **Monitoreo**
- HTTP/HTTPS
- TCP
- Ping (fallback a TCP 443)
- DNS

✅ **Notificaciones**
- Web Push (Service Worker)
- Webhooks (próximamente)

✅ **Administración**
- Dashboard responsive
- Gestión de monitores (crear, editar, pausar, eliminar)
- Histórico de checks
- Estadísticas de uptime

## 🎨 Notas de Diseño

- **Autenticación**: JWT en Authorization header. Para producción se recomienda cookies httpOnly + CSRF.
- **Scheduler**: Ciclo central que consulta todos los monitores y ejecuta checks con límite de concurrencia (p-limit). Evita setInterval por monitor y escala mejor.
- **Ping**: Implementado como TCP connect a puerto 443 (fallback seguro).
- **Base de Datos**: PostgreSQL (Supabase) para producción. SQLite disponible para desarrollo local.

## 🚧 Limitaciones y Próximos Pasos

- [ ] UI avanzada con gráficos interactivos (Chart.js)
- [ ] Alertas por email y SMS
- [ ] 2FA para login
- [ ] Historial completo con filtros
- [ ] Escalado a PostgreSQL
- [ ] Clustering con PM2
- [ ] Tests más exhaustivos

## 📄 Licencia

MIT

## 📞 Soporte

Para problemas:
1. Revisa los logs: `pm2 logs` (en producción)
2. Verifica variables en `.env`
3. Consulta [DEPLOYMENT.md](DEPLOYMENT.md) para troubleshooting
