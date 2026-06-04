# GUIA 0.2 — DEPENDENCIAS DE NEGOCIO
## PARTE 2: CLIENTES SUPABASE SSR

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 2 de 5
> **Prerequisito:** Parte 1 completada — todos los grupos de dependencias instalados y `npx tsc --noEmit` exitoso
> **Siguiente parte:** `GUIA_0_2_Parte3_V6.md` — Infraestructura de Validacion y Calculo
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Crear los 3 clientes Supabase SSR, uno por cada contexto de ejecucion de Next.js App Router. Son la capa de comunicacion fundamental del ERP — ninguna parte del sistema puede hablar con Supabase sin ellos.

Los 3 archivos que se crean aqui son **version final permanente**. La Guia 0.5 (Autenticacion Zero-Trust) los referenciara y verificara, pero no los reemplazara.

- **Bloque 1 — `client.ts`:** Cliente para el navegador. El browser maneja las cookies automaticamente.
- **Bloque 2 — `server.ts`:** Cliente para Server Components y Server Actions. Lee y escribe cookies HTTP via Next.js con API Batch.
- **Bloque 3 — `proxy.ts`:** Helper del Edge Proxy. Sincroniza cookies, valida la sesion con `getClaims()` y aplica redireccion a `/login` si no hay usuario. Lo llama `src/proxy.ts` (que se crea en la Guia 0.5).

> **Al terminar esta parte:** Los 3 clientes existen en `src/lib/supabase/` y el ERP tiene la infraestructura completa para comunicarse con Supabase desde cualquier contexto de ejecucion.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## POR QUE 3 CLIENTES DISTINTOS?

Next.js App Router ejecuta codigo en 3 entornos con mecanismos de acceso a cookies completamente diferentes. Un solo cliente no puede cubrir los 3:

| Contexto | Archivo | Acceso a cookies | Cuando se usa |
|:---------|:--------|:----------------|:--------------|
| **Browser** | `client.ts` | `document.cookie` — el navegador las adjunta automaticamente | Client Components (`'use client'`) |
| **Server** | `server.ts` | `cookies()` de Next.js — API asincrona de la request entrante | Server Components, Server Actions, Route Handlers |
| **Edge/Proxy** | `proxy.ts` | `request.cookies` + `response.cookies` — lectura y escritura atomica | Llamado exclusivamente desde `src/proxy.ts` |

---

## SOBRE `getClaims()` VS `getUser()` VS `getSession()`

Esta distincion es critica. La documentacion oficial de Supabase (abril 2026) establece:

| Metodo | Donde valida | Velocidad | Usar en |
|:-------|:-------------|:----------|:--------|
| `getSession()` | ❌ Token local sin validar — inseguro | Rapido | **Nunca** — bloqueado por ESLint del proyecto |
| `getUser()` | Servidor de Supabase Auth (peticion HTTP) | Lento — requiere red | Server Components, Server Actions |
| `getClaims()` | Firma JWT local contra claves publicas del proyecto | Rapido — sin red | Edge Proxy (`lib/supabase/proxy.ts`) |

`getClaims()` es el estandar para el Edge porque valida el JWT criptograficamente sin red — ideal cuando el codigo corre en cada request. `getUser()` sigue siendo correcto en Server Components donde la latencia de una llamada HTTP es aceptable y no esta en el camino critico de cada request.

---

## BLOQUE 1 — `client.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/supabase/client.ts`

**Proposito:** Cliente Supabase para Client Components. El navegador adjunta las cookies de sesion automaticamente en cada peticion — no se necesita configuracion adicional de cookies.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Cliente Supabase |
| Ejecuta en | Browser |
| Importado por | Client Components que interactuen con Supabase directamente |
| Importa de | `@supabase/ssr` (createBrowserClient) |
| Contrato | Exporta `createClient()` — retorna instancia de Supabase para browser |
| Si lo modificas | Todos los Client Components que usen Supabase dejaran de funcionar |

### DECISIONES DE DISENO

**Por que funcion y no variable de modulo?**
Cada Client Component obtiene su propia instancia al llamar `createClient()` — evita compartir estado entre renders en React 19 Concurrent Mode.

