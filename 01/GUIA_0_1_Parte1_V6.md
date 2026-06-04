# GUIA 0.1 — SETUP INICIAL: NEXT.JS, TAILWIND, SHADCN/UI Y TEMAS
## PARTE 1: PROYECTO NEXT.JS + DEPENDENCIAS VISUALES + SHADCN/UI CLI

> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Parte:** 1 de 4
> **Prerequisito:** Node.js >= 20.9 y npm >= 11 instalados — verificar con `node -v` y `npm -v`
> **Siguiente parte:** `GUIA_0_1_Parte2_V6.md` — Estructura + Configuracion Base
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte crea el proyecto Next.js desde cero, instala todas las dependencias del sistema visual con versiones pineadas, agrega Framer Motion para animaciones scroll-triggered y genera el registro oficial de shadcn/ui. Es la fundacion sobre la que las Partes 2-4 construyen la configuracion y los componentes.

- **Bloque 1 — `create-next-app`:** Crear el proyecto Next.js 16.2.3 con los flags exactos que la arquitectura requiere.
- **Bloque 2 — Dependencias visuales (7 grupos):** Instalar las 12 dependencias del sistema visual: Tailwind, utilidades de clases, temas, iconos, primitivas Radix UI, inicializacion de Tailwind y Framer Motion.
- **Bloque 2.5 — shadcn/ui CLI init:** Generar `components.json` con el esquema oficial para que `npx shadcn add` funcione en guias posteriores.
- **Bloque 3 — PostCSS:** Reemplazar el archivo generado con export nombrado para eliminar warning de ESLint.

> **Al terminar esta parte:** El proyecto existe en disco, las 12 dependencias visuales + framer-motion estan en `node_modules`, `components.json` esta generado con alias `@/lib/utils`, PostCSS configurado. `npx tsc --noEmit` pasa sin errores.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell (`Write-Host`, `@'...'@`, `Set-Content`, `Remove-Item`). Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `@'...'@ | Set-Content -Path "ruta"` -> heredoc `cat > ruta << 'EOF'`
> - `Remove-Item "ruta"` -> `rm -f "ruta"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — CREAR PROYECTO BASE CON NEXT.JS 16.2.3

**Proposito:** Crear el proyecto con la version exacta del framework y los flags necesarios para la arquitectura de la presentacion interactiva.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Configuracion raiz (proyecto completo) |
| Ejecuta en | Build time + Dev server |
| Contrato | Genera `package.json`, `tsconfig.json`, `src/app/` con layout y page iniciales |
| Si lo modificas | Toda la guia asume esta estructura de carpetas y estas dependencias base |

### DECISIONES DE DISENO

**Por que version fija 16.2.3 y no `@latest`?**
`@latest` puede resolver a una version con breaking changes en TypeScript, Tailwind o ESLint sin aviso. La version pineada garantiza que todas las instalaciones — en cualquier maquina y en cualquier momento — produzcan exactamente el mismo resultado.

**Por que `--no-tailwind`?**
El flag `--tailwind` de create-next-app instala la version mas reciente (v4), que usa CSS-first config (`@theme`) incompatible con nuestro sistema de 3 capas. Al instalar Tailwind manualmente en el Bloque 2, controlamos la version exacta (3.4.19).

**Por que `--no-turbopack`?**
Turbopack consume 2-4GB RAM adicional con multiples instancias abiertas. En maquinas con RAM limitada causa freezes. Webpack es estable y suficiente para el scope de este proyecto.

```powershell
npx create-next-app@16.2.3 tenochtitlan `
  --typescript `
  --eslint `
  --no-tailwind `
  --src-dir `
  --app `
  --no-turbopack `
  --import-alias "@/*" `
  --no-react-compiler
