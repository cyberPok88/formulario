# GUIA 0.7 — SEGURIDAD RBAC VIVO (FRONT-END)
## PARTE 0: PANORAMA GENERAL Y DECISIONES ARQUITECTONICAS

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 0 de 3 (documento de referencia)
> **Prerequisito:** Guia 0.6 completada — App Shell funcional, `npm run build` exitoso
> **Prerequisito adicional (Guia 0.5):** El auth-store debe exportar `puedeVerPagina(href)` y `tienePermiso(href, accion)`. El hook seguro `useAuth(selector)` debe existir con `useSyncExternalStore`. El store base `useAuthStoreBase` debe estar exportado para el RBACGuard.
> **Prerequisito adicional (Guia 0.4):** La RPC `obtener_sesion_completa()` debe retornar `{ usuario, menu, permisos }` correctamente. Los seeds de `permisos_navegacion` y `permisos_acciones` para los 8 roles deben estar ejecutados (Parte 3).
> **Siguiente parte:** `GUIA_0_7_Parte1_V6.md` — Diagnostico del Sistema + Pagina de Pruebas
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE CONSTRUYE EN ESTA GUIA?

Esta guia activa la **capa de seguridad visual** del ERP. Al terminar, la aplicacion tendra un centro de diagnostico completo del sistema, un guard centralizado que protege todas las rutas, filtrado automatico de botones segun permisos, y una pagina de acceso denegado para usuarios rechazados.

1. **Pagina de diagnostico del sistema** (`/dashboard/pruebas`) — Panel completo con 5 secciones: sesion RBAC activa, arquitectura del sistema construida, sistema de diseno en vivo, estado real de la BD, y niveles de seguridad documentados. Herramienta de desarrollo que convierte lo invisible (estado interno del auth-store, capas de seguridad, tokens CSS activos) en algo visible y verificable.
2. **Server Action de diagnostico** (`src/lib/actions/diagnostico.ts`) — Consulta real a la BD que devuelve conteos de modulos, submodulos, roles, permisos y empresas. La seccion "Estado de BD" de la pagina de pruebas la consume.
3. **`RBACGuard.tsx`** — Componente centralizado en `dashboard/layout.tsx`. Protege automaticamente todas las rutas bajo `/dashboard/*`. Si `puedeVerPagina(pathname)` retorna `false`, redirige a `/dashboard/sin-acceso`. Un punto de control unico — cualquier ruta nueva queda protegida sin tocar nada.
4. **`ProtectedAction.tsx` + hooks auxiliares** — Componente de granularidad fina para proteger micro-elementos de UI (botones individuales, links, iconos). Incluye `useCanAction()` para logica condicional y `usePermissions()` para el mapa completo de las 5 acciones.
5. **`sin-acceso/page.tsx`** — Pagina sumidero de denegacion. Muestra el icono de rechazo, el rol actual del usuario y botones de navegacion segura. No tiene guard — es el destino del guard.
6. **Integracion en `dashboard/layout.tsx`** — El `RBACGuard` envuelve `{children}` en el layout maestro. Un cambio quirurgico que activa la proteccion de todas las rutas sin modificar el Shell.
7. **Filtrado RBAC del `Toolbar.tsx`** — Un `useMemo` que filtra `mergedActions` con `tienePermiso()` antes del render. Los botones que el usuario no puede ejecutar desaparecen automaticamente.

---

## LO QUE NO SE CONSTRUYE AQUI

| Fuera de scope | Donde va |
|:---------------|:---------|
| CRUDs con datos reales (Usuarios, Clientes, Productos) | Guias 0.8+, 1.x, 2.x |
| Gestion de usuarios e invitaciones (UI) | Guia 0.8 |
| Edicion de permisos desde la interfaz (Sistema → Permisos) | Guia 0.8+ |
| Verificacion RBAC en el Edge (proxy.ts) | Fuera de scope — el Edge solo verifica sesion, no autorizacion granular |
| Layouts especificos por modulo | Innecesarios — el guard centralizado los cubre automaticamente |
| Recuperacion de contrasena funcional | Guia posterior |
| Invalidacion inmediata de sesion por admin | Mejora futura — hoy el bloqueo tarda maximo 1 hora (expiracion JWT) |

