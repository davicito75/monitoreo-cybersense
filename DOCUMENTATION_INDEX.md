# 📑 Índice de Documentación - Cybersense

Bienvenido a Cybersense. Este documento te ayuda a navegar por toda la documentación disponible.

## 🎯 ¿Qué Necesitas?

### 👨‍💻 Soy un Nuevo Desarrollador

**Empieza aquí:**
1. [README.md](README.md) - Visión general (5 min)
2. [SETUP.md](SETUP.md) - Instalación paso a paso (15 min)
3. [CONTRIBUTING.md](CONTRIBUTING.md) - Estándares de código (10 min)

**Después:**
- Ejecuta `pnpm --filter server dev` y `pnpm --filter web dev`
- Crea tu primer monitor en http://localhost:5173
- Lee el código en `server/src/` y `web/src/`

### 🚀 Debo Deployar en un VPS

**Sigue este documento:**
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guía completa (45 min)

**Incluye:**
- Instalación de Node.js y pnpm
- Configuración de PM2 (Process Manager)
- Nginx como reverse proxy
- SSL con Let's Encrypt
- Backups automáticos
- Seguridad en producción

**TL;DR rápido:**
1. Ubuntu/Debian + Node 18+
2. `git clone` + `pnpm install`
3. Configurar `.env`
4. `pnpm run build:all`
5. PM2 + Nginx + Let's Encrypt
6. Acceso en https://tu-dominio.com

### 🔄 Quiero Contribuir

**Sigue estos pasos:**
1. [CONTRIBUTING.md](CONTRIBUTING.md) - Reglas y proceso
2. Fork el repositorio
3. Crea una rama feature: `git checkout -b feat/tu-feature`
4. Haz cambios y tests
5. Haz Pull Request

**Importante:**
- No modificar código existente (funciona)
- Solo limpiar y documentar
- Seguir Conventional Commits
- Tests para nuevas features

### 📦 Necesito Instalar Localmente (Sin Desarrollo)

**Para probar en tu máquina:**
- [SETUP.md](SETUP.md) - Opción B (Desarrollo Local)

### 🔍 Quiero Entender Qué Cambió

**Lee el resumen:**
- [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md) - Qué se limpió y documentó

---

## 📂 Estructura de Documentación

```
📦 cybersense/
├── README.md                    ← Empezar aquí (visión general)
├── SETUP.md                     ← Instalación local
├── DEPLOYMENT.md                ← VPS + Nginx + PM2 + SSL (PRINCIPAL)
├── CONTRIBUTING.md              ← Guía para desarrolladores
├── DOCUMENTATION_INDEX.md        ← Este archivo
├── CLEANUP_SUMMARY.md           ← Resumen de cambios
├── .env.example                 ← Ejemplo de variables
└── ... (código de la aplicación)
```

---

## 📖 Documentos en Detalle

### [README.md](README.md)
**Duración:** 5 minutos  
**Audiencia:** Todos  
**Contenido:**
- Descripción del proyecto
- Requisitos
- Inicio rápido
- Ejemplos de API
- Tecnologías usadas
- Características
- Limitaciones

### [SETUP.md](SETUP.md)
**Duración:** 15-30 minutos  
**Audiencia:** Nuevos desarrolladores, usuarios locales  
**Contenido:**
- **Opción A:** VPS remoto (referencia a DEPLOYMENT.md)
- **Opción B:** Instalación local paso a paso
  - Requisitos previos
  - Descargar código
  - Configurar .env
  - Generar VAPID keys
  - Instalar dependencias
  - Configurar base de datos
  - Ejecutar en desarrollo
  - Post-instalación
- **Opción C:** Docker (próximamente)
- Troubleshooting detallado
- Verificación de instalación
- Próximos pasos

### [DEPLOYMENT.md](DEPLOYMENT.md)
**Duración:** 45 minutos - 1 hora  
**Audiencia:** DevOps, SysAdmin, Desarrolladores avanzados  
**Contenido:** ⭐ **DOCUMENTO PRINCIPAL PARA PRODUCCIÓN**

**Pasos cubiertos:**
1. Actualizar sistema (Ubuntu/Debian)
2. Instalar Node.js + pnpm
3. Instalar PM2
4. Descargar y configurar aplicación
5. Variables de entorno
6. Configurar base de datos
7. Compilar aplicación
8. **Nginx como reverse proxy**
9. **SSL con Let's Encrypt**
10. **Iniciar con PM2**
11. **Backups automáticos**
12. **Operaciones comunes**
13. **Troubleshooting**
14. **Seguridad (checklist)**

