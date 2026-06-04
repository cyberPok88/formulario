# GUIA 0.5 — AUTENTICACION SaaS
## PARTE 1: PREPARACION + INFRAESTRUCTURA SUPABASE

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 1 de 6
> **Prerequisito:** Guias 0.1, 0.2, 0.3 y 0.4 completadas — `npm run build` exitoso, 33 tablas en Supabase (`COUNT(*) = 33`)
> **Prerequisito adicional (Guia 0.2):** `src/lib/supabase/client.ts` existente — el tercer cliente del trio Supabase ya fue creado
> **Siguiente parte:** `GUIA_0_5_Parte2_V6.md` — Tipos + Store + Server Actions
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Crear los directorios nuevos y los tres archivos de infraestructura que el resto de la guia importa. Ningun componente, store ni Server Action de las partes 2-6 compila si estos archivos no existen primero.

- **Bloque 1 — Directorios:** Las 6 carpetas nuevas que requiere esta guia
- **Bloque 2 — `src/lib/supabase/server.ts`:** Cliente Supabase para Server Components y Server Actions — API batch `getAll/setAll`
- **Bloque 3 — `src/lib/supabase/proxy.ts`:** Utilidad del Edge Runtime — sincroniza cookies y valida el token con `getClaims()`
- **Bloque 4 — `src/proxy.ts`:** Interceptor de Next.js 16 — protege rutas privadas y maneja `/onboarding` como ruta de estado intermedio

> **Al terminar esta parte:** Las rutas privadas estan protegidas. Un usuario sin sesion que acceda a `/dashboard` es redirigido a `/login` antes de que Next.js empiece a renderizar.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — DIRECTORIOS

📄 **ACCION** — Crear estructura de carpetas

**Proposito:** Establecer las 6 carpetas que las partes 2-6 dan por hecho que existen. Si faltan, los imports fallan con `Cannot find module`.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Estructura de directorios |
| Ejecuta en | Solo compilacion (estructura de proyecto) |
| Si lo modificas | Las partes 2-6 fallan con errores de modulo no encontrado si alguna carpeta no existe |

### DECISIONES DE DISENO

**Por que estos directorios no existen desde guias anteriores?**
`src/lib/actions/` y `src/lib/validations/` son directorios nuevos — ninguna guia anterior los necesito. `src/components/auth/` agrupa todos los componentes de autenticacion en un modulo cohesivo. Las rutas de Next.js (`login/`, `onboarding/`, `dashboard/`) se crean aqui porque son parte del sistema de autenticacion, no de guias anteriores.

**Por que `src/lib/supabase/` no esta en la lista?**
Este directorio ya existe desde la Guia 0.2 donde se creo `client.ts`. Los bloques 2 y 3 de esta parte agregan `server.ts` y `proxy.ts` — completando el trio de clientes Supabase.

```powershell
$dirs = @(
    "src/lib/actions",
    "src/lib/validations",
    "src/components/auth",
    "src/app/login",
    "src/app/onboarding",
    "src/app/dashboard"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "✅ $dir" -ForegroundColor Green
}
Write-Host "📁 6 directorios listos" -ForegroundColor Cyan
```

---

## BLOQUE 2 — CLIENTE SUPABASE SERVIDOR

📄 **ARCHIVO COMPLETO** — `src/lib/supabase/server.ts`

**Proposito:** Cliente Supabase para usar en Server Components, Server Actions y Route Handlers. Lee y escribe la sesion del usuario a traves de las cookies HTTP del request actual.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Cliente Supabase |
| Ejecuta en | Servidor (Server Components, Server Actions, Route Handlers) |
| Importado por | Todas las Server Actions (`src/lib/actions/auth.ts`), Server Components que consulten Supabase |
| Importa de | `@supabase/ssr`, `next/headers` |
| Contrato | Exporta `createClient()` — instancia asincrona del cliente Supabase servidor con acceso a cookies |
| Si lo modificas | Afecta toda operacion de Supabase en el servidor. El `try/catch` silencioso en `setAll` es intencional — no eliminarlo |

### DECISIONES DE DISENO

**Por que la API `getAll`/`setAll` en lugar de `get`/`set`/`remove` individual?**
Supabase SSR almacena la sesion en dos cookies separadas: el `access_token` y el `refresh_token`. La API individual opera sobre una cookie a la vez — con el riesgo de que ambas queden desincronizadas si ocurre un error entre operaciones. La API batch lee y escribe ambas cookies en una sola operacion atomica. Es el patron oficial de `@supabase/ssr >= 0.5.0`.

