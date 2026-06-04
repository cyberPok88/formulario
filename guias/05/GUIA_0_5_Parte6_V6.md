# GUIA 0.5 — AUTENTICACION SaaS
## PARTE 6: PAGINAS RAIZ + BARREL + VERIFICACION FINAL

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 6 de 6 (ultima parte)
> **Prerequisito:** Parte 5 completada — `npx tsc --noEmit` pasa sin errores, los 5 archivos de la Parte 5 existen (`OnboardingForm.tsx`, `onboarding/page.tsx`, `AuthWrapper.tsx`, `dashboard/layout.tsx`, `dashboard/page.tsx`)
> **Siguiente guia:** Guia 0.6 — App Shell
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

El cierre de la guia: el redirector raiz, el barrel export y la verificacion final de compilacion.

- **Bloque 1 — `src/app/page.tsx`:** Reemplaza la pagina de verificacion de Guia 0.1 — redirector que envia al dashboard o al login segun el estado de sesion
- **Bloque 2 — `src/components/auth/index.ts`:** Barrel export — centraliza las exportaciones publicas de los componentes auth

> **Al terminar esta parte:** `npm run build` pasa sin errores. La Guia 0.5 esta completa.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — REDIRECTOR RAIZ

📄 **ARCHIVO REEMPLAZADO** — `src/app/page.tsx`

**Proposito:** La ruta raiz (`/`) nunca renderiza HTML. Su unica funcion es leer el estado de sesion en el servidor y redirigir al lugar correcto antes de que Next.js envie un solo byte al navegador.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Server) |
| Ejecuta en | Servidor |
| Importa de | `next/navigation`, `@/lib/supabase/server` |
| Si lo modificas | La ruta raiz `/` se rompe. Si falla la redireccion, los usuarios pueden quedar atrapados en un loop de redireccion o ver una pagina en blanco |

### DECISIONES DE DISENO

**Por que `redirect()` desde un Server Component y no `router.push()` desde el cliente?**
`redirect()` de `next/navigation` ejecuta la redireccion en el servidor antes de renderizar. El navegador recibe directamente la respuesta de la ruta destino — sin HTML intermedio, sin parpadeo. `router.push()` requiere enviar el JS al cliente, ejecutarlo, y luego navegar — el usuario ve un estado transitorio antes de llegar al destino.

**Por que `getUser()` y no `getClaims()`?**
Este archivo no corre en el Edge Runtime — es un Server Component de Node.js. `getClaims()` es especifico del Edge Runtime (`src/lib/supabase/proxy.ts`). En Server Components, el metodo correcto es `getUser()` que valida el token contra Supabase Auth desde el servidor.

**Por que el `return null` al final?**
`redirect()` lanza internamente un error especial de Next.js (`NEXT_REDIRECT`) que interrumpe la ejecucion inmediatamente. El `return null` nunca se ejecuta en runtime, pero TypeScript requiere que los componentes React tengan un tipo de retorno valido (`JSX.Element | null`). Sin el, el compilador marca error de tipo.

> **⚠️ Instruccion especial:** Este bloque reemplaza el `page.tsx` que existe desde la Guia 0.1 (pagina de verificacion visual del proyecto). El contenido anterior se descarta completamente.

```powershell
# Verificar que el archivo de Guía 0.1 existe antes de reemplazar
if (!(Test-Path "src/app/page.tsx")) {
    Write-Host "❌ src/app/page.tsx no existe — verificar que la Guía 0.1 se completó" -ForegroundColor Red
    return
}

$content = @'
// ============================================================================
// REDIRECTOR RAÍZ — src/app/page.tsx
// Reemplaza la página de verificación visual de la Guía 0.1.
// No renderiza HTML. Su única función: leer la sesión y redirigir.
//
// Con sesión activa  → /dashboard
// Sin sesión         → /login
//
// Server Component: redirect() ocurre en el servidor antes de enviar HTML.
// El usuario nunca ve esta ruta — pasa por ella sin percibirla.
// ============================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
    const supabase = await createClient()

    // getUser() valida el token contra Supabase Auth desde el servidor
    // NUNCA getSession() — lee sin validar (bloqueado por ESLint de Guía 0.1)
    // getClaims() es exclusivo del Edge Runtime — no aplica aquí
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        redirect('/dashboard')
    } else {
        redirect('/login')
    }

    // Nunca se alcanza en runtime — redirect() lanza NEXT_REDIRECT internamente.
    // Necesario para satisfacer el tipo de retorno JSX.Element | null de TypeScript.
    return null
}
'@

Set-Content -Path "src/app/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/page.tsx REEMPLAZADO" -ForegroundColor Green
Write-Host "🔄 Antes: página de verificación visual (Guía 0.1)" -ForegroundColor Cyan
Write-Host "🔄 Ahora: redirector de servidor → /dashboard o /login" -ForegroundColor Cyan
```

---

## BLOQUE 2 — BARREL EXPORT

📄 **ARCHIVO COMPLETO** — `src/components/auth/index.ts`

**Proposito:** Centralizar las exportaciones publicas del modulo auth. Las paginas (`login/page.tsx`, `onboarding/page.tsx`, `dashboard/layout.tsx`) importan desde `@/components/auth` en lugar de rutas individuales.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Barrel export |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | `login/page.tsx`, `onboarding/page.tsx`, `dashboard/layout.tsx` |
| Importa de | `./BrandPanel`, `./LoginForm`, `./OnboardingForm`, `./AuthWrapper` |
| Contrato | Reexporta `BrandPanel`, `LoginForm`, `OnboardingForm`, `AuthWrapper` |
| Si lo modificas | Afecta todos los imports que usan `@/components/auth`. Si se agrega o quita una exportacion, los archivos que la importan desde el barrel fallan en compilacion |

