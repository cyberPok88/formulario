# GUIA 0.6 — APP SHELL: SIDEBAR, TOPBAR, TOOLBAR Y SISTEMA DE TEMAS
## PARTE 3: PIEL — DUMB COMPONENTS

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 3 de 5
> **Prerequisito:** Parte 2 completada — `npx tsc --noEmit` sin errores, stores y Server Actions existentes
> **Siguiente parte:** `GUIA_0_6_Parte4_V6.md` — Sistema Nervioso: Smart Components + Layout
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte construye la **capa visual pura** del Shell: los cinco componentes presentacionales que solo reciben props y se pintan. No saben nada de Zustand, Next.js ni Supabase — son los ladrillos que los Smart Components de la Parte 4 ensamblaran y conectaran a los stores.

- **Bloque 1 — `NavItem.tsx`:** Enlace individual del Sidebar. Reacciona a `isActive` con color primario e indicador lateral, y a `isCollapsed` mostrando solo icono o icono + texto.
- **Bloque 2 — `NavGroup.tsx`:** Acordeon de modulo. Agrupa varios `NavItem` bajo un padre colapsable. Si algun hijo esta activo, el padre se remarca visualmente.
- **Bloque 3 — `Avatar.tsx`:** Circulo con las iniciales del usuario en el color primario de la paleta activa. Indicador verde de sesion activa.
- **Bloque 4 — `Footer.tsx`:** Pie de pagina estatico — **Server Component puro**, 0 bytes de JavaScript.
- **Bloque 5 — `PlaceholderModule.tsx`:** Plantilla reutilizable para las 34 paginas placeholder. Cada `page.tsx` le pasa su configuracion y este componente dibuja la estructura completa.

> **Al terminar esta parte:** Cinco componentes existen y compilan sin errores. Ninguno importa Zustand, `useRouter` ni Supabase — el Fingerprint lo verifica explicitamente.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## REGLA CRITICA DE ESTA PARTE

Todos los componentes son **Dumb Components**. Su contrato es estricto: viven exclusivamente de las props que reciben.

Estan **prohibidas** las siguientes dependencias en cualquiera de estos cinco archivos:

- Stores de Zustand — `useSidebarStore`, `useAuth`, `usePageContextStore` o cualquier otro
- Hooks de Next.js — `useRouter`, `usePathname`, `useSearchParams`
- Cliente de Supabase — `createClient` o cualquier import de `@/lib/supabase`
- Logica de negocio o RBAC

**Por que esta separacion?**
Un Dumb Component es predecible, testeable en aislamiento y reutilizable en cualquier contexto. Si `NavItem` necesita saber si esta activo, recibe `isActive={true}` como prop — es el `Sidebar.tsx` (Smart Component, Parte 4) quien calcula ese valor. El Dumb Component solo lo pinta.

---

## BLOQUE 1 — NAVITEM

📄 **ARCHIVO COMPLETO** — `src/components/shell/nav/NavItem.tsx`

**Proposito:** Enlace individual del Sidebar. Cada submodulo de la BD se renderiza como un `NavItem`. Es el componente mas granular de la navegacion.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente Dumb |
| Patron | Dumb Component |
| Ejecuta en | Browser |
| Importado por | `NavGroup.tsx` (Parte 3), `Sidebar.tsx` (Parte 4) |
| Importa de | `next/link`, `@/lib/utils`, `@/types/shell` |
| Contrato | Exporta `NavItem` — componente con props `item`, `isCollapsed`, `onClick` |
| Si lo modificas | Afecta la apariencia de todos los enlaces del Sidebar. Si se cambian las props requeridas, `Sidebar.tsx` y `NavGroup.tsx` deben actualizarse |

### DECISIONES DE DISENO

**Por que colores fijos `slate-*` en lugar de clases semanticas?**
El Sidebar usa un fondo institucional `slate-900` fijo independiente del tema activo. Por eso los colores de hover y activo usan valores de la escala `slate` — son deliberados, no un olvido. La excepcion es `text-primary-accent` para el icono activo, que si adopta el color de la paleta.

