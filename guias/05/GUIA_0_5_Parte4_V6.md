# GUIA 0.5 — AUTENTICACION SaaS
## PARTE 4: FORMULARIO DE LOGIN

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 4 de 6
> **Prerequisito:** Parte 3 completada — `npx tsc --noEmit` pasa sin errores, `src/lib/validations/password.ts`, `src/components/auth/BrandPanel.tsx` y `src/components/auth/PasswordRequirements.tsx` existen
> **Siguiente parte:** `GUIA_0_5_Parte5_V6.md` — Onboarding + Dashboard
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

El formulario de login con sus dos modos y la pagina que lo monta en el layout dividido.

- **Bloque 1 — `src/components/auth/LoginForm.tsx`:** Componente orquestador con `mode: 'login' | 'register'` — gestiona ambos modos, llama las Server Actions e hidrata el store al exito
- **Bloque 2 — `src/app/login/page.tsx`:** Server Component que verifica sesion antes de renderizar y ensambla `BrandPanel` + `LoginForm` en el layout dividido

> **Al terminar esta parte:** `npx tsc --noEmit` pasa sin errores. La ruta `/login` funciona con ambos modos. Al exito del login va al dashboard; al exito del registro va a `/onboarding`.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — LOGIN FORM

📄 **ARCHIVO COMPLETO** — `src/components/auth/LoginForm.tsx`

**Proposito:** El cerebro del flujo de login. Un solo componente gestiona dos modos mediante estado interno, sin cambiar de ruta entre ellos. Al completar un login o registro exitoso, hidrata el store Zustand antes de redirigir.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Smart Component |
| Patron | Smart Component |
| Ejecuta en | Browser |
| Importado por | `login/page.tsx` (Parte 4) |
| Importa de | `react`, `next/navigation`, `lucide-react`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `./PasswordRequirements`, `@/lib/stores/auth-store`, `@/lib/actions/auth`, `@/lib/validations/password`, `@/lib/utils`, `@/types/auth` |
| Contrato | Exporta `LoginForm` — componente sin props (autogestionado) con dos modos internos `'login' \| 'register'` |
| Si lo modificas | Afecta toda la pantalla de login. Cambiar la logica de `setAuth()` antes del redirect puede causar que el dashboard haga rehidratacion innecesaria a la BD |

### DECISIONES DE DISENO

**Por que un solo componente con `mode` en lugar de dos componentes separados?**
Ambos modos comparten: el `BrandPanel` a la izquierda, el campo de email, la logica de visibilidad del password, y el estado de carga. Con un solo componente, el `BrandPanel` no se desmonta al cambiar de modo — la transicion es fluida. Con dos componentes, React desmontaria y volveria a montar todo al cambiar de modo, generando un parpadeo visible.

**Por que `setAuth()` se llama ANTES de `router.push('/dashboard')`?**
Si se llamara despues del redirect, la pagina del dashboard montaria con el store vacio y el `AuthWrapper` dispararia `rehidratarSesionAction()` innecesariamente. Al hidratar primero, el dashboard "encuentra" el store listo y el `AuthWrapper` detecta `isAuthenticated: true` sin hacer ninguna llamada adicional.

**Por que registro exitoso va a `/onboarding` y no al dashboard?**
`registrarseAction` solo crea el usuario en Supabase Auth — aun no existe en la tabla `usuarios` ni tiene empresa. Si el redirect fuera al dashboard, el `AuthWrapper` llamaria `rehidratarSesionAction()` y recibiria `error: true` (sin empresa) → redireccionaria a `/onboarding`. El comportamiento seria el mismo pero con una llamada innecesaria a la BD. Ir directamente a `/onboarding` evita ese round-trip.

