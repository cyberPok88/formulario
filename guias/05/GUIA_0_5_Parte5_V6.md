# GUIA 0.5 — AUTENTICACION SaaS
## PARTE 5: ONBOARDING + DASHBOARD

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 5 de 6
> **Prerequisito:** Parte 4 completada — `npx tsc --noEmit` pasa sin errores, `src/components/auth/LoginForm.tsx` y `src/app/login/page.tsx` existen
> **Siguiente parte:** `GUIA_0_5_Parte6_V6.md` — Paginas Raiz + Barrel + Verificacion Final
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

La pantalla de configuracion inicial de empresa y el dashboard con su proteccion de cliente.

- **Bloque 1 — `src/components/auth/OnboardingForm.tsx`:** Formulario de empresa con nombre, RFC opcional y selector de plan
- **Bloque 2 — `src/app/onboarding/page.tsx`:** Pagina con mismo layout dividido — `BrandPanel` con subtitulo personalizado
- **Bloque 3 — `src/components/auth/AuthWrapper.tsx`:** Protector del dashboard — rehidrata sesion, redirige a `/onboarding` si no hay empresa, escucha eventos de logout
- **Bloque 4 — `src/app/dashboard/layout.tsx`:** Layout que monta `AuthWrapper` para todas las rutas del dashboard
- **Bloque 5 — `src/app/dashboard/page.tsx`:** Placeholder visual con datos reales del store — verifica que toda la cadena funciona

> **Al terminar esta parte:** `npx tsc --noEmit` pasa sin errores. El flujo completo funciona de principio a fin — registro → onboarding → dashboard. `AuthWrapper` protege el dashboard en el cliente.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — ONBOARDING FORM

📄 **ARCHIVO COMPLETO** — `src/components/auth/OnboardingForm.tsx`

**Proposito:** Formulario que el usuario nuevo completa una sola vez para configurar su empresa. Al exito, los triggers de PostgreSQL siembran automaticamente roles, catalogos y permisos RBAC para los 8 roles base.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | `onboarding/page.tsx` (Parte 5) |
| Importa de | `react`, `next/navigation`, `lucide-react`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `@/lib/stores/auth-store`, `@/lib/actions/auth`, `@/lib/constants`, `@/lib/utils` |
| Contrato | Exporta `OnboardingForm` — componente sin props (autogestionado) |
| Si lo modificas | Afecta la pantalla de onboarding. Cambiar el guard de redireccion o la logica de `setAuth()` puede romper el flujo registro → onboarding → dashboard |

### DECISIONES DE DISENO

**Por que el guard usa `useEffect` + `if return null` y no solo `useEffect`?**
El `useEffect` ejecuta la redireccion, pero hay un frame entre que el componente monta y que el efecto corre — en ese frame el formulario se pintaria brevemente. El `if (usuario?.empresa?.id) return null` antes del JSX elimina ese flash: si ya hay empresa, el componente no renderiza nada mientras el router procesa el `replace`.

**Por que el selector de plan renderiza `PLANES` importado de `lib/constants.ts` y no hace una query?**
`PLANES` es una constante hardcodeada en `lib/constants.ts` — los planes solo cambian con un deploy. Importarla evita una query en la carga del formulario. `crearEmpresaAction()` hace el unico query necesario (`SELECT id WHERE clave = ?`) cuando el usuario confirma.

**Por que RFC es opcional?**
El RFC es requerido para timbrar CFDIs pero no para operar el sistema internamente. Al hacerlo opcional, el usuario puede empezar a operar de inmediato y completar los datos fiscales despues desde "Mi Empresa" (modulo Sistema, Guia futura).

**Por que el boton de plan usa `<button type="button">` y no `<input type="radio">`?**
Los radios nativos son dificiles de estilizar para coincidir con el diseno de tarjetas. El patron `<button type="button">` con estado local (`planClave`) da control total sobre el visual (borde de color, checkmark, layout) manteniendo la accesibilidad con `onClick`.