**Por que `title` nativo como tooltip?**
En estado colapsado el label desaparece. El atributo `title` del navegador muestra el texto al hacer hover sin necesidad de librerias externas de tooltip.

```powershell
$content = @'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { NavItemType } from '@/types/shell'

// ═══════════════════════════════════════════════════════════════════════════
// NavItem — Dumb Component (sin stores, sin router, sin Supabase)
// Enlace individual del menú lateral.
// Estado activo e isCollapsed vienen como props desde Sidebar.tsx (Smart).
// ═══════════════════════════════════════════════════════════════════════════

interface NavItemProps {
    item: NavItemType
    isCollapsed: boolean
    onClick?: () => void
}

/**
 * Enlace individual del Sidebar.
 * - Colapsado: solo ícono centrado con tooltip nativo (title attribute).
 * - Activo: fondo slate-800 + indicador lateral de 4px + ícono en primary-accent.
 */
export function NavItem({ item, isCollapsed, onClick }: NavItemProps) {
    return (
        <Link
            href={item.href}
            onClick={onClick}
            // Tooltip nativo en estado colapsado — sin librería extra
            title={isCollapsed ? item.label : undefined}
            className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                item.isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                isCollapsed ? "justify-center" : "justify-start"
            )}
        >
            <item.icon
                className={cn(
                    "shrink-0",
                    isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                    // Ícono activo: color primario de la paleta activa (semántico)
                    // Ícono inactivo: slate fijo (el Sidebar tiene fondo institucional)
                    item.isActive
                        ? "text-primary-accent"
                        : "text-slate-400 group-hover:text-slate-200"
                )}
            />

            {/* Texto: desaparece cuando el Sidebar está colapsado */}
            {!isCollapsed && <span>{item.label}</span>}

            {/* Indicador de selección: barra vertical de 4px al borde izquierdo */}
            {item.isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-md bg-primary-accent" />
            )}
        </Link>
    )
}
'@

New-Item -Path "src/components/shell/nav/NavItem.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/nav/NavItem.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/nav/NavItem.tsx creado" -ForegroundColor Green
Write-Host "🔗 Enlace activo/colapsado con indicador lateral y tooltip nativo" -ForegroundColor Cyan
Write-Host "🚫 Sin imports de Zustand, useRouter ni Supabase — Dumb Component puro" -ForegroundColor Cyan
```

---

## BLOQUE 2 — NAVGROUP

📄 **ARCHIVO COMPLETO** — `src/components/shell/nav/NavGroup.tsx`

**Proposito:** Acordeon de modulo que agrupa varios `NavItem` bajo un padre colapsable (ej: "Ventas" agrupa "Clientes", "Productos", "Pedidos"). El estado de expansion lo controla `Sidebar.tsx` via `sidebar-store` — este componente solo recibe `group.isExpanded` como prop.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente Dumb |
| Patron | Dumb Component |
| Ejecuta en | Browser |
| Importado por | `Sidebar.tsx` (Parte 4) |
| Importa de | `lucide-react`, `@/lib/utils`, `./NavItem`, `@/types/shell` |
| Contrato | Exporta `NavGroup` — componente con props `group`, `isCollapsed`, `onToggle`, `onItemClick` |
| Si lo modificas | Afecta el comportamiento de acordeon de todos los modulos del Sidebar |

### DECISIONES DE DISENO

**Por que `onToggle` y `onItemClick` son props y no acciones del store?**
Este componente no sabe que store llama — solo dispara los handlers que recibe. Es `Sidebar.tsx` quien los conecta a `toggleGroup()` del sidebar-store y al cierre del drawer movil respectivamente. Eso hace el componente testeable en aislamiento.

