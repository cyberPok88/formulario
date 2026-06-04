# GUIA 0.6 — APP SHELL: SIDEBAR, TOPBAR, TOOLBAR Y SISTEMA DE TEMAS
## PARTE 5: ENSAMBLAJE — DASHBOARD, BIENVENIDA Y 34 PLACEHOLDERS

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 5 de 5 (ultima parte)
> **Prerequisito:** Parte 4 completada — `npx tsc --noEmit` sin errores, Shell navegable
> **Siguiente guia:** Guia 0.7 — RBAC Guards Reales
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta es la parte de **ensamblaje final** — todo lo construido en las Partes 1 a 4 se pone a prueba navegando por las 35 rutas del ERP. Se crean todos los directorios, se reemplaza el Dashboard con la version funcional con card-banner de bienvenida, se crea la pagina de primeros pasos, y se generan los 34 placeholders que demuestran que el Shell opera de extremo a extremo.

- **Bloque 1 — Directorios:** Crea todos los directorios de rutas que Next.js necesita para resolver los `href` de la tabla `submodulos`.
- **Bloque 2 — Dashboard (`/dashboard/page.tsx`):** Reemplaza el placeholder de la Guia 0.5. Muestra 4 KPI cards + card-banner "Completa tu configuracion" si `onboarding_visto === false`.
- **Bloque 3 — Bienvenida (`/dashboard/sistema/bienvenida/page.tsx`):** Pagina de primeros pasos con checklist de configuracion inicial. Al visitarla llama `marcarOnboardingVistoAction()`.
- **Bloques 4–11 — 34 paginas placeholder:** Una por cada submodulo de la Guia 0.4, usando `PlaceholderModule` + `usePageConfig`. Al navegar a cada ruta el Topbar muestra el titulo y el Toolbar muestra los botones configurados.

> **Al terminar esta parte:** `npm run build` exitoso. 35 rutas navegables. Shell completo verificado de extremo a extremo. Proyecto listo para la Guia 0.7.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — DIRECTORIOS DE RUTAS

📄 **ACCION** — Crear estructura de 35 directorios

**Proposito:** Crear todos los directorios que Next.js necesita para resolver las rutas del ERP. Sin el directorio, el `page.tsx` no tiene donde vivir y el build falla.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Estructura de directorios |
| Ejecuta en | Solo compilacion (estructura de proyecto) |
| Si lo modificas | Si falta un directorio, la ruta correspondiente retorna 404 en produccion |

```powershell
# Sistema
New-Item -ItemType Directory -Force -Path "src/app/dashboard/sistema/bienvenida"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/sistema/empresa"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/sistema/usuarios"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/sistema/roles"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/sistema/permisos"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/sistema/suscripcion"

# Ventas
New-Item -ItemType Directory -Force -Path "src/app/dashboard/ventas/clientes"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/ventas/productos"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/ventas/listas-precios"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/ventas/cotizaciones"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/ventas/pedidos"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/ventas/promociones"

# Compras
New-Item -ItemType Directory -Force -Path "src/app/dashboard/compras/proveedores"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/compras/ordenes"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/compras/recepcion"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/compras/devoluciones"

# Almacén
New-Item -ItemType Directory -Force -Path "src/app/dashboard/almacen/inventario"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/almacen/entradas"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/almacen/salidas"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/almacen/ajustes"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/almacen/transferencias"

# Logística
New-Item -ItemType Directory -Force -Path "src/app/dashboard/logistica/envios"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/logistica/rutas"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/logistica/repartidores"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/logistica/evidencias"

# Producción
New-Item -ItemType Directory -Force -Path "src/app/dashboard/produccion/ordenes"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/produccion/formulas"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/produccion/materiales"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/produccion/rendimiento"

# Facturación
New-Item -ItemType Directory -Force -Path "src/app/dashboard/facturacion/facturas"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/facturacion/remisiones"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/facturacion/notas-credito"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/facturacion/pagos"
New-Item -ItemType Directory -Force -Path "src/app/dashboard/facturacion/cobranza"

# Reportes
New-Item -ItemType Directory -Force -Path "src/app/dashboard/reportes"

Write-Host "✅ 35 directorios de rutas creados" -ForegroundColor Green
Write-Host "📁 6 Sistema · 6 Ventas · 4 Compras · 5 Almacén · 4 Logística · 4 Producción · 5 Facturación · 1 Reportes" -ForegroundColor Cyan
```

---

## BLOQUE 2 — DASHBOARD (REEMPLAZO)

📄 **ARCHIVO REEMPLAZADO** — `src/app/dashboard/page.tsx`

**Proposito:** Reemplaza el placeholder de la Guia 0.5. Muestra 4 KPI cards de ejemplo + card-banner "Primeros pasos" si `onboarding_visto === false`. Es la prueba de que el Topbar recibe el titulo correcto y el Toolbar respeta el array vacio retornando `null`.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Client) |
| Ejecuta en | Browser |
| Importa de | `next/link`, `@/lib/stores/auth-store`, `@/hooks/usePageConfig`, `@/components/ui/card`, `lucide-react` |
| Si lo modificas | Solo afecta la pagina de dashboard. Se reemplaza parcialmente en fases 0.8+ cuando se agreguen metricas reales |

### DECISIONES DE DISENO

**Por que `usePageConfig` antes del `if (!usuario) return null`?**
Los hooks no pueden estar despues de un `return` condicional en React — es una regla fundamental. El hook siempre se ejecuta; la guarda del contenido JSX es posterior.

