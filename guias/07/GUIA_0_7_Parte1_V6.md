# GUIA 0.7 — SEGURIDAD RBAC VIVO (FRONT-END)
## PARTE 1: DIAGNOSTICO DEL SISTEMA — PAGINA DE PRUEBAS

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 1 de 3
> **Prerequisito:** Guia 0.6 completada — `npm run build` exitoso, App Shell funcional
> **Prerequisito adicional (Guia 0.5):** `puedeVerPagina()`, `tienePermiso()`, `useAuth()` y `useAuthStoreBase` exportados del auth-store
> **Siguiente parte:** `GUIA_0_7_Parte2_V6.md` — Componentes de Seguridad (RBACGuard, ProtectedAction, sin-acceso)
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte construye el **centro de diagnostico del sistema** antes de activar cualquier guard. La razon del orden es estrategica: si los datos del auth-store estan mal — menu vacio, permisos faltantes, rol incorrecto — los guards de la Parte 2 se comportaran de forma erratico, redirigiran a todos o a nadie, y diagnosticar el problema sera extremadamente dificil sin visibilidad sobre el estado interno. Esta pagina convierte lo invisible en visible.

La pagina `/dashboard/pruebas` va mas alla del diagnostico RBAC puro: documenta toda la arquitectura construida en las Guias 0.1–0.6, muestra el sistema de diseno en vivo, y consulta la BD para mostrar datos reales. Es la unica pagina del ERP que habla de si misma.

- **Bloque 1 — Directorios y verificacion de prerequisitos:** Crea `src/app/dashboard/pruebas/` y `src/lib/actions/` (si no existe), y ejecuta un script de verificacion del auth-store. Si algun helper falta, no tiene sentido continuar.
- **Bloque 2 — `diagnostico.ts` (Server Action):** Server Action que consulta la BD real y retorna conteos de modulos, submodulos, roles, permisos y empresas. La Seccion 4 de la pagina lo consume.
- **Bloque 3 — `pruebas/page.tsx` (Pagina de Diagnostico):** Pagina `'use client'` con 5 secciones en scroll: Sesion RBAC Activa, Arquitectura del Sistema, Sistema de Diseno, Estado de Base de Datos, y Niveles de Seguridad.

> **Al terminar esta parte:** Login con Admin → `/dashboard/pruebas` muestra 5 secciones con datos reales. Si el menu esta vacio o los permisos no coinciden con los seeds de la Guia 0.4, se detecta aqui, no en un guard que silenciosamente redirige sin explicar por que.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — DIRECTORIOS Y VERIFICACION DE PREREQUISITOS

📄 **ACCION** — Crear Directorios + Verificar Prerequisitos

**Proposito:** Crear las carpetas necesarias y confirmar que los contratos del auth-store existen antes de escribir codigo que depende de ellos.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Estructura de directorios + Verificacion |
| Ejecuta en | Solo compilacion |
| Si lo modificas | Si los directorios faltan, los Bloques 2 y 3 fallan. Si los contratos no se verifican, los errores aparecen en runtime en vez de en el script |

### DECISIONES DE DISENO

**Por que verificar antes de crear?**
Si `puedeVerPagina()` no existe en el auth-store, la pagina de diagnostico compilara pero los helpers del Tester RBAC lanzaran errores en tiempo de ejecucion. El script hace fallar rapido y con mensajes claros.

```powershell
# ═══════════════════════════════════════════════════════════════
# BLOQUE 1 — CREAR DIRECTORIOS + VERIFICAR PREREQUISITOS
# ═══════════════════════════════════════════════════════════════

# 1. Crear directorios
New-Item -ItemType Directory -Force -Path "src/app/dashboard/pruebas" | Out-Null
Write-Host "✅ src/app/dashboard/pruebas/ creado" -ForegroundColor Green

# Si lib/actions ya existe de guías anteriores, no falla — -Force es idempotente
New-Item -ItemType Directory -Force -Path "src/lib/actions" | Out-Null
Write-Host "✅ src/lib/actions/ verificado/creado" -ForegroundColor Green

# 2. Verificar contratos del auth-store
Write-Host "`nVerificando contratos del auth-store..." -ForegroundColor Yellow

$authStorePath = "src/lib/stores/auth-store.ts"
if (-not (Test-Path $authStorePath)) {
    Write-Host "❌ auth-store.ts NO ENCONTRADO en $authStorePath" -ForegroundColor Red
    Write-Host "   Verificar que la Guía 0.5 se completó correctamente." -ForegroundColor Red
    exit 1
}

$authStore = Get-Content $authStorePath -Raw

$checks = @(
    @{ Pattern = "puedeVerPagina";       Label = "Helper puedeVerPagina(href)" },
    @{ Pattern = "tienePermiso";          Label = "Helper tienePermiso(href, accion)" },
    @{ Pattern = "export.*useAuth";       Label = "Hook seguro useAuth(selector)" },
    @{ Pattern = "useAuthStoreBase";      Label = "Store base useAuthStoreBase (para RBACGuard)" },
    @{ Pattern = "useSyncExternalStore";  Label = "Patrón hydration-safe SSR" },
    @{ Pattern = "erp-auth-storage";      Label = "Key de persistencia localStorage" },
    @{ Pattern = "setAuth";              Label = "Acción setAuth(usuario, menu, permisos)" }
)

$allOk = $true
foreach ($check in $checks) {
    if ($authStore -match $check.Pattern) {
        Write-Host "  ✅ $($check.Label)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($check.Label) — NO ENCONTRADO" -ForegroundColor Red
        $allOk = $false
    }
}

# 3. Verificar tipos de shell
Write-Host "`nVerificando tipos de shell..." -ForegroundColor Yellow
$shellTypes = Get-Content "src/types/shell.ts" -Raw -ErrorAction SilentlyContinue
if ($shellTypes -match "AccionBasica") {
    Write-Host "  ✅ Tipo AccionBasica en shell.ts" -ForegroundColor Green
} else {
    Write-Host "  ❌ AccionBasica NO encontrado en shell.ts" -ForegroundColor Red
    $allOk = $false
}

# 4. Verificar tipos de auth
$authTypes = Get-Content "src/types/auth.ts" -Raw -ErrorAction SilentlyContinue
if ($authTypes -match "MenuModulo") {
    Write-Host "  ✅ Tipo MenuModulo en auth.ts" -ForegroundColor Green
} else {
    Write-Host "  ❌ MenuModulo NO encontrado en auth.ts" -ForegroundColor Red
    $allOk = $false
}