```powershell
New-Item -Path "src/lib/supabase" -ItemType Directory -Force | Out-Null

$content = @'
// ════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT — BROWSER
// Usar en: Client Components ('use client')
// NO usar en: Server Components, Server Actions, src/proxy.ts
//
// El navegador adjunta las cookies de sesión automáticamente en cada request.
// No se necesita configuración adicional de cookies.
// ════════════════════════════════════════════════════════════════════════════

import { createBrowserClient } from '@supabase/ssr'

/**
 * Crea el cliente Supabase para el contexto del navegador.
 *
 * Se llama como función (no como variable de módulo) para que cada
 * Client Component obtenga su propia instancia — evita compartir
 * estado entre renders en React 19 Concurrent Mode.
 *
 * Uso:
 *   'use client'
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 *   const { data } = await supabase.from('productos').select()
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
'@

New-Item -Path "src/lib/supabase/client.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/supabase/client.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/supabase/client.ts creado" -ForegroundColor Green
Write-Host "🌐 Cliente Browser — cookies automáticas via document.cookie" -ForegroundColor Cyan
```

---

## BLOQUE 2 — `server.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/supabase/server.ts`

**Proposito:** Cliente Supabase para Server Components, Server Actions y Route Handlers. Lee la sesion del usuario desde las cookies HTTP de la request entrante.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Cliente Supabase |
| Ejecuta en | Servidor (Node.js) |
| Importado por | Server Components, Server Actions, Route Handlers |
| Importa de | `@supabase/ssr` (createServerClient), `next/headers` (cookies) |
| Contrato | Exporta `createClient()` async — retorna instancia de Supabase para servidor |
| Si lo modificas | Todos los Server Components y Server Actions que usen Supabase dejaran de funcionar |

### DECISIONES DE DISENO

**Por que `getAll`/`setAll` en lugar de `get`/`set`/`remove` individual?**
Supabase Auth emite dos tokens simultaneos: access token y refresh token, en cookies separadas. La API Batch lee y escribe ambas de forma atomica — garantiza que nunca queda un token sin su par. Es el patron oficial de `@supabase/ssr >= 0.5.0`.

**Por que `setAll` tiene un `catch` vacio?**
En Server Components, el cookie store es de solo lectura — el `catch` vacio es el patron oficial de Supabase para este caso: el cliente funciona en todos los contextos del servidor sin lanzar errores. La escritura real de cookies solo ocurre en el Edge (`lib/supabase/proxy.ts`).

**Por que `cookies()` es `await`?**
En Next.js 16, `cookies()` de `next/headers` retorna una Promise. En versiones anteriores era sincrona. El `await` es obligatorio.

```powershell
$content = @'
// ════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT — SERVIDOR
// Usar en: Server Components, Server Actions, Route Handlers
// NO usar en: Client Components (usar src/lib/supabase/client.ts)
// NO usar en: src/proxy.ts (usar src/lib/supabase/proxy.ts)
//
// Lee la sesión del usuario desde las cookies HTTP de la request entrante.
// El cookieStore es de solo lectura en Server Components — la escritura
// de cookies ocurre exclusivamente en el Edge (lib/supabase/proxy.ts).
// ════════════════════════════════════════════════════════════════════════════

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Crea el cliente Supabase para el contexto del servidor.
 *
 * Es async porque cookies() de Next.js 16 retorna una Promise.
 * Siempre awaitearlo antes de usar:
 *
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 * getUser() es correcto aquí: en Server Components la latencia de una
 * llamada HTTP a Supabase Auth es aceptable. getClaims() se reserva
 * para el Edge Proxy donde cada request pasa por esa validación.
 */
export async function createClient() {
  // cookies() es async en Next.js 16 — obligatorio awaitearlo
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lee todas las cookies de la request actual en una sola operación (Batch API)
        getAll() {
          return cookieStore.getAll()
        },

        // Escribe múltiples cookies en la response (Batch API)
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // En Server Components el cookieStore es de solo lectura.
            // Se ignora — no es un error, es el comportamiento esperado.
            // La escritura real ocurre en src/lib/supabase/proxy.ts
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
Write-Host "🖥️  Cliente Servidor — API Batch getAll/setAll, cookies() async" -ForegroundColor Cyan
Write-Host "🔒 setAll con catch vacío — patrón oficial para Server Components" -ForegroundColor Cyan
```

---

## BLOQUE 3 — `proxy.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/supabase/proxy.ts`