```powershell
$content = @'
'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/stores/auth-store'
import { usePageConfig } from '@/hooks/usePageConfig'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Users, Package, FileText, Rocket, ArrowRight } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// DashboardPage — Página principal del ERP
// Primera página que usa usePageConfig — prueba de que el Shell funciona.
// Toolbar vacío por diseño: toolbar-config.ts tiene '/dashboard': []
// KPIs son datos de ejemplo — datos reales en fases posteriores.
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
    const usuario = useAuth(s => s.usuario)
    const menu    = useAuth(s => s.menu)

    // SIEMPRE antes de cualquier return condicional — regla de React hooks
    usePageConfig({
        info: { title: 'Panel Principal', subtitle: 'Resumen general del sistema' },
        path: '/dashboard',
    })

    // Guarda de contenido — usePageConfig ya se ejecutó
    if (!usuario) return null

    // Detectar primer login: menú cargado pero onboarding_visto === false
    const mostrarBienvenida = usuario.preferencias?.onboarding_visto === false

    // Detectar si el menú está vacío (usuario sin permisos configurados)
    const sinPermisos = menu.length === 0

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Card-banner de bienvenida — solo si onboarding_visto === false */}
            {mostrarBienvenida && (
                <Card className="border-primary-accent/30 bg-primary-accent/5">
                    <CardContent className="flex items-center justify-between py-4 px-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-accent/10 rounded-lg">
                                <Rocket className="h-5 w-5 text-primary-accent" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm">¡Bienvenido a {usuario.empresa?.nombre || 'tu empresa'}!</p>
                                <p className="text-xs text-muted-foreground">
                                    Completa la configuración inicial para que tu equipo pueda operar.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/sistema/bienvenida"
                            className="flex items-center gap-1 text-xs font-medium text-primary-accent hover:underline shrink-0 ml-4"
                        >
                            Ver primeros pasos <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Estado vacío: usuario sin permisos configurados */}
            {sinPermisos && (
                <Card className="border-warning/30 bg-warning/5">
                    <CardContent className="py-4 px-6">
                        <p className="text-sm font-medium text-warning">Sin módulos asignados</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tu administrador aún no ha configurado los permisos de tu rol.
                            Contacta a {usuario.empresa?.nombre || 'tu empresa'} para que te asignen acceso.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Grid de KPIs — datos de ejemplo, reemplazar en fases posteriores */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
                        <Users className="h-4 w-4 text-primary-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground mt-1">Datos disponibles en Guía 0.8</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos del Mes</CardTitle>
                        <FileText className="h-4 w-4 text-primary-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground mt-1">Datos disponibles en Guía 1.x</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Productos en Stock</CardTitle>
                        <Package className="h-4 w-4 text-primary-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">—</div>
                        <p className="text-xs text-muted-foreground mt-1">Datos disponibles en Guía 2.x</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Estado del Sistema</CardTitle>
                        <Activity className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success">Activo</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {usuario.empresa?.plan ? `Plan: ${usuario.empresa.plan}` : 'Sistema operativo'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Card de sesión — prueba visual de que la autenticación funcionó */}
            <Card>
                <CardHeader>
                    <CardTitle>Sesión Activa</CardTitle>
                    <CardDescription>Datos de tu sesión autenticada.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md bg-muted p-4 font-mono text-xs space-y-1 text-muted-foreground">
                        <p>Email:   <span className="text-foreground">{usuario.email}</span></p>
                        <p>Nombre:  <span className="text-foreground">{usuario.nombre}</span></p>
                        <p>Empresa: <span className="text-foreground">{usuario.empresa?.nombre || '—'}</span></p>
                        <p>Plan:    <span className="text-foreground">{usuario.empresa?.plan || '—'}</span></p>
                        <p>Tema:    <span className="text-foreground">{usuario.preferencias?.tema || 'slate-light'}</span></p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
'@

Set-Content -Path "src/app/dashboard/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/dashboard/page.tsx reemplazado con Dashboard funcional" -ForegroundColor Green
Write-Host "🚀 Card-banner de bienvenida — desaparece al visitar /sistema/bienvenida" -ForegroundColor Cyan
Write-Host "⚠️  Estado vacío — mensaje amigable si el usuario no tiene permisos configurados" -ForegroundColor Cyan
Write-Host "📊 KPIs con — por defecto — los datos reales llegan en fases posteriores" -ForegroundColor Cyan
```

---

## BLOQUE 3 — PAGINA DE BIENVENIDA

📄 **ARCHIVO COMPLETO** — `src/app/dashboard/sistema/bienvenida/page.tsx`

**Proposito:** Checklist de configuracion inicial para el administrador. Al montarse llama `marcarOnboardingVistoAction()` para que el card-banner del dashboard desaparezca permanentemente y actualiza el store local.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Client) |
| Ejecuta en | Browser |
| Importa de | `react`, `next/link`, `lucide-react`, `@/components/ui/card`, `@/hooks/usePageConfig`, `@/lib/stores/auth-store`, `@/lib/actions/shell` |
| Si lo modificas | Solo afecta la pagina de bienvenida. Si falla `marcarOnboardingVistoAction()`, el banner de bienvenida del dashboard no desaparece |

### DECISIONES DE DISENO

**Por que `marcarOnboardingVistoAction()` en `useEffect` y no en `onClick`?**
Al visitar la pagina, independientemente de si el admin hace clic en algo, el onboarding ya fue visto. El `useEffect` con dependencia vacia `[]` se ejecuta una sola vez al montar — el comportamiento correcto.

```powershell
$content = @'
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Building2, Users, Shield, CreditCard, CheckCircle, ArrowRight, Rocket } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePageConfig } from '@/hooks/usePageConfig'
import { useAuthStoreBase } from '@/lib/stores/auth-store'
import { marcarOnboardingVistoAction } from '@/lib/actions/shell'

// ═══════════════════════════════════════════════════════════════════════════
// BienvenidaPage — Checklist de configuración inicial
// Al visitar esta página: marcarOnboardingVistoAction() se llama una vez.
// El card-banner del dashboard desaparece permanentemente después.
// ═══════════════════════════════════════════════════════════════════════════

const TAREAS = [
    {
        href:        '/dashboard/sistema/empresa',
        icon:        Building2,
        titulo:      'Completa los datos fiscales',
        descripcion: 'RFC, régimen fiscal y domicilio fiscal para emitir CFDIs válidos.',
        cta:         'Ir a Mi Empresa',
    },
    {
        href:        '/dashboard/sistema/permisos',
        icon:        Shield,
        titulo:      'Configura los permisos de tu equipo',
        descripcion: 'Define qué módulos y acciones puede ejecutar cada rol en tu empresa.',
        cta:         'Ir a Permisos',
    },
    {
        href:        '/dashboard/sistema/usuarios',
        icon:        Users,
        titulo:      'Invita a tus colaboradores',
        descripcion: 'Agrega a tu equipo y asígnales el rol correspondiente.',
        cta:         'Ir a Usuarios',
    },
    {
        href:        '/dashboard/sistema/suscripcion',
        icon:        CreditCard,
        titulo:      'Revisa tu plan de suscripción',
        descripcion: 'Verifica los módulos incluidos en tu plan y actualiza si necesitas más funcionalidad.',
        cta:         'Ver Plan',
    },
]

export default function BienvenidaPage() {
    const actualizarPreferencias = useAuthStoreBase(s => s.actualizarPreferencias)

    // Registrar en el Shell al montar
    usePageConfig({
        info: { title: 'Primeros Pasos', subtitle: 'Configura tu empresa para empezar a operar' },
        path: '/dashboard/sistema/bienvenida',
    })

    // Al visitar esta página, marcar onboarding como visto — UNA VEZ al montar
    useEffect(() => {
        const marcar = async () => {
            const result = await marcarOnboardingVistoAction()
            if (result.success) {
                // Partial<> — no necesita cast, acepta cualquier subconjunto de preferencias
                actualizarPreferencias({ onboarding_visto: true })
            }
        }
        marcar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-accent/10 rounded-xl">
                    <Rocket className="h-6 w-6 text-primary-accent" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">Bienvenido a tu ERP</h2>
                    <p className="text-sm text-muted-foreground">
                        Completa estos pasos para que tu empresa esté lista para operar.
                    </p>
                </div>
            </div>

            {/* Lista de tareas */}
            <div className="grid gap-4 md:grid-cols-2">
                {TAREAS.map((tarea) => (
                    <Card key={tarea.href} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-muted rounded-lg shrink-0 mt-0.5">
                                    <tarea.icon className="h-4 w-4 text-primary-accent" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{tarea.titulo}</CardTitle>
                                    <CardDescription className="mt-1 text-xs">
                                        {tarea.descripcion}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Link
                                href={tarea.href}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-accent hover:underline"
                            >
                                {tarea.cta} <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Confirmación */}
            <Card className="border-success/30 bg-success/5">
                <CardContent className="flex items-center gap-3 py-4 px-6">
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    <p className="text-sm text-muted-foreground">
                        Esta página queda disponible siempre en el menú Sistema.
                        Puedes volver cuando necesites consultar la guía de configuración.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
'@

New-Item -Path "src/app/dashboard/sistema/bienvenida/page.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/dashboard/sistema/bienvenida/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/dashboard/sistema/bienvenida/page.tsx corregido" -ForegroundColor Green
Write-Host "🎯 Cast eliminado — Partial<> acepta onboarding_visto sin tema" -ForegroundColor Cyan
```

