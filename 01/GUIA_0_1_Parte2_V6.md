# GUIA 0.1 — SETUP INICIAL: NEXT.JS, TAILWIND, SHADCN/UI Y TEMAS
## PARTE 2: ESTRUCTURA + CONFIGURACION BASE

> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Parte:** 2 de 4
> **Prerequisito:** Parte 1 completada y Fingerprint aprobado — `components.json` existe, `npx tsc --noEmit` pasa
> **Siguiente parte:** `GUIA_0_1_Parte3_V6.md` — Seguridad ESLint + Sistema Visual CSS
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte establece la estructura de carpetas del proyecto, crea los archivos base que todas las guias posteriores importan, configura el sistema de tokens semanticos de Tailwind (Capa 2 del sistema de 3 capas con paleta tech dark), habilita TypeScript en modo estricto y ajusta los scripts de desarrollo para Next.js 16.

- **Bloque 4 — Estructura de carpetas:** Crear los directorios que todas las guias posteriores dan por sentados, incluyendo `src/components/sections/` para las secciones del scroll-storytelling.
- **Bloque 5 — Archivos base:** Crear `.env.local`, `.env.example`, `src/lib/utils.ts` y `src/types/index.ts`.
- **Bloque 6 — `tailwind.config.ts`:** Configurar el sistema de tokens semanticos tech dark — Capa 2 que mapea variables CSS a clases Tailwind.
- **Bloque 7 — `tsconfig.json`:** Habilitar TypeScript strict con 6 reglas adicionales.
- **Bloque 8 — Scripts de `package.json`:** Corregir scripts para Next.js 16: `--webpack` en dev, `eslint` directo, `predev` auto-limpieza.

> **Al terminar esta parte:** Los 5 directorios existen, los 4 archivos base estan creados, `tailwind.config.ts` tiene el sistema semantico tech dark completo, TypeScript esta en strict mode, y `package.json` tiene scripts correctos para Next.js 16. `npx tsc --noEmit` pasa sin errores.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell (`Write-Host`, `@'...'@`, `Set-Content`, `Remove-Item`). Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `@'...'@ | Set-Content -Path "ruta"` -> heredoc `cat > ruta << 'EOF'`
> - `Remove-Item "ruta"` -> `rm -f "ruta"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 4 — CREAR ESTRUCTURA DE CARPETAS

**Proposito:** Establecer la organizacion de archivos que todas las guias posteriores dan por sentada. Incluye el directorio `sections/` donde viviran las secciones del scroll-storytelling (Hero, Diagnostico, Plan, etc.).

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Directorios del proyecto |
| Ejecuta en | Solo estructura — sin archivos ejecutables |
| Contrato | Las guias 0.1-0.9 asumen que estos directorios existen |
| Si lo modificas | Cualquier guia posterior que cree archivos en estos directorios fallara |

### DECISIONES DE DISENO

**Por que `src/components/sections/` desde ahora?**
Las secciones del scroll-storytelling son el entregable principal del proyecto. Cada seccion (Hero, Diagnostico, Solucion, Timeline, etc.) sera un componente independiente con sus propias animaciones Framer Motion. Crear el directorio desde el inicio establece la convencion antes de que exista codigo.

```powershell
New-Item -ItemType Directory -Force -Path "src/components/ui" | Out-Null
New-Item -ItemType Directory -Force -Path "src/components/sections" | Out-Null
New-Item -ItemType Directory -Force -Path "src/lib" | Out-Null
New-Item -ItemType Directory -Force -Path "src/types" | Out-Null
New-Item -ItemType Directory -Force -Path "utils" | Out-Null

Write-Host "OK Estructura de carpetas creada" -ForegroundColor Green
```

**Estructura resultante:**

```
src/
├── app/              ← Ya existe (creado por create-next-app) — Paginas, layouts, rutas
├── components/
│   ├── ui/           ← Componentes shadcn/ui — se empiezan a usar en la Guia 0.1 Parte 4
│   └── sections/     ← Secciones del scroll-storytelling — se crean desde Guia 0.4
├── lib/              ← Utilidades compartidas: cn(), clientes Supabase, stores
└── types/            ← Interfaces y tipos TypeScript compartidos entre modulos