---

## LO QUE NO SE TOCA

| Componente | Por que no cambia |
|:-----------|:------------------|
| `proxy.ts` | Solo verifica autenticacion (¿hay sesion?). La autorizacion granular (¿tiene permiso?) vive en el cliente donde el store ya tiene los datos — sin latencia de red adicional en cada request |
| `auth-store.ts` | Ya tiene `puedeVerPagina()` y `tienePermiso()` desde la Guia 0.5. Esta guia solo los consume |
| `obtener_sesion_completa()` | La RPC de la Guia 0.4 ya retorna `menu[]` y `permisos[]` filtrados por rol y plan |
| `Sidebar` | Ya lee `menu[]` del auth-store — si la BD dice que el Vendedor solo ve Ventas, el Sidebar solo muestra Ventas. El filtrado ocurre en la BD, no en el frontend |
| `toolbar-config.ts` | Ya tiene el campo `accion` en cada boton desde la Guia 0.6. Esta guia cruza ese campo contra `tienePermiso()`, pero no modifica el config |
| `tailwind.config.ts` + `globals.css` | El sistema de 3 capas semantico no se modifica |

---

## ARQUITECTURA: DECISIONES CERRADAS

| # | Decision | Resultado | Razon |
|:-:|:---------|:----------|:------|
| 1 | Ubicacion del RBACGuard | Centralizado en `dashboard/layout.tsx`, envolviendo `{children}` dentro de `<main>` | Un solo punto de control. El Shell (Sidebar, Topbar, Footer) permanece visible incluso cuando el acceso es denegado — el usuario rechazado ve la pagina `sin-acceso` en el area de contenido, no una pantalla en blanco |
| 2 | Filtrado del Toolbar | Automatico dentro del componente Toolbar mediante un `useMemo` con `.filter()` | El Toolbar ya tiene acceso al `pathname` y al `toolbar-config.ts` con campo `accion`. Solo necesita cruzar con `tienePermiso()`. No requiere codigo extra en cada `page.tsx` |
| 3 | Verificacion RBAC en Edge | NO se agrega al `proxy.ts` | Un SELECT a la BD en cada request del Edge agrega latencia innecesaria. El store del cliente ya tiene los permisos cargados desde `obtener_sesion_completa()` — la verificacion granular es instantanea en el cliente |
| 4 | Hidratacion en RBACGuard | `useState(false)` + `useEffect(() => setIsClient(true))` — NO `useSyncExternalStore` | El RBACGuard combina deteccion de hidratacion con `router.replace()`. El patron `useSyncExternalStore` produce snapshots estaticos que pueden llegar obsoletos durante transiciones de ruta, causando race conditions donde el guard toma decisiones incorrectas |
| 5 | Un solo `useEffect` en RBACGuard | Toda la logica RBAC en un bloque reactivo consolidado | Dos `useEffect` separados (uno para evaluar, uno para resetear en cambio de ruta) compiten entre si: React los ejecuta en orden y el segundo sobreescribe al primero, dejando el guard atascado en "Verificando..." permanentemente |
| 6 | `verifiedPath` anti-parpadeo | Estado que registra la ultima ruta verificada. El contenido solo se renderiza si `pathname === verifiedPath` | Sin el hay un frame donde `guardState = 'allowed'` (ruta anterior) pero `pathname` ya cambio — React renderiza brevemente el contenido de la nueva ruta antes de que el guard la evalue |
| 7 | `useAuthStoreBase` en RBACGuard | Lectura directa del store, no el wrapper `useAuth()` | `useAuth()` fue disenado para componentes con riesgo de hydration mismatch en SSR. El RBACGuard ya tiene su propio guard de hidratacion (`isClient`). En ese contexto, `useSyncExternalStore` agrega latencia innecesaria sin beneficio |
| 8 | Rutas excluidas como constante | `RUTAS_PUBLICAS` array hardcodeado, no props ni config externa | Son contratos del sistema — no cambian segun quien use el componente. Hacerlas props abriria la puerta a olvidar `/dashboard/sin-acceso`, creando loop infinito |
| 9 | Pagina de diagnostico expandida | Una sola pagina con scroll y 5 secciones completas | Mantiene todo el contexto visible mientras se debuggea — ver datos del store mientras se prueba el tester interactivo, ver el sistema de diseno mientras se verifica el tema activo |
| 10 | Server Action para datos de BD | `diagnostico.ts` separado de la pagina | Sigue el patron de la guia (Server Actions en `src/lib/actions/`). La pagina es Client Component — no puede hacer queries directas a Supabase |
| 11 | Desactivacion de usuario activo | Efecto diferido — pierde acceso en el proximo refresh del token (maximo 1 hora) | Aceptable para la operativa del ERP. Si se necesita invalidacion inmediata, se agrega `signOut({ scope: 'global' })` en el panel de admin (Guia 0.8+) |