**Proposito:** Helper del Edge Proxy. Sincroniza las cookies de sesion entre la request y la response, valida la sesion con `getClaims()` y redirige a `/login` si no hay usuario autenticado. Concentra toda la logica de sesion del Edge en un solo lugar.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Cliente Supabase (Edge) |
| Ejecuta en | Edge Runtime |
| Importado por | `src/proxy.ts` (se crea en Guia 0.5) |
| Importa de | `@supabase/ssr` (createServerClient), `next/server` (NextResponse, NextRequest) |
| Contrato | Exporta `updateSession(request)` — sincroniza cookies y valida sesion |
| Si lo modificas | La proteccion de rutas del Edge deja de funcionar — usuarios no autenticados acceden a rutas privadas |

### DECISIONES DE DISENO

**Por que se llama `proxy.ts` y no `middleware.ts`?**
La documentacion oficial de Supabase (abril 2026) renombro este helper para alinearse con la convencion de Next.js 16. Hay dos archivos con el mismo nombre pero en rutas distintas: `src/lib/supabase/proxy.ts` (este — el helper de Supabase) y `src/proxy.ts` (el interceptor Edge de Next.js, que se crea en la Guia 0.5 y solo importa `updateSession` de este archivo).

**Por que `getClaims()` en lugar de `getUser()`?**
El Edge Proxy corre antes de cada request. `getUser()` haria una peticion HTTP a Supabase Auth en cada navegacion, sumando latencia acumulada. `getClaims()` valida el JWT localmente contra las claves publicas del proyecto — sin red, en microsegundos. Seguridad equivalente, sin costo de red.

**Nota critica de la documentacion oficial:** No insertar codigo entre `createServerClient` y `getClaims()`. Cualquier instruccion intermedia puede causar que usuarios sean desconectados aleatoriamente — un bug dificil de reproducir.

**Por que `setAll` propaga `headers`?**
La nueva API de `@supabase/ssr >= 0.6.0` permite que Supabase propague headers adicionales junto con las cookies — por ejemplo, headers de cache o correlacion de requests. El parametro debe estar en la firma para compatibilidad con versiones futuras del paquete.

```powershell
$content = @'
// ════════════════════════════════════════════════════════════════════════════
// SUPABASE PROXY HELPER — EDGE
// Usar EXCLUSIVAMENTE en: src/proxy.ts
// NO usar en: Server Components, Client Components, Server Actions
//
// Sincroniza cookies de sesión, valida al usuario con getClaims()
// y redirige a /login si no hay sesión activa.
//
// CRÍTICO: No insertar código entre createServerClient y getClaims().
// Puede causar desconexiones aleatorias — bug difícil de depurar.
// ════════════════════════════════════════════════════════════════════════════

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Sincroniza las cookies de sesión de Supabase y aplica protección
 * de rutas privadas. Se ejecuta en Edge Runtime en cada request.
 *
 * Retorna supabaseResponse con las cookies actualizadas.
 *
 * IMPORTANTE: Siempre retornar supabaseResponse tal como está.
 * Si se necesita una response nueva, copiar las cookies:
 * const nueva = NextResponse.next({ request })
 * nueva.cookies.setAll(supabaseResponse.cookies.getAll())
 * Sin esto la sesión del usuario se rompe prematuramente.
 */
export async function updateSession(request: NextRequest) {
  // Response base — se recrea en setAll con las cookies actualizadas
  let supabaseResponse = NextResponse.next({ request })

  // CRÍTICO: No insertar código entre aquí y getClaims()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Lee las cookies de la request entrante
        getAll() {
          return request.cookies.getAll()
        },

        // Escribe cookies en la request Y en la response
        // CORRECCIÓN: La firma correcta en @supabase/ssr@0.6.1 solo recibe cookiesToSet
        setAll(cookiesToSet) {
          // Paso 1: propagar los tokens frescos a la request
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          // Paso 2: recrear la response con la request ya actualizada
          supabaseResponse = NextResponse.next({ request })

          // Paso 3: escribir las cookies con atributos de seguridad (HttpOnly, Secure, SameSite)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getClaims() valida el JWT localmente — sin petición HTTP, sin latencia de red.
  // NUNCA reemplazar por getSession() (inseguro) ni getUser() (lento en Edge)
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  // Redirigir a /login si no hay sesión en una ruta privada
  // /login y /auth/* son rutas públicas — pasan sin verificación
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Retornar siempre supabaseResponse — contiene las cookies actualizadas
  return supabaseResponse
}
'@

New-Item -Path "src/lib/supabase/proxy.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/supabase/proxy.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/supabase/proxy.ts corregido (Firma de TypeScript resuelta)" -ForegroundColor Green
```