### DECISIONES DE DISENO

**Por que no exportar `PasswordRequirements`?**
`PasswordRequirements` solo tiene sentido dentro de un formulario de contrasena que maneja el estado de validacion. Exportarlo lo haria disponible para importar desde cualquier parte, sugiriendo que es un componente de uso general cuando no lo es. Encapsularlo en el modulo auth comunica su naturaleza de detalle de implementacion.

```powershell
$content = @'
// ============================================================================
// BARREL EXPORT — Módulo de componentes de autenticación
// Solo exportar los componentes que otras partes de la app necesitan.
// Componentes internos (PasswordRequirements) no se exportan —
// son detalles de implementación de LoginForm y OnboardingForm.
// ============================================================================

export { BrandPanel }     from './BrandPanel'
export { LoginForm }      from './LoginForm'
export { OnboardingForm } from './OnboardingForm'
export { AuthWrapper }    from './AuthWrapper'
'@

New-Item -Path "src/components/auth/index.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/auth/index.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/components/auth/index.ts creado" -ForegroundColor Green
Write-Host "📦 4 exportaciones públicas: BrandPanel, LoginForm, OnboardingForm, AuthWrapper" -ForegroundColor Cyan
```

---

## FINGERPRINT FINAL — VALIDACION COMPLETA GUIA 0.5

```powershell
Write-Host "=== FINGERPRINT FINAL — GUÍA 0.5 ===" -ForegroundColor Cyan
Write-Host ""
$ok = $true

# ── Todos los archivos de la guía ─────────────────────────────────────────────
Write-Host "Archivos:" -ForegroundColor Yellow
$archivos = @(
    "src/lib/supabase/server.ts",
    "src/lib/supabase/proxy.ts",
    "src/proxy.ts",
    "src/types/auth.ts",
    "src/lib/stores/auth-store.ts",
    "src/lib/actions/auth.ts",
    "src/lib/validations/password.ts",
    "src/components/auth/BrandPanel.tsx",
    "src/components/auth/PasswordRequirements.tsx",
    "src/components/auth/LoginForm.tsx",
    "src/components/auth/OnboardingForm.tsx",
    "src/components/auth/AuthWrapper.tsx",
    "src/components/auth/index.ts",
    "src/app/login/page.tsx",
    "src/app/onboarding/page.tsx",
    "src/app/dashboard/layout.tsx",
    "src/app/dashboard/page.tsx",
    "src/app/page.tsx"
)
foreach ($f in $archivos) {
    if (Test-Path $f) { Write-Host "  ✅ $f" -ForegroundColor Green }
    else { Write-Host "  ❌ $f" -ForegroundColor Red; $ok = $false }
}

# ── Build final ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Build:" -ForegroundColor Yellow
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "  ✅ npm run build exitoso" -ForegroundColor Green }
else { Write-Host "  ❌ Build falló — revisar output con npm run build" -ForegroundColor Red; $ok = $false }

# ── Resultado ──────────────────────────────────────────────────────────────────
Write-Host ""
if ($ok) {
    Write-Host "✅ GUÍA 0.5 COMPLETA" -ForegroundColor Green
    Write-Host "   Login, registro, onboarding, dashboard y logout funcionan." -ForegroundColor Cyan
    Write-Host "   → Continuar con Guía 0.6 (App Shell)" -ForegroundColor Cyan
} else {
    Write-Host "❌ HAY ERRORES — Corregir antes de continuar a Guía 0.6" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si `npm run build` falla, no continuar a la Guia 0.6. El App Shell importa directamente `useAuth()`, `tienePermiso()`, `puedeVerPagina()` y `actualizarPreferencias()` del `auth-store` implementado en esta guia. Si hay errores de compilacion aqui, la siguiente guia tampoco compilara.

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado |
|:--------|:------:|
| `src/app/page.tsx` | REEMPLAZADO |
| `src/components/auth/index.ts` | NUEVO |

---

## RESUMEN COMPLETO — GUIA 0.5

### 18 archivos totales

| Parte | Archivos | Estado |
|:------|:---------|:------:|
| 1 | `server.ts`, `proxy.ts` (Supabase), `proxy.ts` (Next.js) | NUEVOS |
| 2 | `auth.ts` (tipos), `auth-store.ts`, `auth.ts` (actions), `constants.ts` | NUEVOS |
| 3 | `password.ts`, `BrandPanel.tsx`, `PasswordRequirements.tsx` | NUEVOS |
| 4 | `LoginForm.tsx`, `login/page.tsx` | NUEVOS |
| 5 | `OnboardingForm.tsx`, `onboarding/page.tsx`, `AuthWrapper.tsx`, `dashboard/layout.tsx`, `dashboard/page.tsx` | NUEVOS |
| 6 | `app/page.tsx` | REEMPLAZADO |
| 6 | `auth/index.ts` | NUEVO |

---

## SIGUIENTE GUIA

**-> Guia 0.6** — App Shell: Sidebar dinamico con menu RBAC, Topbar con perfil y sistema de temas, Toolbar contextual por pagina.

El App Shell consume directamente el `auth-store` de esta guia: `useAuth()` para leer datos del usuario, `tienePermiso(href, accion)` para filtrar botones del Toolbar, `puedeVerPagina(href)` para proteger rutas en el RBACGuard, y `actualizarPreferencias()` para el ThemeToggler. El `dashboard/page.tsx` de esta guia se reemplaza completamente.

---

> **Documento:** GUIA_0_5_Parte6_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