---

## ARQUITECTURA: DIAGRAMA DE CAPAS DE SEGURIDAD

```
REQUEST del usuario
        │
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  CAPA 1 — EDGE (proxy.ts) ── "¿Hay sesión?"                      │
│  Valida JWT criptográficamente con getClaims() — sin red          │
│  Si no hay sesión → redirect /login                               │
│  ✅ Instalada en Guía 0.5 — NO se modifica aquí                  │
└───────────────────────────────────────────────────────────────────┘
        │ (sesión válida)
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  CAPA 2 — SERVER COMPONENT (dashboard/layout.tsx)                 │
│  await getUser() — verifica JWT contra Supabase Auth Server       │
│  Si no hay user → redirect /login                                 │
│  Renderiza Shell: Sidebar, Topbar, Toolbar, Footer                │
│  ✅ Instalada en Guía 0.6 — NO se modifica (solo se agrega Guard)│
└───────────────────────────────────────────────────────────────────┘
        │ (user verificado server-side)
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  CAPA 3 — CLIENT COMPONENT (RBACGuard) ── "¿Tiene permiso?"      │
│  Espera hidratación del auth-store (isLoading = false)            │
│  puedeVerPagina(pathname) → busca href en menu[] del store        │
│  Si no tiene permiso → router.replace('/dashboard/sin-acceso')    │
│  ✅ NUEVA en Guía 0.7 — Bloque 4 + integración en Bloque 7       │
└───────────────────────────────────────────────────────────────────┘
        │ (ruta autorizada)
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  CAPA 4 — UI (Toolbar + ProtectedAction) ── "¿Qué puede hacer?"  │
│  Toolbar: filtra botones con tienePermiso(pathname, accion)       │
│  ProtectedAction: oculta/deshabilita elementos individuales       │
│  ✅ NUEVA en Guía 0.7 — Bloques 5 + 8                            │
└───────────────────────────────────────────────────────────────────┘
        │ (UI filtrada por permisos)
        ▼
┌───────────────────────────────────────────────────────────────────┐
│  CAPA 5 — BASE DE DATOS (RLS PostgreSQL) ── "¿Puede ver la fila?"│
│  id_empresa = obtener_empresa_usuario() en cada query             │
│  Políticas por rol para tablas sensibles                          │
│  ✅ Instalada en Guía 0.3/0.4 — NO se modifica aquí              │
└───────────────────────────────────────────────────────────────────┘
```

**Que detiene cada capa:**

| Capa | Detiene | No detiene |
|:-----|:--------|:-----------|
| Edge Proxy | Usuarios sin sesion | Usuarios con sesion pero sin permiso para una ruta |
| Server Layout | Sesiones invalidas o expiradas en el servidor | Usuarios con sesion valida que no deberian ver ciertas rutas |
| RBACGuard | Usuarios con sesion valida pero sin permiso para la ruta | Acceso a elementos de UI dentro de una pagina permitida |
| Toolbar + ProtectedAction | Botones y elementos de UI sin permiso | Queries maliciosas directas a la BD (eso es RLS) |
| RLS PostgreSQL | Queries directas a la BD aunque se bypasee el frontend | — (ultima linea de defensa) |

---

## ARQUITECTURA: FLUJO RBAC COMPLETO