```powershell
$content = @'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NavItem } from './NavItem'
import type { NavGroupType } from '@/types/shell'

// ═══════════════════════════════════════════════════════════════════════════
// NavGroup — Dumb Component (sin stores, sin router, sin Supabase)
// Acordeón de módulo. El estado de expansión llega por prop desde Sidebar.tsx.
// ═══════════════════════════════════════════════════════════════════════════

interface NavGroupProps {
    group: NavGroupType
    isCollapsed: boolean
    onToggle: () => void
    onItemClick?: () => void
}

/**
 * Acordeón de módulo del Sidebar.
 * - Hijo activo: padre se pinta en blanco + ícono en primary-accent.
 * - Expandido: hijos con indentación ml-4 y línea de conexión visual.
 * - Sidebar colapsado: solo ícono del módulo con tooltip nativo.
 */
export function NavGroup({ group, isCollapsed, onToggle, onItemClick }: NavGroupProps) {
    // Si algún hijo está activo, el padre se remarca aunque el acordeón esté cerrado
    const hasActiveChild = group.items.some((item) => item.isActive)

    return (
        <div className="flex flex-col gap-0.5">
            {/* Botón padre del acordeón */}
            <button
                type="button"
                onClick={onToggle}
                title={isCollapsed ? group.label : undefined}
                className={cn(
                    "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    hasActiveChild
                        ? "text-white"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                    isCollapsed ? "justify-center" : "justify-between"
                )}
            >
                <div className="flex items-center">
                    <group.icon
                        className={cn(
                            "shrink-0",
                            isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3",
                            hasActiveChild
                                ? "text-primary-accent"
                                : "text-slate-400 group-hover:text-slate-200"
                        )}
                    />
                    {/* Label: oculto cuando el Sidebar está colapsado */}
                    {!isCollapsed && <span>{group.label}</span>}
                </div>

                {/* Flecha de colapso: solo visible cuando el Sidebar está expandido */}
                {!isCollapsed && (
                    <div className="shrink-0 transition-transform duration-200">
                        {group.isExpanded
                            ? <ChevronDown className="h-4 w-4 opacity-50" />
                            : <ChevronRight className="h-4 w-4 opacity-50" />
                        }
                    </div>
                )}
            </button>

            {/* Hijos: solo si el grupo está expandido Y el Sidebar NO está colapsado */}
            {group.isExpanded && !isCollapsed && (
                <div className="ml-4 flex flex-col gap-0.5 border-l border-slate-700 pl-2 mt-0.5">
                    {group.items.map((item) => (
                        <NavItem
                            key={item.id}
                            item={item}
                            isCollapsed={false}
                            onClick={onItemClick}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
'@

New-Item -Path "src/components/shell/nav/NavGroup.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/nav/NavGroup.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/nav/NavGroup.tsx creado" -ForegroundColor Green
Write-Host "🗂️  Acordeón con 3 estados: hijo activo, expandido con hijos, sidebar colapsado" -ForegroundColor Cyan
Write-Host "🚫 Sin imports de Zustand, useRouter ni Supabase — Dumb Component puro" -ForegroundColor Cyan
```

---

## BLOQUE 3 — AVATAR

📄 **ARCHIVO COMPLETO** — `src/components/shell/Avatar.tsx`

**Proposito:** Circulo de identificacion del usuario que muestra sus iniciales sobre el color primario de la paleta activa. Se usa en el Topbar (Parte 4) como indicador visual de sesion.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente Dumb |
| Patron | Dumb Component |
| Ejecuta en | Browser |
| Importado por | `Topbar.tsx` (Parte 4) |
| Importa de | Nada — archivo autosuficiente, solo interfaces inline |
| Contrato | Exporta `Avatar` — componente con props `nombre`, `apellidos?`, `size?` |
| Si lo modificas | Afecta el avatar del usuario en el Topbar |

### DECISIONES DE DISENO

**Por que tres tamanos como prop?**
`sm` para el Topbar, `md` y `lg` para uso futuro en paginas de perfil. Centralizar los tamanos evita duplicar clases en cada consumidor.