```

**Que hace cada flag:**

| Flag | Proposito |
|:-----|:----------|
| `--typescript` | Habilita TypeScript desde la creacion — lenguaje obligatorio del proyecto |
| `--eslint` | Incluye configuracion ESLint de Next.js — se extiende en Parte 3 |
| `--no-tailwind` | No instalar Tailwind automaticamente — se instala manualmente en Bloque 2 para controlar la version exacta |
| `--src-dir` | Usa `src/` como raiz del codigo fuente — separacion limpia del codigo vs configuracion |
| `--app` | Usa App Router (no Pages Router) — obligatorio para Server Components y Server Actions |
| `--no-turbopack` | Desactiva Turbopack — se usa webpack estable |
| `--import-alias "@/*"` | Permite `import { cn } from '@/lib/utils'` en lugar de rutas relativas |
| `--no-react-compiler` | Evita que la terminal se pause esperando confirmacion del usuario durante la inicializacion |

```powershell
cd tenochtitlan

if (Test-Path package.json) {
    Write-Host "OK Proyecto creado exitosamente" -ForegroundColor Green
} else {
    Write-Host "ERROR: package.json no encontrado" -ForegroundColor Red
    exit
}

npm list next
```

---

## BLOQUE 2 — INSTALAR DEPENDENCIAS VISUALES

**Proposito:** Instalar las 12 dependencias del sistema visual + Framer Motion con versiones exactas y compatibles con React 19.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Dependencias npm (se registran en package.json) |
| Ejecuta en | Build time + Browser (segun la libreria) |
| Contrato | Todas las guias posteriores asumen que estas dependencias existen en `node_modules` |
| Si lo modificas | Cambiar versiones puede romper compatibilidad con React 19 o con el sistema de temas |

### DECISIONES DE DISENO

**Por que `--legacy-peer-deps` en algunos grupos?**
Next.js 16 incluye React 19. Algunos paquetes maduros (`next-themes`, primitivas Radix UI) aun declaran en su `package.json` soporte solo para React `^18`, aunque funcionan perfectamente con React 19. La bandera `--legacy-peer-deps` le indica a npm que ignore esa declaracion desactualizada. **Es el procedimiento oficial documentado por Vercel y shadcn/ui para React 19** — no es un workaround.

**Por que `--no-fund --no-audit` en todos los comandos?**
Evitan requests adicionales al registro de npm durante la instalacion. En Windows PowerShell esto puede congelar la terminal durante varios minutos.

> **Regla PowerShell:** Ejecutar cada grupo en su propio comando. **No usar `&&`** para encadenar — en PowerShell causa ejecucion concurrente que puede congelar la terminal.

---

### Grupo 1 — Tailwind CSS

```powershell
Write-Host "Instalando Tailwind CSS..." -ForegroundColor Cyan
npm install -D tailwindcss@3.4.19 postcss@8.5.6 autoprefixer@10.4.24 tailwindcss-animate@1.0.7 --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `tailwindcss` | 3.4.19 | Framework utility-first. Se usa v3 (no v4) porque v4 elimina `tailwind.config.ts` y migra a CSS-first, rompiendo el sistema de 3 capas semantico |
| `postcss` | 8.5.6 | Procesador CSS requerido por Tailwind |
| `autoprefixer` | 10.4.24 | Agrega prefijos de navegador automaticamente (`-webkit-`, `-moz-`, etc.) |
| `tailwindcss-animate` | 1.0.7 | Plugin de animaciones requerido por componentes shadcn/ui en Tailwind v3 |

---

### Grupo 2 — Utilidades de estilos

```powershell
Write-Host "Instalando utilidades de estilos..." -ForegroundColor Cyan
npm install clsx@2.1.1 tailwind-merge@3.5.0 class-variance-authority@0.7.1 --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `clsx` | 2.1.1 | Construye strings de clases CSS de forma condicional: `clsx('base', isActive && 'active')` |
| `tailwind-merge` | 3.5.0 | Resuelve conflictos entre clases Tailwind: `twMerge('p-2 p-4')` -> `'p-4'` |
| `class-variance-authority` | 0.7.1 | Define variantes de componentes con tipos TypeScript: `cva('base', { variants: { ... } })` |

> Estos tres paquetes no tienen peer dependencies de React — instalan sin conflictos en cualquier version.

---

### Grupo 3 — Sistema de temas

```powershell
Write-Host "Instalando next-themes..." -ForegroundColor Cyan
npm install next-themes@0.4.6 --legacy-peer-deps --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `next-themes` | 0.4.6 | Dark/Light mode con persistencia automatica en localStorage. Base del sistema de temas dark-first |

---

