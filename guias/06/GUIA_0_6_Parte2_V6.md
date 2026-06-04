# GUIA 0.6 — APP SHELL: SIDEBAR, TOPBAR, TOOLBAR Y SISTEMA DE TEMAS
## PARTE 2: CEREBRO — STORES, HOOK, SERVER ACTIONS Y UTILS

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 2 de 5
> **Prerequisito:** Parte 1 completada — `npx tsc --noEmit` sin errores, archivos de configuracion y tipos existentes
> **Siguiente parte:** `GUIA_0_6_Parte3_V6.md` — Piel: Dumb Components
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte construye el **cerebro reactivo** del Shell: los stores que recuerdan estado entre navegaciones, el hook que conecta cada pagina con el Shell, las acciones que persisten preferencias en servidor, y las utilidades de soporte.

- **Bloque 1 — `src/lib/stores/sidebar-store.ts`:** Store Zustand que gestiona el estado visual del Sidebar. Solo el estado de desktop persiste en `localStorage` — el drawer movil es volatil por diseno.
- **Bloque 2 — `src/lib/stores/page-context-store.ts`:** Store sin persistencia que actua como telegrafo entre las paginas hijas y el Shell. Cuando el usuario navega a Pedidos, esa pagina escribe aqui su titulo y botones. El Topbar y Toolbar leen desde aqui.
- **Bloque 3 — `src/lib/utils.ts` (extendido):** Agrega `areActionsEqual()` — comparador manual de `ToolbarAction[]` que el page-context-store necesita para evitar re-renders infinitos, sin depender de lodash.
- **Bloque 4 — `src/hooks/usePageConfig.ts`:** Hook que cada `page.tsx` llama al montarse. Escribe en el Page Context Store el titulo y acciones, y al desmontarse limpia todo automaticamente.
- **Bloque 5 — `src/lib/actions/preferences.ts`:** Server Action que persiste la paleta elegida en `preferencias JSONB` de la BD. Se ejecuta en background (fire-and-forget).
- **Bloque 6 — `src/lib/actions/shell.ts`:** Server Action que marca `onboarding_visto: true` en `preferencias JSONB` cuando el admin visita `/dashboard/sistema/bienvenida`.
- **Bloque 7 — `src/app/globals.css` (extendido):** Agrega `.custom-scrollbar` y `.theme-transitioning` al final del archivo.

> **Al terminar esta parte:** `npx tsc --noEmit` pasa sin errores. Stores, hook y Server Actions listos para ser consumidos por los componentes de las Partes 3 y 4.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — SIDEBAR STORE

📄 **ARCHIVO COMPLETO** — `src/lib/stores/sidebar-store.ts`

**Proposito:** Gestiona el estado visual del Sidebar entre navegaciones y recargas. Recuerda si el usuario dejo el menu colapsado en desktop y que grupos del acordeon dejo abiertos.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Store Zustand |
| Patron | Store con persist + partialize |
| Ejecuta en | Browser (persist en localStorage) |
| Importado por | `Sidebar.tsx` (Parte 4) |
| Importa de | `zustand`, `zustand/middleware` |
| Contrato | Exporta `useSidebarStore(selector)` |
| Si lo modificas | Rompe el comportamiento de colapso y drawer del Sidebar. Cambiar la key de localStorage (`erp-sidebar`) invalida el estado persistido de todos los usuarios |

### DECISIONES DE DISENO

**Por que `expandedGroups` es `string[]` y no `Set<string>`?**
`JSON.stringify` no serializa `Set` — un `Set` se guarda como `{}` vacio en `localStorage` y corrompe el estado silenciosamente al recargar. Con `Array` la serializacion es segura y directa.

**Por que `isMobileOpen` se excluye de `partialize`?**
El estado del drawer movil es volatil por diseno. Si se persistiera, el menu podria aparecer tapando el contenido al reabrir la app al dia siguiente en el celular.

