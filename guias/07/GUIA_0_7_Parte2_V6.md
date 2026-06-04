# GUIA 0.7 — SEGURIDAD RBAC VIVO (FRONT-END)
## PARTE 2: COMPONENTES DE SEGURIDAD — GUARD, PROTECTEDACTION Y SIN-ACCESO

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 2 de 3
> **Prerequisito:** Parte 1 completada — archivos existentes, pagina de diagnostico funcional en `/dashboard/pruebas`
> **Siguiente parte:** `GUIA_0_7_Parte3_V6.md` — Integracion en Layout + Toolbar + Testing
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte construye los **3 componentes de seguridad** que la Parte 3 integrara en el Shell existente. Al terminar, los componentes existen y compilan correctamente, pero todavia no estan conectados — un paso deliberado para poder validar TypeScript antes de modificar archivos criticos como `layout.tsx` y `Toolbar.tsx`.

- **Bloque 4 — `RBACGuard.tsx`:** El componente centralizado que envuelve `{children}` en el layout. Lee el `pathname`, verifica contra una lista de rutas excluidas, y para todas las demas llama a `puedeVerPagina()` del auth-store. Si retorna `false`, redirige a `/dashboard/sin-acceso`. Implementa el patron V5.1 con un solo `useEffect` consolidado y `verifiedPath` anti-parpadeo.
- **Bloque 5 — `ProtectedAction.tsx` + Hooks:** Componente de granularidad fina que envuelve micro-elementos de UI y decide ocultar o deshabilitar segun `tienePermiso()`. Incluye dos hooks: `useCanAction()` para logica condicional y `usePermissions()` para el mapa completo de las 5 acciones.
- **Bloque 6 — `sin-acceso/page.tsx`:** Pagina sumidero de denegacion. Muestra un icono de rechazo, el rol actual del usuario y botones de navegacion segura. No tiene guard — es el destino del guard.

> **Al terminar esta parte:** `npx tsc --noEmit` pasa sin errores. Los componentes existen pero no estan activos todavia — el guard no protege ninguna ruta hasta que la Parte 3 lo conecte al layout.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 4 — RBAC GUARD

📄 **ARCHIVO COMPLETO** — `src/components/shell/RBACGuard.tsx`

**Proposito:** Componente que envuelve `{children}` en el layout del dashboard y decide si renderizarlos o redirigir al usuario a la pagina de denegacion. Se coloca una sola vez en `dashboard/layout.tsx` y protege automaticamente todas las rutas bajo `/dashboard/*`.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | `dashboard/layout.tsx` (Parte 3) |
| Importa de | `react`, `next/navigation`, `@/lib/stores/auth-store` |
| Contrato | Exporta `RBACGuard` — componente con props `children`, `fallback?` |
| Si lo modificas | La proteccion de rutas se rompe. Sin `verifiedPath` hay parpadeo de contenido privado. Sin `RUTAS_PUBLICAS`, `/dashboard/sin-acceso` crea loop infinito |

### DECISIONES DE DISENO

**Por que `useState`/`useEffect` para detectar el cliente y no `useSyncExternalStore`?**
En versiones anteriores se uso `useSyncExternalStore` (el patron del Sidebar en Guia 0.6). Ese patron funciona bien en componentes que solo leen datos del store. El problema aparece cuando el componente ademas toma decisiones de navegacion con `router.replace()`: `useSyncExternalStore` produce snapshots estaticos que pueden llegar obsoletos durante transiciones de ruta, causando que el guard tome decisiones de redireccion incorrectas. El patron `useState(false)` + `useEffect(() => setIsClient(true))` es mas predecible en este contexto especifico.

**Por que un solo `useEffect` y no dos separados?**
La version anterior tenia dos efectos: uno que evaluaba permisos y seteaba `guardState('allowed')`, y otro que reseteaba a `guardState('checking')` en cada cambio de ruta. Estos efectos competian entre si — React los ejecuta en orden y el segundo sobreescribia al primero, dejando el guard atascado en "Verificando..." permanentemente. Un solo bloque reactivo consolidado elimina esta condicion de carrera.