### Grupo 4 — Iconos

```powershell
Write-Host "Instalando iconos..." -ForegroundColor Cyan
npm install lucide-react@0.575.0 --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `lucide-react` | 0.575.0 | Iconos SVG como componentes React. Solo se incluye en el bundle el icono que se importa. Compatible con React 19 sin flags |

---

### Grupo 5 — Primitivas de UI base (Radix)

```powershell
Write-Host "Instalando primitivas Radix UI..." -ForegroundColor Cyan
npm install @radix-ui/react-slot@1.1.2 @radix-ui/react-label@2.1.2 --legacy-peer-deps --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `@radix-ui/react-slot` | 1.1.2 | Patron `asChild` — el componente hijo hereda estilos del padre sin romper el arbol HTML. Base de accesibilidad para Button |
| `@radix-ui/react-label` | 2.1.2 | Etiqueta semantica y accesible. Enlaza controles de formulario via `htmlFor` |

**Por que Radix manual y no via `npx shadcn init`?**
El CLI de shadcn sobrescribe `tailwind.config.ts` con su propia configuracion usando `require()` (CommonJS), lo que rompe el linter estricto de Next.js 16 que exige ESM. Al instalar las primitivas manualmente, mantenemos control total del sistema de temas.

---

### Grupo 6 — Inicializar Tailwind

```powershell
Write-Host "Inicializando Tailwind..." -ForegroundColor Cyan
npx tailwindcss@3.4.19 init -p --ts
```

**Que hace:** Genera `tailwind.config.ts` y `postcss.config.mjs` con configuracion minima. Ambos se reemplazan en bloques posteriores (Parte 2 Bloque 6 y Bloque 3 de esta parte respectivamente).

**Por que `--ts`?** Genera `tailwind.config.ts` directamente en TypeScript, evitando un archivo `.js` residual que podria causar conflictos.

---

### Grupo 7 — Framer Motion (Animaciones)

```powershell
Write-Host "Instalando Framer Motion..." -ForegroundColor Cyan
npm install framer-motion@12.12.1 --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `framer-motion` | 12.12.1 | Animaciones declarativas para React. Scroll-triggered reveals, parallax, transiciones entre secciones. Es la columna vertebral visual de la presentacion — tan fundamental como Tailwind |

**Por que instalarlo desde el inicio?**
Este proyecto ES animacion. Las secciones del scroll-storytelling dependen completamente de Framer Motion para su impacto visual. Instalarlo despues obligaria a refactorizar la estructura de los componentes. Los wrappers de animacion (ScrollReveal, FadeIn, etc.) se crean en Guia 0.3.

**Que aporta Framer Motion sobre CSS puro?**
- `useScroll()` + `useTransform()` para vincular animaciones al progreso del scroll
- `useInView()` para detectar cuando un elemento entra al viewport
- `AnimatePresence` para animaciones de entrada/salida de elementos
- `motion.div` como wrapper declarativo — no hay que gestionar clases CSS manualmente
- Spring physics para animaciones con sensacion natural (no lineales)
- Orquestacion: `staggerChildren` para animar listas item por item

---

## BLOQUE 2.5 — INICIALIZACION DE SHADCN/UI (CLI)

**Proposito:** Generar `components.json` con el esquema oficial del CLI. Este archivo es necesario para que `npx shadcn add` instale componentes en las rutas correctas en guias posteriores.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Configuracion raiz (`components.json`) |
| Ejecuta en | Solo CLI (no runtime) |
| Importado por | Todos los comandos `npx shadcn add` en guias posteriores |
| Contrato | Establece aliases: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks` |
| Si lo modificas | Los componentes shadcn/ui se instalan en rutas incorrectas. Todos los imports `@/components/ui/*` fallan |

### DECISIONES DE DISENO

**Por que ejecutar `init` ahora si se reemplazaran archivos despues?**
El CLI detecta las dependencias del Bloque 2 y crea el mapa de rutas oficial. Aunque modifica temporalmente `tailwind.config.ts` y `globals.css` con valores genericos, estos se reemplazan por la configuracion real del proyecto en Parte 2 (Bloque 6) y Parte 3 (Bloque 10).

