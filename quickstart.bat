@echo off
REM QUICK START - Cybersense (Windows)
REM Este script automatiza la instalacion en desarrollo local

setlocal enabledelayedexpansion

cls
echo.
echo ============================================================
echo         CYBERSENSE - INSTALLATION SCRIPT (v1.0)
echo ============================================================
echo.

REM Check Node.js
echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Node.js no esta instalado
    echo Descarga desde: https://nodejs.org/ (18+)
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

REM Check pnpm
echo [2/6] Verificando pnpm...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INSTALAR] Instalando pnpm...
    call npm install -g pnpm
)
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
echo [OK] pnpm %PNPM_VERSION%

REM Copy .env.example
echo [3/6] Configurando variables de entorno...
if not exist ".env" (
    copy .env.example .env
    echo [INFO] .env creado desde .env.example
    echo [IMPORTANTE] Edita .env con tus valores (JWT_SECRET, VAPID keys, etc.)
    echo.
    set /p CONTINUE="Continuar? (s/n): "
    if /i not "!CONTINUE!"=="s" exit /b 1
)
echo [OK] Archivo .env listo

REM Install dependencies
echo [4/6] Instalando dependencias...
call pnpm install >nul 2>&1
echo [OK] Root dependencies
cd server
call pnpm install >nul 2>&1
echo [OK] Server dependencies
cd ..
cd web
call pnpm install >nul 2>&1
echo [OK] Web dependencies
cd ..

REM Setup database
echo [5/6] Configurando base de datos...
cd server
call npx prisma generate >nul 2>&1
echo [OK] Prisma client generado
call npx prisma migrate dev --name init >nul 2>&1
echo [OK] Migraciones ejecutadas
call pnpm run seed >nul 2>&1
echo [OK] BD poblada con datos iniciales
cd ..

REM Done
echo.
echo [6/6] ^!Instalacion completada^! [OK]
echo.
echo ============================================================
echo                    PROXIMOS PASOS
echo ============================================================
echo.
echo 1. Edita .env con tus valores (si no lo hiciste):
echo    notepad .env
echo.
echo 2. En terminal 1, ejecuta el backend:
echo    pnpm --filter server dev
echo.
echo 3. En terminal 2, ejecuta el frontend:
echo    pnpm --filter web dev
echo.
echo 4. Abre navegador: http://localhost:5173
echo.
echo 5. Login con:
echo    Email:    admin@local
echo    Password: Admin123! (o tu contrasena configurada)
echo.
echo ============================================================
echo Documentacion disponible:
echo   - README.md - Descripcion del proyecto
echo   - DOCUMENTATION_INDEX.md - Indice de documentacion
echo   - SETUP.md - Guia detallada de instalacion
echo   - DEPLOYMENT.md - Como instalar en VPS
echo ============================================================
echo.
echo ^!Felicidades^! Tu instalacion esta lista. [OK]
echo.
pause