```powershell
$content = @'
// ═══════════════════════════════════════════════════════════════════════════
// Avatar — Dumb Component (sin stores, sin router, sin Supabase)
// Iniciales del usuario sobre el color primario de la paleta activa.
// ═══════════════════════════════════════════════════════════════════════════

interface AvatarProps {
    nombre: string
    apellidos?: string
    size?: 'sm' | 'md' | 'lg'
}

/**
 * Calcula las iniciales del usuario en 3 casos:
 *   - nombre + apellidos → primera letra de cada uno ("Bruno Pineda" → "BP")
 *   - solo nombre, más de 1 letra → primeras 2 letras ("Bruno" → "BR")
 *   - solo nombre, 1 letra → esa letra ("X" → "X")
 */
function getInitials(nombre: string, apellidos?: string): string {
    const n = nombre.trim().charAt(0).toUpperCase()
    if (apellidos && apellidos.trim().length > 0) {
        return `${n}${apellidos.trim().charAt(0).toUpperCase()}`
    }
    return nombre.trim().length > 1
        ? `${n}${nombre.trim().charAt(1).toUpperCase()}`
        : n
}

const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
}

export function Avatar({ nombre, apellidos, size = 'md' }: AvatarProps) {
    return (
        <div
            className={`relative inline-flex items-center justify-center overflow-hidden rounded-full bg-primary-accent text-white ${sizeClasses[size]}`}
            title={`${nombre} ${apellidos || ''}`.trim()}
        >
            <span className="font-semibold select-none">
                {getInitials(nombre, apellidos)}
            </span>
            {/* Indicador de sesión activa: punto verde con borde que adopta el color de fondo.
                border-background crea la ilusión de separación entre punto y círculo
                independientemente de la paleta activa. */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-success" />
        </div>
    )
}
'@

New-Item -Path "src/components/shell/Avatar.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/Avatar.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/Avatar.tsx creado" -ForegroundColor Green
Write-Host "👤 Iniciales en 3 casos: nombre+apellidos, solo nombre, una letra" -ForegroundColor Cyan
Write-Host "🟢 Indicador sesión con border-background — compatible con todas las paletas" -ForegroundColor Cyan
```

---

## BLOQUE 4 — FOOTER

📄 **ARCHIVO COMPLETO** — `src/components/shell/Footer.tsx`

**Proposito:** Pie de pagina estatico del ERP. Es el unico componente del Shell que es un **Server Component puro** — no lleva `"use client"`, aporta 0 bytes de JavaScript al bundle y el ano se calcula en servidor.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente Dumb (Server) |
| Patron | Dumb Component |
| Ejecuta en | Servidor (Server Component puro — 0 bytes JS) |
| Importado por | `dashboard/layout.tsx` (Parte 4) |
| Importa de | Nada — sin dependencias |
| Contrato | Exporta `Footer` — componente sin props |
| Si lo modificas | Afecta el pie de pagina en todas las rutas del dashboard |

### DECISIONES DE DISENO

**Por que Server Component y no Client?**
Un footer estatico no necesita interactividad. Enviarlo como HTML puro elimina el costo de hidratacion en el cliente. Es el caso de uso ideal para Server Components: contenido estatico visible en todas las paginas.

> **⚠️ Instruccion especial:** Este archivo no debe recibir nunca `"use client"`. Si se necesita agregar interactividad futura, crear un componente hijo Client y montarlo dentro — el Footer como contenedor debe permanecer Server Component.

