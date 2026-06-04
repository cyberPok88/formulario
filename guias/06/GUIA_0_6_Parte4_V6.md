# GUIA 0.6 — APP SHELL: SIDEBAR, TOPBAR, TOOLBAR Y SISTEMA DE TEMAS
## PARTE 4: SISTEMA NERVIOSO — SMART COMPONENTS, LAYOUT Y THEME INJECTOR

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 4 de 5
> **Prerequisito:** Parte 3 completada — Dumb Components sin errores, Fingerprint de pureza pasado
> **Siguiente parte:** `GUIA_0_6_Parte5_V6.md` — Ensamblaje: Dashboard + Bienvenida + 34 Placeholders
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte construye el **sistema nervioso** del Shell: los Smart Components que conectan los ladrillos visuales de la Parte 3 con los stores de la Parte 2, y el Layout Server Component que los ensambla todos.

- **Bloque 1 — `ThemeToggler.tsx`:** Popover con selector de modo (Light/System/Dark) y grid de 3 paletas. Ejecuta el flujo de tres capas: CSS instantaneo → Zustand/localStorage → Server Action en background. Hidratacion segura con `useSyncExternalStore`.
- **Bloque 2 — `Sidebar.tsx`:** Lee `menu[]` del auth-store, traduce strings de iconos con `getIcon()`, calcula item activo por `pathname`, y renderiza `NavItem` o `NavGroup` segun corresponda. Maneja colapso desktop y drawer movil.
- **Bloque 3 — `Topbar.tsx`:** Lee `pageInfo` del page-context-store para el titulo contextual. Contiene hamburguesa movil, `ThemeToggler`, nombre de empresa, logout y `Avatar`. Muestra link a bienvenida si `onboarding_visto === false`.
- **Bloque 4 — `Toolbar.tsx`:** Fusiona con `useMemo` las acciones base del `toolbar-config.ts` con las inyectadas por la pagina actual. Array vacio → retorna `null`, no ocupa espacio.
- **Bloque 5 — `ThemeInjector.tsx`:** Server Component que genera un `<script>` inline pre-hidratacion. Aplica `data-theme` y clase `dark` antes de que React cargue — elimina FOUC.
- **Bloque 6 — `src/components/shell/index.ts`:** Barrel de exports del Shell — un solo import para todos los componentes.
- **Bloque 7 — `src/app/dashboard/layout.tsx` (reemplazado):** Server Component Supervisor. Verifica sesion con `getUser()`, lee tema de BD, ensambla el Shell completo.

> **Al terminar esta parte:** El App Shell es funcional y navegable. `npx tsc --noEmit` pasa sin errores.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — THEME TOGGLER

📄 **ARCHIVO COMPLETO** — `src/components/shell/ThemeToggler.tsx`

**Proposito:** Smart Component que expone dos controles: selector de modo (Light/System/Dark) delegado a `next-themes`, y grid de paletas que ejecuta el flujo de tres capas documentado en la Parte 0.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | `Topbar.tsx` (Parte 4) |
| Importa de | `react`, `next-themes`, `lucide-react`, `@/components/ui/popover`, `@/components/ui/button`, `@/lib/stores/auth-store`, `@/lib/actions/preferences`, `@/types/shell`, `sonner` |
| Contrato | Exporta `ThemeToggler` — componente sin props (autogestionado) |
| Si lo modificas | Afecta el selector de paletas y modo en el Topbar. Si falla `guardarTemaAction()`, la paleta no persiste en BD |

### DECISIONES DE DISENO

**Por que `useSyncExternalStore` y no `useState` + `useEffect`?**
ESLint de Next.js 16 bloquea el patron `setState` dentro de `useEffect` para hidratacion. `useSyncExternalStore` con snapshot de servidor `false` y cliente `true` es la solucion oficial — mientras `isClient` es `false`, renderiza un skeleton sin errores de linter.

**Por que la paleta `slate` elimina `data-theme` en lugar de setear `data-theme="slate"`?**
`slate` es la paleta default definida en el CSS base sin selector de atributo (bloque `:root`). Setear el atributo seria redundante y podria interferir con estilos que asumen su ausencia.