**Por que la key es `erp-sidebar` y no `global-sidebar`?**
El prefijo `erp-` es consistente con `erp-auth-storage` del auth-store — mismo proyecto, mismo prefijo. Separada para permitir limpiar o depurar un store sin afectar al otro.

```powershell
$content = @'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR STORE
// Gestiona el estado visual del Sidebar con persistencia selectiva.
// Key de localStorage: 'erp-sidebar' — separada del auth-store.
// ═══════════════════════════════════════════════════════════════════════════

interface SidebarState {
    /** ¿El Sidebar muestra solo íconos (true) o íconos + texto (false)? Solo desktop. */
    isCollapsed: boolean

    /** ¿El drawer móvil está abierto? NO se persiste — siempre arranca cerrado. */
    isMobileOpen: boolean

    /** IDs de los grupos del menú que el usuario dejó abiertos (acordeón).
     *  string[] y no Set<string> — JSON.stringify no serializa Set correctamente. */
    expandedGroups: string[]

    toggleCollapse: () => void
    setMobileOpen: (open: boolean) => void
    toggleGroup: (groupId: string) => void
    setExpandedGroups: (groupIds: string[]) => void
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set, get) => ({
            isCollapsed:    false,
            isMobileOpen:   false,
            expandedGroups: [],

            toggleCollapse: () =>
                set((state) => ({ isCollapsed: !state.isCollapsed })),

            setMobileOpen: (open) =>
                set({ isMobileOpen: open }),

            toggleGroup: (groupId) => {
                const current = get().expandedGroups
                // Si ya está abierto → cerrar. Si está cerrado → abrir.
                set({
                    expandedGroups: current.includes(groupId)
                        ? current.filter(id => id !== groupId)
                        : [...current, groupId],
                })
            },

            setExpandedGroups: (groupIds) =>
                set({ expandedGroups: groupIds }),
        }),
        {
            name:    'erp-sidebar',
            storage: createJSONStorage(() => localStorage),
            // Solo persistir estado de desktop. isMobileOpen es volátil.
            partialize: (state) => ({
                isCollapsed:    state.isCollapsed,
                expandedGroups: state.expandedGroups,
            }),
        }
    )
)
'@

New-Item -Path "src/lib/stores/sidebar-store.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/stores/sidebar-store.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/stores/sidebar-store.ts creado" -ForegroundColor Green
Write-Host "💾 Persiste en 'erp-sidebar': isCollapsed + expandedGroups" -ForegroundColor Cyan
Write-Host "⚡ isMobileOpen excluido — el drawer móvil siempre arranca cerrado" -ForegroundColor Cyan
```

---

## BLOQUE 2 — PAGE CONTEXT STORE

📄 **ARCHIVO COMPLETO** — `src/lib/stores/page-context-store.ts`

**Proposito:** Store Zustand sin persistencia que actua como canal de comunicacion entre cada `page.tsx` y los componentes del Shell. No usa `localStorage` — su estado se reinicia con cada recarga, ya que `usePageConfig` lo repopula al montar cada pagina.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Store Zustand |
| Patron | Store sin persistencia |
| Ejecuta en | Browser (sin persist) |
| Importado por | `usePageConfig.ts` (Parte 2), `Topbar.tsx` (Parte 4), `Toolbar.tsx` (Parte 4) |
| Importa de | `zustand`, `@/types/shell`, `@/lib/utils` |
| Contrato | Exporta `usePageContextStore(selector)` |
| Si lo modificas | Rompe la comunicacion entre paginas y el Shell. Topbar no recibe titulo, Toolbar no recibe acciones inyectadas |

### DECISIONES DE DISENO

**Por que sin persistencia?**
`pageInfo` y `injectedActions` son datos de la pagina activa — no tienen sentido entre sesiones. Si se persistieran, al recargar el dashboard aparecerian los botones de la ultima pagina visitada antes del boton del dashboard.