**Por que `useAuthStoreBase` en lugar de `useAuth(selector)`?**
`useAuth()` fue disenado para componentes que participan del ciclo SSR donde el hydration mismatch es un riesgo real. El `RBACGuard` ya tiene su propio guard de hidratacion (`isClient`): no evalua nada hasta despues del mount. En ese contexto, `useSyncExternalStore` agrega latencia de sincronizacion sin beneficio. `useAuthStoreBase` lee datos reactivos y actualizados directamente.

**Por que las rutas excluidas son una constante y no props?**
Son contratos del sistema — no cambian segun quien use el componente. Hacerlas props abriria la puerta a errores donde una instancia olvida incluir `/dashboard/sin-acceso`, creando un loop infinito de redireccion. Como constante, estan definidas una sola vez y protegidas de modificaciones accidentales.

```powershell
$content = @'
/**
 * RBACGuard — Guard de ruta centralizado
 *
 * Se coloca UNA VEZ en dashboard/layout.tsx envolviendo {children}.
 * Protege automáticamente TODAS las rutas bajo /dashboard/*.
 *
 * Flujo de decisión:
 * 1. Espera mount del cliente (isClient = true)
 * 2. Espera hidratación del store (isLoading = false)
 * 3. Si la ruta está en RUTAS_PUBLICAS → renderizar {children}
 * 4. Si puedeVerPagina(pathname) → renderizar {children}
 * 5. Si no → router.replace('/dashboard/sin-acceso')
 *
 * Patrón V5.1 — correcciones sobre versión anterior:
 * - useState/useEffect para isClient (no useSyncExternalStore)
 *   Razón: useSyncExternalStore causa race condition con router.replace()
 * - Un solo useEffect consolidado (elimina competencia entre efectos)
 *   Razón: 2 efectos separados se sobreescriben mutuamente
 * - verifiedPath anti-parpadeo de contenido privado
 *   Razón: evita el frame donde guardState='allowed' de ruta anterior
 * - useAuthStoreBase directo (lectura reactiva sin capa intermedia)
 *   Razón: isClient ya protege contra evaluación en SSR
 * - eslint-disable en setState dentro de efectos:
 *   Razón: este componente requiere setState en efectos por diseño —
 *   la hidratación segura y el guard de ruta no pueden modelarse de
 *   otra forma sin introducir los race conditions que este patrón resuelve
 *
 * Guía 0.7 — Parte 2, Bloque 4
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStoreBase } from '@/lib/stores/auth-store'

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS EXCLUIDAS DEL GUARD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Rutas que NO requieren verificación RBAC.
 * Cualquier usuario autenticado puede acceder a estas rutas.
 *
 * ⚠️ CRÍTICO — /dashboard/sin-acceso DEBE estar aquí.
 *    Si se remueve: guard evalúa sin-acceso → no tiene permiso →
 *    redirige a sin-acceso → que el guard evalúa → loop infinito.
 *
 * ⚠️ /dashboard/sistema/bienvenida está excluida por onboarding:
 *    El admin llega aquí justo después del primer login.
 *    En ese momento el store puede no estar completamente hidratado.
 *    Excluirla evita que el guard rechace al admin recién registrado.
 *
 * Como constante (no prop): los contratos del sistema no deben
 * variar según quién use el componente.
 */
const RUTAS_PUBLICAS = [
    '/dashboard',
    '/dashboard/sin-acceso',
    '/dashboard/perfil',
    '/dashboard/pruebas',
    '/dashboard/sistema/bienvenida',
]

/**
 * Verifica si una ruta está excluida del guard.
 * Compara con y sin trailing slash para evitar falsos positivos.
 */
function isRutaPublica(pathname: string): boolean {
    return RUTAS_PUBLICAS.some(
        (ruta) => pathname === ruta || pathname === ruta + '/'
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

interface RBACGuardProps {
    children: React.ReactNode
    /** Qué mostrar mientras se verifican permisos. Por defecto: spinner de texto. */
    fallback?: React.ReactNode
}

export function RBACGuard({ children, fallback = null }: RBACGuardProps) {
    const pathname = usePathname()
    const router = useRouter()

    // ── Detección de cliente (mount seguro) ──────────────────────────────
    // useState/useEffect — más predecible que useSyncExternalStore
    // para componentes que combinan hidratación con navegación.
    const [isClient, setIsClient] = useState(false)

    // ── Estado del guard ─────────────────────────────────────────────────
    // 'checking' → esperando hidratación o evaluando
    // 'allowed'  → ruta verificada, renderizar children
    // 'denied'   → sin permiso, redirigiendo
    const [guardState, setGuardState] = useState<'checking' | 'allowed' | 'denied'>('checking')

    // ── Ruta verificada (anti-parpadeo) ──────────────────────────────────
    // Solo renderizar children cuando la ruta activa coincide con la
    // última ruta que pasó la verificación. Evita el frame donde
    // guardState='allowed' (ruta anterior) pero pathname ya cambió.
    const [verifiedPath, setVerifiedPath] = useState<string | null>(null)

    // ── Lectura directa del store ─────────────────────────────────────────
    // useAuthStoreBase: lectura reactiva sin la capa de useSyncExternalStore
    // que useAuth() agrega. Seguro aquí porque isClient ya garantiza
    // que solo se ejecuta después del mount (store ya hidratado).
    const isLoading = useAuthStoreBase(s => s.isLoading)
    const isAuthenticated = useAuthStoreBase(s => s.isAuthenticated)
    const puedeVerPagina = useAuthStoreBase(s => s.puedeVerPagina)

    // ── Efecto de mount ──────────────────────────────────────────────────
    // Se dispara una sola vez al montar en el DOM.
    // eslint-disable-next-line: la regla react-hooks/set-state-in-effect no aplica
    // aquí — este setState es el mecanismo de hidratación segura del componente,
    // no una sincronización con un sistema externo. Es el patrón aprobado para
    // detección de cliente cuando useSyncExternalStore causa race conditions.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsClient(true)
    }, [])

    // ── Efecto de validación CONSOLIDADO ─────────────────────────────────
    // Un solo useEffect para toda la lógica RBAC.
    // Dos efectos separados causaban race condition:
    //   Efecto A: evaluaba → setGuardState('allowed')
    //   Efecto B: reseteaba → setGuardState('checking')
    //   React ejecutaba A luego B en el mismo ciclo → atascado en 'checking'
    useEffect(() => {
        // No evaluar en servidor (localStorage no existe)
        if (!isClient) return

        // Esperar a que el store se hidrate desde localStorage
        if (isLoading) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setGuardState('checking')
            return
        }

        // Sin sesión → el layout server-side y AuthWrapper manejan /login
        // El guard no interfiere con el flujo de logout
        if (!isAuthenticated) {
            setGuardState('allowed')
            setVerifiedPath(pathname)
            return
        }

        // Ruta pública → permitir sin verificar permisos
        if (isRutaPublica(pathname)) {
            setGuardState('allowed')
            setVerifiedPath(pathname)
            return
        }

        // Verificación RBAC real contra el menú del usuario
        if (puedeVerPagina(pathname)) {
            setGuardState('allowed')
            setVerifiedPath(pathname)
        } else {
            // Log de diagnóstico — útil durante desarrollo
            console.warn(`[RBACGuard] Acceso denegado: ${pathname}`)
            setGuardState('denied')
            router.replace('/dashboard/sin-acceso')
        }
    }, [pathname, puedeVerPagina, isAuthenticated, isLoading, isClient, router])

    // ── Render ───────────────────────────────────────────────────────────

    // Mostrar fallback mientras:
    // - No estamos en cliente (primer render SSR)
    // - El store está hidratando (leyendo localStorage)
    // - El guard está verificando la ruta
    // - La ruta actual no coincide con la última verificada (anti-parpadeo)
    if (
        !isClient ||
        isLoading ||
        guardState === 'checking' ||
        (guardState === 'allowed' && pathname !== verifiedPath)
    ) {
        return (
            <>{fallback ?? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-muted-foreground font-medium text-sm">
                        Verificando permisos...
                    </div>
                </div>
            )}</>
        )
    }

    // Denegado → no renderizar nada (la redirección ya se ejecutó)
    if (guardState === 'denied') return null

    // Permitido → renderizar contenido protegido
    return <>{children}</>
}
'@

New-Item -Path "src/components/shell/RBACGuard.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/RBACGuard.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/RBACGuard.tsx creado (V5.1)" -ForegroundColor Green
Write-Host "🛡️  Patrón consolidado: 1 useEffect, verifiedPath anti-parpadeo" -ForegroundColor Cyan
Write-Host "📍 Rutas excluidas: /dashboard, /sin-acceso, /perfil, /pruebas, /bienvenida" -ForegroundColor Cyan
Write-Host "🔧 Fix lint: eslint-disable en setState dentro de efectos por diseño arquitectónico" -ForegroundColor Cyan
```