utils/                ← Scripts y herramientas standalone fuera del contexto de Next.js
```

| Directorio | Proposito | Se usa desde |
|:-----------|:----------|:-------------|
| `src/app/` | Paginas, layouts y rutas del App Router | Guia 0.1 |
| `src/components/ui/` | Componentes UI reutilizables (patron shadcn/ui) | Guia 0.1 Parte 4 |
| `src/components/sections/` | Secciones del scroll-storytelling (Hero, Diagnostico, etc.) | Guia 0.4+ |
| `src/lib/` | Funciones utilitarias, clientes de servicios, stores Zustand | Guia 0.1 |
| `src/types/` | Interfaces y tipos TypeScript compartidos | Guia 0.1 |
| `utils/` | Scripts standalone que no pertenecen al bundle de Next.js | Guia 0.1 |

---

## BLOQUE 5 — CREAR ARCHIVOS BASE

**Proposito:** Crear los archivos fundamentales que todas las guias posteriores importan o referencian.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Configuracion de entorno + Utilidades + Tipos TypeScript |
| Ejecuta en | `.env.*` en runtime (servidor/browser), `utils.ts` en browser, `types/index.ts` solo compilacion |
| Importado por | `utils.ts`: todos los componentes del proyecto. `types/index.ts`: Server Actions, stores, componentes |
| Contrato | Exporta `cn()`, `ApiResponse<T>`, `LoadingState`, `PaginationParams` |
| Si lo modificas | `cn()` es usado en todos los componentes — cambiar su firma rompe todo. Los tipos base se importan en todo el proyecto |

---

### Archivo 1: `.env.local` — Variables de entorno del proyecto

**Para que sirve?** Almacena las credenciales y configuracion que varia entre entornos. Las variables con prefijo `NEXT_PUBLIC_` son accesibles desde el navegador — las demas solo desde el servidor.

**Este archivo NO se sube al repositorio Git** (esta en `.gitignore` por defecto en Next.js). Las credenciales de Supabase se llenaran en la Guia 0.2 cuando se configure la autenticacion.

```powershell
$content = @'
# ═══════════════════════════════════════════════════════════════
# VARIABLES DE ENTORNO — Tenochtitlan (Presentacion Interactiva)
# ═══════════════════════════════════════════════════════════════
# Las variables NEXT_PUBLIC_ son accesibles desde el navegador.
# Las demas solo desde el servidor (Server Components, Server Actions).

# Supabase — Se llenan en Guia 0.2 cuando se configure auth
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Configuracion de la aplicacion
NEXT_PUBLIC_APP_NAME="tenochtitlan"
NEXT_PUBLIC_APP_URL=http://localhost:3000
'@

New-Item -Path ".env.local" -ItemType File -Force | Out-Null
Set-Content -Path ".env.local" -Value $content -Encoding UTF8
Write-Host "OK .env.local creado" -ForegroundColor Green
Write-Host "   Credenciales de Supabase se llenan en Guia 0.2" -ForegroundColor Cyan
```

---

### Archivo 2: `.env.example` — Plantilla para el equipo

**Para que sirve?** Plantilla que SI se incluye en el repositorio Git. Documenta que variables existen sin exponer sus valores.

```powershell
$content = @'
# ═══════════════════════════════════════════════════════════════
# PLANTILLA DE VARIABLES DE ENTORNO — Tenochtitlan
# ═══════════════════════════════════════════════════════════════
# Copiar este archivo como .env.local y llenar con los valores reales.
# Obtener las claves de Supabase en: https://supabase.com/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Configuracion de la aplicacion
NEXT_PUBLIC_APP_NAME="tenochtitlan"
NEXT_PUBLIC_APP_URL=http://localhost:3000
'@

New-Item -Path ".env.example" -ItemType File -Force | Out-Null
Set-Content -Path ".env.example" -Value $content -Encoding UTF8
Write-Host "OK .env.example creado" -ForegroundColor Green
Write-Host "   Plantilla para compartir — va al repositorio Git" -ForegroundColor Cyan
```

---

### Archivo 3: `src/lib/utils.ts` — Funcion `cn()` para clases Tailwind

**Para que sirve?** La funcion `cn()` es el estandar de shadcn/ui para combinar clases de Tailwind de forma inteligente. Hace dos cosas:
1. **`clsx`:** Permite clases condicionales — `cn('base', isActive && 'active', className)`
2. **`twMerge`:** Resuelve conflictos entre clases Tailwind — si pasas `p-2 p-4`, queda solo `p-4`

Se usa en **todos** los componentes del proyecto. Es el unico lugar donde estas dos librerias se combinan.

```powershell
$content = @'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases de Tailwind de forma inteligente.
 *
 * - Resuelve conflictos: cn('p-2', 'p-4') -> 'p-4'
 * - Permite clases condicionales: cn('base', isActive && 'active')
 * - Permite override desde el padre: cn('bg-surface', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
'@

New-Item -Path "src/lib/utils.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/utils.ts" -Value $content -Encoding UTF8
Write-Host "OK src/lib/utils.ts creado" -ForegroundColor Green
Write-Host "   cn() disponible para todos los componentes del proyecto" -ForegroundColor Cyan
```

---

### Archivo 4: `src/types/index.ts` — Tipos base compartidos

**Para que sirve?** Define las interfaces TypeScript que se reutilizan en toda la aplicacion. Proporciona tipado consistente para respuestas de API, estados de carga y paginacion desde el primer momento.

**Nota:** Los tipos especificos de Supabase (auth, sesion) se agregaran en la Guia 0.2 en `src/types/auth.ts`.

```powershell
$content = @'
/**
 * Tipos base compartidos en toda la aplicacion.
 *
 * Tipos especificos de dominio (auth, secciones, contenido)
 * se definen en archivos separados a partir de la Guia 0.2.
 */

// Tipo generico para respuestas de API y Server Actions
// T es el tipo del dato que se espera cuando la operacion es exitosa
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// Estados de carga para cualquier operacion asincrona
// Se usa para controlar spinners, botones deshabilitados y mensajes de error
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Parametros de paginacion para listas y tablas
// total es opcional — no siempre se conoce antes de hacer la consulta
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}
'@

