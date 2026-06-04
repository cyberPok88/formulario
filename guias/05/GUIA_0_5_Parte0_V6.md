# GUIA 0.5 — AUTENTICACION SaaS
## PARTE 0: PANORAMA GENERAL

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 0 de 6 (documento de referencia)
> **Prerequisito:** Guias 0.1, 0.2, 0.3 y 0.4 completadas — 33 tablas en Supabase, `COUNT(*) = 33`
> **Siguiente parte:** `GUIA_0_5_Parte1_V6.md` — Preparacion + Infraestructura
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE CONSTRUYE EN ESTA GUIA?

Al terminar las 6 partes la aplicacion tendra un sistema de autenticacion completo con 3 rutas y 2 modos de pantalla:

1. **`/login`** — pantalla dividida (BrandPanel izquierdo + formulario derecho) con dos modos internos: iniciar sesion y crear cuenta. Toggle entre modos sin cambiar de ruta.
2. **`/onboarding`** — pantalla dividida con formulario de empresa (nombre, RFC opcional, plan). Se muestra una sola vez, la primera vez que el usuario entra despues de registrarse.
3. **`/dashboard`** — placeholder con datos reales del store: nombre del usuario, empresa y rol. El App Shell real llega en la Guia 0.6.

El flujo de autenticacion cubre 5 operaciones: registrarse, iniciar sesion, crear empresa, rehidratar sesion (regreso con cookie activa) y cerrar sesion.

---

## LO QUE NO SE CONSTRUYE AQUI

| Fuera de scope | Donde va |
|:---------------|:---------|
| App Shell real (sidebar, topbar, toolbar) | Guia 0.6 |
| RBAC guards en rutas del dashboard | Guia 0.7 |
| Recuperacion de contrasena (funcional) | Guia posterior — el enlace existe en la UI |
| Triggers de onboarding (`tr_onboarding_empresa`) | Ya implementados en Guia 0.4 — se activan automaticamente |
| Gestion de usuarios adicionales por el admin | Guia de modulo Sistema |

---

## ARQUITECTURA: DECISIONES CERRADAS

| # | Decision | Resultado | Razon |
|:-:|:---------|:----------|:------|
| 1 | Nombre del interceptor Next.js 16 | `proxy.ts` — renombrado desde `middleware.ts` | Next.js 16 renombro el archivo del Edge Runtime. La funcionalidad es identica |
| 2 | Metodo de validacion en el proxy | `getClaims()` en lugar de `getUser()` | Valida la firma JWT localmente sin round-trip HTTP a Supabase. Mas rapido, igual de seguro |
| 3 | Prohibido en servidor | `getSession()` bloqueado por ESLint | Lee sin validar, puede ser manipulado. Ya bloqueado desde Guia 0.1 |
| 4 | Variable de entorno Supabase | Se mantiene `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase migra al nuevo nombre `PUBLISHABLE_KEY` pero el cambio es cosmetico y no rompe nada |
| 5 | Login y registro en la misma ruta | `mode: 'login' \| 'register'` interno en `LoginForm.tsx` | Una sola URL `/login` simplifica el proxy y evita estados de transicion entre rutas |
| 6 | Proteccion de `/onboarding` | El proxy solo valida token Auth. `AuthWrapper` redirige si falta empresa | El proxy no puede hacer esa distincion sin query a BD (cara en el Edge) — delega al `AuthWrapper` |
| 7 | Planes en onboarding | Hardcodeados como constante | Un solo query al confirmar para obtener el UUID del plan elegido. Evita fetch extra al cargar el formulario |
| 8 | Anti-hydration en Zustand | `useSyncExternalStore` | Evita mismatch entre estado SSR (store vacio) y estado cliente (localStorage con sesion) |
| 9 | Login como operacion atomica | `signInWithPassword()` + `obtener_sesion_completa()` en el mismo Server Action | Evita race condition entre la cookie y la siguiente llamada |
| 10 | Onboarding usa cliente admin | `createAdminClient()` con service_role solo para INSERTs de empresa | El usuario recien registrado no tiene `id_empresa` — `obtener_empresa_usuario()` retorna NULL y RLS bloquea el SELECT posterior al INSERT. El cliente admin bypasea RLS. Seguro porque corre en `'use server'` y la key nunca sale al navegador |

---

## ARQUITECTURA: DIAGRAMA — FLUJO DE NAVEGACION

```
Usuario abre la app
        ↓