---

## BLOQUE 5 — PROTECTED ACTION + HOOKS

📄 **ARCHIVO COMPLETO** — `src/components/shell/ProtectedAction.tsx`

**Proposito:** Componente de granularidad fina para proteger micro-elementos de UI. A diferencia del `RBACGuard` (que protege paginas enteras), `ProtectedAction` envuelve botones individuales, links, iconos o cualquier fragmento de JSX y decide si mostrarlo, ocultarlo o deshabilitarlo segun `tienePermiso()`.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | Cualquier `page.tsx` que proteja micro-elementos (Guia 0.8+) |
| Importa de | `react`, `@/lib/stores/auth-store`, `@/types/shell` |
| Contrato | Exporta `ProtectedAction` (componente), `useCanAction` (hook), `usePermissions` (hook) |
| Si lo modificas | El filtrado granular de UI se rompe. Sin el fix TS18046, build falla en React 19 strict |

### DECISIONES DE DISENO

**Por que dos modos (ocultar vs deshabilitar)?**
Depende del contexto UX. Para botones destructivos como "Eliminar", lo correcto es ocultar — el usuario no necesita saber que existe una accion que no puede ejecutar. Para botones informativos como "Exportar", puede ser mejor deshabilitar — el usuario ve que la funcionalidad existe pero no tiene acceso, lo que puede motivarlo a solicitar el permiso al admin.