---

## BLOQUE 4 — PLACEHOLDERS: MODULO SISTEMA

📄 **ARCHIVOS COMPLETOS** — 5 paginas del modulo Sistema

**Proposito:** Crear las 5 paginas restantes del modulo Sistema (empresa, usuarios, roles, permisos, suscripcion). Cada una registra su contexto en el Shell al montarse.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | page.tsx (Client) |
| Patron | Pagina con PlaceholderModule + usePageConfig |
| Ejecuta en | Browser |
| Importa de | `@/hooks/usePageConfig`, `@/components/shell/PlaceholderModule`, `lucide-react` |
| Si lo modificas | Cada pagina es independiente. Modificar una no afecta a las demas |

```powershell
# ─── empresa/page.tsx ─────────────────────────────────────────────────────
$empresa = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Building2 } from 'lucide-react'
export default function EmpresaPage() {
    usePageConfig({ info: { title: 'Mi Empresa', subtitle: 'Datos fiscales y configuración de la empresa' }, path: '/dashboard/sistema/empresa' })
    return <PlaceholderModule title="Mi Empresa" description="Datos fiscales, logotipo y certificados SAT para emisión de CFDIs." icon={Building2} phase="Guía 0.8"
        columns={[{ key: 'campo', label: 'Campo' }, { key: 'valor', label: 'Valor' }]}
        rows={[{ campo: 'Razón Social', valor: 'Tu Empresa S.A. de C.V.' }, { campo: 'RFC', valor: 'Pendiente' }, { campo: 'Régimen', valor: 'Pendiente' }]} />
}
'@
Set-Content -Path "src/app/dashboard/sistema/empresa/page.tsx" -Value $empresa -Encoding UTF8

# ─── usuarios/page.tsx ────────────────────────────────────────────────────
$usuarios = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Users } from 'lucide-react'
export default function UsuariosPage() {
    usePageConfig({ info: { title: 'Usuarios', subtitle: 'Gestión de usuarios e invitaciones' }, path: '/dashboard/sistema/usuarios' })
    return <PlaceholderModule title="Usuarios del Sistema" description="Cuentas de usuario, invitaciones y asignación de roles." icon={Users} phase="Guía 0.8"
        columns={[{ key: 'nombre', label: 'Nombre' }, { key: 'email', label: 'Email' }, { key: 'rol', label: 'Rol' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ nombre: 'Administrador', email: 'admin@empresa.com', rol: 'Administrador', estado: 'Activo' }, { nombre: 'Invitado', email: 'nuevo@empresa.com', rol: 'Pendiente', estado: 'Por configurar' }]} />
}
'@
Set-Content -Path "src/app/dashboard/sistema/usuarios/page.tsx" -Value $usuarios -Encoding UTF8

# ─── roles/page.tsx ───────────────────────────────────────────────────────
$roles = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Shield } from 'lucide-react'
export default function RolesPage() {
    usePageConfig({ info: { title: 'Roles', subtitle: 'Roles disponibles en tu empresa' }, path: '/dashboard/sistema/roles' })
    return <PlaceholderModule title="Roles del Sistema" description="Roles sembrados automáticamente al crear la empresa." icon={Shield} phase="Guía 0.8"
        columns={[{ key: 'nombre', label: 'Nombre' }, { key: 'nivel', label: 'Nivel' }, { key: 'descripcion', label: 'Descripción' }]}
        rows={[{ nombre: 'administrador', nivel: '1', descripcion: 'Acceso total' }, { nombre: 'vendedor', nivel: '5', descripcion: 'Pedidos y clientes' }, { nombre: 'almacenista', nivel: '5', descripcion: 'Almacén e inventario' }]} />
}
'@
Set-Content -Path "src/app/dashboard/sistema/roles/page.tsx" -Value $roles -Encoding UTF8

# ─── permisos/page.tsx ────────────────────────────────────────────────────
$permisos = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Lock } from 'lucide-react'
export default function PermisosPage() {
    usePageConfig({ info: { title: 'Permisos', subtitle: 'Configuración de permisos por rol' }, path: '/dashboard/sistema/permisos' })
    return <PlaceholderModule title="Matriz de Permisos" description="Define qué módulos y acciones puede ejecutar cada rol." icon={Lock} phase="Guía 0.8"
        columns={[{ key: 'rol', label: 'Rol' }, { key: 'modulo', label: 'Módulo' }, { key: 'acciones', label: 'Acciones' }]}
        rows={[{ rol: 'vendedor', modulo: 'Ventas', acciones: 'ver, crear, editar' }, { rol: 'almacenista', modulo: 'Almacén', acciones: 'ver, crear, editar' }, { rol: 'contador', modulo: 'Facturación', acciones: 'ver, exportar' }]} />
}
'@
Set-Content -Path "src/app/dashboard/sistema/permisos/page.tsx" -Value $permisos -Encoding UTF8

# ─── suscripcion/page.tsx ─────────────────────────────────────────────────
$suscripcion = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { CreditCard } from 'lucide-react'
export default function SuscripcionPage() {
    usePageConfig({ info: { title: 'Suscripción', subtitle: 'Plan activo y módulos incluidos' }, path: '/dashboard/sistema/suscripcion' })
    return <PlaceholderModule title="Plan de Suscripción" description="Módulos incluidos en tu plan y opciones de actualización." icon={CreditCard} phase="Guía 0.8"
        columns={[{ key: 'plan', label: 'Plan' }, { key: 'modulos', label: 'Módulos' }, { key: 'usuarios', label: 'Usuarios máx.' }]}
        rows={[{ plan: 'Básico', modulos: 'Sistema, Ventas, Facturación', usuarios: '5' }, { plan: 'Pro', modulos: '+ Compras, Almacén, Reportes', usuarios: '20' }, { plan: 'Empresa', modulos: 'Todos los módulos', usuarios: 'Sin límite' }]} />
}
'@
Set-Content -Path "src/app/dashboard/sistema/suscripcion/page.tsx" -Value $suscripcion -Encoding UTF8

Write-Host "✅ Módulo Sistema — 5 páginas creadas (empresa, usuarios, roles, permisos, suscripcion)" -ForegroundColor Green
```

