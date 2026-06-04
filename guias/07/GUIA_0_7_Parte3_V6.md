# GUIA 0.7 — SEGURIDAD RBAC VIVO (FRONT-END)
## PARTE 3: INTEGRACION, VERIFICACION Y TESTING

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 3 de 3 (ultima parte)
> **Prerequisito:** Parte 2 completada — `npx tsc --noEmit` sin errores, 3 componentes de seguridad creados
> **Siguiente guia:** Guia 0.8 — Gestion de Usuarios (UI)
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta es la parte de **integracion y validacion**. Los componentes de la Parte 2 se conectan al Shell existente mediante scripts automatizados e idempotentes, y se verifica que todo funciona correctamente con pruebas manuales organizadas por rol.

- **Bloque 7 — `dashboard/layout.tsx`:** Script que agrega el import de `RBACGuard` y reemplaza la seccion de `{children}` con la version protegida. Idempotente — no duplica si se ejecuta dos veces.
- **Bloque 8 — `Toolbar.tsx`:** Script que agrega el import de `useAuth`, inserta el `useMemo` de filtrado RBAC, y renombra `mergedActions` → `filteredActions` en el render. Idempotente.
- **Bloque 9 — `shell/index.ts`:** Agrega los exports de los 4 simbolos RBAC al barrel del Shell. Idempotente.
- **Bloque 10 — Validacion de Build:** Script completo que verifica existencia de archivos nuevos, modificaciones al Shell de Guia 0.6, integridad del layout, TypeScript, ESLint y `npm run build`.
- **Bloque 11 — Checklist de Verificacion Visual:** Pruebas manuales organizadas por seccion con matriz de resultados esperados por rol.
- **Bloque 12 — Troubleshooting y Queries SQL:** Problemas comunes con soluciones y queries de diagnostico para Supabase.

> **Al terminar esta parte:** `npm run build` exitoso. El ERP tiene seguridad RBAC activa en todas las rutas. El Toolbar filtra botones por permiso. El proyecto esta listo para la Guia 0.8.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 7 — INTEGRACION DEL RBACGUARD EN EL LAYOUT

📄 **ARCHIVO MODIFICADO** — `src/app/dashboard/layout.tsx`

**Proposito:** Agregar el `RBACGuard` al layout maestro del dashboard envolviendo `{children}` dentro de `<main>`. Este unico cambio activa la proteccion de todas las rutas bajo `/dashboard/*` sin tocar ningun archivo adicional.

### DECISIONES DE DISENO

**Por que el RBACGuard va dentro de `<main>` y no envolviendo todo el Shell?**
Porque el Shell (Sidebar, Topbar, Footer) debe permanecer visible incluso cuando el acceso es denegado. El usuario rechazado debe poder ver el menu (para navegar a una ruta que si tiene permiso) y ver su perfil (para saber con que cuenta inicio sesion). Con el guard dentro de `<main>`, el Shell permanece intacto y solo el area de contenido muestra la pagina `sin-acceso`.

> **⚠️ Instruccion especial:** Script idempotente — si se ejecuta dos veces, detecta que los cambios ya existen y no los duplica. Agregar el import del RBACGuard manualmente si el script no encuentra el patron.

