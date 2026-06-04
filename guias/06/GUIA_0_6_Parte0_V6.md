# GUIA 0.6 — APP SHELL: SIDEBAR, TOPBAR, TOOLBAR Y SISTEMA DE TEMAS
## PARTE 0: PANORAMA GENERAL Y DECISIONES ARQUITECTONICAS

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 0 de 5 (documento de referencia)
> **Prerequisito:** Guia 0.5 completada — `npm run build` exitoso, flujo registro → onboarding → dashboard funciona
> **Prerequisito adicional (Guia 0.4):** `fn_vincular_usuario()` inicializa `preferencias = {"tema": "slate-light", "onboarding_visto": false}`. Sin esto el ThemeInjector no tiene tema inicial y el banner de bienvenida nunca aparece.
> **Prerequisito adicional (Guia 0.5):** `auth-store.ts` exporta `actualizarPreferencias()` y el hook `useAuth(selector)`. `types/auth.ts` declara `preferencias: { tema: string, onboarding_visto: boolean }` en la interfaz `Usuario`.
> **Siguiente parte:** `GUIA_0_6_Parte1_V6.md` — Fundamentos: Directorios + Shadcn + Tipos + Configuraciones
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE CONSTRUYE EN ESTA GUIA?

Esta guia transforma el dashboard placeholder de la Guia 0.5 en un **App Shell corporativo completo**. Al terminar, la aplicacion tendra:

1. **Sidebar dinamico** que lee `menu[]` del `auth-store` (poblado por `obtener_sesion_completa()` en la Guia 0.4) y traduce los strings de iconos de la BD a componentes Lucide. Si la BD dice que el vendedor solo ve Ventas, el Sidebar solo muestra Ventas — sin codigo adicional.
2. **Topbar inteligente** con titulo de pagina contextual, nombre de la empresa del tenant, avatar del usuario, selector de paleta/modo y boton de logout.
3. **Toolbar dinamica** que cambia sus botones segun la ruta actual, combinando un diccionario centralizado (`toolbar-config.ts`) con acciones inyectadas por cada pagina via `usePageConfig`.
4. **Sistema de temas hibrido** — cambio visual instantaneo via CSS + persistencia en `localStorage` + sincronizacion en background a Postgres via Server Action.
5. **Submodulo `/dashboard/sistema/bienvenida`** — pagina de primeros pasos con el checklist de configuracion inicial. El dashboard muestra un card-banner la primera vez (`onboarding_visto === false`) que desaparece cuando el admin la visita.
6. **Dashboard principal** (`/dashboard/page.tsx`) — placeholder limpio con KPI cards vacias y `usePageConfig` integrado. Las metricas reales se implementan en guias de modulo.
7. **35 paginas navegables** (todas las rutas de los submodulos de la Guia 0.4) como placeholders funcionales que demuestran que el Shell responde correctamente: titulo en Topbar, botones en Toolbar, item activo en Sidebar.

---

## LO QUE NO SE CONSTRUYE AQUI

| Fuera de scope | Donde va |
|:---------------|:---------|
| Guards RBAC que oculten/redirijan segun permisos | Guia 0.7 |
| Filtrado de botones del Toolbar por `tienePermiso()` | Guia 0.7 |
| CRUDs con datos reales (Pedidos, Clientes, Productos) | Guias 1.x, 2.x, 3.x |
| Gestion de usuarios (invitar, asignar roles) | Guia 0.8 |
| Metricas reales en el Dashboard (ventas del dia, pedidos pendientes) | Guias de modulo |
| Recuperacion de contrasena funcional | Guia posterior |
| Configuracion fiscal completa de la empresa (RFC, regimen, domicilio) | Modulo Sistema — Mi Empresa |

---

## ARQUITECTURA: DECISIONES CERRADAS