---

## BLOQUE 5 — PLACEHOLDERS: MODULO VENTAS

📄 **ARCHIVOS COMPLETOS** — 6 paginas del modulo Ventas

**Proposito:** Paginas placeholder del modulo Ventas (clientes, productos, listas-precios, cotizaciones, pedidos, promociones). Siguen el mismo patron PlaceholderModule + usePageConfig.

```powershell
$clientes = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { UsersRound } from 'lucide-react'
export default function ClientesPage() {
    usePageConfig({ info: { title: 'Clientes', subtitle: 'Gestión de clientes y datos fiscales' }, path: '/dashboard/ventas/clientes' })
    return <PlaceholderModule title="Clientes" description="Catálogo con datos fiscales y direcciones de entrega para CFDI." icon={UsersRound} phase="Guía 1.1"
        columns={[{ key: 'razon', label: 'Razón Social' }, { key: 'rfc', label: 'RFC' }, { key: 'ciudad', label: 'Ciudad' }]}
        rows={[{ razon: 'Distribuidora Ejemplo S.A.', rfc: 'DEJ920101AB1', ciudad: 'Monterrey' }, { razon: 'Empresa Demo', rfc: 'EMD880515CD3', ciudad: 'CDMX' }]} />
}
'@
Set-Content -Path "src/app/dashboard/ventas/clientes/page.tsx" -Value $clientes -Encoding UTF8

$productos = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Box } from 'lucide-react'
export default function ProductosPage() {
    usePageConfig({ info: { title: 'Productos', subtitle: 'Catálogo de productos' }, path: '/dashboard/ventas/productos' })
    return <PlaceholderModule title="Catálogo de Productos" description="Productos con precios, impuestos y control de stock." icon={Box} phase="Guía 1.2"
        columns={[{ key: 'clave', label: 'Clave' }, { key: 'nombre', label: 'Producto' }, { key: 'precio', label: 'Precio' }, { key: 'stock', label: 'Stock' }]}
        rows={[{ clave: 'PROD-001', nombre: 'Producto A', precio: '$100.00', stock: '500' }, { clave: 'PROD-002', nombre: 'Producto B', precio: '$250.00', stock: '120' }]} />
}
'@
Set-Content -Path "src/app/dashboard/ventas/productos/page.tsx" -Value $productos -Encoding UTF8

$listasPrecios = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Tags } from 'lucide-react'
export default function ListasPreciosPage() {
    usePageConfig({ info: { title: 'Listas de Precios', subtitle: 'Configuración de listas y factores' }, path: '/dashboard/ventas/listas-precios' })
    return <PlaceholderModule title="Listas de Precios" description="Factor de ajuste sobre el precio base por tipo de cliente." icon={Tags} phase="Guía 1.3"
        columns={[{ key: 'nombre', label: 'Lista' }, { key: 'factor', label: 'Factor' }, { key: 'clientes', label: 'Clientes' }]}
        rows={[{ nombre: 'GENERAL', factor: '×1.00', clientes: 'Todos' }, { nombre: 'MAYOREO', factor: '×0.85', clientes: 'Mayoristas' }]} />
}
'@
Set-Content -Path "src/app/dashboard/ventas/listas-precios/page.tsx" -Value $listasPrecios -Encoding UTF8

$cotizaciones = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { FileSearch } from 'lucide-react'
export default function CotizacionesPage() {
    usePageConfig({ info: { title: 'Cotizaciones', subtitle: 'Cotizaciones previas al pedido' }, path: '/dashboard/ventas/cotizaciones' })
    return <PlaceholderModule title="Cotizaciones" description="Propuestas de venta enviadas a clientes antes de confirmar pedido." icon={FileSearch} phase="Guía 1.4"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'cliente', label: 'Cliente' }, { key: 'total', label: 'Total' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ folio: 'COT-2026-001', cliente: 'Cliente A', total: '$5,000.00', estado: 'Enviada' }, { folio: 'COT-2026-002', cliente: 'Cliente B', total: '$2,400.00', estado: 'Aceptada' }]} />
}
'@
Set-Content -Path "src/app/dashboard/ventas/cotizaciones/page.tsx" -Value $cotizaciones -Encoding UTF8

$pedidos = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { ShoppingCart } from 'lucide-react'
export default function PedidosPage() {
    usePageConfig({ info: { title: 'Pedidos', subtitle: 'Gestión de pedidos de venta' }, path: '/dashboard/ventas/pedidos' })
    return <PlaceholderModule title="Pedidos de Venta" description="Ciclo de vida completo de pedidos desde nuevo hasta pagado." icon={ShoppingCart} phase="Guía 1.5"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'cliente', label: 'Cliente' }, { key: 'total', label: 'Total' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ folio: 'PED-2026-00001', cliente: 'Cliente A', total: '$12,450.00', estado: 'Nuevo' }, { folio: 'PED-2026-00002', cliente: 'Cliente B', total: '$3,200.00', estado: 'Confirmado' }]} />
}
'@
Set-Content -Path "src/app/dashboard/ventas/pedidos/page.tsx" -Value $pedidos -Encoding UTF8

$promociones = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Percent } from 'lucide-react'
export default function PromocionesPage() {
    usePageConfig({ info: { title: 'Promociones', subtitle: 'Descuentos y bonificaciones' }, path: '/dashboard/ventas/promociones' })
    return <PlaceholderModule title="Promociones" description="Descuentos y bonificaciones aplicables a productos o clientes." icon={Percent} phase="Guía 1.6"
        columns={[{ key: 'nombre', label: 'Promoción' }, { key: 'tipo', label: 'Tipo' }, { key: 'vigencia', label: 'Vigencia' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ nombre: 'Descuento 10%', tipo: 'Porcentaje', vigencia: 'Abr 2026', estado: 'Activa' }, { nombre: '2x1', tipo: 'Bonificación', vigencia: 'Mar 2026', estado: 'Vencida' }]} />
}
'@
Set-Content -Path "src/app/dashboard/ventas/promociones/page.tsx" -Value $promociones -Encoding UTF8

Write-Host "✅ Módulo Ventas — 6 páginas creadas" -ForegroundColor Green
```

