# GUIA 0.5 — AUTENTICACION SaaS
## PARTE 2: TIPOS + STORE + SERVER ACTIONS

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 2 de 6
> **Prerequisito:** Parte 1 completada — 3 archivos de infraestructura existen y 6 directorios creados
> **Siguiente parte:** `GUIA_0_5_Parte3_V6.md` — Componentes Compartidos
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Construir la capa de datos: el contrato TypeScript, el estado global, las constantes compartidas y la comunicacion con Supabase. Los componentes visuales de las partes 3-5 dependen de los cuatro archivos de esta parte.

- **Bloque 1 — `src/types/auth.ts`:** Todos los tipos del dominio — `Usuario` con `id_empresa` y `empresa{}`, `Empresa`, `LoginStep` simplificado, `SesionCompletaResponse` y `PasswordValidation`
- **Bloque 2 — `src/lib/stores/auth-store.ts`:** Store Zustand con `useSyncExternalStore`, `tienePermiso()`, `puedeVerPagina()` y persistencia selectiva en localStorage
- **Bloque 3 — `src/lib/constants.ts`:** Constantes compartidas entre Client Components y Server Actions — `PLANES` de suscripcion
- **Bloque 4 — `src/lib/actions/auth.ts`:** 5 Server Actions — `iniciarSesionAction`, `registrarseAction`, `crearEmpresaAction`, `rehidratarSesionAction`, `cerrarSesionAction`

> **Al terminar esta parte:** El store esta listo para recibir sesiones. Las Server Actions conectan la UI con Supabase. `npx tsc --noEmit` pasa sin errores.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — TIPOS DE DOMINIO

📄 **ARCHIVO COMPLETO** — `src/types/auth.ts`

**Proposito:** Contrato TypeScript entre la BD (`obtener_sesion_completa()`), el store Zustand y todos los componentes del flujo de autenticacion.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Tipos TypeScript |
| Ejecuta en | Solo compilacion — ningun runtime |
| Importado por | `auth-store.ts`, `auth.ts` (actions), `LoginForm.tsx`, `OnboardingForm.tsx`, `AuthWrapper.tsx`, `PasswordRequirements.tsx` |
| Importa de | Nada — archivo raiz sin dependencias |
| Contrato | Exporta `Usuario`, `Empresa`, `Rol`, `MenuItem`, `MenuModulo`, `Permiso`, `SesionCompletaResponse`, `LoginStep`, `PasswordValidation` |
| Si lo modificas | Build falla en todos los archivos que importan estos tipos. Si cambia la estructura de `Usuario`, el auth-store y todas las Server Actions deben actualizarse |

### DECISIONES DE DISENO

**Por que `Empresa` es interfaz separada y no campos sueltos en `Usuario`?**
`obtener_sesion_completa()` retorna `empresa` como objeto anidado `{ id, nombre, plan }`. Modelarlo como interfaz refleja exactamente la estructura del SQL — si cambia la funcion, TypeScript detecta la inconsistencia automaticamente.

**Por que `LoginStep` solo tiene 3 valores (`login`, `register`, `loading`)?**
El flujo SaaS elimino los estados Zero-Trust (`activate`, `error`). Los errores se muestran inline — no hay pantalla de error separada.