**Pre-requisito:** Al crear el proyecto con `--no-tailwind`, `globals.css` no incluye las directivas de Tailwind. El CLI las busca forzosamente para validar que Tailwind existe. Inyectarlas antes:

```powershell
@'
@tailwind base;
@tailwind components;
@tailwind utilities;

'@ + (Get-Content "src\app\globals.css" -Raw) | Set-Content "src\app\globals.css"
Write-Host "OK Directivas de Tailwind inyectadas en globals.css" -ForegroundColor Green
```

Luego ejecutar la inicializacion:

```powershell
npx shadcn@2.5.0 init
```

**Respuestas a la encuesta interactiva del CLI:**

| Pregunta | Respuesta | Motivo |
|:---------|:----------|:-------|
| Style | `Default` | Estandar mas compatible con variables CSS |
| Base color | `Neutral` | Se sobrescribira con la paleta tech dark en Parte 3 |
| Use --legacy-peer-deps | `Yes` | Obligatorio para React 19 |
| CSS Variables | `Yes` | Obligatorio para el sistema de temas dinamico |
| Global CSS file | `src/app/globals.css` | Ubicacion estandar |
| tailwind.config.ts | `tailwind.config.ts` | Archivo generado en Bloque 2 |
| Components alias | `@/components` | Alias del tsconfig.json |
| Utils alias | `@/lib/utils` | Donde reside la funcion `cn()` |
| React Server Comp. | `Yes` | El proyecto usa App Router con Server Components |

> **Nota:** No alarmarse si el CLI modifica archivos de estilos o configuracion. Es comportamiento esperado. El control total del diseno se retoma en los bloques de reemplazo de Parte 2 y Parte 3.

**Resultado esperado:** archivo `components.json` generado con esta estructura:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---

## BLOQUE 3 — CONFIGURAR POSTCSS

📄 **ARCHIVO REEMPLAZADO** — `postcss.config.mjs`

**Proposito:** Reemplazar el archivo generado automaticamente con una version que usa export nombrado. El archivo generado por `tailwindcss init -p` usa un export anonimo que ESLint marca como warning (`import/no-anonymous-default-export`).

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Configuracion raiz |
| Ejecuta en | Build time (PostCSS procesa el CSS antes de servir) |
| Importado por | Tailwind CSS internamente durante el build |
| Si lo modificas | El CSS no se procesa correctamente. Tailwind deja de funcionar |

```powershell
$content = @'
/** @type {import('postcss-load-config').Config} */
const postcssConfig = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default postcssConfig;
'@

Set-Content -Path "postcss.config.mjs" -Value $content -Encoding UTF8

Remove-Item "postcss.config.js" -ErrorAction SilentlyContinue

Write-Host "OK postcss.config.mjs creado con export nombrado" -ForegroundColor Green
Write-Host "   Elimina warning ESLint import/no-anonymous-default-export" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 1

```powershell
Write-Host "`nValidando Parte 1 de Guia 0.1..." -ForegroundColor Yellow

$allOk = $true

# 1. Verificar que el proyecto existe
if (Test-Path "package.json") {
    Write-Host "  OK package.json existe" -ForegroundColor Green
} else {
    Write-Host "  FALLO package.json NO encontrado" -ForegroundColor Red
    $allOk = $false
}

# 2. Verificar dependencias visuales (12 paquetes de los 7 grupos)
$deps = @(
    "tailwindcss",
    "postcss",
    "autoprefixer",
    "tailwindcss-animate",
    "clsx",
    "tailwind-merge",
    "class-variance-authority",
    "next-themes",
    "lucide-react",
    "@radix-ui/react-slot",
    "@radix-ui/react-label",
    "framer-motion"
)
foreach ($dep in $deps) {
    $result = npm list $dep --depth=0 2>&1
    if ($result -match [regex]::Escape($dep)) {
        Write-Host "  OK $dep" -ForegroundColor Green
    } else {
        Write-Host "  FALLO $dep NO instalado" -ForegroundColor Red
        $allOk = $false
    }
}