---

## BLOQUE 6 — PLACEHOLDERS: MODULO COMPRAS

📄 **ARCHIVOS COMPLETOS** — 4 paginas del modulo Compras

**Proposito:** Paginas placeholder del modulo Compras (proveedores, ordenes, recepcion, devoluciones).

```powershell
$proveedores = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Handshake } from 'lucide-react'
export default function ProveedoresPage() {
    usePageConfig({ info: { title: 'Proveedores', subtitle: 'Catálogo de proveedores' }, path: '/dashboard/compras/proveedores' })
    return <PlaceholderModule title="Proveedores" description="Directorio de proveedores con condiciones comerciales." icon={Handshake} phase="Guía 3.1"
        columns={[{ key: 'nombre', label: 'Proveedor' }, { key: 'rfc', label: 'RFC' }, { key: 'ciudad', label: 'Ciudad' }]}
        rows={[{ nombre: 'Proveedor Nacional S.A.', rfc: 'PNA900101XY1', ciudad: 'CDMX' }, { nombre: 'Distribuidora Global', rfc: 'DGL850601AB2', ciudad: 'Guadalajara' }]} />
}
'@
Set-Content -Path "src/app/dashboard/compras/proveedores/page.tsx" -Value $proveedores -Encoding UTF8

$ordenesCompra = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { ClipboardList } from 'lucide-react'
export default function OrdenesCompraPage() {
    usePageConfig({ info: { title: 'Órdenes de Compra', subtitle: 'Órdenes de compra a proveedores' }, path: '/dashboard/compras/ordenes' })
    return <PlaceholderModule title="Órdenes de Compra" description="Solicitudes de abastecimiento a proveedores." icon={ClipboardList} phase="Guía 3.2"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'proveedor', label: 'Proveedor' }, { key: 'total', label: 'Total' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ folio: 'OC-2026-001', proveedor: 'Proveedor Nacional', total: '$45,000.00', estado: 'Enviada' }]} />
}
'@
Set-Content -Path "src/app/dashboard/compras/ordenes/page.tsx" -Value $ordenesCompra -Encoding UTF8

$recepcion = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { PackageCheck } from 'lucide-react'
export default function RecepcionPage() {
    usePageConfig({ info: { title: 'Recepción', subtitle: 'Recepción de mercancía de proveedores' }, path: '/dashboard/compras/recepcion' })
    return <PlaceholderModule title="Recepción de Mercancía" description="Registro de entradas de mercancía contra órdenes de compra." icon={PackageCheck} phase="Guía 3.3"
        columns={[{ key: 'oc', label: 'OC' }, { key: 'proveedor', label: 'Proveedor' }, { key: 'fecha', label: 'Fecha' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ oc: 'OC-2026-001', proveedor: 'Proveedor Nacional', fecha: '15/04/2026', estado: 'Pendiente' }]} />
}
'@
Set-Content -Path "src/app/dashboard/compras/recepcion/page.tsx" -Value $recepcion -Encoding UTF8

$devolucionesCompras = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { PackageX } from 'lucide-react'
export default function DevolucionesComprasPage() {
    usePageConfig({ info: { title: 'Devoluciones', subtitle: 'Devoluciones a proveedores' }, path: '/dashboard/compras/devoluciones' })
    return <PlaceholderModule title="Devoluciones a Proveedores" description="Registro de mercancía devuelta y notas de crédito recibidas." icon={PackageX} phase="Guía 3.4"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'proveedor', label: 'Proveedor' }, { key: 'motivo', label: 'Motivo' }]}
        rows={[{ folio: 'DEV-2026-001', proveedor: 'Proveedor Nacional', motivo: 'Producto defectuoso' }]} />
}
'@
Set-Content -Path "src/app/dashboard/compras/devoluciones/page.tsx" -Value $devolucionesCompras -Encoding UTF8

Write-Host "✅ Módulo Compras — 4 páginas creadas" -ForegroundColor Green
```

---

## BLOQUE 7 — PLACEHOLDERS: MODULO ALMACEN

📄 **ARCHIVOS COMPLETOS** — 5 paginas del modulo Almacen

**Proposito:** Paginas placeholder del modulo Almacen (inventario, entradas, salidas, ajustes, transferencias).