```powershell
$content = @'
// ═══════════════════════════════════════════════════════════════════════════
// Footer — Server Component Puro (sin "use client")
// 0 bytes de JavaScript — se envía como HTML estático.
// El año se calcula en servidor — siempre actualizado sin lógica client-side.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Pie de página estático del ERP.
 * Server Component puro — no tiene directiva "use client".
 * No modificar: si se necesita interactividad, agregar un componente hijo Client.
 */
export function Footer() {
    // El año se calcula en el servidor en tiempo de render — nunca desactualizado
    const currentYear = new Date().getFullYear()

    return (
        <footer className="h-10 border-t border-border bg-background flex items-center justify-between px-6 text-xs text-muted-foreground shrink-0 z-10 w-full">
            <span>APP fullStack - flujo SaaS multiempresa</span>
            <div className="flex gap-4">
                <span>© {currentYear}</span>
                {/* Versión oculta en móvil — el espacio es limitado */}
                <span className="hidden sm:inline-block">Versión 5.0</span>
            </div>
        </footer>
    )
}
'@

New-Item -Path "src/components/shell/Footer.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/Footer.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/Footer.tsx creado" -ForegroundColor Green
Write-Host "⚡ Server Component puro — 0 bytes de JavaScript en el bundle del cliente" -ForegroundColor Cyan
Write-Host "📅 Año calculado en servidor — siempre actualizado sin lógica client-side" -ForegroundColor Cyan
```

---

## BLOQUE 5 — PLACEHOLDER MODULE

📄 **ARCHIVO COMPLETO** — `src/components/shell/PlaceholderModule.tsx`

**Proposito:** Plantilla reutilizable que evita duplicar ~60 lineas de layout en cada una de las 34 paginas placeholder. Cada `page.tsx` le pasa su configuracion y este componente dibuja la estructura completa con el badge "En construccion".

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Componente Dumb |
| Patron | Dumb Component |
| Ejecuta en | Browser |
| Importado por | Todas las 34 paginas placeholder (Parte 5), `dashboard/page.tsx` |
| Importa de | `@/components/ui/card`, `lucide-react` |
| Contrato | Exporta `PlaceholderModule` (componente), `PlaceholderColumn`, `PlaceholderRow` (tipos) |
| Si lo modificas | Afecta la apariencia de todas las 34 paginas placeholder del ERP |

### DECISIONES DE DISENO

**Por que `columns` y `rows` como props y no hardcodeados?**
Cada modulo tiene columnas distintas (Pedidos: numero, cliente, estado vs Productos: clave, nombre, precio). Recibirlos como props permite que cada `page.tsx` defina los datos relevantes para su contexto sin duplicar el layout de Card + tabla.

```powershell
$content = @'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// PlaceholderModule — Dumb Component (sin stores, sin router, sin Supabase)
// Plantilla reutilizable para las 34 páginas de módulos en construcción.
// Se reemplaza individualmente por fase: 1.x Ventas, 2.x Almacén, etc.
// ═══════════════════════════════════════════════════════════════════════════

export interface PlaceholderColumn {
    key: string
    label: string
}

export interface PlaceholderRow {
    [key: string]: string
}

interface PlaceholderModuleProps {
    title: string
    description: string
    icon: LucideIcon
    columns: PlaceholderColumn[]
    rows: PlaceholderRow[]
    /** Fase de implementación, ej: "Guía 1.x — Ventas" */
    phase: string
}

/**
 * Plantilla para páginas de módulos en construcción.
 * Recibe la configuración y dibuja una tabla con datos de ejemplo.
 * Se reemplaza individualmente cuando cada módulo llega a su fase de implementación.
 */
export function PlaceholderModule({
    title, description, icon: Icon, columns, rows, phase,
}: PlaceholderModuleProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Badge de estado */}
            <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-lg bg-warning/10 px-3 py-1 text-xs font-medium text-warning ring-1 ring-inset ring-warning/20">
                    En construcción — {phase}
                </div>
            </div>

            {/* Tabla de datos de ejemplo */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary-accent" />
                            {title}
                        </CardTitle>
                        <CardDescription className="mt-1">{description}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <tr>
                                    {columns.map((col) => (
                                        <th key={col.key} className="px-4 py-3">{col.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rows.map((row, i) => (
                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-4 py-3 text-foreground">
                                                {row[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Aviso de datos de ejemplo */}
                    <div className="mt-4 text-center text-xs text-muted-foreground border-t border-dashed border-border pt-4">
                        Datos de ejemplo — Los datos reales se implementan en {phase}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
'@

New-Item -Path "src/components/shell/PlaceholderModule.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/shell/PlaceholderModule.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/shell/PlaceholderModule.tsx creado" -ForegroundColor Green
Write-Host "🧩 Plantilla lista — las 34 páginas la usan pasando solo su configuración" -ForegroundColor Cyan
Write-Host "🔄 Temporal por diseño — cada página la reemplaza al llegar a su fase" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 3

```powershell
Write-Host "`n=== VALIDACIÓN PARTE 3 ===" -ForegroundColor Yellow