```powershell
# ═══════════════════════════════════════════════════════════════
# BLOQUE 7 — INTEGRAR RBACGUARD EN DASHBOARD LAYOUT
# ═══════════════════════════════════════════════════════════════

$layoutPath = "src/app/dashboard/layout.tsx"
$layoutContent = Get-Content $layoutPath -Raw -Encoding UTF8

# ── Cambio 1: Agregar import de RBACGuard ─────────────────────
if ($layoutContent -notmatch "RBACGuard") {
    # Usamos la clase [regex] para poder limitar el reemplazo a exactamente 1 sola vez.
    # Buscamos el primer "import " al inicio de una línea y le inyectamos nuestro código arriba.
    $regex = [regex] '(?m)^import '
    $layoutContent = $regex.Replace($layoutContent, "import { RBACGuard } from `"@/components/shell/RBACGuard`"`nimport ", 1)
    
    Write-Host "✅ Import de RBACGuard agregado dinámicamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Import de RBACGuard ya existe — no se duplica" -ForegroundColor Yellow
}

# ── Cambio 2: Envolver {children} con RBACGuard ───────────────
$seccionAnterior = @'
                        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/20 p-4 md:p-6">
                            <div className="mx-auto max-w-7xl pb-10">
                                {children}
                            </div>
                        </main>
'@

$seccionNueva = @'
                        {/* Área de contenido protegida por RBACGuard (Guía 0.7)
                            El guard verifica puedeVerPagina(pathname) antes de renderizar.
                            Si el usuario no tiene permiso → redirect /dashboard/sin-acceso.
                            El Shell (Sidebar, Topbar, Footer) permanece visible siempre. */}
                        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/20 p-4 md:p-6">
                            <div className="mx-auto max-w-7xl pb-10">
                                <RBACGuard
                                    fallback={
                                        <div className="flex items-center justify-center h-64">
                                            <div className="animate-pulse text-muted-foreground text-sm">
                                                Verificando permisos...
                                            </div>
                                        </div>
                                    }
                                >
                                    {children}
                                </RBACGuard>
                            </div>
                        </main>
'@

if ($layoutContent.Contains('{children}') -and $layoutContent -notmatch 'RBACGuard.*fallback') {
    $layoutContent = $layoutContent.Replace($seccionAnterior.Trim(), $seccionNueva.Trim())
    Write-Host "✅ Sección {children} envuelta con RBACGuard" -ForegroundColor Green
} else {
    Write-Host "⚠️  Sección ya modificada o patrón no coincide — verificar manualmente" -ForegroundColor Yellow
}

# ── Escribir archivo ──────────────────────────────────────────
Set-Content -Path $layoutPath -Value $layoutContent -Encoding UTF8
Write-Host "✅ $layoutPath actualizado" -ForegroundColor Green

# ── Verificación rápida ────────────────────────────────────────
$v = Get-Content $layoutPath -Raw
@(
    @{ P = "import \{ RBACGuard \}"; L = "Import RBACGuard" },
    @{ P = "RBACGuard";              L = "RBACGuard en JSX" },
    @{ P = "Verificando permisos";   L = "Fallback configurado" },
    @{ P = "getUser";                L = "Verificación server-side intacta (Guía 0.5)" },
    @{ P = "ThemeInjector";          L = "ThemeInjector intacto (Guía 0.6)" },
    @{ P = "AuthWrapper";            L = "AuthWrapper intacto (Guía 0.5)" }
) | ForEach-Object {
    if ($v -match $_.P) { Write-Host "  ✅ $($_.L)" -ForegroundColor Green }
    else { Write-Host "  ❌ $($_.L) — FALTA" -ForegroundColor Red }
}
```

---

## BLOQUE 8 — FILTRADO RBAC DEL TOOLBAR

📄 **ARCHIVO MODIFICADO** — `src/components/shell/Toolbar.tsx`

**Proposito:** Agregar filtrado RBAC al Toolbar. Despues de fusionar las acciones base con las inyectadas por paginas (`mergedActions`), se filtran las que el usuario no tiene permiso de ejecutar. El resultado (`filteredActions`) es lo que se renderiza.

### DECISIONES DE DISENO

**Por que el filtrado ocurre dentro del Toolbar y no en el `toolbar-config.ts`?**
Porque `tienePermiso()` requiere el contexto del usuario actual — es una funcion del auth-store que depende del estado de sesion. El `toolbar-config.ts` es un archivo estatico sin acceso al store. El Toolbar ya tiene acceso al `pathname` y al store — es el lugar natural para el filtrado.

**Que pasa con los botones sin campo `accion`?**
Los botones inyectados por las paginas via `usePageConfig` no siempre tienen campo `accion`. La logica de filtrado es: si el boton no tiene `accion`, se muestra siempre. Si tiene `accion`, se cruza con `tienePermiso()`. Esto permite que paginas individuales inyecten botones contextuales sin restriccion RBAC automatica.