# 5. Veredicto
Write-Host ""
if ($allOk) {
    Write-Host "✅ PREREQUISITOS COMPLETOS — Listo para Bloque 2" -ForegroundColor Green
} else {
    Write-Host "❌ PREREQUISITOS INCOMPLETOS — Volver a la Guía 0.5 y corregir antes de continuar" -ForegroundColor Red
}
```

---

## BLOQUE 2 — SERVER ACTION DE DIAGNOSTICO

📄 **ARCHIVO COMPLETO** — `src/lib/actions/diagnostico.ts`

**Proposito:** Server Action que consulta la BD y retorna conteos reales del sistema. Lo consume la Seccion 4 de la pagina de diagnostico para mostrar el estado actual de la base de datos.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Server Action |
| Ejecuta en | Servidor Node.js (`'use server'` en linea 1) |
| Importado por | `pruebas/page.tsx` (Parte 1) |
| Importa de | `@/lib/supabase/server` |
| Contrato | Exporta `diagnosticarSistema()` (funcion) y `DiagnosticoSistema` (interface) |
| Si lo modificas | La seccion "Estado de BD" de la pagina de pruebas deja de funcionar |

### DECISIONES DE DISENO

**Por que un Server Action separado y no una query directa en la pagina?**
La pagina de diagnostico es un Client Component — necesita `useState` para el Tester RBAC interactivo. Los Client Components no pueden ejecutar queries de Supabase directamente (el cliente del servidor `createClient()` solo funciona en Server Components y Server Actions). El Server Action actua como el puente: se llama desde el cliente con `await diagnosticarSistema()`, ejecuta en el servidor, y retorna datos serializables.

**Por que `SECURITY DEFINER` no aplica aqui?**
El Server Action llama con el cliente del servidor que usa `getUser()` — opera bajo la sesion del usuario autenticado. La RLS de Supabase aplica normalmente. Solo el administrador y gerente podran ver datos de su empresa — no existe riesgo de filtracion entre tenants.

```powershell
$useServer = "'use server'"
$rest = @'

// ════════════════════════════════════════════════════════════════════════════
// SERVER ACTION — DIAGNÓSTICO DEL SISTEMA
//
// Consulta la BD y retorna conteos reales para la página de pruebas.
// Solo se usa en /dashboard/pruebas — no tiene relevancia operativa.
//
// Guía 0.7 — Parte 1, Bloque 2
// ════════════════════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface DiagnosticoSistema {
    // Catálogos globales (sin id_empresa)
    totalModulos: number
    totalSubmodulos: number
    totalAcciones: number
    totalPlanesActivos: number

    // Datos de la empresa activa del usuario
    totalRoles: number
    totalUsuariosActivos: number
    totalPermisosNavegacion: number
    totalPermisosAcciones: number

    // Meta
    empresaNombre: string | null
    planActual: string | null
    fechaConsulta: string
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Consulta la BD y retorna métricas del sistema para la página de diagnóstico.
 * Opera bajo la sesión del usuario autenticado — la RLS aplica normalmente.
 */
export async function diagnosticarSistema(): Promise<{
    success: true
    data: DiagnosticoSistema
} | {
    success: false
    error: string
}> {
    try {
        const supabase = await createClient()

        // Verificar sesión
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'No hay sesión activa' }
        }

        // ── Catálogos globales ───────────────────────────────────────────
        const [
            { count: totalModulos },
            { count: totalSubmodulos },
            { count: totalAcciones },
            { count: totalPlanesActivos },
        ] = await Promise.all([
            supabase.from('modulos').select('*', { count: 'exact', head: true }).eq('es_activo', true),
            supabase.from('submodulos').select('*', { count: 'exact', head: true }).eq('es_activo', true),
            supabase.from('acciones').select('*', { count: 'exact', head: true }),
            supabase.from('planes_suscripcion').select('*', { count: 'exact', head: true }),
        ])

        // ── Datos de la empresa del usuario (RLS filtra automáticamente) ─
        const [
            { count: totalRoles },
            { count: totalUsuariosActivos },
            { count: totalPermisosNavegacion },
            { count: totalPermisosAcciones },
        ] = await Promise.all([
            supabase.from('roles').select('*', { count: 'exact', head: true }),
            supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('es_activo', true),
            supabase.from('permisos_navegacion').select('*', { count: 'exact', head: true }),
            supabase.from('permisos_acciones').select('*', { count: 'exact', head: true }),
        ])

        // ── Datos de la empresa ──────────────────────────────────────────
        // Se hacen queries separadas en lugar de un JOIN anidado porque
        // Supabase infiere la relación !inner como array — el cast a objeto
        // singular viola TypeScript strict (TS2352).

        // Paso 1: id_empresa del usuario
        const { data: usuarioRow } = await supabase
            .from('usuarios')
            .select('id_empresa')
            .eq('id', user.id)
            .single()

        let empresaNombre: string | null = null
        let planActual: string | null = null

        // Paso 2: nombre de empresa y referencia al plan
        if (usuarioRow?.id_empresa) {
            const { data: empresaRow } = await supabase
                .from('empresas')
                .select('nombre, id_plan')
                .eq('id', usuarioRow.id_empresa)
                .single()

            empresaNombre = empresaRow?.nombre ?? null

            // Paso 3: nombre del plan
            if (empresaRow?.id_plan) {
                const { data: planRow } = await supabase
                    .from('planes_suscripcion')
                    .select('nombre')
                    .eq('id', empresaRow.id_plan)
                    .single()

                planActual = planRow?.nombre ?? null
            }
        }

        return {
            success: true,
            data: {
                totalModulos: totalModulos ?? 0,
                totalSubmodulos: totalSubmodulos ?? 0,
                totalAcciones: totalAcciones ?? 0,
                totalPlanesActivos: totalPlanesActivos ?? 0,
                totalRoles: totalRoles ?? 0,
                totalUsuariosActivos: totalUsuariosActivos ?? 0,
                totalPermisosNavegacion: totalPermisosNavegacion ?? 0,
                totalPermisosAcciones: totalPermisosAcciones ?? 0,
                empresaNombre,
                planActual,
                fechaConsulta: new Date().toISOString(),
            },
        }
    } catch (error) {
        // Fallback silencioso — un error en el diagnóstico no debe romper la página
        const mensaje = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: mensaje }
    }
}
'@