```powershell
$content = @'
'use client'

// ============================================================================
// ONBOARDING FORM — Configuración inicial de empresa
// Client Component: necesita useState, useEffect y useRouter.
// Smart Component: accede al auth-store para hidratar la sesión al éxito.
// Se muestra una sola vez en la vida del tenant — al completar el registro.
//
// CORRECCIÓN (Guía 0.5 Parte 5 Bloque 1):
// Guard de redirección — si el usuario ya tiene empresa (ej: navega manualmente
// a /onboarding después de completarlo), se redirige al dashboard inmediatamente
// sin renderizar el formulario.
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStoreBase } from '@/lib/stores/auth-store'
import { crearEmpresaAction } from '@/lib/actions/auth'
import { PLANES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function OnboardingForm() {
    const router   = useRouter()
    const setAuth  = useAuthStoreBase(s => s.setAuth)
    const usuario  = useAuthStoreBase(s => s.usuario)

    const [nombre, setNombre]       = useState('')
    const [rfc, setRfc]             = useState('')
    // Preseleccionar el primer plan — el usuario puede cambiar antes de confirmar
    const [planClave, setPlanClave] = useState<string>(PLANES[0].clave)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError]         = useState('')

    // ── GUARD: redirigir si el usuario ya tiene empresa ───────────────────
    // Caso: admin con sesión activa navega manualmente a /onboarding.
    // Sin este guard podría intentar crear una segunda empresa.
    // Se ejecuta al montar — si usuario.empresa existe, redirige antes de pintar el form.
    useEffect(() => {
        if (usuario?.empresa?.id) {
            router.replace('/dashboard')
        }
    }, [usuario, router])

    // Mientras el guard evalúa, no renderizar el formulario
    // Evita el flash del form antes de que el useEffect se ejecute
    if (usuario?.empresa?.id) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nombre.trim()) return

        setIsLoading(true)
        setError('')

        try {
            const res = await crearEmpresaAction(
                nombre.trim(),
                rfc.trim() || null,  // null si el campo está vacío
                planClave
            )

            if (res.error) { setError(res.error); return }

            const { session } = res
            if (!session || session.error || !session.usuario) {
                setError(session?.mensaje || 'Error al configurar la sesión.')
                return
            }

            // La sesión ya incluye la empresa, menú y permisos del administrador
            setAuth(session.usuario, session.menu || [], session.permisos || [])
            router.push('/dashboard')
        } catch {
            setError('Error de conexión. Intenta nuevamente.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[440px] space-y-8">

            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                        <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                        Tu empresa
                    </h2>
                </div>
                <p className="text-slate-500 text-sm">
                    Configura los datos básicos. Puedes completar el perfil fiscal después.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Nombre de la empresa */}
                <div className="space-y-2">
                    <Label htmlFor="nombre-empresa">Nombre de la empresa *</Label>
                    <Input
                        id="nombre-empresa"
                        type="text"
                        placeholder="Distribuidora Ejemplo S.A. de C.V."
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        disabled={isLoading}
                        required
                        autoFocus
                    />
                </div>

                {/* RFC — opcional */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="rfc">RFC</Label>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Opcional
                        </span>
                    </div>
                    <Input
                        id="rfc"
                        type="text"
                        placeholder="XAXX010101000"
                        value={rfc}
                        onChange={e => setRfc(e.target.value.toUpperCase())}
                        disabled={isLoading}
                        maxLength={13}
                    />
                    <p className="text-xs text-slate-400">
                        Necesario para emitir facturas CFDI. Puedes agregarlo después en Mi Empresa.
                    </p>
                </div>

                {/* Selector de plan — itera PLANES importado de lib/constants.ts */}
                <div className="space-y-3">
                    <Label>Plan</Label>
                    <div className="space-y-2">
                        {PLANES.map((plan) => (
                            <button
                                key={plan.clave}
                                type="button"
                                onClick={() => setPlanClave(plan.clave)}
                                disabled={isLoading}
                                className={cn(
                                    'w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all duration-200',
                                    planClave === plan.clave
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                )}
                            >
                                <div>
                                    <p className={cn(
                                        'font-semibold text-sm',
                                        planClave === plan.clave ? 'text-blue-700' : 'text-slate-800'
                                    )}>
                                        {plan.nombre}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {plan.descripcion}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                    <span className={cn(
                                        'text-sm font-medium',
                                        planClave === plan.clave ? 'text-blue-600' : 'text-slate-500'
                                    )}>
                                        {plan.precio}
                                    </span>
                                    {/* Checkmark — solo visible en el plan seleccionado */}
                                    {planClave === plan.clave && (
                                        <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error inline del servidor */}
                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 animate-in slide-in-from-top-1 duration-200">
                        {error}
                    </p>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || !nombre.trim()}
                >
                    {isLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Configurando empresa...</>
                        : <><span>Crear empresa e ir al dashboard</span><ArrowRight className="ml-2 h-4 w-4" /></>
                    }
                </Button>
            </form>

            <p className="text-center text-xs text-slate-400">
                © 2026 ERP Global. Todos los derechos reservados.
            </p>
        </div>
    )
}
'@

New-Item -Path "src/components/auth/OnboardingForm.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/auth/OnboardingForm.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/auth/OnboardingForm.tsx actualizado" -ForegroundColor Green
Write-Host "🛡️ Guard agregado — redirige a /dashboard si el usuario ya tiene empresa" -ForegroundColor Cyan
Write-Host "👁️ if (usuario?.empresa?.id) return null — evita flash del form" -ForegroundColor Cyan
```

