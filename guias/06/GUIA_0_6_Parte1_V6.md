# GUIA 0.6 — APP SHELL: SIDEBAR, TOPBAR, TOOLBAR Y SISTEMA DE TEMAS
## PARTE 1: FUNDAMENTOS — DIRECTORIOS, SHADCN, TIPOS Y CONFIGURACIONES

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 1 de 5
> **Prerequisito:** Guia 0.5 completada — `npm run build` exitoso, flujo registro → onboarding → dashboard funciona
> **Prerequisito adicional (Guia 0.4):** Tablas `submodulos` y `modulos` con datos seed ejecutados (Parte 6). Sin ellas el INSERT del Bloque 7 falla.
> **Siguiente parte:** `GUIA_0_6_Parte2_V6.md` — Cerebro: Stores + Hook + Server Actions + Utils
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte establece los **fundamentos estaticos** del Shell: la estructura de carpetas, los componentes UI nuevos, la verificacion de contratos heredados de la Guia 0.5, y los tres archivos de configuracion que el resto de la guia consumira sin volver a tocar. Tambien se registra en la BD el submodulo `bienvenida` que esta guia introduce.

- **Bloque 1 — Directorios:** Crea `shell/`, `shell/nav/`, `config/` y `hooks/` bajo `src/`. Sin esta estructura los imports de las Partes 2–5 no resuelven.
- **Bloque 2 — Shadcn UI:** Instala `Popover` y `Card` como archivos `.tsx` locales. `Popover` lo usa el `ThemeToggler` (Parte 4); `Card` lo usan el Dashboard y los placeholders (Parte 5).
- **Bloque 3 — Verificacion:** Confirma que la Guia 0.5 dejo `preferencias` con `onboarding_visto` en `auth.ts` y `actualizarPreferencias` en el auth-store. Son contratos que esta guia asume que existen.
- **Bloque 4 — `src/types/shell.ts`:** Define todos los tipos TypeScript del Shell. Es la capa mas baja del grafo de dependencias — solo importa de `lucide-react`.
- **Bloque 5 — `src/config/icon-map.ts`:** Traduce strings de iconos de la BD a componentes Lucide. Cubre todos los iconos de los seeds de la Guia 0.4. Fallback `HelpCircle` si el string no esta registrado.
- **Bloque 6 — `src/config/toolbar-config.ts`:** Declara los botones de accion base para todas las rutas del ERP incluyendo `/dashboard/sistema/bienvenida`.
- **Bloque 7 — SQL seed `bienvenida`:** INSERT del submodulo en la tabla `submodulos`. Se ejecuta en Supabase SQL Editor — no es un archivo del proyecto.

> **Al terminar esta parte:** `npx tsc --noEmit` pasa sin errores. Los Bloques 4, 5 y 6 no se vuelven a tocar en el resto de la guia.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — ESTRUCTURA DE DIRECTORIOS

📄 **ACCION** — Crear estructura de carpetas

**Proposito:** Crear las carpetas que organizan el codigo del Shell. Sin ellas, los imports de los Bloques siguientes fallan en tiempo de compilacion.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Estructura de directorios |
| Ejecuta en | Solo compilacion (estructura de proyecto) |
| Si lo modificas | Las Partes 2–5 fallan con errores de modulo no encontrado si alguna carpeta no existe |

### DECISIONES DE DISENO

**Por que `shell/nav/` separado de `shell/`?**
La subcarpeta `nav/` aisla los Dumb Components de navegacion (`NavItem`, `NavGroup`) de los Smart Components del Shell (`Sidebar`, `Topbar`). Refuerza el patron arquitectonico de la guia: los Dumb Components no deben importar stores ni hooks.

```powershell
New-Item -ItemType Directory -Force -Path "src/components/shell/nav"
New-Item -ItemType Directory -Force -Path "src/config"
New-Item -ItemType Directory -Force -Path "src/hooks"
Write-Host "✅ Directorios del Shell creados" -ForegroundColor Green
Write-Host "📁 shell/nav/ — NavItem y NavGroup (Dumb Components de navegación)" -ForegroundColor Cyan
Write-Host "📁 config/    — icon-map y toolbar-config (configuraciones estáticas)" -ForegroundColor Cyan
Write-Host "📁 hooks/     — usePageConfig (hook de comunicación página → Shell)" -ForegroundColor Cyan
```

---

## BLOQUE 2 — COMPONENTES SHADCN UI

📄 **ACCION** — Instalar Popover y Card

**Proposito:** Instalar `Popover` y `Card` como archivos `.tsx` locales en `src/components/ui/`. Ninguna guia anterior los necesito — se instalan ahora porque esta guia los requiere por primera vez.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente UI base |
| Ejecuta en | Browser |
| Importado por | `ThemeToggler.tsx` (Popover — Parte 4), `Dashboard page` y `PlaceholderModule` (Card — Parte 5) |
| Si lo modificas | Si falla la instalacion, `ThemeToggler` no compila (Popover) y los placeholders del dashboard no tienen estructura de tarjeta (Card) |

### DECISIONES DE DISENO

**Por que `@2.5.0` y no `@latest`?**
Las versiones pineadas garantizan que el CLI genera exactamente los mismos archivos en cualquier maquina. `@latest` puede romper el output entre sesiones.

> **⚠️ Instruccion especial:** El archivo `components.json` debe existir en la raiz (creado en Guia 0.1 Bloque 6.1). Sin el, el CLI lanza un prompt interactivo que interrumpe el proceso. Si no existe, recrearlo segun la Guia 0.1 antes de continuar.

