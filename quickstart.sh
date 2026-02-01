#!/bin/bash
# QUICK START - Cybersense
# Este script automatiza la instalación en desarrollo local

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        CYBERSENSE - INSTALLATION SCRIPT (v1.0)           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${YELLOW}[1/6]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js no está instalado${NC}"
    echo "Descarga desde: https://nodejs.org/ (18+)"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check pnpm
echo -e "${YELLOW}[2/6]${NC} Verificando pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}→ Instalando pnpm...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm $(pnpm --version)${NC}"

# Copy .env.example
echo -e "${YELLOW}[3/6]${NC} Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}→ .env creado desde .env.example${NC}"
    echo -e "${YELLOW}→ IMPORTANTE: Edita .env con tus valores (JWT_SECRET, VAPID keys, etc.)${NC}"
    read -p "¿Continuar? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}✓ Archivo .env listo${NC}"

# Install dependencies
echo -e "${YELLOW}[4/6]${NC} Instalando dependencias..."
pnpm install > /dev/null 2>&1 && echo -e "${GREEN}✓ Root dependencies${NC}"
cd server
pnpm install > /dev/null 2>&1 && echo -e "${GREEN}✓ Server dependencies${NC}"
cd ../web
pnpm install > /dev/null 2>&1 && echo -e "${GREEN}✓ Web dependencies${NC}"
cd ..

# Setup database
echo -e "${YELLOW}[5/6]${NC} Configurando base de datos..."
cd server
npx prisma generate > /dev/null 2>&1 && echo -e "${GREEN}✓ Prisma client generado${NC}"
npx prisma migrate dev --name init > /dev/null 2>&1 && echo -e "${GREEN}✓ Migraciones ejecutadas${NC}"
pnpm run seed > /dev/null 2>&1 && echo -e "${GREEN}✓ BD poblada con datos iniciales${NC}"
cd ..

# Done
echo ""
echo -e "${YELLOW}[6/6]${NC} ¡Instalación completada! ${GREEN}✓${NC}"
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   PRÓXIMOS PASOS                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Edita .env con tus valores (si no lo hiciste):"
echo "   ${YELLOW}nano .env${NC}"
echo ""
echo "2. En terminal 1, ejecuta el backend:"
echo "   ${YELLOW}pnpm --filter server dev${NC}"
echo ""
echo "3. En terminal 2, ejecuta el frontend:"
echo "   ${YELLOW}pnpm --filter web dev${NC}"
echo ""
echo "4. Abre navegador: ${GREEN}http://localhost:5173${NC}"
echo ""
echo "5. Login con:"
echo "   Email:    ${GREEN}admin@local${NC}"
echo "   Password: ${GREEN}Admin123!${NC} (o tu contraseña configurada)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 Para más información, consulta:"
echo "   • README.md - Descripción del proyecto"
echo "   • DOCUMENTATION_INDEX.md - Índice de documentación"
echo "   • SETUP.md - Guía detallada de instalación"
echo "   • DEPLOYMENT.md - Cómo instalar en VPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}¡Felicidades! Tu instalación está lista.${NC} 🎉"