```powershell
$content = @'
// ============================================================================
// TIPOS DE AUTENTICACIÓN — ERP GLOBAL
// Contrato entre obtener_sesion_completa() (BD), auth-store (Zustand) y UI.
// Todos los archivos de la Guía 0.5 importan desde aquí.
// ============================================================================

// ── Modos internos del LoginForm ──────────────────────────────────────────────
export type LoginStep = 'login' | 'register' | 'loading'

// ── Empresa ───────────────────────────────────────────────────────────────────
export interface Empresa {
    id: string
    nombre: string
    plan: string
}

// ── Rol ───────────────────────────────────────────────────────────────────────
export interface Rol {
    id: string
    nombre: string
    nivel: number
}

// ── Usuario ───────────────────────────────────────────────────────────────────
export interface Usuario {
    id: string
    email: string
    nombre: string
    telefono?: string
    id_rol: string
    id_empresa: string
    rol?: Rol
    empresa?: Empresa
    preferencias: {
        tema: string              // Paleta activa — leída por layout server-side (cero FOUC)
        onboarding_visto: boolean  // false = mostrar banner 'Primeros pasos' en dashboard
    }
}

// ── Menú flat retornado por la RPC ────────────────────────────────────────────
export interface MenuItem {
    id_modulo: string
    nombre_modulo: string
    icono_modulo: string
    orden_modulo: number
    id_submodulo: string
    nombre_submodulo: string
    href: string
    icono_submodulo: string
    orden_submodulo: number
}

// ── Árbol de menú agrupado — estructura que usa el Sidebar ───────────────────
export interface MenuModulo {
    id: string
    nombre: string
    icono: string
    orden: number
    submodulos: {
        id: string
        nombre: string
        href: string
        icono: string
        orden: number
    }[]
}

// ── Permiso ───────────────────────────────────────────────────────────────────
export interface Permiso {
    id_submodulo: string
    id_accion: string
    clave_accion: string  // 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar'
}

// ── Respuesta de obtener_sesion_completa() ────────────────────────────────────
export interface SesionCompletaResponse {
    error: boolean
    mensaje?: string
    usuario?: Usuario
    menu?: MenuItem[]
    permisos?: Permiso[]
}

// ── Validación de contraseña ──────────────────────────────────────────────────
export interface PasswordValidation {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecial: boolean
    isValid: boolean
}
'@

New-Item -Path "src/types/auth.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/types/auth.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/types/auth.ts corregido" -ForegroundColor Green
Write-Host "🎯 preferencias ahora incluye onboarding_visto: boolean" -ForegroundColor Cyan
```

---

## BLOQUE 2 — AUTH STORE ZUSTAND

📄 **ARCHIVO COMPLETO** — `src/lib/stores/auth-store.ts`

**Proposito:** Estado global de sesion del usuario. Persiste en localStorage bajo la key `erp-auth-storage`. Provee los helpers `tienePermiso()` y `puedeVerPagina()` que el RBAC del cliente consume en la Guia 0.7.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Store Zustand |
| Patron | Store con persist + `useSyncExternalStore` para SSR |
| Ejecuta en | Browser (persist en localStorage) — servidor retorna `getInitialState()` |
| Importado por | `LoginForm.tsx`, `OnboardingForm.tsx`, `AuthWrapper.tsx`, `dashboard/page.tsx`, Sidebar (Guia 0.6), RBACGuard (Guia 0.7) |
| Importa de | `zustand`, `zustand/middleware`, `react`, `@/types/auth` |
| Contrato | Exporta `useAuthStoreBase` (acceso directo), `useAuth(selector)` (SSR-safe), `useAuthStore()` (alias completo). Funciones: `setAuth()`, `clearAuth()`, `tienePermiso()`, `puedeVerPagina()`, `actualizarPreferencias()` |
| Si lo modificas | Afecta toda la capa de autenticacion del cliente. Cambiar la key de localStorage (`erp-auth-storage`) invalida todas las sesiones existentes |

### DECISIONES DE DISENO

**Por que `useSyncExternalStore` en `useAuth()`?**
Zustand con `persist` guarda en localStorage. En el servidor, localStorage no existe — el store inicia vacio. En el cliente tras la hidratacion — el store tiene datos de la sesion anterior. `useSyncExternalStore` resuelve esto al declarar explicitamente el estado del servidor (`getInitialState()`) y el del cliente (`getState()`).

**Por que `partialize` excluye `isLoading`?**
`isLoading` es estado volatil. Si se persistiera, un usuario que cierra la app con `isLoading: true` abriria la app de nuevo y veria un spinner infinito. Solo se persiste lo que tiene sentido al restaurar la sesion: `isAuthenticated`, `usuario`, `menu` y `permisos`.

**Por que `agruparMenuPorModulos()` vive en este archivo?**
La RPC retorna el menu como array flat (`MenuItem[]`). El Sidebar de la Guia 0.6 necesita el arbol agrupado (`MenuModulo[]`). La conversion se hace una sola vez al llamar `setAuth()` — no en cada render del Sidebar.

**Por que `tienePermiso(href, accion)` busca por `href`?**
El `href` es la fuente de verdad de identidad de un submodulo — el mismo string que el Sidebar usa en los `<Link>`. Buscar por `href` permite que cualquier pagina llame `tienePermiso('/dashboard/ventas/pedidos', 'crear')` sin conocer el UUID interno del submodulo.