| # | Decision | Resultado | Razon |
|:-:|:---------|:----------|:------|
| 1 | Separacion 0.6 / 0.7 | 0.6 = Shell visual conectado al auth-store. 0.7 = Guards RBAC client-side | El menu ya llega filtrado desde la BD — el Sidebar es seguro por diseno. La 0.7 agrega defensa contra URLs escritas manualmente |
| 2 | Menu del Sidebar | Dinamico desde `menu: MenuModulo[]` del auth-store + `iconMap` para traducir strings a componentes Lucide | `obtener_sesion_completa()` ya retorna el menu agrupado por modulo y filtrado por rol y plan. El Sidebar solo consume lo que existe |
| 3 | Filtrado de menu por plan | Ocurre en `obtener_sesion_completa()` — el Sidebar nunca recibe modulos fuera del plan | Un admin del plan Basico tiene permisos para todos los modulos en `permisos_navegacion`, pero la RPC solo retorna `sistema`, `ventas` y `facturacion`. El frontend no necesita saber que plan tiene la empresa |
| 4 | Persistencia de tema | Hibrida: `localStorage` para velocidad inmediata + Server Action que sincroniza a BD en background | Cero FOUC en SSR: el layout server-side lee el tema de BD antes de renderizar HTML. Cero parpadeo en cliente: Zustand restaura desde `localStorage` que coincide con el HTML del servidor |
| 5 | Layout del Dashboard | Server Component (Supervisor) que verifica sesion en servidor y monta Client Components (Operarios) | Redirect server-side antes de renderizar + Footer como Server Component puro (0 bytes de JS) + patron oficial Next.js App Router |
| 6 | Toolbar contextual | Config centralizado como base + paginas inyectan acciones extra via `usePageConfig` | Consistencia global garantizada por el config + flexibilidad por pagina sin tocar el Shell |
| 7 | Sidebar en movil | Drawer deslizable desde la izquierda con backdrop oscuro | Patron estandar probado (Notion, Linear, Stripe). `isMobileOpen` es volatil — no persiste |
| 8 | Estetica del Sidebar | Fondo `slate-900` fijo independiente del tema | Ancla visual permanente — el usuario siempre sabe donde esta el menu sin importar la paleta activa |
| 9 | lodash | No se usa. Funcion manual `areActionsEqual()` en `utils.ts` | ~70KB de bundle ahorrados. Control total sobre que campos disparan re-render en el page-context-store |
| 10 | `onboarding_visto` | Campo en `preferencias JSONB` del usuario. Inicializado en `false` por `fn_vincular_usuario()` | Sin cambio de esquema — reutiliza la columna ya existente. Se setea `true` cuando el admin visita `/dashboard/sistema/bienvenida` |
| 11 | Submodulo `bienvenida` | Se agrega en esta guia como INSERT en `submodulos`. La pagina vive en `/dashboard/sistema/bienvenida` | Es parte del Shell — tiene su placeholder, su Toolbar y su entrada en el Sidebar para el administrador |
| 12 | Dashboard page | Placeholder limpio con KPI cards vacias + card-banner "Primeros pasos" si `onboarding_visto === false` | Las metricas reales requieren datos que aun no existen. El card-banner desaparece permanentemente al visitar `/sistema/bienvenida` |
| 13 | Nombre de la app | `"APP fullStack - flujo SaaS multiempresa"` en Footer, metadata del layout y branding del Topbar | Decision de branding confirmada en sesion de diseno |
| 14 | Tipos serializables en Zustand | `string[]` para `expandedGroups`. NUNCA `Set<string>` | `JSON.stringify` serializa `Set` como `{}` vacio — estado corrupto silencioso al recargar |
| 15 | Paginas placeholder | 35 paginas (todas las rutas de `submodulos` de la Guia 0.4) | El Shell se prueba navegando. Sin paginas, no se verifica que Topbar, Sidebar y Toolbar responden correctamente |

---

## ARQUITECTURA: PATRON SUPERVISOR + OPERARIOS

```
src/app/dashboard/layout.tsx  (Server Component — SUPERVISOR)
  │
  ├── await createClient() + getUser() → redirect('/login') si no hay sesion
  ├── await SELECT preferencias FROM usuarios WHERE id = auth.uid()
  │     → lee tema antes de renderizar (cero FOUC)
  │
  └── Renderiza:
        ├── ThemeInjector         ← Server Component (script inline, inyecta data-theme en HTML inicial)
        ├── AuthWrapper           ← "use client" (rehidratacion + logout multi-pestana — herencia 0.5)
        ├── Sidebar               ← "use client" (lee menu[] del auth-store + sidebar-store)
        ├── Topbar                ← "use client" (lee usuario, empresa, pageInfo, logout, tema)
        ├── Toolbar               ← "use client" (lee acciones del page-context-store)
        ├── {children}            ← La pagina actual (pedidos, clientes, bienvenida, etc.)
        └── Footer                ← Server Component (HTML puro — 0 bytes JS)
```

---