**Por que el componente no necesita `useSyncExternalStore`?**
Porque `ProtectedAction` siempre esta dentro de una pagina que ya maneja la hidratacion. Si el store aun no tiene datos, `tienePermiso()` retorna `false` y el componente oculta el elemento. Cuando el store se hidrata, React re-renderiza y evalua con datos reales. No hay riesgo de hydration mismatch — el resultado es `null` en ambos casos (SSR y primer render antes de hidratacion).

**Por que hooks separados ademas del componente?**
El componente cubre el caso declarativo (envolver JSX). Pero a veces se necesita logica condicional imperativa: `if (puedoEliminar) { mostrar opcion en menu contextual }`. Los hooks `useCanAction` y `usePermissions` cubren ese caso sin obligar al desarrollador a envolver cada `if` en un componente.

```powershell
$content = @'
/**
 * ProtectedAction — Componente RBAC de granularidad fina
 *
 * Envuelve cualquier elemento de UI y decide si mostrarlo,
 * ocultarlo o deshabilitarlo según los permisos del usuario.
 *
 * A diferencia del RBACGuard (protege páginas), ProtectedAction
 * protege micro-elementos: botones, links, íconos.
 *
 * Hooks auxiliares incluidos:
 *   useCanAction(submodulo, accion) → boolean
 *   usePermissions(submodulo) → { crear, editar, eliminar, ver, exportar }
 *
 * Guía 0.7 — Parte 2, Bloque 5
 */

'use client'

import * as React from 'react'
import { useAuth } from '@/lib/stores/auth-store'
import type { AccionBasica } from '@/types/shell'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface ProtectedActionProps {
    /** Contenido a proteger — botón, link, ícono, cualquier elemento de UI */
    children: React.ReactNode

    /**
     * Acción RBAC requerida — una de las 5 del sistema.
     * Debe coincidir con las claves de la tabla acciones en la BD.
     * @example 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar'
     */
    accion: AccionBasica

    /**
     * Ruta del submódulo donde se requiere el permiso.
     * Debe coincidir exactamente con el campo href de la tabla submodulos.
     * @example '/dashboard/ventas/pedidos'
     */
    submodulo: string

    /**
     * Qué mostrar si el usuario no tiene permiso.
     * Por defecto: null (el elemento desaparece del DOM completamente).
     */
    fallback?: React.ReactNode

    /**
     * Si true: deshabilita el elemento en lugar de ocultarlo.
     * Agrega: disabled, aria-disabled, opacity-50, cursor-not-allowed.
     * Útil cuando el usuario debe saber que la función existe pero no tiene acceso.
     * @default false
     */
    disableInsteadOfHide?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Envuelve un elemento de UI y decide visibilidad según permisos RBAC.
 *
 * @example Ocultar botón sin permiso
 * <ProtectedAction accion="eliminar" submodulo="/dashboard/ventas/clientes">
 *   <Button variant="destructive">Eliminar</Button>
 * </ProtectedAction>
 *
 * @example Deshabilitar en lugar de ocultar
 * <ProtectedAction accion="exportar" submodulo="/dashboard/reportes" disableInsteadOfHide>
 *   <Button>Exportar PDF</Button>
 * </ProtectedAction>
 */
export function ProtectedAction({
    children,
    accion,
    submodulo,
    fallback = null,
    disableInsteadOfHide = false,
}: ProtectedActionProps) {
    const tienePermiso = useAuth(s => s.tienePermiso)

    const hasPermission = tienePermiso(submodulo, accion)

    // ── Tiene permiso → renderizar normalmente ───────────────────────────
    if (hasPermission) {
        return <>{children}</>
    }

    // ── Sin permiso + modo deshabilitar ──────────────────────────────────
    if (disableInsteadOfHide) {
        return (
            <>
                {React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                        // FIX TS18046: En React 19 strict, child.props es unknown.
                        // Casteamos a Record<string, unknown> para acceder a className.
                        const childProps = child.props as { className?: string }

                        return React.cloneElement(child, {
                            disabled: true,
                            title: 'No tienes permiso para esta acción',
                            'aria-disabled': true,
                            className: `${childProps.className ?? ''} opacity-50 cursor-not-allowed`.trim(),
                        } as React.HTMLAttributes<HTMLElement> & { disabled?: boolean })
                    }
                    return child
                })}
            </>
        )
    }

    // ── Sin permiso + modo ocultar → mostrar fallback (por defecto null) ─
    return <>{fallback}</>
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verifica un permiso específico para lógica condicional imperativa.
 * Usar cuando necesitas if/else en lugar de envolver JSX.
 *
 * @example
 * const puedoEliminar = useCanAction('/dashboard/ventas/pedidos', 'eliminar')
 * if (puedoEliminar) {
 *     // mostrar opción "Cancelar Pedido" en menú contextual
 * }
 */
export function useCanAction(submodulo: string, accion: AccionBasica): boolean {
    const tienePermiso = useAuth(s => s.tienePermiso)
    return tienePermiso(submodulo, accion)
}

/**
 * Retorna un mapa completo de las 5 acciones para un submódulo.
 * Evita llamar tienePermiso() 5 veces manualmente.
 * El resultado se memoriza — solo se recalcula si submodulo o permisos cambian.
 *
 * @example
 * const permisos = usePermissions('/dashboard/ventas/pedidos')
 * // permisos.crear    → true
 * // permisos.editar   → true
 * // permisos.eliminar → false
 * // permisos.ver      → true
 * // permisos.exportar → false
 */
export function usePermissions(submodulo: string) {
    const tienePermiso = useAuth(s => s.tienePermiso)

    // useMemo: evita recalcular en cada render si submodulo y tienePermiso
    // no cambiaron. tienePermiso es una función estable del store.
    return React.useMemo(() => ({
        ver:      tienePermiso(submodulo, 'ver'),
        crear:    tienePermiso(submodulo, 'crear'),
        editar:   tienePermiso(submodulo, 'editar'),
        eliminar: tienePermiso(submodulo, 'eliminar'),
        exportar: tienePermiso(submodulo, 'exportar'),
    }), [submodulo, tienePermiso])
}
'@

New-Item -Path "src/components/shell/ProtectedAction.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/ProtectedAction.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/ProtectedAction.tsx creado" -ForegroundColor Green
Write-Host "🛡️  Dos modos: ocultar (default) y deshabilitar (disableInsteadOfHide)" -ForegroundColor Cyan
Write-Host "🪝 Hooks: useCanAction() para lógica imperativa, usePermissions() para mapa completo" -ForegroundColor Cyan
Write-Host "🔧 Fix TS18046: child.props casteado correctamente para React 19 strict" -ForegroundColor Cyan
```