```powershell
$content = @'
// ============================================================================
// AUTH STORE — ZUSTAND HYDRATION-SAFE
// Persiste en localStorage bajo 'erp-auth-storage'.
// Usar siempre useAuth(selector) en componentes del árbol SSR.
// useAuthStoreBase solo en contextos donde la hidratación ya está resuelta.
// ============================================================================

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useSyncExternalStore } from 'react'
import type { Usuario, MenuItem, MenuModulo, Permiso } from '@/types/auth'

interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    usuario: Usuario | null
    menu: MenuModulo[]
    permisos: Permiso[]
    setAuth: (usuario: Usuario, menu: MenuItem[], permisos: Permiso[]) => void
    clearAuth: () => void
    setLoading: (loading: boolean) => void
    tienePermiso: (href: string, accion: string) => boolean
    puedeVerPagina: (href: string) => boolean
    actualizarPreferencias: (prefs: Partial<{ tema: string; onboarding_visto: boolean }>) => void
}

// ═══════════════════════════════════════════════════════════════════
// CONVERSIÓN DE MENÚ: flat (RPC) → árbol (Sidebar)
// La RPC retorna MenuItem[] para mantener la query SQL simple.
// El Sidebar necesita MenuModulo[] agrupado por módulo padre.
// Se ejecuta una vez en setAuth() — no en cada render.
// ═══════════════════════════════════════════════════════════════════
function agruparMenuPorModulos(items: MenuItem[]): MenuModulo[] {
    const map = new Map<string, MenuModulo>()

    items.forEach((item) => {
        if (!map.has(item.id_modulo)) {
            map.set(item.id_modulo, {
                id: item.id_modulo,
                nombre: item.nombre_modulo,
                icono: item.icono_modulo,
                orden: item.orden_modulo,
                submodulos: [],
            })
        }
        map.get(item.id_modulo)!.submodulos.push({
            id: item.id_submodulo,
            nombre: item.nombre_submodulo,
            href: item.href,
            icono: item.icono_submodulo,
            orden: item.orden_submodulo,
        })
    })

    const modulos = Array.from(map.values())
    modulos.sort((a, b) => a.orden - b.orden)
    modulos.forEach(m => m.submodulos.sort((a, b) => a.orden - b.orden))
    return modulos
}

export const useAuthStoreBase = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            isLoading: true,
            usuario: null,
            menu: [],
            permisos: [],

            /**
             * Hidrata el store después de login, registro o rehidratación.
             * Convierte el menú flat de la RPC al árbol que el Sidebar usa.
             * Siempre llamar ANTES de router.push() para que el dashboard encuentre
             * el store listo sin necesitar una llamada adicional.
             */
            setAuth: (usuario, menuItems, permisos) => {
                set({
                    isAuthenticated: true,
                    isLoading: false,
                    usuario,
                    menu: agruparMenuPorModulos(menuItems),
                    permisos,
                })
            },

            /**
             * Limpia el store en logout.
             * isLoading: false para no bloquear la UI de login con un spinner.
             */
            clearAuth: () => {
                set({
                    isAuthenticated: false,
                    isLoading: false,
                    usuario: null,
                    menu: [],
                    permisos: [],
                })
            },

            setLoading: (loading) => set({ isLoading: loading }),

            /**
             * Verifica si el usuario puede ejecutar una acción en una página.
             * Busca el submódulo por href (fuente de verdad de identidad),
             * luego cruza con permisos por clave_accion.
             * Guía 0.7 lo usa en ProtectedAction y en el Toolbar.
             */
            tienePermiso: (href, accion) => {
                const { permisos, menu } = get()
                let idSubmodulo: string | null = null

                for (const modulo of menu) {
                    const sub = modulo.submodulos.find(s => s.href === href)
                    if (sub) { idSubmodulo = sub.id; break }
                }

                if (!idSubmodulo) return false
                return permisos.some(
                    p => p.id_submodulo === idSubmodulo && p.clave_accion === accion
                )
            },

            /**
             * Verifica si el usuario puede navegar a una ruta.
             * Si el href no está en su menú, no tiene acceso.
             * Guía 0.7 lo usa en el RBACGuard para proteger rutas del dashboard.
             */
            puedeVerPagina: (href) => {
                const { menu } = get()
                return menu.some(m => m.submodulos.some(s => s.href === href))
            },

            /**
             * Actualiza preferencias en memoria — merge parcial.
             * Partial<> permite actualizar solo 'tema' (ThemeToggler) o solo
             * 'onboarding_visto' (BienvenidaPage) sin borrar el otro campo.
             * La persistencia en BD la maneja guardarTemaAction() / marcarOnboardingVistoAction().
             */
            actualizarPreferencias: (prefs) => {
                set(state => {
                    if (!state.usuario) return state
                    return {
                        usuario: {
                            ...state.usuario,
                            preferencias: {
                                // Spread del estado actual primero, luego los campos nuevos
                                // Garantiza que ningún campo se pierde al actualizar uno solo
                                ...state.usuario.preferencias,
                                ...prefs,
                            },
                        },
                    }
                })
            },
        }),
        {
            name: 'erp-auth-storage',
            storage: createJSONStorage(() => localStorage),
            // isLoading NO se persiste — es volátil. Si se persistiera y quedara en true,
            // el usuario abriría la app de nuevo con un spinner infinito.
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                usuario: state.usuario,
                menu: state.menu,
                permisos: state.permisos,
            }),
        }
    )
)

// ═══════════════════════════════════════════════════════════════════
// HOOK SSR-SAFE — usar este hook en todos los componentes del árbol SSR
// useSyncExternalStore provee snapshots distintos para servidor y cliente,
// eliminando el hydration mismatch que Zustand + persist + localStorage produce.
// ═══════════════════════════════════════════════════════════════════
export function useAuth<T>(selector: (state: AuthState) => T): T {
    return useSyncExternalStore(
        useAuthStoreBase.subscribe,
        () => selector(useAuthStoreBase.getState()),
        () => selector(useAuthStoreBase.getInitialState())
    )
}

// Alias para acceder a todo el estado — útil en componentes que necesitan múltiples valores
export const useAuthStore = () => useAuth(state => state)
'@

New-Item -Path "src/lib/stores/auth-store.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/stores/auth-store.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/stores/auth-store.ts corregido" -ForegroundColor Green
Write-Host "🔧 actualizarPreferencias: Partial<> + spread — tema y onboarding_visto independientes" -ForegroundColor Cyan
```