```
Login exitoso
      │
      ▼
obtener_sesion_completa() ─────────────────────────────────────────┐
      │                                                             │
      │  Retorna:                                                   │
      │  ┌─────────────────────────────────────────────────────┐   │
      │  │ usuario: { id, nombre, email, rol, preferencias }   │   │
      │  │ menu: MenuModulo[] — módulos y submódulos visibles   │   │
      │  │        (ya filtrado por rol Y plan de suscripción)   │   │
      │  │ permisos: Permiso[] — { id_submodulo, clave_accion }│   │
      │  └─────────────────────────────────────────────────────┘   │
      │                                                             │
      ▼                                                             │
auth-store.setAuth(usuario, menu, permisos) ◄──────────────────────┘
      │
      │  Deriva helpers:
      │  ┌─────────────────────────────────────────────────────────┐
      │  │ puedeVerPagina(href)  → boolean                         │
      │  │   Busca href en menu[].submodulos[].href                 │
      │  │   Si existe → true. Si no → false.                      │
      │  │                                                         │
      │  │ tienePermiso(href, accion) → boolean                    │
      │  │   1. Busca el submodulo por href en menu[]               │
      │  │   2. Busca el permiso por id_submodulo + clave_accion    │
      │  │   3. Si existe → true. Si no → false.                   │
      │  └─────────────────────────────────────────────────────────┘
      │
      ├──► RBACGuard consume puedeVerPagina()
      ├──► Toolbar consume tienePermiso()
      └──► ProtectedAction consume tienePermiso()
```

---

## INDICE DE PARTES

### PARTE 0 — Este documento (referencia completa)
Contiene: decisiones cerradas, diagramas de arquitectura, flujo RBAC, manifiesto de archivos, troubleshooting y notas de soporte. Lectura obligatoria antes de empezar.

---

### PARTE 1 — Diagnostico del Sistema + Pagina de Pruebas
> **Archivo:** `GUIA_0_7_Parte1_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | Directorios + Verificacion | Crea `pruebas/`, verifica contratos del auth-store |
| 2 | `src/lib/actions/diagnostico.ts` | Server Action — conteos reales de BD |
| 3 | `src/app/dashboard/pruebas/page.tsx` | Pagina de 5 secciones con tester RBAC interactivo |

**Al terminar:** `/dashboard/pruebas` muestra datos reales del store en 5 secciones. Si algo esta vacio, se detecta aqui antes de confiar en los guards.

---

### PARTE 2 — Componentes de Seguridad: Guard, ProtectedAction y Sin-Acceso
> **Archivo:** `GUIA_0_7_Parte2_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 4 | `src/components/shell/RBACGuard.tsx` | Guard centralizado con patron V5.1 |
| 5 | `src/components/shell/ProtectedAction.tsx` | Componente + hooks `useCanAction()`, `usePermissions()` |
| 6 | `src/app/dashboard/sin-acceso/page.tsx` | Pagina sumidero de denegacion |

**Al terminar:** `npx tsc --noEmit` sin errores. Componentes existen pero no estan activos.

---