**Por que el link "¿Olvidaste tu contrasena?" usa `alert()` y no `sonner`?**
`sonner` se instalo en la Guia 0.2 pero el `<Toaster>` no se configura en el layout raiz hasta la Guia 0.6 (App Shell). Sin el `<Toaster>`, `toast()` no renderiza nada visible. Un `alert()` garantiza que el implementador vea el mensaje en este estado de la guia. La implementacion real de recuperacion de contrasena (con `sonner` y el flow de Supabase) va en una guia posterior.

**Por que `PasswordRequirements` usa `showRequirements && password.length > 0`?**
Mostrar el checklist con todos los requisitos en rojo en el campo vacio (al hacer focus sin escribir) genera ansiedad innecesaria. La condicion `password.length > 0` garantiza que el checklist solo aparece cuando el usuario ha empezado a escribir.

```powershell
$content = @'
'use client'

// ============================================================================
// LOGIN FORM — Orquestador del flujo de login y registro
// Client Component: necesita useState para los modos y useRouter para el redirect.
// Smart Component: accede al auth-store para hidratar la sesión al éxito.
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordRequirements } from './PasswordRequirements'
import { useAuthStoreBase } from '@/lib/stores/auth-store'
import { iniciarSesionAction, registrarseAction } from '@/lib/actions/auth'
import { validatePassword } from '@/lib/validations/password'
import { cn } from '@/lib/utils'
import type { PasswordValidation } from '@/types/auth'

export function LoginForm() {
    const router = useRouter()
    // useAuthStoreBase directamente: este componente solo escribe en el store (setAuth),
    // no lee de él — no hay riesgo de hydration mismatch al no leer estado persistido
    const setAuth = useAuthStoreBase(s => s.setAuth)

    // ── Estado del formulario ──────────────────────────────────────────────
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showRequirements, setShowRequirements] = useState(false)

    // ── Campos del formulario ──────────────────────────────────────────────
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')

    // Validación en tiempo real — se recalcula en cada keystroke del campo password
    const passwordValidation: PasswordValidation = validatePassword(password)

    // Limpia el estado al cambiar de modo — el BrandPanel no se desmonta
    const switchMode = (newMode: 'login' | 'register') => {
        setMode(newMode)
        setError('')
        setPassword('')
        setConfirm('')
        setShowPassword(false)
        setShowConfirm(false)
        setShowRequirements(false)
    }

    // ── Login ──────────────────────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) return
        setIsLoading(true)
        setError('')

        try {
            const res = await iniciarSesionAction(email, password)

            if (res.error) { setError(res.error); return }

            const { session } = res
            if (!session || session.error || !session.usuario) {
                setError(session?.mensaje || 'Error al cargar la sesión.')
                return
            }

            // Hidratar el store ANTES del redirect
            // El dashboard encuentra el store listo — sin llamada adicional a la BD
            setAuth(session.usuario, session.menu || [], session.permisos || [])
            router.push('/dashboard')
        } catch {
            setError('Error de conexión. Intenta nuevamente.')
        } finally {
            setIsLoading(false)
        }
    }

    // ── Registro ───────────────────────────────────────────────────────────
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nombre || !email || !password || !confirm) return

        if (!passwordValidation.isValid) {
            setError('La contraseña no cumple todos los requisitos.')
            return
        }
        if (password !== confirm) {
            setError('Las contraseñas no coinciden.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const res = await registrarseAction(nombre, email, password)

            if (res.error) { setError(res.error); return }

            // Registro exitoso → ir a configurar empresa
            // NO llamar setAuth aquí — el usuario aún no tiene registro en tabla usuarios
            router.push('/onboarding')
        } catch {
            setError('Error de conexión. Intenta nuevamente.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[400px] space-y-8">

            {/* Header — título cambia según el modo activo */}
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    {mode === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
                </h2>
                <p className="text-slate-500 text-sm">
                    {mode === 'login'
                        ? 'Ingresa tus credenciales para continuar.'
                        : 'Completa los datos para registrarte.'}
                </p>
            </div>

            {/* ── MODO LOGIN ────────────────────────────────────────────── */}
            {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-primary-accent font-semibold">Correo Electrónico</Label>
                        <Input
                            id="email-login"
                            type="email"
                            placeholder="tu@empresa.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password-login" className="text-primary-accent font-semibold">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password-login"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Tu contraseña"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword
                                    ? <EyeOff className="h-4 w-4" />
                                    : <Eye className="h-4 w-4" />
                                }
                            </button>
                        </div>
                        {/* Link de recuperación — sin implementación real en esta guía */}
                        <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline float-right"
                            onClick={() => alert('Recuperación de contraseña disponible en una guía posterior.')}
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>

                    {/* Error inline del servidor */}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 animate-in slide-in-from-top-1 duration-200">
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</>
                            : <><span>Iniciar sesión</span><ArrowRight className="ml-2 h-4 w-4" /></>
                        }
                    </Button>

                    <p className="text-center text-sm text-slate-500">
                        ¿Sin cuenta?{' '}
                        <button
                            type="button"
                            onClick={() => switchMode('register')}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Regístrate
                        </button>
                    </p>
                </form>
            )}

            {/* ── MODO REGISTRO ─────────────────────────────────────────── */}
            {mode === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre completo</Label>
                        <Input
                            id="nombre"
                            type="text"
                            placeholder="Tu nombre"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            disabled={isLoading}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email-register">Correo electrónico</Label>
                        <Input
                            id="email-register"
                            type="email"
                            placeholder="tu@empresa.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password-register">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password-register"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mínimo 8 caracteres"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onFocus={() => setShowRequirements(true)}
                                disabled={isLoading}
                                required
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword
                                    ? <EyeOff className="h-4 w-4" />
                                    : <Eye className="h-4 w-4" />
                                }
                            </button>
                        </div>
                        {/* Checklist — aparece al hacer focus, solo si hay algo escrito */}
                        <PasswordRequirements
                            validation={passwordValidation}
                            show={showRequirements && password.length > 0}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm">Confirmar contraseña</Label>
                        <div className="relative">
                            <Input
                                id="confirm"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Repite tu contraseña"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                disabled={isLoading}
                                required
                                className={cn(
                                    'pr-10',
                                    // Borde rojo si hay contenido y no coinciden
                                    confirm && confirm !== password
                                        ? 'border-red-400 focus-visible:ring-red-400'
                                        : ''
                                )}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirm
                                    ? <EyeOff className="h-4 w-4" />
                                    : <Eye className="h-4 w-4" />
                                }
                            </button>
                        </div>
                        {/* Validación inline de confirmación — no esperar al submit */}
                        {confirm && confirm !== password && (
                            <p className="text-xs text-red-500">Las contraseñas no coinciden.</p>
                        )}
                    </div>

                    {/* Error inline del servidor */}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 animate-in slide-in-from-top-1 duration-200">
                            {error}
                        </p>
                    )}

                    {/* Botón deshabilitado hasta que la contraseña sea válida */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !passwordValidation.isValid}
                    >
                        {isLoading
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando cuenta...</>
                            : <><span>Crear cuenta</span><ArrowRight className="ml-2 h-4 w-4" /></>
                        }
                    </Button>

                    <p className="text-center text-sm text-slate-500">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            type="button"
                            onClick={() => switchMode('login')}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Inicia sesión
                        </button>
                    </p>
                </form>
            )}

            {/* Footer */}
            <p className="text-center text-xs text-slate-400">
                © 2026 ERP Global. Acceso restringido.
            </p>
        </div>
    )
}

'@

New-Item -Path "src/components/auth/LoginForm.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/auth/LoginForm.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/auth/LoginForm.tsx creado" -ForegroundColor Green
Write-Host "🔄 mode: 'login' | 'register' — toggle sin cambiar URL ni desmontar BrandPanel" -ForegroundColor Cyan
Write-Host "⚛️ setAuth() antes de router.push — dashboard encuentra el store listo" -ForegroundColor Cyan
```