```powershell
$content = @'
'use client'

import { useSyncExternalStore, useTransition } from 'react'
import { Palette, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useAuth, useAuthStoreBase } from '@/lib/stores/auth-store'
import { guardarTemaAction } from '@/lib/actions/preferences'
import { PALETTES, DEFAULT_THEME } from '@/types/shell'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════════
// ThemeToggler — Smart Component
// Selector de paleta y modo (light/dark/system).
// Flujo de 3 capas al cambiar paleta:
//   1. CSS instantáneo (data-theme en DOM)
//   2. Zustand + localStorage (actualizarPreferencias)
//   3. Postgres en background (guardarTemaAction via startTransition)
// ═══════════════════════════════════════════════════════════════════════════

export function ThemeToggler() {
    const usuario = useAuth(s => s.usuario)
    const [isPending, startTransition] = useTransition()
    const { theme: mode, setTheme: setMode } = useTheme()

    // Guard de hidratación — evita mismatch SSR/Cliente y warning de linter
    // useSyncExternalStore: false en servidor, true en cliente
    const isClient = useSyncExternalStore(
        () => () => {},  // subscribe vacío
        () => true,      // snapshot cliente
        () => false      // snapshot servidor
    )

    // Extraer paleta actual de las preferencias del usuario
    const temaCompleto    = usuario?.preferencias?.tema || DEFAULT_THEME
    const currentPalette  = temaCompleto.split('-')[0] || 'slate'

    const handlePaletteChange = (newPalette: string) => {
        if (newPalette === currentPalette) return

        // CAPA 1: Transición suave + mutación CSS instantánea
        document.documentElement.classList.add('theme-transitioning')
        if (newPalette === 'slate') {
            // 'slate' es el CSS base — eliminar atributo en lugar de setear "slate"
            document.documentElement.removeAttribute('data-theme')
        } else {
            document.documentElement.setAttribute('data-theme', newPalette)
        }
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning')
        }, 250)

        // CAPA 2: Zustand + localStorage
        const newTheme = `${newPalette}-${mode === 'dark' ? 'dark' : 'light'}`
        useAuthStoreBase.getState().actualizarPreferencias({ tema: newTheme })

        // CAPA 3: Postgres en background (fire-and-forget)
        startTransition(async () => {
            const result = await guardarTemaAction(newTheme)
            if (!result.success) {
                toast.error('No se pudo guardar la paleta')
                // Rollback visual: volver a la paleta anterior
                if (currentPalette === 'slate') {
                    document.documentElement.removeAttribute('data-theme')
                } else {
                    document.documentElement.setAttribute('data-theme', currentPalette)
                }
            }
        })
    }

    // Skeleton mientras el componente se monta en el cliente
    if (!isClient) {
        return <div className="h-9 w-9 bg-muted/50 rounded-md animate-pulse" />
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isPending} title="Personalización Visual">
                    <Palette className="h-5 w-5 text-muted-foreground" />
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-[280px] p-4 space-y-4 bg-background border border-border shadow-lg">

                {/* Selector de Modo */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                        <Monitor className="w-4 h-4" /> Modo
                    </span>
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                        {[
                            { key: 'light',  icon: Sun,     label: 'Claro' },
                            { key: 'system', icon: Monitor, label: 'Sistema' },
                            { key: 'dark',   icon: Moon,    label: 'Oscuro' },
                        ].map(({ key, icon: Icon, label }) => (
                            <button
                                key={key}
                                onClick={() => setMode(key)}
                                className={`p-2 rounded-sm transition-all ${
                                    mode === key
                                        ? 'bg-background shadow-sm text-primary-accent'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title={label}
                            >
                                <Icon className="h-4 w-4" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Selector de Paleta — Grid 2×2 */}
                <div>
                    <span className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4" /> Paleta
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                        {PALETTES.map((palette) => (
                            <button
                                key={palette.id}
                                onClick={() => handlePaletteChange(palette.id)}
                                className={`text-xs p-2 rounded-md border text-left transition-all ${
                                    currentPalette === palette.id
                                        ? 'border-primary-accent bg-primary-accent/10 font-medium'
                                        : 'border-border hover:bg-muted'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {/* Círculo de previsualización con el color real de la paleta */}
                                    <div
                                        className="w-3 h-3 rounded-full border border-border/50"
                                        style={{ backgroundColor: palette.previewColor }}
                                    />
                                    {palette.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
'@

New-Item -Path "src/components/shell/ThemeToggler.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/ThemeToggler.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/ThemeToggler.tsx creado" -ForegroundColor Green
Write-Host "🎨 Flujo 3 capas: CSS instantáneo → Zustand/localStorage → Postgres en background" -ForegroundColor Cyan
Write-Host "🔄 Rollback visual — si falla la BD, el DOM vuelve a la paleta anterior" -ForegroundColor Cyan
Write-Host "⚡ Hidratación segura con useSyncExternalStore — sin mismatch ni warnings de linter" -ForegroundColor Cyan
```

---

## BLOQUE 2 — SIDEBAR

📄 **ARCHIVO COMPLETO** — `src/components/shell/Sidebar.tsx`

**Proposito:** Smart Component que conecta los Dumb Components de navegacion con los stores. Lee `menu[]` del auth-store, transforma esos datos en `NavEntry[]` con `useMemo`, y delega el rendering a `NavItem` y `NavGroup`.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | `dashboard/layout.tsx` (Parte 4) |
| Importa de | `react`, `next/navigation`, `next/link`, `lucide-react`, `@/lib/utils`, `@/components/ui/button`, `./nav/NavItem`, `./nav/NavGroup`, `@/lib/stores/sidebar-store`, `@/lib/stores/auth-store`, `@/config/icon-map`, `@/types/shell` |
| Contrato | Exporta `Sidebar` — componente sin props que lee del auth-store y sidebar-store |
| Si lo modificas | Afecta el menu de navegacion de todo el ERP. Sin `useSyncExternalStore` el sidebar rompe hidratacion en SSR |

### DECISIONES DE DISENO

**Por que comparacion exacta para `/dashboard` y `startsWith` para el resto?**
Si se usara `startsWith('/dashboard')` en todas las rutas, cualquier ruta dentro del dashboard marcaria el item Dashboard como activo simultaneamente con el item real. La comparacion exacta para `/dashboard` garantiza que solo la ruta raiz lo activa.

**Por que `useSyncExternalStore` en lugar de `useState(false)` + `useEffect`?**
Mismo motivo que ThemeToggler — ESLint de Next.js 16 bloquea el patron. El guard `if (!isClient)` retorna un `<aside>` vacio con las mismas dimensiones que el Sidebar real, evitando el salto visual al hidratar.

```powershell
$content = @'
'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NavItem } from './nav/NavItem'
import { NavGroup } from './nav/NavGroup'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useAuth } from '@/lib/stores/auth-store'
import { getIcon } from '@/config/icon-map'
import type { NavEntry } from '@/types/shell'

// ═══════════════════════════════════════════════════════════════════════════
// Sidebar — Smart Component
// Conecta auth-store.menu[] con NavItem/NavGroup (Dumb Components).
// Gestiona colapso desktop y drawer móvil via sidebar-store.
// ═══════════════════════════════════════════════════════════════════════════

export function Sidebar() {
    const pathname = usePathname()

    // Guard de hidratación — skeleton vacío evita salto visual al montar
    const isClient = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    )

    // Auth store: menú del usuario (viene de obtener_sesion_completa — Guía 0.4)
    const menu = useAuth(s => s.menu)

    // Sidebar store: estado visual
    const isCollapsed    = useSidebarStore(s => s.isCollapsed)
    const isMobileOpen   = useSidebarStore(s => s.isMobileOpen)
    const setMobileOpen  = useSidebarStore(s => s.setMobileOpen)
    const toggleCollapse = useSidebarStore(s => s.toggleCollapse)
    const toggleGroup    = useSidebarStore(s => s.toggleGroup)
    const expandedGroups = useSidebarStore(s => s.expandedGroups)

    // Transformar MenuModulo[] → NavEntry[] para rendering
    // useMemo evita recalcular en cada render — solo cuando menu, pathname o expandedGroups cambian
    const navEntries: NavEntry[] = useMemo(() => {
        return menu.map((modulo) => {
            if (modulo.submodulos.length === 1) {
                // Módulo con un solo submódulo → NavItem directo (sin acordeón)
                const sub = modulo.submodulos[0]
                return {
                    type: 'link' as const,
                    id: sub.id,
                    label: sub.nombre,
                    href: sub.href,
                    icon: getIcon(sub.icono),
                    // Comparación exacta para /dashboard — startsWith marcaría todas las rutas
                    isActive: sub.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(sub.href),
                }
            }

            // Módulo con múltiples submódulos → NavGroup (acordeón)
            const hasActiveChild = modulo.submodulos.some(s =>
                s.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(s.href)
            )

            return {
                type: 'group' as const,
                id: modulo.id,
                label: modulo.nombre,
                icon: getIcon(modulo.icono),
                // Expandir si el usuario lo expandió manualmente OR si tiene un hijo activo
                isExpanded: expandedGroups.includes(modulo.id) || hasActiveChild,
                items: modulo.submodulos.map((sub) => ({
                    id: sub.id,
                    label: sub.nombre,
                    href: sub.href,
                    icon: getIcon(sub.icono),
                    isActive: sub.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(sub.href),
                })),
            }
        })
    }, [menu, pathname, expandedGroups])

    // Skeleton de hidratación: mismas dimensiones que el Sidebar real — sin contenido
    if (!isClient) {
        return (
            <aside className="fixed left-0 top-0 z-30 hidden h-svh w-64 flex-col border-r border-slate-800 bg-slate-900 lg:flex" />
        )
    }

    return (
        <>
            {/* Backdrop oscuro para móvil — cierra el drawer al hacer clic fuera */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar principal */}
            <aside
                data-collapsed={isCollapsed ? 'true' : 'false'}
                onClick={() => { if (isCollapsed && !isMobileOpen) toggleCollapse() }}
                className={cn(
                    "fixed left-0 top-0 z-50 flex h-svh flex-col border-r transition-all duration-300 ease-in-out",
                    "bg-slate-900 border-slate-800 text-slate-50",
                    // Desktop: w-64 expandido, w-16 colapsado
                    isCollapsed ? "lg:w-16 cursor-pointer" : "lg:w-64 cursor-default",
                    // Móvil: fuera de pantalla por defecto, visible cuando isMobileOpen
                    isMobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Cabecera: Logo + botón de colapso */}
                <div className={cn(
                    "flex h-16 items-center border-b border-slate-800 px-3",
                    isCollapsed && !isMobileOpen ? "justify-center" : "justify-between"
                )}>
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex items-center gap-2 transition-transform active:scale-95",
                            (isCollapsed && !isMobileOpen) && "hidden"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-8 h-8 bg-primary-accent rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            E
                        </div>
                        <span className="font-bold text-sm tracking-tight leading-tight">
                            APP fullStack<br/>
                            <span className="text-xs font-normal text-slate-400">SaaS multiempresa</span>
                        </span>
                    </Link>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (window.innerWidth < 1024) setMobileOpen(false)
                            else toggleCollapse()
                        }}
                        className="text-slate-300 hover:bg-slate-800 hover:text-white shrink-0"
                    >
                        {isCollapsed && !isMobileOpen ? (
                            <div className="w-7 h-7 bg-primary-accent rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                E
                            </div>
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                {/* Área de navegación — custom-scrollbar para scrollbar delgado */}
                <div
                    className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar"
                    onClick={(e) => {
                        // Evitar que clics en ítems del menú disparen también el colapso del aside
                        if (!isCollapsed) e.stopPropagation()
                    }}
                >
                    <nav className="flex flex-col gap-0.5">
                        {navEntries.map((entry) => {
                            if (entry.type === 'link') {
                                return (
                                    <NavItem
                                        key={entry.id}
                                        item={entry}
                                        isCollapsed={isCollapsed && !isMobileOpen}
                                        onClick={() => window.innerWidth < 1024 && setMobileOpen(false)}
                                    />
                                )
                            }
                            return (
                                <NavGroup
                                    key={entry.id}
                                    group={entry}
                                    isCollapsed={isCollapsed && !isMobileOpen}
                                    onToggle={() => toggleGroup(entry.id)}
                                    onItemClick={() => window.innerWidth < 1024 && setMobileOpen(false)}
                                />
                            )
                        })}
                    </nav>
                </div>
            </aside>
        </>
    )
}
'@

New-Item -Path "src/components/shell/Sidebar.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/Sidebar.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/Sidebar.tsx creado" -ForegroundColor Green
Write-Host "🗺️  Menú dinámico desde auth-store — NavItem o NavGroup según cantidad de submódulos" -ForegroundColor Cyan
Write-Host "📱 Drawer móvil + colapso desktop — ambos estados desde sidebar-store" -ForegroundColor Cyan
Write-Host "⚡ Skeleton de hidratación — mismas dimensiones que el Sidebar real, sin salto visual" -ForegroundColor Cyan
```

---

## BLOQUE 3 — TOPBAR

📄 **ARCHIVO COMPLETO** — `src/components/shell/Topbar.tsx`

**Proposito:** Barra superior sticky que muestra el titulo de la pagina actual, el nombre de la empresa del tenant, los controles de sesion (ThemeToggler, logout, Avatar) y en movil el boton hamburguesa. Si `onboarding_visto === false`, muestra un link al panel de bienvenida.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | `dashboard/layout.tsx` (Parte 4) |
| Importa de | `next/link`, `next/navigation`, `lucide-react`, `react`, `sonner`, `@/components/ui/button`, `./ThemeToggler`, `./Avatar`, `@/lib/stores/page-context-store`, `@/lib/stores/auth-store`, `@/lib/stores/sidebar-store`, `@/lib/actions/auth` |
| Contrato | Exporta `Topbar` — componente sin props (autogestionado) |
| Si lo modificas | Afecta la barra superior en todas las rutas del dashboard. Sin `router.refresh()` en logout, el cache de Next.js puede servir contenido stale |

### DECISIONES DE DISENO

**Por que el flujo de logout llama `router.refresh()` ademas de `router.push('/login')`?**
`router.push` navega SPA sin limpiar el cache de Next.js. `router.refresh()` invalida el cache del servidor para que las rutas protegidas no sirvan contenido stale si el usuario vuelve con el historial del navegador.

```powershell
$content = @'
'use client'

import Link from 'next/link'
import { Menu, LogOut, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggler } from './ThemeToggler'
import { Avatar } from './Avatar'
import { usePageContextStore } from '@/lib/stores/page-context-store'
import { useAuth, useAuthStoreBase } from '@/lib/stores/auth-store'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { cerrarSesionAction } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
// Topbar — Smart Component
// Barra superior sticky del App Shell.
//
// Fuentes de datos:
//   page-context-store → pageInfo (título + subtítulo de la página actual)
//   auth-store         → usuario (nombre, empresa, preferencias.onboarding_visto)
//   sidebar-store      → setMobileOpen (controla el drawer en móvil)
// ═══════════════════════════════════════════════════════════════════════════

export function Topbar() {
    const router = useRouter()

    // Título y subtítulo de la página actual — escrito por usePageConfig al montar cada page.tsx
    const pageInfo     = usePageContextStore(s => s.pageInfo)
    const usuario      = useAuth(s => s.usuario)
    const setMobileOpen = useSidebarStore(s => s.setMobileOpen)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    // Estrategia de nombre: nombre real → parte local del email → fallback genérico
    const nombreUsuario  = usuario?.nombre || usuario?.email?.split('@')[0] || 'Usuario'
    const nombreEmpresa  = usuario?.empresa?.nombre || ''

    // Separar nombre y apellidos para el Avatar (heurística: primera palabra = nombre, resto = apellidos)
    const partes    = nombreUsuario.split(' ')
    const nombre    = partes[0] || nombreUsuario
    const apellidos = partes.slice(1).join(' ') || undefined

    // Mostrar banner de bienvenida si el admin no ha visitado la página de primeros pasos
    const mostrarBienvenida = usuario?.preferencias?.onboarding_visto === false

    /**
     * Flujo de logout en 4 pasos:
     * 1. Bloquear botón + toast de carga con id fijo (evita duplicados)
     * 2. cerrarSesionAction() — invalida sesión en Supabase (server-side)
     * 3. clearAuth() — limpia store en cliente
     * 4. router.push('/login') + router.refresh() — navega y limpia cache de Next.js
     */
    const handleLogout = async () => {
        setIsLoggingOut(true)
        toast.loading('Cerrando sesión...', { id: 'logout' })

        const result = await cerrarSesionAction()

        if (result.success) {
            useAuthStoreBase.getState().clearAuth()
            toast.success('Sesión finalizada', { id: 'logout' })
            router.push('/login')
            router.refresh()  // Invalida cache de Next.js — previene acceso con historial del navegador
        } else {
            toast.error(result.error || 'Error al salir', { id: 'logout' })
            setIsLoggingOut(false)
        }
    }

    return (
        // sticky: visible al hacer scroll en la página
        // bg-background/80 + backdrop-blur: glassmorphism — requiere alpha-value en tailwind.config.ts (Guía 0.1)
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-lg px-4 md:px-6">
            <div className="flex flex-1 items-center gap-4">
                {/* MÓVIL: hamburguesa + logo mínimo */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileOpen(true)}
                        className="text-muted-foreground"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-accent rounded-lg flex items-center justify-center text-white font-bold text-xs">
                            E
                        </div>
                    </Link>
                </div>

                {/* Título contextual — oculto en móvil (espacio limitado), visible desde md */}
                {pageInfo && (
                    <div className="hidden md:flex flex-col">
                        <h1 className="text-lg font-semibold tracking-tight leading-none">
                            {pageInfo.title}
                        </h1>
                        {pageInfo.subtitle && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {pageInfo.subtitle}
                            </p>
                        )}
                    </div>
                )}

                {/* Banner de bienvenida — solo si onboarding_visto === false */}
                {mostrarBienvenida && (
                    <Link
                        href="/dashboard/sistema/bienvenida"
                        className="hidden md:flex items-center gap-1.5 text-xs text-primary-accent hover:underline ml-2"
                    >
                        <Rocket className="h-3.5 w-3.5" />
                        Completa tu configuración
                    </Link>
                )}
            </div>

            {/* Controles de sesión */}
            <div className="flex items-center gap-1">
                {/* Nombre de empresa — visible en md+, oculto en móvil */}
                {nombreEmpresa && (
                    <span className="hidden md:inline text-xs text-muted-foreground mr-2 max-w-[140px] truncate">
                        {nombreEmpresa}
                    </span>
                )}

                {/* Selector de paleta y modo */}
                <ThemeToggler />

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="Cerrar Sesión"
                >
                    <LogOut className="h-5 w-5 text-muted-foreground" />
                </Button>

                {/* Avatar: iniciales del usuario */}
                <div className="ml-1">
                    <Avatar nombre={nombre} apellidos={apellidos} size="sm" />
                </div>
            </div>
        </header>
    )
}
'@

New-Item -Path "src/components/shell/Topbar.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/Topbar.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/Topbar.tsx creado" -ForegroundColor Green
Write-Host "🏢 Muestra nombre de empresa del tenant — dato nuevo vs app original" -ForegroundColor Cyan
Write-Host "🚀 Banner 'Completa tu configuración' si onboarding_visto === false" -ForegroundColor Cyan
Write-Host "🚪 Logout con toast de carga, clearAuth() y router.refresh() para limpiar cache" -ForegroundColor Cyan
```

---

## BLOQUE 4 — TOOLBAR

📄 **ARCHIVO COMPLETO** — `src/components/shell/Toolbar.tsx`

**Proposito:** Barra de acciones contextual debajo del Topbar. Fusiona acciones base del `toolbar-config.ts` con acciones inyectadas por la pagina actual. Array fusionado vacio → retorna `null`.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | `dashboard/layout.tsx` (Parte 4) |
| Importa de | `react`, `@/lib/stores/page-context-store`, `@/config/toolbar-config`, `@/components/ui/button`, `@/lib/utils` |
| Contrato | Exporta `Toolbar` — componente sin props |
| Si lo modificas | Afecta la barra de acciones contextual en todas las paginas. Sin `useMemo` el Toolbar se re-renderiza en cada cambio de store |

### DECISIONES DE DISENO

**Por que `useMemo` y no calcular en el store?**
Si la fusion ocurriera en el store, cada escritura al store generaria un array nuevo con referencia distinta, disparando re-renders en todos los componentes suscritos aunque el contenido no haya cambiado. Con `useMemo` en el componente, la fusion solo se recalcula cuando cambian las dependencias reales.

```powershell
$content = @'
'use client'

import { useMemo } from 'react'
import { usePageContextStore } from '@/lib/stores/page-context-store'
import { getToolbarActions } from '@/config/toolbar-config'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// Toolbar — Smart Component
// Barra de acciones contextual que fusiona dos fuentes:
//   1. toolbar-config.ts: acciones estáticas por ruta (con clave RBAC 'accion')
//   2. page-context-store: acciones inyectadas por la página actual via usePageConfig
//
// Merge por id: acciones inyectadas con mismo id sobrescriben las base.
// Array vacío → retorna null (el Dashboard no muestra barra de acciones).
// En Guía 0.7 se agrega un .filter() por tienePermiso() — sin tocar este archivo.
// ═══════════════════════════════════════════════════════════════════════════

export function Toolbar() {
    const currentPath      = usePageContextStore(s => s.currentPath)
    const injectedActions  = usePageContextStore(s => s.injectedActions)

    /**
     * Fusión de acciones base + inyectadas.
     * Merge por id: si una acción inyectada tiene el mismo id que una base,
     * la sobrescribe con spread (permite reemplazar onClick sin redefinir todos los campos).
     * Si no existe en la base, se agrega al final.
     */
    const mergedActions = useMemo(() => {
        if (!currentPath) return []
        const base = getToolbarActions(currentPath)
        if (injectedActions.length === 0) return base

        const merged = [...base]
        for (const injected of injectedActions) {
            const existingIdx = merged.findIndex(a => a.id === injected.id)
            if (existingIdx >= 0) {
                // Sobrescribir: los campos de 'injected' tienen prioridad
                merged[existingIdx] = { ...merged[existingIdx], ...injected }
            } else {
                // Agregar acción nueva al final
                merged.push(injected)
            }
        }
        return merged
    }, [currentPath, injectedActions])

    // Sin acciones: no renderizar la barra — no ocupa espacio en el layout
    if (mergedActions.length === 0) return null

    return (
        <div className="flex min-h-14 w-full items-center gap-2 border-b border-border/60 bg-background px-4 py-2.5 shadow-sm md:px-6 z-30">
            {/* overflow-x-auto + custom-scrollbar: scroll horizontal en móvil sin scrollbar feo */}
            <div className="flex items-center gap-2.5 overflow-x-auto custom-scrollbar pb-1 w-full">
                {mergedActions.map((action) => (
                    <Button
                        key={action.id}
                        variant={action.variant || 'ghost'}
                        size="sm"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className={cn(
                            "flex gap-2 font-medium whitespace-nowrap transition-all",
                            // Sombra en acciones primarias y destructivas — jerarquía visual
                            action.variant === 'default'     && "shadow-sm hover:shadow-md",
                            action.variant === 'destructive' && "shadow-sm hover:shadow-md"
                        )}
                    >
                        {action.icon && (
                            <action.icon
                                className={cn(
                                    "h-4 w-4",
                                    // Ícono atenuado en ghost/secondary: el texto toma protagonismo
                                    (action.variant === 'ghost' || action.variant === 'secondary') && "text-muted-foreground"
                                )}
                            />
                        )}
                        {action.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}
'@

New-Item -Path "src/components/shell/Toolbar.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/Toolbar.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/Toolbar.tsx creado" -ForegroundColor Green
Write-Host "🔀 Fusión base + inyectadas por id — las páginas pueden sobrescribir onClick del config" -ForegroundColor Cyan
Write-Host "🚫 Array vacío → retorna null — el Dashboard no muestra barra de acciones" -ForegroundColor Cyan
Write-Host "⚡ useMemo en componente, no en store — evita re-renders por referencias nuevas" -ForegroundColor Cyan
```

---

## BLOQUE 5 — THEME INJECTOR

📄 **ARCHIVO COMPLETO** — `src/components/shell/ThemeInjector.tsx`

**Proposito:** Server Component que genera un `<script>` inline con JavaScript vanilla ejecutado sincronicamente antes de que React hidrate. Su unico trabajo es aplicar `data-theme` y la clase `dark` al `<html>` antes del primer pixel renderizado.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente Dumb (Server) |
| Ejecuta en | Servidor |
| Importado por | `dashboard/layout.tsx` (Parte 4) |
| Importa de | `next/script` |
| Contrato | Exporta `ThemeInjector` — componente Server con prop `defaultTheme?` |
| Si lo modificas | Si recibe `'use client'`, el FOUC regresa porque el script se ejecuta despues de la hidratacion en lugar de antes. Si cambia el formato del script, el tema puede no aplicarse antes del primer render |

### DECISIONES DE DISENO

**Por que JavaScript vanilla y no React?**
React aun no existe en ese momento. El script corre durante el parsing del HTML, antes del bundle. Por eso usa `var` en lugar de `const` — es codigo de bootstrapping, no de aplicacion.

**Por que el `try/catch` vacio?**
Si el script falla (entorno restrictivo, extension bloqueante), la app debe seguir cargando con el tema default en lugar de romper. El error se silencia deliberadamente.

**Por que `next/script` en lugar de un tag `<script>` nativo?**
React 19 advierte que los tags `<script>` dentro de componentes no se ejecutan en el cliente — aunque en SSR el script se inyecta correctamente en el HTML inicial, la advertencia de consola es valida. `next/script` con `strategy="beforeInteractive"` es el mecanismo oficial de Next.js para inyectar scripts inline que deben ejecutarse antes de la hidratacion: Next.js inserta el script en la posicion optima del HTML inicial y React no genera falsos positivos porque reconoce el componente como propio del framework.

> **⚠️ Instruccion especial:** Este archivo NO debe recibir nunca `"use client"` — perderia su capacidad de inyectar el script antes de la hidratacion.

```powershell
$content = @'
// ═══════════════════════════════════════════════════════════════════════════
// ThemeInjector — Server Component Puro (sin "use client")
//
// Usa next/script con strategy="beforeInteractive" para inyectar el script
// inline en el HTML inicial, ANTES de que React hidrate — primer código
// que corre en el cliente. Sin React 19 warnings.
//
// Su trabajo: leer el tema del usuario (prop desde layout, leído de BD),
// dividirlo en paleta y modo, y aplicarlos al <html> antes del primer pixel.
//
// Sin este componente → FOUC: destello con tema default durante hidratación.
// ═══════════════════════════════════════════════════════════════════════════

import Script from 'next/script'

/**
 * Inyecta el tema del usuario antes de que React hidrate.
 * Consumidor: dashboard/layout.tsx pasa el tema leído de BD como defaultTheme.
 * Fallback: si no se recibe prop, usa 'slate-light' (coincide con el CSS base).
 */
export function ThemeInjector({ defaultTheme = 'slate-light' }: { defaultTheme?: string }) {
    const scriptContent = `
        (function() {
            try {
                var stored = '${defaultTheme}';
                var parts   = stored.split('-');
                var palette = parts[0] || 'slate';
                var mode    = parts[1] || 'light';

                // 'slate' es la paleta default del CSS base sin selector de atributo.
                // Setear data-theme="slate" sería redundante y podría interferir
                // con estilos que asumen la ausencia del atributo.
                if (palette !== 'slate') {
                    document.documentElement.setAttribute('data-theme', palette);
                }

                // Aplicar clase dark si el modo guardado es oscuro
                if (mode === 'dark') {
                    document.documentElement.classList.add('dark');
                }
            } catch(e) {
                // Error silenciado deliberadamente: si el script falla
                // (entorno restrictivo, extensión bloqueante), la app sigue
                // cargando con el tema default en lugar de romper.
            }
        })();
    `

    // next/script con beforeInteractive inyecta el script en el HTML inicial
    // antes de que React se cargue — el tema ya está aplicado cuando el
    // navegador pinta el primer frame. Sin warnings de React 19.
    return (
        <Script
            id="theme-injector"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{ __html: scriptContent }}
        />
    )
}
'@

New-Item -Path "src/components/shell/ThemeInjector.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/ThemeInjector.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/ThemeInjector.tsx creado" -ForegroundColor Green
Write-Host "⚡ Script pre-hidratación — el primer pixel ya tiene el tema correcto del usuario" -ForegroundColor Cyan
Write-Host "🚫 Sin 'use client' — debe permanecer Server Component para funcionar antes de React" -ForegroundColor Cyan
```

---

## BLOQUE 6 — BARREL DE EXPORTS

📄 **ARCHIVO COMPLETO** — `src/components/shell/index.ts`

**Proposito:** Barrel que centraliza todos los exports del Shell en un solo punto de importacion. Los consumidores (layout, paginas) importan desde `@/components/shell` en lugar de rutas individuales.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Barrel export |
| Ejecuta en | Ambos |
| Importa de | Todos los componentes del Shell |
| Contrato | Reexporta `ThemeToggler`, `Sidebar`, `Topbar`, `Toolbar`, `ThemeInjector`, `Footer`, `Avatar`, `PlaceholderModule`, `NavItem`, `NavGroup` |
| Si lo modificas | Afecta todos los imports que usan `@/components/shell`. Si se agrega o quita una exportacion, los archivos que la importan desde el barrel fallan en compilacion |

```powershell
$content = @'
// ═══════════════════════════════════════════════════════════════════════════
// SHELL BARREL — Exports centralizados del App Shell
// Importar desde '@/components/shell' en lugar de rutas individuales.
// Guía 0.7 agrega aquí: RBACGuard, ProtectedAction, useCanAction, usePermissions
// ═══════════════════════════════════════════════════════════════════════════

// Smart Components (Client)
export { ThemeToggler }     from './ThemeToggler'
export { Sidebar }          from './Sidebar'
export { Topbar }           from './Topbar'
export { Toolbar }          from './Toolbar'

// Server Components
export { ThemeInjector }    from './ThemeInjector'
export { Footer }           from './Footer'

// Dumb Components
export { Avatar }           from './Avatar'
export { PlaceholderModule } from './PlaceholderModule'
export type { PlaceholderColumn, PlaceholderRow } from './PlaceholderModule'

// Dumb Components de navegación
export { NavItem }          from './nav/NavItem'
export { NavGroup }         from './nav/NavGroup'
'@

New-Item -Path "src/components/shell/index.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/index.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/index.ts creado" -ForegroundColor Green
Write-Host "📦 Barrel listo — importar desde '@/components/shell' en el layout" -ForegroundColor Cyan
```

---

## BLOQUE 7 — DASHBOARD LAYOUT

📄 **ARCHIVO REEMPLAZADO** — `src/app/dashboard/layout.tsx`

**Proposito:** Reemplaza el layout minimalista de la Guia 0.5 (solo `AuthWrapper`) con el Shell completo. Es Server Component — el Supervisor del patron Supervisor + Operarios.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | layout.tsx |
| Ejecuta en | Servidor |
| Importa de | `react`, `next`, `next/navigation`, `@/lib/supabase/server`, `@/types/shell`, `@/components/shell/Sidebar`, `@/components/shell/Topbar`, `@/components/shell/Toolbar`, `@/components/shell/ThemeInjector`, `@/components/shell/Footer`, `@/components/auth/AuthWrapper` |
| Si lo modificas | Afecta la estructura completa del dashboard. Sin `'group'` en el contenedor, el Sidebar colapsado no ajusta el padding. Sin `getUser()` server-side, la seguridad del dashboard depende solo del AuthWrapper cliente |

### DECISIONES DE DISENO

**Por que `group` en el div contenedor?**
La clase `group-has-[[data-collapsed=true]]:lg:pl-16` en el div de contenido detecta si el `<aside>` tiene `data-collapsed="true"` para ajustar el padding. Sin `group` en el padre, Tailwind no puede evaluar ese selector.

**Por que dos capas de seguridad (`getUser()` + `AuthWrapper`)?**
`getUser()` protege requests HTTP al servidor. `AuthWrapper` (Client) protege la navegacion SPA donde el proxy no intercepta. Son complementarios, no redundantes.

```powershell
$content = @'
import { ReactNode } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_THEME } from '@/types/shell'

// Smart + Server Components del Shell
import { Sidebar }       from '@/components/shell/Sidebar'
import { Topbar }        from '@/components/shell/Topbar'
import { Toolbar }       from '@/components/shell/Toolbar'
import { ThemeInjector } from '@/components/shell/ThemeInjector'
import { Footer }        from '@/components/shell/Footer'

// Segunda capa de seguridad client-side (herencia Guía 0.5)
import { AuthWrapper }   from '@/components/auth/AuthWrapper'

// Metadatos del tab del navegador
export const metadata: Metadata = {
    title: 'Dashboard | APP fullStack',
    description: 'ERP Global — Plataforma SaaS Multiempresa',
}

// ═══════════════════════════════════════════════════════════════════════════
// DashboardLayout — Server Component (Supervisor)
//
// Layout maestro del ERP. Aplica a todas las rutas /dashboard/**
// por el sistema jerárquico de layouts de Next.js.
//
// 1. Verificación de sesión (Zero-Trust): getUser() en servidor.
//    Redirect a /login si no hay sesión — primera línea de defensa.
//
// 2. Lectura de tema de BD: SELECT preferencias para inyectar el tema
//    correcto antes de la hidratación — cero FOUC.
//    Falla silenciosamente al DEFAULT_THEME sin bloquear el render.
//
// 3. Ensamblaje del Shell: ThemeInjector + Sidebar + Topbar + Toolbar +
//    {children} + Footer dentro del AuthWrapper (segunda capa de defensa).
// ═══════════════════════════════════════════════════════════════════════════
export default async function DashboardLayout({ children }: { children: ReactNode }) {
    // 1. VERIFICACIÓN SERVER-SIDE (primera línea de defensa — Zero-Trust)
    // Nunca usar getSession() — regla ESLint de la Guía 0.1
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    // 2. LEER TEMA DE BD — mínimo SELECT, solo el campo preferencias
    // Si falla por cualquier razón, el usuario ve el tema default — no un error
    let temaUsuario = DEFAULT_THEME
    try {
        const { data: usuarioData } = await supabase
            .from('usuarios')
            .select('preferencias')
            .eq('id', user.id)
            .single()

        if (usuarioData?.preferencias?.tema) {
            temaUsuario = usuarioData.preferencias.tema
        }
    } catch {
        // Falla silenciosa — el usuario ve el tema default, no un error
    }

    // 3. ENSAMBLAJE DEL SHELL
    return (
        <>
            {/* ThemeInjector: script inline que aplica data-theme y clase dark
                ANTES de la hidratación de React — debe ir primero en el árbol */}
            <ThemeInjector defaultTheme={temaUsuario} />

            <AuthWrapper>
                {/* 'group' es REQUERIDO: permite que el div hijo detecte data-collapsed
                    del Sidebar via group-has-[[data-collapsed=true]] para ajustar el padding.
                    Sin 'group', el Sidebar colapsado no ajusta el contenido. */}
                <div className="group flex h-svh w-full overflow-hidden bg-background text-foreground">

                    {/* Sidebar: fixed, ocupa toda la altura — no está en el flujo normal del documento */}
                    <Sidebar />

                    {/* Contenido derecho: se adapta al estado del Sidebar via selector group-has.
                        lg:pl-64             → Sidebar expandido (w-64)
                        group-has-[...]:pl-16 → Sidebar colapsado (w-16) */}
                    <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out lg:pl-64 group-has-[[data-collapsed=true]]:lg:pl-16">
                        <Topbar />
                        <Toolbar />

                        {/* Área de contenido: cada page.tsx renderiza aquí.
                            max-w-7xl centra el contenido en pantallas muy anchas. */}
                        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/20 p-4 md:p-6">
                            <div className="mx-auto max-w-7xl pb-10">
                                {children}
                            </div>
                        </main>

                        <Footer />
                    </div>
                </div>
            </AuthWrapper>
        </>
    )
}

'@

Set-Content -Path "src/app/dashboard/layout.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/dashboard/layout.tsx reemplazado con Shell completo" -ForegroundColor Green
Write-Host "🔐 Doble capa: getUser() server-side + AuthWrapper client-side" -ForegroundColor Cyan
Write-Host "🎨 Tema leído de BD — ThemeInjector elimina el FOUC en la carga inicial" -ForegroundColor Cyan
Write-Host "📐 'group' en contenedor — requerido para el ajuste de padding al colapsar Sidebar" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 4

```powershell
Write-Host "`n=== VALIDACIÓN PARTE 4 ===" -ForegroundColor Yellow

$files = @(
    "src/components/shell/ThemeToggler.tsx",
    "src/components/shell/Sidebar.tsx",
    "src/components/shell/Topbar.tsx",
    "src/components/shell/Toolbar.tsx",
    "src/components/shell/ThemeInjector.tsx",
    "src/components/shell/index.ts",
    "src/app/dashboard/layout.tsx"
)

$allOk = $true
foreach ($f in $files) {
    if (Test-Path $f) { Write-Host "  ✅ $f" -ForegroundColor Green }
    else {
        Write-Host "  ❌ $f NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

# ThemeInjector y Footer NO deben tener "use client"
foreach ($f in @("src/components/shell/ThemeInjector.tsx", "src/components/shell/Footer.tsx")) {
    $c = Get-Content $f -Raw
    if ($c -match "use client") {
        Write-Host "  ❌ $f tiene 'use client' — debe ser Server Component" -ForegroundColor Red
        $allOk = $false
    } else {
        Write-Host "  ✅ $f — Server Component puro" -ForegroundColor Green
    }
}

# layout.tsx NO debe tener "use client"
$lc = Get-Content "src/app/dashboard/layout.tsx" -Raw
if ($lc -match "use client") {
    Write-Host "  ❌ layout.tsx tiene 'use client' — debe ser Server Component" -ForegroundColor Red
    $allOk = $false
} else {
    Write-Host "  ✅ layout.tsx — Server Component (Supervisor)" -ForegroundColor Green
}

if ($allOk) { Write-Host "`n✅ PARTE 4 COMPLETA — continuar con Parte 5" -ForegroundColor Green }
else        { Write-Host "`n❌ PARTE 4 INCOMPLETA — revisar los ❌ antes de continuar" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si `layout.tsx` tiene `"use client"`, el Shell rompe toda la seguridad server-side. Si `ThemeInjector.tsx` tiene `"use client"`, el FOUC regresa porque el script se ejecuta despues de la hidratacion en lugar de antes.

---

## RESUMEN DE ESTA PARTE

| Archivo | Tipo | Estado |
|:--------|:-----|:------:|
| `src/components/shell/ThemeToggler.tsx` | Smart (Client) | NUEVO |
| `src/components/shell/Sidebar.tsx` | Smart (Client) | NUEVO |
| `src/components/shell/Topbar.tsx` | Smart (Client) | NUEVO |
| `src/components/shell/Toolbar.tsx` | Smart (Client) | NUEVO |
| `src/components/shell/ThemeInjector.tsx` | Server | NUEVO |
| `src/components/shell/index.ts` | Barrel | NUEVO |
| `src/app/dashboard/layout.tsx` | Server (Supervisor) | REEMPLAZADO |

---

## SIGUIENTE PARTE

**-> Parte 5** — Ensamblaje: Dashboard + Bienvenida + 34 Placeholders

Se crea el dashboard definitivo con KPI cards y card-banner de bienvenida, la pagina `/dashboard/sistema/bienvenida` con el checklist de configuracion inicial, y las 34 paginas placeholder que cubren todas las rutas del ERP. Finaliza con `npm run build`.

---

> **Documento:** GUIA_0_6_Parte4_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
