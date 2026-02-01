# Guía de Deployment en VPS (Ubuntu/Debian)

Esta guía detalla cómo instalar y configurar Cybersense (Monitoreo Lite) en un servidor VPS.

## Requisitos Previos

- Servidor VPS con Ubuntu 20.04+ o Debian 11+
- Acceso SSH con permisos de sudo
- Dominio apuntando a tu servidor (opcional pero recomendado)

## Paso 1: Actualizar el Sistema

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

## Paso 2: Instalar Node.js y pnpm

```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar pnpm globalmente
npm install -g pnpm

# Verificar instalación
node --version
npm --version
pnpm --version
```

## Paso 3: Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Permitir que PM2 se inicie en el arranque (Linux)
pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
```

## Paso 4: Descargar y Configurar la Aplicación

```bash
# Crear directorio para la aplicación
mkdir -p /opt/cybersense
cd /opt/cybersense

# Clonar o descargar el repositorio
git clone <tu-repositorio> .
# O si es privado:
# git clone git@github.com:tu-usuario/repositorio.git .

# Instalar dependencias del monorepo
pnpm install
cd server
pnpm install
cd ../web
pnpm install
cd ..
```

## Paso 5: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo a producción
cp .env.example .env

# Editar con tus valores (nano, vim, o tu editor preferido)
nano .env
```

### Variables clave a configurar:

```env
# === SERVER ===
PORT=4000
NODE_ENV=production
DATABASE_URL="file:./dev.db"  # SQLite en el servidor

# === AUTENTICACIÓN ===
JWT_SECRET="tu-secret-muy-seguro-aleatorio-de-32-caracteres"
ADMIN_EMAIL="tu-email@ejemplo.com"
ADMIN_PASSWORD="contraseña-segura"

# === WEB PUSH ===
VAPID_PUBLIC_KEY="tu-vapid-public-key"
VAPID_PRIVATE_KEY="tu-vapid-private-key"
VAPID_SUBJECT="mailto:tu-email@ejemplo.com"

# === URL PÚBLICA ===
WEB_URL="https://tu-dominio.com"
SERVER_URL="https://tu-dominio.com/api"

# === CORS ===
CORS_ORIGIN="https://tu-dominio.com"
```

### Generar VAPID Keys para Web Push:

```bash
cd server
npx web-push generate-vapid-keys
# Copia los valores a tu .env
```

### Generar JWT_SECRET seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Paso 6: Configurar Base de Datos

```bash
cd server

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar datos iniciales (seed)
pnpm run seed
```

## Paso 7: Compilar la Aplicación

```bash
# En la raíz del proyecto
pnpm run build:all
# O manualmente:
# cd server && pnpm run build && cd ../web && pnpm run build
```

## Paso 8: Instalar y Configurar Reverse Proxy (Nginx)

```bash
sudo apt install -y nginx

# Crear configuración para tu dominio
sudo nano /etc/nginx/sites-available/cybersense
```

Pega esta configuración:

```nginx
upstream server_backend {
    server localhost:4000;
}

server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Certificados SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend estático (Vite)
    location / {
        root /opt/cybersense/web/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://server_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Service Worker
    location /sw.js {
        root /opt/cybersense/web/dist/public;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

Habilita el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/cybersense /etc/nginx/sites-enabled/
sudo nginx -t  # Verifica la sintaxis
sudo systemctl restart nginx
```

## Paso 9: Instalar Certificado SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Generar certificado (reemplaza con tu dominio)
sudo certbot certonly --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Paso 10: Iniciar Aplicación con PM2

```bash
cd /opt/cybersense/server

# Editar ecosystem.config.js si es necesario
nano ecosystem.config.js

# Iniciar con PM2
pm2 start ecosystem.config.js --env production

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs

# Guardar configuración de PM2
pm2 save

# Reiniciar tras reboot del servidor
pm2 startup systemd -u $USER
```