> **⚠️ Instruccion especial:** Script idempotente — detecta si `filteredActions` ya existe antes de modificar.

```powershell
# ═══════════════════════════════════════════════════════════════
# BLOQUE 8 — AGREGAR FILTRADO RBAC AL TOOLBAR
# ═══════════════════════════════════════════════════════════════

$toolbarPath = "src/components/shell/Toolbar.tsx"
$toolbarContent = Get-Content $toolbarPath -Raw

# ── Cambio 1: Agregar import de useAuth ───────────────────────
if ($toolbarContent -notmatch "import \{ useAuth \}") {
    $toolbarContent = $toolbarContent -replace `
        "import \{ getToolbarActions \} from '@/config/toolbar-config'", `
        "import { getToolbarActions } from '@/config/toolbar-config'`nimport { useAuth } from '@/lib/stores/auth-store'"
    Write-Host "✅ Import de useAuth agregado al Toolbar" -ForegroundColor Green
} else {
    Write-Host "⚠️  Import de useAuth ya existe en Toolbar" -ForegroundColor Yellow
}

# ── Cambio 2: Insertar bloque de filtrado RBAC ────────────────
$bloqueRBAC = @'

    // ── RBAC: filtrar acciones sin permiso (Guía 0.7) ────────────────────
    // Cada botón del toolbar-config.ts tiene un campo 'accion' opcional.
    // Si 'accion' existe → se cruza con tienePermiso().
    // Si 'accion' no existe (botones inyectados por páginas) → se muestra siempre.
    // Resultado: solo aparecen los botones que el usuario puede ejecutar.
    const tienePermiso = useAuth(s => s.tienePermiso)

    const filteredActions = useMemo(() => {
        if (!currentPath) return []
        return mergedActions.filter((action) => {
            if (!action.accion) return true
            return tienePermiso(currentPath, action.accion)
        })
    }, [mergedActions, currentPath, tienePermiso])
'@

if ($toolbarContent -notmatch "filteredActions") {
    $toolbarContent = $toolbarContent -replace `
        '(\s*if \(mergedActions\.length === 0\))', `
        "$bloqueRBAC`n`n`$1"
    Write-Host "✅ Bloque de filtrado RBAC insertado" -ForegroundColor Green
} else {
    Write-Host "⚠️  filteredActions ya existe en Toolbar — no se duplica" -ForegroundColor Yellow
}

# ── Cambio 3: Renombrar mergedActions → filteredActions en el render ──
$toolbarContent = $toolbarContent -replace `
    'if \(mergedActions\.length === 0\) return null', `
    'if (filteredActions.length === 0) return null'

$toolbarContent = $toolbarContent -replace `
    '\{mergedActions\.map\(\(action\)', `
    '{filteredActions.map((action)'

Write-Host "✅ mergedActions → filteredActions en render y guard de longitud" -ForegroundColor Green

# ── Escribir archivo ──────────────────────────────────────────
Set-Content -Path $toolbarPath -Value $toolbarContent -Encoding UTF8
Write-Host "✅ $toolbarPath actualizado" -ForegroundColor Green

# ── Verificación rápida ────────────────────────────────────────
$v = Get-Content $toolbarPath -Raw
@(
    @{ P = "useAuth";            L = "Import useAuth" },
    @{ P = "tienePermiso";       L = "Helper tienePermiso" },
    @{ P = "filteredActions";    L = "Array filtrado RBAC" },
    @{ P = "mergedActions";      L = "Array fusionado (base) intacto" },
    @{ P = "getToolbarActions";  L = "Config base intacto" }
) | ForEach-Object {
    if ($v -match $_.P) { Write-Host "  ✅ $($_.L)" -ForegroundColor Green }
    else { Write-Host "  ❌ $($_.L) — FALTA" -ForegroundColor Red }
}
```

---

## BLOQUE 9 — BARREL EXPORTS DEL SHELL

📄 **ARCHIVO MODIFICADO** — `src/components/shell/index.ts`

**Proposito:** Agregar los 4 exports RBAC al barrel del Shell. Sin este paso, los imports desde `@/components/shell` no resuelven y cualquier pagina que use `ProtectedAction` con el alias de barril falla en compilacion.

> **⚠️ Instruccion especial:** Idempotente — verifica si los exports ya existen antes de agregarlos.

```powershell
# ═══════════════════════════════════════════════════════════════
# BLOQUE 9 — AGREGAR EXPORTS RBAC AL BARREL DEL SHELL
# ═══════════════════════════════════════════════════════════════