---

## BLOQUE 3 — CONSTANTES COMPARTIDAS

📄 **ARCHIVO COMPLETO** — `src/lib/constants.ts`

**Proposito:** Constantes que necesitan ser accesibles tanto desde Client Components como desde Server Actions. Archivo neutral — sin directiva `'use server'` ni `'use client'`.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Constantes |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | `OnboardingForm.tsx` (renderiza el selector de planes), `crearEmpresaAction` (recibe `planClave` como parametro) |
| Importa de | Nada — archivo raiz sin dependencias |
| Contrato | Exporta `PLANES` — array readonly con `clave`, `nombre`, `descripcion`, `precio` |
| Si lo modificas | Cambiar las claves de los planes sin actualizar la tabla `planes_suscripcion` en Supabase causa que `crearEmpresaAction` no encuentre el UUID del plan |

### DECISIONES DE DISENO

**Por que no viven en `actions/auth.ts`?**
`actions/auth.ts` lleva la directiva `'use server'` en la linea 1 — Next.js marca todo ese modulo como Server-only. Cualquier Client Component que intente importar una constante de ese modulo falla en prerendering con `TypeError: Cannot read properties of undefined`. Al separar las constantes en un archivo neutral, ambos contextos las importan libremente.

**Por que no una query a la BD?**
Los planes solo cambian con un deploy — agregar uno implica nuevas paginas y nuevo codigo. Una query en la carga de `/onboarding` anade latencia innecesaria para datos que nunca cambian en runtime. `crearEmpresaAction` si hace un `SELECT id WHERE clave = ?` al confirmar — ese es el unico momento que toca la BD.

```powershell
$content = @'
// ============================================================================
// CONSTANTES COMPARTIDAS — ERP GLOBAL
// Archivo neutral: sin directiva use server ni use client.
// Importable desde Client Components y Server Actions sin restricciones.
// ============================================================================

// ═══════════════════════════════════════════════════════════════════
// PLANES DE SUSCRIPCIÓN
// Hardcodeados — no cambian sin un deploy.
// OnboardingForm los renderiza en el selector visual (Parte 5).
// crearEmpresaAction hace SELECT id WHERE clave = planClave para obtener el UUID real.
// ═══════════════════════════════════════════════════════════════════
export const PLANES = [
    {
        clave: 'basico',
        nombre: 'Básico',
        descripcion: 'Hasta 5 usuarios · Sistema, Ventas, Facturación',
        precio: '$499/mes',
    },
    {
        clave: 'pro',
        nombre: 'Pro',
        descripcion: 'Hasta 20 usuarios · + Compras, Almacén, Reportes',
        precio: '$1,499/mes',
    },
    {
        clave: 'empresa',
        nombre: 'Empresa',
        descripcion: 'Sin límite de usuarios · Todos los módulos',
        precio: '$3,999/mes',
    },
] as const
'@

New-Item -Path "src/lib/constants.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/constants.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/constants.ts creado" -ForegroundColor Green
Write-Host "📦 PLANES exportado — importable desde Client y Server sin restricciones" -ForegroundColor Cyan
```