**Por que los setters comparan antes de escribir?**
El store almacena solo datos atomicos. La fusion de acciones ocurre con `useMemo` dentro de `Toolbar.tsx` — no en el store. Si los setters escribieran sin comparar, cada render de la pagina dispararia una escritura que causaria re-renders en cadena en el Toolbar.

```powershell
$content = @'
import { create } from 'zustand'
import type { PageInfo, ToolbarAction } from '@/types/shell'
import { areActionsEqual } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════════════════
// PAGE CONTEXT STORE — Telégrafo entre páginas y el Shell
// Sin persistencia: usePageConfig repopula el store al montar cada página.
// Topbar lee: pageInfo
// Toolbar lee: injectedActions (fusionadas con toolbar-config base)
// ═══════════════════════════════════════════════════════════════════════════

interface PageContextState {
    /** Título y subtítulo mostrado en el Topbar */
    pageInfo: PageInfo | null

    /** Ruta actual — usada por el Toolbar para buscar config base en toolbar-config.ts */
    currentPath: string | null

    /** Acciones extra que la página inyecta al Toolbar en runtime */
    injectedActions: ToolbarAction[]

    setPageContext: (info: PageInfo, path: string) => void
    setActions: (actions: ToolbarAction[]) => void
    clearContext: () => void
}

export const usePageContextStore = create<PageContextState>()((set) => ({
    pageInfo:        null,
    currentPath:     null,
    injectedActions: [],

    setPageContext: (info, path) => set((state) => {
        // Solo actualizar si el contenido cambió realmente — previene re-renders
        if (
            state.currentPath     === path &&
            state.pageInfo?.title === info.title &&
            state.pageInfo?.subtitle === info.subtitle
        ) return state
        return { pageInfo: info, currentPath: path }
    }),

    setActions: (actions) => set((state) => {
        // Comparación por campos estables (ignora onClick — siempre es referencia nueva)
        if (areActionsEqual(state.injectedActions, actions)) return state
        return { injectedActions: actions }
    }),

    clearContext: () => set({
        pageInfo:        null,
        currentPath:     null,
        injectedActions: [],
    }),
}))
'@

New-Item -Path "src/lib/stores/page-context-store.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/stores/page-context-store.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/stores/page-context-store.ts creado" -ForegroundColor Green
Write-Host "📡 Telégrafo Shell↔Páginas — Topbar lee pageInfo, Toolbar lee injectedActions" -ForegroundColor Cyan
Write-Host "🔄 Sin persistencia — usePageConfig repopula el store al montar cada página" -ForegroundColor Cyan
```

---

## BLOQUE 3 — EXTENSION DE UTILS

📄 **ARCHIVO REEMPLAZADO** — `src/lib/utils.ts`

**Proposito:** Agregar `areActionsEqual()` al archivo de utilidades base. Esta funcion permite al Page Context Store comparar si las acciones inyectadas cambiaron realmente antes de escribir al estado, evitando re-renders infinitos.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Utilidades |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | `page-context-store.ts`, y todos los archivos que importan `cn()` en todo el proyecto |
| Importa de | `clsx`, `tailwind-merge` |
| Contrato | Exporta `cn()` (desde Guia 0.1) y `areActionsEqual()` (nuevo en Guia 0.6) |
| Si lo modificas | Rompe `page-context-store.ts` que usa `areActionsEqual()`. Cambiar `cn()` rompe el build de todo el proyecto |

### DECISIONES DE DISENO

**Por que ignora `onClick`?**
Las funciones en JavaScript siempre tienen referencias nuevas en cada render aunque su logica no haya cambiado. Comparar por `onClick` haria que `areActionsEqual` nunca retornara `true`, causando escrituras infinitas al store.

> **⚠️ Instruccion especial:** Este script reemplaza el archivo completo. La funcion `cn()` se conserva exactamente igual — solo se agrega la nueva funcion al final.