$indexPath = "src/components/shell/index.ts"
$indexContent = Get-Content $indexPath -Raw

if ($indexContent -match "RBACGuard") {
    Write-Host "⚠️  Exports RBAC ya existen en index.ts — no se duplica" -ForegroundColor Yellow
} else {
    $rbacExports = @"

// ── Componentes y Hooks RBAC (Guía 0.7) ──────────────────────────────────
// RBACGuard: guard centralizado de rutas en dashboard/layout.tsx
// ProtectedAction: oculta/deshabilita micro-elementos de UI sin permiso
// useCanAction: hook para lógica condicional imperativa (if/else)
// usePermissions: hook para mapa completo de las 5 acciones de un submódulo
export { RBACGuard } from './RBACGuard'
export { ProtectedAction, useCanAction, usePermissions } from './ProtectedAction'
"@

    Add-Content -Path $indexPath -Value $rbacExports -Encoding UTF8
    Write-Host "✅ Exports RBAC agregados a $indexPath" -ForegroundColor Green
}

# ── Verificación ──────────────────────────────────────────────
$v = Get-Content $indexPath -Raw
@("RBACGuard", "ProtectedAction", "useCanAction", "usePermissions") | ForEach-Object {
    if ($v -match $_) { Write-Host "  ✅ Export: $_" -ForegroundColor Green }
    else { Write-Host "  ❌ Falta export: $_" -ForegroundColor Red }
}
```

---

## BLOQUE 10 — VALIDACION DE BUILD

**Proposito:** Script completo que verifica la integridad de toda la Guia 0.7 antes del build final.

```powershell
# ═══════════════════════════════════════════════════════════════
# BLOQUE 10 — VALIDACIÓN COMPLETA — GUÍA 0.7
# ═══════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "VALIDACIÓN COMPLETA — GUÍA 0.7 RBAC VIVO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# ── 1. Archivos nuevos (Partes 1 y 2) ────────────────────────
Write-Host "`n── Archivos nuevos ──" -ForegroundColor Yellow

$nuevos = @(
    "src/app/dashboard/pruebas/page.tsx",
    "src/lib/actions/diagnostico.ts",
    "src/components/shell/RBACGuard.tsx",
    "src/components/shell/ProtectedAction.tsx",
    "src/app/dashboard/sin-acceso/page.tsx"
)

$ok = 0
foreach ($a in $nuevos) {
    if (Test-Path $a) {
        Write-Host "  ✅ $a" -ForegroundColor Green
        $ok++
    } else {
        Write-Host "  ❌ $a — FALTANTE" -ForegroundColor Red
    }
}
Write-Host "  Total: $ok / $($nuevos.Count)" -ForegroundColor White

# ── 2. Modificaciones (Parte 3) ───────────────────────────────
Write-Host "`n── Modificaciones al Shell ──" -ForegroundColor Yellow

$layout  = Get-Content "src/app/dashboard/layout.tsx" -Raw
$toolbar = Get-Content "src/components/shell/Toolbar.tsx" -Raw
$index   = Get-Content "src/components/shell/index.ts" -Raw

@(
    @{ C = $layout;  P = "import \{ RBACGuard \}"; L = "Layout: import RBACGuard" },
    @{ C = $layout;  P = "RBACGuard.*fallback";     L = "Layout: RBACGuard protege children" },
    @{ C = $toolbar; P = "filteredActions";          L = "Toolbar: filtrado RBAC activo" },
    @{ C = $toolbar; P = "tienePermiso";             L = "Toolbar: usa tienePermiso()" },
    @{ C = $index;   P = "RBACGuard";               L = "Barrel: export RBACGuard" },
    @{ C = $index;   P = "ProtectedAction";          L = "Barrel: export ProtectedAction" },
    @{ C = $index;   P = "useCanAction";             L = "Barrel: export useCanAction" },
    @{ C = $index;   P = "usePermissions";           L = "Barrel: export usePermissions" }
) | ForEach-Object {
    if ($_.C -match $_.P) { Write-Host "  ✅ $($_.L)" -ForegroundColor Green }
    else { Write-Host "  ❌ $($_.L) — NO ENCONTRADO" -ForegroundColor Red }
}