```powershell
$inventario = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Warehouse } from 'lucide-react'
export default function InventarioPage() {
    usePageConfig({ info: { title: 'Inventario', subtitle: 'Control de inventario y stock' }, path: '/dashboard/almacen/inventario' })
    return <PlaceholderModule title="Control de Inventario" description="Stock actual con trazabilidad por lotes." icon={Warehouse} phase="Guía 2.1"
        columns={[{ key: 'producto', label: 'Producto' }, { key: 'stock', label: 'Stock' }, { key: 'lotes', label: 'Lotes activos' }]}
        rows={[{ producto: 'Producto A', stock: '2,400', lotes: '3' }, { producto: 'Producto B', stock: '890', lotes: '1' }]} />
}
'@
Set-Content -Path "src/app/dashboard/almacen/inventario/page.tsx" -Value $inventario -Encoding UTF8

$entradas = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { LogIn } from 'lucide-react'
export default function EntradasPage() {
    usePageConfig({ info: { title: 'Entradas', subtitle: 'Entradas de mercancía al almacén' }, path: '/dashboard/almacen/entradas' })
    return <PlaceholderModule title="Entradas de Almacén" description="Registro de entradas con número de lote y fecha de vencimiento." icon={LogIn} phase="Guía 2.2"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'producto', label: 'Producto' }, { key: 'cantidad', label: 'Cantidad' }, { key: 'lote', label: 'Lote' }]}
        rows={[{ folio: 'ENT-2026-001', producto: 'Producto A', cantidad: '500', lote: 'L2026-01' }]} />
}
'@
Set-Content -Path "src/app/dashboard/almacen/entradas/page.tsx" -Value $entradas -Encoding UTF8

$salidas = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { LogOut } from 'lucide-react'
export default function SalidasPage() {
    usePageConfig({ info: { title: 'Salidas', subtitle: 'Salidas de mercancía del almacén' }, path: '/dashboard/almacen/salidas' })
    return <PlaceholderModule title="Salidas de Almacén" description="Despachos por pedido con aplicación FEFO automática." icon={LogOut} phase="Guía 2.3"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'pedido', label: 'Pedido' }, { key: 'producto', label: 'Producto' }, { key: 'cantidad', label: 'Cantidad' }]}
        rows={[{ folio: 'SAL-2026-001', pedido: 'PED-00042', producto: 'Producto A', cantidad: '100' }]} />
}
'@
Set-Content -Path "src/app/dashboard/almacen/salidas/page.tsx" -Value $salidas -Encoding UTF8

$ajustes = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { SlidersHorizontal } from 'lucide-react'
export default function AjustesAlmacenPage() {
    usePageConfig({ info: { title: 'Ajustes', subtitle: 'Ajustes de inventario por merma o diferencia' }, path: '/dashboard/almacen/ajustes' })
    return <PlaceholderModule title="Ajustes de Inventario" description="Correcciones de stock por merma, caducidad o diferencias de conteo." icon={SlidersHorizontal} phase="Guía 2.4"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'producto', label: 'Producto' }, { key: 'tipo', label: 'Tipo' }, { key: 'cantidad', label: 'Cantidad' }]}
        rows={[{ folio: 'AJU-2026-001', producto: 'Producto A', tipo: 'Merma', cantidad: '-10' }]} />
}
'@
Set-Content -Path "src/app/dashboard/almacen/ajustes/page.tsx" -Value $ajustes -Encoding UTF8

$transferencias = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { ArrowLeftRight } from 'lucide-react'
export default function TransferenciasPage() {
    usePageConfig({ info: { title: 'Transferencias', subtitle: 'Movimientos entre ubicaciones de almacén' }, path: '/dashboard/almacen/transferencias' })
    return <PlaceholderModule title="Transferencias" description="Movimientos de mercancía entre ubicaciones o almacenes." icon={ArrowLeftRight} phase="Guía 2.5"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'origen', label: 'Origen' }, { key: 'destino', label: 'Destino' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ folio: 'TRF-2026-001', origen: 'Zona A', destino: 'Zona B', estado: 'Completada' }]} />
}
'@
Set-Content -Path "src/app/dashboard/almacen/transferencias/page.tsx" -Value $transferencias -Encoding UTF8

Write-Host "✅ Módulo Almacén — 5 páginas creadas" -ForegroundColor Green
```

---

## BLOQUE 8 — PLACEHOLDERS: MODULO LOGISTICA

📄 **ARCHIVOS COMPLETOS** — 4 paginas del modulo Logistica

**Proposito:** Paginas placeholder del modulo Logistica (envios, rutas, repartidores, evidencias).

```powershell
$envios = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Truck } from 'lucide-react'
export default function EnviosPage() {
    usePageConfig({ info: { title: 'Envíos', subtitle: 'Gestión de envíos y despachos' }, path: '/dashboard/logistica/envios' })
    return <PlaceholderModule title="Envíos" description="Control de envíos desde preparación hasta entrega." icon={Truck} phase="Guía 4.1"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'pedido', label: 'Pedido' }, { key: 'destino', label: 'Destino' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ folio: 'ENV-2026-001', pedido: 'PED-00042', destino: 'Monterrey', estado: 'En Tránsito' }]} />
}
'@
Set-Content -Path "src/app/dashboard/logistica/envios/page.tsx" -Value $envios -Encoding UTF8

$rutas = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { MapPin } from 'lucide-react'
export default function RutasPage() {
    usePageConfig({ info: { title: 'Rutas', subtitle: 'Rutas de entrega configuradas' }, path: '/dashboard/logistica/rutas' })
    return <PlaceholderModule title="Rutas de Entrega" description="Rutas predefinidas para optimizar los tiempos de entrega." icon={MapPin} phase="Guía 4.2"
        columns={[{ key: 'nombre', label: 'Ruta' }, { key: 'zona', label: 'Zona' }, { key: 'paradas', label: 'Paradas' }]}
        rows={[{ nombre: 'Ruta Norte', zona: 'Monterrey', paradas: '8' }, { nombre: 'Ruta Centro', zona: 'CDMX', paradas: '12' }]} />
}
'@
Set-Content -Path "src/app/dashboard/logistica/rutas/page.tsx" -Value $rutas -Encoding UTF8

$repartidores = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { UserCheck } from 'lucide-react'
export default function RepartidoresPage() {
    usePageConfig({ info: { title: 'Repartidores', subtitle: 'Personal de reparto y sus rutas asignadas' }, path: '/dashboard/logistica/repartidores' })
    return <PlaceholderModule title="Repartidores" description="Personal de entrega con sus rutas y vehículos asignados." icon={UserCheck} phase="Guía 4.3"
        columns={[{ key: 'nombre', label: 'Nombre' }, { key: 'ruta', label: 'Ruta Asignada' }, { key: 'vehiculo', label: 'Vehículo' }]}
        rows={[{ nombre: 'Juan Pérez', ruta: 'Ruta Norte', vehiculo: 'Van-01' }]} />
}
'@
Set-Content -Path "src/app/dashboard/logistica/repartidores/page.tsx" -Value $repartidores -Encoding UTF8

$evidencias = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Camera } from 'lucide-react'
export default function EvidenciasPage() {
    usePageConfig({ info: { title: 'Evidencias', subtitle: 'Evidencias fotográficas de entregas' }, path: '/dashboard/logistica/evidencias' })
    return <PlaceholderModule title="Evidencias de Entrega" description="Fotografías y firmas de recepción por pedido entregado." icon={Camera} phase="Guía 4.4"
        columns={[{ key: 'pedido', label: 'Pedido' }, { key: 'fecha', label: 'Fecha' }, { key: 'receptor', label: 'Receptor' }, { key: 'evidencias', label: 'Evidencias' }]}
        rows={[{ pedido: 'PED-00042', fecha: '15/04/2026', receptor: 'Luis García', evidencias: '2 fotos' }]} />
}
'@
Set-Content -Path "src/app/dashboard/logistica/evidencias/page.tsx" -Value $evidencias -Encoding UTF8

Write-Host "✅ Módulo Logística — 4 páginas creadas" -ForegroundColor Green
```

---

## BLOQUE 9 — PLACEHOLDERS: MODULO PRODUCCION

📄 **ARCHIVOS COMPLETOS** — 4 paginas del modulo Produccion

**Proposito:** Paginas placeholder del modulo Produccion (ordenes, formulas, materiales, rendimiento).