```powershell
npx shadcn@2.5.0 add popover card -y
Write-Host "✅ Popover y Card instalados en src/components/ui/" -ForegroundColor Green
Write-Host "🧩 Popover → ThemeToggler (Parte 4)" -ForegroundColor Cyan
Write-Host "🧩 Card    → Dashboard + Placeholders (Parte 5)" -ForegroundColor Cyan
```

---

## BLOQUE 3 — VERIFICACION DE CONTRATOS DE LA GUIA 0.5

📄 **ACCION** — Verificar contratos heredados

**Proposito:** Confirmar que los archivos de la Guia 0.5 contienen lo que esta guia necesita antes de construir sobre ellos. Si alguna verificacion falla, corregir en la Guia 0.5 antes de continuar.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Verificacion |
| Ejecuta en | Solo compilacion |
| Contrato | Verifica que `auth.ts` tenga `preferencias.onboarding_visto`, que `auth-store.ts` exporte `actualizarPreferencias()` y `useAuth()` |
| Si lo modificas | No aplica — script de verificacion, no archivo de produccion |

```powershell
# Verificar onboarding_visto en types/auth.ts
$prefsCheck = Select-String -Path "src/types/auth.ts" -Pattern "onboarding_visto" -Quiet
if ($prefsCheck) {
    Write-Host "  ✅ auth.ts → preferencias.onboarding_visto existe" -ForegroundColor Green
} else {
    Write-Host "  ❌ auth.ts → onboarding_visto FALTANTE" -ForegroundColor Red
    Write-Host "     Agregar 'onboarding_visto: boolean' al tipo preferencias en Usuario" -ForegroundColor Yellow
}

# Verificar actualizarPreferencias en auth-store
$storePrefs = Select-String -Path "src/lib/stores/auth-store.ts" -Pattern "actualizarPreferencias" -Quiet
if ($storePrefs) {
    Write-Host "  ✅ auth-store.ts → actualizarPreferencias existe" -ForegroundColor Green
} else {
    Write-Host "  ❌ auth-store.ts → actualizarPreferencias FALTANTE" -ForegroundColor Red
}

# Verificar hook useAuth
$hookCheck = Select-String -Path "src/lib/stores/auth-store.ts" -Pattern "useAuth" -Quiet
if ($hookCheck) {
    Write-Host "  ✅ auth-store.ts → useAuth existe" -ForegroundColor Green
} else {
    Write-Host "  ❌ auth-store.ts → useAuth FALTANTE" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si alguna verificacion falla, no continuar. Volver a la Guia 0.5 y corregir los contratos antes de seguir.

---

## BLOQUE 4 — TIPOS DEL SHELL

📄 **ARCHIVO COMPLETO** — `src/types/shell.ts`

**Proposito:** Centralizar en un unico archivo todos los contratos TypeScript que el App Shell necesita. Al vivir separado de `auth.ts`, los componentes del Shell importan de `shell.ts` sin riesgo de dependencias ciclicas con el auth-store.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Tipos TypeScript |
| Ejecuta en | Solo compilacion — ningun runtime |
| Importado por | `icon-map.ts`, `toolbar-config.ts`, `sidebar-store.ts`, `page-context-store.ts`, `usePageConfig.ts`, `Sidebar.tsx`, `Topbar.tsx`, `Toolbar.tsx`, `ThemeToggler.tsx`, `ThemeInjector.tsx`, `NavItem.tsx`, `NavGroup.tsx`, `PlaceholderModule.tsx`, todas las paginas placeholder |
| Importa de | `lucide-react` |
| Contrato | Exporta `NavItemType`, `NavGroupType`, `NavEntry`, `ToolbarAction`, `PageInfo`, `AccionBasica`, `ToolbarButtonVariant`, `PaletteId`, `ThemeMode`, `ThemeValue`, `PaletteConfig`, `PALETTES`, `DEFAULT_THEME` |
| Si lo modificas | Build falla en todos los archivos del Shell. Es la capa mas baja del grafo de dependencias — ningun otro archivo del proyecto depende de el hacia arriba |

### DECISIONES DE DISENO

**Por que separado de `auth.ts`?**
`auth.ts` = contratos del dominio de negocio. `shell.ts` = contratos de la capa visual. Si vivieran juntos, cualquier cambio en la interfaz de usuario romperia el tipo de sesion y viceversa.

**Por que `ThemeValue` es un template literal type?**
TypeScript infiere automaticamente las 6 combinaciones validas (`'slate-light'`, `'ocean-dark'`, etc.) sin listarlas manualmente. Agregar una paleta nueva solo requiere actualizar `PaletteId`.

```powershell
$content = @'
import type { LucideIcon } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// src/types/shell.ts
// Contratos TypeScript del App Shell — Guía 0.6
//
// SECCIONES:
//   1. Navegación visual  — tipos que renderiza el Sidebar
//   2. Toolbar            — acciones e inversión de control
//   3. Sistema de temas   — paletas, modos y ThemeValue compuesto
//   4. Constantes         — PALETTES y DEFAULT_THEME (fuente de verdad única)
//
// DEPENDENCIA ÚNICA: lucide-react
// No importa auth.ts ni stores — evita ciclos de dependencia.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 1 — NAVEGACIÓN VISUAL
// Tipos que el Sidebar usa para renderizar el menú.
// No vienen directamente de la BD — son la representación visual de
// MenuModulo[] (auth-store), transformada por Sidebar.tsx con getIcon().
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enlace individual del Sidebar.
 * Corresponde a un submódulo de la tabla 'submodulos' (Guía 0.4).
 * 'isActive' lo calcula Sidebar.tsx comparando href vs pathname actual.
 */