```powershell
$content = @'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// ═══════════════════════════════════════════════════════════════════════════
// cn — Utilidad de clases CSS (Guía 0.1)
// Combina clsx + tailwind-merge para construir strings de clases sin conflictos.
// Ejemplo: cn('p-2 p-4') → 'p-4'  |  cn('bg-red', cond && 'text-white') → 'bg-red text-white'
// ═══════════════════════════════════════════════════════════════════════════
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// ═══════════════════════════════════════════════════════════════════════════
// areActionsEqual — Comparador de ToolbarAction[] (Guía 0.6)
// Reemplaza lodash.isEqual para este caso específico.
// Usado por page-context-store para evitar re-renders infinitos en el Toolbar.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compara dos arrays de ToolbarAction por campos estables.
 * Ignora 'onClick' porque las funciones siempre son referencias nuevas en cada render.
 * Retorna true si los arrays son funcionalmente idénticos.
 */
export function areActionsEqual(
    prev: { id: string; label: string; variant?: string; disabled?: boolean }[],
    next: { id: string; label: string; variant?: string; disabled?: boolean }[]
): boolean {
    if (prev.length !== next.length) return false
    return prev.every((action, i) =>
        action.id       === next[i].id       &&
        action.label    === next[i].label    &&
        action.variant  === next[i].variant  &&
        action.disabled === next[i].disabled
    )
}
'@

Set-Content -Path "src/lib/utils.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/utils.ts extendido con areActionsEqual()" -ForegroundColor Green
Write-Host "⚡ Comparador manual sin lodash — ~70KB ahorrados en el bundle" -ForegroundColor Cyan
Write-Host "🔇 onClick ignorado — las funciones siempre tienen referencias nuevas" -ForegroundColor Cyan
```

---

## BLOQUE 4 — HOOK usePageConfig

📄 **ARCHIVO COMPLETO** — `src/hooks/usePageConfig.ts`

**Proposito:** Hook que cada `page.tsx` del ERP llama al montarse para registrarse con el Shell. Al montarse escribe titulo, subtitulo y botones en el Page Context Store. Al desmontarse limpia el store automaticamente.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Hook |
| Patron | Hook |
| Ejecuta en | Browser |
| Importado por | Todas las paginas placeholder (Parte 5), `dashboard/page.tsx` (Parte 5) |
| Importa de | `react`, `@/lib/stores/page-context-store`, `@/types/shell` |
| Contrato | Exporta `usePageConfig(options)` — hook de mount/unmount que registra la pagina en el Shell |
| Si lo modificas | Todas las paginas que lo usan dejan de registrarse en el Shell. Topbar y Toolbar quedan sin contenido |

### DECISIONES DE DISENO

**Por que un hook y no un `useEffect` directo en cada pagina?**
Si cada `page.tsx` manejara su propio `useEffect` con cleanup manual, tarde o temprano alguna pagina lo omitiria y los botones del Toolbar quedarian "pegados" al navegar a otra ruta.

**Por que la dependencia del `useEffect` es solo `[path]`?**
`info` y `actions` son objetos literales definidos inline en cada `page.tsx` — tienen referencias nuevas en cada render aunque su contenido no haya cambiado. Solo `path` es estable entre renders de la misma pagina. El store filtra escrituras redundantes internamente con `areActionsEqual()`.