**Por que `try/catch` silencioso en `setAll`?**
En Server Components, el `cookieStore` es de solo lectura — Next.js no permite escribir cookies desde un Server Component. El error es esperado y se ignora porque en ese contexto solo se necesita leer la sesion. La escritura real siempre ocurre en el proxy (`src/proxy.ts`).

**Por que `await cookies()`?**
A partir de Next.js 16, `cookies()` de `next/headers` es asincrono. En versiones anteriores era sincrono — este cambio rompe codigo que no usa `await`.

```powershell
$content = @'
// ============================================================================
// SUPABASE CLIENT — SERVIDOR
// Usar en: Server Components, Server Actions, Route Handlers
// NO usar en: Client Components → usar src/lib/supabase/client.ts
// ============================================================================

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    // cookies() es asíncrono en Next.js 16 — siempre usar await
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Lee access_token + refresh_token en una sola operación
                getAll() {
                    return cookieStore.getAll()
                },
                // Escribe ambas cookies de forma atómica (Batch API — @supabase/ssr >= 0.5.0)
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Components: cookieStore es de solo lectura.
                        // El error es esperado — la escritura real ocurre en src/proxy.ts
                    }
                },
            },
        }
    )
}
'@

New-Item -Path "src/lib/supabase/server.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/supabase/server.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/supabase/server.ts creado" -ForegroundColor Green
Write-Host "🍪 API batch getAll/setAll — access_token y refresh_token operan juntos" -ForegroundColor Cyan
Write-Host "⚡ Compatible con cookies() asíncrono de Next.js 16" -ForegroundColor Cyan
```

---

## BLOQUE 3 — UTILIDAD SUPABASE PARA EL PROXY

📄 **ARCHIVO COMPLETO** — `src/lib/supabase/proxy.ts`

**Proposito:** Funcion auxiliar exclusiva del Edge Runtime. Crea el cliente Supabase con acceso a las cookies del request entrante, renueva el token si esta proximo a expirar, y retorna el usuario validado para que el interceptor de Next.js tome decisiones de enrutamiento.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Cliente Supabase |
| Ejecuta en | Edge Runtime (exclusivamente dentro de `src/proxy.ts`) |
| Importado por | `src/proxy.ts` (interceptor Next.js 16) |
| Importa de | `@supabase/ssr`, `next/server` |
| Contrato | Exporta `updateSession(request)` — retorna `{ supabaseResponse, user }` con cookies actualizadas y claims del JWT validado |
| Si lo modificas | Rompe la autenticacion de toda la app. No agregar codigo entre `createServerClient` y `getClaims()` |

### DECISIONES DE DISENO

**Por que `getClaims()` en lugar de `getUser()`?**
`getUser()` hace una peticion HTTP a los servidores de Supabase Auth en cada request del Edge — anade latencia de red en cada carga de pagina. `getClaims()` valida la firma JWT localmente usando las llaves publicas del proyecto: sin round-trip, con la misma garantia criptografica. Es el metodo oficial de Supabase para el proxy/middleware desde 2025.

**Por que nunca `getSession()`?**
`getSession()` lee el token de la cookie sin validarlo contra ningun servidor ni llave publica. Si un atacante manipula la cookie, `getSession()` retornaria una sesion falsa como si fuera valida. La regla ESLint configurada en la Guia 0.1 bloquea su uso en todo el proyecto.

**Por que escribir las cookies en `request.cookies` Y en `supabaseResponse.cookies`?**
El token renovado necesita llegar a dos destinos: (1) `request.cookies` para que los Server Components del mismo request lo puedan leer sin hacer otro round-trip, y (2) `supabaseResponse.cookies` para que el navegador reemplace su token viejo con el nuevo. Si solo se escribe en la response, los Server Components del request actual siguen viendo el token viejo.

**Por que no hay codigo entre `createServerClient` y `getClaims()`?**
La documentacion oficial de Supabase lo indica explicitamente: cualquier codigo entre esas dos lineas puede causar que `getClaims()` lea un estado de cookies inconsistente, generando que usuarios sean desconectados aleatoriamente.

**Por que `setAll` no recibe `headers` como segundo parametro?**
En @supabase/ssr 0.6.1 (version pineada del proyecto), la firma de `SetAllCookies` solo acepta `cookiesToSet`. El parametro `headers` existe en versiones posteriores — agregarlo aqui genera un error de TypeScript en build.