---

## BLOQUE 4 — SERVER ACTIONS DE AUTENTICACION

📄 **ARCHIVO COMPLETO** — `src/lib/actions/auth.ts`

**Proposito:** Las 5 funciones del servidor que la UI llama directamente. Next.js serializa la llamada, la transporta al servidor y retorna el resultado tipado — el codigo nunca llega al navegador.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Server Action |
| Ejecuta en | Servidor Node.js (`'use server'` en linea 1) |
| Importado por | `LoginForm.tsx` (`iniciarSesionAction`, `registrarseAction`), `OnboardingForm.tsx` (`crearEmpresaAction`), `AuthWrapper.tsx` (`rehidratarSesionAction`), componente de logout (`cerrarSesionAction`) |
| Importa de | `@/lib/supabase/server` (`createClient`), `@supabase/supabase-js` (`createClient` como admin), `@/types/auth` |
| Contrato | Exporta 5 acciones: `iniciarSesionAction`, `registrarseAction`, `crearEmpresaAction`, `rehidratarSesionAction`, `cerrarSesionAction` |
| Si lo modificas | Afecta todo el flujo de autenticacion. Cambiar la firma de `iniciarSesionAction` rompe `LoginForm.tsx`. Cambiar `crearEmpresaAction` rompe `OnboardingForm.tsx` |

### DECISIONES DE DISENO

**Por que `iniciarSesionAction` es una operacion atomica?**
Cuando el usuario presiona "Entrar", esta funcion hace `signInWithPassword` y en el mismo request llama `obtener_sesion_completa()`. Si el login y la carga de sesion fueran dos Server Actions separadas, el navegador procesaria la primera respuesta (que incluye la cookie de sesion) y luego el cliente haria la segunda llamada — pero esa cookie puede no estar disponible aun en el momento del segundo request, generando un `obtener_sesion_completa()` sin sesion aunque el login fue exitoso.

**Por que `registrarseAction` solo crea en Auth y no carga sesion?**
Esta accion crea el usuario en `auth.users` de Supabase y termina ahi. No intenta cargar la sesion del ERP porque el usuario todavia no tiene fila en la tabla `usuarios` — `obtener_sesion_completa()` retornaria `error: true` inmediatamente. El flujo continua en `/onboarding` donde `crearEmpresaAction` completa el registro.

**Por que `crearEmpresaAction` usa el cliente admin (service_role)?**
Al llegar al onboarding el usuario tiene token de Auth valido pero no existe en la tabla `usuarios` todavia. Las politicas RLS de `empresas` filtran por `obtener_empresa_usuario()`, que lee el `id_empresa` del JWT o de la tabla `usuarios`. Como el usuario no tiene ninguno de los dos, `obtener_empresa_usuario()` retorna `NULL` — y el `SELECT` del `.select('id')` posterior al `INSERT` falla por RLS aunque el `INSERT` mismo paso. Los tres `INSERT`s del onboarding (`empresas`, `roles lookup`, `usuarios`) usan el cliente admin con `service_role` key que bypasea el RLS. El cliente admin solo existe dentro de esta Server Action, corre en el servidor, y `SUPABASE_SERVICE_ROLE_KEY` nunca sale al navegador.

**Por que `'use server'` se concatena fuera del heredoc?**
El heredoc `@'...'@` de PowerShell a veces anade una linea vacia inicial al parsear comillas simples dentro de el. `'use server'` debe ser la linea 1 del archivo sin nada antes — la concatenacion lo garantiza.

> **Instruccion especial:** `OnboardingForm.tsx` (Parte 5, Bloque 1) importa `PLANES` desde `@/lib/constants`, no desde `@/lib/actions/auth`. Si ya ejecutaste la Parte 5 con el import incorrecto, re-ejecutar el Bloque 1 de esa parte — el script reemplaza el archivo completo con el import correcto.

