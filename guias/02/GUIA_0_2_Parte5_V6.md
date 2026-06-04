# GUIA 0.2 — DEPENDENCIAS DE NEGOCIO
## PARTE 5: VERIFICACION FINAL

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 5 de 5 (ultima parte)
> **Prerequisito:** Partes 1-4 completadas — todos los archivos de infraestructura existen
> **Siguiente guia:** `GUIA_0_3_Parte0_V6.md` — Modelo de Datos
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

- **Bloque 1 — `page.tsx` actualizado:** Extiende la pagina de verificacion de la Guia 0.1 con una seccion nueva que demuestra en vivo las utilidades instaladas en esta guia — sin Supabase, sin usuario real. El implementador puede ver con sus propios ojos que Decimal.js calcula correctamente, que los formateadores producen el output esperado y que date-fns habla espanol.
- **Bloque 2 — Validacion final:** Un solo script que verifica que todos los archivos existen y ejecuta `build` + `lint` de forma secuencial.

> **Al terminar esta parte:** La Guia 0.2 esta completa. El proyecto compila, pasa lint y la demo visual confirma que las dependencias de negocio funcionan.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — PAGINA DE VERIFICACION ACTUALIZADA

📄 **ARCHIVO REEMPLAZADO** — `src/app/page.tsx`

**Proposito:** Extender la pagina de verificacion de la Guia 0.1 con evidencia visual de lo instalado en la 0.2. La seccion nueva demuestra tres cosas concretas con datos hardcodeados: (1) Demo de Decimal.js — `0.1 + 0.2` en JavaScript nativo vs con Decimal.js, (2) Demo de formatters — monto, fecha y porcentaje formateados, (3) Demo de calculations — precio con descuento y redondeo bancario.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Pagina (Server Component) |
| Ejecuta en | Servidor (los calculos ocurren en el servidor, el HTML llega ya calculado al browser) |
| Importado por | Next.js App Router (ruta `/`) |
| Importa de | `@/components/theme-switcher`, `@/components/error-boundary`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/label`, `@/lib/utils/formatters`, `@/lib/utils/calculations`, `decimal.js`, `lucide-react`, `next/link` |
| Si lo modificas | Solo afecta la pagina de verificacion. Esta pagina se reemplaza en Guia 0.5 por el redirector Zero-Trust |

### DECISIONES DE DISENO

**Por que Server Component puro y no Client Component?**
Todo es un Server Component sin `'use client'`, sin estado, sin interactividad. Los calculos de Decimal.js y los formateos ocurren en el servidor — el HTML llega ya calculado al navegador. No hay razon para enviar JavaScript de Decimal.js al cliente solo para una demo.

**Por que datos hardcodeados y no datos reales?**
Esta pagina es verificacion de infraestructura, no funcionalidad de negocio. Los datos hardcodeados demuestran que las funciones funcionan sin depender de Supabase ni de un usuario logueado. La Guia 0.5 reemplaza esta pagina completamente.

> **Instruccion especial:** Este archivo reemplaza completamente el `page.tsx` de la Guia 0.1. El contenido anterior (sistema de temas, botones, color boxes) se conserva — la seccion nueva se agrega debajo.

```powershell
$content = @'
// ════════════════════════════════════════════════════════════════════════════
// PÁGINA DE VERIFICACIÓN — GUÍAS 0.1 Y 0.2
//
// Server Component puro — los cálculos ocurren en el servidor.
// Esta página se reemplaza en Guía 0.5 por el redirector Zero-Trust.
// ════════════════════════════════════════════════════════════════════════════

import { ThemeSwitcher } from "@/components/theme-switcher"
import { ErrorBoundary } from "@/components/error-boundary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2, ChevronRight, Layers,
  Palette, ShieldCheck, Zap, AlertCircle,
  Calculator, Clock, DollarSign
} from "lucide-react"
import Link from "next/link"

// Utilidades de la Guía 0.2 — se usan directamente en el Server Component
import { formatearMoneda, formatearFecha, formatearPorcentaje, formatearTiempoRelativo } from "@/lib/utils/formatters"
import { aplicarDescuento, calcularPorcentaje, redondear, toNumber } from "@/lib/utils/calculations"
import Decimal from "decimal.js"