---

## BLOQUE 2 — PAGINA DE ONBOARDING

📄 **ARCHIVO COMPLETO** — `src/app/onboarding/page.tsx`

**Proposito:** Pantalla de configuracion inicial. Mismo layout dividido que `/login` pero con el `BrandPanel` mostrando un subtitulo contextual para el proceso de configuracion de empresa.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Server) |
| Ejecuta en | Servidor |
| Importa de | `@/components/auth/BrandPanel`, `@/components/auth/OnboardingForm` |
| Si lo modificas | La ruta `/onboarding` se rompe. Sin el layout dividido, los usuarios recien registrados no pueden configurar su empresa |

```powershell
$content = @'
// ============================================================================
// ONBOARDING PAGE — Configuración inicial de empresa
// Ruta especial: accesible con token Auth aunque el usuario no tenga empresa aún.
// El proxy la deja pasar. El AuthWrapper del dashboard redirige aquí
// cuando detecta token sin registro en tabla usuarios.
// ============================================================================

import { BrandPanel } from '@/components/auth/BrandPanel'
import { OnboardingForm } from '@/components/auth/OnboardingForm'

export const metadata = {
    title: 'Configura tu empresa | ERP Global',
}

export default function OnboardingPage() {
    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* BrandPanel con subtítulo contextual para el proceso de onboarding */}
            <BrandPanel subtitle="Configura tu empresa y empieza a operar en minutos." />

            {/* Panel derecho — formulario de empresa */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <OnboardingForm />
            </div>
        </div>
    )
}
'@

New-Item -Path "src/app/onboarding/page.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/onboarding/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/onboarding/page.tsx creado" -ForegroundColor Green
Write-Host "🏢 BrandPanel con subtitle contextual — mismo layout que /login" -ForegroundColor Cyan
```

---

## BLOQUE 3 — AUTH WRAPPER

📄 **ARCHIVO COMPLETO** — `src/components/auth/AuthWrapper.tsx`

**Proposito:** Segunda capa de seguridad del lado del cliente. Se monta cuando React carga el dashboard, verifica la sesion, rehidrata el store si esta vacio, y redirige a `/onboarding` si el usuario tiene token pero aun no tiene empresa.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | `dashboard/layout.tsx` (Parte 5) |
| Importa de | `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/stores/auth-store`, `@/lib/actions/auth`, `lucide-react` |
| Contrato | Exporta `AuthWrapper` — componente que envuelve `children` y controla sesion en el cliente |
| Si lo modificas | Afecta todas las rutas `/dashboard/**`. Si se elimina la rehidratacion, el store puede quedar vacio tras un refresh de pagina |

### DECISIONES DE DISENO

**Por que existe si el proxy ya protege las rutas?**
El proxy intercepta requests HTTP. La navegacion SPA con `router.push()` entre paginas del dashboard no genera un nuevo request HTTP — el proxy no se ejecuta en esas transiciones. El `AuthWrapper` cubre ese escenario verificando la sesion cuando React monta el componente.