## ARQUITECTURA: FLUJO DE DATOS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ZUSTAND STORES (Cliente)                         │
│                                                                         │
│  ┌──────────────────────┐    ┌────────────────────────────────────────┐ │
│  │     AUTH STORE        │    │        PAGE CONTEXT STORE              │ │
│  │     (Guia 0.5)        │    │        (Guia 0.6 — nuevo)              │ │
│  │                       │    │                                        │ │
│  │  • usuario            │    │  • pageInfo { title, subtitle }        │ │
│  │  • usuario.empresa    │    │  • currentPath                         │ │
│  │  • menu[]             │    │  • injectedActions[]                   │ │
│  │  • permisos[]         │    │                                        │ │
│  │  • preferencias.tema  │    │  Actua como telegrafo:                 │ │
│  │  • preferencias       │    │  pagina escribe → Shell lee            │ │
│  │    .onboarding_visto  │    │                                        │ │
│  └──────┬────────────────┘    └──────────┬─────────────────────────────┘ │
│         │                               │                               │
│  ┌──────┴────────────────┐    ┌──────────┴─────────────────────────────┐ │
│  │    SIDEBAR STORE       │    │    usePageConfig (Hook — Guia 0.6)     │ │
│  │    (Guia 0.6 — nuevo)  │    │    Cada page.tsx lo llama al montar    │ │
│  │                        │    │    y limpia automaticamente al salir   │ │
│  │  • isCollapsed         │    │                                        │ │
│  │  • isMobileOpen        │    │    "Hola Toolbar, soy Pedidos,         │ │
│  │  • expandedGroups[]    │    │     estos son mis botones"             │ │
│  └────────────────────────┘    └────────────────────────────────────────┘ │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                           CONSUMIDORES                                  │
│                                                                         │
│  Sidebar      ← auth-store.menu[]  + sidebar-store                     │
│  Topbar       ← auth-store.usuario + auth-store.usuario.empresa         │
│               + page-context-store.pageInfo                             │
│  Toolbar      ← toolbar-config[ruta] + page-context-store.injectedActions│
│  ThemeToggler ← auth-store.usuario.preferencias.tema                   │
│  Avatar       ← auth-store.usuario.nombre                              │
│  Banner       ← auth-store.usuario.preferencias.onboarding_visto       │
│  Footer       ← nada (Server Component puro)                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ARQUITECTURA: SISTEMA DE TEMAS HIBRIDO

```
CAMBIO DE TEMA (usuario hace click en "Verde Bosque"):

  1. CSS instantaneo ──────────► document.setAttribute('data-theme', 'bosque-light')
     (0ms — el navegador repinta a 60fps)

  2. Zustand/localStorage ─────► actualizarPreferencias({ tema: 'bosque-light' })
     (0ms — persiste para recargas en este dispositivo)

  3. Server Action background ─► guardarTemaAction('bosque-light')
     (fire-and-forget — UPDATE usuarios SET preferencias = jsonb_set(...) en BD)

CARGA INICIAL (usuario abre la app o recarga):

  1. layout.tsx (servidor) ────► SELECT preferencias FROM usuarios WHERE id = auth.uid()
     (lee tema de BD antes de renderizar HTML)

  2. ThemeInjector ────────────► <script>document.documentElement.setAttribute('data-theme', tema)</script>
     (inyecta tema en el HTML inicial — cero FOUC)

  3. Cliente hidrata ──────────► Zustand restaura desde localStorage
     (coincide con el HTML del servidor — cero parpadeo)
```

---

## ARQUITECTURA: SISTEMA DE PLANES Y MENU

```
Plan BASICO:   modulos_incluidos = ['sistema', 'ventas', 'facturacion']
Plan PRO:      modulos_incluidos = ['sistema', 'ventas', 'compras', 'almacen', 'facturacion', 'reportes']
Plan EMPRESA:  modulos_incluidos = ['sistema', 'ventas', 'compras', 'almacen', 'logistica', 'produccion', 'facturacion', 'reportes']

obtener_sesion_completa() filtra el menu en BD:
  menu retornado = permisos_navegacion del rol ∩ modulos_incluidos del plan

El Sidebar solo renderiza lo que llega en menu[] — nunca sabe que plan tiene la empresa.
Si el admin esta en plan Basico y tiene permisos para Almacen, Almacen simplemente
no aparece en el menu hasta que el plan cambie.
```

---

## INDICE DE PARTES

### PARTE 0 — Este documento (referencia completa)
Contiene: decisiones cerradas, diagramas de arquitectura, indice de partes, manifiesto de archivos, troubleshooting, notas de soporte y guia de expansion futura.

---