$content = $useServer + $rest
New-Item -Path "src/lib/actions/diagnostico.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/actions/diagnostico.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/actions/diagnostico.ts creado" -ForegroundColor Green
Write-Host "🗄️  Catálogos globales consultados en paralelo con Promise.all()" -ForegroundColor Cyan
Write-Host "🔒 RLS aplica normalmente — cada usuario ve solo datos de su empresa" -ForegroundColor Cyan
Write-Host "🔧 Queries separadas para empresa/plan — evita TS2352 con JOINs anidados" -ForegroundColor Cyan
```

---

## BLOQUE 3 — PAGINA DE DIAGNOSTICO DEL SISTEMA

📄 **ARCHIVO COMPLETO** — `src/app/dashboard/pruebas/page.tsx`

**Proposito:** Pagina con 5 secciones que documentan y diagnostican todo el sistema construido en las Guias 0.1–0.7. Es la unica pagina del ERP que habla de si misma.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Client) |
| Ejecuta en | Browser |
| Importa de | `react`, `@/lib/stores/auth-store`, `@/hooks/usePageConfig`, `@/lib/utils`, `@/components/ui/button`, `@/lib/actions/diagnostico`, `@/types/auth`, `lucide-react` |
| Si lo modificas | Solo afecta la pagina de diagnostico. Herramienta de desarrollo — su presencia no afecta performance |

### DECISIONES DE DISENO

**Por que 5 secciones y no solo RBAC?**
El RBAC es invisible — si funciona, no se nota. Esta pagina hace visible no solo el estado del store, sino tambien la arquitectura que lo sostiene (capas de seguridad, stack tecnologico, sistema de diseno). Es una herramienta de onboarding para nuevos desarrolladores y de debugging para cualquier rol tecnico.

**Por que `useEffect` para cargar datos de BD?**
`diagnosticarSistema()` es un Server Action. Los Server Actions se llaman desde el cliente con `await`. Se usa `useEffect` + `useState` para disparar la llamada despues del mount y manejar el estado de carga. No se usa Suspense porque los datos de BD son complementarios — la pagina es util incluso si la seccion de BD falla.

**Por que los datos de arquitectura estan hardcodeados y no vienen de la BD?**
El stack tecnologico, las capas de seguridad y la descripcion del flujo de login son hechos estaticos del proyecto — no cambian entre sesiones. Consultarlos en la BD seria un anti-patron. Solo los datos que SI cambian (conteos de tablas, roles, empresas) vienen de la BD.

```powershell
$content = @'
/**
 * Página de Diagnóstico del Sistema — /dashboard/pruebas
 *
 * Centro de visibilidad del sistema. 5 secciones:
 *   1. Sesión RBAC Activa — datos del auth-store en tiempo real
 *   2. Arquitectura del Sistema — stack, flujo de login, 3 clientes Supabase
 *   3. Sistema de Diseño — paleta semántica, variantes Button, tipografía
 *   4. Estado de Base de Datos — conteos reales via Server Action
 *   5. Niveles de Seguridad — las 5 capas del ERP documentadas
 *
 * Herramienta de desarrollo — permanece hasta que se decida retirarla.
 * Guía 0.7 — Parte 1, Bloque 3
 */