---

## BLOQUE 2 — PAGINA DE LOGIN

📄 **ARCHIVO COMPLETO** — `src/app/login/page.tsx`

**Proposito:** Server Component que ensambla el layout dividido. Verifica sesion antes de renderizar — si el usuario ya esta autenticado, lo redirige al dashboard sin mostrar el formulario.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Server) |
| Ejecuta en | Servidor |
| Importa de | `next/navigation`, `@/lib/supabase/server`, `@/components/auth/BrandPanel`, `@/components/auth/LoginForm` |
| Si lo modificas | La ruta `/login` se rompe. Si se elimina la verificacion de sesion, usuarios autenticados verian el formulario de login al navegar manualmente a `/login` |

### DECISIONES DE DISENO

**Por que verificar sesion aqui si el proxy ya lo hace?**
El proxy protege rutas privadas. `/login` es ruta publica — el proxy la deja pasar siempre. Sin esta verificacion, un usuario que navega manualmente a `/login` mientras ya tiene sesion activa veria el formulario de login aunque ya este autenticado. Esta verificacion server-side complementa al proxy para ese caso especifico.

```powershell
$content = @'
// ============================================================================
// LOGIN PAGE — Pantalla de login
// Server Component: verifica sesión antes de renderizar.
// Si el usuario ya está autenticado → redirect al dashboard.
// ============================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BrandPanel } from '@/components/auth/BrandPanel'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
    title: 'Iniciar sesión | ERP Global',
}

export default async function LoginPage() {
    // Verificar sesión en el servidor — complementa al proxy para rutas públicas
    // El proxy deja pasar /login siempre; esta verificación redirige si ya hay sesión
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect('/dashboard')

    return (
        // Layout dividido: BrandPanel izquierdo (lg+) + LoginForm derecho
        <div className="min-h-screen flex bg-white font-sans">
            {/* Panel izquierdo — oculto en móviles, visible en lg+ */}
            <BrandPanel />

            {/* Panel derecho — 100% en móviles, 50% en desktop */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <LoginForm />
            </div>
        </div>
    )
}
'@

New-Item -Path "src/app/login/page.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/login/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/login/page.tsx creado" -ForegroundColor Green
Write-Host "🖥️ Layout dividido: BrandPanel (lg+) + LoginForm" -ForegroundColor Cyan
Write-Host "🔒 Verificación de sesión server-side — complementa al proxy" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 4

```powershell
Write-Host "=== VALIDACIÓN PARTE 4 ===" -ForegroundColor Cyan
$ok = $true