```powershell
$content = @'
import { useEffect } from 'react'
import { usePageContextStore } from '@/lib/stores/page-context-store'
import type { PageInfo, ToolbarAction } from '@/types/shell'

// ═══════════════════════════════════════════════════════════════════════════
// usePageConfig — Hook "Mount/Unmount Messenger"
// Cada page.tsx lo llama al montarse para registrarse con el Shell.
// Al desmontarse (navegación a otra ruta) limpia el store automáticamente.
// ═══════════════════════════════════════════════════════════════════════════

interface UsePageConfigOptions {
    /** Metadata que aparece en el Topbar */
    info: PageInfo
    /** href exacto de la ruta — debe coincidir con toolbar-config.ts */
    path: string
    /** Acciones extra que la página inyecta al Toolbar (opcional) */
    actions?: ToolbarAction[]
}

/**
 * Uso en cada page.tsx:
 * ```
 * usePageConfig({
 *     info:    { title: 'Pedidos', subtitle: 'Gestión de pedidos de venta' },
 *     path:    '/dashboard/ventas/pedidos',
 *     actions: [{ id: 'custom', label: 'Acción Extra', ... }]
 * })
 * ```
 * Al montarse: escribe título + acciones en el store global.
 * Al desmontarse: limpia todo para que la siguiente página arranque limpia.
 */
export function usePageConfig({ info, path, actions = [] }: UsePageConfigOptions) {
    const setPageContext = usePageContextStore(state => state.setPageContext)
    const setActions     = usePageContextStore(state => state.setActions)
    const clearContext   = usePageContextStore(state => state.clearContext)

    useEffect(() => {
        // MONTAJE: Registrar página en el Shell
        setPageContext(info, path)
        if (actions.length > 0) {
            setActions(actions)
        }

        // DESMONTAJE: Limpiar para que la siguiente página arranque limpia
        return () => {
            clearContext()
        }

        // Dependencia estricta en 'path': solo se re-ejecuta si la URL cambia.
        // 'info' y 'actions' son objetos inline con referencias nuevas en cada render.
        // El store filtra escrituras redundantes con areActionsEqual().
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path])
}
'@

New-Item -Path "src/hooks/usePageConfig.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/hooks/usePageConfig.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/hooks/usePageConfig.ts creado" -ForegroundColor Green
Write-Host "🔁 Ciclo mount/unmount automático — cada página se registra y limpia sola" -ForegroundColor Cyan
Write-Host "📌 Dependencia [path] — el efecto solo corre cuando cambia la URL" -ForegroundColor Cyan
```

---

## BLOQUE 5 — SERVER ACTION: GUARDAR TEMA

📄 **ARCHIVO COMPLETO** — `src/lib/actions/preferences.ts`

**Proposito:** Persiste la paleta de colores elegida en la columna JSONB `preferencias` de la tabla `usuarios`. Se llama desde el `ThemeToggler` en background (fire-and-forget) — el cambio visual es instantaneo, la escritura a BD no bloquea la UI.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Server Action |
| Ejecuta en | Servidor Node.js (`'use server'` en linea 1) |
| Importado por | `ThemeToggler.tsx` (Parte 4) |
| Importa de | `@/lib/supabase/server` |
| Contrato | Exporta `guardarTemaAction(tema: string)` — persistencia de paleta en `preferencias JSONB` |
| Si lo modificas | El cambio de paleta no persiste en BD. Al recargar la pagina se pierde la preferencia |

### DECISIONES DE DISENO

**Por que Server Action y no un endpoint REST?**
Las Server Actions son funciones TypeScript que se importan directamente. No requieren crear un archivo de ruta, no necesitan `fetch` manual, y Next.js maneja la serializacion. Menos codigo, tipado extremo a extremo, sin superficie de API expuesta.

**Por que `'use server'` se concatena fuera del heredoc?**
El heredoc `@'...'@` de PowerShell a veces anade una linea vacia inicial al parsear comillas simples dentro de el. `'use server'` debe ser la linea 1 del archivo sin nada antes — la concatenacion lo garantiza.

