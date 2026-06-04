# GUIA 0.1 — SETUP INICIAL: NEXT.JS, TAILWIND, SHADCN/UI Y TEMAS
## PARTE 4: COMPONENTES Y VERIFICACION FINAL

> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Parte:** 4 de 4 (ultima parte)
> **Prerequisito:** Parte 3 completada — archivos `eslint.config.mjs`, `globals.css` y `layout.tsx` existentes
> **Siguiente guia:** `GUIA_0_2_Parte0_V6.md` — Dependencias de Negocio
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte cierra la fundacion visual del proyecto creando los tres componentes que hacen funcionar el sistema de temas en el navegador, y una pagina de verificacion que confirma visualmente que todo esta conectado correctamente.

- **Bloque 11 — Componentes de tema:** `theme-provider.tsx` (wrapper permanente de next-themes) y `theme-switcher.tsx` (selector interactivo de paleta y modo con hidratacion segura).
- **Bloque 12 — `error-boundary.tsx`:** Captura errores de React que de otro modo mostrarian pantalla en blanco. Class component — unica excepcion al patron funcional.
- **Bloque 13 — Componentes UI base (shadcn):** `button.tsx`, `input.tsx` y `label.tsx` instalados via CLI y reemplazados con versiones calibradas para la presentacion interactiva.
- **Bloque 14 — `page.tsx`:** Pagina de verificacion visual con muestra de las 3 paletas, 6 modos, 4 estados de feedback y componentes UI base.

> **Al terminar esta parte:** `npm run build` pasa sin errores. El sistema de temas es verificable en `http://localhost:3000` — paletas, dark mode y componentes base funcionando.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell (`Write-Host`, `@'...'@`, `Set-Content`, `Remove-Item`). Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `@'...'@ | Set-Content -Path "ruta"` -> heredoc `cat > ruta << 'EOF'`
> - `Remove-Item "ruta"` -> `rm -f "ruta"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 11 — COMPONENTES DE TEMA

**Proposito:** Crear los dos componentes que habilitan el sistema de temas en toda la aplicacion. El primero es infraestructura pura — no tiene UI. El segundo es el selector interactivo de verificacion visual que confirma que las 3 paletas y el dark mode funcionan correctamente durante las guias 0.1 a 0.5.

---

### Componente 1: ThemeProvider — Wrapper de next-themes

📄 **ARCHIVO COMPLETO** — `src/components/theme-provider.tsx`

**Proposito:** Wrapper delgado sobre `next-themes`. No tiene UI propia — su unica funcion es mantener la importacion limpia en `layout.tsx` y evitar importar `next-themes` directamente en el layout raiz. Es permanente: no se reemplaza en ninguna guia posterior.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component (Client Component) |
| Ejecuta en | Browser |
| Importa de | `next-themes` (`ThemeProvider as NextThemesProvider`) |
| Importado por | `src/app/layout.tsx` |
| Contrato | Exporta `ThemeProvider` que acepta las mismas props que `NextThemesProvider`. Pasa todas las props sin modificar (`...props`) — es un proxy puro |
| Si lo modificas | Quitar este componente de `layout.tsx` desactiva dark mode y paletas en toda la app |

```powershell
$content = @'
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * ThemeProvider — Wrapper sobre next-themes.
 *
 * Provee el contexto de tema (dark/light/system + paletas) a toda la app.
 * Debe envolver el contenido del RootLayout en src/app/layout.tsx.
 *
 * La configuración (attribute, defaultTheme, enableSystem) se pasa
 * desde layout.tsx — este componente no toma decisiones de configuración.
 *
 * No se reemplaza en guías posteriores. Es infraestructura permanente.
 */
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            {children}
        </NextThemesProvider>
    )
}
'@

New-Item -Path "src/components/theme-provider.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/theme-provider.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/theme-provider.tsx creado" -ForegroundColor Green
Write-Host "🎨 Wrapper permanente — configuración vive en layout.tsx" -ForegroundColor Cyan
```

---

### Componente 2: ThemeSwitcher — Selector interactivo

📄 **ARCHIVO COMPLETO** — `src/components/theme-switcher.tsx`

**Proposito:** Selector interactivo de paleta y modo (light/dark/system). Es el componente de verificacion visual de las guias 0.1 a 0.5 — confirma que las 3 paletas y el dark mode funcionan correctamente antes de avanzar. Se reemplaza en Guia 0.6 por el `ThemeToggler` integrado en el Topbar del App Shell, con persistencia en BD y sincronizacion cross-device.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component (Client Component) |
| Patron | Componente interactivo con estado local + localStorage |
| Ejecuta en | Browser |
| Importa de | `next-themes` (`useTheme`), `lucide-react`, `@/lib/utils` (`cn`) |
| Importado por | `src/app/page.tsx` (pagina de verificacion) |
| Contrato | Exporta `ThemeSwitcher`. Gestiona `data-theme` en `<html>` y persiste paleta en `localStorage` bajo key `app-palette` |
| Si lo modificas | Este componente se reemplaza en Guia 0.6. Cambios aqui no afectan guias posteriores |

### DECISIONES DE DISENO

**Por que `useSyncExternalStore` para hidratacion?**
`useTheme()` retorna `undefined` en SSR. Sin este guard el componente renderiza contenido incorrecto o lanza errores de hidratacion. Patron aprobado en la skill — prohibido usar `useState(false)` + `useEffect(() => setMounted(true))`.

**Por que `localStorage` para la paleta?**
Persiste independientemente del modo dark/light. Son dos preferencias separadas: el modo lo gestiona `next-themes`, la paleta la gestiona este componente directamente.

**Por que colores hardcodeados en los dots de preview?**
Los dots de preview de paleta usan `style={{ backgroundColor }}` porque son datos visuales estaticos que representan el color de cada paleta, no tokens de tema. Excepcion documentada a la regla de no usar colores fijos.

```powershell
$content = @'
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, Palette, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