---

## BLOQUE 6 — PAGINA DE ACCESO DENEGADO

📄 **ARCHIVO COMPLETO** — `src/app/dashboard/sin-acceso/page.tsx`

**Proposito:** Pagina sumidero generica que se muestra cuando el `RBACGuard` rechaza al usuario. El Shell completo (Sidebar, Topbar, Toolbar, Footer) permanece visible — esta pagina solo ocupa el area de `{children}`.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Client) |
| Ejecuta en | Browser |
| Importa de | `next/navigation`, `lucide-react`, `@/lib/utils`, `@/lib/stores/auth-store`, `@/hooks/usePageConfig` |
| Si lo modificas | Solo afecta la pagina de denegacion. Si no tiene `usePageConfig`, el Topbar no muestra titulo |

### DECISIONES DE DISENO

**Por que muestra el rol del usuario?**
Para facilitar el diagnostico. Si un Gerente reporta que no puede acceder a cierta pagina, el admin puede verificar inmediatamente si el problema es de rol incorrecto (la pantalla muestra "Vendedor" en lugar de "Gerente") o de permisos mal configurados (el rol es correcto pero no tiene el permiso asignado en la BD).

**Por que `router.back()` y no `router.push('/dashboard')`?**
`router.back()` lleva al usuario a donde estaba antes de intentar la ruta prohibida — mas natural que forzar siempre el Dashboard. El boton "Ir al Dashboard" existe como alternativa segura cuando el usuario llego desde un link externo o no tiene historial previo.