New-Item -Path "src/types/index.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/types/index.ts" -Value $content -Encoding UTF8
Write-Host "OK src/types/index.ts creado" -ForegroundColor Green
Write-Host "   ApiResponse<T>, LoadingState, PaginationParams disponibles" -ForegroundColor Cyan
```

---

## BLOQUE 6 — CONFIGURAR TAILWIND CSS (SISTEMA SEMANTICO TECH DARK)

📄 **ARCHIVO REEMPLAZADO** — `tailwind.config.ts`

**Proposito:** Configurar Tailwind con el sistema de tokens semanticos tech dark que alimenta la presentacion interactiva. Todos los componentes consumen clases semanticas — nunca colores fijos. Este archivo es la Capa 2 del sistema de 3 capas: recibe las variables CSS de `globals.css` (Parte 3) y las expone como clases de Tailwind.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Configuracion raiz |
| Ejecuta en | Build time (Tailwind JIT compiler) |
| Importa de | Variables CSS de `src/app/globals.css` (Parte 3, Bloque 10) |
| Importado por | Todos los componentes que usan clases Tailwind |
| Contrato | Expone tokens semanticos como clases: `bg-primary-accent`, `text-foreground`, `bg-surface`, `shadow-premium-sm`, etc. Compatibilidad shadcn/ui completa |
| Si lo modificas | Todas las clases de color, sombra y animacion del proyecto dependen de este archivo. Romper un token rompe todos los componentes que lo usan |

### DECISIONES DE DISENO

**Por que un sistema semantico y no colores fijos?**
Aunque esta presentacion tiene una unica paleta (tech dark), el sistema semantico permite: (1) que los componentes shadcn/ui funcionen sin modificacion, (2) que exista light mode como V2 sin tocar ningun componente, y (3) que cambiar un color de acento afecte toda la app desde un solo lugar (`globals.css`).

**Por que la paleta tech dark con cyan + violeta?**
El cliente es del sector tecnologia (Tech Computer). El cyan/teal evoca RGB, terminales, modernidad. El violeta/magenta complementa como acento secundario — referencia a iluminacion gamer sin ser infantil. Juntos crean una estetica profesional pero con caracter.

**Por que tokens de `surface` (3 capas)?**
La presentacion muestra datos en cards (diagnostico, costos, timeline), comparativas en tablas y secciones con diferentes niveles de elevacion. Sin capas de superficie, todo el contenido flota en el mismo plano visual.

**Por que `chart-1..4`?**
La presentacion incluye datos de negocio: costos actuales vs propuestos, metricas de mejora, timeline de implementacion. Se necesita una paleta de datos distinguible y accesible.

**Por que ESM (`import type`) y no `require()`?**
TypeScript strict con `@typescript-eslint/no-require-imports` marca `require()` como error. ESM es obligatorio en Next.js 16.

**Por que `/ <alpha-value>` en cada color?**
Permite usar opacidad dinamica desde Tailwind (`bg-primary-accent/50`, `border-surface/80`). Sin este patron, las utilidades de opacidad de Tailwind no funcionan con variables CSS personalizadas.

**Por que sombras `premium-*`?**
La presentacion usa cards elevadas, secciones con profundidad y efectos de parallax. Las sombras estandar de Tailwind son demasiado pronunciadas para una estetica dark premium. Las sombras `premium-*` son sutiles y no compiten con el contenido.

**Por que la fuente es Inter?**
Maxima legibilidad en pantalla, moderna, tech-clean. Se carga via `next/font` con la variable `--font-inter` inyectada en `<html>` desde `layout.tsx` (Parte 3).

> **Instruccion:** Este script sobrescribe completamente el `tailwind.config.ts` generado por `npx tailwindcss init` en el Bloque 2 (Parte 1). Ejecutar desde la raiz del proyecto.

```powershell
$content = @'
// ═══════════════════════════════════════════════════════════════════════
// TAILWIND CONFIG — SISTEMA DE TOKENS SEMANTICOS TECH DARK
// Paleta tech/gamer: cyan/teal + violeta/magenta sobre negro profundo
// Los componentes consumen clases semanticas, nunca colores HSL directos.
// ═══════════════════════════════════════════════════════════════════════
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  // Activa dark mode por clase CSS (.dark en <html>) — manejado por next-themes.
  // El modo "media" (prefers-color-scheme) no permite que el usuario overridee
  // su preferencia del sistema operativo.
  darkMode: ["class"],

  // Tailwind escanea estos archivos para generar solo las clases que se usan.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {

        // ═══════════════════════════════════════════════════════════════
        // CAPA BASE — Fondos y texto principal
        // ═══════════════════════════════════════════════════════════════

        // Fondo principal (gris claro en light, negro profundo con matiz azul en dark)
        background:             'hsl(var(--color-background) / <alpha-value>)',

        // Texto sobre background — contraste WCAG AA (4.5:1) garantizado
        foreground:             'hsl(var(--color-foreground) / <alpha-value>)',

        // Texto secundario: subtitulos, placeholders, metadatos
        'muted-foreground':     'hsl(var(--color-muted-foreground) / <alpha-value>)',

        // Bordes de inputs, divisores y separadores
        border:                 'hsl(var(--color-border) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // CAPAS DE SUPERFICIE — Elevacion visual de componentes
        // La presentacion muestra datos en cards, tablas comparativas y
        // secciones con profundidad — necesita capas para separar visualmente.
        // ═══════════════════════════════════════════════════════════════

        // Fondo de cards, paneles, secciones — una capa sobre background
        surface:                'hsl(var(--color-surface) / <alpha-value>)',

        // Fondo de dropdowns, tooltips, popovers — segunda capa de elevacion
        'surface-raised':       'hsl(var(--color-surface-raised) / <alpha-value>)',

        // Fondo de modales y drawers — la capa mas elevada
        'surface-overlay':      'hsl(var(--color-surface-overlay) / <alpha-value>)',

        // Hover sobre filas, items de lista, botones ghost
        'hover-background':     'hsl(var(--color-hover-background) / <alpha-value>)',

        // Fondo del sidebar — fijo, no cambia con el tema (ancla visual)
        sidebar:                'hsl(var(--color-sidebar) / <alpha-value>)',

        // Texto sobre el sidebar oscuro
        'sidebar-foreground':   'hsl(var(--color-sidebar-foreground) / <alpha-value>)',

        // Hover sobre items del sidebar
        'sidebar-hover':        'hsl(var(--color-sidebar-hover) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // ACCENT PRIMARIO — Cyan/Teal (color de marca tech)
        // Botones CTA, links activos, indicadores de seleccion.
        // Evoca tecnologia, RGB, modernidad.
        // ═══════════════════════════════════════════════════════════════

        'primary-accent':       'hsl(var(--color-primary-accent) / <alpha-value>)',

        // Fondo sutil para badges, highlights y estados activos
        'primary-accent-bg':    'hsl(var(--color-primary-accent-bg) / <alpha-value>)',

        // Texto sobre primary-accent (normalmente blanco o negro segun contraste)
        'primary-accent-text':  'hsl(var(--color-primary-accent-text) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // ACCENT SECUNDARIO — Violeta/Magenta (complemento gamer)
        // Acciones secundarias, tags, categorias visuales, decoracion.
        // ═══════════════════════════════════════════════════════════════

        'secondary-accent':      'hsl(var(--color-secondary-accent) / <alpha-value>)',
        'secondary-accent-bg':   'hsl(var(--color-secondary-accent-bg) / <alpha-value>)',
        'secondary-accent-text': 'hsl(var(--color-secondary-accent-text) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // ESTADOS DE FEEDBACK — Los 4 estados obligatorios
        // La presentacion muestra datos de diagnostico con colores de estado:
        // metricas positivas (success), alertas (warning), problemas (error),
        // datos informativos (info).
        // ═══════════════════════════════════════════════════════════════

        success:            'hsl(var(--color-success) / <alpha-value>)',
        'success-bg':       'hsl(var(--color-success-bg) / <alpha-value>)',
        warning:            'hsl(var(--color-warning) / <alpha-value>)',
        'warning-bg':       'hsl(var(--color-warning-bg) / <alpha-value>)',
        error:              'hsl(var(--color-error) / <alpha-value>)',
        'error-bg':         'hsl(var(--color-error-bg) / <alpha-value>)',
        info:               'hsl(var(--color-info) / <alpha-value>)',
        'info-bg':          'hsl(var(--color-info-bg) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // PALETA DE DATOS — Graficas, badges, categorias en tablas
        // 4 colores distinguibles, accesibles en light y dark.
        // Usados en: costos, comparativas, timeline, metricas.
        // ═══════════════════════════════════════════════════════════════

        'chart-1':          'hsl(var(--color-chart-1) / <alpha-value>)',
        'chart-2':          'hsl(var(--color-chart-2) / <alpha-value>)',
        'chart-3':          'hsl(var(--color-chart-3) / <alpha-value>)',
        'chart-4':          'hsl(var(--color-chart-4) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // COMPATIBILIDAD SHADCN/UI
        // shadcn/ui usa nombres de token propios. Este bloque mapea
        // los tokens semanticos del proyecto a los nombres que shadcn espera,
        // para que Button, Dialog, Toast funcionen sin modificaciones.
        // ═══════════════════════════════════════════════════════════════

        primary:                  'hsl(var(--color-primary-accent) / <alpha-value>)',
        'primary-foreground':     'hsl(var(--color-primary-accent-text) / <alpha-value>)',

        secondary:                'hsl(var(--color-secondary-accent) / <alpha-value>)',
        'secondary-foreground':   'hsl(var(--color-secondary-accent-text) / <alpha-value>)',

        muted:                    'hsl(var(--color-surface) / <alpha-value>)',

        accent:                   'hsl(var(--color-hover-background) / <alpha-value>)',
        'accent-foreground':      'hsl(var(--color-foreground) / <alpha-value>)',

        destructive:              'hsl(var(--color-error) / <alpha-value>)',
        'destructive-foreground': 'hsl(var(--color-primary-accent-text) / <alpha-value>)',

        ring:                     'hsl(var(--color-primary-accent) / <alpha-value>)',

        input:                    'hsl(var(--color-border) / <alpha-value>)',

        popover:                  'hsl(var(--color-surface-raised) / <alpha-value>)',
        'popover-foreground':     'hsl(var(--color-foreground) / <alpha-value>)',

        card:                     'hsl(var(--color-surface) / <alpha-value>)',
        'card-foreground':        'hsl(var(--color-foreground) / <alpha-value>)',
      },

      // ═══════════════════════════════════════════════════════════════
      // BORDER RADIUS — Controlado por variable CSS para consistencia global
      // Cambiar --radius en globals.css ajusta todos los bordes del sistema.
      // ═══════════════════════════════════════════════════════════════
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        xs:   "calc(var(--radius) - 6px)",
      },

      // ═══════════════════════════════════════════════════════════════
      // TIPOGRAFIA — Inter como fuente del sistema
      // Se carga con next/font (inline CSS, cero FOUT).
      // La variable --font-inter se inyecta en <html> desde layout.tsx.
      // ═══════════════════════════════════════════════════════════════
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ═══════════════════════════════════════════════════════════════
      // SOMBRAS PREMIUM — Para estetica dark con profundidad
      // Las sombras estandar de Tailwind son demasiado pronunciadas para
      // interfaces dark premium. Estas sombras son sutiles y dan profundidad
      // sin competir con las animaciones ni el contenido.
      // ═══════════════════════════════════════════════════════════════
      boxShadow: {
        // Cards, secciones — elevacion minima
        "premium-sm":    "0 2px 8px -1px rgba(0,0,0,0.06), 0 1px 4px -1px rgba(0,0,0,0.04)",
        // Dropdowns, selects, tooltips — elevacion media
        "premium-md":    "0 8px 24px -4px rgba(0,0,0,0.10), 0 4px 12px -2px rgba(0,0,0,0.06)",
        // Modales, drawers — elevacion alta
        "premium-lg":    "0 20px 48px -8px rgba(0,0,0,0.14), 0 12px 24px -4px rgba(0,0,0,0.08)",
        // Inputs focus — sombra interna
        "premium-inner": "inset 0 1px 3px 0 rgba(0,0,0,0.06)",
        // Sidebar, nav fija — sombra lateral derecha
        "premium-side":  "4px 0 16px -2px rgba(0,0,0,0.08)",
      },

      // ═══════════════════════════════════════════════════════════════
      // ANIMACIONES — Para transiciones de entrada en secciones
      // Complementan tailwindcss-animate (requerido por shadcn/ui).
      // Las animaciones complejas de scroll van con Framer Motion,
      // estas son para transiciones simples de UI.
      // ═══════════════════════════════════════════════════════════════
      keyframes: {
        // Entrada suave para contenido al navegar entre secciones
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Entrada para modales y overlays
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },

  // tailwindcss-animate: requerido por los componentes shadcn/ui (Dialog,
  // Sheet, Popover) para sus animaciones de entrada/salida.
  plugins: [tailwindcssAnimate],
};

