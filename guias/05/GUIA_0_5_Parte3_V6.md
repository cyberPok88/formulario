# GUIA 0.5 — AUTENTICACION SaaS
## PARTE 3: COMPONENTES COMPARTIDOS

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 3 de 6
> **Prerequisito:** Parte 2 completada — `npx tsc --noEmit` pasa sin errores, `src/types/auth.ts`, `src/lib/stores/auth-store.ts`, `src/lib/constants.ts` y `src/lib/actions/auth.ts` existen
> **Siguiente parte:** `GUIA_0_5_Parte4_V6.md` — Formulario de Login
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Crear los tres bloques de infraestructura visual que comparten el login y el onboarding. Son componentes Dumb — sin acceso a stores Zustand, sin `useRouter`, sin Server Actions. Reciben todo por props.

- **Bloque 1 — `src/lib/validations/password.ts`:** Logica pura de validacion de contrasena — 5 requisitos que reflejan exactamente la configuracion de Supabase Auth
- **Bloque 2 — `src/components/auth/BrandPanel.tsx`:** Panel izquierdo corporativo — aparece en `/login` y `/onboarding` con prop `subtitle` para personalizar el mensaje por pantalla
- **Bloque 3 — `src/components/auth/PasswordRequirements.tsx`:** Checklist visual que aparece mientras el usuario escribe la contrasena — itera `PASSWORD_REQUIREMENTS` desde `password.ts`

> **Al terminar esta parte:** Los tres componentes existen de forma independiente. `npx tsc --noEmit` pasa sin errores. `BrandPanel`, `PasswordRequirements` y `validatePassword()` estan listos para ser usados en las Partes 4 y 5.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — VALIDADOR DE CONTRASENA

📄 **ARCHIVO COMPLETO** — `src/lib/validations/password.ts`

**Proposito:** Funcion pura de validacion de contrasena. Sin React, sin efectos secundarios, sin dependencias externas — solo logica evaluable en cualquier contexto.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Validaciones |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | `PasswordRequirements.tsx` (Parte 3) |
| Importa de | `@/types/auth` |
| Contrato | Exporta `validatePassword(password)` — retorna `PasswordValidation`; `PASSWORD_REQUIREMENTS` — array constante con etiquetas de cada requisito |
| Si lo modificas | `PasswordRequirements.tsx` falla si cambia `PASSWORD_REQUIREMENTS`. `LoginForm` (Parte 4) y `OnboardingForm` (Parte 5) importan `validatePassword()` |

### DECISIONES DE DISENO

**Por que minimo 8 caracteres y no 6?**
Supabase Auth tiene configurado `Minimum password length = 8` en el Dashboard (configurado en Guia 0.4, Parte 1). Si el frontend validara 6, el usuario podria escribir una contrasena de 7 caracteres que el frontend acepta pero el servidor rechaza — con un error confuso que no indica el problema real. Al replicar exactamente la misma restriccion, el error aparece en la UI antes del request.

**Por que `PASSWORD_REQUIREMENTS` como constante separada y no inline en el componente?**
`PasswordRequirements.tsx` itera esta constante para renderizar el checklist. Si las etiquetas vivieran hardcodeadas en el componente, agregar un requisito nuevo implicaria tocar tanto `validatePassword()` como el componente. Con la constante aqui, el componente simplemente la itera — el numero de requisitos puede crecer sin tocarlo.

**Por que este archivo vive en `validations/` y no en `components/auth/`?**
La validacion es logica de negocio, no logica de presentacion. Podria ser usada en un futuro Server Action que valide la contrasena antes de llamar a Supabase, en tests unitarios, o en un formulario de cambio de contrasena en otra parte de la app — sin depender de React.