**Por que `rehidratarSesionAction()` y no `supabase.auth.getUser()` directamente?**
`rehidratarSesionAction()` llama a `obtener_sesion_completa()` en la BD — retorna el usuario, el menu y los permisos en una sola llamada. `getUser()` solo retorna el usuario de Auth, sin los datos del ERP. Para hidratar el store correctamente se necesitan los tres: usuario, menu y permisos.

**Por que `error: true` de `rehidratarSesionAction()` redirige a `/onboarding` y no a `/login`?**
`error: true` en `obtener_sesion_completa()` ocurre cuando el `auth.uid()` tiene token valido pero no existe en la tabla `usuarios`. Eso significa que el registro en Auth fue exitoso pero el onboarding no se completo. El usuario no debe ir a `/login` — ya esta autenticado. Debe ir a `/onboarding` para completar la configuracion de empresa.

**Por que `onAuthStateChange` y no solo el estado del store?**
El store persiste en localStorage. Si el usuario borra las cookies desde DevTools (o la sesion expira en otro tab), el store seguiria teniendo `isAuthenticated: true` pero la sesion real ya no existe. `onAuthStateChange` escucha eventos de Supabase Auth en tiempo real — si hay un `SIGNED_OUT`, limpia el store y redirige a `/login` inmediatamente.

```powershell
$content = @'
'use client'

// ============================================================================
// AUTH WRAPPER — Protector del dashboard (lado del cliente)
// Segunda capa de seguridad después del proxy.
// Cubre la navegación SPA donde el proxy no intercepta nuevos requests HTTP.
// ============================================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStoreBase, useAuth } from '@/lib/stores/auth-store'
import { rehidratarSesionAction } from '@/lib/actions/auth'
import { Loader2 } from 'lucide-react'

interface AuthWrapperProps {
    children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
    const router = useRouter()
    // useAuth (con useSyncExternalStore) para leer del store de forma SSR-safe
    const isAuthenticated = useAuth(s => s.isAuthenticated)
    const isLoading       = useAuth(s => s.isLoading)
    // Estado local de verificación — spinner mientras se resuelve la sesión
    const [checking, setChecking] = useState(true)

    useEffect(() => {
        const { setAuth, clearAuth, setLoading } = useAuthStoreBase.getState()

        const verificarSesion = async () => {
            // Llamar la Server Action que ejecuta obtener_sesion_completa() en la BD
            const data = await rehidratarSesionAction()

            if (data.error) {
                // error: true → token Auth válido pero sin registro en tabla usuarios
                // El onboarding no se completó → redirigir a completarlo
                router.push('/onboarding')
                return
            }

            if (!data.usuario) {
                // Sin usuario → sesión completamente inválida → ir a login
                clearAuth()
                router.push('/login')
                return
            }

            // Si el store ya tiene sesión (navegación interna entre páginas del dashboard),
            // solo desactivar el loading — no rehidratar de nuevo para evitar re-renders
            if (useAuthStoreBase.getState().isAuthenticated) {
                setLoading(false)
                setChecking(false)
                return
            }

            // Store vacío (refresh de página o nueva pestaña) → hidratar con los datos frescos
            setAuth(data.usuario, data.menu || [], data.permisos || [])
            setChecking(false)
        }

        verificarSesion()

        // Listener de eventos de Auth — detecta logout desde otras pestañas o expiración
        const supabase = createClient()
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_OUT') {
                clearAuth()
                router.push('/login')
            }
        })

        // Limpiar el listener al desmontar el componente
        return () => subscription.unsubscribe()
    }, [router])

    // Spinner centralizado mientras se verifica la sesión
    if (checking || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        )
    }

    // Sin autenticación → no renderizar nada (el useEffect ya redirigió)
    if (!isAuthenticated) return null

    return <>{children}</>
}
'@

New-Item -Path "src/components/auth/AuthWrapper.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/auth/AuthWrapper.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/auth/AuthWrapper.tsx creado" -ForegroundColor Green
Write-Host "🛡️ Redirige a /onboarding si sesión sin empresa, a /login si sin token" -ForegroundColor Cyan
Write-Host "👂 onAuthStateChange — detecta logout multi-pestaña en tiempo real" -ForegroundColor Cyan
```