type ColorMode = "light" | "dark" | "system"

interface PaletteOption {
    id: string
    label: string
    // Color fijo representativo para el dot de preview.
    // Excepción documentada a la regla de no usar colores hardcodeados:
    // estos valores son datos estáticos que identifican visualmente cada
    // paleta — no son tokens de tema que deban cambiar con el modo.
    dotColor: string
    dataTheme: string | null
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE PALETAS
// Debe coincidir con los data-theme definidos en globals.css.
// null en dataTheme = paleta slate (default, sin atributo en <html>)
// ═══════════════════════════════════════════════════════════════════
const PALETTES: PaletteOption[] = [
    {
        id: "slate",
        label: "Slate",
        dotColor: "#4F6BDB",
        dataTheme: null,
    },
    {
        id: "zinc",
        label: "Zinc",
        dotColor: "#C07A1A",
        dataTheme: "zinc",
    },
    {
        id: "ocean",
        label: "Ocean",
        dotColor: "#1A9E8F",
        dataTheme: "ocean",
    },
]

const COLOR_MODES: { id: ColorMode; label: string; icon: React.ReactNode }[] = [
    { id: "light",  label: "Claro",   icon: <Sun className="h-4 w-4" /> },
    { id: "system", label: "Sistema", icon: <Monitor className="h-4 w-4" /> },
    { id: "dark",   label: "Oscuro",  icon: <Moon className="h-4 w-4" /> },
]

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

/**
 * ThemeSwitcher — Selector de modo y paleta semántica.
 *
 * Componente de verificación visual para guías 0.1 a 0.5.
 * En Guía 0.6 se reemplaza por ThemeToggler en el Topbar del App Shell,
 * con persistencia en BD y sincronización cross-device.
 */
export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    
    // ── Estado con inicialización perezosa (Lazy Initializer) ─────────
    // Evita el error de lint "set-state-in-effect" al leer el valor 
    // antes del primer renderizado directamente desde localStorage.
    const [activePalette, setActivePalette] = React.useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("app-palette")
            return saved ? saved : "slate"
        }
        return "slate"
    })

    // ── Hidratación segura ────────────────────────────────────────────
    // useSyncExternalStore es el patrón aprobado para detectar cliente vs servidor.
    // useTheme() retorna undefined en SSR — sin este guard el componente
    // renderiza contenido incorrecto o lanza errores de hidratación.
    // PROHIBIDO: useState(false) + useEffect(() => setMounted(true))
    const isClient = React.useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    )

    // ── Sincronización del DOM (Atributo data-theme) ──────────────────
    // Sincroniza visualmente el HTML con la paleta activa en estado.
    // Al no hacer setState aquí, evitamos el cascading render.
    React.useEffect(() => {
        const palette = PALETTES.find(p => p.id === activePalette)
        if (palette?.dataTheme) {
            document.documentElement.setAttribute("data-theme", palette.dataTheme)
        } else {
            document.documentElement.removeAttribute("data-theme")
        }
    }, [activePalette])

    // ── Skeleton de carga ─────────────────────────────────────────────
    // Mismas dimensiones que el componente real para evitar layout shift.
    if (!isClient) {
        return (
            <div className="w-64 h-40 rounded-xl bg-surface animate-pulse" />
        )
    }

    // ── Handler de paleta ─────────────────────────────────────────────
    const handlePaletteChange = (palette: PaletteOption) => {
        setActivePalette(palette.id)
        // Persistir en localStorage — independiente del modo dark/light
        localStorage.setItem("app-palette", palette.id)
    }

    return (
        <div className={cn(
            "flex flex-col gap-4 p-4 rounded-xl border",
            "bg-surface border-border shadow-premium-sm",
            "w-64"
        )}>

            {/* ── Selector de modo ──────────────────────────────────── */}
            <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Monitor className="h-3.5 w-3.5" />
                    Modo
                </span>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-hover-background">
                    {COLOR_MODES.map((mode) => (
                        <button
                            key={mode.id}
                            onClick={() => setTheme(mode.id)}
                            title={mode.label}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md",
                                "text-xs font-medium transition-all duration-150",
                                theme === mode.id
                                    // Activo: fondo elevado + color de acento primario
                                    ? "bg-surface shadow-premium-sm text-primary-accent"
                                    // Inactivo: transparente + texto muted con hover
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {mode.icon}
                            <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Divisor semántico */}
            <div className="h-px bg-border" />

            {/* ── Selector de paleta ────────────────────────────────── */}
            <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Palette className="h-3.5 w-3.5" />
                    Paleta
                </span>
                <div className="flex flex-col gap-1">
                    {PALETTES.map((palette) => {
                        const isActive = activePalette === palette.id
                        return (
                            <button
                                key={palette.id}
                                onClick={() => handlePaletteChange(palette)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 rounded-lg",
                                    "text-sm transition-all duration-150 border",
                                    isActive
                                        // Activo: fondo accent-bg + borde sutil del acento
                                        ? "bg-primary-accent-bg text-primary-accent font-medium border-primary-accent/20"
                                        // Inactivo: hover suave + borde transparente
                                        : "text-foreground hover:bg-hover-background border-transparent"
                                )}
                            >
                                <span className="flex items-center gap-2.5">
                                    {/* Dot de preview — color fijo, ver nota en PaletteOption */}
                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                                        style={{ backgroundColor: palette.dotColor }}
                                    />
                                    {palette.label}
                                </span>
                                {/* Checkmark visible solo en la paleta activa */}
                                {isActive && (
                                    <Check className="h-3.5 w-3.5 text-primary-accent flex-shrink-0" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
'@

New-Item -Path "src/components/theme-switcher.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/theme-switcher.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/theme-switcher.tsx creado" -ForegroundColor Green
Write-Host "🌗 Selector de 3 modos (light/dark/system) + 3 paletas (slate/zinc/ocean)" -ForegroundColor Cyan
Write-Host "⚡ Hidratación segura con useSyncExternalStore — sin warnings de SSR" -ForegroundColor Cyan
Write-Host "💾 Paleta persiste en localStorage bajo key 'app-palette'" -ForegroundColor Cyan
```

---

## BLOQUE 12 — ERROR BOUNDARY

📄 **ARCHIVO COMPLETO** — `src/components/error-boundary.tsx`

**Proposito:** Captura errores de React que de otro modo mostrarian una pantalla en blanco al usuario. En desarrollo Next.js muestra su propio overlay de error — en produccion muestra la UI amigable de este componente. Es infraestructura permanente que no se modifica en guias posteriores.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component (Client Component — class component) |
| Patron | Error Boundary (class component obligatorio — no hay equivalente en hooks) |
| Ejecuta en | Browser |
| Importa de | `react`, `lucide-react` |
| Importado por | `src/app/page.tsx` (verificacion). En guias posteriores se usa en layouts de modulos |
| Contrato | Exporta `ErrorBoundary` como named export. Props: `children` (obligatorio), `fallbackMessage` (opcional) |
| Si lo modificas | La UI de error en produccion cambia. No afecta la deteccion de errores — eso es logica de React |

### DECISIONES DE DISENO

**Por que clase React y no funcion?**
`componentDidCatch` y `getDerivedStateFromError` solo existen en class components. No hay equivalente con hooks todavia. Es la unica excepcion al patron de componentes funcionales en el proyecto.

```powershell
$content = @'
"use client"

import React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallbackMessage?: string
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE
// Debe ser una clase — getDerivedStateFromError y componentDidCatch
// no tienen equivalente en hooks. Esta es la única excepción al
// patrón de componentes funcionales en el proyecto.
// ═══════════════════════════════════════════════════════════════════

/**
 * ErrorBoundary — Captura errores de React en el árbol de componentes.
 *
 * En desarrollo: Next.js muestra su propio overlay de error encima.
 * En producción: muestra la UI de este componente al usuario.
 *
 * Uso:
 * <ErrorBoundary><ComponenteComplejo /></ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary:", error.message)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children
        }

        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-6 max-w-md w-full">

                    <div className="w-full bg-surface border border-border rounded-xl p-8 shadow-premium-md flex flex-col items-center gap-4 text-center">

                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error-bg">
                            <AlertTriangle className="w-6 h-6 text-error" />
                        </div>

                        <div className="flex flex-col gap-1">
                            <h2 className="text-lg font-semibold text-foreground">
                                Algo salio mal
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {this.props.fallbackMessage ??
                                    "Ocurrio un error inesperado. Puedes intentar recargar esta seccion."}
                            </p>
                        </div>

                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="w-full bg-hover-background border border-border rounded-lg p-3 text-left">
                                <p className="text-xs font-mono text-muted-foreground break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-accent text-primary-accent-text text-sm font-medium transition-all duration-150 hover:opacity-90 shadow-premium-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reintentar
                        </button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Si el problema persiste, recarga la pagina completa.
                    </p>
                </div>
            </div>
        )
    }
}
'@

New-Item -Path "src/components/error-boundary.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/error-boundary.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/error-boundary.tsx creado" -ForegroundColor Green
Write-Host "🛡️ Captura errores de React — pantalla amigable en produccion" -ForegroundColor Cyan
Write-Host "🔍 Detalle del error visible solo en NODE_ENV=development" -ForegroundColor Cyan
Write-Host "♻️ Boton de reintentar — recuperacion sin recargar la pagina" -ForegroundColor Cyan
```

---

## BLOQUE 13 — COMPONENTES UI BASE

**Proposito:** Instalar y personalizar los tres componentes shadcn/ui que todas las guias posteriores dan por existentes. Se instalan via CLI para que `components.json` registre sus dependencias, y se reemplazan inmediatamente con versiones calibradas para interfaces de presentacion.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente UI base (Client Component) |
| Ejecuta en | Browser |
| Importa de | `@radix-ui/react-slot`, `class-variance-authority`, `@radix-ui/react-label`, `@/lib/utils` |
| Importado por | Todos los formularios y paginas del proyecto |
| Contrato | Exporta `Button` (+ `buttonVariants`), `Input` (+ `InputProps`), `Label` (+ `LabelProps`) |
| Si lo modificas | Cambiar variantes de Button afecta todos los botones del proyecto. Cambiar Input afecta todos los formularios |

### DECISIONES DE DISENO

**Por que modificarlos si shadcn ya los genera con los tokens correctos?**
El CLI genera los componentes con los tokens estandar de shadcn (`bg-primary`, `ring-offset-background`) que el Bloque 6 ya mapeo a nuestro sistema — por eso los colores heredan automaticamente. Lo que si se modifica son las decisiones visuales que shadcn toma por defecto: radios de borde, sombras, pesos tipograficos y estados de interaccion.

**Por que gradiente sutil en variante `default` de Button?**
El boton principal deja de ser plano. Un gradiente de `primary-accent` hacia un tono ligeramente mas oscuro da profundidad sin ser llamativo. En interfaces con muchos botones, esto ayuda a identificar la accion principal de un vistazo.

**Por que `font-medium` en lugar de `font-semibold` en Button?**
En interfaces densas con muchos botones, `semibold` genera ruido visual. `medium` mantiene legibilidad con menos peso tipografico.

**Por que `duration-150` en transiciones?**
Mas rapida que el default de Tailwind (200ms). En interfaces interactivas con muchos elementos, las transiciones lentas generan sensacion de lentitud.

**Por que `bg-surface` en Input en vez de `bg-background`?**
Los inputs deben verse "elevados" sobre el fondo de la pagina. Usar la capa de superficie crea esta separacion visual sin necesitar sombras.

**Componentes que se crean:**

| Componente | Archivo | Caracteristicas |
|:-----------|:--------|:----------------|
| **Button** | `src/components/ui/button.tsx` | 6 variantes semanticas (default, destructive, outline, secondary, ghost, link) · 4 tamanos (sm, default, lg, icon) · Variante default con gradiente sutil + `shadow-premium-sm` · Transiciones 150ms · Soporte `asChild` para usar con `Link` de Next.js |
| **Input** | `src/components/ui/input.tsx` | Fondo `bg-surface` elevado · Ring de focus con color `primary-accent` · `shadow-premium-inner` al enfocar · Placeholder con opacidad 60% · Compatible con todos los tipos HTML |
| **Label** | `src/components/ui/label.tsx` | `font-medium` explicito · `text-foreground` explicito · Estado disabled sincronizado via `htmlFor` · Click en label activa input — accesible via Radix |

---

### Paso 1 — Instalar via CLI

```powershell
npx shadcn@2.5.0 add button -y
npx shadcn@2.5.0 add input -y
npx shadcn@2.5.0 add label -y

Write-Host "✅ Componentes shadcn instalados en src/components/ui/" -ForegroundColor Green
```

Nota para el implementador: La flag -y omite el prompt de confirmacion de shadcn pero NO el prompt de peer dependencies — ese siempre aparece cuando el CLI detecta React 19. Seleccionar Use --legacy-peer-deps en los tres componentes.

---

### Paso 2 — Reemplazar Button

📄 **ARCHIVO REEMPLAZADO** — `src/components/ui/button.tsx`

```powershell
$content = @'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════════
// VARIANTES DEL BOTÓN
// Cada variante tiene un propósito semántico claro:
// - default: acción principal de la vista (solo una por pantalla)
// - secondary: acción secundaria o complementaria
// - outline: acción terciaria o de navegación
// - ghost: acción discreta — toolbars, iconos, menús
// - destructive: acciones irreversibles (eliminar, cancelar pedido)
// - link: navegación inline en texto
// ═══════════════════════════════════════════════════════════════════
const buttonVariants = cva(
    // Base: comportamiento y tipografía comunes a todas las variantes
    [
        "inline-flex items-center justify-center gap-2",
        "whitespace-nowrap rounded-md text-sm font-medium",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    ].join(" "),
    {
        variants: {
            variant: {
                // Acción principal: gradiente sutil + sombra de elevación mínima
                // El gradiente va del accent puro a un tono 10% más oscuro
                default: [
                    "bg-primary-accent text-primary-accent-text",
                    "bg-gradient-to-b from-primary-accent to-primary-accent/90",
                    "shadow-premium-sm",
                    "hover:opacity-95 hover:shadow-premium-md",
                    "active:shadow-none active:translate-y-px",
                ].join(" "),

                // Acción destructiva: rojo semántico del sistema
                destructive: [
                    "bg-error text-primary-accent-text",
                    "shadow-premium-sm",
                    "hover:opacity-90",
                    "active:shadow-none active:translate-y-px",
                ].join(" "),

                // Acción secundaria: fondo surface con borde definido
                outline: [
                    "border border-border bg-surface text-foreground",
                    "hover:bg-hover-background hover:shadow-premium-inner",
                    "active:bg-hover-background",
                ].join(" "),

                // Acción complementaria: fondo secondary-accent suave
                secondary: [
                    "bg-secondary-accent-bg text-secondary-accent",
                    "hover:bg-secondary-accent/20",
                ].join(" "),

                // Acción discreta: sin fondo hasta el hover
                ghost: [
                    "text-foreground",
                    "hover:bg-hover-background hover:text-foreground",
                ].join(" "),

                // Navegación inline: solo subrayado, sin fondo
                link: [
                    "text-primary-accent underline-offset-4",
                    "hover:underline",
                ].join(" "),
            },
            size: {
                // sm: formularios compactos, toolbars con espacio limitado
                sm:      "h-8 rounded-md px-3 text-xs",
                // default: uso general
                default: "h-9 px-4 py-2",
                // lg: CTAs destacados, botones de submit en formularios principales
                lg:      "h-10 rounded-md px-8",
                // icon: botones de solo ícono — toolbar, topbar, acciones de tabla
                icon:    "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    /**
     * Si true, el Button renderiza como su hijo directo usando Radix Slot.
     * Útil para usar el estilo de Button en un componente Link de Next.js:
     * <Button asChild><Link href="/dashboard">Ir al dashboard</Link></Button>
     */
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        // Slot permite que el Button "preste" sus estilos a su hijo
        // sin romper la semántica HTML ni el árbol de componentes
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
'@

New-Item -Path "src/components/ui/button.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/ui/button.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/ui/button.tsx reemplazado" -ForegroundColor Green
Write-Host "🎨 Variantes: default (gradiente) | destructive | outline | secondary | ghost | link" -ForegroundColor Cyan
Write-Host "⚡ Transiciones 150ms — más rápidas para interfaces interactivas" -ForegroundColor Cyan
```

---

### Paso 3 — Reemplazar Input

📄 **ARCHIVO REEMPLAZADO** — `src/components/ui/input.tsx`

```powershell
$content = @'
import * as React from "react"
import { cn } from "@/lib/utils"

// Reemplazamos la interfaz vacía por un Type Alias para satisfacer la regla de TypeScript
// @typescript-eslint/no-empty-object-type y evitar el error del linter.
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * Input — Campo de texto base del sistema.
 *
 * Usa bg-surface (no bg-background) para aparecer elevado sobre el fondo.
 * El ring de focus hereda el color del primary-accent del tema activo.
 * Compatible con todos los tipos de input HTML: text, email, password,
 * number, date, search, file, etc.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    // Layout y tipografía
                    "flex h-9 w-full rounded-md px-3 py-1",
                    "text-sm text-foreground",
                    // Fondo elevado sobre el fondo de página
                    "bg-surface border border-border",
                    // Placeholder con opacidad reducida — diferenciado del valor real
                    "placeholder:text-muted-foreground/60",
                    // Transición suave en border y sombra al enfocar
                    "transition-all duration-150",
                    // Focus: ring del color del acento activo + sombra interna
                    "focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                    "focus-visible:border-primary-accent/50",
                    "focus-visible:shadow-premium-inner",
                    // File input: estilo del botón de selección
                    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                    // Deshabilitado: opacidad reducida, sin cursor
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
'@

New-Item -Path "src/components/ui/input.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/ui/input.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/ui/input.tsx reemplazado (Type Alias corregido)" -ForegroundColor Green
Write-Host "🎨 bg-surface elevado + ring de primary-accent + shadow-premium-inner en focus" -ForegroundColor Cyan
```

---

### Paso 4 — Reemplazar Label

📄 **ARCHIVO REEMPLAZADO** — `src/components/ui/label.tsx`

```powershell
$content = @'
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
    [
        "text-sm font-medium text-foreground",
        "leading-none cursor-pointer",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
    ].join(" ")
)

export interface LabelProps
    extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
        VariantProps<typeof labelVariants> {}

/**
 * Label — Etiqueta semantica y accesible para inputs.
 * Click en el label activa el input asociado via htmlFor.
 */
const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
    ({ className, ...props }, ref) => (
        <LabelPrimitive.Root
            ref={ref}
            className={cn(labelVariants(), className)}
            {...props}
        />
    )
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
'@

New-Item -Path "src/components/ui/label.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/ui/label.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/ui/label.tsx corregido" -ForegroundColor Green
```

---

## BLOQUE 14 — PAGINA DE VERIFICACION VISUAL

📄 **ARCHIVO REEMPLAZADO** — `src/app/page.tsx`

**Proposito:** Pagina de verificacion que confirma visualmente que todo el sistema configurado en esta guia funciona correctamente. Muestra en vivo los tokens semanticos, las 3 paletas, los 6 modos, los 4 estados de feedback, las capas de superficie y los componentes UI base. Se reemplaza en Guia 0.5 por el redirector Zero-Trust.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Server Component) |
| Ejecuta en | Servidor (con Client Components montados dentro) |
| Importa de | `ThemeSwitcher`, `ErrorBoundary`, `Button`, `Input`, `Label`, `lucide-react` |
| Si lo modificas | Es pagina temporal de verificacion — se reemplaza en Guia 0.5. No afecta nada |

### DECISIONES DE DISENO

**Por que Server Component?**
No necesita `"use client"`. Los componentes interactivos (`ThemeSwitcher`) son Client Components que se montan dentro de el.

**Por que subcomponentes locales no exportados?**
`StatusCard`, `ColorBox`, `SurfaceBox`, `FeedbackBox` y `ChecklistItem` son funciones locales que solo existen en esta pagina de verificacion. Exportarlos anadaria ruido al proyecto sin beneficio.

```powershell
$content = @'
import { ThemeSwitcher } from "@/components/theme-switcher"
import { ErrorBoundary } from "@/components/error-boundary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    CheckCircle2, ChevronRight, Layers, Palette,
    ShieldCheck, Zap, AlertCircle, Info,
    TriangleAlert, CircleX, Box
} from "lucide-react"

/**
 * Página de verificación visual — Guía 0.1
 *
 * Confirma que el sistema de temas, variables CSS, tokens semánticos
 * y componentes UI base funcionan correctamente.
 *
 * Esta página se reemplaza en la Guía 0.5 por el redirector Zero-Trust.
 * No contiene lógica del proyecto — es exclusivamente un banco de pruebas.
 */
export default function Home() {
    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-background">

                {/* ════════════════════════════════════════════════
                    NAVBAR — Glassmorphism sobre el contenido
                    backdrop-blur requiere que el fondo tenga opacidad
                    menor a 1 — bg-background/80 lo garantiza.
                    ════════════════════════════════════════════════ */}
                <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
                    <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-accent">
                                <Layers className="h-4 w-4 text-primary-accent-text" />
                            </div>
                            <span className="font-semibold text-foreground">Tenochtitlan</span>
                            <span className="rounded-md bg-primary-accent-bg px-2 py-0.5 text-xs font-medium text-primary-accent">
                                v0.1
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Guía 0.1 — Verificación Visual
                        </span>
                    </div>
                </header>

                <main className="mx-auto max-w-screen-xl px-6 py-10">
                    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">

                        {/* ════════════════════════════════════════
                            COLUMNA PRINCIPAL
                            ════════════════════════════════════════ */}
                        <div className="space-y-10">

                            {/* ── Hero ─────────────────────────── */}
                            <section className="space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full bg-success-bg px-3 py-1 text-xs font-medium text-success ring-1 ring-success/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                                    Sistema inicializado correctamente
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                                    Fundacion del Proyecto Lista
                                </h1>
                                <p className="text-base text-muted-foreground max-w-2xl">
                                    Next.js 16, sistema de tokens semanticos, 3 paletas x light/dark
                                    y componentes UI base funcionando con TypeScript estricto.
                                </p>
                            </section>

                            {/* ── Status Cards ─────────────────── */}
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-foreground">Stack técnico</h2>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <StatusCard
                                        icon={<Zap className="w-4 h-4 text-primary-accent" />}
                                        title="Next.js 16.2.3"
                                        description="App Router, Server Components y Server Actions listos."
                                    />
                                    <StatusCard
                                        icon={<Palette className="w-4 h-4 text-secondary-accent" />}
                                        title="Sistema de temas"
                                        description="3 paletas × light/dark = 6 combinaciones. Cambia con el panel →"
                                    />
                                    <StatusCard
                                        icon={<ShieldCheck className="w-4 h-4 text-success" />}
                                        title="TypeScript strict"
                                        description="6 reglas adicionales activas. Errores de tipo en compilación."
                                    />
                                    <StatusCard
                                        icon={<CheckCircle2 className="w-4 h-4 text-warning" />}
                                        title="ESLint seguridad"
                                        description="getSession() bloqueado. Solo getUser() permitido."
                                    />
                                </div>
                            </section>

                            {/* ── Capas de superficie ──────────── */}
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-foreground">Capas de superficie</h2>
                                <p className="text-sm text-muted-foreground">
                                    Tres niveles de elevación para separar cards, dropdowns y modales
                                    sin usar sombras fuertes. Cambia de paleta para ver cómo reaccionan.
                                </p>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    <SurfaceBox
                                        className="bg-background border-border"
                                        label="background"
                                        sublabel="Fondo principal"
                                    />
                                    <SurfaceBox
                                        className="bg-surface border-border"
                                        label="surface"
                                        sublabel="Cards y panels"
                                    />
                                    <SurfaceBox
                                        className="bg-surface-raised border-border"
                                        label="surface-raised"
                                        sublabel="Dropdowns"
                                    />
                                </div>
                            </section>

                            {/* ── Tokens de color ──────────────── */}
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-foreground">Tokens semánticos en vivo</h2>
                                <p className="text-sm text-muted-foreground">
                                    Cada bloque cambia de color al seleccionar una paleta diferente.
                                </p>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <ColorBox
                                        className="bg-primary-accent text-primary-accent-text"
                                        label="primary-accent"
                                    />
                                    <ColorBox
                                        className="bg-primary-accent-bg text-primary-accent"
                                        label="primary-accent-bg"
                                    />
                                    <ColorBox
                                        className="bg-secondary-accent text-primary-accent-text"
                                        label="secondary-accent"
                                    />
                                    <ColorBox
                                        className="bg-secondary-accent-bg text-secondary-accent"
                                        label="secondary-accent-bg"
                                    />
                                    <ColorBox
                                        className="bg-chart-1 text-primary-accent-text"
                                        label="chart-1"
                                    />
                                    <ColorBox
                                        className="bg-chart-2 text-primary-accent-text"
                                        label="chart-2"
                                    />
                                    <ColorBox
                                        className="bg-chart-3 text-primary-accent-text"
                                        label="chart-3"
                                    />
                                    <ColorBox
                                        className="bg-chart-4 text-primary-accent-text"
                                        label="chart-4"
                                    />
                                </div>
                            </section>

                            {/* ── Estados de feedback ──────────── */}
                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold text-foreground">Estados de feedback</h2>
                                <p className="text-sm text-muted-foreground">
                                    Los 4 estados obligatorios con color principal y fondo sutil.
                                    Para badges, alertas y banners sin colores hardcodeados.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <FeedbackBox
                                        icon={<CheckCircle2 className="w-4 h-4 text-success" />}
                                        label="success"
                                        className="bg-success-bg border-success/20"
                                        textClass="text-success"
                                        description="Operación completada exitosamente."
                                    />
                                    <FeedbackBox
                                        icon={<TriangleAlert className="w-4 h-4 text-warning" />}
                                        label="warning"
                                        className="bg-warning-bg border-warning/20"
                                        textClass="text-warning"
                                        description="Acción requiere atención antes de continuar."
                                    />
                                    <FeedbackBox
                                        icon={<CircleX className="w-4 h-4 text-error" />}
                                        label="error"
                                        className="bg-error-bg border-error/20"
                                        textClass="text-error"
                                        description="No se pudo completar la operación."
                                    />
                                    <FeedbackBox
                                        icon={<Info className="w-4 h-4 text-info" />}
                                        label="info"
                                        className="bg-info-bg border-info/20"
                                        textClass="text-info"
                                        description="Información adicional disponible."
                                    />
                                </div>
                            </section>

                            {/* ── Componentes UI base ──────────── */}
                            <section className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-premium-sm">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Componentes UI base</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Verifica ring de focus, estados hover y variables de color
                                        en componentes interactivos.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">

                                    {/* Formulario de prueba */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                            Inputs y Labels
                                        </h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="test-text">Campo de texto</Label>
                                            <Input
                                                id="test-text"
                                                type="text"
                                                placeholder="Escribe algo — observa el ring de focus..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="test-password">Contraseña</Label>
                                            <Input
                                                id="test-password"
                                                type="password"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="test-disabled">Campo deshabilitado</Label>
                                            <Input
                                                id="test-disabled"
                                                type="text"
                                                placeholder="No se puede editar"
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    {/* Variantes de botones */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                            Variantes de Button
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="default">Default</Button>
                                            <Button variant="secondary">Secondary</Button>
                                            <Button variant="outline">Outline</Button>
                                            <Button variant="ghost">Ghost</Button>
                                            <Button variant="destructive">Destructive</Button>
                                            <Button variant="link">Link</Button>
                                        </div>
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                            Tamaños
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button size="sm">Small</Button>
                                            <Button size="default">Default</Button>
                                            <Button size="lg">Large</Button>
                                            <Button size="icon" variant="outline">
                                                <Box className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                            Estado deshabilitado
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Button disabled>Deshabilitado</Button>
                                            <Button variant="outline" disabled>Outline</Button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                        </div>

                        {/* ════════════════════════════════════════
                            PANEL LATERAL STICKY
                            ════════════════════════════════════════ */}
                        <div className="space-y-6">
                            <div className="sticky top-20 space-y-4">

                                {/* ThemeSwitcher */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-5 bg-primary-accent rounded-full" />
                                        <h2 className="text-sm font-semibold text-foreground">Panel de Temas</h2>
                                    </div>
                                    <ThemeSwitcher />
                                </div>

                                {/* Checklist de guía completada */}
                                <div className="rounded-xl border border-border bg-surface p-4 shadow-premium-sm">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                                        <CheckCircle2 className="w-4 h-4 text-success" />
                                        Guía 0.1 — Completada
                                    </h3>
                                    <ul className="space-y-2">
                                        <ChecklistItem text="Next.js 16.2.3 + TypeScript strict" />
                                        <ChecklistItem text="Dependencias visuales pineadas" />
                                        <ChecklistItem text="shadcn/ui 2.5.0 inicializado" />
                                        <ChecklistItem text="Sistema semántico 3 paletas" />
                                        <ChecklistItem text="6 combinaciones light/dark" />
                                        <ChecklistItem text="Regla ESLint getSession bloqueado" />
                                        <ChecklistItem text="Plus Jakarta Sans cargada" />
                                        <ChecklistItem text="ErrorBoundary global activo" />
                                        <ChecklistItem text="Button, Input, Label instalados" />
                                    </ul>
                                </div>

                                {/* Siguiente guía */}
                                <div className="rounded-xl border border-info/20 bg-info-bg p-4">
                                    <p className="flex items-start gap-2 text-xs text-info">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                        Siguiente: Guía 0.2 — Auth + Dependencias de Negocio
                                        (Supabase SSR, Zustand, Zod, Sonner)
                                    </p>
                                </div>

                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </ErrorBoundary>
    )
}

// ═══════════════════════════════════════════════════════════════════
// SUBCOMPONENTES LOCALES
// Solo se usan en esta página — no se exportan al resto del proyecto.
// ═══════════════════════════════════════════════════════════════════

function StatusCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-premium-sm hover:shadow-premium-md transition-shadow duration-150">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-hover-background">
                {icon}
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    )
}

function SurfaceBox({
    className,
    label,
    sublabel,
}: {
    className: string
    label: string
    sublabel: string
}) {
    return (
        <div className={`rounded-xl border p-4 ${className}`}>
            <p className="text-xs font-mono font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
        </div>
    )
}

function ColorBox({
    className,
    label,
}: {
    className: string
    label: string
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-border/50">
            <div className={`h-16 w-full ${className}`} />
            <div className="bg-surface px-3 py-2 border-t border-border">
                <p className="text-xs font-mono text-muted-foreground">{label}</p>
            </div>
        </div>
    )
}

function FeedbackBox({
    icon,
    label,
    className,
    textClass,
    description,
}: {
    icon: React.ReactNode
    label: string
    className: string
    textClass: string
    description: string
}) {
    return (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${className}`}>
            <div className="shrink-0 mt-0.5">{icon}</div>
            <div>
                <p className={`text-xs font-mono font-medium mb-0.5 ${textClass}`}>{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

function ChecklistItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-2 text-xs text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5 text-primary-accent shrink-0" />
            {text}
        </li>
    )
}
'@

New-Item -Path "src/app/page.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/page.tsx" -Value $content -Encoding UTF8

# Eliminar el CSS module huérfano que genera create-next-app
Remove-Item -Force "src/app/page.module.css" -ErrorAction SilentlyContinue

Write-Host "✅ src/app/page.tsx creado — página de verificación visual" -ForegroundColor Green
Write-Host "🎨 Muestra: tokens, 3 paletas, 4 estados feedback, capas superficie" -ForegroundColor Cyan
Write-Host "🧩 Incluye banco de prueba de Button (6 variantes + 4 tamaños) e Input" -ForegroundColor Cyan
Write-Host "🌗 ThemeSwitcher sticky en panel lateral — prueba paletas en tiempo real" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 4

```powershell
Write-Host "`nValidando Parte 4 de la Guia 0.1..." -ForegroundColor Yellow

$allOk = $true

# ═══════════════════════════════════════════════════════════════════
# 1. COMPONENTES DE TEMA (Bloque 11)
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Componentes de tema:" -ForegroundColor Gray
$themeFiles = @(
    "src/components/theme-provider.tsx",
    "src/components/theme-switcher.tsx"
)
foreach ($file in $themeFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

# ═══════════════════════════════════════════════════════════════════
# 2. ERROR BOUNDARY (Bloque 12)
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Error Boundary:" -ForegroundColor Gray
if (Test-Path "src/components/error-boundary.tsx") {
    Write-Host "  ✅ src/components/error-boundary.tsx" -ForegroundColor Green
} else {
    Write-Host "  ❌ src/components/error-boundary.tsx NO existe" -ForegroundColor Red
    $allOk = $false
}

# ═══════════════════════════════════════════════════════════════════
# 3. COMPONENTES UI BASE (Bloque 13)
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Componentes UI base:" -ForegroundColor Gray
$uiFiles = @(
    "src/components/ui/button.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/label.tsx"
)
foreach ($file in $uiFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

# ═══════════════════════════════════════════════════════════════════
# 4. PAGINA DE VERIFICACION (Bloque 14)
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Pagina de verificacion:" -ForegroundColor Gray
if (Test-Path "src/app/page.tsx") {
    Write-Host "  ✅ src/app/page.tsx" -ForegroundColor Green
} else {
    Write-Host "  ❌ src/app/page.tsx NO existe" -ForegroundColor Red
    $allOk = $false
}

# ═══════════════════════════════════════════════════════════════════
# 5. BUILD COMPLETO
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n  Build:" -ForegroundColor Gray
Write-Host "  Ejecutar 'npm run build' para verificar compilacion completa" -ForegroundColor Yellow

# ═══════════════════════════════════════════════════════════════════
# RESULTADO FINAL
# ═══════════════════════════════════════════════════════════════════
Write-Host ""
if ($allOk) {
    Write-Host "✅ PARTE 4 COMPLETADA — Todos los archivos existen" -ForegroundColor Green
    Write-Host "   Ejecutar 'npm run build' para confirmar compilacion sin errores" -ForegroundColor Cyan
    Write-Host "   Ejecutar 'npm run dev' y abrir http://localhost:3000 para verificar visualmente" -ForegroundColor Cyan
} else {
    Write-Host "❌ PARTE 4 INCOMPLETA — Corregir los ❌ antes de continuar" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si alguna verificacion falla:
> - `theme-provider.tsx` faltante → `layout.tsx` no puede importarlo — build falla
> - `theme-switcher.tsx` faltante → `page.tsx` no puede importarlo — build falla
> - Componentes UI faltantes → `page.tsx` importa Button, Input, Label — build falla
> - `npm run build` falla → revisar errores de TypeScript. Los mas comunes: imports incorrectos, tipos faltantes, parametros sin tipo

---

## RESUMEN DE ESTA PARTE

**Archivos creados:**

| Archivo | Proposito |
|:--------|:----------|
| `src/components/theme-provider.tsx` | Wrapper permanente de next-themes — infraestructura del sistema visual |
| `src/components/theme-switcher.tsx` | Selector interactivo de paleta y modo — temporal, se reemplaza en Guia 0.6 |
| `src/components/error-boundary.tsx` | Captura errores de React — pantalla amigable en produccion |

**Archivos reemplazados:**

| Archivo | Que cambio |
|:--------|:-----------|
| `src/components/ui/button.tsx` | 6 variantes con gradiente sutil, shadow-premium, transiciones 150ms |
| `src/components/ui/input.tsx` | bg-surface elevado, shadow-premium-inner en focus, placeholder al 60% |
| `src/components/ui/label.tsx` | font-medium explicito, text-foreground, estado disabled via Radix |
| `src/app/page.tsx` | Pagina de verificacion visual con todos los tokens y componentes |

---

## GUIA 0.1 COMPLETADA

Al terminar esta parte, la fundacion visual del proyecto esta lista:

- `npm run build` compila sin errores
- `npm run dev` → `http://localhost:3000` muestra la pagina de verificacion
- Las 3 paletas (Slate, Zinc, Ocean) cambian en tiempo real con el ThemeSwitcher
- Dark mode funciona y persiste al recargar
- Los 4 estados de feedback (success, warning, error, info) son visibles
- Button, Input y Label responden al tema activo

---

## ➡️ SIGUIENTE GUIA

**→ Guia 0.2** — Dependencias de Negocio

Instala y configura las dependencias operativas del proyecto: Supabase SSR Auth, Zustand, React Hook Form + Zod, date-fns y Sonner. Incluye configuracion de auth funcional con login page y proteccion de rutas para cliente/admin.

---

> **Documento:** GUIA_0_1_Parte4_V6.md
> **Proyecto:** Presentación Interactiva Tech Computer / Tenochtitlán
> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