export default config;
'@

New-Item -Path "tailwind.config.ts" -ItemType File -Force | Out-Null
Set-Content -Path "tailwind.config.ts" -Value $content -Encoding UTF8
Write-Host "OK tailwind.config.ts creado — sistema semantico tech dark" -ForegroundColor Green
Write-Host "   Tokens: base + superficie (3 capas) + accents cyan/violeta + 4 estados + 4 chart" -ForegroundColor Cyan
Write-Host "   Compatibilidad shadcn/ui completa — primary, secondary, muted, card, popover" -ForegroundColor Cyan
Write-Host "   Sombras premium-* calibradas para estetica dark con profundidad" -ForegroundColor Cyan
```

---

### Como funciona el sistema de 3 capas

```
Capa 1: Variables CSS (globals.css — Parte 3, Bloque 10)
   Define los valores HSL reales para dark y light mode.
   Ejemplo: --color-primary-accent: 178 100% 50%;  /* cyan vibrante */
        |
        v
Capa 2: Tailwind config (este archivo)
   Mapea las variables CSS a nombres de clase de Tailwind.
   Ejemplo: 'primary-accent': 'hsl(var(--color-primary-accent) / <alpha-value>)'
        |
        v
Capa 3: Componentes (JSX/TSX)
   Usan clases semanticas que nunca cambian aunque el tema cambie.
   Ejemplo: className="bg-primary-accent text-primary-accent-text"