# ── 3. Integridad del layout (Guía 0.6 no se rompió) ─────────
Write-Host "`n── Integridad del Shell de Guía 0.6 ──" -ForegroundColor Yellow

@(
    @{ P = "getUser";        L = "Verificación server-side (Guía 0.5)" },
    @{ P = "ThemeInjector";  L = "ThemeInjector — SSR de tema (Guía 0.6)" },
    @{ P = "AuthWrapper";    L = "AuthWrapper — cliente auth (Guía 0.5)" },
    @{ P = "Sidebar";        L = "Sidebar" },
    @{ P = "Topbar";         L = "Topbar" },
    @{ P = "Toolbar";        L = "Toolbar" },
    @{ P = "Footer";         L = "Footer" },
    @{ P = "group flex";     L = "Clase group — colapso del Sidebar" }
) | ForEach-Object {
    if ($layout -match $_.P) { Write-Host "  ✅ $($_.L) — intacto" -ForegroundColor Green }
    else { Write-Host "  ❌ $($_.L) — FALTA (posible regresión)" -ForegroundColor Red }
}

# ── 4. TypeScript ─────────────────────────────────────────────
Write-Host "`n── TypeScript ──" -ForegroundColor Yellow
npx tsc --noEmit 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Sin errores" -ForegroundColor Green
} else {
    Write-Host "  ❌ Con errores:" -ForegroundColor Red
    npx tsc --noEmit
}

# ── 5. ESLint ─────────────────────────────────────────────────
Write-Host "`n── ESLint ──" -ForegroundColor Yellow
npm run lint 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Sin errores ni warnings" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Warnings o errores — ejecutar: npm run lint" -ForegroundColor Yellow
}