```powershell
$ordenesProduccion = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { ClipboardCheck } from 'lucide-react'
export default function OrdenesProduccionPage() {
    usePageConfig({ info: { title: 'Órdenes de Producción', subtitle: 'Control de órdenes de manufactura' }, path: '/dashboard/produccion/ordenes' })
    return <PlaceholderModule title="Órdenes de Producción" description="Registro y seguimiento de órdenes de manufactura." icon={ClipboardCheck} phase="Guía 5.1"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'producto', label: 'Producto' }, { key: 'cantidad', label: 'Cantidad' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ folio: 'OP-2026-001', producto: 'Producto A', cantidad: '1,000', estado: 'En Proceso' }]} />
}
'@
Set-Content -Path "src/app/dashboard/produccion/ordenes/page.tsx" -Value $ordenesProduccion -Encoding UTF8

$formulas = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { FlaskConical } from 'lucide-react'
export default function FormulasPage() {
    usePageConfig({ info: { title: 'Fórmulas', subtitle: 'Recetas y fórmulas de producción' }, path: '/dashboard/produccion/formulas' })
    return <PlaceholderModule title="Fórmulas de Producción" description="Recetas con ingredientes, cantidades y pasos del proceso." icon={FlaskConical} phase="Guía 5.2"
        columns={[{ key: 'codigo', label: 'Código' }, { key: 'nombre', label: 'Fórmula' }, { key: 'version', label: 'Versión' }]}
        rows={[{ codigo: 'FOR-001', nombre: 'Fórmula Base A', version: 'v2.1' }]} />
}
'@
Set-Content -Path "src/app/dashboard/produccion/formulas/page.tsx" -Value $formulas -Encoding UTF8

$materiales = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Layers } from 'lucide-react'
export default function MaterialesPage() {
    usePageConfig({ info: { title: 'Materiales', subtitle: 'Control de materias primas y materiales' }, path: '/dashboard/produccion/materiales' })
    return <PlaceholderModule title="Materiales" description="Inventario de materias primas con puntos de reorden." icon={Layers} phase="Guía 5.3"
        columns={[{ key: 'clave', label: 'Clave' }, { key: 'material', label: 'Material' }, { key: 'stock', label: 'Stock' }, { key: 'minimo', label: 'Mínimo' }]}
        rows={[{ clave: 'MAT-001', material: 'Materia Prima A', stock: '500 kg', minimo: '100 kg' }]} />
}
'@
Set-Content -Path "src/app/dashboard/produccion/materiales/page.tsx" -Value $materiales -Encoding UTF8

$rendimiento = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { TrendingUp } from 'lucide-react'
export default function RendimientoPage() {
    usePageConfig({ info: { title: 'Rendimiento', subtitle: 'Indicadores de eficiencia productiva' }, path: '/dashboard/produccion/rendimiento' })
    return <PlaceholderModule title="Rendimiento de Producción" description="KPIs de eficiencia, desperdicios y tiempos de ciclo." icon={TrendingUp} phase="Guía 5.4"
        columns={[{ key: 'periodo', label: 'Período' }, { key: 'eficiencia', label: 'Eficiencia' }, { key: 'desperdicio', label: 'Desperdicio' }]}
        rows={[{ periodo: 'Abr 2026', eficiencia: '94%', desperdicio: '2.1%' }]} />
}
'@
Set-Content -Path "src/app/dashboard/produccion/rendimiento/page.tsx" -Value $rendimiento -Encoding UTF8

Write-Host "✅ Módulo Producción — 4 páginas creadas" -ForegroundColor Green
```

---

## BLOQUE 10 — PLACEHOLDERS: MODULO FACTURACION

📄 **ARCHIVOS COMPLETOS** — 5 paginas del modulo Facturacion

**Proposito:** Paginas placeholder del modulo Facturacion (facturas, remisiones, notas-credito, pagos, cobranza).

```powershell
$facturas = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { FileText } from 'lucide-react'
export default function FacturasPage() {
    usePageConfig({ info: { title: 'Facturas CFDI', subtitle: 'Emisión y gestión de facturas electrónicas' }, path: '/dashboard/facturacion/facturas' })
    return <PlaceholderModule title="Facturas CFDI" description="Emisión de facturas electrónicas 4.0 con timbrado PAC." icon={FileText} phase="Guía 6.1"
        columns={[{ key: 'folio', label: 'Folio Fiscal' }, { key: 'cliente', label: 'Cliente' }, { key: 'total', label: 'Total' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ folio: 'FAC-2026-00001', cliente: 'Cliente A', total: '$15,600.00', estado: 'Timbrada' }, { folio: 'FAC-2026-00002', cliente: 'Cliente B', total: '$4,800.00', estado: 'Cancelada' }]} />
}
'@
Set-Content -Path "src/app/dashboard/facturacion/facturas/page.tsx" -Value $facturas -Encoding UTF8

$remisiones = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { FileMinus } from 'lucide-react'
export default function RemisionesPage() {
    usePageConfig({ info: { title: 'Remisiones', subtitle: 'Notas de remisión previas a factura' }, path: '/dashboard/facturacion/remisiones' })
    return <PlaceholderModule title="Remisiones" description="Notas de remisión con mercancía entregada pendiente de facturar." icon={FileMinus} phase="Guía 6.2"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'pedido', label: 'Pedido' }, { key: 'total', label: 'Total' }, { key: 'estado', label: 'Estado' }]}
        rows={[{ folio: 'REM-2026-001', pedido: 'PED-00043', total: '$3,200.00', estado: 'Por Facturar' }]} />
}
'@
Set-Content -Path "src/app/dashboard/facturacion/remisiones/page.tsx" -Value $remisiones -Encoding UTF8

$notasCredito = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { FileMinus2 } from 'lucide-react'
export default function NotasCreditoPage() {
    usePageConfig({ info: { title: 'Notas de Crédito', subtitle: 'Notas de crédito por devoluciones o ajustes' }, path: '/dashboard/facturacion/notas-credito' })
    return <PlaceholderModule title="Notas de Crédito" description="CFDI de tipo E (Egreso) por devoluciones o descuentos posteriores." icon={FileMinus2} phase="Guía 6.3"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'factura', label: 'Factura relacionada' }, { key: 'total', label: 'Total' }, { key: 'motivo', label: 'Motivo' }]}
        rows={[{ folio: 'NC-2026-001', factura: 'FAC-2026-00001', total: '$1,200.00', motivo: 'Devolución parcial' }]} />
}
'@
Set-Content -Path "src/app/dashboard/facturacion/notas-credito/page.tsx" -Value $notasCredito -Encoding UTF8

$pagos = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { Banknote } from 'lucide-react'
export default function PagosPage() {
    usePageConfig({ info: { title: 'Pagos', subtitle: 'Registro de pagos y complementos de pago' }, path: '/dashboard/facturacion/pagos' })
    return <PlaceholderModule title="Pagos" description="Registro de cobros con CFDI complemento de pago (PPD)." icon={Banknote} phase="Guía 6.4"
        columns={[{ key: 'folio', label: 'Folio' }, { key: 'cliente', label: 'Cliente' }, { key: 'monto', label: 'Monto' }, { key: 'forma', label: 'Forma de Pago' }]}
        rows={[{ folio: 'PAG-2026-001', cliente: 'Cliente A', monto: '$15,600.00', forma: 'Transferencia' }]} />
}
'@
Set-Content -Path "src/app/dashboard/facturacion/pagos/page.tsx" -Value $pagos -Encoding UTF8

$cobranza = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { DollarSign } from 'lucide-react'
export default function CobranzaPage() {
    usePageConfig({ info: { title: 'Cobranza', subtitle: 'Seguimiento de cuentas por cobrar' }, path: '/dashboard/facturacion/cobranza' })
    return <PlaceholderModule title="Cobranza" description="Gestión de saldos pendientes y seguimiento de cuentas por cobrar." icon={DollarSign} phase="Guía 6.5"
        columns={[{ key: 'cliente', label: 'Cliente' }, { key: 'saldo', label: 'Saldo' }, { key: 'vencido', label: 'Vencido' }, { key: 'dias', label: 'Días vencido' }]}
        rows={[{ cliente: 'Cliente A', saldo: '$15,600.00', vencido: '$5,200.00', dias: '15' }, { cliente: 'Cliente B', saldo: '$4,800.00', vencido: '$0.00', dias: '0' }]} />
}
'@
Set-Content -Path "src/app/dashboard/facturacion/cobranza/page.tsx" -Value $cobranza -Encoding UTF8

Write-Host "✅ Módulo Facturación — 5 páginas creadas" -ForegroundColor Green
```