---

## BLOQUE 4 — LAYOUT DEL DASHBOARD

📄 **ARCHIVO COMPLETO** — `src/app/dashboard/layout.tsx`

**Proposito:** Monta `AuthWrapper` para todas las rutas `/dashboard/**`. Por el sistema de layouts jerarquicos de Next.js, cualquier pagina nueva dentro del dashboard hereda la proteccion automaticamente sin necesidad de agregar `AuthWrapper` manualmente en cada una.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | layout.tsx |
| Ejecuta en | Servidor |
| Importa de | `@/components/auth/AuthWrapper` |
| Si lo modificas | Afecta todas las rutas `/dashboard/**`. Sin `AuthWrapper`, las rutas del dashboard pierden proteccion contra navegacion SPA |

```powershell
$content = @'
// ============================================================================
// DASHBOARD LAYOUT — Layout protegido con AuthWrapper
// Aplica a todas las rutas /dashboard/** por el sistema jerárquico de Next.js.
// La estructura visual (sidebar, topbar, toolbar) se implementa en la Guía 0.6.
// Este layout solo establece la protección de acceso.
// ============================================================================

import { AuthWrapper } from '@/components/auth/AuthWrapper'

export const metadata = {
    title: 'Dashboard | ERP Global',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthWrapper>
            {children}
        </AuthWrapper>
    )
}
'@

New-Item -Path "src/app/dashboard/layout.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/dashboard/layout.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/dashboard/layout.tsx creado" -ForegroundColor Green
Write-Host "🛡️ Todas las rutas /dashboard/** protegidas — herencia automática de Next.js" -ForegroundColor Cyan
```

---

## BLOQUE 5 — DASHBOARD PLACEHOLDER

📄 **ARCHIVO COMPLETO** — `src/app/dashboard/page.tsx`

**Proposito:** Pantalla temporal de verificacion que muestra datos reales del store. Si el nombre del usuario, la empresa y el rol aparecen correctamente, toda la cadena de autenticacion funciona de extremo a extremo.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Client) |
| Ejecuta en | Browser |
| Importa de | `@/lib/stores/auth-store`, `@/lib/actions/auth`, `next/navigation`, `lucide-react`, `@/components/ui/button` |
| Si lo modificas | Solo afecta la pagina de dashboard. Se reemplaza completamente en la Guia 0.6 |

### DECISIONES DE DISENO

**Por que `useAuthStoreBase` directamente y no `useAuth()`?**
El `AuthWrapper` ya resolvio la hidratacion y muestra un spinner hasta que todo esta listo — cuando los `children` se renderizan, el store ya esta hidratado y estable. No hay riesgo de hydration mismatch en este punto porque el `AuthWrapper` es un Client Component que controla exactamente cuando renderiza sus hijos.

> **Este archivo se reemplaza completamente en la Guia 0.6** cuando el App Shell real (sidebar dinamico, topbar, toolbar contextual) este implementado.