export interface NavItemType {
    id: string
    label: string
    href: string
    icon: LucideIcon
    isActive?: boolean
}

/**
 * Grupo colapsable del Sidebar (acordeón).
 * Corresponde a un módulo de la tabla 'modulos' con sus submódulos hijos.
 * 'isExpanded' lo controla sidebar-store.ts y persiste en localStorage.
 */
export interface NavGroupType {
    id: string
    label: string
    icon: LucideIcon
    items: NavItemType[]
    isExpanded?: boolean
}

/**
 * Unión discriminada: permite al Sidebar manejar con un solo .map()
 * tanto NavItemType (enlace directo, ej: Dashboard) como
 * NavGroupType (acordeón, ej: Ventas con sus submódulos).
 *
 * Uso en Sidebar.tsx:
 *   if (entry.type === 'link')  → <NavItem  />
 *   if (entry.type === 'group') → <NavGroup />
 */
export type NavEntry =
    | (NavItemType & { type: 'link' })
    | (NavGroupType & { type: 'group' })

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 2 — TOOLBAR E INVERSIÓN DE CONTROL
// El Toolbar no sabe qué botones mostrar por sí solo. Recibe su config
// desde dos fuentes: toolbar-config.ts (base estática por ruta) y
// usePageConfig (inyección dinámica por página en runtime).
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Las 5 acciones del sistema RBAC definidas en la Guía 0.4 (tabla 'acciones').
 * En la Guía 0.7, tienePermiso(href, accion) usa este campo para
 * decidir si el botón es visible para el usuario actual.
 */
export type AccionBasica = 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar'

/**
 * Variantes visuales para botones del Toolbar.
 * Subconjunto de variantes de shadcn/ui Button.
 *
 *   default     → Acción primaria (ej: "Nuevo", "Registrar Pago")
 *   secondary   → Acción secundaria (ej: "Editar", "Ver Detalle")
 *   destructive → Acción irreversible (ej: "Eliminar", "Cancelar CFDI")
 *   ghost       → Acción de consulta (ej: "Exportar", "Imprimir")
 */
export type ToolbarButtonVariant = 'default' | 'secondary' | 'destructive' | 'ghost'

/**
 * Contrato de un botón de acción en el Toolbar.
 *
 * Campos obligatorios: id, label, icon, variant.
 * Campos opcionales:
 *   accion            → clave RBAC. La Guía 0.7 la evalúa con tienePermiso().
 *   requiresSelection → si true, el botón se deshabilita sin fila seleccionada.
 *   onClick           → handler. Puede venir del config o ser sobreescrito
 *                       por la página vía usePageConfig (merge por id).
 *   disabled          → deshabilitar manualmente (ej: operación en progreso).
 */
export interface ToolbarAction {
    id: string
    label: string
    icon: LucideIcon
    variant: ToolbarButtonVariant
    accion?: AccionBasica
    requiresSelection?: boolean
    onClick?: () => void
    disabled?: boolean
}

/**
 * Metadata que cada página inyecta al Topbar vía usePageConfig.
 * El Topbar lee este objeto del page-context-store y lo renderiza
 * como título principal + subtítulo descriptivo.
 */