export default function Home() {

  // ── Demo Decimal.js — se calcula en el servidor ──────────────────────────
  const jsNativo = 0.1 + 0.2  // Intencionalmente incorrecto
  const conDecimal = toNumber(new Decimal("0.1").plus("0.2"))

  // ── Demo formatters ───────────────────────────────────────────────────────
  const montoDemo = 49182.50
  const fechaDemo = new Date("2026-01-15")
  const fechaReciente = new Date("2026-04-14T11:00:00")

  const montoFormateado = formatearMoneda(montoDemo)
  const fechaFormateada = formatearFecha(fechaDemo)
  const porcentajeFormateado = formatearPorcentaje(0.16)
  const tiempoRelativo = formatearTiempoRelativo(fechaReciente)

  // ── Demo calculations ─────────────────────────────────────────────────────
  const precioBase = 1250.00
  const descuento = 15
  const precioConDescuento = toNumber(aplicarDescuento(precioBase, descuento))
  const montoDescuento = toNumber(calcularPorcentaje(precioBase, descuento))
  const redondeado = toNumber(redondear(new Decimal("49.555")))

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">

        {/* ── NAVBAR ── */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-8">
            <Link className="flex items-center space-x-2" href="/">
              <Layers className="h-6 w-6 text-primary-accent" />
              <span className="font-bold">Natutech ERP</span>
            </Link>
          </div>
        </header>

        <main className="container max-w-screen-2xl px-4 md:px-8 py-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* ── CONTENIDO PRINCIPAL ── */}
            <div className="space-y-10">

              {/* Hero */}
              <section className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge color="success">Guía 0.1 Completada</Badge>
                  <Badge color="primary">Guía 0.2 Completada</Badge>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                  Fundación del Proyecto Lista
                </h1>
                <p className="text-xl text-muted-foreground">
                  Sistema visual configurado, infraestructura de negocio instalada.
                  Las dependencias que siguen funcionando en cualquier nicho.
                </p>
              </section>

              {/* Status Cards — Guía 0.1 */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Guía 0.1 — Base Visual
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <StatusCard
                    icon={<Zap className="w-5 h-5 text-primary-accent" />}
                    title="Next.js 16.2.3 — App Router"
                    description="Server Components, Server Actions y Edge Runtime listos."
                  />
                  <StatusCard
                    icon={<Palette className="w-5 h-5 text-secondary-accent" />}
                    title="Tailwind + shadcn/ui"
                    description="Sistema de tokens semánticos: 3 paletas × light/dark."
                  />
                  <StatusCard
                    icon={<ShieldCheck className="w-5 h-5 text-success" />}
                    title="TypeScript Strict"
                    description="Modo estricto completo. Errores de tipo en compile time."
                  />
                  <StatusCard
                    icon={<CheckCircle2 className="w-5 h-5 text-warning" />}
                    title="ESLint Seguridad"
                    description="getSession() bloqueado. getUser() obligatorio en todo el proyecto."
                  />
                </div>
              </section>

              {/* ── SECCIÓN NUEVA GUÍA 0.2 ── */}

              {/* Demo Decimal.js */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-primary-accent" />
                  <h2 className="text-2xl font-bold tracking-tight">Decimal.js — Aritmética Exacta</h2>
                </div>
                <p className="text-muted-foreground">
                  JavaScript tiene un problema fundamental con los números decimales.
                  Decimal.js lo resuelve. Aquí la diferencia en vivo:
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-error/40 bg-error-bg p-5">
                    <p className="text-xs font-mono text-muted-foreground mb-2">JavaScript nativo</p>
                    <p className="font-mono text-sm mb-1 text-muted-foreground">0.1 + 0.2 =</p>
                    <p className="font-mono text-2xl font-bold text-error">{jsNativo}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Error de punto flotante IEEE 754. Acumulado en cálculos de facturas, genera discrepancias fiscales.
                    </p>
                  </div>
                  <div className="rounded-xl border border-success/40 bg-success/5 p-5">
                    <p className="text-xs font-mono text-muted-foreground mb-2">Con Decimal.js</p>
                    <p className="font-mono text-sm mb-1 text-muted-foreground">new Decimal(&quot;0.1&quot;).plus(&quot;0.2&quot;) =</p>
                    <p className="font-mono text-2xl font-bold text-success">{conDecimal}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Precisión exacta. Configurado con 20 dígitos y ROUND_HALF_UP estándar bancario.
                    </p>
                  </div>
                </div>

                {/* Demo calculations */}
                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <p className="text-sm font-semibold">Funciones de calculations.ts en acción</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-sm">
                    <DemoCell label="Precio base" value={formatearMoneda(precioBase)} />
                    <DemoCell label={`Descuento ${descuento}%`} value={`- ${formatearMoneda(montoDescuento)}`} />
                    <DemoCell label="Precio final" value={formatearMoneda(precioConDescuento)} accent />
                    <DemoCell label="redondear(49.555)" value={String(redondeado)} />
                  </div>
                </div>
              </section>

              {/* Demo formatters */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-secondary-accent" />
                  <h2 className="text-2xl font-bold tracking-tight">formatters.ts — Presentación Universal</h2>
                </div>
                <p className="text-muted-foreground">
                  Todas las funciones usan <code className="text-xs bg-muted px-1 py-0.5 rounded">Intl</code> nativo
                  del navegador — sin dependencias externas. El locale y la moneda son parámetros,
                  no constantes: funciona para cualquier país.
                </p>

                <div className="rounded-xl border border-border bg-surface overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Función</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Input</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <FormatRow fn="formatearMoneda()" input={String(montoDemo)} output={montoFormateado} />
                      <FormatRow fn="formatearFecha()" input="2026-01-15" output={fechaFormateada} />
                      <FormatRow fn="formatearPorcentaje()" input="0.16" output={porcentajeFormateado} />
                      <FormatRow fn="formatearTiempoRelativo()" input="hace 3 horas" output={tiempoRelativo} />
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Sistema de temas — heredado de Guía 0.1 */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold tracking-tight">Componentes UI Base — Guía 0.1</h2>
                </div>
                <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label htmlFor="demo-input">Input con ring semántico</Label>
                      <Input id="demo-input" placeholder="Haz clic para ver el ring de foco..." />
                    </div>
                    <div className="flex flex-wrap gap-3 items-start">
                      <Button variant="default">Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Color boxes */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Sistema de Tokens — Cambia con el Tema</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <ColorBox className="bg-background text-foreground border-border" label="background" />
                  <ColorBox className="bg-surface text-foreground border-border" label="surface" />
                  <ColorBox className="bg-primary-accent text-primary-accent-text border-transparent" label="primary-accent" />
                  <ColorBox className="bg-secondary-accent text-secondary-accent-text border-transparent" label="secondary-accent" />
                  <ColorBox className="bg-success text-white border-transparent" label="success" />
                  <ColorBox className="bg-warning text-white border-transparent" label="warning" />
                  <ColorBox className="bg-error text-white border-transparent" label="error" />
                  <ColorBox className="bg-info text-white border-transparent" label="info" />
                </div>
              </section>

            </div>

            {/* ── PANEL LATERAL ── */}
            <div className="space-y-6">
              <div className="sticky top-24 space-y-6">

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 bg-primary-accent rounded-full h-6" />
                  <h2 className="text-xl font-bold">Panel de Control</h2>
                </div>

                {/* ThemeSwitcher */}
                <ThemeSwitcher />

                {/* Checklist Guía 0.1 */}
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Guía 0.1 — Base Visual
                  </h3>
                  <ul className="space-y-2">
                    <ChecklistItem text="Next.js 16.2.3 + TypeScript strict" />
                    <ChecklistItem text="Tailwind 3.4 + sistema semántico" />
                    <ChecklistItem text="shadcn/ui instalado localmente" />
                    <ChecklistItem text="Button, Input, Label premium" />
                    <ChecklistItem text="3 paletas × light/dark (6 temas)" />
                    <ChecklistItem text="Error Boundary global" />
                    <ChecklistItem text="ESLint: getSession() bloqueado" />
                  </ul>
                </div>

                {/* Checklist Guía 0.2 */}
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-primary-accent" />
                    Guía 0.2 — Infraestructura de Negocio
                  </h3>
                  <ul className="space-y-2">
                    <ChecklistItem text="Supabase SSR: browser + server + proxy" />
                    <ChecklistItem text="Zod: errores en español + loginSchema" />
                    <ChecklistItem text="Decimal.js: precisión 20, ROUND_HALF_UP" />
                    <ChecklistItem text="Formatters: moneda, fechas, porcentaje" />
                    <ChecklistItem text="date-fns: locale es + funciones base" />
                    <ChecklistItem text="Zustand: auth store SSR-safe" />
                    <ChecklistItem text="jsPDF + html2canvas: generador PDF" />
                    <ChecklistItem text="TanStack Table, Sonner, Radix avanzados" />
                  </ul>
                </div>

                {/* Nota siguiente paso */}
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
                    <span>
                      <strong>Siguiente:</strong> Guías 0.3 y 0.4 son trabajo en Supabase
                      (modelo de datos + SQL). La Guía 0.5 implementa autenticación Zero-Trust
                      y reemplaza esta página por el redirector de login.
                    </span>
                  </p>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SUBCOMPONENTES LOCALES
// Solo se usan en esta página de verificación — no se exportan.
// ════════════════════════════════════════════════════════════════════════════

function Badge({ children, color }: { children: React.ReactNode; color: 'success' | 'primary' }) {
  const styles = {
    success: "bg-success/10 text-success ring-success/20",
    primary: "bg-primary-accent/10 text-primary-accent ring-primary-accent/20",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium ring-1 ring-inset ${styles[color]}`}>
      <span className={`h-2 w-2 rounded-full ${color === 'success' ? 'bg-success' : 'bg-primary-accent'}`} />
      {children}
    </span>
  )
}

function StatusCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 hover:shadow-premium-sm transition-shadow">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function DemoCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-mono font-semibold ${accent ? 'text-primary-accent' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}

function FormatRow({ fn, input, output }: { fn: string; input: string; output: string }) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-primary-accent">{fn}</td>
      <td className="px-4 py-3 text-muted-foreground">{input}</td>
      <td className="px-4 py-3 font-semibold">{output}</td>
    </tr>
  )
}

function ColorBox({ className, label }: { className: string; label: string }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border">
      <div className={`h-20 w-full ${className}`} />
      <div className="bg-surface p-2 text-xs font-mono border-t border-border text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-muted-foreground">
      <ChevronRight className="w-4 h-4 text-primary-accent shrink-0 mt-0.5" />
      {text}
    </li>
  )
}
'@

New-Item -Path "src/app/page.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/page.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/page.tsx actualizado" -ForegroundColor Green
Write-Host "🧮 Demo Decimal.js: JS nativo vs Decimal — diferencia visual en pantalla" -ForegroundColor Cyan
Write-Host "💰 Demo formatters: moneda, fecha, porcentaje, tiempo relativo" -ForegroundColor Cyan
Write-Host "📐 Demo calculations: descuento 15%, redondeo bancario" -ForegroundColor Cyan
```

---

## BLOQUE 2 — VALIDACION FINAL

> **Secuencial obligatorio:** Ejecutar `build` y `lint` por separado. La ejecucion concurrente produce colisiones de cache en `.next/` que generan errores falsos.

```powershell
Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  VALIDACIÓN FINAL — GUÍA 0.2" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Cyan

# ── 1. Archivos de la Guía 0.2 ───────────────────────────────────────────────
Write-Host "1. Verificando archivos..." -ForegroundColor Yellow

$archivos = @(
  "src/lib/supabase/client.ts",
  "src/lib/supabase/server.ts",
  "src/lib/supabase/proxy.ts",
  "src/lib/utils/validators.ts",
  "src/lib/utils/calculations.ts",
  "src/lib/utils/formatters.ts",
  "src/lib/utils/dates.ts",
  "src/lib/stores/auth-store.ts",
  "src/lib/pdf/generador.ts",
  "src/app/page.tsx"
)

$allOk = $true
foreach ($f in $archivos) {
  if (Test-Path $f) {
    Write-Host "  ✅ $f" -ForegroundColor Green
  } else {
    Write-Host "  ❌ $f — volver a la parte correspondiente" -ForegroundColor Red
    $allOk = $false
  }
}

# ── 2. Build ──────────────────────────────────────────────────────────────────
Write-Host "`n2. Ejecutando build..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
  Write-Host "  ✅ Build exitoso" -ForegroundColor Green
} else {
  Write-Host "  ❌ Build falló — leer errores y corregir antes de continuar" -ForegroundColor Red
  $allOk = $false
}

# ── 3. Lint ───────────────────────────────────────────────────────────────────
Write-Host "`n3. Ejecutando lint..." -ForegroundColor Yellow
npm run lint

if ($LASTEXITCODE -eq 0) {
  Write-Host "  ✅ ESLint sin errores" -ForegroundColor Green
} else {
  Write-Host "  ❌ ESLint reporta errores — revisar y corregir" -ForegroundColor Red
  $allOk = $false
}

# ── Resultado ─────────────────────────────────────────────────────────────────
if ($allOk) {
  Write-Host "`n✅ GUÍA 0.2 COMPLETADA — Infraestructura de negocio lista" -ForegroundColor Green
  Write-Host "   npm run dev → abrir http://localhost:3000 para verificación visual`n" -ForegroundColor Cyan
} else {
  Write-Host "`n❌ GUÍA 0.2 INCOMPLETA — corregir los ❌ antes de continuar a la Guía 0.3" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si el build falla por alguno de los archivos nuevos, la causa mas comun es un error de importacion — verificar que las rutas `@/lib/utils/...` coinciden con la estructura de carpetas creada. Si lint falla con `getSession`, buscar el archivo con `Select-String -Path "src/**/*.ts" -Pattern "getSession" -Recurse`.

---

## RESUMEN COMPLETO DE LA GUIA 0.2

**En terminos humanos — que hace cada archivo:**

| Archivo | Para que sirve en la vida real |
|:--------|:-------------------------------|
| `supabase/client.ts` | Le dice a la app como hablar con la base de datos desde el navegador del usuario |
| `supabase/server.ts` | Le dice a la app como hablar con la base de datos desde el servidor (sin pasar por el navegador) |
| `supabase/proxy.ts` | El guardia de seguridad: revisa en cada clic si el usuario sigue con sesion activa y renueva su pase automaticamente |
| `utils/validators.ts` | El formulario que no deja enviar datos malos. Si el email no tiene @, si la contrasena es corta — lo atrapa antes de llegar al servidor |
| `utils/calculations.ts` | La calculadora que no miente. JavaScript dice que 0.1 + 0.2 = 0.30000000000000004. Esta libreria dice 0.3 |
| `utils/formatters.ts` | El que convierte 49182.5 en "$49,182.50" y 1704067200 en "15/01/2026". Para que los numeros se vean como los entienden las personas |
| `utils/dates.ts` | El que sabe cuantos dias han pasado, en que rango cae una fecha, y dice "hace 3 horas" en lugar de un timestamp |
| `stores/auth-store.ts` | La memoria de quien esta logueado. Sin esto, cada recarga de pagina olvida al usuario |
| `pdf/generador.ts` | El que toma cualquier seccion de la pantalla y la convierte en un PDF descargable |

---

## SIGUIENTE GUIA

**-> Guia 0.3 — Modelo de Datos** (documento de referencia, no ejecutable)

Documenta el diseno completo de la base de datos: tablas, relaciones, convenciones de nomenclatura y sistema de permisos. Es lectura pura — el SQL ejecutable esta en la Guia 0.4.

---

> **Documento:** GUIA_0_2_Parte5_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