---

## BLOQUE 11 — PLACEHOLDER: MODULO REPORTES

📄 **ARCHIVO COMPLETO** — 1 pagina del modulo Reportes

**Proposito:** Pagina placeholder del modulo Reportes.

```powershell
$reportes = @'
'use client'
import { usePageConfig } from '@/hooks/usePageConfig'
import { PlaceholderModule } from '@/components/shell/PlaceholderModule'
import { BarChart3 } from 'lucide-react'
export default function ReportesPage() {
    usePageConfig({ info: { title: 'Reportes', subtitle: 'Reportes ejecutivos y exportaciones' }, path: '/dashboard/reportes' })
    return <PlaceholderModule title="Reportes" description="Dashboard ejecutivo con métricas de ventas, inventario y cobranza." icon={BarChart3} phase="Guía 7.1"
        columns={[{ key: 'reporte', label: 'Reporte' }, { key: 'modulo', label: 'Módulo' }, { key: 'frecuencia', label: 'Frecuencia' }]}
        rows={[{ reporte: 'Ventas por período', modulo: 'Ventas', frecuencia: 'Diario' }, { reporte: 'Inventario valorizado', modulo: 'Almacén', frecuencia: 'Semanal' }, { reporte: 'Cartera vencida', modulo: 'Facturación', frecuencia: 'Diario' }]} />
}
'@
Set-Content -Path "src/app/dashboard/reportes/page.tsx" -Value $reportes -Encoding UTF8

Write-Host "✅ Módulo Reportes — 1 página creada" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "✅ TOTAL: 35 páginas placeholder creadas (1 dashboard + 1 bienvenida + 33 módulos)" -ForegroundColor Green
```

---

## FINGERPRINT — VALIDACION PARTE 5

```powershell
Write-Host "`n=== VALIDACIÓN PARTE 5 ===" -ForegroundColor Yellow

# Verificar páginas clave
$paginasClave = @(
    "src/app/dashboard/page.tsx",
    "src/app/dashboard/sistema/bienvenida/page.tsx",
    "src/app/dashboard/sistema/usuarios/page.tsx",
    "src/app/dashboard/ventas/pedidos/page.tsx",
    "src/app/dashboard/almacen/inventario/page.tsx",
    "src/app/dashboard/facturacion/facturas/page.tsx",
    "src/app/dashboard/reportes/page.tsx"
)

$allOk = $true
foreach ($f in $paginasClave) {
    if (Test-Path $f) { Write-Host "  ✅ $f" -ForegroundColor Green }
    else {
        Write-Host "  ❌ $f NO existe" -ForegroundColor Red
        $allOk = $false
    }
}

if ($allOk) {
    Write-Host "`n  Ejecutando build final..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ GUÍA 0.6 COMPLETADA — npm run build exitoso" -ForegroundColor Green
        Write-Host "   35 rutas navegables · Sidebar dinámico · Toolbar contextual · Sistema de temas híbrido" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ BUILD FALLÓ — revisar errores antes de continuar a Guía 0.7" -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ PARTE 5 INCOMPLETA — crear las páginas faltantes antes del build" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si el build falla con `Module not found` en alguna pagina, verificar que el icono importado existe en `lucide-react` y en `icon-map.ts`. Si falla con `'use client'` en un Server Component, el componente tiene la directiva donde no deberia. Si falla con TypeScript, `npx tsc --noEmit` muestra el error exacto.

---

## RESUMEN DE ESTA PARTE

| Elemento | Estado |
|:---------|:------:|
| Directorios de rutas (35) | NUEVOS |
| `src/app/dashboard/page.tsx` | REEMPLAZADO |
| `src/app/dashboard/sistema/bienvenida/page.tsx` | NUEVO |
| Modulo Sistema (5 paginas) | NUEVOS |
| Modulo Ventas (6 paginas) | NUEVOS |
| Modulo Compras (4 paginas) | NUEVOS |
| Modulo Almacen (5 paginas) | NUEVOS |
| Modulo Logistica (4 paginas) | NUEVOS |
| Modulo Produccion (4 paginas) | NUEVOS |
| Modulo Facturacion (5 paginas) | NUEVOS |
| Modulo Reportes (1 pagina) | NUEVO |

---

## SIGUIENTE GUIA

**-> Guia 0.7** — RBAC Guards Reales

Activa la capa de seguridad visual del ERP. El `RBACGuard` centralizado en el layout protege todas las rutas, el Toolbar filtra botones con `tienePermiso()`, y la pagina `/dashboard/sin-acceso` recibe a usuarios rechazados. El Shell de la 0.6 no requiere modificaciones para recibirlos.

---

> **Documento:** GUIA_0_6_Parte5_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