```powershell
$useServer = "'use server'"
$rest = @'

// ============================================================================
// SERVER ACTIONS — AUTENTICACIÓN
// 'use server' en línea 1: obligatorio, sin nada antes.
// El cliente llama estas funciones como si fueran locales —
// Next.js maneja la serialización y el transporte via HTTP.
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { SesionCompletaResponse } from '@/types/auth'

// ── Iniciar sesión ────────────────────────────────────────────────────────────
// OPERACIÓN ATÓMICA: signInWithPassword + obtener_sesion_completa en el mismo Action.
// Si se separaran, la segunda llamada podría ejecutarse antes de que el navegador
// procese la cookie del login — generando error de sesión aunque el login fue exitoso.
export async function iniciarSesionAction(email: string, password: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
    })

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            return { error: 'Correo o contraseña incorrectos.' }
        }
        return { error: error.message }
    }

    const { data, error: sessionError } = await supabase.rpc('obtener_sesion_completa')
    if (sessionError) return { error: sessionError.message }

    return { success: true, session: data as SesionCompletaResponse }
}

// ── Registrarse ───────────────────────────────────────────────────────────────
// Solo crea el usuario en Supabase Auth. NO llama obtener_sesion_completa()
// porque el usuario aún no tiene registro en la tabla pública usuarios.
// La sesión completa se carga en crearEmpresaAction() tras completar el onboarding.
export async function registrarseAction(nombre: string, email: string, password: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
            data: { nombre },
        },
    })

    if (error) {
        if (error.message.includes('already registered')) {
            return { error: 'Este correo ya tiene una cuenta. Inicia sesión.' }
        }
        return { error: error.message }
    }

    return { success: true }
}

// ── Crear empresa ─────────────────────────────────────────────────────────────
// OPERACIÓN ATÓMICA: INSERT empresas → tr_onboarding_empresa siembra automáticamente
// roles, catálogos y permisos RBAC del administrador (Guía 0.4, Parte 5).
// Luego INSERT usuarios → tr_vincular_usuario inyecta id_rol e id_empresa en el JWT.
// Finalmente obtener_sesion_completa() retorna la sesión ya con empresa y menú.
//
// ¿Por qué dos clientes (anon + admin)?
// El usuario recién registrado no tiene id_empresa en la tabla usuarios todavía —
// ese registro es exactamente lo que se está creando aquí. La función
// obtener_empresa_usuario() retorna NULL, y la política RLS empresas_lectura
// bloquea el SELECT posterior al INSERT porque filtra por id_empresa del usuario.
// Es un huevo-y-gallina: necesitas la empresa para pasar RLS, pero necesitas
// insertar para tener empresa.
// Solución: usar el cliente admin (service_role) solo para los INSERTs del onboarding.
// El cliente admin bypasea RLS — seguro porque corre en el servidor ('use server')
// y SUPABASE_SERVICE_ROLE_KEY nunca sale al navegador.
// obtener_sesion_completa() usa el cliente anon normal porque en ese punto
// el usuario ya tiene empresa y pasa el RLS correctamente.
export async function crearEmpresaAction(
    nombre: string,
    rfc: string | null,
    planClave: string
) {
    // Cliente anon — para verificar sesión y llamar la RPC al final
    const supabase = await createClient()

    // Verificar que hay sesión activa — necesitamos auth.uid()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { error: 'Sesión expirada. Vuelve a iniciar sesión.' }

    // Cliente admin — bypasea RLS para los INSERTs del onboarding
    // Solo se usa en esta acción y solo para las operaciones de creación inicial
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener el UUID del plan — admin porque el usuario aún no tiene empresa
    const { data: plan, error: planError } = await supabaseAdmin
        .from('planes_suscripcion')
        .select('id')
        .eq('clave', planClave)
        .single()
    if (planError || !plan) return { error: 'Plan no válido.' }

    // INSERT empresas → tr_onboarding_empresa se dispara automáticamente en PostgreSQL
    // admin: el usuario no tiene id_empresa aún — obtener_empresa_usuario() retorna NULL
    const { data: empresa, error: empresaError } = await supabaseAdmin
        .from('empresas')
        .insert({ nombre, rfc: rfc || null, id_plan: plan.id })
        .select('id')
        .single()
    if (empresaError) return { error: empresaError.message }

    // Obtener el rol administrador que tr_onboarding_empresa acaba de sembrar
    const { data: rol, error: rolError } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('id_empresa', empresa.id)
        .eq('nombre', 'administrador')
        .single()
    if (rolError || !rol) return { error: 'Error al configurar los permisos de la empresa.' }

    // INSERT usuarios → tr_vincular_usuario inyecta id_rol e id_empresa en el JWT
    // id DEBE coincidir con auth.uid() — es el puente entre auth.users y la tabla pública
    const { error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .insert({
            id: user.id,
            id_empresa: empresa.id,
            id_rol: rol.id,
            email: user.email!,
            nombre: user.user_metadata?.nombre || user.email!.split('@')[0],
        })
    if (usuarioError) return { error: usuarioError.message }

    // A partir de aquí el usuario ya tiene empresa y pasa el RLS normalmente
    // Usar el cliente anon para obtener_sesion_completa() — no el admin
    const { data, error: sessionError } = await supabase.rpc('obtener_sesion_completa')
    if (sessionError) return { error: sessionError.message }

    return { success: true, session: data as SesionCompletaResponse }
}

// ── Rehidratar sesión ──────────────────────────────────────────────────────────
// El AuthWrapper llama esta acción cuando el store Zustand está vacío pero hay cookie.
// Si retorna error: true → el usuario tiene token Auth pero sin empresa → /onboarding
// Si retorna sesión válida → hidratar el store con setAuth()
export async function rehidratarSesionAction(): Promise<SesionCompletaResponse> {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('obtener_sesion_completa')
    if (error) return { error: true, mensaje: error.message }
    return data as SesionCompletaResponse
}

// ── Cerrar sesión ──────────────────────────────────────────────────────────────
// Invalida el token en Supabase Auth. El componente que llama esta acción
// debe llamar clearAuth() en el store y router.push('/login') después.
export async function cerrarSesionAction(): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        await supabase.auth.signOut()
        return { success: true }
    } catch {
        return { success: false, error: 'Error al cerrar sesión.' }
    }
}
'@

$content = $useServer + $rest
New-Item -Path "src/lib/actions/auth.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/actions/auth.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/actions/auth.ts creado" -ForegroundColor Green
Write-Host "⚛️ iniciarSesion + crearEmpresa — operaciones atómicas sin race condition" -ForegroundColor Cyan
Write-Host "🔐 crearEmpresaAction usa cliente admin — bypasea RLS durante el onboarding" -ForegroundColor Cyan
Write-Host "🏢 crearEmpresaAction — activa tr_onboarding_empresa y tr_vincular_usuario" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 2

```powershell
Write-Host "=== VALIDACIÓN PARTE 2 ===" -ForegroundColor Cyan
$ok = $true

