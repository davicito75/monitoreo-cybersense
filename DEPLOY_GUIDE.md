# Guía de Despliegue en Vercel con Supabase

Esta guía detalla cómo desplegar Cybersense (Monitoreo Lite) en Vercel usando Supabase como base de datos PostgreSQL.

## Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com)
- Repositorio en GitHub con el código del proyecto
- Node.js 18+ instalado localmente (para pruebas)

## Paso 1: Crear Proyecto en Supabase

### 1.1 Crear Nuevo Proyecto

1. Accede a [Supabase Dashboard](https://app.supabase.com)
2. Haz clic en **"New Project"**
3. Completa los datos:
   - **Name**: `monitoreo-cybersense` (o el nombre que prefieras)
   - **Database Password**: Usa una contraseña segura (guárdala, la necesitarás)
   - **Region**: Elige la más cercana a tus usuarios
   - **Plan**: Free tier es suficiente para empezar
4. Haz clic en **"Create new project"**
5. Espera 2-3 minutos mientras se aprovisiona

### 1.2 Obtener Connection String

1. Ve a **Settings** → **Database**
2. En la sección **Connection String**, selecciona:
   - **Mode**: Transaction Pooler (puerto 5432)
   - **Language**: Node.js
3. Copia la URL que aparece. Debe verse así:
   ```
   postgresql://postgres.PROJECT_ID:PASSWORD@aws-X-REGION.pooler.supabase.com:5432/postgres
   ```
4. **IMPORTANTE**: Agrega `?pgbouncer=true` al final de la URL:
   ```
   postgresql://postgres.PROJECT_ID:PASSWORD@aws-X-REGION.pooler.supabase.com:5432/postgres?pgbouncer=true
   ```

### 1.3 Inicializar Base de Datos

Desde tu máquina local:

```powershell
# Configura la variable de entorno temporalmente
$env:DATABASE_URL="postgresql://postgres.PROJECT_ID:PASSWORD@aws-X-REGION.pooler.supabase.com:5432/postgres?pgbouncer=true"

# Navega al directorio del servidor
cd server

# Genera el cliente Prisma
npx prisma generate

# Crea las tablas
npx prisma db push

# Crea el usuario admin inicial
npx prisma db seed
```

**Credenciales por defecto**: `admin@local` / `Admin123!`

## Paso 2: Preparar Repositorio en GitHub

### 2.1 Verificar Archivos Necesarios

Asegúrate de que tu repositorio tiene:

- ✅ `vercel.json` en la raíz
- ✅ `pnpm-workspace.yaml` en la raíz
- ✅ `package.json` con `packageManager: "pnpm@10.28.2"`
- ✅ **NO** debe existir `package-lock.json` (solo `pnpm-lock.yaml`)

### 2.2 Verificar vercel.json

Tu archivo `vercel.json` debe verse así:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2.3 Push a GitHub

```bash
git add .
git commit -m "chore: prepare for vercel deployment"
git push origin master
```

## Paso 3: Desplegar en Vercel

### 3.1 Importar Proyecto

1. Accede a [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en **"Add New..."** → **"Project"**
3. Selecciona tu repositorio de GitHub
4. Haz clic en **"Import"**

### 3.2 Configurar Build Settings

Vercel debería detectar automáticamente:
- **Framework Preset**: Other
- **Build Command**: `pnpm run vercel-build`
- **Output Directory**: `public`
- **Install Command**: `pnpm install`

Si no lo detecta, configúralo manualmente.

### 3.3 Configurar Variables de Entorno

**ANTES de hacer el primer deploy**, haz clic en **"Environment Variables"** y agrega:

| Key | Value | Environments |
|-----|-------|--------------|
| `DATABASE_URL` | `postgresql://postgres.PROJECT_ID:PASSWORD@aws-X-REGION.pooler.supabase.com:5432/postgres?pgbouncer=true` | Production, Preview, Development |
| `JWT_SECRET` | (Genera uno con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) | Production, Preview, Development |
| `VAPID_PUBLIC_KEY` | (Genera con `npx web-push generate-vapid-keys`) | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | (Genera con `npx web-push generate-vapid-keys`) | Production, Preview, Development |

**IMPORTANTE**: 
- Asegúrate de que `DATABASE_URL` incluya `?pgbouncer=true` al final
- Usa el **Transaction Pooler** (puerto 5432), NO el Session Pooler (puerto 6543)

### 3.4 Deploy

1. Haz clic en **"Deploy"**
2. Espera 2-3 minutos mientras se construye
3. Si todo está bien, verás ✅ **"Deployment Ready"**

## Paso 4: Verificar Despliegue

1. Haz clic en el link de tu deployment (ej: `https://tu-proyecto.vercel.app`)
2. Deberías ver la página de login
3. Ingresa con `admin@local` / `Admin123!`
4. Si el login funciona, ¡felicidades! 🎉

## Troubleshooting

### Error 504 Gateway Timeout

**Causa**: Conexión a base de datos incorrecta o timeout.

**Solución**:
1. Verifica que `DATABASE_URL` tenga `?pgbouncer=true` al final
2. Confirma que estás usando puerto **5432** (Transaction Pooler)
3. Verifica que el usuario sea `postgres.PROJECT_ID` (no solo `postgres`)

### Error: "Tenant or user not found"

**Causa**: Credenciales de base de datos incorrectas.

**Solución**:
1. Ve a Supabase → Settings → Database → **Connection String**
2. Selecciona **Transaction Pooler**
3. Copia la URL exacta (debe incluir `postgres.PROJECT_ID`)
4. Actualiza `DATABASE_URL` en Vercel
5. Haz **Redeploy**

### Build Failed: TypeScript Errors

**Causa**: Errores de compilación en el código.

**Solución**:
1. Ejecuta localmente: `pnpm run vercel-build`
2. Corrige los errores que aparezcan
3. Haz commit y push
4. Vercel redesplegará automáticamente

### Error: "pnpm not found" o usa npm en vez de pnpm

**Causa**: Existe un `package-lock.json` en el repositorio.

**Solución**:
```bash
# Elimina package-lock.json
rm package-lock.json

# Commit y push
git add package-lock.json
git commit -m "chore: remove package-lock.json"
git push
```

### Login funciona pero no hay datos

**Causa**: Base de datos no inicializada.

**Solución**:
```bash
# Desde tu máquina local
$env:DATABASE_URL="tu-connection-string-de-supabase"
cd server
npx prisma db push
npx prisma db seed
```

## Configuración Avanzada

### Dominios Personalizados

1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

### Logs y Monitoreo

Para ver logs de tu aplicación:
1. Ve a tu proyecto en Vercel
2. Haz clic en el deployment activo
3. Pestaña **"Logs"**

### Redeploy Manual

Si necesitas redesplegar sin cambios en el código:
1. Ve a Deployments
2. Haz clic en los 3 puntos del último deployment
3. Selecciona **"Redeploy"**

### Variables de Entorno Adicionales

Puedes agregar más variables según necesites:

```env
NODE_ENV=production
PORT=4000
ADMIN_EMAIL=admin@local
ADMIN_PASSWORD=Admin123!
PUSH_ENABLED=true
WEB_URL=https://tu-proyecto.vercel.app
SERVER_URL=https://tu-proyecto.vercel.app/api
CORS_ORIGIN=https://tu-proyecto.vercel.app
```

## Actualizar la Aplicación

### Desde GitHub

1. Haz cambios en tu código local
2. Commit y push a GitHub:
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin master
   ```
3. Vercel desplegará automáticamente

### Actualizar Base de Datos

Si cambias el schema de Prisma:

```bash
# Local
$env:DATABASE_URL="tu-connection-string"
cd server
npx prisma db push
```

## Seguridad en Producción

✅ **Checklist de Seguridad**:

- [ ] `JWT_SECRET` es aleatorio y seguro (32+ caracteres)
- [ ] Contraseña de admin cambiada desde la interfaz
- [ ] `DATABASE_URL` no está expuesta en el código
- [ ] Variables de entorno configuradas solo en Vercel
- [ ] HTTPS habilitado (automático en Vercel)
- [ ] CORS configurado correctamente

## Costos

### Vercel
- **Free Tier**: 100GB bandwidth, builds ilimitados
- **Pro**: $20/mes por miembro (si necesitas más recursos)

### Supabase
- **Free Tier**: 500MB database, 2GB bandwidth
- **Pro**: $25/mes (8GB database, 250GB bandwidth)

## Próximos Pasos

- [ ] Configurar dominio personalizado
- [ ] Habilitar analytics en Vercel
- [ ] Configurar alertas de uptime
- [ ] Implementar backups de base de datos
- [ ] Revisar logs regularmente

## Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Consulta [Vercel Docs](https://vercel.com/docs)
4. Consulta [Supabase Docs](https://supabase.com/docs)

---

¡Tu aplicación ya está en producción! 🚀