proxy.ts — ¿tiene token Auth?
    NO  → /login
    SÍ  → deja pasar

/login → LoginForm (modo login o register)
    login exitoso       → AuthWrapper verifica sesión → /dashboard
    registro exitoso    → /onboarding
    toggle              → cambia modo sin cambiar ruta

/onboarding → OnboardingForm
    empresa creada      → /dashboard
    ya tiene empresa    → /dashboard (AuthWrapper redirige)

/dashboard → AuthWrapper
    store vacío + cookie válida  → rehidratar → mostrar dashboard
    obtener_sesion retorna error → /onboarding (sin empresa)
    sin cookie                   → proxy ya redirigió a /login

logout → cerrarSesionAction → clearAuth → /login
```

### Capas de seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│ CAPA 1 — proxy.ts (Edge Runtime)                                │
│   Ejecuta ANTES de cualquier renderizado de Next.js             │
│   Valida token JWT con getClaims() — sin round-trip HTTP        │
│   Sin token → /login | Con token → deja pasar                  │
├─────────────────────────────────────────────────────────────────┤
│ CAPA 2 — AuthWrapper (Client Component)                         │
│   Ejecuta DESPUÉS del renderizado del layout del dashboard      │
│   Rehidrata sesión con obtener_sesion_completa()                │
│   Sin empresa → /onboarding | Con empresa → mostrar dashboard  │
├─────────────────────────────────────────────────────────────────┤
│ CAPA 3 — Server Actions (Servidor Node.js)                      │
│   Cada acción verifica getUser() antes de operar                │
│   Retorna objetos tipados — nunca throw                         │
│   crearEmpresaAction usa service_role para bypass de RLS        │
└─────────────────────────────────────────────────────────────────┘
```

---

## INDICE DE PARTES

