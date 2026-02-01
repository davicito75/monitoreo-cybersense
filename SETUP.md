# Guía de Instalación en Servidor Limpio

Esta guía te guía a través de la instalación completa de Cybersense en un servidor vacío.

## Opción A: VPS Remoto (Ubuntu/Debian)

Usa la guía completa en [DEPLOYMENT.md](DEPLOYMENT.md)

**Resumen rápido:**
1. Actualizar sistema: `sudo apt update && sudo apt upgrade -y`
2. Instalar Node.js 18+
3. Clonar repositorio
4. Configurar `.env`
5. `pnpm install` y `pnpm run build:all`
6. Configurar PM2 y Nginx
7. SSL con Let's Encrypt
8. Acceder a `https://tu-dominio.com`

## Opción B: Desarrollo Local (Windows/Mac/Linux)

### Paso 1: Requisitos Previos

```bash
# Verifica Node.js (debe ser 18+)
node --version

# Verifica npm
npm --version

# Instala pnpm globalmente (si no está)
npm install -g pnpm
pnpm --version
```

### Paso 2: Descargar Proyecto

```bash
# Opción 1: Clonar del repositorio
git clone https://github.com/tu-usuario/cybersense.git
cd cybersense

# Opción 2: Descargar como ZIP
# Descarga de GitHub → Code → Download ZIP
# Extrae y abre en terminal
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita con tu editor favorito (VS Code, nano, vim, etc.)
# Asegúrate de cambiar:
# - JWT_SECRET (genera uno: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# - ADMIN_EMAIL y ADMIN_PASSWORD
# - VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY (generados abajo)
```

#### Generar VAPID Keys para Web Push:

```bash
cd server
npx web-push generate-vapid-keys
# Copia los valores a tu .env en el directorio raíz
cd ..
```

### Paso 4: Instalar Dependencias

```bash
# Instalar dependencias del root
pnpm install

# Instalar dependencias del server
cd server
pnpm install
cd ..

# Instalar dependencias del web
cd web
pnpm install
cd ..
```

### Paso 5: Configurar Base de Datos

```bash
cd server

# Generar cliente Prisma
npx prisma generate

# Crear base de datos e ejecutar migraciones
npx prisma migrate dev --name init

# Poblar datos iniciales (admin user, etc.)
pnpm run seed

# Verifica la BD (SQLite)
ls -la dev.db

cd ..
```

### Paso 6: Construir para Producción (Opcional)

```bash
# Solo si quieres probar build de producción
pnpm run build:all

# El build estará en:
# - server/dist/
# - web/dist/
```

### Paso 7: Ejecutar en Desarrollo

```bash
# Terminal 1: Backend (http://localhost:4000)
pnpm --filter server dev

# Terminal 2: Frontend (http://localhost:5173)
pnpm --filter web dev

# Abre navegador: http://localhost:5173
# Login: admin@local / Admin123! (o tu contraseña configurada)
```

## Opción C: Docker (Próximamente)

Se está trabajando en Dockerfile para deployment con Docker.

## Post-Instalación

### 1. Cambiar Contraseña de Admin

Después del primer login, cambia la contraseña en: Settings → Account

### 2. Crear Primer Monitor

1. Ve a "Monitors"
2. Haz clic en "New Monitor"
3. Completa el formulario:
   - **Name**: Nombre del servicio
   - **Type**: HTTP, TCP, DNS o Ping
   - **URL/Host**: Dominio o IP
   - **Interval**: Cada cuántos segundos verificar
   - **Timeout**: Segundos antes de timeout
4. Haz clic en "Create"

### 3. Configurar Web Push (Notificaciones)

1. El navegador te pedirá permiso para notificaciones
2. Acepta los permisos
3. Verás un ícono de campana indicando que está habilitado
4. Recibirás notificaciones cuando un servicio caiga

### 4. Crear Otros Usuarios (Próximamente)

Actualmente solo hay un usuario admin. La característica de múltiples usuarios está en desarrollo.

## Troubleshooting

### Error: "Node version X.X.X is not supported"
- Instala Node 18+: https://nodejs.org/en/download/package-manager/
- Verifica con `node --version`

### Error: "VAPID keys not configured"
- Ejecuta: `cd server && npx web-push generate-vapid-keys`
- Copia los valores a `.env`

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` en `.env` es correcta
- Por defecto: `DATABASE_URL="file:./dev.db"` (SQLite)
- Verifica permisos de escritura en la carpeta `server/`

### Base de datos vacía después de seed
```bash
cd server
npx prisma db seed
cd ..
```

### Puerto 4000 o 5173 en uso
- Opción 1: Cambia el puerto en `.env` (PORT=4000 → PORT=4001)
- Opción 2: Mata el proceso usando el puerto
  - Windows: `netstat -ano | findstr :4000` luego `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -i :4000` luego `kill -9 <PID>`

### Los cambios en el código no se reflejan
- Asegúrate de tener modo desarrollo activo (`pnpm dev`)
- Refresh en navegador (Ctrl+R o Cmd+R)
- Si persiste, reinicia los servidores

## Verificación de la Instalación

Checklist para confirmar que todo funciona:

- [ ] Navigador accede a http://localhost:5173
- [ ] Puedes hacer login con admin@local
- [ ] Dashboard se carga sin errores
- [ ] Puedes crear un monitor
- [ ] El monitor ejecuta checks (aparece en histórico)
- [ ] Las notificaciones Web Push funcionan
- [ ] No hay errores en la consola (F12)
- [ ] Los logs muestran actividad normal

## Siguientes Pasos

1. **Customizar**: Edita `.env` con tus valores
2. **Monitorear**: Crea monitores para tus servicios
3. **Producción**: Sigue [DEPLOYMENT.md](DEPLOYMENT.md) para VPS
4. **Contribuir**: Lee [CONTRIBUTING.md](CONTRIBUTING.md)

## Necesitas Ayuda?

1. Revisa los logs:
   ```bash
   # Backend
   pnpm --filter server dev  # Ver output en tiempo real
   
   # Frontend
   pnpm --filter web dev     # Ver output en tiempo real
   ```

2. Abre la consola del navegador (F12) para errores del frontend

3. Consulta el [README](README.md) para más información

4. Abre un [issue en GitHub](../../issues/new) con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Logs relevantes
   - Tu sistema operativo y versión de Node

---

¡Felicidades por tu instalación! 🎉 Si todo funcionó, ya estás listo para monitorear.