### Ejemplo ecosystem.config.js (servidor):

```javascript
module.exports = {
  apps: [
    {
      name: 'cybersense-server',
      script: 'dist/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '/var/log/cybersense-error.log',
      out_file: '/var/log/cybersense-out.log',
      merge_logs: true,
    }
  ]
};
```

## Paso 11: Configurar Logs y Monitoreo

```bash
# Crear directorio de logs
sudo mkdir -p /var/log/cybersense
sudo chown $USER:$USER /var/log/cybersense

# Ver logs en tiempo real
pm2 logs cybersense-server

# Ver métricas
pm2 monit
```

## Paso 12: Backup Automático

Crea un script de backup diario:

```bash
mkdir -p /opt/backups
nano /opt/cybersense/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DB_PATH="/opt/cybersense/server/dev.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH "$BACKUP_DIR/dev.db.backup_$DATE"

# Mantener solo los últimos 7 días
find $BACKUP_DIR -name "dev.db.backup_*" -mtime +7 -delete

echo "Backup completado: $DATE"
```

Haz el script ejecutable y añádelo a crontab:

```bash
chmod +x /opt/cybersense/backup.sh
crontab -e
```

Añade esta línea para ejecutar diariamente a las 2 AM:

```
0 2 * * * /opt/cybersense/backup.sh >> /var/log/cybersense-backup.log 2>&1
```

## Paso 13: Verificar la Instalación

1. Accede a `https://tu-dominio.com` en tu navegador
2. Login con las credenciales configuradas
3. Crea un monitor de prueba
4. Verifica que los checks se ejecutan correctamente

## Operaciones Comunes en Producción

### Reiniciar la aplicación
```bash
pm2 restart cybersense-server
```

### Actualizar código
```bash
cd /opt/cybersense
git pull
pnpm install
pnpm run build:all
pm2 restart cybersense-server
```

### Ver estado del servidor
```bash
pm2 status
pm2 logs cybersense-server
```

### Detener aplicación
```bash
pm2 stop cybersense-server
```

### Monitoreo en tiempo real
```bash
pm2 monit
```

## Solución de Problemas

### Error de conexión a base de datos
- Verifica que `DATABASE_URL` está correctamente configurada en `.env`
- Asegúrate de que el directorio `server/` tiene permisos de escritura

### API no responde
```bash
pm2 logs cybersense-server
```
Revisa los logs para detalles del error.

### CORS errors
- Verifica que `CORS_ORIGIN` en `.env` coincide con tu dominio
- Recarga la aplicación con `pm2 restart`

### Certificado SSL no válido
```bash
sudo certbot renew --dry-run  # Prueba
sudo certbot renew             # Renovar ahora
```

## Seguridad (Producción)

1. ✅ **HTTPS obligatorio** - Usa Let's Encrypt
2. ✅ **Firewall** - Abre solo puertos 22 (SSH), 80 (HTTP), 443 (HTTPS)
3. ✅ **JWT_SECRET seguro** - Genera un secret aleatorio fuerte
4. ✅ **Variables de entorno** - Usa `.env` y NO la versionees
5. ✅ **Contraseña fuerte** - Admin debe tener contraseña compleja
6. ✅ **Backups regulares** - Configura backup automático
7. ✅ **Monitoreo** - Usa PM2 para detectar caídas

## Próximos Pasos Recomendados

- [ ] Configurar alertas en los monitores (Webhooks, Email)
- [ ] Implementar 2FA para login de admin
- [ ] Configurar estadísticas y gráficos de uptime
- [ ] Documentar escalado a múltiples procesos con PM2
- [ ] Evaluar base de datos PostgreSQL para producción a mayor escala

## Soporte

Para problemas o preguntas, revisa:
- Logs: `pm2 logs cybersense-server`
- Estado: `pm2 status`
- [Documentación de PM2](https://pm2.keymetrics.io/)
- [Documentación de Prisma](https://www.prisma.io/docs/)