'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '@/lib/stores/auth-store'
import { usePageConfig } from '@/hooks/usePageConfig'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { diagnosticarSistema } from '@/lib/actions/diagnostico'
import type { DiagnosticoSistema } from '@/lib/actions/diagnostico'
import type { MenuModulo } from '@/types/auth'
import {
    Bug,
    User,
    LayoutDashboard,
    Shield,
    FlaskConical,
    Database,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronRight,
    Layers,
    Globe,
    Lock,
    Server,
    Cpu,
    Palette,
    RefreshCw,
    AlertTriangle,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES DE ARQUITECTURA (datos estáticos — no vienen de BD)
// ═══════════════════════════════════════════════════════════════════════════

/** Las 5 acciones del sistema RBAC */
const ACCIONES = ['ver', 'crear', 'editar', 'eliminar', 'exportar'] as const

/** Stack tecnológico — versiones pineadas del proyecto */
const STACK = [
    { categoria: 'Framework', items: [
        { nombre: 'Next.js', version: '16.2.3', descripcion: 'App Router, Server Components, Server Actions' },
        { nombre: 'React', version: '19.x', descripcion: 'UI library — incluida por Next.js 16' },
        { nombre: 'TypeScript', version: 'strict mode', descripcion: '6 reglas adicionales para apps de negocio' },
    ]},
    { categoria: 'Estilos', items: [
        { nombre: 'Tailwind CSS', version: '3.4.19', descripcion: 'Sistema de 3 capas semántico — sin colores fijos' },
        { nombre: 'shadcn/ui', version: '2.5.0 CLI', descripcion: 'Componentes como archivos locales — no paquete npm' },
        { nombre: 'next-themes', version: '0.4.6', descripcion: 'Dark/Light con persistencia localStorage + BD' },
    ]},
    { categoria: 'Backend', items: [
        { nombre: 'Supabase', version: '2.50.0', descripcion: 'Auth, Postgres, Storage, Realtime' },
        { nombre: '@supabase/ssr', version: '0.6.1', descripcion: '3 clientes SSR — browser, server, edge' },
        { nombre: 'Zustand', version: '5.0.3', descripcion: 'State management con persistencia selectiva' },
    ]},
    { categoria: 'Formularios', items: [
        { nombre: 'React Hook Form', version: '7.54.2', descripcion: 'Sin re-renders innecesarios' },
        { nombre: 'Zod', version: '3.24.2', descripcion: 'Validación con inferencia TypeScript' },
        { nombre: 'Decimal.js', version: '10.5.0', descripcion: 'Aritmética de precisión 20 — IVA/IEPS sin errores' },
    ]},
]

/** Clientes Supabase — explicación de los 3 contextos */
const CLIENTES_SUPABASE = [
    {
        nombre: 'client.ts',
        contexto: 'Browser',
        cuando: "Client Components ('use client')",
        cookies: 'document.cookie — el navegador las adjunta automáticamente',
        color: 'blue',
    },
    {
        nombre: 'server.ts',
        contexto: 'Server',
        cuando: 'Server Components, Server Actions, Route Handlers',
        cookies: 'cookies() de Next.js — API asíncrona de la request entrante',
        color: 'emerald',
    },
    {
        nombre: 'proxy.ts (supabase)',
        contexto: 'Edge',
        cuando: 'Llamado desde src/proxy.ts en cada request',
        cookies: 'request.cookies + response.cookies — lectura y escritura atómica',
        color: 'violet',
    },
]

/** Capas de seguridad del ERP */
const CAPAS_SEGURIDAD = [
    {
        numero: 1,
        nombre: 'Edge Proxy (proxy.ts)',
        pregunta: '¿Hay sesión?',
        mecanismo: 'getClaims() — valida JWT criptográficamente sin red',
        detiene: 'Usuarios sin sesión activa',
        noDetiene: 'Usuarios con sesión válida pero sin permiso para la ruta',
        guia: '0.5',
        color: 'violet',
    },
    {
        numero: 2,
        nombre: 'Server Layout (dashboard/layout.tsx)',
        pregunta: '¿La sesión es válida en el servidor?',
        mecanismo: 'getUser() — verifica JWT contra Supabase Auth Server',
        detiene: 'Sesiones inválidas o expiradas',
        noDetiene: 'Usuarios con sesión válida sin permiso para rutas específicas',
        guia: '0.6',
        color: 'blue',
    },
    {
        numero: 3,
        nombre: 'RBACGuard (Client Component)',
        pregunta: '¿Tiene permiso para esta ruta?',
        mecanismo: 'puedeVerPagina(pathname) — busca href en menu[] del auth-store',
        detiene: 'Usuarios con sesión válida pero sin el submódulo en su menú',
        noDetiene: 'Acceso a micro-elementos de UI dentro de páginas permitidas',
        guia: '0.7',
        color: 'amber',
    },
    {
        numero: 4,
        nombre: 'Toolbar + ProtectedAction (UI)',
        pregunta: '¿Puede ejecutar esta acción?',
        mecanismo: 'tienePermiso(pathname, accion) — busca en permisos[] del auth-store',
        detiene: 'Botones y elementos de UI sin permiso de acción',
        noDetiene: 'Queries maliciosas directas a la BD (eso es RLS)',
        guia: '0.7',
        color: 'orange',
    },
    {
        numero: 5,
        nombre: 'RLS PostgreSQL (Base de Datos)',
        pregunta: '¿Puede ver esta fila?',
        mecanismo: 'id_empresa = obtener_empresa_usuario() — en cada query automáticamente',
        detiene: 'Queries directas a la BD aunque se bypasee el frontend',
        noDetiene: '— (última línea de defensa)',
        guia: '0.3/0.4',
        color: 'red',
    },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function PruebasPage() {
    usePageConfig({
        info: { title: 'Diagnóstico del Sistema', subtitle: 'Estado completo del ERP Global — Herramienta de desarrollo' },
        path: '/dashboard/pruebas',
    })

    // ── Auth store ───────────────────────────────────────────────────────
    const usuario = useAuth(s => s.usuario)
    const menu = useAuth(s => s.menu)
    const permisos = useAuth(s => s.permisos)
    const isAuthenticated = useAuth(s => s.isAuthenticated)
    const isLoading = useAuth(s => s.isLoading)
    const puedeVerPagina = useAuth(s => s.puedeVerPagina)
    const tienePermiso = useAuth(s => s.tienePermiso)

    // ── Estado del tester RBAC ───────────────────────────────────────────
    const [testHref, setTestHref] = useState('/dashboard/sistema/usuarios')
    const [testAccion, setTestAccion] = useState('ver')
    const [testResults, setTestResults] = useState<{
        puedeVer: boolean | null
        tienePerm: boolean | null
    }>({ puedeVer: null, tienePerm: null })

    // ── Estado de BD ─────────────────────────────────────────────────────
    const [bdData, setBdData] = useState<DiagnosticoSistema | null>(null)
    const [bdLoading, setBdLoading] = useState(true)
    const [bdError, setBdError] = useState<string | null>(null)

    // Cargar datos de BD al montar — no bloquea el render de las demás secciones
    useEffect(() => {
        let cancelled = false
        async function cargarBD() {
            setBdLoading(true)
            const result = await diagnosticarSistema()
            if (cancelled) return
            if (result.success) {
                setBdData(result.data)
            } else {
                setBdError(result.error)
            }
            setBdLoading(false)
        }
        cargarBD()
        return () => { cancelled = true }
    }, [])

    // ── Matriz de permisos ───────────────────────────────────────────────
    // Precalculada con useMemo — no recalcular en cada render
    const matrizPermisos = useMemo(() => {
        if (!menu || !permisos) return []
        const resultado: {
            modulo: string
            submodulo: string
            href: string
            acciones: Record<string, boolean>
        }[] = []

        for (const modulo of menu) {
            for (const sub of modulo.submodulos) {
                const accionesMap: Record<string, boolean> = {}
                for (const accion of ACCIONES) {
                    accionesMap[accion] = permisos.some(
                        (p) => p.id_submodulo === sub.id && p.clave_accion === accion
                    )
                }
                resultado.push({
                    modulo: modulo.nombre,
                    submodulo: sub.nombre,
                    href: sub.href,
                    acciones: accionesMap,
                })
            }
        }
        return resultado
    }, [menu, permisos])

    function ejecutarTest() {
        setTestResults({
            puedeVer: puedeVerPagina(testHref),
            tienePerm: tienePermiso(testHref, testAccion),
        })
    }

    // ── Guards de carga ───────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-muted-foreground font-medium">
                    Cargando datos de sesión...
                </div>
            </div>
        )
    }

    if (!isAuthenticated || !usuario) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No hay sesión activa.</p>
            </div>
        )
    }

    // ── Render principal ──────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <div className={cn(
                    'flex items-center justify-center h-10 w-10 rounded-lg',
                    'bg-amber-500/10 text-amber-500'
                )}>
                    <Bug className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Diagnóstico del Sistema</h2>
                    <p className="text-sm text-muted-foreground">
                        ERP Global — Plataforma SaaS Multiempresa · Herramienta de desarrollo
                    </p>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                SECCIÓN 1 — SESIÓN RBAC ACTIVA
            ══════════════════════════════════════════════════════════════════ */}
            <SeccionCard
                icono={<User className="h-4 w-4" />}
                titulo="Sesión RBAC Activa"
                subtitulo="Datos del auth-store en tiempo real"
                color="blue"
            >
                {/* Datos del usuario */}
                <SubSeccion titulo="Datos del Usuario">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <DatoItem label="Nombre" value={usuario.nombre} />
                        <DatoItem label="Email" value={usuario.email} />
                        <DatoItem label="ID" value={usuario.id} mono />
                        <DatoItem label="Rol" value={`${usuario.rol?.nombre ?? '—'} (Nivel ${usuario.rol?.nivel ?? '?'})`} />
                        <DatoItem label="Empresa" value={usuario.empresa?.nombre ?? '—'} />
                        <DatoItem label="Tema activo" value={usuario.preferencias?.tema ?? 'system'} />
                    </div>
                </SubSeccion>

                {/* Menú */}
                <SubSeccion titulo={`Menú del Usuario (${menu.length} módulo${menu.length !== 1 ? 's' : ''})`}>
                    {menu.length === 0 ? (
                        <p className="text-sm text-red-500 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            El menú está vacío. Verificar obtener_sesion_completa() y permisos_navegacion en la BD.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {menu.map((modulo) => (
                                <ModuloCard key={modulo.id} modulo={modulo} />
                            ))}
                        </div>
                    )}
                </SubSeccion>

                {/* Matriz de permisos */}
                <SubSeccion titulo={`Matriz de Permisos (${permisos.length} registros)`}>
                    {matrizPermisos.length === 0 ? (
                        <p className="text-sm text-red-500 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Sin permisos. Verificar permisos_acciones en la BD (seeds Guía 0.4).
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-md border border-border">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border">
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Módulo</th>
                                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Submódulo</th>
                                        {ACCIONES.map(a => (
                                            <th key={a} className="text-center px-2 py-2 font-medium text-muted-foreground capitalize">{a}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {matrizPermisos.map((row, i) => (
                                        <tr key={row.href} className={cn('border-b border-border/50', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                                            <td className="px-3 py-1.5 text-muted-foreground">{row.modulo}</td>
                                            <td className="px-3 py-1.5 text-foreground">{row.submodulo}</td>
                                            {ACCIONES.map(a => (
                                                <td key={a} className="text-center px-2 py-1.5">
                                                    {row.acciones[a]
                                                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                                                        : <XCircle className="h-3.5 w-3.5 text-red-400/50 mx-auto" />
                                                    }
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SubSeccion>

                {/* Tester RBAC interactivo */}
                <SubSeccion titulo="Tester RBAC Interactivo">
                    <p className="text-xs text-muted-foreground mb-3">
                        Prueba los helpers del auth-store en tiempo real. Útil para verificar permisos antes de conectar los guards.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                        <input
                            type="text"
                            value={testHref}
                            onChange={(e) => setTestHref(e.target.value)}
                            placeholder="/dashboard/sistema/usuarios"
                            className={cn(
                                'flex-1 px-3 py-1.5 text-sm rounded-md',
                                'border border-border bg-background text-foreground',
                                'focus:outline-none focus:ring-1 focus:ring-primary-accent',
                                'font-mono'
                            )}
                        />
                        <input
                            type="text"
                            value={testAccion}
                            onChange={(e) => setTestAccion(e.target.value)}
                            placeholder="ver / crear / editar..."
                            className={cn(
                                'w-full sm:w-36 px-3 py-1.5 text-sm rounded-md',
                                'border border-border bg-background text-foreground',
                                'focus:outline-none focus:ring-1 focus:ring-primary-accent',
                                'font-mono'
                            )}
                        />
                        <Button size="sm" onClick={ejecutarTest}>
                            <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
                            Probar
                        </Button>
                    </div>
                    {/* Resultados del tester — se muestran tras presionar Probar */}
                    {(testResults.puedeVer !== null || testResults.tienePerm !== null) && (
                        <div className="space-y-2 p-3 rounded-md bg-muted/30 border border-border/50">
                            <div className="flex items-center gap-2 text-sm">
                                <code className="text-muted-foreground flex-1 font-mono text-xs">
                                    puedeVerPagina({'\''}{testHref}{'\''})
                                </code>
                                <span className="ml-auto">→</span>
                                <ResultBadge value={testResults.puedeVer} />
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <code className="text-muted-foreground flex-1 font-mono text-xs">
                                    tienePermiso({'\''}{testHref}{'\''}, {'\''}{testAccion}{'\''})
                                </code>
                                <span className="ml-auto">→</span>
                                <ResultBadge value={testResults.tienePerm} />
                            </div>
                        </div>
                    )}
                </SubSeccion>
            </SeccionCard>

            {/* ══════════════════════════════════════════════════════════════════
                SECCIÓN 2 — ARQUITECTURA DEL SISTEMA
            ══════════════════════════════════════════════════════════════════ */}
            <SeccionCard
                icono={<Layers className="h-4 w-4" />}
                titulo="Arquitectura del Sistema"
                subtitulo="Stack tecnológico, 3 clientes Supabase y flujo de autenticación"
                color="violet"
            >
                {/* Stack tecnológico */}
                <SubSeccion titulo="Stack Tecnológico — Versiones Pineadas">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {STACK.map((grupo) => (
                            <div key={grupo.categoria}>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                    {grupo.categoria}
                                </p>
                                <div className="space-y-1">
                                    {grupo.items.map((item) => (
                                        <div key={item.nombre} className="flex items-start gap-2 p-2 rounded-md bg-muted/20 border border-border/30">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-medium text-foreground">{item.nombre}</span>
                                                    <code className="text-xs text-primary-accent font-mono">{item.version}</code>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{item.descripcion}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </SubSeccion>

                {/* 3 clientes Supabase */}
                <SubSeccion titulo="Los 3 Clientes Supabase — Un Cliente por Contexto">
                    <p className="text-xs text-muted-foreground mb-3">
                        Next.js App Router ejecuta código en 3 entornos con mecanismos de cookies completamente diferentes.
                        Un solo cliente no puede cubrir los 3.
                    </p>
                    <div className="space-y-2">
                        {CLIENTES_SUPABASE.map((cliente) => (
                            <div key={cliente.nombre} className={cn(
                                'p-3 rounded-md border',
                                cliente.color === 'blue' && 'bg-blue-500/5 border-blue-500/20',
                                cliente.color === 'emerald' && 'bg-emerald-500/5 border-emerald-500/20',
                                cliente.color === 'violet' && 'bg-violet-500/5 border-violet-500/20',
                            )}>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <code className={cn(
                                        'text-sm font-mono font-medium',
                                        cliente.color === 'blue' && 'text-blue-500',
                                        cliente.color === 'emerald' && 'text-emerald-500',
                                        cliente.color === 'violet' && 'text-violet-500',
                                    )}>{cliente.nombre}</code>
                                    <span className="text-xs text-muted-foreground">— {cliente.contexto}</span>
                                </div>
                                <p className="text-xs text-foreground mb-1"><strong>Cuándo:</strong> {cliente.cuando}</p>
                                <p className="text-xs text-muted-foreground"><strong>Cookies:</strong> {cliente.cookies}</p>
                            </div>
                        ))}
                    </div>
                </SubSeccion>

                {/* Flujo de login */}
                <SubSeccion titulo="Flujo Completo: Login → Sesión → Shell">
                    <div className="font-mono text-xs bg-muted/30 rounded-md p-4 border border-border/50 space-y-1 text-muted-foreground leading-relaxed">
                        <p className="text-foreground font-medium mb-2">Usuario ingresa email + contraseña</p>
                        <p>  └─▶ supabase.auth.signInWithPassword()</p>
                        <p>         └─▶ Supabase Auth Server valida credenciales</p>
                        <p>                └─▶ JWT generado + cookies de sesión</p>
                        <p className="text-foreground font-medium mt-2 mb-1">LoginForm.tsx llama Server Action login()</p>
                        <p>  └─▶ obtener_sesion_completa() RPC</p>
                        <p>         ├─▶ usuario: {'{'} id, nombre, email, rol, preferencias {'}'}</p>
                        <p>         ├─▶ menu: MenuModulo[] (filtrado por rol + plan)</p>
                        <p>         └─▶ permisos: Permiso[] (filtrado por rol)</p>
                        <p className="text-foreground font-medium mt-2 mb-1">auth-store.setAuth(usuario, menu, permisos)</p>
                        <p>  ├─▶ puedeVerPagina() derivado de menu[]</p>
                        <p>  └─▶ tienePermiso() derivado de permisos[]</p>
                        <p className="text-foreground font-medium mt-2 mb-1">redirect(&apos;/dashboard&apos;)</p>
                        <p>  ├─▶ Edge Proxy: getClaims() valida JWT</p>
                        <p>  ├─▶ layout.tsx: getUser() verifica contra servidor</p>
                        <p>  ├─▶ RBACGuard: puedeVerPagina(&apos;/dashboard&apos;) → true</p>
                        <p>  └─▶ Shell renderiza con datos del auth-store</p>
                    </div>
                </SubSeccion>
            </SeccionCard>

            {/* ══════════════════════════════════════════════════════════════════
                SECCIÓN 3 — SISTEMA DE DISEÑO
            ══════════════════════════════════════════════════════════════════ */}
            <SeccionCard
                icono={<Palette className="h-4 w-4" />}
                titulo="Sistema de Diseño"
                subtitulo="Paleta semántica activa, variantes de Button y tipografía"
                color="amber"
            >
                {/* Paleta de colores semánticos */}
                <SubSeccion titulo="Paleta Semántica — Variables CSS Activas">
                    <p className="text-xs text-muted-foreground mb-3">
                        Los componentes usan clases semánticas, nunca colores fijos. El sistema de temas cambia los valores
                        HSL manteniendo las mismas clases.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {[
                            { clase: 'bg-background', label: 'background', texto: 'text-foreground' },
                            { clase: 'bg-card', label: 'card', texto: 'text-card-foreground' },
                            { clase: 'bg-muted', label: 'muted', texto: 'text-muted-foreground' },
                            { clase: 'bg-primary-accent', label: 'primary-accent', texto: 'text-primary-accent-text' },
                            { clase: 'bg-sidebar-bg', label: 'sidebar-bg', texto: 'text-sidebar-text' },
                            { clase: 'bg-hover-bg', label: 'hover-bg', texto: 'text-foreground' },
                            { clase: 'bg-border', label: 'border', texto: 'text-foreground' },
                            { clase: 'bg-destructive', label: 'destructive', texto: 'text-destructive-foreground' },
                        ].map((color) => (
                            <div key={color.label} className={cn(
                                'rounded-md p-2.5 border border-border/30',
                                color.clase
                            )}>
                                <p className={cn('text-xs font-mono font-medium', color.texto)}>
                                    {color.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </SubSeccion>

                {/* Variantes del Button */}
                <SubSeccion titulo="Variantes del Button (shadcn/ui)">
                    <div className="flex flex-wrap gap-2 items-center">
                        <Button variant="default" size="sm">default</Button>
                        <Button variant="outline" size="sm">outline</Button>
                        <Button variant="ghost" size="sm">ghost</Button>
                        <Button variant="secondary" size="sm">secondary</Button>
                        <Button variant="destructive" size="sm">destructive</Button>
                        <Button variant="link" size="sm">link</Button>
                        <Button variant="default" size="sm" disabled>disabled</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mt-2">
                        <Button variant="default" size="lg">size lg</Button>
                        <Button variant="default" size="default">size default</Button>
                        <Button variant="default" size="sm">size sm</Button>
                        <Button variant="default" size="icon"><Cpu className="h-4 w-4" /></Button>
                    </div>
                </SubSeccion>

                {/* Tipografía */}
                <SubSeccion titulo="Tipografía del Sistema">
                    <div className="space-y-2">
                        <p className="text-2xl font-bold text-foreground">Título H1 — 2xl bold</p>
                        <p className="text-xl font-semibold text-foreground">Título H2 — xl semibold</p>
                        <p className="text-lg font-medium text-foreground">Título H3 — lg medium</p>
                        <p className="text-base text-foreground">Cuerpo de texto — base regular</p>
                        <p className="text-sm text-muted-foreground">Texto secundario — sm muted-foreground</p>
                        <p className="text-xs text-muted-foreground">Etiqueta pequeña — xs muted-foreground</p>
                        <code className="text-xs font-mono text-primary-accent bg-muted/50 px-1.5 py-0.5 rounded">
                            código inline — font-mono primary-accent
                        </code>
                    </div>
                </SubSeccion>
            </SeccionCard>

            {/* ══════════════════════════════════════════════════════════════════
                SECCIÓN 4 — ESTADO DE BASE DE DATOS
            ══════════════════════════════════════════════════════════════════ */}
            <SeccionCard
                icono={<Database className="h-4 w-4" />}
                titulo="Estado de Base de Datos"
                subtitulo="Conteos reales de la BD — datos de la empresa activa"
                color="emerald"
            >
                {bdLoading ? (
                    <div className="flex items-center gap-2 py-4 text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Consultando base de datos...</span>
                    </div>
                ) : bdError ? (
                    <div className="flex items-center gap-2 py-4 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">Error al consultar BD: {bdError}</span>
                    </div>
                ) : bdData ? (
                    <div className="space-y-4">
                        {/* Info de empresa */}
                        <div className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border border-border/50">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-foreground">{bdData.empresaNombre ?? 'Empresa no encontrada'}</p>
                                <p className="text-xs text-muted-foreground">Plan: {bdData.planActual ?? '—'}</p>
                            </div>
                        </div>

                        {/* Catálogos globales */}
                        <SubSeccion titulo="Catálogos Globales (toda la plataforma)">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <ConteoCard label="Módulos activos" valor={bdData.totalModulos} color="violet" />
                                <ConteoCard label="Submódulos activos" valor={bdData.totalSubmodulos} color="violet" />
                                <ConteoCard label="Acciones RBAC" valor={bdData.totalAcciones} color="violet" />
                                <ConteoCard label="Planes de suscripción" valor={bdData.totalPlanesActivos} color="violet" />
                            </div>
                        </SubSeccion>

                        {/* Datos de la empresa */}
                        <SubSeccion titulo="Datos de la Empresa Activa">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <ConteoCard label="Roles" valor={bdData.totalRoles} color="blue" />
                                <ConteoCard label="Usuarios activos" valor={bdData.totalUsuariosActivos} color="blue" />
                                <ConteoCard label="Permisos navegación" valor={bdData.totalPermisosNavegacion} color="emerald" />
                                <ConteoCard label="Permisos acciones" valor={bdData.totalPermisosAcciones} color="emerald" />
                            </div>
                        </SubSeccion>

                        <p className="text-xs text-muted-foreground">
                            Consultado: {new Date(bdData.fechaConsulta).toLocaleString('es-MX')}
                        </p>
                    </div>
                ) : null}
            </SeccionCard>

            {/* ══════════════════════════════════════════════════════════════════
                SECCIÓN 5 — NIVELES DE SEGURIDAD
            ══════════════════════════════════════════════════════════════════ */}
            <SeccionCard
                icono={<Shield className="h-4 w-4" />}
                titulo="Niveles de Seguridad"
                subtitulo="Las 5 capas de defensa del ERP — qué detiene cada una"
                color="red"
            >
                <p className="text-xs text-muted-foreground mb-4">
                    El ERP aplica seguridad en 5 capas independientes. Si una falla, las demás siguen protegiendo.
                    Ninguna capa asume que la anterior funcionó correctamente.
                </p>
                <div className="space-y-3">
                    {CAPAS_SEGURIDAD.map((capa) => (
                        <div key={capa.numero} className={cn(
                            'p-3 rounded-md border',
                            capa.color === 'violet' && 'bg-violet-500/5 border-violet-500/20',
                            capa.color === 'blue' && 'bg-blue-500/5 border-blue-500/20',
                            capa.color === 'amber' && 'bg-amber-500/5 border-amber-500/20',
                            capa.color === 'orange' && 'bg-orange-500/5 border-orange-500/20',
                            capa.color === 'red' && 'bg-red-500/5 border-red-500/20',
                        )}>
                            <div className="flex items-start gap-3">
                                <div className={cn(
                                    'flex-none flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold',
                                    capa.color === 'violet' && 'bg-violet-500/20 text-violet-500',
                                    capa.color === 'blue' && 'bg-blue-500/20 text-blue-500',
                                    capa.color === 'amber' && 'bg-amber-500/20 text-amber-500',
                                    capa.color === 'orange' && 'bg-orange-500/20 text-orange-500',
                                    capa.color === 'red' && 'bg-red-500/20 text-red-500',
                                )}>
                                    {capa.numero}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-foreground">{capa.nombre}</p>
                                        <code className="text-xs text-muted-foreground font-mono">Guía {capa.guia}</code>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                                        <strong>Pregunta:</strong> {capa.pregunta}
                                    </p>
                                    <p className="text-xs text-foreground mb-0.5">
                                        <strong>Mecanismo:</strong> {capa.mecanismo}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1.5">
                                        <div className="flex items-start gap-1.5">
                                            <Lock className="h-3 w-3 text-emerald-500 mt-0.5 flex-none" />
                                            <p className="text-xs text-muted-foreground">
                                                <strong className="text-foreground">Detiene:</strong> {capa.detiene}
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-1.5">
                                            <Server className="h-3 w-3 text-muted-foreground mt-0.5 flex-none" />
                                            <p className="text-xs text-muted-foreground">
                                                <strong>No detiene:</strong> {capa.noDetiene}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SeccionCard>

        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tarjeta contenedora de sección. Estandariza el aspecto de las 5 secciones.
 */
function SeccionCard({
    icono,
    titulo,
    subtitulo,
    children,
    color,
}: {
    icono: React.ReactNode
    titulo: string
    subtitulo: string
    children: React.ReactNode
    color: 'blue' | 'violet' | 'amber' | 'emerald' | 'red'
}) {
    const iconColors = {
        blue: 'bg-blue-500/10 text-blue-500',
        violet: 'bg-violet-500/10 text-violet-500',
        amber: 'bg-amber-500/10 text-amber-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        red: 'bg-red-500/10 text-red-500',
    }

    return (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
                <div className={cn('flex items-center justify-center h-8 w-8 rounded-md', iconColors[color])}>
                    {icono}
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
                    <p className="text-xs text-muted-foreground">{subtitulo}</p>
                </div>
            </div>
            <div className="p-5 space-y-5">
                {children}
            </div>
        </section>
    )
}

/**
 * Sub-sección con título dentro de una SeccionCard.
 */
function SubSeccion({ titulo, children }: { titulo: string, children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {titulo}
            </p>
            {children}
        </div>
    )
}

/**
 * Dato individual con label y valor. El modo mono es para IDs y hashes.
 */
function DatoItem({ label, value, mono = false }: { label: string, value: string, mono?: boolean }) {
    return (
        <div className="flex flex-col p-2.5 rounded-md bg-muted/20 border border-border/30">
            <span className="text-xs text-muted-foreground mb-0.5">{label}</span>
            <span className={cn('text-sm text-foreground', mono && 'font-mono text-xs break-all')}>
                {value || '—'}
            </span>
        </div>
    )
}

/**
 * Tarjeta de módulo con submódulos colapsables.
 * Tipado explícito con MenuModulo — sin any.
 */
function ModuloCard({ modulo }: { modulo: MenuModulo }) {
    const [isOpen, setIsOpen] = useState(true)
    return (
        <div className="rounded-md border border-border/50 bg-background/50 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
                {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-none" />
                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-none" />
                }
                <LayoutDashboard className="h-3.5 w-3.5 text-primary-accent flex-none" />
                <span className="font-medium text-foreground">{modulo.nombre}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                    {modulo.submodulos.length} submódulo{modulo.submodulos.length !== 1 ? 's' : ''}
                </span>
            </button>
            {isOpen && (
                <div className="px-3 pb-2 space-y-1 border-t border-border/30">
                    {modulo.submodulos.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-3 px-3 py-1.5 text-xs rounded-md bg-card mt-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-none" />
                            <span className="text-foreground font-medium">{sub.nombre}</span>
                            <code className="text-muted-foreground font-mono ml-auto">{sub.href}</code>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/**
 * Badge de resultado true/false para el tester RBAC.
 */
function ResultBadge({ value }: { value: boolean | null }) {
    if (value === null) return null
    return (
        <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-mono',
            value
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
        )}>
            {value
                ? <CheckCircle2 className="h-3 w-3" />
                : <XCircle className="h-3 w-3" />
            }
            {value ? 'true' : 'false'}
        </span>
    )
}

/**
 * Tarjeta de conteo numérico para la sección de BD.
 */
function ConteoCard({ label, valor, color }: {
    label: string
    valor: number
    color: 'violet' | 'blue' | 'emerald'
}) {
    const colorClases = {
        violet: 'text-violet-500',
        blue: 'text-blue-500',
        emerald: 'text-emerald-500',
    }
    return (
        <div className="flex flex-col p-3 rounded-md bg-muted/20 border border-border/30 text-center">
            <span className={cn('text-2xl font-bold font-mono', colorClases[color])}>{valor}</span>
            <span className="text-xs text-muted-foreground mt-1">{label}</span>
        </div>
    )
}
'@

New-Item -Path "src/app/dashboard/pruebas/page.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/dashboard/pruebas/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/dashboard/pruebas/page.tsx creado (5 secciones completas)" -ForegroundColor Green
Write-Host "🔬 Sección 1: Sesión RBAC + Menú + Matriz de permisos + Tester interactivo" -ForegroundColor Cyan
Write-Host "🏗️  Sección 2: Stack tecnológico + 3 clientes Supabase + Flujo login" -ForegroundColor Cyan
Write-Host "🎨 Sección 3: Paleta semántica activa + variantes Button + tipografía" -ForegroundColor Cyan
Write-Host "🗄️  Sección 4: Conteos reales de BD via Server Action" -ForegroundColor Cyan
Write-Host "🛡️  Sección 5: Las 5 capas de seguridad documentadas" -ForegroundColor Cyan
Write-Host "🔧 Fix lint: comillas en tester escapadas con {'"'} — react/no-unescaped-entities" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 1

```powershell
# ═══════════════════════════════════════════════════════════════
# FINGERPRINT PARTE 1 — VERIFICACIÓN DE EXISTENCIA DE ARCHIVOS
# ═══════════════════════════════════════════════════════════════

Write-Host "`n═══ VALIDACIÓN PARTE 1 — DIAGNÓSTICO DEL SISTEMA ═══" -ForegroundColor Cyan

$archivos = @(
    "src/app/dashboard/pruebas/page.tsx",
    "src/lib/actions/diagnostico.ts"
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
    Write-Host "`n✅ PARTE 1 COMPLETA — Continuar con Parte 2" -ForegroundColor Green
} else {
    Write-Host "`n❌ Archivos faltantes — Ejecutar bloques anteriores" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si algun archivo falta, ejecutar los bloques correspondientes antes de continuar. Si `npx tsc --noEmit` reporta errores en estos archivos, las causas mas comunes son:
> - `MenuModulo` no encontrado → el tipo no existe en `src/types/auth.ts` — volver a Guia 0.5
> - `DiagnosticoSistema` no encontrado → el archivo `diagnostico.ts` no fue creado correctamente
> - `useAuth` no encontrado → el hook no esta exportado desde `auth-store.ts` — volver a Guia 0.5

---

## CHECKLIST DE VERIFICACION VISUAL

Despues del Fingerprint, iniciar el servidor y verificar:

```bash
npm run dev
```

### Test 1: Login como Administrador → `/dashboard/pruebas`

| Seccion | Que verificar |
|:--------|:-------------|
| Seccion 1 — Sesion | Nombre, email, rol "Administrador", tema activo aparecen correctos |
| Seccion 1 — Menu | Al menos 1 modulo visible con submodulos y hrefs |
| Seccion 1 — Permisos | Checkmarks verdes en la mayoria de celdas (admin tiene permisos amplios) |
| Seccion 1 — Tester | `puedeVerPagina('/dashboard/sistema/usuarios')` → `true` |
| Seccion 2 — Arquitectura | Stack tecnologico, 3 clientes y flujo de login visibles |
| Seccion 3 — Diseno | Paleta de colores renderizada, botones en todas sus variantes |
| Seccion 4 — BD | Conteos reales cargados (no "Consultando...") |
| Seccion 5 — Seguridad | Las 5 capas documentadas y legibles |

### Test 2: Login como Vendedor → `/dashboard/pruebas`

| Seccion | Que verificar |
|:--------|:-------------|
| Seccion 1 — Menu | Solo modulos del plan con permisos del rol Vendedor |
| Seccion 1 — Permisos | Mezcla de ✅ y ❌ — el Vendedor no tiene `eliminar` en clientes |
| Seccion 1 — Tester | `puedeVerPagina('/dashboard/sistema/usuarios')` → `false` |
| Seccion 4 — BD | Los conteos reflejan la empresa del Vendedor (mismos que el Admin si es la misma empresa) |

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado | Proposito |
|:--------|:------:|:----------|
| `src/app/dashboard/pruebas/page.tsx` | NUEVO | Centro de diagnostico — 5 secciones con scroll |
| `src/lib/actions/diagnostico.ts` | NUEVO | Server Action — conteos reales de la BD |

---

## SIGUIENTE PARTE

**-> Parte 2** — Componentes de Seguridad: RBACGuard, ProtectedAction y sin-acceso

Se crean los 3 componentes de seguridad. Todavia no se conectan al Shell — eso ocurre en la Parte 3. El paso deliberado existe para poder validar TypeScript antes de modificar archivos criticos como `layout.tsx`.

---

> **Documento:** GUIA_0_7_Parte1_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