### PARTE 1 — Fundamentos: Directorios + Shadcn + Tipos + Configuraciones
> **Archivo:** `GUIA_0_6_Parte1_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | Directorios | Crea `shell/`, `shell/nav/`, `config/`, `hooks/` bajo `src/` |
| 2 | Shadcn UI | Instala `Popover` y `Card` via CLI pineado |
| 3 | Verificacion | Confirma contratos heredados de la Guia 0.5 (`preferencias`, `actualizarPreferencias`, `useAuth`) |
| 4 | `src/types/shell.ts` | Tipos del Shell: `NavItemType`, `NavGroupType`, `NavEntry`, `ToolbarAction`, `PageInfo`, `ThemeValue`, `PALETTES`, `DEFAULT_THEME` |
| 5 | `src/config/icon-map.ts` | Traductor de strings de BD a componentes Lucide. Fallback `HelpCircle` si el string no esta registrado |
| 6 | `src/config/toolbar-config.ts` | Diccionario centralizado de acciones por ruta — todas las rutas de `submodulos` de la Guia 0.4 + `/dashboard/sistema/bienvenida` |
| 7 | SQL seed | INSERT del submodulo `bienvenida` en la tabla `submodulos` — se ejecuta en Supabase SQL Editor |

**Al terminar:** `npx tsc --noEmit` pasa sin errores. Los tipos y configuraciones estan listos. El submodulo `bienvenida` existe en la BD.

---

### PARTE 2 — Cerebro: Stores + Hook + Server Actions + Utils
> **Archivo:** `GUIA_0_6_Parte2_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/lib/stores/sidebar-store.ts` | Estado visual del Sidebar: `isCollapsed`, `isMobileOpen` (volatil), `expandedGroups[]`. Persistencia selectiva en `localStorage` |
| 2 | `src/lib/stores/page-context-store.ts` | Telegrafo entre paginas y el Shell. Almacena `pageInfo` y `injectedActions[]` que Topbar y Toolbar consumen |
| 3 | `src/lib/utils.ts` (extendido) | Agrega `areActionsEqual()` — comparador manual de `ToolbarAction[]` sin lodash |
| 4 | `src/hooks/usePageConfig.ts` | Hook que cada `page.tsx` llama al montar. Escribe en page-context-store y limpia al desmontar |
| 5 | `src/lib/actions/preferences.ts` | Server Action `guardarTemaAction()` — persiste el tema en `preferencias JSONB` de la BD en background |
| 6 | `src/lib/actions/shell.ts` | Server Action `marcarOnboardingVistoAction()` — setea `onboarding_visto: true` en `preferencias JSONB` |
| 7 | `src/app/globals.css` (extendido) | Agrega `.custom-scrollbar` y `.theme-transitioning` al final del archivo |

**Al terminar:** `npx tsc --noEmit` pasa sin errores. Stores, hook y Server Actions listos para ser consumidos por los componentes.

---

### PARTE 3 — Piel: Dumb Components
> **Archivo:** `GUIA_0_6_Parte3_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/components/shell/nav/NavItem.tsx` | Enlace individual del Sidebar — Dumb Component puro, recibe props, no toca stores |
| 2 | `src/components/shell/nav/NavGroup.tsx` | Acordeon de submodulos — Dumb Component, recibe `isExpanded` y `onToggle` como props |
| 3 | `src/components/shell/Avatar.tsx` | Iniciales del usuario con color generado desde el nombre — Dumb Component |
| 4 | `src/components/shell/Footer.tsx` | Server Component puro — `"APP fullStack - flujo SaaS multiempresa"`. Cero JS |
| 5 | `src/components/shell/PlaceholderModule.tsx` | Plantilla reutilizable para los 34 placeholders. Recibe `title`, `subtitle`, `icon` como props |

**Al terminar:** Fingerprint verifica que ningun Dumb Component importa Zustand, `useRouter` o Supabase.

---

### PARTE 4 — Sistema Nervioso: Smart Components + Layout
> **Archivo:** `GUIA_0_6_Parte4_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/components/shell/Sidebar.tsx` | Lee `menu[]` del auth-store, construye `NavEntry[]` con `getIcon()`, gestiona collapse/mobile con sidebar-store |
| 2 | `src/components/shell/Topbar.tsx` | Lee `usuario`, `empresa.nombre` y `pageInfo` del store. Avatar, logout, link a bienvenida si `onboarding_visto === false` |
| 3 | `src/components/shell/Toolbar.tsx` | Fusiona acciones del config con `injectedActions[]` del page-context-store. Merge por `id` |
| 4 | `src/components/shell/ThemeToggler.tsx` | Popover con grid de paletas × modos. Actualiza CSS + Zustand + BD en ese orden |
| 5 | `src/components/shell/ThemeInjector.tsx` | Script inline SSR-safe que inyecta `data-theme` antes de hydration |
| 6 | `src/components/shell/index.ts` | Barrel de exports del Shell |
| 7 | `src/app/dashboard/layout.tsx` (reemplazado) | Server Component Supervisor: verifica sesion, lee tema de BD, monta todos los Operarios |

**Al terminar:** `npx tsc --noEmit` pasa sin errores. El Shell completo esta montado — navegando a `/dashboard` se ve el Sidebar, Topbar, Toolbar y Footer.

---

### PARTE 5 — Ensamblaje: Dashboard + Bienvenida + 34 Placeholders
> **Archivo:** `GUIA_0_6_Parte5_V6.md`

| Bloque | Archivo | Descripcion |
|:-------|:--------|:------------|
| 1 | `src/app/dashboard/page.tsx` (reemplazado) | Dashboard principal: KPI cards vacias + card-banner "Primeros pasos" si `onboarding_visto === false` |
| 2 | `src/app/dashboard/sistema/bienvenida/page.tsx` | Checklist de configuracion inicial. Al visitarla llama `marcarOnboardingVistoAction()` |
| 3–36 | 34 paginas placeholder | Una por cada submodulo de la Guia 0.4. Usan `PlaceholderModule` + `usePageConfig` |

**Al terminar:** `npm run build` exitoso. El Shell esta completo y navegable.

---

## MANIFIESTO DE ARCHIVOS

### Archivos nuevos (54)

| # | Archivo | Parte |
|:-:|:--------|:-----:|
| 1 | `src/types/shell.ts` | 1 |
| 2 | `src/config/icon-map.ts` | 1 |
| 3 | `src/config/toolbar-config.ts` | 1 |
| 4 | `src/lib/stores/sidebar-store.ts` | 2 |
| 5 | `src/lib/stores/page-context-store.ts` | 2 |
| 6 | `src/hooks/usePageConfig.ts` | 2 |
| 7 | `src/lib/actions/preferences.ts` | 2 |
| 8 | `src/lib/actions/shell.ts` | 2 |
| 9 | `src/components/shell/nav/NavItem.tsx` | 3 |
| 10 | `src/components/shell/nav/NavGroup.tsx` | 3 |
| 11 | `src/components/shell/Avatar.tsx` | 3 |
| 12 | `src/components/shell/Footer.tsx` | 3 |
| 13 | `src/components/shell/PlaceholderModule.tsx` | 3 |
| 14 | `src/components/shell/Sidebar.tsx` | 4 |
| 15 | `src/components/shell/Topbar.tsx` | 4 |
| 16 | `src/components/shell/Toolbar.tsx` | 4 |
| 17 | `src/components/shell/ThemeToggler.tsx` | 4 |
| 18 | `src/components/shell/ThemeInjector.tsx` | 4 |
| 19 | `src/components/shell/index.ts` | 4 |
| 20 | `src/app/dashboard/sistema/bienvenida/page.tsx` | 5 |
| 21 | `src/app/dashboard/sistema/empresa/page.tsx` | 5 |
| 22 | `src/app/dashboard/sistema/usuarios/page.tsx` | 5 |
| 23 | `src/app/dashboard/sistema/roles/page.tsx` | 5 |
| 24 | `src/app/dashboard/sistema/permisos/page.tsx` | 5 |
| 25 | `src/app/dashboard/sistema/suscripcion/page.tsx` | 5 |
| 26 | `src/app/dashboard/ventas/clientes/page.tsx` | 5 |
| 27 | `src/app/dashboard/ventas/productos/page.tsx` | 5 |
| 28 | `src/app/dashboard/ventas/listas-precios/page.tsx` | 5 |
| 29 | `src/app/dashboard/ventas/cotizaciones/page.tsx` | 5 |
| 30 | `src/app/dashboard/ventas/pedidos/page.tsx` | 5 |
| 31 | `src/app/dashboard/ventas/promociones/page.tsx` | 5 |
| 32 | `src/app/dashboard/compras/proveedores/page.tsx` | 5 |
| 33 | `src/app/dashboard/compras/ordenes/page.tsx` | 5 |
| 34 | `src/app/dashboard/compras/recepcion/page.tsx` | 5 |
| 35 | `src/app/dashboard/compras/devoluciones/page.tsx` | 5 |
| 36 | `src/app/dashboard/almacen/inventario/page.tsx` | 5 |
| 37 | `src/app/dashboard/almacen/entradas/page.tsx` | 5 |
| 38 | `src/app/dashboard/almacen/salidas/page.tsx` | 5 |
| 39 | `src/app/dashboard/almacen/ajustes/page.tsx` | 5 |
| 40 | `src/app/dashboard/almacen/transferencias/page.tsx` | 5 |
| 41 | `src/app/dashboard/logistica/envios/page.tsx` | 5 |
| 42 | `src/app/dashboard/logistica/rutas/page.tsx` | 5 |
| 43 | `src/app/dashboard/logistica/repartidores/page.tsx` | 5 |
| 44 | `src/app/dashboard/logistica/evidencias/page.tsx` | 5 |
| 45 | `src/app/dashboard/produccion/ordenes/page.tsx` | 5 |
| 46 | `src/app/dashboard/produccion/formulas/page.tsx` | 5 |
| 47 | `src/app/dashboard/produccion/materiales/page.tsx` | 5 |
| 48 | `src/app/dashboard/produccion/rendimiento/page.tsx` | 5 |
| 49 | `src/app/dashboard/facturacion/facturas/page.tsx` | 5 |
| 50 | `src/app/dashboard/facturacion/remisiones/page.tsx` | 5 |
| 51 | `src/app/dashboard/facturacion/notas-credito/page.tsx` | 5 |
| 52 | `src/app/dashboard/facturacion/pagos/page.tsx` | 5 |
| 53 | `src/app/dashboard/facturacion/cobranza/page.tsx` | 5 |
| 54 | `src/app/dashboard/reportes/page.tsx` | 5 |

### Archivos reemplazados (2)

| # | Archivo | Parte | Por que se reemplaza |
|:-:|:--------|:-----:|:---------------------|
| 1 | `src/app/dashboard/layout.tsx` | 4 | El layout minimo de la Guia 0.5 (solo `AuthWrapper`) se reemplaza con el Shell completo: verificacion server-side + Sidebar + Topbar + Toolbar + Footer |
| 2 | `src/app/dashboard/page.tsx` | 5 | El placeholder de validacion de la Guia 0.5 se reemplaza con el dashboard real con `usePageConfig` y card-banner de bienvenida |

### Archivos extendidos (2)

| # | Archivo | Parte | Que se agrega |
|:-:|:--------|:-----:|:-------------|
| 1 | `src/lib/utils.ts` | 2 | Funcion `areActionsEqual()` — comparador de `ToolbarAction[]` sin lodash |
| 2 | `src/app/globals.css` | 2 | Clases `.custom-scrollbar` y `.theme-transitioning` al final del archivo |

### Archivos verificados (2)

| # | Archivo | Que se verifica |
|:-:|:--------|:---------------|
| 1 | `src/types/auth.ts` | `Usuario` tiene `preferencias: { tema: string, onboarding_visto: boolean }` |
| 2 | `src/lib/stores/auth-store.ts` | Exporta `actualizarPreferencias()` y el hook `useAuth(selector)` |

### SQL ejecutado en Supabase (1)

| # | Que | Parte |
|:-:|:----|:-----:|
| 1 | INSERT submodulo `sistema.bienvenida` en tabla `submodulos` | 1 |

---

## REGLAS ESTRICTAS DE ESTA GUIA

1. **NO** reescribir `auth-store.ts` ni `types/auth.ts` desde cero. Solo se extienden con los campos `onboarding_visto` si faltaran.
2. **NO** usar `getSession()` en ningun archivo del servidor. La regla ESLint de la Guia 0.1 lo prohibe — usar `getUser()`.
3. **NO** usar `lodash`. La funcion `areActionsEqual()` en `utils.ts` es el reemplazo aprobado.
4. **NO** usar `Set<>` dentro de Zustand con persistencia. Usar `string[]` — `JSON.stringify` no serializa `Set`.
5. **NO** devolver arrays generados al vuelo en selectores Zustand sin memoizacion. Causa loops infinitos de re-render.
6. **NO** cambiar el atributo CSS `data-theme` por otro nombre. Es el estandar integrado con `next-themes` desde la Guia 0.1.
7. **NO** inventar variables CSS. Las 4 paletas × 2 modos ya estan en `globals.css` desde la Guia 0.1.
8. **NO** conectar Dumb Components a Zustand, `useRouter` o Supabase. Deben vivir estrictamente de props.
9. **NO** avanzar al siguiente bloque sin pasar el Fingerprint.
10. **NO** usar `@latest` en ningun comando `npx` o `npm install`. Usar versiones pineadas.
11. **NO** ejecutar `npx shadcn init`. Solo `npx shadcn@2.5.0 add <componente>` — el `init` destruye `tailwind.config.ts`.

---

## DEPENDENCIAS

Esta guia **no instala dependencias npm nuevas**. Todo fue instalado en guias anteriores:

| Paquete | Instalado en | Uso en 0.6 |
|:--------|:-------------|:-----------|
| `next-themes` | Guia 0.1 | `useTheme()` en ThemeToggler para controlar light/dark |
| `lucide-react` | Guia 0.1 | Iconos en Sidebar, Toolbar, Topbar, Avatar |
| `zustand` | Guia 0.2 | `sidebar-store`, `page-context-store` |
| `sonner` | Guia 0.2 | Toast de confirmacion en logout |
| `lodash` | ❌ NO se instala | Reemplazado por `areActionsEqual()` en `utils.ts` |

### Componentes Shadcn (instalados en Parte 1)

| Componente | Archivo | Proposito |
|:-----------|:--------|:----------|
| `Popover` | `src/components/ui/popover.tsx` | Contenedor flotante del ThemeToggler en el Topbar |
| `Card` | `src/components/ui/card.tsx` | Tarjetas en Dashboard + estructura de placeholders |

---

## LO QUE NO SE TOCA

| Componente | Por que no cambia |
|:-----------|:------------------|
| `proxy.ts` | Solo verifica autenticacion. Los guards RBAC de ruta son Guia 0.7 |
| `auth-store.ts` | Ya tiene `tienePermiso()`, `puedeVerPagina()`, `actualizarPreferencias()` desde la Guia 0.5 |
| `obtener_sesion_completa()` | Ya retorna `menu[]` filtrado por rol y plan desde la Guia 0.4 |
| `fn_vincular_usuario()` | Ya inicializa `preferencias` con `onboarding_visto: false` — correccion aplicada |
| `fn_onboarding_empresa()` | Ya siembra permisos para los 8 roles — correccion aplicada |
| `OnboardingForm.tsx` | Ya tiene guard de redireccion si el usuario tiene empresa — correccion aplicada |
| `tailwind.config.ts` | El sistema de 3 capas semantico de la Guia 0.1 no se modifica |
| `globals.css` (existente) | Solo se extiende al final — no se modifica el contenido existente |

---

## GUIA DE EXPANSION FUTURA

Agregar un modulo nuevo al ERP (ej: Logistica Avanzada, RRHH) sin tocar el Shell:

**Paso 1 — Base de datos (Supabase SQL Editor)**
```sql
-- 1a. Registrar el módulo
INSERT INTO modulos (clave, nombre, icono, orden)
VALUES ('rrhh', 'Recursos Humanos', 'Users2', 9);