> **⚠️ Instruccion especial:** Esta pagina NO debe estar envuelta por ningun `<RBACGuard>` adicional. El guard centralizado excluye `/dashboard/sin-acceso` de su evaluacion. Un guard extra aqui crea loop infinito.

```powershell
# 1. Crear directorio
New-Item -ItemType Directory -Force -Path "src/app/dashboard/sin-acceso" | Out-Null

# 2. Crear página
$content = @'
/**
 * Página de Acceso Denegado — /dashboard/sin-acceso
 *
 * Destino del RBACGuard cuando el usuario no tiene permiso para una ruta.
 * El Shell (Sidebar, Topbar, Footer) permanece visible.
 *
 * ⚠️  CRÍTICO: Esta página NO debe estar envuelta por ningún guard adicional.
 *     Es el destino de la denegación — protegerla crearía un loop infinito.
 *     El guard centralizado ya la excluye de su evaluación (RUTAS_PUBLICAS).
 *
 * Guía 0.7 — Parte 2, Bloque 6
 */

'use client'

import { useRouter } from 'next/navigation'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/stores/auth-store'
import { usePageConfig } from '@/hooks/usePageConfig'

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

export default function SinAccesoPage() {
    const router = useRouter()

    // Leer rol del usuario para diagnóstico — útil cuando el admin
    // necesita verificar si el problema es de rol o de permisos
    const usuario = useAuth(s => s.usuario)

    // Registrar en el Shell — aparece en el Topbar como "Acceso Denegado"
    usePageConfig({
        info: { title: 'Acceso Denegado' },
        path: '/dashboard/sin-acceso',
    })

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">

            {/* Ícono de rechazo */}
            <div className={cn(
                'flex items-center justify-center',
                'h-20 w-20 rounded-full',
                'bg-red-500/10 text-red-500',
                'mb-6'
            )}>
                <ShieldX className="h-10 w-10" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-foreground mb-2">
                Acceso Denegado
            </h1>

            {/* Descripción */}
            <p className="text-muted-foreground max-w-md mb-2">
                No tienes permisos para acceder a esta página.
            </p>

            {/* Rol del usuario — ayuda a diagnosticar problemas de configuración */}
            <p className="text-sm text-muted-foreground mb-8">
                Tu rol actual es{' '}
                <span className="font-medium text-foreground">
                    {usuario?.rol?.nombre ?? 'desconocido'}
                </span>.{' '}
                Si crees que esto es un error, contacta al administrador de la empresa.
            </p>

            {/* Botones de navegación segura */}
            <div className="flex flex-col sm:flex-row gap-3">

                {/* Volver: lleva a la página anterior en el historial */}
                <button
                    onClick={() => router.back()}
                    className={cn(
                        'inline-flex items-center justify-center gap-2',
                        'px-4 py-2 rounded-md',
                        'border border-border',
                        'text-sm font-medium text-foreground',
                        'bg-card hover:bg-hover-bg',
                        'transition-colors duration-150'
                    )}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </button>

                {/* Dashboard: alternativa si no hay historial previo */}
                <button
                    onClick={() => router.push('/dashboard')}
                    className={cn(
                        'inline-flex items-center justify-center gap-2',
                        'px-4 py-2 rounded-md',
                        'border border-transparent',
                        'text-sm font-medium',
                        'bg-primary-accent text-primary-accent-text',
                        'hover:bg-primary-accent-hover',
                        'transition-colors duration-150'
                    )}
                >
                    <Home className="h-4 w-4" />
                    Ir al Dashboard
                </button>
            </div>
        </div>
    )
}
'@

New-Item -Path "src/app/dashboard/sin-acceso/page.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/dashboard/sin-acceso/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/dashboard/sin-acceso/page.tsx creado" -ForegroundColor Green
Write-Host "🚫 Ícono ShieldX + rol del usuario + botones Volver / Ir al Dashboard" -ForegroundColor Cyan
Write-Host "⚠️  Sin guard propio — es el destino de la denegación" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 2

```powershell
# ═══════════════════════════════════════════════════════════════
# FINGERPRINT PARTE 2 — VERIFICACIÓN DE EXISTENCIA DE ARCHIVOS
# ═══════════════════════════════════════════════════════════════