```powershell
$content = @'
'use client'

// ============================================================================
// DASHBOARD PLACEHOLDER — Pantalla temporal de verificación
// Se REEMPLAZA COMPLETAMENTE en la Guía 0.6 (App Shell).
//
// Qué valida que funcione:
//   ✅ proxy.ts dejó pasar al usuario autenticado
//   ✅ AuthWrapper verificó la sesión y rehidrató el store si era necesario
//   ✅ obtener_sesion_completa() retornó usuario, empresa y rol correctos
//   ✅ El store Zustand tiene los datos disponibles en el cliente
// ============================================================================

import { useAuthStoreBase } from '@/lib/stores/auth-store'
import { cerrarSesionAction } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import { LogOut, Building2, User, Shield, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
    // useAuthStoreBase es seguro aquí — AuthWrapper ya resolvió la hidratación
    const usuario   = useAuthStoreBase(s => s.usuario)
    const clearAuth = useAuthStoreBase(s => s.clearAuth)
    const router    = useRouter()

    const handleLogout = async () => {
        await cerrarSesionAction()  // Invalida el token en Supabase Auth
        clearAuth()                 // Limpia el store Zustand y el localStorage
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">

            {/* Topbar mínimo — el real se implementa en Guía 0.6 */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl">
                        <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-sm">ERP Global</p>
                        <p className="text-xs text-slate-400">
                            {usuario?.empresa?.nombre ?? 'Cargando...'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-500 gap-2"
                >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                </Button>
            </header>

            {/* Contenido */}
            <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">

                {/* Bienvenida */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">
                        Bienvenido, {usuario?.nombre ?? '...'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        El App Shell real (sidebar dinámico, topbar, RBAC) se implementa en la Guía 0.6.
                    </p>
                </div>

                {/* Tarjetas de datos de sesión — verificación visual de la cadena */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <User className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Usuario</span>
                        </div>
                        <p className="font-semibold text-slate-900">{usuario?.nombre ?? '—'}</p>
                        <p className="text-sm text-slate-400">{usuario?.email ?? '—'}</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Building2 className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Empresa</span>
                        </div>
                        <p className="font-semibold text-slate-900">
                            {usuario?.empresa?.nombre ?? '—'}
                        </p>
                        <p className="text-sm text-slate-400">
                            Plan: {usuario?.empresa?.plan ?? '—'}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Shield className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Rol</span>
                        </div>
                        <p className="font-semibold text-slate-900 capitalize">
                            {usuario?.rol?.nombre ?? '—'}
                        </p>
                        <p className="text-sm text-slate-400">
                            Nivel {usuario?.rol?.nivel ?? '—'}
                        </p>
                    </div>
                </div>

                {/* Indicador del siguiente paso */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
                    <p className="text-sm text-blue-700 font-medium">
                        → La Guía 0.6 implementa el App Shell: sidebar dinámico con menú RBAC,
                        topbar con perfil y sistema de temas, toolbar contextual por página.
                    </p>
                </div>
            </main>
        </div>
    )
}
'@

New-Item -Path "src/app/dashboard/page.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/dashboard/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/dashboard/page.tsx creado" -ForegroundColor Green
Write-Host "📊 Muestra nombre, empresa, plan y rol — verifica toda la cadena" -ForegroundColor Cyan
Write-Host "🔄 Se reemplaza completamente en la Guía 0.6" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 5

```powershell
Write-Host "=== VALIDACIÓN PARTE 5 ===" -ForegroundColor Cyan
$ok = $true

$archivos = @(
    "src/components/auth/OnboardingForm.tsx",
    "src/app/onboarding/page.tsx",
    "src/components/auth/AuthWrapper.tsx",
    "src/app/dashboard/layout.tsx",
    "src/app/dashboard/page.tsx"
)
foreach ($f in $archivos) {
    if (Test-Path $f) { Write-Host "✅ $f" -ForegroundColor Green }
    else { Write-Host "❌ $f" -ForegroundColor Red; $ok = $false }
}

if ($ok) { Write-Host "`n✅ PARTE 5 COMPLETA" -ForegroundColor Green }
else      { Write-Host "`n❌ CORREGIR ERRORES ANTES DE CONTINUAR" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si `AuthWrapper.tsx` no existe, `dashboard/layout.tsx` no compilara. Si `dashboard/layout.tsx` no existe, las rutas del dashboard no tienen proteccion. Si `onboarding/page.tsx` no existe, los usuarios que completen el registro no tendran a donde ir.

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado |
|:--------|:------:|
| `src/components/auth/OnboardingForm.tsx` | NUEVO |
| `src/app/onboarding/page.tsx` | NUEVO |
| `src/components/auth/AuthWrapper.tsx` | NUEVO |
| `src/app/dashboard/layout.tsx` | NUEVO |
| `src/app/dashboard/page.tsx` | NUEVO |

---

## SIGUIENTE PARTE

**-> Parte 6** — Paginas Raiz + Barrel + Verificacion Final

Se reemplaza `src/app/page.tsx` con el redirector que envia al dashboard o al login segun sesion, se crea el barrel export `auth/index.ts`, y se ejecuta el Fingerprint final con `npm run build`.

---

> **Documento:** GUIA_0_5_Parte5_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
