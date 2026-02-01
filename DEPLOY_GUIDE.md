# Guía de Despliegue en Vercel (Producción)

Tu aplicación está lista para desplegarse. Aquí tienes los pasos detallados para configurar el entorno de producción conectado a Supabase.

## A. Arquitectura de Despliegue

Tu proyecto es un **monorepo** (Frontend + Backend en la misma carpeta).
- **Frontend (`web`)**: Se recomienda desplegar en **Vercel**.
- **Backend (`server`)**: Se recomienda desplegar en **Render** o **Railway** (ya que Vercel Serverless no soporta WebSockets persistentes, necesarios para tu app).

## B. Despliegue del Backend (Render.com) - Recomendado

1. Crea un nuevo **Web Service** en [Render](https://dashboard.render.com/).
2. Conecta tu repositorio de GitHub.
3. **Configuración**:
   - **Root Directory**: `server`
   - **Build Command**: `pnpm install && pnpm build` (o `npm install && npm run build`)
   - **Start Command**: `pnpm start` (o `npm start`)
4. **Environment Variables** (Añadir en el dashboard de Render):

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://monitor_user.waxbdbswyquuixxxanyl:Monitor2026!!Secure@aws-0-us-east-1.pooler.supabase.com:5432/postgres
JWT_SECRET=bcc66ef44531b2ffe520847680f093547eccc5a7e22134c154bc9b59fe726947d
VAPID_PUBLIC_KEY=BBG9iKdXCKtSS0OkFsuAlqZdWz66SayX3G0TcCfpM7GnCrkeZD3_ElQQWBJMzJ-yxvNvPTwQqFELWqhRXPOODqA
VAPID_PRIVATE_KEY=YxQxLWEYi4zYOQS9qlNlFJTLEIWwXqJKBrVEMqLpxgM
VAPID_SUBJECT=mailto:admin@cybersense.local
PUSH_ENABLED=true
WEB_URL=https://TU-APP-FRONTEND.vercel.app
CORS_ORIGIN=https://TU-APP-FRONTEND.vercel.app
```

## C. Despliegue del Frontend (Vercel)

1. Crea un nuevo Proyecto en [Vercel](https://vercel.com/new).
2. Importa tu repositorio.
3. **Configuración**:
   - **Framework Preset**: Vite
   - **Root Directory**: `web` (Edita esto si aparece bloqueado, o selecciona `web` en el paso de importación).
4. **Environment Variables**:

```env
VITE_API_URL=https://TU-APP-BACKEND.onrender.com/api
VAPID_PUBLIC_KEY=BBG9iKdXCKtSS0OkFsuAlqZdWz66SayX3G0TcCfpM7GnCrkeZD3_ElQQWBJMzJ-yxvNvPTwQqFELWqhRXPOODqA
```
*(Reemplaza `https://TU-APP-BACKEND.onrender.com` con la URL real que te de Render).*

## D. Base de Datos (Supabase)

Tu base de datos ya está provisionada y lista en la nube.
- **Credenciales ya configuradas en la URL de arriba**:
  - Host: `aws-0-us-east-1.pooler.supabase.com`
  - User: `monitor_user.waxbdbswyquuixxxanyl`
  - Pass: `Monitor2026!!Secure`
  - DB: `postgres`

## E. Notas Adicionales

- **Usuario Admin Inicial**: `admin@local` / `Admin123!`
- **WebSockets**: Funcionarán correctamente si el backend está en Render/Railway.
- **Local Development**: Usa `pnpm dev` en tu máquina. Usará SQLite local separado de producción.