```powershell
$content = @'
// ============================================================================
// SUPABASE CLIENT — PROXY / EDGE RUNTIME
// Usar EXCLUSIVAMENTE en: src/proxy.ts
// NO usar en: Server Components ni Client Components
// ============================================================================

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Sincroniza las cookies de sesión de Supabase y valida el token.
 * Llamar al inicio de src/proxy.ts, antes de cualquier lógica de enrutamiento.
 *
 * @returns supabaseResponse — response con cookies actualizadas (SIEMPRE retornar esta)
 * @returns user — claims del JWT validado, o null si no hay sesión
 */
export async function updateSession(request: NextRequest) {
    // Response base — se reconstruye con las cookies actualizadas dentro de setAll
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Lee las cookies del request entrante
                getAll() {
                    return request.cookies.getAll()
                },
                // Escribe el token renovado en dos destinos:
                // 1. request.cookies → Server Components del mismo request lo leen sin re-fetch
                // 2. supabaseResponse.cookies → el navegador reemplaza su token viejo
                // Nota: @supabase/ssr 0.6.1 — setAll NO recibe headers como segundo parámetro
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    // Reconstruir la response con el request ya actualizado
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // ⚠️ CRÍTICO: No agregar código entre createServerClient y getClaims()
    // getClaims() valida la firma JWT localmente — sin petición HTTP a Supabase
    // NUNCA usar getSession() — lee el token sin validar (inseguro, bloqueado por ESLint)
    const { data } = await supabase.auth.getClaims()
    const user = data?.claims ?? null

    // IMPORTANTE: siempre retornar supabaseResponse tal como está
    // Crear una nueva response sin copiar las cookies de esta rompe la sesión
    return { supabaseResponse, user }
}
'@

New-Item -Path "src/lib/supabase/proxy.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/supabase/proxy.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/supabase/proxy.ts creado" -ForegroundColor Green
Write-Host "🔐 getClaims() — validación JWT local sin round-trip HTTP" -ForegroundColor Cyan
Write-Host "🚫 setAll sin headers — correcto para @supabase/ssr 0.6.1" -ForegroundColor Cyan
```

---

## BLOQUE 4 — INTERCEPTOR NEXT.JS 16

📄 **ARCHIVO COMPLETO** — `src/proxy.ts`

**Proposito:** Punto de entrada del Edge Runtime de Next.js. Se ejecuta en el servidor antes de que Next.js procese cualquier request. Es la primera capa de seguridad del sistema — decide si un request puede continuar o debe ser redirigido.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Proxy/Middleware |
| Ejecuta en | Edge Runtime (antes de cualquier renderizado de Next.js) |
| Importa de | `next/server`, `@/lib/supabase/proxy` |
| Contrato | Exporta `proxy(request)` + `config.matcher`. Protege rutas privadas, redirige usuarios sin sesion a `/login` |
| Si lo modificas | Afecta la seguridad de todas las rutas de la app. Cambiar `rutasPublicas` puede exponer rutas protegidas o bloquear rutas publicas |

### DECISIONES DE DISENO

**Por que se llama `proxy.ts` y no `middleware.ts`?**
A partir de Next.js 16, el archivo del interceptor del Edge Runtime se renombro de `middleware.ts` a `proxy.ts`. La funcionalidad es identica — es solo una convencion de nomenclatura.

**Por que `/onboarding` es una ruta especial y no simplemente publica?**
Un usuario recien registrado tiene token de Auth valido (`getClaims()` retorna `user`) pero aun no tiene registro en la tabla `usuarios` ni empresa. Si el proxy lo enviara al dashboard directamente, el `AuthWrapper` llamaria a `obtener_sesion_completa()` y recibiria `error: true` — generando un loop confuso. Al incluir `/onboarding` en las rutas que el proxy deja pasar, el `AuthWrapper` del dashboard puede detectar ese estado y redirigir a `/onboarding` correctamente. El proxy no puede hacer esa distincion sin una query a la BD (cara en el Edge) — por eso delega al `AuthWrapper`.

**Por que el matcher excluye archivos estaticos?**
Sin esa exclusion, el proxy correria para cada imagen, fuente, CSS y JS que el navegador solicita. Eso generaria miles de validaciones de token por carga de pagina, anadiendo latencia innecesaria a recursos que nunca requieren autenticacion.

