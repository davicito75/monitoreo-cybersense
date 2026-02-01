# Guía de Contribución - Cybersense

Gracias por tu interés en contribuir a Cybersense. Esta guía te ayudará a preparar tu entorno de desarrollo.

## Requisitos de Desarrollo

- Node.js 18+
- pnpm (recomendado) o npm
- Git
- Un editor de código (VS Code recomendado)

## Configuración del Entorno

### 1. Fork y Clonar

```bash
# Clona tu fork
git clone https://github.com/tu-usuario/cybersense.git
cd cybersense

# Añade el repo upstream
git remote add upstream https://github.com/proyecto/cybersense.git
```

### 2. Instalar Dependencias

```bash
pnpm install
cd server && pnpm install
cd ../web && pnpm install
cd ..
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
# Edita .env con valores de desarrollo
```

### 4. Configurar Base de Datos

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
pnpm run seed
cd ..
```

### 5. Ejecutar en Desarrollo

```powershell
# Terminal 1: Backend
pnpm --filter server dev

# Terminal 2: Frontend
pnpm --filter web dev
```

## Estructura del Código

```
server/
  ├── src/
  │   ├── app.ts              # Express app
  │   ├── config.ts           # Configuración
  │   ├── auth/               # Autenticación
  │   ├── controllers/        # Rutas y controladores
  │   ├── db/                 # Base de datos
  │   ├── jobs/               # Scheduler de checks
  │   ├── notifications/      # Web Push
  │   ├── routes/             # Definición de rutas
  │   ├── services/           # Lógica de negocio
  │   └── types/              # TypeScript types
  ├── prisma/
  │   └── schema.prisma       # Schema BD
  └── test/

web/
  ├── src/
  │   ├── main.tsx            # Entrada
  │   ├── App.tsx             # App principal
  │   ├── api.ts              # Cliente API
  │   ├── components/         # Componentes React
  │   ├── pages/              # Páginas/vistas
  │   ├── contexts/           # React Context
  │   └── hooks/              # Custom hooks
  └── public/
      └── sw.js               # Service Worker
```

## Convenciones de Código

### Nombres de Archivos
- Componentes React: PascalCase (`Monitor.tsx`)
- Archivos de utilidad: camelCase (`apiClient.ts`)
- Variables: camelCase
- Constantes: UPPER_SNAKE_CASE

### Commits
```bash
git commit -m "feat: descripción corta de la feature"
git commit -m "fix: descripción del bug arreglado"
git commit -m "docs: actualizaciones de documentación"
git commit -m "refactor: cambios de código sin cambiar funcionalidad"
```

Prefijos recomendados:
- `feat:` - Nueva característica
- `fix:` - Arreglo de bug
- `docs:` - Documentación
- `style:` - Formateo, sin cambios en lógica
- `refactor:` - Cambios en código sin nuevas features
- `test:` - Tests
- `chore:` - Tareas de build, deps, etc.

## Antes de Hacer Pull Request

### 1. Actualiza tu Rama

```bash
git fetch upstream
git rebase upstream/main
```

### 2. Prueba tu Código

```bash
# Lint
pnpm run lint

# Format
pnpm run format

# Tests
pnpm --filter server test
pnpm --filter web test
```

### 3. Documentación

- Actualiza README.md si añades features nuevas
- Documenta funciones complejas
- Añade ejemplos de API si corresponde

### 4. Commit y Push

```bash
git push origin tu-rama-feature
```

## Pull Request

### Título
- Ser descriptivo y conciso
- Ejemplo: "feat: añadir notificaciones por email"

### Descripción
```markdown
## Descripción
Breve descripción de los cambios

## Tipo de Cambio
- [ ] Bugfix
- [ ] Feature
- [ ] Breaking change
- [ ] Documentación

## Cómo probar
Pasos para probar los cambios

## Checklist
- [ ] Mi código sigue el estilo de este proyecto
- [ ] Actualicé la documentación
- [ ] Añadí/actualicé tests
- [ ] No hay warnings en consola
```

## Testing

### Backend
```bash
cd server
pnpm test
```

### Frontend
```bash
cd web
pnpm test
```

Intenta mantener cobertura de tests >70%

## Debugging

### Backend
```bash
# Con logs detallados
DEBUG=* pnpm --filter server dev

# Con debugger de Node
node --inspect-brk ./node_modules/.bin/tsx src/app.ts
# Luego abre chrome://inspect
```

### Frontend
- Abre DevTools del navegador (F12)
- Usa React DevTools extension

## Reportar Issues

Antes de abrir un issue, verifica:
- [ ] Es un bug real (no una pregunta)
- [ ] No ha sido reportado antes
- [ ] Puedes reproducirlo consistentemente

### Template de Issue
```markdown
## Descripción
Descripción clara del problema

## Pasos para Reproducir
1. ...
2. ...
3. ...

## Comportamiento Esperado
Qué debería pasar

## Comportamiento Actual
Qué pasa en realidad

## Logs/Screenshots
Adjunta logs o screenshots

## Entorno
- OS: Windows/Linux/Mac
- Node version: 18.x
- Navegador: Chrome 120
```

## Preguntas o Problemas?

1. Revisa la [documentación](README.md)
2. Mira los [issues existentes](../../issues)
3. Abre una [discusión](../../discussions)

## Código de Conducta

Se espera que todos los contribuidores:
- Sean respetuosos
- Acepten crítica constructiva
- Se enfoquen en lo mejor para el proyecto
- Respeten la privacidad de otros

---

¡Gracias por contribuir a Cybersense! 🎉