### PARTE 1 — Preparacion + Infraestructura Supabase
> **Archivo:** `GUIA_0_5_Parte1_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | Directorios nuevos | `src/lib/actions/`, `src/lib/validations/`, `src/components/auth/`, `src/app/login/`, `src/app/onboarding/`, `src/app/dashboard/` |
| 2 | `src/lib/supabase/server.ts` | Cliente Supabase para Server Components y Server Actions — API batch `getAll/setAll` |
| 3 | `src/lib/supabase/proxy.ts` | Utilidad Supabase para el Edge — sincroniza cookies y valida con `getClaims()` |
| 4 | `src/proxy.ts` | Interceptor Next.js 16 — protege rutas privadas, maneja `/onboarding` como ruta intermedia |

**Al terminar:** Todas las rutas privadas estan protegidas. `/onboarding` acepta usuarios con token pero sin empresa. El trio de clientes Supabase esta completo: `client.ts` (navegador), `server.ts` (servidor), `proxy.ts` (Edge).

---

### PARTE 2 — Tipos + Store + Server Actions
> **Archivo:** `GUIA_0_5_Parte2_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/types/auth.ts` | Todos los tipos del dominio: `Usuario` (con `id_empresa`, `empresa{}`), `Empresa`, `SesionCompletaResponse`, `LoginStep`, `PasswordValidation` |
| 2 | `src/lib/stores/auth-store.ts` | Store Zustand con `useSyncExternalStore`, `tienePermiso()`, `puedeVerPagina()`, `actualizarPreferencias()` — persistencia selectiva en localStorage |
| 3 | `src/lib/actions/auth.ts` | 5 Server Actions: `iniciarSesionAction`, `registrarseAction`, `crearEmpresaAction`, `rehidratarSesionAction`, `cerrarSesionAction` |

**Al terminar:** El store esta listo para recibir sesiones. Las Server Actions conectan la UI con Supabase. Contratos disponibles: interfaces `Usuario`, `Empresa`, `SesionCompletaResponse`; hook `useAuth()`; funciones `tienePermiso()`, `puedeVerPagina()`.

---

### PARTE 3 — Componentes Compartidos
> **Archivo:** `GUIA_0_5_Parte3_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/lib/validations/password.ts` | Validador de contrasena — 5 requisitos que replican la configuracion de Supabase Auth |
| 2 | `src/components/auth/BrandPanel.tsx` | Panel izquierdo corporativo — logo, nombre de la app, slogan. Aparece en `/login` y `/onboarding` |
| 3 | `src/components/auth/PasswordRequirements.tsx` | Checklist visual en tiempo real — muestra el estado de cada requisito mientras el usuario escribe |

**Al terminar:** Los componentes compartidos existen de forma independiente. Contratos disponibles: `BrandPanel`, `PasswordRequirements`, `validarPassword()`.

---

### PARTE 4 — Formulario de Login
> **Archivo:** `GUIA_0_5_Parte4_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/components/auth/LoginForm.tsx` | Orquestador con `mode: 'login' \| 'register'` — gestiona los dos modos, llama Server Actions, hidrata el store al exito |
| 2 | `src/app/login/page.tsx` | Pantalla de login — layout dividido, monta `BrandPanel` + `LoginForm` |

**Al terminar:** El flujo de login y registro funciona completo. Un usuario puede entrar con cuenta existente o crear una nueva.

---

### PARTE 5 — Onboarding + Dashboard
> **Archivo:** `GUIA_0_5_Parte5_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/components/auth/OnboardingForm.tsx` | Formulario de empresa — nombre, RFC (opcional), selector de plan hardcodeado |
| 2 | `src/app/onboarding/page.tsx` | Pantalla de onboarding — mismo layout dividido con BrandPanel adaptado |
| 3 | `src/components/auth/AuthWrapper.tsx` | Protector del dashboard — rehidrata la sesion al montar, redirige a `/onboarding` si no hay empresa |
| 4 | `src/app/dashboard/layout.tsx` | Layout del dashboard — monta `AuthWrapper` |
| 5 | `src/app/dashboard/page.tsx` | Placeholder visual — muestra nombre, empresa, plan y rol del usuario autenticado |

**Al terminar:** El flujo completo funciona de principio a fin: registro -> onboarding -> dashboard.

---

### PARTE 6 — Paginas Raiz + Barrel + Verificacion Final
> **Archivo:** `GUIA_0_5_Parte6_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/app/page.tsx` | Redirector — si hay sesion va a `/dashboard`, si no va a `/login` |
| 2 | `src/components/auth/index.ts` | Barrel export de todos los componentes auth |
| 3 | Fingerprint final | `npm run build` sin errores — validacion completa de la guia |

**Al terminar:** `npm run build` pasa. El flujo completo esta verificado.

---

## MANIFIESTO DE ARCHIVOS

### Archivos nuevos (17)

| Archivo | Parte |
|:--------|:-----:|
| `src/lib/supabase/server.ts` | 1 |
| `src/lib/supabase/proxy.ts` | 1 |
| `src/proxy.ts` | 1 |
| `src/types/auth.ts` | 2 |
| `src/lib/stores/auth-store.ts` | 2 |
| `src/lib/actions/auth.ts` | 2 |
| `src/lib/validations/password.ts` | 3 |
| `src/components/auth/BrandPanel.tsx` | 3 |
| `src/components/auth/PasswordRequirements.tsx` | 3 |
| `src/components/auth/LoginForm.tsx` | 4 |
| `src/app/login/page.tsx` | 4 |
| `src/components/auth/OnboardingForm.tsx` | 5 |
| `src/app/onboarding/page.tsx` | 5 |
| `src/components/auth/AuthWrapper.tsx` | 5 |
| `src/app/dashboard/layout.tsx` | 5 |
| `src/app/dashboard/page.tsx` | 5 |
| `src/components/auth/index.ts` | 6 |

### Archivos reemplazados (1)

| Archivo | Parte | Cambio |
|:--------|:-----:|:-------|
| `src/app/page.tsx` | 6 | Reemplazado — de pagina de verificacion a redirector |

### Directorios nuevos (6)

| Directorio | Parte |
|:-----------|:-----:|
| `src/lib/actions/` | 1 |
| `src/lib/validations/` | 1 |
| `src/components/auth/` | 1 |
| `src/app/login/` | 1 |
| `src/app/onboarding/` | 1 |
| `src/app/dashboard/` | 1 |

---

## NOTAS DE SOPORTE

- **`src/lib/supabase/client.ts`** existe desde la Guia 0.2. No se toca en esta guia. Los bloques 2 y 3 de la Parte 1 completan el trio de clientes Supabase agregando `server.ts` y `proxy.ts`.
- **`src/lib/stores/auth-store.ts`** fue creado en la Guia 0.2 como andamiaje. Esta guia lo **reemplaza completamente** con la version RBAC que agrega `tienePermiso()`, `puedeVerPagina()` y el tipo `Usuario` expandido.
- **`src/app/page.tsx`** fue creado en la Guia 0.2 como pagina de verificacion. La Parte 6 lo **reemplaza** por un redirector que envia al usuario a `/dashboard` o `/login` segun su estado de sesion.
- **Triggers de Supabase** (`tr_onboarding_empresa`, `obtener_sesion_completa()`) fueron implementados en la Guia 0.4. Esta guia los consume — no los crea ni modifica.
- **`SUPABASE_SERVICE_ROLE_KEY`** debe existir en `.env.local` para que `crearEmpresaAction` funcione. Es la unica Server Action que usa `createAdminClient()`.

---

## TROUBLESHOOTING

| Sintoma | Causa | Solucion |
|:--------|:------|:---------|
| Error de hidratacion en consola | `auth-store` no usa `useSyncExternalStore` | Verificar Parte 2, Bloque 2 |
| Dashboard redirige a `/login` en loop | `obtener_sesion_completa()` falla — funcion no existe o BD incompleta | Verificar Guia 0.4 completada |
| `/onboarding` redirige a `/dashboard` aunque no hay empresa | `AuthWrapper` no evalua correctamente el error de sesion | Verificar Parte 5, Bloque 3 |
| `getClaims()` retorna null aunque el usuario esta logueado | Token expirado sin refresh | Verificar que `proxy.ts` llama `updateSession()` antes de `getClaims()` |
| Build falla por `'use server'` | No esta en la primera linea del archivo | Mover a linea 1, antes de cualquier import |
| `Cannot find module '@/lib/actions/auth'` | Directorio no creado | Ejecutar Parte 1, Bloque 1 |
| Store vacio despues de refresh | Key de localStorage cambio | Borrar `erp-auth-storage` en DevTools -> Application -> Local Storage |
| new row violates row-level security policy for table "empresas" | El usuario recien registrado no tiene `id_empresa` — `obtener_empresa_usuario()` retorna NULL y RLS bloquea el SELECT posterior al INSERT | `crearEmpresaAction` usa `createAdminClient()` con service_role. Verificar que `SUPABASE_SERVICE_ROLE_KEY` esta en `.env.local` |

---

## SIGUIENTE GUIA

**-> Guia 0.6 — App Shell**

Construye el layout real del dashboard: sidebar dinamico que lee el menu del auth-store, topbar con datos del usuario, toolbar contextual por pagina, y sistema de navegacion completo. Reemplaza el placeholder del dashboard de esta guia con la estructura de navegacion definitiva.

---

> **Documento:** GUIA_0_5_Parte0_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