### PARTE 3 — Integracion, Verificacion y Testing
> **Archivo:** `GUIA_0_7_Parte3_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 7 | `dashboard/layout.tsx` (modificado) | Agrega `<RBACGuard>` envolviendo `{children}` |
| 8 | `Toolbar.tsx` (modificado) | Filtra botones con `tienePermiso()` |
| 9 | `shell/index.ts` (modificado) | +4 exports RBAC |
| 10 | Build + Verificacion | Script completo de validacion |
| 11 | Checklist visual | Pruebas manuales por rol |
| 12 | Troubleshooting | Problemas comunes + queries SQL |

**Al terminar:** `npm run build` exitoso. RBAC activo en todas las rutas.

---

## MANIFIESTO DE ARCHIVOS

### Archivos nuevos (5)

| Archivo | Parte | Proposito |
|:--------|:-----:|:----------|
| `src/app/dashboard/pruebas/page.tsx` | 1 | Centro de diagnostico del sistema — 5 secciones |
| `src/lib/actions/diagnostico.ts` | 1 | Server Action — conteos reales de BD |
| `src/components/shell/RBACGuard.tsx` | 2 | Guard centralizado de rutas |
| `src/components/shell/ProtectedAction.tsx` | 2 | Ocultar/deshabilitar micro-elementos + hooks |
| `src/app/dashboard/sin-acceso/page.tsx` | 2 | Pagina de denegacion |

### Archivos modificados (3)

| Archivo | Parte | Cambio |
|:--------|:-----:|:-------|
| `src/app/dashboard/layout.tsx` | 3 | +1 import RBACGuard, reemplazo seccion `{children}` |
| `src/components/shell/Toolbar.tsx` | 3 | +1 import `useAuth`, +1 `useMemo` filtrado, 2 renombres en render |
| `src/components/shell/index.ts` | 3 | +4 exports RBAC |

### Sin cambios (contratos heredados)

| Archivo | Guia origen | Por que no cambia |
|:--------|:-----------:|:------------------|
| `src/lib/stores/auth-store.ts` | 0.5 | Ya tiene `puedeVerPagina()` y `tienePermiso()` |
| `src/lib/supabase/proxy.ts` | 0.5 | Solo verifica sesion, no autorizacion granular |
| `src/config/toolbar-config.ts` | 0.6 | Ya tiene campo `accion` en cada boton |
| `src/config/icon-map.ts` | 0.6 | No se agregan iconos nuevos |
| `src/types/shell.ts` | 0.6 | `AccionBasica` ya existe, no se amplia |

---

## DEPENDENCIAS NUEVAS

Esta guia **no instala dependencias npm nuevas ni componentes shadcn**. Todo lo necesario ya existe:

| Recurso | Instalado en | Uso en 0.7 |
|:--------|:-------------|:-----------|
| `lucide-react` | Guia 0.1 | Iconos en diagnostico y sin-acceso |
| `zustand` + `useSyncExternalStore` | Guia 0.2/0.5 | `useAuth(selector)` en ProtectedAction y diagnostico |
| `next/navigation` | Next.js built-in | `usePathname()`, `useRouter()` |
| `@supabase/supabase-js` | Guia 0.2 | Server Action de diagnostico usa `createClient()` |
| `AccionBasica` | Guia 0.6 (`shell.ts`) | Tipo de las acciones RBAC en `ProtectedAction` |
| `Button` (shadcn) | Guia 0.1 | Botones del sistema de diseno en la pagina de diagnostico |

---

## TROUBLESHOOTING

| Error | Causa | Solucion |
|:------|:------|:---------|
| Loop infinito de redireccion | `/dashboard/sin-acceso` no esta en `RUTAS_PUBLICAS` del RBACGuard | Verificar que la constante incluye `/dashboard/sin-acceso` exacto — sin trailing slash ni variaciones |
| "Verificando permisos..." infinito | Race condition — version antigua del guard con 2 `useEffect` separados | El guard V5.1 usa un solo `useEffect` consolidado. Si persiste, verificar que `verifiedPath` existe en el codigo |
| Guard redirige a todos los usuarios | `menu[]` del auth-store esta vacio → `puedeVerPagina()` siempre retorna `false` | Navegar a `/dashboard/pruebas` y verificar seccion "Sesion RBAC". Si el menu esta vacio: revisar que `obtener_sesion_completa()` retorna datos y que `setAuth()` se llama despues del login |
| Guard no redirige a nadie | El `<RBACGuard>` no esta en `layout.tsx` | Ejecutar Bloque 7. Verificar con Bloque 10 que `RBACGuard.*fallback` aparece en el layout |
| Parpadeo de contenido privado | Falta `verifiedPath` o la condicion `pathname !== verifiedPath` en el render | Verificar el bloque de render del `RBACGuard` — debe incluir `guardState === 'allowed' && pathname !== verifiedPath` como condicion de fallback |
| Botones del Toolbar desaparecen todos | `permisos[]` del auth-store esta vacio | Verificar con `/dashboard/pruebas` seccion "Sesion RBAC". Si permisos vacio: revisar seeds de `permisos_acciones` en Guia 0.4 |
| `AccionRBAC` not found | Tipo inexistente usado por error | El tipo correcto es `AccionBasica` en `@/types/shell`. Buscar y reemplazar `AccionRBAC` en el proyecto |
| `useAuthStore` causa hydration error | Se uso el store directo en lugar del hook seguro | En paginas normales: usar `useAuth(s => s.puedeVerPagina)`. Solo en `RBACGuard`: usar `useAuthStoreBase` porque ya tiene su propio guard de hidratacion |
| Hydration mismatch en RBACGuard | El guard evalua permisos durante SSR | Verificar que el `useEffect` de validacion tiene `if (!isClient) return` como primera linea |
| `/dashboard/sistema/bienvenida` redirige a sin-acceso | La ruta de onboarding no esta excluida del guard | Agregar `/dashboard/sistema/bienvenida` a `RUTAS_PUBLICAS` en `RBACGuard.tsx` |
| Server Action de diagnostico falla | Usuario sin empresa o sin rol en la BD | El usuario debe tener registro en `usuarios` con `id_empresa` valido. Verificar con `SELECT * FROM usuarios WHERE id = auth.uid()` en Supabase |
| Pagina de diagnostico vacia seccion "Estado BD" | Server Action no encuentra datos | Verificar con el query de diagnostico #3 en el Bloque 12 de la Parte 3 |

---

## NOTAS DE SOPORTE

| Tema | Detalle |
|:-----|:--------|
| **Pagina de diagnostico** | Es una herramienta de desarrollo que permanece hasta que se decida retirarla explicitamente. Su presencia no afecta la performance — es una ruta normal del App Router |
| **Rutas excluidas del guard** | La lista incluye `/dashboard/sistema/bienvenida` porque esta ruta es el destino del onboarding. En el primer login, el auth-store puede no estar completamente hidratado cuando el usuario llega ahi — excluirla evita una condicion de carrera donde el guard rechaza al admin recien registrado |
| **Layouts de modulo** | NO se crean en esta guia. El guard centralizado los hace innecesarios. Si un modulo futuro necesita logica especifica de layout (breadcrumbs, contexto de modulo), se puede crear un `layout.tsx` de modulo SIN guard — el guard del padre ya lo cubre |
| **ProtectedAction** | Se usa dentro de las paginas de CRUDs (Guia 0.8+), no en el Shell. Ejemplo: en la futura pagina de Pedidos, el boton "Cancelar Pedido" se envuelve con `<ProtectedAction accion="eliminar" submodulo="/dashboard/ventas/pedidos">` |
| **`useCanAction` / `usePermissions`** | Para logica condicional imperativa. Ejemplo: `const { eliminar } = usePermissions('/dashboard/ventas/clientes')` → `if (eliminar) { /* mostrar opcion en menu contextual */ }` |
| **Toolbar de 0.6** | Se modifica minimamente — un `.filter()` antes del `.map()` y el renombre de la variable. El config, las acciones inyectadas por paginas y el merge por ID siguen igual |
| **Roles del sistema** | Los 8 roles definidos en Guia 0.4 (administrador, gerente, supervisor, contador, vendedor, almacenista, facturacion, compras). Los permisos de cada rol se configuran en BD — el frontend los consume pero no los define |

---

## ORDEN DE IMPLEMENTACION

```
PARTE 0 (este documento) — Leer y entender antes de empezar
    ↓
PARTE 1 — Diagnostico del Sistema: verificacion + Server Action + pagina 5 secciones
    ↓  (verificar: /dashboard/pruebas muestra datos reales antes de continuar)
PARTE 2 — Componentes de Seguridad: RBACGuard + ProtectedAction + sin-acceso
    ↓  (Fingerprint: npx tsc --noEmit → 0 errores)
PARTE 3 — Integracion + Verificacion: layout + Toolbar + exports + build
    ↓  (Fingerprint: npm run build → ✓ Compiled successfully)
```

> **Regla de oro:** Si un Fingerprint falla, no avanzar. Cada parte asume que la anterior esta 100% correcta.

---

## SIGUIENTE GUIA

**-> Guia 0.8 — Gestion de Usuarios (UI)**

Primera pagina con datos reales: `/dashboard/sistema/usuarios`. CRUD completo con tabla, invitacion de usuarios, edicion de roles y activacion/desactivacion. `<ProtectedAction>` se usa por primera vez en un contexto real de negocio — el boton "Desactivar Usuario" solo aparece para Administradores.

---

> **Documento:** GUIA_0_7_Parte0_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
