# Script de Inicialización de Base de Datos Remota
# Ejecutar desde la carpeta 'server/'

# Usando Pooler en modo Sesión (Puerto 6543) para esquivar problemas DNS locales
$env:DATABASE_URL = "postgresql://postgres.waxbdbswyquuixxxanyl:Monitor2026%21%21Secure@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

Write-Host "1. Subiendo estructura de tablas..."
npx prisma db push --accept-data-loss

Write-Host "2. Creando usuario admin..."
npx prisma db seed

Write-Host "Listo. Intenta login en Vercel."