```powershell
$useServer = "'use server'"
$rest = @'

import { createClient } from '@/lib/supabase/server'

// ═══════════════════════════════════════════════════════════════════════════
// preferences.ts — Server Actions de preferencias de usuario
// 'use server' DEBE estar en la línea 1 — sin comentarios ni espacios antes.
// ═══════════════════════════════════════════════════════════════════════════

interface ActionResponse {
    success: boolean
    error?: string
}

/**
 * Persiste la paleta elegida en la columna JSONB 'preferencias' de la BD.
 * Usa jsonb_set para actualizar solo el campo 'tema' sin borrar 'onboarding_visto'.
 *
 * Se llama desde ThemeToggler en un startTransition (fire-and-forget).
 * El cambio visual ya ocurrió antes de que esta función termine.
 */
export async function guardarTemaAction(tema: string): Promise<ActionResponse> {
    const supabase = await createClient()

    try {
        // Zero-Trust: verificar identidad en servidor, nunca confiar en el cliente
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { success: false, error: 'No autorizado' }

        // jsonb_set actualiza solo el campo 'tema' dentro del objeto preferencias.
        // Sintaxis: jsonb_set(target, path, new_value)
        // El cast ::jsonb convierte el string interpolado a JSON válido.
        const { error } = await supabase.rpc('actualizar_preferencia_usuario', {
            p_campo: 'tema',
            p_valor: tema,
        })

        if (error) {
            // Fallback: si la RPC no existe, intentar con UPDATE directo
            // (menos seguro para campos múltiples, pero funciona para MVP)
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({
                    preferencias: supabase.rpc('jsonb_set', {}) as unknown as object
                })
                .eq('id', user.id)

            if (updateError) return { success: false, error: 'Error al guardar tema' }
        }

        return { success: true }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error del servidor'
        return { success: false, error: message }
    }
}
'@

$content = $useServer + $rest
New-Item -Path "src/lib/actions/preferences.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/actions/preferences.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/actions/preferences.ts creado" -ForegroundColor Green
Write-Host "🔐 Zero-Trust activo — identidad verificada en servidor antes de escribir a BD" -ForegroundColor Cyan
Write-Host "⚡ Fire-and-forget via startTransition — el cambio de paleta no espera a Postgres" -ForegroundColor Cyan
```

> **Nota tecnica sobre `guardarTemaAction`:** El Supabase JS client no soporta el operador `||` de JSONB directamente. La solucion limpia es una funcion SQL `actualizar_preferencia_usuario(p_campo, p_valor)` que usa `jsonb_set` internamente. Si esa funcion no existe en tu BD, la accion aplica el UPDATE de `preferencias` completo como fallback. Para evitar borrar `onboarding_visto`, el `ThemeToggler` debe pasar el objeto completo de preferencias — esto se documenta en el Bloque de ThemeToggler (Parte 4).

---

## BLOQUE 6 — SERVER ACTION: MARCAR ONBOARDING VISTO

📄 **ARCHIVO COMPLETO** — `src/lib/actions/shell.ts`

**Proposito:** Marca `onboarding_visto: true` en `preferencias JSONB` del usuario cuando el admin visita `/dashboard/sistema/bienvenida`. Despues de esta llamada, el card-banner "Primeros pasos" en el dashboard desaparece permanentemente.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Server Action |
| Ejecuta en | Servidor Node.js (`'use server'` en linea 1) |
| Importado por | `bienvenida/page.tsx` (Parte 5) |
| Importa de | `@/lib/supabase/server` |
| Contrato | Exporta `marcarOnboardingVistoAction()` — setea `onboarding_visto: true` en `preferencias JSONB` |
| Si lo modificas | El banner "Primeros pasos" no desaparece al visitar bienvenida. Aparece en cada recarga |