---

## FINGERPRINT — VALIDACION PARTE 2

```powershell
Write-Host "`nValidando Parte 2 de la Guía 0.2..." -ForegroundColor Yellow

$checks = @(
  @{ Path = "src/lib/supabase/client.ts"; Pattern = "createBrowserClient"; Label = "client.ts — Browser Client" },
  @{ Path = "src/lib/supabase/server.ts"; Pattern = "getAll";              Label = "server.ts — API Batch" },
  @{ Path = "src/lib/supabase/proxy.ts";  Pattern = "getClaims";           Label = "proxy.ts — getClaims() en Edge" }
)

$allOk = $true
foreach ($c in $checks) {
  if (Test-Path $c.Path) {
    $cnt = Get-Content $c.Path -Raw
    if ($cnt -match $c.Pattern) {
      Write-Host "  ✅ $($c.Label)" -ForegroundColor Green
    } else {
      Write-Host "  ⚠️  $($c.Path) existe pero falta '$($c.Pattern)'" -ForegroundColor Yellow
      $allOk = $false
    }
  } else {
    Write-Host "  ❌ $($c.Path) NO existe — repetir el bloque correspondiente" -ForegroundColor Red
    $allOk = $false
  }
}

# Seguridad: ningún archivo del directorio supabase debe usar getSession()
$badUse = Select-String -Path "src/lib/supabase/*.ts" -Pattern "getSession" -Quiet
if ($badUse) {
  Write-Host "  ❌ SEGURIDAD: getSession() detectado — la regla ESLint lo bloqueará en build" -ForegroundColor Red
  $allOk = $false
} else {
  Write-Host "  ✅ Sin getSession() en ningún cliente Supabase" -ForegroundColor Green
}

# Verificar que middleware.ts no existe (nombre obsoleto — ahora es proxy.ts)
if (Test-Path "src/lib/supabase/middleware.ts") {
  Write-Host "  ⚠️  middleware.ts existe — fue renombrado a proxy.ts en la doc oficial" -ForegroundColor Yellow
  Write-Host "      Eliminar con: Remove-Item src/lib/supabase/middleware.ts" -ForegroundColor Yellow
  $allOk = $false
}

if ($allOk) {
  Write-Host "`n✅ PARTE 2 COMPLETADA — 3 clientes Supabase SSR listos" -ForegroundColor Green
} else {
  Write-Host "`n❌ PARTE 2 INCOMPLETA — corregir antes de continuar" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si `proxy.ts` usa `getSession()` o `getUser()` en lugar de `getClaims()`, la proteccion del Edge es incorrecta. Si `middleware.ts` aun existe en `src/lib/supabase/`, eliminarlo.

---

## RESUMEN DE ESTA PARTE

**3 archivos creados — version final permanente:**

| Archivo | Contexto | Validacion de sesion | Cuando usar |
|:--------|:---------|:--------------------|:------------|
| `src/lib/supabase/client.ts` | Browser | — (cookies automaticas del browser) | Client Components |
| `src/lib/supabase/server.ts` | Node.js Server | `getUser()` — peticion HTTP a Supabase Auth | Server Components, Server Actions |
| `src/lib/supabase/proxy.ts` | Edge Runtime | `getClaims()` — validacion JWT local sin red | Llamado desde `src/proxy.ts` |

**Nota para la Guia 0.5:** Estos 3 archivos ya son la implementacion final. La Guia 0.5 Parte 2 solo verificara que existen y creara `src/proxy.ts` — el interceptor Edge de Next.js que importa `updateSession` de `src/lib/supabase/proxy.ts`.

---

## ➡️ SIGUIENTE PARTE

**-> Parte 3** — Infraestructura de Validacion y Calculo

Se crean los schemas Zod con mensajes en espanol, las 5 funciones de calculo con Decimal.js (redondeo, descuentos, porcentajes) y las funciones de formateo para moneda, fechas y porcentajes con locale como parametro.

---

> **Documento:** GUIA_0_2_Parte2_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