# ── 6. Build final ────────────────────────────────────────────
Write-Host "`n── Build ──" -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ BUILD EXITOSO — Guía 0.7 completada" -ForegroundColor Green
    Write-Host "   RBAC activo · Toolbar filtrado · Diagnóstico visible" -ForegroundColor Green
    Write-Host "   → Continuar con Guía 0.8 — Gestión de Usuarios (UI)" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
} else {
    Write-Host "`n❌ BUILD FALLÓ — corregir antes de continuar" -ForegroundColor Red
    Write-Host "   Revisar la sección TypeScript de arriba para ver los errores." -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si `npm run build` falla, no continuar a Guia 0.8. Si la seccion "Integridad del Shell de Guia 0.6" reporta algun ❌, se introdujo una regresion al modificar `layout.tsx` — restaurar el archivo original y reaplicar el Bloque 7 cuidadosamente. Si `filteredActions` no aparece en el Toolbar, el script del Bloque 8 no encontro el patron de insercion — verificar la version del Toolbar de Guia 0.6 y ajustar el regex.

---

## BLOQUE 11 — CHECKLIST DE VERIFICACION VISUAL

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

### GUARDS DE RUTA

**Prueba 1: Acceso denegado (Vendedor → ruta de Sistema)**

1. Login como **Vendedor**
2. Escribir manualmente en la URL: `/dashboard/sistema/usuarios`

| Verificacion | Esperado |
|:-------------|:---------|
| Redirige a `/dashboard/sin-acceso` en menos de 1 segundo | ✅ |
| Pagina muestra "Acceso Denegado" con icono `ShieldX` | ✅ |
| Muestra el rol: "Vendedor" | ✅ |
| Boton "Volver" navega atras | ✅ |
| Boton "Ir al Dashboard" navega a `/dashboard` | ✅ |
| Shell completo visible (Sidebar, Topbar, Footer) | ✅ |
| Sidebar solo muestra modulo Ventas | ✅ |

**Prueba 2: Acceso permitido (Administrador → ruta de Sistema)**

1. Login como **Administrador**
2. Navegar a `/dashboard/sistema/usuarios`

| Verificacion | Esperado |
|:-------------|:---------|
| Muestra la pagina de Usuarios (placeholder por ahora) | ✅ |
| No redirige a sin-acceso | ✅ |
| Sidebar muestra todos los modulos | ✅ |

**Prueba 3: Ruta excluida (bienvenida)**

1. Login como **Administrador** (primera vez — `onboarding_visto = false`)
2. Completar onboarding → redirige a `/dashboard/sistema/bienvenida`

| Verificacion | Esperado |
|:-------------|:---------|
| Muestra la pagina de bienvenida sin redirigir a sin-acceso | ✅ |
| Guard no interfiere con el flujo de onboarding | ✅ |

---

### TOOLBAR FILTRADO

**Prueba 4: Botones filtrados por rol**

1. Login como **Vendedor** → navegar a `/dashboard/ventas/clientes`

| Verificacion | Esperado |
|:-------------|:---------|
| Boton "Nuevo" visible (Vendedor tiene `crear`) | ✅ |
| Boton "Editar" visible (Vendedor tiene `editar`) | ✅ |
| Boton "Eliminar" **NO visible** (Vendedor NO tiene `eliminar`) | ✅ |
| Boton "Exportar" visible o no segun seed | Depende del seed |

2. Logout → Login como **Administrador** → misma ruta

| Verificacion | Esperado |
|:-------------|:---------|
| Boton "Eliminar" **SI visible** | ✅ |
| Todos los botones del config visibles | ✅ |

---

### SIDEBAR FILTRADO (sanidad — resuelto en Guia 0.6)

**Prueba 5:** Login como Vendedor → Sidebar muestra solo modulos del rol. Login como Admin → Sidebar muestra todos.

---

### PAGINA DE DIAGNOSTICO

**Prueba 6:** Navegar a `/dashboard/pruebas` con cada rol y verificar las 5 secciones. Comparar permisos en pantalla con los seeds de Guia 0.4.

---

### MATRIZ DE RESULTADOS ESPERADOS POR ROL

| Rol | `/dashboard` | `/sistema/usuarios` | `/ventas/pedidos` | `/almacen/inventario` | `/facturacion/facturas` |
|:----|:------------:|:-------------------:|:-----------------:|:---------------------:|:-----------------------:|
| Administrador | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gerente | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vendedor | ✅ | ❌ → sin-acceso | ✅ | ❌ → sin-acceso | ❌ → sin-acceso |
| Almacenista | ✅ | ❌ → sin-acceso | ❌ → sin-acceso | ✅ | ❌ → sin-acceso |

> **Nota:** Los resultados exactos dependen de los seeds de `permisos_navegacion` ejecutados en la Guia 0.4. Si los seeds no coinciden con la tabla, usar `/dashboard/pruebas` para inspeccionar el menu y ajustar los permisos en la BD.

---

## BLOQUE 12 — TROUBLESHOOTING Y QUERIES SQL

### Problemas comunes

| Problema | Causa | Solucion |
|:---------|:------|:---------|
| "Verificando permisos..." infinito | Race condition — version antigua del guard con 2 `useEffect` separados | El guard V5.1 usa un solo `useEffect` consolidado. Verificar que el archivo de Bloque 4 no fue mezclado con el codigo anterior |
| Guard redirige a todos los usuarios | `menu[]` en auth-store esta vacio → `puedeVerPagina()` siempre retorna `false` | Navegar a `/dashboard/pruebas` Seccion 1. Si el menu esta vacio: revisar que `obtener_sesion_completa()` retorna datos y que `setAuth()` se llama en el flujo de login |
| Guard no redirige a nadie | `<RBACGuard>` no esta en `layout.tsx` | Ejecutar Bloque 7. Verificar con Bloque 10 que `RBACGuard.*fallback` aparece en el layout |
| Loop infinito de redireccion | `/dashboard/sin-acceso` no esta en `RUTAS_PUBLICAS` del `RBACGuard` | Verificar la constante en `RBACGuard.tsx`. Debe incluir `/dashboard/sin-acceso` exacto |
| Admin rechazado en bienvenida | `/dashboard/sistema/bienvenida` no esta en `RUTAS_PUBLICAS` | Verificar que la ruta esta en la constante del Bloque 4 |
| Parpadeo de contenido privado | Falta `verifiedPath` o la condicion `pathname !== verifiedPath` en el render | Verificar la seccion de render del `RBACGuard` — debe tener la condicion anti-parpadeo |
| Toolbar vacio para todos | `filteredActions` siempre retorna `[]` | Verificar que `currentPath` no es `null` cuando se calcula el `useMemo` |
| Toolbar no filtra botones | `filteredActions` no reemplazo `mergedActions` en el render | Ejecutar Bloque 8 de nuevo. Verificar que el rename del `.map()` se aplico correctamente |
| `AccionRBAC` not found | Tipo inexistente — error de tipeo frecuente | El tipo correcto es `AccionBasica` en `@/types/shell`. Buscar y reemplazar en todo el proyecto |
| Seccion BD vacia en diagnostico | Server Action falla silenciosamente | Verificar en la consola del servidor (terminal donde corre `npm run dev`) el error exacto |

### Queries SQL de diagnostico

Ejecutar en Supabase SQL Editor cuando algo no funciona:

```sql
-- 1. ¿Qué páginas puede ver un rol específico?
SELECT r.nombre AS rol, m.nombre AS modulo, s.nombre AS submodulo, s.href
FROM permisos_navegacion pn
JOIN roles r ON pn.id_rol = r.id
JOIN submodulos s ON pn.id_submodulo = s.id
JOIN modulos m ON s.id_modulo = m.id
WHERE r.nombre = 'Vendedor'  -- Cambiar por el rol a verificar
ORDER BY m.orden, s.orden;

-- 2. ¿Qué puede hacer un rol en cada página?
SELECT r.nombre AS rol, s.href, a.clave AS accion
FROM permisos_acciones pa
JOIN roles r ON pa.id_rol = r.id
JOIN submodulos s ON pa.id_submodulo = s.id
JOIN acciones a ON pa.id_accion = a.id
WHERE r.nombre = 'Vendedor'  -- Cambiar por el rol a verificar
ORDER BY s.href, a.clave;

-- 3. Verificar obtener_sesion_completa() con sesión activa
SELECT obtener_sesion_completa();

-- 4. Conteo de permisos por rol — diagnóstico rápido
SELECT
    r.nombre AS rol,
    COUNT(DISTINCT pn.id_submodulo) AS paginas_navegables,
    COUNT(DISTINCT pa.id) AS acciones_permitidas
FROM roles r
LEFT JOIN permisos_navegacion pn ON r.id = pn.id_rol
LEFT JOIN permisos_acciones pa ON r.id = pa.id_rol
GROUP BY r.nombre
ORDER BY paginas_navegables DESC;

-- 5. Verificar que un usuario específico tiene empresa y rol
SELECT
    u.nombre,
    u.email,
    u.es_activo,
    e.nombre AS empresa,
    r.nombre AS rol
FROM usuarios u
LEFT JOIN empresas e ON u.id_empresa = e.id
LEFT JOIN roles r ON u.id_rol = r.id
WHERE u.id = 'UUID_DEL_USUARIO_AQUI';
```

---

## FINGERPRINT — VALIDACION PARTE 3

```powershell
# ═══════════════════════════════════════════════════════════════
# FINGERPRINT PARTE 3 — VERIFICACIÓN FINAL DE EXISTENCIA
# ═══════════════════════════════════════════════════════════════

Write-Host "`n═══ VALIDACIÓN PARTE 3 — INTEGRACIÓN ═══" -ForegroundColor Cyan

# Verificar que los archivos modificados existen y tienen los cambios
$checks = @(
    @{ Archivo = "src/app/dashboard/layout.tsx";       Patron = "RBACGuard";       Label = "Layout con RBACGuard" },
    @{ Archivo = "src/components/shell/Toolbar.tsx";   Patron = "filteredActions"; Label = "Toolbar con filtrado RBAC" },
    @{ Archivo = "src/components/shell/index.ts";      Patron = "ProtectedAction"; Label = "Barrel con exports RBAC" }
)

$todosOk = $true
foreach ($check in $checks) {
    if (Test-Path $check.Archivo) {
        $contenido = Get-Content $check.Archivo -Raw
        if ($contenido -match $check.Patron) {
            Write-Host "  ✅ $($check.Label)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($check.Label) — modificación no encontrada" -ForegroundColor Red
            $todosOk = $false
        }
    } else {
        Write-Host "  ❌ $($check.Archivo) — archivo no existe" -ForegroundColor Red
        $todosOk = $false
    }
}

if ($todosOk) {
    Write-Host "`n✅ PARTE 3 COMPLETA — Ejecutar Bloque 10 para el build final" -ForegroundColor Green
} else {
    Write-Host "`n❌ Modificaciones incompletas — Revisar bloques anteriores" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si alguna verificacion falla, el guard no esta activo aunque los archivos existan. Las causas mas comunes son:
> - `RBACGuard` no en el layout → Bloque 7 no encontro el patron `{children}`. Agregar el `<RBACGuard>` manualmente.
> - `filteredActions` no en Toolbar → El Bloque 8 no encontro el punto de insercion. Insertar el bloque RBAC manualmente.

---

## RESUMEN DE LA GUIA 0.7 COMPLETA

### Archivos nuevos (5)

| Archivo | Parte | Proposito |
|:--------|:-----:|:----------|
| `src/app/dashboard/pruebas/page.tsx` | 1 | Centro de diagnostico — 5 secciones |
| `src/lib/actions/diagnostico.ts` | 1 | Server Action — conteos reales de BD |
| `src/components/shell/RBACGuard.tsx` | 2 | Guard centralizado de rutas |
| `src/components/shell/ProtectedAction.tsx` | 2 | Ocultar/deshabilitar micro-elementos + hooks |
| `src/app/dashboard/sin-acceso/page.tsx` | 2 | Pagina de denegacion |

### Archivos modificados (3)

| Archivo | Parte | Cambio aplicado |
|:--------|:-----:|:----------------|
| `src/app/dashboard/layout.tsx` | 3 | +1 import RBACGuard · reemplazo seccion `{children}` con guard |
| `src/components/shell/Toolbar.tsx` | 3 | +1 import useAuth · +1 useMemo filtrado · 2 renombres en render |
| `src/components/shell/index.ts` | 3 | +4 exports RBAC |

### Capas de seguridad — estado final

| Capa | Tipo | Estado |
|:-----|:-----|:------:|
| Edge Proxy — Autenticacion | `proxy.ts` (Guia 0.5) | ✅ Activa |
| Server Layout — Verificacion servidor | `layout.tsx` (Guia 0.6) | ✅ Activa |
| Client DOM — Guard de rutas | `RBACGuard` (Guia 0.7) | ✅ **NUEVA** |
| Client DOM — Filtrado de acciones | `Toolbar` filtrado (Guia 0.7) | ✅ **NUEVA** |
| Client DOM — Granularidad fina | `ProtectedAction` (Guia 0.7) | ✅ **Disponible** para Guia 0.8+ |
| Base de Datos — RLS filas | PostgreSQL (Guia 0.3/0.4) | ✅ Activa |

---

## SIGUIENTE GUIA

**-> Guia 0.8** — Gestion de Usuarios (UI)

Primera pagina con datos reales del ERP: `/dashboard/sistema/usuarios`. CRUD completo con tabla paginada, modal de invitacion, edicion de rol, y activacion/desactivacion de usuarios. `<ProtectedAction>` se usa por primera vez en un contexto real de negocio — el boton "Desactivar" solo es visible para Administradores.

---

> **Documento:** GUIA_0_7_Parte3_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