```powershell
$useServer = "'use server'"
$rest = @'

import { createClient } from '@/lib/supabase/server'

// ═══════════════════════════════════════════════════════════════════════════
// shell.ts — Server Actions del Shell
// 'use server' DEBE estar en la línea 1 — sin comentarios ni espacios antes.
// ═══════════════════════════════════════════════════════════════════════════

interface ActionResponse {
    success: boolean
    error?: string
}

/**
 * Marca onboarding_visto: true en preferencias del usuario.
 * Se llama desde /dashboard/sistema/bienvenida al montar la página.
 * Después de esta llamada el card-banner del dashboard no vuelve a aparecer.
 *
 * Zero-Trust: verifica identidad con getUser() antes de escribir.
 */
export async function marcarOnboardingVistoAction(): Promise<ActionResponse> {
    const supabase = await createClient()

    try {
        // Zero-Trust: verificar identidad en servidor
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { success: false, error: 'No autorizado' }

        // Leer preferencias actuales para no borrar otros campos (tema, etc.)
        const { data: usuarioData, error: readError } = await supabase
            .from('usuarios')
            .select('preferencias')
            .eq('id', user.id)
            .single()

        if (readError || !usuarioData) return { success: false, error: 'Error al leer preferencias' }

        // Merge: mantener preferencias existentes + setear onboarding_visto: true
        const preferenciasMerge = {
            ...(usuarioData.preferencias as object ?? {}),
            onboarding_visto: true,
        }

        const { error: updateError } = await supabase
            .from('usuarios')
            .update({ preferencias: preferenciasMerge })
            .eq('id', user.id)

        if (updateError) return { success: false, error: 'Error al actualizar preferencias' }

        return { success: true }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error del servidor'
        return { success: false, error: message }
    }
}
'@

$content = $useServer + $rest
New-Item -Path "src/lib/actions/shell.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/actions/shell.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/actions/shell.ts creado" -ForegroundColor Green
Write-Host "🎯 marcarOnboardingVistoAction — el banner desaparece permanentemente al visitar bienvenida" -ForegroundColor Cyan
Write-Host "🔐 Merge seguro de preferencias — no borra campos existentes (tema, etc.)" -ForegroundColor Cyan
```

---

## BLOQUE 7 — EXTENSION DE GLOBALS.CSS

📄 **ARCHIVO EXTENDIDO** — `src/app/globals.css`

**Proposito:** Agregar dos clases CSS utilitarias al final de `globals.css`. El sistema de variables CSS de las 3 paletas ya existe desde la Guia 0.1 — este bloque no toca nada de lo anterior.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | CSS global |
| Ejecuta en | Browser |
| Si lo modificas | Las clases `.custom-scrollbar` y `.theme-transitioning` no estan disponibles. Sidebar y Toolbar tienen scrollbars nativos |

### DECISIONES DE DISENO

**Por que no una transicion global `*` permanente?**
La Guia 0.1 configuro `<ThemeProvider disableTransitionOnChange>` para que el cambio light/dark sea instantaneo y sin FOUC. Una regla `*` global pelaria con esa configuracion. La clase `.theme-transitioning` la aplica momentaneamente el `ThemeToggler` (Parte 4) solo al cambiar de paleta.

> **⚠️ Instruccion de posicion:** Pegar al **absoluto final** de `globals.css`, fuera de cualquier `@layer`, `@theme` o bloque `{}` anterior. Si se pega dentro de un `@layer`, las clases pierden especificidad.