```powershell
$content = @'
// ============================================================================
// VALIDADOR DE CONTRASEÑA
// Refleja exactamente los requisitos configurados en Supabase Auth (Guía 0.4 Parte 1).
// Lógica pura — sin React, sin efectos secundarios, sin dependencias externas.
// ============================================================================

import type { PasswordValidation } from '@/types/auth'

/**
 * Evalúa una contraseña contra los 5 requisitos del sistema.
 * Los requisitos coinciden exactamente con la configuración de Supabase Auth
 * para que el error aparezca en la UI antes de intentar el request al servidor.
 */
export function validatePassword(password: string): PasswordValidation {
    const minLength    = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber    = /[0-9]/.test(password)
    // Acepta los caracteres especiales más comunes en teclados estándar
    const hasSpecial   = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    // isValid solo es true cuando los 5 requisitos se cumplen simultáneamente
    const isValid      = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial

    return { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial, isValid }
}

// Etiquetas legibles de cada requisito — PasswordRequirements.tsx las itera para el checklist.
// Agregar un requisito aquí lo añade automáticamente al componente visual.
export const PASSWORD_REQUIREMENTS = [
    { key: 'minLength',    label: 'Mínimo 8 caracteres' },
    { key: 'hasUppercase', label: 'Una letra mayúscula' },
    { key: 'hasLowercase', label: 'Una letra minúscula' },
    { key: 'hasNumber',    label: 'Un número' },
    { key: 'hasSpecial',   label: 'Un carácter especial (!@#$%...)' },
] as const
'@

New-Item -Path "src/lib/validations/password.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/validations/password.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/validations/password.ts creado" -ForegroundColor Green
Write-Host "🔒 5 requisitos — espejo exacto de la configuración de Supabase Auth" -ForegroundColor Cyan
```

---

## BLOQUE 2 — BRAND PANEL

📄 **ARCHIVO COMPLETO** — `src/components/auth/BrandPanel.tsx`

**Proposito:** Panel de identidad visual que aparece en el lado izquierdo de `/login` y `/onboarding` en pantallas de escritorio (1024px+). En moviles no se renderiza — el formulario ocupa el 100% del ancho.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente Dumb |
| Patron | Dumb Component |
| Ejecuta en | Browser |
| Importado por | `login/page.tsx` (Parte 4), `onboarding/page.tsx` (Parte 5) |
| Importa de | `lucide-react` |
| Contrato | Exporta `BrandPanel` — componente con prop `subtitle?: string` |
| Si lo modificas | Afecta las pantallas de `/login` y `/onboarding`. Cambiar las props requiere actualizar ambas paginas |

### DECISIONES DE DISENO

**Por que `subtitle` como prop y no hardcodeado?**
`/login` muestra el mensaje generico de la app. `/onboarding` necesita un mensaje de bienvenida para el proceso de configuracion de empresa. Sin la prop, habria que duplicar el componente o condicionar el texto dentro con logica de contexto — que un componente Dumb no deberia tener. La prop mantiene el componente agnostico.

**Por que `bg-slate-950` fijo y no una clase semantica del sistema de temas?**
El panel izquierdo es el ancla visual institucional de la app — la misma decision que tomara el Sidebar en la Guia 0.6. El sistema de temas (paletas Slate, Zinc, Ocean) aplica al dashboard. El panel de login tiene una identidad visual propia que no cambia con el tema del usuario. Si se usara `bg-background`, el panel se veria blanco en modo light y perderia su caracter corporativo.

**Por que las tarjetas flotantes usan `hidden xl:flex`?**
En pantallas lg (1024px–1279px) el panel ya existe pero es estrecho — las tarjetas flotantes se saldrian de los margenes. En xl (1280px+) hay espacio suficiente. El `hidden` base evita que aparezcan apiladas en el flujo del DOM cuando la pantalla es pequena.