export interface PageInfo {
    title: string
    subtitle?: string
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 3 — SISTEMA SEMÁNTICO DE TEMAS
// Formato compuesto "paleta-modo" (ej: 'ocean-dark').
// La paleta determina los colores de la marca.
// El modo determina el contraste (light/dark).
//
// CORRECCIÓN (Parche 18 Abril 2026):
// Se reemplazaron las 4 paletas del proyecto anterior
// (azul, monocromo, bosque, pizarra) por las 3 paletas reales
// definidas en globals.css de la Guía 0.1 (slate, zinc, ocean).
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Las 3 paletas de color definidas en globals.css (Guía 0.1, Parte 3, Bloque 9).
 *
 * Activación en el DOM:
 *   slate → paleta default — NO requiere data-theme (es el bloque :root)
 *   zinc  → data-theme="zinc"
 *   ocean → data-theme="ocean"
 *
 * Para agregar una paleta nueva:
 *   1. Definir su bloque [data-theme="nueva"] en globals.css con sus variables HSL
 *   2. Agregar 'nueva' aquí a PaletteId
 *   3. Agregar su entrada al array PALETTES (Sección 4)
 *   4. Actualizar handlePaletteChange en ThemeToggler.tsx si la nueva paleta es el default
 */
export type PaletteId = 'slate' | 'zinc' | 'ocean'

/**
 * Modo de contraste. next-themes lo controla vía la clase .dark en <html>.
 * El valor guardado en BD y localStorage siempre es el modo resuelto
 * ('light' o 'dark') — nunca 'system', porque 'system' es una preferencia
 * del selector, no un estado persistible.
 */
export type ThemeMode = 'light' | 'dark'

/**
 * Tipo compuesto que se persiste en BD (preferencias.tema) y localStorage.
 * TypeScript infiere automáticamente las 6 combinaciones válidas (3 × 2):
 *   'slate-light' | 'slate-dark' | 'zinc-light' |
 *   'zinc-dark'   | 'ocean-light' | 'ocean-dark'
 *
 * El split('-')[0] en ThemeToggler.tsx extrae el PaletteId del valor compuesto.
 * El split('-')[1] extrae el ThemeMode.
 */
export type ThemeValue = `${PaletteId}-${ThemeMode}`

/**
 * Configuración de una paleta para el selector visual del ThemeToggler.
 *
 * 'previewColor' es el hex del color primario de la paleta — pinta el
 * círculo de previsualización en el grid de selección del Popover.
 * Es un color fijo (excepción documentada a la regla de no usar colores
 * hardcodeados): representa visualmente la identidad de la paleta, no
 * es un token de tema que deba cambiar con el modo.
 */
export interface PaletteConfig {
    id: PaletteId
    label: string
    /** Hex del acento primario de la paleta — solo para el dot de preview. */
    previewColor: string
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 4 — CONSTANTES EXPORTADAS
// Una única fuente de verdad para paletas disponibles y tema por defecto.
// Consumidores: ThemeToggler.tsx, ThemeInjector.tsx, dashboard/layout.tsx
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Catálogo de las 3 paletas disponibles en el selector de temas.
 * El ThemeToggler itera este array para construir el grid de botones.
 *
 * previewColor debe coincidir con el acento primario (--color-primary-accent)
 * definido en globals.css para cada paleta:
 *   slate → índigo  221° 83% 53% → #4F6BDB
 *   zinc  → ámbar    32° 95% 40% → #C07A1A
 *   ocean → teal    178° 72% 34% → #1A9E8F
 */
export const PALETTES: PaletteConfig[] = [
    { id: 'slate', label: 'Slate', previewColor: '#4F6BDB' },
    { id: 'zinc',  label: 'Zinc',  previewColor: '#C07A1A' },
    { id: 'ocean', label: 'Ocean', previewColor: '#1A9E8F' },
]

/**
 * Tema aplicado cuando el usuario no tiene preferencia guardada en BD.
 * Coincide con el CSS base de globals.css: paleta slate (bloque :root), modo light.
 *
 * Usado por:
 *   - src/app/dashboard/layout.tsx  → SSR, pasa el tema al ThemeInjector
 *   - src/components/shell/ThemeInjector.tsx → aplica data-theme antes de React
 *   - src/components/shell/ThemeToggler.tsx  → fallback del currentPalette
 */
export const DEFAULT_THEME: ThemeValue = 'slate-light'
'@

New-Item -Path "src/types/shell.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/types/shell.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/types/shell.ts corregido" -ForegroundColor Green
Write-Host "🎨 PaletteId actualizado: slate | zinc | ocean (era: azul | monocromo | bosque | pizarra)" -ForegroundColor Cyan
Write-Host "🎨 PALETTES: 3 entradas con previewColor correctos desde globals.css Guía 0.1" -ForegroundColor Cyan
Write-Host "⚙️  DEFAULT_THEME: 'slate-light' (era: 'azul-light')" -ForegroundColor Cyan
Write-Host "🔗 ThemeInjector.tsx y layout.tsx se corrigen automáticamente al importar este archivo" -ForegroundColor Cyan
```

---

## BLOQUE 5 — TRADUCTOR DE ICONOS

📄 **ARCHIVO COMPLETO** — `src/config/icon-map.ts`

**Proposito:** La Base de Datos almacena los iconos como strings (`"ShoppingCart"`, `"Package"`). Este archivo es el puente que traduce esos strings a componentes React de Lucide en tiempo de render.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Config |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | `Sidebar.tsx`, `Topbar.tsx`, `NavItem.tsx`, `NavGroup.tsx` |
| Importa de | `lucide-react` |
| Contrato | Exporta `iconMap` (Record string → LucideIcon) y `getIcon(iconName)` (funcion helper con fallback `HelpCircle`) |
| Si lo modificas | Si se elimina o renombra una key sin actualizar los imports, el icono correspondiente mostrara `HelpCircle` (fallback) |

### DECISIONES DE DISENO

**Por que modulo independiente y no inline en el Sidebar?**
Si manana un icono de la BD cambia de nombre, hay un unico lugar donde corregirlo. Centralizacion sin complejidad adicional.

```powershell
$content = @'
import {
    // Módulos (nivel superior del Sidebar)
    Settings, ShoppingCart, ShoppingBag, Package,
    Truck, Factory, FileText, BarChart3,
    // Sistema
    LayoutDashboard, Building2, Users, Shield, Lock, CreditCard,
    Rocket,
    // Ventas
    UsersRound, Box, Tags, FileSearch, Percent,
    // Compras
    Handshake, ClipboardList, PackageCheck, PackageX,
    // Almacén
    Warehouse, LogIn, LogOut, SlidersHorizontal, ArrowLeftRight,
    // Logística
    MapPin, UserCheck, Camera,
    // Producción
    ClipboardCheck, FlaskConical, Layers, TrendingUp,
    // Facturación
    FileMinus, FileMinus2, Banknote, DollarSign,
    // Fallback — se muestra cuando el string de la BD no está registrado
    HelpCircle,
    type LucideIcon,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// MAPA DE ÍCONOS
// Cada key es un string exacto de la columna 'icono' en las tablas
// 'modulos' y 'submodulos' (seeds Guía 0.4 Parte 6).
//
// Para agregar un módulo nuevo al ERP:
//   1. Insertar el módulo/submódulo en BD con su icono (ej: 'Users2')
//   2. Importar Users2 de lucide-react arriba
//   3. Agregar 'Users2': Users2 aquí
// ═══════════════════════════════════════════════════════════════════════════
export const iconMap: Record<string, LucideIcon> = {
    // ── Módulos ───────────────────────────────────────────────────────────
    'Settings':          Settings,
    'ShoppingCart':      ShoppingCart,
    'ShoppingBag':       ShoppingBag,
    'Package':           Package,
    'Truck':             Truck,
    'Factory':           Factory,
    'FileText':          FileText,
    'BarChart3':         BarChart3,

    // ── Sistema ───────────────────────────────────────────────────────────
    'LayoutDashboard':   LayoutDashboard,
    'Building2':         Building2,
    'Users':             Users,
    'Shield':            Shield,
    'Lock':              Lock,
    'CreditCard':        CreditCard,
    'Rocket':            Rocket,           // Submódulo bienvenida (Guía 0.6)

    // ── Ventas ────────────────────────────────────────────────────────────
    'UsersRound':        UsersRound,
    'Box':               Box,
    'Tags':              Tags,
    'FileSearch':        FileSearch,
    'Percent':           Percent,

    // ── Compras ───────────────────────────────────────────────────────────
    'Handshake':         Handshake,
    'ClipboardList':     ClipboardList,
    'PackageCheck':      PackageCheck,
    'PackageX':          PackageX,

    // ── Almacén ───────────────────────────────────────────────────────────
    'Warehouse':         Warehouse,
    'LogIn':             LogIn,
    'LogOut':            LogOut,
    'SlidersHorizontal': SlidersHorizontal,
    'ArrowLeftRight':    ArrowLeftRight,

    // ── Logística ─────────────────────────────────────────────────────────
    'MapPin':            MapPin,
    'UserCheck':         UserCheck,
    'Camera':            Camera,

    // ── Producción ────────────────────────────────────────────────────────
    'ClipboardCheck':    ClipboardCheck,
    'FlaskConical':      FlaskConical,
    'Layers':            Layers,
    'TrendingUp':        TrendingUp,

    // ── Facturación ───────────────────────────────────────────────────────
    'FileMinus':         FileMinus,
    'FileMinus2':        FileMinus2,
    'Banknote':          Banknote,
    'DollarSign':        DollarSign,
}

/**
 * Resuelve un string de la BD a un componente de ícono Lucide.
 * Retorna HelpCircle si el string no está en el mapa —
 * un ícono visible es mejor que un crash silencioso en el Sidebar.
 */
export function getIcon(iconName: string | undefined | null): LucideIcon {
    if (!iconName) return HelpCircle
    return iconMap[iconName] ?? HelpCircle
}
'@

New-Item -Path "src/config/icon-map.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/config/icon-map.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/config/icon-map.ts creado" -ForegroundColor Green
Write-Host "🗺️  45 íconos registrados — cubre todos los seeds de la Guía 0.4 + bienvenida" -ForegroundColor Cyan
Write-Host "🛡️  Fallback HelpCircle — un ícono faltante en BD no rompe el Sidebar" -ForegroundColor Cyan
```

---

## BLOQUE 6 — CONFIGURACION CENTRALIZADA DEL TOOLBAR

📄 **ARCHIVO COMPLETO** — `src/config/toolbar-config.ts`

**Proposito:** Diccionario centralizado que define que botones muestra el Toolbar segun la ruta actual. Es la fuente de verdad que garantiza consistencia de variantes de acciones en todo el ERP.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Config |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | `Toolbar.tsx` (Parte 4) |
| Importa de | `lucide-react`, `@/types/shell` |
| Contrato | Exporta `toolbarConfig` (Record string → ToolbarAction[]) y `getToolbarActions(pathname)` (helper con fallback a array vacio) |
| Si lo modificas | Los botones del Toolbar cambian globalmente. Si una ruta se elimina del config, esa pagina se queda sin botones base |

### DECISIONES DE DISENO

**Por que centralizado y no en cada `page.tsx`?**
Con 35+ paginas, cada una definiendo sus propios botones sin referencia garantiza inconsistencias. Este config es la fuente unica que garantiza que "Eliminar" siempre es `destructive` y "Nuevo" siempre es `default` en todo el sistema.

```powershell
$content = @'
import {
    Plus, Edit, Trash2, Download, UserPlus,
    Eye, CheckCircle, XCircle, Send, RefreshCw,
    Receipt, Printer,
} from 'lucide-react'
import type { ToolbarAction } from '@/types/shell'

// ═══════════════════════════════════════════════════════════════════════════
// TOOLBAR CONFIG
// Key: href exacto de la tabla 'submodulos' (Guía 0.4).
// Value: acciones base del Toolbar para esa ruta.
//
// El campo 'accion' corresponde a las claves de la tabla 'acciones' en BD.
// En Guía 0.7, tienePermiso(href, accion) filtrará estos botones
// según los permisos del usuario — sin modificar este archivo.
//
// 'requiresSelection: true' → botón deshabilitado sin fila seleccionada.
// La lógica de selección la implementa cada página en Guías 1.x+.
// ═══════════════════════════════════════════════════════════════════════════
export const toolbarConfig: Record<string, ToolbarAction[]> = {

    // ── SISTEMA ───────────────────────────────────────────────────────────
    // Dashboard y Bienvenida sin acciones — son páginas de lectura
    '/dashboard':                      [],
    '/dashboard/sistema/bienvenida':   [],

    '/dashboard/sistema/empresa': [
        { id: 'editar', label: 'Editar Empresa', icon: Edit, accion: 'editar', variant: 'default' },
    ],

    '/dashboard/sistema/usuarios': [
        { id: 'invitar',    label: 'Invitar',    icon: UserPlus,    accion: 'crear',  variant: 'default' },
        { id: 'editar',     label: 'Editar',     icon: Edit,        accion: 'editar', variant: 'secondary',   requiresSelection: true },
        { id: 'activar',    label: 'Activar',    icon: CheckCircle, accion: 'editar', variant: 'secondary',   requiresSelection: true },
        { id: 'desactivar', label: 'Desactivar', icon: XCircle,     accion: 'editar', variant: 'destructive', requiresSelection: true },
    ],

    '/dashboard/sistema/roles': [
        { id: 'ver', label: 'Ver Detalle', icon: Eye, accion: 'ver', variant: 'secondary', requiresSelection: true },
    ],

    '/dashboard/sistema/permisos': [
        { id: 'ver', label: 'Ver Detalle', icon: Eye, accion: 'ver', variant: 'secondary', requiresSelection: true },
    ],

    '/dashboard/sistema/suscripcion': [
        { id: 'ver', label: 'Ver Plan', icon: Eye, accion: 'ver', variant: 'secondary' },
    ],

    // ── VENTAS ────────────────────────────────────────────────────────────
    '/dashboard/ventas/clientes': [
        { id: 'nuevo',    label: 'Nuevo',    icon: Plus,   accion: 'crear',    variant: 'default' },
        { id: 'editar',   label: 'Editar',   icon: Edit,   accion: 'editar',   variant: 'secondary',   requiresSelection: true },
        { id: 'ver',      label: 'Ver',      icon: Eye,    accion: 'ver',      variant: 'ghost',       requiresSelection: true },
        { id: 'eliminar', label: 'Eliminar', icon: Trash2, accion: 'eliminar', variant: 'destructive', requiresSelection: true },
    ],

    '/dashboard/ventas/productos': [
        { id: 'nuevo',    label: 'Nuevo',    icon: Plus,     accion: 'crear',    variant: 'default' },
        { id: 'editar',   label: 'Editar',   icon: Edit,     accion: 'editar',   variant: 'secondary', requiresSelection: true },
        { id: 'exportar', label: 'Exportar', icon: Download, accion: 'exportar', variant: 'ghost' },
    ],

    '/dashboard/ventas/listas-precios': [
        { id: 'nueva',  label: 'Nueva',  icon: Plus, accion: 'crear',  variant: 'default' },
        { id: 'editar', label: 'Editar', icon: Edit, accion: 'editar', variant: 'secondary', requiresSelection: true },
    ],

    '/dashboard/ventas/cotizaciones': [
        { id: 'nueva',    label: 'Nueva',    icon: Plus,     accion: 'crear',    variant: 'default' },
        { id: 'editar',   label: 'Editar',   icon: Edit,     accion: 'editar',   variant: 'secondary',  requiresSelection: true },
        { id: 'exportar', label: 'Exportar', icon: Download, accion: 'exportar', variant: 'ghost' },
    ],

    '/dashboard/ventas/pedidos': [
        { id: 'nuevo',    label: 'Nuevo',    icon: Plus,    accion: 'crear',  variant: 'default' },
        { id: 'editar',   label: 'Editar',   icon: Edit,    accion: 'editar', variant: 'secondary',  requiresSelection: true },
        { id: 'imprimir', label: 'Imprimir', icon: Printer, accion: 'ver',    variant: 'ghost',      requiresSelection: true },
    ],

    '/dashboard/ventas/promociones': [
        { id: 'nueva',      label: 'Nueva',      icon: Plus,        accion: 'crear',  variant: 'default' },
        { id: 'editar',     label: 'Editar',     icon: Edit,        accion: 'editar', variant: 'secondary',   requiresSelection: true },
        { id: 'activar',    label: 'Activar',    icon: CheckCircle, accion: 'editar', variant: 'secondary',   requiresSelection: true },
        { id: 'desactivar', label: 'Desactivar', icon: XCircle,     accion: 'editar', variant: 'destructive', requiresSelection: true },
    ],

    // ── COMPRAS ───────────────────────────────────────────────────────────
    '/dashboard/compras/proveedores': [
        { id: 'nuevo',    label: 'Nuevo',    icon: Plus,   accion: 'crear',    variant: 'default' },
        { id: 'editar',   label: 'Editar',   icon: Edit,   accion: 'editar',   variant: 'secondary',   requiresSelection: true },
        { id: 'eliminar', label: 'Eliminar', icon: Trash2, accion: 'eliminar', variant: 'destructive', requiresSelection: true },
    ],

    '/dashboard/compras/ordenes': [
        { id: 'nueva',    label: 'Nueva Orden', icon: Plus,     accion: 'crear',    variant: 'default' },
        { id: 'editar',   label: 'Editar',      icon: Edit,     accion: 'editar',   variant: 'secondary', requiresSelection: true },
        { id: 'exportar', label: 'Exportar',    icon: Download, accion: 'exportar', variant: 'ghost' },
    ],

    '/dashboard/compras/recepcion': [
        { id: 'recibir', label: 'Recibir', icon: CheckCircle, accion: 'editar', variant: 'default', requiresSelection: true },
    ],

    '/dashboard/compras/devoluciones': [
        { id: 'nueva',    label: 'Nueva',    icon: Plus,     accion: 'crear',    variant: 'default' },
        { id: 'exportar', label: 'Exportar', icon: Download, accion: 'exportar', variant: 'ghost' },
    ],

    // ── ALMACÉN ───────────────────────────────────────────────────────────
    '/dashboard/almacen/inventario': [
        { id: 'movimientos', label: 'Movimientos', icon: RefreshCw, accion: 'ver',      variant: 'secondary', requiresSelection: true },
        { id: 'exportar',    label: 'Exportar',    icon: Download,  accion: 'exportar', variant: 'ghost' },
    ],

    '/dashboard/almacen/entradas': [
        { id: 'nueva', label: 'Nueva Entrada', icon: Plus, accion: 'crear', variant: 'default' },
    ],

    '/dashboard/almacen/salidas': [
        { id: 'nueva', label: 'Nueva Salida', icon: Plus, accion: 'crear', variant: 'default' },
    ],

    '/dashboard/almacen/ajustes': [
        { id: 'nuevo', label: 'Nuevo Ajuste', icon: Plus, accion: 'crear', variant: 'default' },
    ],

    '/dashboard/almacen/transferencias': [
        { id: 'nueva', label: 'Nueva Transferencia', icon: Plus, accion: 'crear', variant: 'default' },
    ],

    // ── LOGÍSTICA ─────────────────────────────────────────────────────────
    '/dashboard/logistica/envios': [
        { id: 'preparar', label: 'Preparar',     icon: Send,        accion: 'editar', variant: 'default',   requiresSelection: true },
        { id: 'listo',    label: 'Marcar Listo', icon: CheckCircle, accion: 'editar', variant: 'secondary', requiresSelection: true },
    ],

    '/dashboard/logistica/rutas': [
        { id: 'nueva', label: 'Nueva Ruta', icon: Plus, accion: 'crear', variant: 'default' },
    ],

    '/dashboard/logistica/repartidores': [
        { id: 'nuevo',  label: 'Nuevo',  icon: Plus, accion: 'crear',  variant: 'default' },
        { id: 'editar', label: 'Editar', icon: Edit, accion: 'editar', variant: 'secondary', requiresSelection: true },
    ],

    '/dashboard/logistica/evidencias': [
        { id: 'ver', label: 'Ver Evidencia', icon: Eye, accion: 'ver', variant: 'secondary', requiresSelection: true },
    ],

    // ── PRODUCCIÓN ────────────────────────────────────────────────────────
    '/dashboard/produccion/ordenes': [
        { id: 'nueva',  label: 'Nueva Orden', icon: Plus, accion: 'crear',  variant: 'default' },
        { id: 'editar', label: 'Editar',      icon: Edit, accion: 'editar', variant: 'secondary', requiresSelection: true },
    ],

    '/dashboard/produccion/formulas': [
        { id: 'nueva',  label: 'Nueva Fórmula', icon: Plus, accion: 'crear',  variant: 'default' },
        { id: 'editar', label: 'Editar',         icon: Edit, accion: 'editar', variant: 'secondary', requiresSelection: true },
    ],

    '/dashboard/produccion/materiales': [
        { id: 'ver',      label: 'Ver',      icon: Eye,      accion: 'ver',      variant: 'secondary', requiresSelection: true },
        { id: 'exportar', label: 'Exportar', icon: Download, accion: 'exportar', variant: 'ghost' },
    ],

    '/dashboard/produccion/rendimiento': [
        { id: 'exportar', label: 'Exportar', icon: Download, accion: 'exportar', variant: 'ghost' },
    ],

    // ── FACTURACIÓN ───────────────────────────────────────────────────────
    '/dashboard/facturacion/facturas': [
        { id: 'nueva',    label: 'Nueva',    icon: Plus,    accion: 'crear',    variant: 'default' },
        { id: 'ver-xml',  label: 'Ver XML',  icon: Eye,     accion: 'ver',      variant: 'secondary',   requiresSelection: true },
        { id: 'cancelar', label: 'Cancelar', icon: XCircle, accion: 'eliminar', variant: 'destructive', requiresSelection: true },
    ],

    '/dashboard/facturacion/remisiones': [
        { id: 'nueva', label: 'Nueva', icon: Plus, accion: 'crear', variant: 'default' },
        { id: 'ver',   label: 'Ver',   icon: Eye,  accion: 'ver',   variant: 'secondary', requiresSelection: true },
    ],

    '/dashboard/facturacion/notas-credito': [
        { id: 'nueva', label: 'Nueva', icon: Plus, accion: 'crear', variant: 'default' },
    ],

    '/dashboard/facturacion/pagos': [
        { id: 'registrar', label: 'Registrar Pago', icon: Receipt,  accion: 'crear',    variant: 'default' },
        { id: 'exportar',  label: 'Exportar',       icon: Download, accion: 'exportar', variant: 'ghost' },
    ],

    '/dashboard/facturacion/cobranza': [
        { id: 'nueva-gestion', label: 'Nueva Gestión', icon: Plus,     accion: 'crear',    variant: 'default' },
        { id: 'exportar',      label: 'Exportar',      icon: Download, accion: 'exportar', variant: 'ghost' },
    ],

    // ── REPORTES ──────────────────────────────────────────────────────────
    '/dashboard/reportes': [
        { id: 'exportar', label: 'Exportar', icon: Download, accion: 'exportar', variant: 'ghost' },
    ],
}

/**
 * Retorna las acciones base para una ruta.
 * Si la ruta no está en el config, retorna array vacío — sin crash.
 * El Toolbar muestra solo el path sin botones, lo cual es correcto.
 */
export function getToolbarActions(pathname: string): ToolbarAction[] {
    return toolbarConfig[pathname] ?? []
}
'@

New-Item -Path "src/config/toolbar-config.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/config/toolbar-config.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/config/toolbar-config.ts creado" -ForegroundColor Green
Write-Host "🧩 35 rutas configuradas — todos los submódulos de la Guía 0.4 + bienvenida" -ForegroundColor Cyan
Write-Host "🔐 Claves RBAC (accion) listas para tienePermiso() en Guía 0.7" -ForegroundColor Cyan
```

---

## BLOQUE 7 — SQL SEED: SUBMODULO BIENVENIDA

📄 **SCRIPT SQL** — Ejecutar en Supabase SQL Editor

**Proposito:** Registrar el submodulo `bienvenida` en la tabla global `submodulos`. Sin este registro, la ruta `/dashboard/sistema/bienvenida` no aparece en el menu de ningun usuario aunque la pagina exista en Next.js.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | SQL/Migracion |
| Ejecuta en | PostgreSQL (Supabase SQL Editor) |
| Si lo modificas | Si el INSERT falla, el submodulo no aparece en el Sidebar. Si los permisos no se actualizan para empresas existentes, los admins creados antes de este INSERT no ven la ruta |

### DECISIONES DE DISENO

**Por que los permisos del admin se actualizan en el segundo bloque?**
El trigger `fn_onboarding_empresa()` siembra permisos para todos los submodulos *activos al momento de crear la empresa*. Las empresas creadas antes de este INSERT no tendran este submodulo en sus permisos — el segundo query lo corrige.

```sql
-- ============================================================================
-- GUÍA 0.6 — PARTE 1, BLOQUE 7: SEED SUBMÓDULO BIENVENIDA
-- Tabla global — aplica a todas las empresas en la plataforma.
-- ============================================================================

-- Insertar el submódulo (seguro si se ejecuta más de una vez)
INSERT INTO submodulos (id_modulo, clave, nombre, href, icono, orden)
VALUES (
    (SELECT id FROM modulos WHERE clave = 'sistema'),
    'sistema.bienvenida',
    'Bienvenida',
    '/dashboard/sistema/bienvenida',
    'Rocket',
    0   -- orden 0: aparece primero dentro del módulo Sistema
)
ON CONFLICT (href) DO NOTHING;

-- ── Para empresas YA existentes (desarrollo) ──────────────────────────────
-- Agrega permisos de navegación al administrador de todas las empresas existentes.
INSERT INTO permisos_navegacion (id_empresa, id_rol, id_submodulo)
SELECT
    r.id_empresa,
    r.id         AS id_rol,
    s.id         AS id_submodulo
FROM roles r
CROSS JOIN submodulos s
WHERE r.nombre = 'administrador'
  AND s.clave  = 'sistema.bienvenida'
ON CONFLICT (id_empresa, id_rol, id_submodulo) DO NOTHING;

-- Agrega permiso de acción 'ver' al administrador
INSERT INTO permisos_acciones (id_empresa, id_rol, id_submodulo, id_accion)
SELECT
    r.id_empresa,
    r.id         AS id_rol,
    s.id         AS id_submodulo,
    a.id         AS id_accion
FROM roles r
CROSS JOIN submodulos s
CROSS JOIN acciones a
WHERE r.nombre = 'administrador'
  AND s.clave  = 'sistema.bienvenida'
  AND a.clave  = 'ver'
ON CONFLICT (id_empresa, id_rol, id_submodulo, id_accion) DO NOTHING;
```

---

## FINGERPRINT — VALIDACION PARTE 1

```powershell
Write-Host "`n=== VALIDACIÓN PARTE 1 ===" -ForegroundColor Yellow

$items = @(
    "src/components/shell/nav",
    "src/config",
    "src/hooks",
    "src/components/ui/popover.tsx",
    "src/components/ui/card.tsx",
    "src/types/shell.ts",
    "src/config/icon-map.ts",
    "src/config/toolbar-config.ts"
)

$allOk = $true
foreach ($item in $items) {
    if (Test-Path $item) { Write-Host "  ✅ $item" -ForegroundColor Green }
    else {
        Write-Host "  ❌ $item NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

if ($allOk) { Write-Host "`n✅ PARTE 1 COMPLETA — continuar con Parte 2" -ForegroundColor Green }
else        { Write-Host "`n❌ PARTE 1 INCOMPLETA — revisar los ❌ antes de continuar" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si `shell.ts` falta, las Partes 2–5 no compilaran. Si `popover.tsx` o `card.tsx` faltan, ejecutar `npx shadcn@2.5.0 add popover card -y` verificando que `components.json` existe en la raiz.

---

## RESUMEN DE ESTA PARTE

| Archivo / Elemento | Estado |
|:-------------------|:------:|
| `src/components/shell/nav/` | NUEVO |
| `src/config/` | NUEVO |
| `src/hooks/` | NUEVO |
| `src/components/ui/popover.tsx` | NUEVO (Shadcn CLI) |
| `src/components/ui/card.tsx` | NUEVO (Shadcn CLI) |
| `src/types/shell.ts` | NUEVO |
| `src/config/icon-map.ts` | NUEVO |
| `src/config/toolbar-config.ts` | NUEVO |
| Submodulo `sistema.bienvenida` en BD | NUEVO (SQL) |

---

## SIGUIENTE PARTE

**-> Parte 2** — Cerebro: Stores + Hook + Server Actions + Utils

Se crean los dos stores Zustand nuevos (`sidebar-store`, `page-context-store`), el hook `usePageConfig`, las dos Server Actions (`guardarTemaAction`, `marcarOnboardingVistoAction`), y se extienden `utils.ts` y `globals.css`.

---

> **Documento:** GUIA_0_6_Parte1_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