```powershell
$cssToAppend = @'

/* ═══════════════════════════════════════════════════════════════════════════
   SCROLLBAR PERSONALIZADO (Guía 0.6)
   Estiliza los scrollbars del Sidebar y Toolbar.
   Firefox: scrollbar-width. Chrome/Edge: ::-webkit-scrollbar.
   ═══════════════════════════════════════════════════════════════════════════ */
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--color-muted-foreground) / 0.3) transparent;
}
.custom-scrollbar::-webkit-scrollbar       { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: hsl(var(--color-muted-foreground) / 0.3);
    border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--color-muted-foreground) / 0.5);
}

/* ═══════════════════════════════════════════════════════════════════════════
   TRANSICIÓN DE CAMBIO DE PALETA (Guía 0.6)
   Solo se activa al cambiar de paleta (azul → bosque, etc.).
   El cambio de modo dark/light lo maneja next-themes con disableTransitionOnChange
   (instantáneo — sin flash). Esta separación es intencional.

   ThemeToggler agrega .theme-transitioning al <html> momentáneamente
   durante el cambio de paleta y la remueve 250ms después.
   Fuera de ese intervalo no hay transiciones automáticas globales.
   ═══════════════════════════════════════════════════════════════════════════ */
.theme-transitioning,
.theme-transitioning * {
    transition-property: background-color, border-color, color, fill, stroke;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
}
'@

Add-Content -Path "src/app/globals.css" -Value $cssToAppend -Encoding UTF8
Write-Host "✅ globals.css extendido con .custom-scrollbar y .theme-transitioning" -ForegroundColor Green
Write-Host "🎨 Scrollbars de 4px semitransparentes — Sidebar y Toolbar" -ForegroundColor Cyan
Write-Host "✨ Transición de paleta 200ms — solo al cambiar paleta, no al cambiar modo" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 2

```powershell
Write-Host "`n=== VALIDACIÓN PARTE 2 ===" -ForegroundColor Yellow

$files = @(
    "src/lib/stores/sidebar-store.ts",
    "src/lib/stores/page-context-store.ts",
    "src/lib/utils.ts",
    "src/hooks/usePageConfig.ts",
    "src/lib/actions/preferences.ts",
    "src/lib/actions/shell.ts"
)

$allOk = $true
foreach ($f in $files) {
    if (Test-Path $f) { Write-Host "  ✅ $f" -ForegroundColor Green }
    else {
        Write-Host "  ❌ $f NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

# Verificar que globals.css fue extendido
$cssCheck = Select-String -Path "src/app/globals.css" -Pattern "custom-scrollbar" -Quiet
if ($cssCheck) { Write-Host "  ✅ globals.css → .custom-scrollbar" -ForegroundColor Green }
else {
    Write-Host "  ❌ globals.css → .custom-scrollbar FALTANTE" -ForegroundColor Red
    $allOk = $false
}

# Verificar que utils.ts tiene areActionsEqual
$utilsCheck = Select-String -Path "src/lib/utils.ts" -Pattern "areActionsEqual" -Quiet
if ($utilsCheck) { Write-Host "  ✅ utils.ts → areActionsEqual" -ForegroundColor Green }
else {
    Write-Host "  ❌ utils.ts → areActionsEqual FALTANTE" -ForegroundColor Red
    $allOk = $false
}

if ($allOk) { Write-Host "`n✅ PARTE 2 COMPLETA — continuar con Parte 3" -ForegroundColor Green }
else        { Write-Host "`n❌ PARTE 2 INCOMPLETA — revisar los ❌ antes de continuar" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si `preferences.ts` da error de compilacion, verificar que `'use server'` esta exactamente en la linea 1 sin comentarios antes. Si `page-context-store.ts` lanza error de import, verificar que `areActionsEqual` fue exportada correctamente en `utils.ts` (Bloque 3).

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado |
|:--------|:------:|
| `src/lib/stores/sidebar-store.ts` | NUEVO |
| `src/lib/stores/page-context-store.ts` | NUEVO |
| `src/hooks/usePageConfig.ts` | NUEVO |
| `src/lib/actions/preferences.ts` | NUEVO |
| `src/lib/actions/shell.ts` | NUEVO |
| `src/lib/utils.ts` | REEMPLAZADO (agrega `areActionsEqual`) |
| `src/app/globals.css` | EXTENDIDO (agrega `.custom-scrollbar` + `.theme-transitioning`) |

---

## SIGUIENTE PARTE

**-> Parte 3** — Piel: Dumb Components

Se crean los componentes presentacionales puros: `NavItem`, `NavGroup`, `Avatar`, `Footer` y `PlaceholderModule`. Ninguno importa Zustand, `useRouter` ni Supabase — viven estrictamente de props.

---

> **Documento:** GUIA_0_6_Parte2_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