```powershell
$content = @'
// ============================================================================
// BRAND PANEL — Panel izquierdo del login y onboarding (REDISEÑO PREMIUM)
// Componente Dumb: sin stores, sin Router, sin Server Actions
// Visible en lg+ (1024px+). En móviles el formulario ocupa el 100%.
// ============================================================================

import { ShieldCheck, Activity, Globe, Zap } from 'lucide-react'

interface BrandPanelProps {
    // Personaliza el mensaje descriptivo bajo la propuesta de valor.
    // Sin prop → muestra el tagline genérico de la plataforma.
    subtitle?: string
}

export function BrandPanel({ subtitle }: BrandPanelProps) {
    return (
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-[#0A0A0B] text-white border-r border-white/5">

            {/* ── 1. FONDOS Y EFECTOS AMBIENTALES ─────────────────────────────────── */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Gradiente base oscuro */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/10 to-[#0A0A0B]" />

                {/* Patrón dot-matrix SVG inyectado con máscara de degradado */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)] opacity-80" />

                {/* Luces Aurora (Blur + Mix Blend) */}
                <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            {/* ── 2. HEADER: LOGO Y MARCA ─────────────────────────────────────────── */}
            <div className="relative z-10 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-900/50 border border-white/10 backdrop-blur-md">
                    <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-wide text-white">
                    ERP Global<span className="text-blue-500">.</span>
                </span>
            </div>

            {/* ── 3. CONTENIDO PRINCIPAL Y PROPUESTA DE VALOR ─────────────────────── */}
            <div className="relative z-10 flex flex-col gap-10 w-full max-w-xl">
                <div className="space-y-6">
                    {/* Badge tipo 'Pill' */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">Next-Gen SaaS Platform</span>
                    </div>

                    {/* Tipografía Hero */}
                    <h1 className="text-5xl xl:text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 leading-[1.1]">
                        Orquesta tu <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            futuro empresarial.
                        </span>
                    </h1>

                    {/* Subtítulo dinámico */}
                    <p className="text-lg text-slate-400 leading-relaxed font-light max-w-md">
                        {subtitle ?? 'Gestión integral multiempresa. Entorno altamente escalable, seguro y preparado para cualquier vertical de negocio.'}
                    </p>
                </div>

                {/* Tarjetas Bento de características */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-colors group">
                        <ShieldCheck className="w-7 h-7 text-emerald-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                        <h3 className="text-sm font-semibold text-slate-200">Arquitectura Zero-Trust</h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Verificación estricta y seguridad por diseño en cada capa del sistema.</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-colors group">
                        <Globe className="w-7 h-7 text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                        <h3 className="text-sm font-semibold text-slate-200">Escala Global</h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Computación en el Edge con persistencia de base de datos distribuida.</p>
                    </div>
                </div>
            </div>

            {/* ── 4. FOOTER: STATUS Y PRUEBA SOCIAL ───────────────────────────────── */}
            <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-8 mt-12">
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                        {/* Avatares superpuestos (diseño UI) */}
                        {[
                            'bg-gradient-to-br from-emerald-400 to-teal-600',
                            'bg-gradient-to-br from-blue-400 to-indigo-600',
                            'bg-gradient-to-br from-amber-400 to-orange-600'
                        ].map((bgClass, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0B] flex items-center justify-center overflow-hidden">
                                <div className={`w-full h-full ${bgClass} opacity-80`} />
                            </div>
                        ))}
                    </div>
                    <span className="text-xs font-medium text-slate-400">Soporte corporativo 24/7</span>
                </div>

                {/* Badge de estado del sistema (Edge) */}
                <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    Sistemas Operativos
                </div>
            </div>
        </div>
    )
}
'@

New-Item -Path "src/components/auth/BrandPanel.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/auth/BrandPanel.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/auth/BrandPanel.tsx creado" -ForegroundColor Green
Write-Host "🎨 Prop subtitle — reutilizable en login y onboarding sin duplicar" -ForegroundColor Cyan
Write-Host "🌑 bg-slate-950 fijo — ancla visual institucional, independiente del sistema de temas" -ForegroundColor Cyan
```

---

## BLOQUE 3 — PASSWORD REQUIREMENTS

📄 **ARCHIVO COMPLETO** — `src/components/auth/PasswordRequirements.tsx`

**Proposito:** Checklist visual que aparece mientras el usuario escribe su contrasena. Cada requisito muestra un ✓ verde cuando se cumple y una ✗ gris mientras no. Controlado por la prop `show` — aparece al hacer focus en el campo password.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente Dumb |
| Patron | Dumb Component |
| Ejecuta en | Browser |
| Importado por | `LoginForm.tsx` (Parte 4), `OnboardingForm.tsx` (Parte 5) |
| Importa de | `lucide-react`, `@/lib/utils`, `@/types/auth`, `@/lib/validations/password` |
| Contrato | Exporta `PasswordRequirements` — componente con props `validation: PasswordValidation` y `show: boolean` |
| Si lo modificas | Afecta `LoginForm` y `OnboardingForm`. Si cambia la interfaz `PasswordValidation`, el tipado falla en ambos formularios |