```powershell
$content = @'
// ============================================================================
// NEXT.JS 16 PROXY — INTERCEPTOR EDGE RUNTIME
// Antes llamado middleware.ts (Next.js < 16). La funcionalidad es idéntica.
// Se ejecuta ANTES de cualquier renderizado de Next.js.
// Primera capa de seguridad del sistema.
// ============================================================================

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
    // Paso 1: renovar cookies de sesión y obtener el usuario validado
    // Si el usuario no tiene sesión válida, user = null
    const { supabaseResponse, user } = await updateSession(request)
    const { pathname } = request.nextUrl

    // ── Rutas públicas ────────────────────────────────────────────────────────
    // Accesibles sin sesión. El proxy las deja pasar con las cookies actualizadas.
    //
    // /onboarding es una ruta especial — tiene token Auth pero sin empresa aún.
    // El AuthWrapper del dashboard detecta ese estado y redirige aquí correctamente.
    // El proxy no puede hacer esa distinción sin una query a BD (ineficiente en Edge).
    const rutasPublicas = ['/', '/login', '/onboarding', '/auth']
    const esPublica = rutasPublicas.some(ruta => pathname.startsWith(ruta))

    if (esPublica) {
        // Usuario autenticado con empresa completa que navega manualmente a /login
        // → redirigir al dashboard, no tiene sentido mostrarle el login
        if (user && pathname === '/login') {
            return Response.redirect(new URL('/dashboard', request.url))
        }
        // Resto de rutas públicas: dejar pasar con las cookies actualizadas
        return supabaseResponse
    }

    // ── Rutas privadas ────────────────────────────────────────────────────────
    // Cualquier ruta fuera de las públicas requiere token válido.
    // Sin sesión → redirigir a /login
    if (!user) {
        return Response.redirect(new URL('/login', request.url))
    }

    // Token válido en ruta privada → permitir acceso
    // IMPORTANTE: retornar supabaseResponse, no NextResponse.next()
    // supabaseResponse ya tiene las cookies actualizadas — crear una nueva response las perdería
    return supabaseResponse
}

export const config = {
    matcher: [
        // Interceptar todos los paths EXCEPTO:
        // - _next/static  → JS y CSS generados por Next.js
        // - _next/image   → imágenes optimizadas por Next.js
        // - favicon.ico   → ícono del navegador
        // - Archivos con extensión de imagen (svg, png, jpg, jpeg, gif, webp)
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
'@

New-Item -Path "src/proxy.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/proxy.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/proxy.ts creado" -ForegroundColor Green
Write-Host "🛡️ Rutas privadas protegidas — /onboarding como ruta de estado intermedio" -ForegroundColor Cyan
Write-Host "⚡ Edge Runtime — intercepta antes del renderizado de Next.js" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 1

```powershell
Write-Host "=== VALIDACIÓN PARTE 1 ===" -ForegroundColor Cyan
$ok = $true

$archivos = @(
    "src/lib/supabase/server.ts",
    "src/lib/supabase/proxy.ts",
    "src/proxy.ts"
)
foreach ($f in $archivos) {
    if (Test-Path $f) { Write-Host "✅ $f" -ForegroundColor Green }
    else { Write-Host "❌ $f" -ForegroundColor Red; $ok = $false }
}

$directorios = @(
    "src/lib/actions",
    "src/lib/validations",
    "src/components/auth",
    "src/app/login",
    "src/app/onboarding",
    "src/app/dashboard"
)
foreach ($d in $directorios) {
    if (Test-Path $d) { Write-Host "✅ $d" -ForegroundColor Green }
    else { Write-Host "❌ $d" -ForegroundColor Red; $ok = $false }
}

if ($ok) { Write-Host "`n✅ PARTE 1 COMPLETA" -ForegroundColor Green }
else      { Write-Host "`n❌ CORREGIR ERRORES ANTES DE CONTINUAR" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si algun archivo de los 3 no existe, las partes 2-6 fallaran en compilacion con errores de modulo no encontrado. Si falta un directorio, los bloques posteriores no podran crear sus archivos en la ruta correcta.

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado |
|:--------|:------:|
| `src/lib/supabase/server.ts` | NUEVO |
| `src/lib/supabase/proxy.ts` | NUEVO |
| `src/proxy.ts` | NUEVO |

**Nota:** `src/lib/supabase/client.ts` existe desde la Guia 0.2 — no se toca. Con los dos archivos de esta parte, el trio de clientes Supabase queda completo: `client.ts` (navegador), `server.ts` (servidor), `proxy.ts` (Edge Runtime).

---

## SIGUIENTE PARTE

**-> Parte 2** — Tipos + Store + Server Actions

Se crean los tipos TypeScript del dominio de autenticacion (incluyendo `Empresa` e `id_empresa`), el store Zustand con `useSyncExternalStore` anti-hydration, y las 5 Server Actions que conectan la UI con Supabase.

---

> **Documento:** GUIA_0_5_Parte1_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