$files = @(
    "src/components/shell/nav/NavItem.tsx",
    "src/components/shell/nav/NavGroup.tsx",
    "src/components/shell/Avatar.tsx",
    "src/components/shell/Footer.tsx",
    "src/components/shell/PlaceholderModule.tsx"
)

$allOk = $true
foreach ($f in $files) {
    if (Test-Path $f) { Write-Host "  ✅ $f" -ForegroundColor Green }
    else {
        Write-Host "  ❌ $f NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

# VERIFICACIÓN CRÍTICA: Ningún Dumb Component importa stores, router o Supabase
Write-Host "`n  Verificando pureza de Dumb Components..." -ForegroundColor Yellow
foreach ($f in $files) {
    if (-not (Test-Path $f)) { continue }
    $c = Get-Content $f -Raw
    if ($c -match "useRouter|useSidebarStore|useAuth|usePageContextStore|supabase|zustand") {
        Write-Host "  ❌ VIOLACIÓN: $f importa stores/router — debe ser Dumb" -ForegroundColor Red
        $allOk = $false
    } else {
        Write-Host "  ✅ $f — puro (sin stores ni router)" -ForegroundColor Green
    }
}

# VERIFICACIÓN: Footer NO tiene "use client"
$footerContent = Get-Content "src/components/shell/Footer.tsx" -Raw
if ($footerContent -match "use client") {
    Write-Host "  ❌ Footer.tsx tiene 'use client' — debe ser Server Component" -ForegroundColor Red
    $allOk = $false
} else {
    Write-Host "  ✅ Footer.tsx — Server Component puro" -ForegroundColor Green
}

if ($allOk) { Write-Host "`n✅ PARTE 3 COMPLETA — continuar con Parte 4" -ForegroundColor Green }
else        { Write-Host "`n❌ PARTE 3 INCOMPLETA — revisar los ❌ antes de continuar" -ForegroundColor Red }
```

> 🛑 **STOP-ON-FAIL:** Si algun Dumb Component importa stores, corregir antes de continuar. Los Smart Components de la Parte 4 dependen de que estos componentes sean puros — si tienen efectos secundarios propios, el comportamiento del Shell sera impredecible.

---

## RESUMEN DE ESTA PARTE

| Archivo | Tipo | Estado |
|:--------|:-----|:------:|
| `src/components/shell/nav/NavItem.tsx` | Dumb | NUEVO |
| `src/components/shell/nav/NavGroup.tsx` | Dumb | NUEVO |
| `src/components/shell/Avatar.tsx` | Dumb | NUEVO |
| `src/components/shell/Footer.tsx` | Dumb (Server) | NUEVO |
| `src/components/shell/PlaceholderModule.tsx` | Dumb | NUEVO |

---

## SIGUIENTE PARTE

**-> Parte 4** — Sistema Nervioso: Smart Components + Layout

Se crean los cinco componentes inteligentes que conectan los ladrillos visuales de la Parte 3 con los stores de la Parte 2, y el layout que los ensambla todos bajo una sola estructura server-side.

---

> **Documento:** GUIA_0_6_Parte3_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