$archivos = @(
    "src/types/auth.ts",
    "src/lib/stores/auth-store.ts",
    "src/lib/constants.ts",
    "src/lib/actions/auth.ts"
)
foreach ($f in $archivos) {
    if (Test-Path $f) { Write-Host "✅ $f" -ForegroundColor Green }
    else { Write-Host "❌ $f" -ForegroundColor Red; $ok = $false }
}

if ($ok) { Write-Host "`n✅ PARTE 2 COMPLETA" -ForegroundColor Green }
else      { Write-Host "`n❌ CORREGIR ERRORES ANTES DE CONTINUAR" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si `constants.ts` no existe, `OnboardingForm.tsx` fallara en prerendering con `TypeError: Cannot read properties of undefined (reading 'clave')`. Si `auth.ts` no existe, todos los formularios fallaran en compilacion con `Module not found`.

---

## RESUMEN DE ESTA PARTE

| Archivo | Estado |
|:--------|:------:|
| `src/types/auth.ts` | NUEVO |
| `src/lib/stores/auth-store.ts` | REEMPLAZADO (version base de Guia 0.2 -> version RBAC completa) |
| `src/lib/constants.ts` | NUEVO |
| `src/lib/actions/auth.ts` | NUEVO |

---

## SIGUIENTE PARTE

**-> Parte 3** — Componentes Compartidos

Se crean el validador de contrasena, el `BrandPanel` corporativo y el `PasswordRequirements`. En la Parte 5, `OnboardingForm.tsx` importa `PLANES` desde `@/lib/constants`.

---

> **Documento:** GUIA_0_5_Parte2_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