### DECISIONES DE DISENO

**Por que `show` como prop y no estado interno?**
El formulario padre decide cuando mostrar el checklist — tipicamente al hacer focus en el campo de contrasena y ocultarlo cuando el campo pierde focus o cuando la contrasena es valida. Si el componente manejara su propio estado de visibilidad, el formulario padre no tendria control sobre ese comportamiento. La prop mantiene el componente Dumb y controlable.

**Por que itera `PASSWORD_REQUIREMENTS` y no tiene sus propias etiquetas?**
La fuente de verdad de las etiquetas esta en `password.ts`. Si se agregara un requisito nuevo (ej: sin espacios), se haria en `password.ts` y apareceria automaticamente en el checklist sin tocar este componente.

```powershell
$content = @'
// ============================================================================
// PASSWORD REQUIREMENTS — Checklist visual de requisitos de contraseña
// Componente Dumb: sin stores, sin Router, sin Server Actions
// Controlado por prop show — el formulario padre decide cuándo es visible
// ============================================================================

import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PasswordValidation } from '@/types/auth'
import { PASSWORD_REQUIREMENTS } from '@/lib/validations/password'

interface PasswordRequirementsProps {
    validation: PasswordValidation  // Estado actual — calculado en el formulario padre
    show: boolean                   // El formulario decide cuándo mostrar el checklist
}

export function PasswordRequirements({ validation, show }: PasswordRequirementsProps) {
    // No renderizar si no debe mostrarse — evita un espacio vacío en el layout
    if (!show) return null

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 animate-in slide-in-from-top-2 duration-300">
            {PASSWORD_REQUIREMENTS.map(({ key, label }) => {
                // Leer el estado del requisito del objeto validation
                const passed = validation[key as keyof PasswordValidation] as boolean

                return (
                    <div
                        key={key}
                        className={cn(
                            'flex items-center gap-2.5 text-sm transition-all duration-300',
                            // Verde cuando se cumple, gris mientras no
                            passed ? 'text-emerald-600 font-medium' : 'text-slate-500'
                        )}
                    >
                        {passed
                            ? <Check className="h-4 w-4 flex-shrink-0" />
                            : <X className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        }
                        <span>{label}</span>
                    </div>
                )
            })}
        </div>
    )
}
'@

New-Item -Path "src/components/auth/PasswordRequirements.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/auth/PasswordRequirements.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/auth/PasswordRequirements.tsx creado" -ForegroundColor Green
Write-Host "✔️ Itera PASSWORD_REQUIREMENTS — nuevos requisitos aparecen automáticamente" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 3

```powershell
Write-Host "=== VALIDACIÓN PARTE 3 ===" -ForegroundColor Cyan
$ok = $true

$archivos = @(
    "src/lib/validations/password.ts",
    "src/components/auth/BrandPanel.tsx",
    "src/components/auth/PasswordRequirements.tsx"
)
foreach ($f in $archivos) {
    if (Test-Path $f) { Write-Host "✅ $f" -ForegroundColor Green }
    else { Write-Host "❌ $f" -ForegroundColor Red; $ok = $false }
}

if ($ok) { Write-Host "`n✅ PARTE 3 COMPLETA" -ForegroundColor Green }
else      { Write-Host "`n❌ CORREGIR ERRORES ANTES DE CONTINUAR" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si `password.ts` no existe, `PasswordRequirements.tsx` falla al importar `PASSWORD_REQUIREMENTS`. Si `BrandPanel.tsx` no existe, `login/page.tsx` y `onboarding/page.tsx` de las partes 4 y 5 no compilan.

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado |
|:--------|:------:|
| `src/lib/validations/password.ts` | NUEVO |
| `src/components/auth/BrandPanel.tsx` | NUEVO |
| `src/components/auth/PasswordRequirements.tsx` | NUEVO |

---

## SIGUIENTE PARTE

**-> Parte 4** — Formulario de Login

Se crea `LoginForm.tsx` — el componente orquestador con `mode: 'login' | 'register'` — y la pagina `src/app/login/page.tsx` que ensambla el layout dividido con `BrandPanel` a la izquierda y `LoginForm` a la derecha.

---

> **Documento:** GUIA_0_5_Parte3_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