$archivos = @(
    "src/components/auth/LoginForm.tsx",
    "src/app/login/page.tsx"
)
foreach ($f in $archivos) {
    if (Test-Path $f) { Write-Host "✅ $f" -ForegroundColor Green }
    else { Write-Host "❌ $f" -ForegroundColor Red; $ok = $false }
}

if ($ok) { Write-Host "`n✅ PARTE 4 COMPLETA" -ForegroundColor Green }
else      { Write-Host "`n❌ CORREGIR ERRORES ANTES DE CONTINUAR" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si `LoginForm.tsx` no existe, la pagina de login no compilara. Si `login/page.tsx` no existe, la ruta `/login` retornara 404 y el proxy no tendra a donde redirigir a los usuarios sin sesion.

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado |
|:--------|:------:|
| `src/components/auth/LoginForm.tsx` | NUEVO |
| `src/app/login/page.tsx` | NUEVO |

---

## SIGUIENTE PARTE

**-> Parte 5** — Onboarding + Dashboard

Se crea el `OnboardingForm.tsx` con selector de plan, la pagina `/onboarding`, el `AuthWrapper` que protege el dashboard y redirige a `/onboarding` cuando detecta sesion sin empresa, el layout del dashboard y el placeholder visual con datos reales del store.

---

> **Documento:** GUIA_0_5_Parte4_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