**Ejemplo de Nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name tu-dominio.com;
    
    # API
    location /api/ {
        proxy_pass http://localhost:4000;
    }
    
    # Frontend
    location / {
        root /opt/cybersense/web/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### [CONTRIBUTING.md](CONTRIBUTING.md)
**Duración:** 10 minutos  
**Audiencia:** Desarrolladores que quieren contribuir  
**Contenido:**
- Requisitos de desarrollo
- Configuración del entorno
- Estructura de código
- Convenciones (nombres, commits, etc.)
- Commits Convencionales
- Proceso de Pull Request
- Testing
- Debugging
- Reportar issues
- Código de conducta

**Ejemplo Commit:**
```bash
git commit -m "feat: agregar notificaciones por email"
git commit -m "fix: corregir timeout en checks HTTP"
git commit -m "docs: actualizar guía de deployment"
```

### [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)
**Duración:** 5 minutos  
**Audiencia:** Code reviewers, team leads  
**Contenido:**
- Archivos eliminados
- Documentación creada
- Mejoras en .env.example
- Actualización de .gitignore
- Estadísticas de cambios
- Checklist de seguridad
- Próximos pasos sugeridos

---

## 🔗 Referencias Rápidas

### Generar VAPID Keys
```bash
cd server
npx web-push generate-vapid-keys
```

### Generar JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Iniciar en Desarrollo
```powershell
pnpm --filter server dev  # Terminal 1
pnpm --filter web dev     # Terminal 2
```

### Build para Producción
```bash
pnpm run build:all
```

### Ver Logs en Producción
```bash
pm2 logs cybersense-server
pm2 monit
```

---

## ❓ FAQ Rápido

### ¿Por dónde empiezo?
→ Lee [README.md](README.md), luego [SETUP.md](SETUP.md)

### ¿Cómo instalo en mi máquina?
→ [SETUP.md](SETUP.md) - Opción B

### ¿Cómo instalo en un VPS?
→ [DEPLOYMENT.md](DEPLOYMENT.md) - Guía paso a paso

### ¿Cómo contribuyo al proyecto?
→ [CONTRIBUTING.md](CONTRIBUTING.md)

### ¿Qué archivos se eliminaron?
→ [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)

### ¿Cómo genero las variables de .env?
| Documento | Descripción | Audiencia |
|-----------|-------------|-----------|
| **[README.md](README.md)** | Visión general del proyecto, inicio rápido, arquitectura | Todos |
| **[SETUP.md](SETUP.md)** | Instalación paso a paso en desarrollo local | Nuevos desarrolladores |
| **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** | Despliegue en Vercel con Supabase (Producción) | DevOps/Deployment |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Despliegue en VPS con Nginx y PM2 | DevOps/SysAdmin |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | Convenciones de código, tests, pull requests | Desarrolladores |
| **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** | Este archivo - índice de toda la documentación | Todos |
→ [SETUP.md](SETUP.md) - Paso 3

### ¿Cómo configuro HTTPS?
→ [DEPLOYMENT.md](DEPLOYMENT.md) - Paso 9

### ¿Cómo hago backup de la BD?
→ [DEPLOYMENT.md](DEPLOYMENT.md) - Paso 12

---

## 🎓 Curva de Aprendizaje

```
Principiante          Intermedio          Avanzado
    ↓                    ↓                  ↓
  README.md      →    SETUP.md    →    DEPLOYMENT.md
   (5 min)           (15 min)           (45 min)

                 CONTRIBUTING.md
                   (10 min)
```

---

## ✅ Checklist Post-Instalación

### Después de instalar localmente:
- [ ] El navegador accede a http://localhost:5173
- [ ] Puedo hacer login
- [ ] Veo el dashboard
- [ ] Puedo crear un monitor
- [ ] El monitor ejecuta checks
- [ ] Las notificaciones funcionan

### Después de deployar en VPS:
- [ ] Acceso a https://tu-dominio.com
- [ ] HTTPS funciona (certificado válido)
- [ ] Login funciona
- [ ] API responde en /api/
- [ ] PM2 muestra proceso en ejecución
- [ ] Logs no muestran errores

---

## 📞 Necesito Ayuda

1. **Problema durante instalación local:**
   → Mira "Troubleshooting" en [SETUP.md](SETUP.md)

2. **Problema en VPS:**
   → Mira "Troubleshooting" en [DEPLOYMENT.md](DEPLOYMENT.md)

3. **Pregunta sobre desarrollo:**
   → Consulta [CONTRIBUTING.md](CONTRIBUTING.md)

4. **Quiero conocer la historia:**
   → Lee [CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)

5. **Aún tengo problemas:**
   → Abre un [issue en GitHub](../../issues)

---

## 🚀 Próximos Pasos Recomendados

- [ ] Instalar localmente usando SETUP.md
- [ ] Crear tu primer monitor
- [ ] Probar en VPS usando DEPLOYMENT.md
- [ ] Contribuir mejoras siguiendo CONTRIBUTING.md
- [ ] Compartir feedback

---

**Última actualización:** 29 de Enero, 2026  
**Documentación:** Completa y lista para producción ✅  
**Estado del código:** Sin cambios, solo documentación y limpieza  

¡Disfruta usando Cybersense! 🎉