Write-Host "`n═══ VALIDACIÓN PARTE 2 — COMPONENTES DE SEGURIDAD ═══" -ForegroundColor Cyan

$archivos = @(
    "src/components/shell/RBACGuard.tsx",
    "src/components/shell/ProtectedAction.tsx",
    "src/app/dashboard/sin-acceso/page.tsx"
)

$todosOk = $true
foreach ($archivo in $archivos) {
    if (Test-Path $archivo) {
        Write-Host "  ✅ $archivo" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $archivo — FALTANTE" -ForegroundColor Red
        $todosOk = $false
    }
}

if ($todosOk) {
    Write-Host "`n✅ PARTE 2 COMPLETA — Continuar con Parte 3" -ForegroundColor Green
} else {
    Write-Host "`n❌ Archivos faltantes — Ejecutar bloques anteriores" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si algun archivo falta, ejecutar el bloque correspondiente. Si `npx tsc --noEmit` reporta errores en estos archivos, las causas mas comunes son:
> - `AccionBasica` no encontrado → el tipo no esta en `src/types/shell.ts` — volver a Guia 0.6
> - `useAuthStoreBase` no encontrado → el store base no esta exportado en `auth-store.ts` — volver a Guia 0.5
> - `TS18046` en `ProtectedAction` → el cast `child.props as { className?: string }` es necesario para React 19 strict

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado | Props / Exports |
|:--------|:------:|:----------------|
| `src/components/shell/RBACGuard.tsx` | NUEVO | `children`, `fallback` |
| `src/components/shell/ProtectedAction.tsx` | NUEVO | `children`, `accion`, `submodulo`, `fallback`, `disableInsteadOfHide` + exports `useCanAction`, `usePermissions` |
| `src/app/dashboard/sin-acceso/page.tsx` | NUEVO | Sin props (pagina autonoma) |

**Estado de conexion al terminar esta parte:**

| Componente | ¿Existe? | ¿Activo? |
|:-----------|:--------:|:--------:|
| RBACGuard | ✅ | ❌ — No esta en el layout todavia |
| ProtectedAction | ✅ | ❌ — Ninguna pagina lo usa todavia |
| sin-acceso | ✅ | ✅ — Navegable directamente a `/dashboard/sin-acceso` |

---

## SIGUIENTE PARTE

**-> Parte 3** — Integracion, Verificacion y Testing

Se modifica `dashboard/layout.tsx` para envolver `{children}` con `<RBACGuard>`, se extiende `Toolbar.tsx` con filtrado RBAC automatico, se actualizan los barrel exports del shell, y se ejecuta el checklist completo de verificacion por rol con `npm run build` final.

---

> **Documento:** GUIA_0_7_Parte2_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