-- 1b. Registrar sus submódulos
INSERT INTO submodulos (id_modulo, clave, nombre, href, icono, orden) VALUES
    ((SELECT id FROM modulos WHERE clave = 'rrhh'), 'rrhh.empleados', 'Empleados', '/dashboard/rrhh/empleados', 'UserCircle', 1),
    ((SELECT id FROM modulos WHERE clave = 'rrhh'), 'rrhh.nomina',    'Nómina',    '/dashboard/rrhh/nomina',    'DollarSign', 2);

-- 1c. El admin asigna permisos desde Sistema → Permisos (Guía 0.8+)
--     O se agregan manualmente en permisos_navegacion + permisos_acciones
```

**Paso 2 — `icon-map.ts`** (solo si los iconos son nuevos)
```typescript
import { Users2, UserCircle } from 'lucide-react'
export const iconMap = { ...existente, 'Users2': Users2, 'UserCircle': UserCircle }
```

**Paso 3 — `toolbar-config.ts`** (definir acciones del modulo)
```typescript
'/dashboard/rrhh/empleados': [
    { id: 'nuevo', label: 'Nuevo', icon: Plus, accion: 'crear', variant: 'default' },
],
```

**Paso 4 — Crear las paginas**
```
src/app/dashboard/rrhh/empleados/page.tsx  ← importa PlaceholderModule + usePageConfig
src/app/dashboard/rrhh/nomina/page.tsx
```

**Lo que NO se toca:** Sidebar (lee `menu[]` automaticamente), Topbar, Toolbar, Layout, Auth, CSS.

---

## TROUBLESHOOTING

| Error | Causa | Solucion |
|:------|:------|:---------|
| Hydration mismatch en Sidebar | El Sidebar lee del store antes de que el cliente hidrate | Agregar guard `useSyncExternalStore` para detectar si es cliente antes de renderizar |
| Infinite re-render en Toolbar | Selector Zustand devuelve array nuevo en cada render | Usar `useMemo` para memoizar la fusion de acciones base + inyectadas |
| `'use server'` error en preferences.ts | La directiva no esta en la linea 1 absoluta | Mover `'use server'` a la primera linea, sin comentarios ni espacios antes |
| `expandedGroups` se pierde al recargar | Se uso `Set` en lugar de `Array` en Zustand persist | Usar `string[]` — `JSON.stringify` no serializa `Set` |
| Sidebar muestra menu vacio | `auth-store` no tiene `menu[]` poblado | Verificar que `obtener_sesion_completa()` retorna datos y que `setAuth()` fue llamado en `AuthWrapper` |
| FOUC al recargar (parpadeo de tema) | `ThemeInjector` no recibe el tema correcto | Verificar que el layout server lee `preferencias` de BD y la pasa al `ThemeInjector` |
| `Cannot find module '@/config/icon-map'` | Falta el directorio `src/config/` | Ejecutar Bloque 1 de la Parte 1 antes de continuar |
| Toolbar no muestra botones | La pagina no llama a `usePageConfig` con `path` correcto | Verificar que el `path` coincide exactamente con el `href` en `toolbar-config.ts` |
| Sidebar no ajusta layout al colapsar | Falta clase `group` en el div contenedor | Verificar que el div raiz del Shell en `layout.tsx` tiene `className="group flex h-svh ..."` |
| `bg-muted/20` no aplica transparencia | `tailwind.config.ts` sin `<alpha-value>` en definiciones de color | Verificar Guia 0.1 Bloque 6 — el formato debe ser `hsl(var(--color-xxx) / <alpha-value>)` |
| Banner "Primeros pasos" no desaparece | `marcarOnboardingVistoAction()` no actualiza el store local | Despues de la Server Action, llamar `actualizarPreferencias({ onboarding_visto: true })` en el store |
| Submodulo `bienvenida` no aparece en Sidebar | No se ejecuto el INSERT en `submodulos` o el rol no tiene permiso de navegacion | Ejecutar el SQL del Bloque 7 de la Parte 1 y verificar `permisos_navegacion` del rol administrador |
| Tab del navegador sin titulo | Falta `export const metadata` en `dashboard/layout.tsx` | Agregar `metadata = { title: 'Dashboard | APP fullStack' }` |
| Footer muestra como Client Component | Se agrego `"use client"` al Footer | Eliminar la directiva — el Footer debe ser Server Component puro |

---

## NOTAS DE SOPORTE

| Tema | Detalle |
|:-----|:--------|
| **ThemeSwitcher de 0.1** | Queda obsoleto — reemplazado funcionalmente por `ThemeToggler` (Popover en el Topbar). El archivo original no se elimina, solo deja de importarse en `app/layout.tsx` |
| **Dashboard page de 0.5** | Reemplazado completamente. El placeholder de validacion con datos del store queda obsoleto |
| **Dashboard layout de 0.5** | Reemplazado. El layout minimo (solo AuthWrapper) se expande con el Shell completo |
| **PlaceholderModule** | Componente temporal. Cada placeholder se reemplaza individualmente en las Guias 0.8+ (Gestion de Usuarios), 1.x (Ventas), 2.x (Almacen), etc. |
| **toolbar-config.ts** | Es estatico en 0.6. En 0.7, los botones se cruzan con `tienePermiso()` para ocultar acciones no autorizadas — sin modificar este archivo |
| **Submodulo bienvenida** | Solo visible para el rol `administrador` — sus `permisos_navegacion` incluyen `sistema.bienvenida`. Los demas roles no lo ven en el Sidebar. El admin puede compartir el link directamente si necesita |
| **onboarding_visto** | Inicializado en `false` por `fn_vincular_usuario()`. Se setea `true` via `marcarOnboardingVistoAction()` al visitar `/dashboard/sistema/bienvenida`. Persiste en `preferencias JSONB` del usuario |
| **Versiones pineadas** | No se instalan dependencias npm nuevas. Los componentes Shadcn (`Popover`, `Card`) se agregan via CLI `npx shadcn@2.5.0` |

---

## SIGUIENTE GUIA

**-> Guia 0.7 — RBAC Guards Reales**

Activa la capa de seguridad visual del ERP. El `RBACGuard` centralizado protege todas las rutas del dashboard, el Toolbar filtra automaticamente botones no autorizados con `tienePermiso()`, y la pagina `/dashboard/sin-acceso` recibe a usuarios rechazados. El Shell de la 0.6 ya esta listo para recibir estos guards sin modificaciones.

---

> **Documento:** GUIA_0_6_Parte0_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