# 3. Verificar components.json con alias correcto
if (Test-Path "components.json") {
    $json = Get-Content "components.json" -Raw | ConvertFrom-Json
    if ($json.aliases.utils -eq "@/lib/utils") {
        Write-Host "  OK components.json con alias correcto" -ForegroundColor Green
    } else {
        Write-Host "  FALLO components.json con alias incorrecto" -ForegroundColor Red
        $allOk = $false
    }
} else {
    Write-Host "  FALLO components.json NO existe" -ForegroundColor Red
    $allOk = $false
}

# 4. Verificar PostCSS con export nombrado
if (Test-Path "postcss.config.mjs") {
    $postcss = Get-Content "postcss.config.mjs" -Raw
    if ($postcss -match "const postcssConfig") {
        Write-Host "  OK postcss.config.mjs con export nombrado" -ForegroundColor Green
    } else {
        Write-Host "  FALLO postcss.config.mjs sin export nombrado" -ForegroundColor Red
        $allOk = $false
    }
} else {
    Write-Host "  FALLO postcss.config.mjs NO existe" -ForegroundColor Red
    $allOk = $false
}

# 5. Verificar TypeScript
Write-Host "`n  Verificando tipos..." -ForegroundColor Yellow
npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    $allOk = $false
}

if ($allOk) {
    Write-Host "`nPARTE 1 COMPLETADA — Proyecto base listo para Parte 2" -ForegroundColor Green
} else {
    Write-Host "`nPARTE 1 FALLO — Corregir errores antes de continuar" -ForegroundColor Red
}
```

> **STOP-ON-FAIL:** Si alguna validacion falla, las causas mas comunes son:
> - **Dependencia no instalada** -> Repetir el grupo correspondiente con sus banderas completas (`--legacy-peer-deps` si el grupo lo requeria)
> - **Terminal se congelo durante instalacion** -> Verificar con `npm list <paquete>`. Si no esta, repetir solo ese grupo
> - **`components.json` no existe o alias incorrecto** -> Repetir Bloque 2.5 completo. Verificar que las respuestas a la encuesta fueron correctas
> - **`postcss.config.mjs` sin export nombrado** -> Repetir Bloque 3
> - **TypeScript reporta errores** -> En esta parte no se crearon archivos TypeScript propios. Si `tsc --noEmit` falla, es un problema del proyecto generado — verificar que `create-next-app` termino sin errores

---

## RESUMEN DE ESTA PARTE

**Dependencias instaladas (12 paquetes en 7 grupos):**

| Grupo | Paquetes | Banderas especiales |
|:------|:---------|:--------------------|
| Tailwind CSS | tailwindcss 3.4.19, postcss 8.5.6, autoprefixer 10.4.24, tailwindcss-animate 1.0.7 | `-D` (devDependencies) |
| Utilidades de estilos | clsx 2.1.1, tailwind-merge 3.5.0, class-variance-authority 0.7.1 | Ninguna |
| Temas | next-themes 0.4.6 | `--legacy-peer-deps` |
| Iconos | lucide-react 0.575.0 | Ninguna |
| Primitivas Radix | @radix-ui/react-slot 1.1.2, @radix-ui/react-label 2.1.2 | `--legacy-peer-deps` |
| Tailwind init | (genera archivos, no instala paquetes) | Flag `--ts` |
| Animaciones | framer-motion 12.12.1 | Ninguna |

**Archivos generados/configurados:**

| Archivo | Estado | Proposito |
|:--------|:-------|:----------|
| `package.json` | MODIFICADO | Dependencias agregadas |
| `components.json` | NUEVO | Registry oficial shadcn/ui |
| `postcss.config.mjs` | REEMPLAZADO | Export nombrado sin warnings |
| `tailwind.config.ts` | GENERADO (se reemplaza en Parte 2) | Config minima temporal |

---

## SIGUIENTE PARTE

**-> Parte 2** — Estructura + Configuracion Base

Se crea la estructura de carpetas del proyecto (incluyendo `src/components/sections/`), los archivos base (`.env.local`, `utils.ts`, `types/index.ts`), la configuracion de Tailwind con el sistema de tokens semanticos tech dark, TypeScript en modo estricto y los scripts de `package.json` actualizados para Next.js 16.

---

> **Documento:** GUIA_0_1_Parte1_V6.md
> **Proyecto:** Presentacion Interactiva Tech Computer / Tenochtitlan
> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