```

**Resultado:** Para cambiar toda la paleta de la app, solo se modifica `globals.css`. Ningun componente se toca.

---

## BLOQUE 7 — CONFIGURAR TYPESCRIPT (STRICT MODE)

📄 **ARCHIVO REEMPLAZADO** — `tsconfig.json`

**Proposito:** Habilitar TypeScript en modo estricto para prevenir categorias enteras de errores en tiempo de compilacion.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Configuracion raiz |
| Ejecuta en | Solo compilacion (tsc) |
| Contrato | Habilita strict mode + 6 reglas adicionales. Alias `@/*` apunta a `./src/*` |
| Si lo modificas | Desactivar cualquier regla strict permite bugs silenciosos en logica de auth y manejo de datos |

### DECISIONES DE DISENO

**Por que modo estricto en una presentacion interactiva?**
La presentacion incluye autenticacion real (Supabase Auth), manejo de sesiones y datos de negocio del cliente. Un error de tipo puede causar:
- Acceso a `null` no detectado que muestra una pantalla en blanco al cliente
- Variables sin tipo que el editor no puede autocompletar — desarrollo mas lento
- Codigo muerto que se acumula sin que nadie lo detecte

Las reglas estrictas convierten estos problemas en errores de compilacion que se corrigen inmediatamente.

> **Nota:** Este archivo sobrescribe el `tsconfig.json` generado por `create-next-app`, que tiene configuracion basica.

```powershell
$content = @'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./src/*"]},

    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
'@

New-Item -Path "tsconfig.json" -ItemType File -Force | Out-Null
Set-Content -Path "tsconfig.json" -Value $content -Encoding UTF8
Write-Host "OK TypeScript configurado en modo estricto completo" -ForegroundColor Green
Write-Host "   strict + 6 reglas adicionales activas" -ForegroundColor Cyan
```

**Que previene cada regla?**

| Regla | Que previene | Ejemplo de error que atrapa |
|:------|:-------------|:----------------------------|
| `strictNullChecks` | Acceso a propiedades de valores que pueden ser `null` o `undefined` | `usuario.nombre` cuando `usuario` puede ser `null` |
| `noImplicitAny` | Variables sin tipo explicito que TypeScript infiere como `any` | `function calcular(precio)` sin tipo en el parametro |
| `noUnusedLocals` | Variables declaradas que nunca se usan | `const temp = 0;` sin uso posterior |
| `noUnusedParameters` | Parametros de funcion que nunca se leen | `function fn(a: string, b: number)` donde `b` nunca se usa |
| `noImplicitReturns` | Funciones que no siempre retornan un valor | `function validar(x): boolean { if (x) return true; }` (falta el `return false`) |
| `noFallthroughCasesInSwitch` | Cases en switch sin `break` que caen al siguiente | `case 'A': doA(); case 'B': doB();` sin `break` entre ambos |

---

## BLOQUE 8 — SCRIPTS DE PACKAGE.JSON

📄 **ARCHIVO MODIFICADO** — `package.json` (seccion `scripts`)

**Proposito:** Establecer los scripts de desarrollo, build, lint y limpieza de cache en sus formas correctas para Next.js 16. Este bloque corrige dos cambios de ruptura respecto a versiones anteriores y resuelve un problema real de rendimiento en desarrollo.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Configuracion raiz |
| Ejecuta en | CLI (npm run) |
| Si lo modificas | `dev` sin `--webpack` causa consumo excesivo de RAM. `lint` apuntando a `next lint` falla porque fue eliminado en Next.js 16 |

### DECISIONES DE DISENO

**Por que `--webpack` en `dev`?**
Next.js 16 usa Turbopack como bundler por defecto. Turbopack es mas rapido pero consume considerablemente mas RAM (2-4GB adicionales). En maquinas de desarrollo con multiples instancias abiertas (varias terminales, browser con DevTools, editor) puede bloquear el sistema. Con `--webpack`, el servidor de desarrollo usa Webpack estable con un footprint de memoria predecible. El build de produccion (`next build`) no lleva el flag — Next.js detecta la configuracion automaticamente.

**Por que `"lint": "eslint"` y no `"next lint"`?**
`next lint` fue eliminado completamente en Next.js 16. El CLI de `create-next-app` ya genera `"eslint"` directamente. Si el proyecto venia de una version anterior, este script puede estar desactualizado — el bloque lo corrige.

**Por que `predev` en lugar de limpiar manualmente?**
npm ejecuta automaticamente cualquier script llamado `pre{nombre}` antes del script `{nombre}`. `predev` corre antes de `dev` sin necesidad de llamarlo explicitamente — el desarrollador solo ejecuta `npm run dev` y la cache se limpia sola. Previene cuelgues y errores de cache corrupta al copiar, mover o restaurar el proyecto.

```powershell
# Leer el package.json actual como objeto PowerShell
$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json

# ── Sobrescribir cada script individualmente ──────────────────────────
# --webpack: fuerza Webpack en dev para evitar consumo excesivo de RAM
$pkg.scripts.dev = "next dev --webpack"

# build: sin flag — Next.js detecta PostCSS automaticamente en produccion
$pkg.scripts.build = "next build"

# start: sin cambios — sirve el build de produccion localmente
$pkg.scripts.start = "next start"

# lint: next lint fue eliminado en Next.js 16 — llamar eslint directamente
$pkg.scripts.lint = "eslint"

# lint:fix: corrige automaticamente errores que ESLint puede resolver solo
$pkg.scripts | Add-Member -Name "lint:fix" -MemberType NoteProperty `
    -Value "eslint --fix" -Force

# Comentario documentado dentro del package.json (npm lo ignora)
$pkg.scripts | Add-Member -Name "//predev" -MemberType NoteProperty `
    -Value "Limpia .next/ antes de arrancar dev — previene cuelgues al copiar o mover el proyecto" `
    -Force

# predev: se ejecuta automaticamente ANTES de 'npm run dev'
$pkg.scripts | Add-Member -Name "predev" -MemberType NoteProperty `
    -Value "node -e `"const fs=require('fs'); fs.rmSync('.next', {recursive:true, force:true});`"" `
    -Force

# Serializar y escribir preservando la estructura original del archivo
$pkg_json = $pkg | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText("$PWD\package.json", $pkg_json)

Write-Host "OK package.json actualizado con scripts correctos para Next.js 16" -ForegroundColor Green
Write-Host "   dev usa --webpack — Turbopack desactivado en desarrollo (ahorro de RAM)" -ForegroundColor Cyan
Write-Host "   lint llama 'eslint' directamente — next lint eliminado en Next.js 16" -ForegroundColor Cyan
Write-Host "   predev limpia .next/ automaticamente antes de cada 'npm run dev'" -ForegroundColor Cyan
```

**Estado final de `scripts` en `package.json`:**

| Script | Comando | Cuando se ejecuta |
|:-------|:--------|:------------------|
| `dev` | `next dev --webpack` | Desarrollo local — Webpack estable, RAM controlada |
| `build` | `next build` | Compilacion de produccion |
| `start` | `next start` | Servir build de produccion localmente |
| `lint` | `eslint` | Revisar errores — incluye regla de seguridad `getSession` (Parte 3) |
| `lint:fix` | `eslint --fix` | Corregir automaticamente errores resolubles |
| `predev` | `node -e ...` | Automatico antes de `dev` — limpia `.next/` |

---

## FINGERPRINT — VALIDACION PARTE 2

```powershell
Write-Host "`nValidando Parte 2 de la Guia 0.1..." -ForegroundColor Yellow

$allOk = $true

# ═══════════════════════════════════════════════════════════════════
# 1. DIRECTORIOS (Bloque 4)
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Directorios:" -ForegroundColor Gray
$dirs = @("src/lib", "src/types", "src/components/ui", "src/components/sections", "utils")
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  OK $dir" -ForegroundColor Green
    } else {
        Write-Host "  FALLO $dir NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

# ═══════════════════════════════════════════════════════════════════
# 2. ARCHIVOS BASE (Bloque 5)
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Archivos base:" -ForegroundColor Gray
$files = @(".env.local", ".env.example", "src/lib/utils.ts", "src/types/index.ts")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  OK $file" -ForegroundColor Green
    } else {
        Write-Host "  FALLO $file NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

# ═══════════════════════════════════════════════════════════════════
# 3. TAILWIND CONFIG (Bloque 6)
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Configuracion:" -ForegroundColor Gray
if (Test-Path "tailwind.config.ts") {
    $tw = Get-Content "tailwind.config.ts" -Raw
    if ($tw -match "<alpha-value>") {
        Write-Host "  OK tailwind.config.ts con tokens semanticos" -ForegroundColor Green
    } else {
        Write-Host "  FALLO tailwind.config.ts sin <alpha-value> — opacidad dinamica no funcionara" -ForegroundColor Red
        $allOk = $false
    }
} else {
    Write-Host "  FALLO tailwind.config.ts NO existe" -ForegroundColor Red
    $allOk = $false
}

# ═══════════════════════════════════════════════════════════════════
# 4. TSCONFIG (Bloque 7)
# ═══════════════════════════════════════════════════════════════════
if (Test-Path "tsconfig.json") {
    $ts = Get-Content "tsconfig.json" -Raw
    if ($ts -match '"strict": true') {
        Write-Host "  OK tsconfig.json con strict mode" -ForegroundColor Green
    } else {
        Write-Host "  FALLO tsconfig.json sin strict mode" -ForegroundColor Red
        $allOk = $false
    }
} else {
    Write-Host "  FALLO tsconfig.json NO existe" -ForegroundColor Red
    $allOk = $false
}

# ═══════════════════════════════════════════════════════════════════
# 5. PACKAGE.JSON SCRIPTS (Bloque 8)
# ═══════════════════════════════════════════════════════════════════
if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" -Raw
    if ($pkg -match "--webpack") {
        Write-Host "  OK package.json con --webpack en dev" -ForegroundColor Green
    } else {
        Write-Host "  FALLO package.json sin --webpack en dev" -ForegroundColor Red
        $allOk = $false
    }
} else {
    Write-Host "  FALLO package.json NO existe" -ForegroundColor Red
    $allOk = $false
}

# ═══════════════════════════════════════════════════════════════════
# 6. TYPESCRIPT CHECK
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Verificando tipos..." -ForegroundColor Yellow
npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    $allOk = $false
}

# ═══════════════════════════════════════════════════════════════════
# RESULTADO FINAL
# ═══════════════════════════════════════════════════════════════════
Write-Host ""
if ($allOk) {
    Write-Host "PARTE 2 COMPLETADA — Estructura, configuracion y sistema de tokens listos" -ForegroundColor Green
} else {
    Write-Host "PARTE 2 INCOMPLETA — Corregir los errores antes de continuar a la Parte 3" -ForegroundColor Red
}
```

> **STOP-ON-FAIL:** Si alguna verificacion falla, las causas mas comunes son:
> - **`tailwind.config.ts` sin `<alpha-value>`** -> las clases de opacidad (`bg-primary-accent/50`) no funcionaran en ningun componente posterior — repetir Bloque 6
> - **`tsconfig.json` sin `"moduleResolution": "bundler"`** -> Next.js 16 requiere este valor exacto; `"node"` o `"node16"` causan errores de importacion con el App Router — repetir Bloque 7
> - **`dev` sin `--webpack`** -> Turbopack consumira RAM excesiva con multiples instancias abiertas — sintoma: terminal congelada al arrancar el servidor — repetir Bloque 8
> - **`lint` apuntando a `next lint`** -> el comando no existe en Next.js 16 — `npm run lint` fallara siempre — repetir Bloque 8
> - **TypeScript reporta errores** -> verificar que `src/lib/utils.ts` tiene los imports correctos de `clsx` y `tailwind-merge`. Si las dependencias no estan instaladas, repetir Parte 1

---

## RESUMEN DE ESTA PARTE

**Directorios creados:**

| Directorio | Proposito |
|:-----------|:----------|
| `src/components/ui/` | Componentes shadcn/ui — se empiezan a usar en Parte 4 |
| `src/components/sections/` | Secciones del scroll-storytelling (Hero, Diagnostico, etc.) — Guia 0.4+ |
| `src/lib/` | Utilidades compartidas: `cn()`, stores, clientes de servicios |
| `src/types/` | Interfaces y tipos TypeScript compartidos entre modulos |
| `utils/` | Scripts standalone fuera del contexto de Next.js |

**Archivos creados:**

| Archivo | Proposito |
|:--------|:----------|
| `.env.local` | Variables de entorno — no va al repositorio |
| `.env.example` | Plantilla de variables — va al repositorio |
| `src/lib/utils.ts` | Funcion `cn()` — estandar de combinacion de clases en todo el proyecto |
| `src/types/index.ts` | Tipos base: `ApiResponse`, `LoadingState`, `PaginationParams` |

**Archivos reemplazados:**

| Archivo | Que cambio |
|:--------|:-----------|
| `tailwind.config.ts` | Sistema semantico tech dark completo — tokens de superficie, accents cyan/violeta, chart colors, shadcn/ui |
| `tsconfig.json` | Strict mode con 6 reglas adicionales + `moduleResolution: bundler` |
| `package.json` | Scripts actualizados para Next.js 16: `--webpack`, `eslint` directo, `lint:fix`, `predev` |

---

## SIGUIENTE PARTE

**-> Parte 3** — Seguridad ESLint + Sistema Visual CSS

Se configura la regla ESLint que bloquea `getSession()` y el patron `_` para parametros ignorados, se definen las variables CSS de la paleta tech dark (cyan/teal + violeta/magenta sobre negro profundo) en `globals.css`, y se crea el layout raiz con ThemeProvider, Inter y dark mode como default.

---

> **Documento:** GUIA_0_1_Parte2_V6.md
> **Proyecto:** Presentacion Interactiva Tech Computer / Tenochtitlan
> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
