# GUIA 0.2 — DEPENDENCIAS DE NEGOCIO
## PARTE 3: INFRAESTRUCTURA DE VALIDACION Y CALCULO

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 3 de 5
> **Prerequisito:** Parte 2 completada — `src/lib/supabase/proxy.ts` existe y el Fingerprint paso
> **Siguiente parte:** `GUIA_0_2_Parte4_V6.md` — Fechas, Auth Store y Generacion de PDF
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Establecer la infraestructura de validacion y calculo que cualquier ERP o app de negocio necesita, independientemente del nicho. Esta parte es **dominio-agnostica**: no contiene schemas de productos, clientes ni pedidos — esos pertenecen al modelo de datos especifico de cada proyecto y se definen en las guias de modulo (Fase 1.x en adelante).

Lo que si se establece aqui es la base solida que todas esas guias dan por sentada:

- **Bloque 1 — `validators.ts`:** Configuracion global de Zod con mensajes en espanol + schema de autenticacion. El unico schema que toda app necesita sin excepcion.
- **Bloque 2 — `calculations.ts`:** Configuracion global de Decimal.js + funciones matematicas de uso universal (redondeo, descuentos, conversion). Sin impuestos ni logica de negocio especifica.
- **Bloque 3 — `formatters.ts`:** Funciones de formateo con locale y moneda como parametros — funciona para cualquier pais y moneda, no solo MXN.

> **Al terminar esta parte:** El proyecto tiene la infraestructura de validacion y aritmetica configurada. Cualquier guia de modulo posterior puede agregar sus propios schemas Zod y funciones de calculo sobre esta base sin tocar estos archivos.

> **Donde van los schemas de negocio?** En `src/lib/utils/validators/` como archivos separados por modulo — `pedidos.ts`, `clientes.ts`, `inventario.ts`. Cada uno importa Zod (ya configurado en espanol por este modulo) y exporta sus propios schemas e inferencias. Nunca se agregan al `validators.ts` de esta parte.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — `validators.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/utils/validators.ts`

**Proposito:** Dos responsabilidades que no pueden separarse: (1) configurar globalmente el mapa de errores de Zod en espanol — si este archivo no se importa, los errores aparecen en ingles en toda la app; (2) definir el `loginSchema` — el unico schema que toda app con autenticacion necesita y que tiene una restriccion tecnica fija (minimo 8 caracteres por configuracion de Supabase Auth).

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Validaciones |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | Todos los modulos que usen Zod (heredan el mapa de errores en espanol), `LoginStep.tsx` (loginSchema) |
| Importa de | `zod` |
| Contrato | Exporta `loginSchema`, `LoginInput`. Configura `z.setErrorMap()` globalmente al importarse |
| Si lo modificas | El mapa de errores afecta a todos los schemas de la app. Cambiar `loginSchema` puede romper el formulario de login |

### DECISIONES DE DISENO

**Por que el mapa de errores va aqui y no en un archivo separado?**
Zod aplica el mapa de errores globalmente con `z.setErrorMap()` en el momento en que se importa. Si estuviera en un archivo separado que algun modulo olvidara importar, los errores de ese modulo aparecerian en ingles. Al incluirlo en `validators.ts` — que todo el proyecto importa — se garantiza que siempre se aplica antes del primer uso de Zod.

**Por que `loginSchema` va aqui y no en un modulo de autenticacion?**
El schema de login tiene una restriccion tecnica dictada por Supabase Auth, no por la logica de negocio: contrasenas de menos de 8 caracteres son rechazadas a nivel de servidor. Al tenerlo aqui, junto a la configuracion de Zod, queda claro que es infraestructura — no regla de negocio. Los schemas de negocio (clientes, productos, pedidos) van en sus modulos correspondientes.

```powershell
New-Item -Path "src/lib/utils" -ItemType Directory -Force | Out-Null

$content = @'
// ════════════════════════════════════════════════════════════════════════════
// INFRAESTRUCTURA DE VALIDACIÓN — ZOD
//
// Este archivo hace DOS cosas que deben permanecer juntas:
//   1. Configura el mapa de errores de Zod en español (globalemente)
//   2. Define loginSchema — el único schema de infraestructura de la app
//
// Los schemas de negocio (clientes, productos, pedidos, etc.) van en:
//   src/lib/utils/validators/[modulo].ts
// Cada uno importa { z } from 'zod' y hereda el mapa de errores en español
// automáticamente porque este módulo se importa antes en el árbol de módulos.
// ════════════════════════════════════════════════════════════════════════════

import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// MAPA DE ERRORES EN ESPAÑOL
// Se aplica globalmente al importar este módulo por primera vez.
// Afecta a todos los schemas Zod de la aplicación.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Traduce los mensajes de error genéricos de Zod al español.
 * Los mensajes explícitos en cada schema (.min(8, 'Mínimo 8 caracteres'))
 * tienen precedencia sobre este mapa — el mapa solo aplica como fallback
 * cuando no se especificó un mensaje personalizado.
 */
const errorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: 'Este campo es requerido' }
      }
      return { message: `Se esperaba ${issue.expected}, se recibió ${issue.received}` }

    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: `Mínimo ${issue.minimum} caracteres` }
      }
      if (issue.type === 'number') {
        return { message: `El valor mínimo es ${issue.minimum}` }
      }
      if (issue.type === 'array') {
        return { message: `Se requiere al menos ${issue.minimum} elemento(s)` }
      }
      break

    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Máximo ${issue.maximum} caracteres` }
      }
      if (issue.type === 'number') {
        return { message: `El valor máximo es ${issue.maximum}` }
      }
      break

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') {
        return { message: 'Correo electrónico inválido' }
      }
      if (issue.validation === 'url') {
        return { message: 'URL inválida' }
      }
      if (issue.validation === 'uuid') {
        return { message: 'Identificador inválido' }
      }
      break

    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor no permitido. Opciones: ${issue.options.join(', ')}` }
  }

  // Fallback: usar el mensaje por defecto de Zod si no hay traducción
  return { message: ctx.defaultError }
}

// Aplicar el mapa globalmente — se ejecuta al importar este módulo
z.setErrorMap(errorMap)

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA DE AUTENTICACIÓN
// Infraestructura — no lógica de negocio.
// La restricción de 8 caracteres la impone Supabase Auth a nivel de servidor.
// El schema la replica para que el error aparezca en la UI antes del request.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schema de login.
 * Usado en: src/components/auth/LoginStep.tsx
 *
 * password.min(8): Supabase Auth rechaza contraseñas < 8 caracteres.
 * Sin esta restricción en el frontend, el servidor retornaría un error
 * genérico que el usuario no sabría interpretar.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo electrónico inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

/** Tipo TypeScript inferido del schema — usar en vez de definirlo manualmente */
export type LoginInput = z.infer<typeof loginSchema>
'@

New-Item -Path "src/lib/utils/validators.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/utils/validators.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/utils/validators.ts creado" -ForegroundColor Green
Write-Host "🌐 Mapa de errores Zod configurado en español (global)" -ForegroundColor Cyan
Write-Host "🔐 loginSchema — único schema de infraestructura, min(8) por Supabase Auth" -ForegroundColor Cyan
```

---

## BLOQUE 2 — `calculations.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/utils/calculations.ts`

**Proposito:** Configurar Decimal.js globalmente y proveer las funciones matematicas que cualquier app de negocio necesita, independientemente del nicho: redondeo con estandar bancario, aplicacion de descuentos por porcentaje, conversion segura a `number` nativo para JSON y APIs.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Utilidades |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | Modulos de negocio (`calculations/impuestos.ts`, `calculations/pedidos.ts`), pagina de verificacion |
| Importa de | `decimal.js` |
| Contrato | Exporta `redondear()`, `aplicarDescuento()`, `calcularPorcentaje()`, `toNumber()`, `sumar()`. Configura `Decimal.set()` globalmente |
| Si lo modificas | Cambiar la precision o el redondeo afecta todos los calculos financieros de la app |

### DECISIONES DE DISENO

**Por que `precision: 20` y `ROUND_HALF_UP`?**
`precision: 20` cubre montos de hasta billones con 6 decimales de precision — suficiente para cualquier operacion financiera. `ROUND_HALF_UP` es el estandar bancario: `0.005` redondea a `0.01`, no a `0.00` (que seria `ROUND_HALF_EVEN`). Este comportamiento es el que esperan contadores, auditores y sistemas fiscales de LATAM.

**Por que las funciones reciben `number | Decimal` y no solo `Decimal`?**
Los datos que llegan de Supabase, formularios y APIs son `number` o `string`. Forzar `Decimal` en los parametros obligaria a convertir en cada llamada — codigo verboso. Las funciones aceptan ambos y convierten internamente con `new Decimal(valor)`, que maneja correctamente `number`, `string` y `Decimal` como entrada.

```powershell
$content = @'
// ════════════════════════════════════════════════════════════════════════════
// INFRAESTRUCTURA DE CÁLCULO — DECIMAL.JS
//
// Este archivo hace DOS cosas que deben permanecer juntas:
//   1. Configura Decimal.js globalmente (precisión y redondeo)
//   2. Provee funciones matemáticas de uso universal
//
// Las funciones de negocio (cálculo de impuestos, totales de pedido, etc.)
// van en: src/lib/utils/calculations/[modulo].ts
// Cada uno importa Decimal from 'decimal.js' y hereda la configuración global
// porque este módulo se importa primero en el árbol de dependencias.
// ════════════════════════════════════════════════════════════════════════════

import Decimal from 'decimal.js'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN GLOBAL DE DECIMAL.JS
// Se aplica al importar este módulo por primera vez.
// Afecta a todas las instancias de Decimal en la aplicación.
// ─────────────────────────────────────────────────────────────────────────────

Decimal.set({
  // 20 dígitos significativos — cubre billones con 6 decimales de precisión
  precision: 20,

  // Estándar bancario: 0.005 → 0.01 (no 0.00)
  // Es el comportamiento que esperan sistemas fiscales de LATAM
  rounding: Decimal.ROUND_HALF_UP,

  // Notación científica solo para números fuera del rango normal de operación
  toExpNeg: -9,
  toExpPos: 21,
})

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES DE USO UNIVERSAL
// Sin lógica de negocio — aplican en cualquier nicho
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Redondea un valor a N decimales con ROUND_HALF_UP (estándar bancario).
 *
 * Usar al guardar montos en la BD, mostrarlos al usuario o
 * compararlos con otros valores formateados.
 *
 * @param valor  Número a redondear
 * @param decimales  Posiciones decimales (default: 2 para moneda)
 *
 * @example
 *   redondear(49.555)    → Decimal(49.56)
 *   redondear(49.554)    → Decimal(49.55)
 *   redondear(1.2345, 3) → Decimal(1.235)
 */
export function redondear(valor: number | Decimal, decimales: number = 2): Decimal {
  return new Decimal(valor).toDecimalPlaces(decimales, Decimal.ROUND_HALF_UP)
}

/**
 * Aplica un descuento porcentual sobre un valor base.
 *
 * @param base       Valor original antes del descuento
 * @param porcentaje Descuento en porcentaje (0–100). Ejemplo: 15 = 15%
 * @returns          Valor después de aplicar el descuento
 *
 * @example
 *   aplicarDescuento(1000, 15) → Decimal(850)   // 1000 - 15% = 850
 *   aplicarDescuento(500, 0)   → Decimal(500)    // Sin descuento
 */
export function aplicarDescuento(
  base: number | Decimal,
  porcentaje: number | Decimal
): Decimal {
  const baseDecimal = new Decimal(base)
  const factor = new Decimal(1).minus(new Decimal(porcentaje).dividedBy(100))
  return baseDecimal.times(factor)
}

/**
 * Calcula el monto de un porcentaje sobre una base.
 * Útil para calcular cualquier tasa o cargo: impuestos, comisiones, etc.
 *
 * @param base       Valor base sobre el que se calcula el porcentaje
 * @param porcentaje Porcentaje como número entero (0–100). Ejemplo: 16 = 16%
 * @returns          Monto del porcentaje (no el total — solo la parte)
 *
 * @example
 *   calcularPorcentaje(1000, 16) → Decimal(160)   // 16% de 1000
 *   calcularPorcentaje(850, 8)   → Decimal(68)    // 8% de 850
 */
export function calcularPorcentaje(
  base: number | Decimal,
  porcentaje: number | Decimal
): Decimal {
  return new Decimal(base).times(new Decimal(porcentaje).dividedBy(100))
}

/**
 * Convierte un Decimal a number nativo de JavaScript.
 * Siempre redondea a 2 decimales antes de convertir para evitar
 * que la precisión extendida de Decimal produzca números como 49.999999999.
 *
 * Usar al serializar datos para JSON, APIs o bases de datos
 * que no aceptan el tipo Decimal directamente.
 *
 * @example
 *   toNumber(new Decimal(49.555)) → 49.56
 *   toNumber(new Decimal(1000))   → 1000
 */
export function toNumber(valor: Decimal): number {
  return redondear(valor, 2).toNumber()
}

/**
 * Suma un array de valores con precisión Decimal.
 * Equivalente seguro a array.reduce((a, b) => a + b, 0) para montos.
 *
 * @example
 *   sumar([100.1, 200.2, 300.3]) → Decimal(600.6)
 *   sumar([])                    → Decimal(0)
 */
export function sumar(valores: (number | Decimal)[]): Decimal {
  return valores.reduce(
    (acum: Decimal, val) => acum.plus(new Decimal(val)),
    new Decimal(0)
  )
}
'@

New-Item -Path "src/lib/utils/calculations.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/utils/calculations.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/utils/calculations.ts creado" -ForegroundColor Green
Write-Host "🔢 Decimal.js configurado — precision 20, ROUND_HALF_UP estándar bancario" -ForegroundColor Cyan
Write-Host "📐 5 funciones universales: redondear, aplicarDescuento, calcularPorcentaje, toNumber, sumar" -ForegroundColor Cyan
```

---

## BLOQUE 3 — `formatters.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/utils/formatters.ts`

**Proposito:** Funciones de presentacion de datos al usuario. Todas usan las APIs nativas `Intl.NumberFormat` e `Intl.DateTimeFormat` — sin dependencias externas, con soporte completo para cualquier locale y moneda.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Utilidades |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | Todos los componentes que presenten moneda, fechas o porcentajes al usuario |
| Importa de | `decimal.js` (para conversion de Decimal a number) |
| Contrato | Exporta `formatearMoneda()`, `formatearNumero()`, `formatearPorcentaje()`, `parsearMoneda()`, `formatearFecha()`, `formatearFechaHora()`, `formatearFechaLarga()`, `formatearTiempoRelativo()` |
| Si lo modificas | Todos los datos presentados al usuario cambian de formato |

### DECISIONES DE DISENO

**Por que `locale` y `moneda` son parametros con defaults en lugar de constantes fijas?**
Al recibirlos como parametros con defaults, el mismo archivo sirve para cualquier pais: `formatearMoneda(monto, 'es-CO', 'COP')` para Colombia, `formatearMoneda(monto, 'es-AR', 'ARS')` para Argentina. El proyecto que use esta guia como base solo cambia el default en un lugar.

**Por que `Intl` nativo en lugar de `date-fns` para formatear?**
`date-fns` se usa para **operar** con fechas (sumar dias, comparar, calcular diferencias). Para **presentar** una fecha ya calculada, `Intl.DateTimeFormat` es suficiente y evita importar date-fns solo para formatear strings. Menos bundle, misma capacidad.

```powershell
$content = @'
// ════════════════════════════════════════════════════════════════════════════
// INFRAESTRUCTURA DE FORMATEO — PRESENTACIÓN AL USUARIO
//
// Todas las funciones usan APIs nativas del navegador (Intl) — sin
// dependencias externas. Compatible con cualquier locale y moneda.
//
// Las funciones específicas de negocio (formateo de estados de pedido,
// etiquetas de semáforo de vencimiento, etc.) van en sus módulos
// correspondientes e importan desde aquí lo que necesiten.
// ════════════════════════════════════════════════════════════════════════════

import Decimal from 'decimal.js'

// ─────────────────────────────────────────────────────────────────────────────
// FORMATEO DE MONEDA Y NÚMEROS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea un monto como moneda con símbolo.
 * El locale y la moneda son configurables para soportar cualquier país.
 *
 * @param monto   Valor a formatear (Decimal o number)
 * @param locale  Locale BCP 47 (default: 'es-MX')
 * @param moneda  Código ISO 4217 (default: 'MXN')
 *
 * @example
 *   formatearMoneda(49182.02)               → "$49,182.02"
 *   formatearMoneda(49182.02, 'es-CO', 'COP') → "$ 49.182,02"
 *   formatearMoneda(49182.02, 'en-US', 'USD') → "$49,182.02"
 */
export function formatearMoneda(
  monto: Decimal | number,
  locale: string = 'es-MX',
  moneda: string = 'MXN'
): string {
  const valor = monto instanceof Decimal ? monto.toNumber() : monto
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: moneda,
  }).format(valor)
}

/**
 * Formatea un número con separador de miles y 2 decimales fijos.
 * Útil cuando se quiere el valor numérico sin símbolo de moneda.
 *
 * @example
 *   formatearNumero(49182.02) → "49,182.02"   (locale es-MX)
 *   formatearNumero(49182.02, 'de-DE') → "49.182,02"
 */
export function formatearNumero(
  valor: Decimal | number,
  locale: string = 'es-MX'
): string {
  const num = valor instanceof Decimal ? valor.toNumber() : valor
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

/**
 * Formatea un decimal (0–1) como porcentaje legible.
 *
 * @param valor   Decimal entre 0 y 1 (0.16 = 16%)
 * @param locale  Locale BCP 47 (default: 'es-MX')
 *
 * @example
 *   formatearPorcentaje(0.16) → "16 %"
 *   formatearPorcentaje(0.08) → "8 %"
 */
export function formatearPorcentaje(
  valor: number,
  locale: string = 'es-MX'
): string {
  return new Intl.NumberFormat(locale, { style: 'percent' }).format(valor)
}

/**
 * Convierte un string de moneda formateado de vuelta a Decimal.
 * Útil para procesar inputs del usuario que ya vienen formateados.
 *
 * @example
 *   parsearMoneda("$49,182.02") → Decimal(49182.02)
 *   parsearMoneda("49.182,02")  → Decimal(4918202)  ← atención al locale
 */
export function parsearMoneda(monedaStr: string): Decimal {
  // Elimina símbolo de moneda, espacios y separadores de miles comunes
  const limpio = monedaStr.replace(/[$€£¥,\s]/g, '')
  return new Decimal(limpio)
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMATEO DE FECHAS
// Para operaciones con fechas (sumar días, comparar) usar date-fns.
// Para presentar una fecha ya calculada, estas funciones son suficientes.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea una fecha en formato corto: dd/mm/aaaa.
 *
 * @example
 *   formatearFecha(new Date('2026-04-14')) → "14/04/2026"
 *   formatearFecha('2026-04-14')           → "14/04/2026"
 */
export function formatearFecha(
  fecha: Date | string,
  locale: string = 'es-MX'
): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * Formatea una fecha con hora: dd/mm/aaaa HH:mm.
 * Usa formato de 24 horas — estándar en sistemas de negocio de LATAM.
 *
 * @example
 *   formatearFechaHora(new Date('2026-04-14T14:30:00')) → "14/04/2026 14:30"
 */
export function formatearFechaHora(
  fecha: Date | string,
  locale: string = 'es-MX'
): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Formatea una fecha en formato largo con nombre del mes.
 * Útil para encabezados de documentos, reportes y confirmaciones.
 *
 * @example
 *   formatearFechaLarga(new Date('2026-04-14')) → "14 de abril de 2026"
 */
export function formatearFechaLarga(
  fecha: Date | string,
  locale: string = 'es-MX'
): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Formatea una fecha como tiempo relativo al momento actual.
 * Útil para feeds de actividad, timestamps de comentarios, etc.
 *
 * @example
 *   formatearTiempoRelativo(hace 2 días) → "hace 2 días"
 *   formatearTiempoRelativo(en 3 horas)  → "en 3 horas"
 */
export function formatearTiempoRelativo(
  fecha: Date | string,
  locale: string = 'es-MX'
): string {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha
  const ahora = new Date()
  const diffMs = date.getTime() - ahora.getTime()
  const diffSegundos = Math.round(diffMs / 1000)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  // Seleccionar la unidad más legible según la magnitud de la diferencia
  const abs = Math.abs(diffSegundos)
  if (abs < 60)   return rtf.format(diffSegundos, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSegundos / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSegundos / 3600), 'hour')
  if (abs < 2592000) return rtf.format(Math.round(diffSegundos / 86400), 'day')
  if (abs < 31536000) return rtf.format(Math.round(diffSegundos / 2592000), 'month')
  return rtf.format(Math.round(diffSegundos / 31536000), 'year')
}
'@

New-Item -Path "src/lib/utils/formatters.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/utils/formatters.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/utils/formatters.ts creado" -ForegroundColor Green
Write-Host "🌍 locale y moneda como parámetros — funciona para cualquier país" -ForegroundColor Cyan
Write-Host "📅 formatearTiempoRelativo incluido — útil en feeds y actividad reciente" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 3

```powershell
Write-Host "`nValidando Parte 3 de la Guía 0.2..." -ForegroundColor Yellow

$files = @(
  "src/lib/utils/validators.ts",
  "src/lib/utils/calculations.ts",
  "src/lib/utils/formatters.ts"
)

$allOk = $true
foreach ($f in $files) {
  if (Test-Path $f) {
    Write-Host "  ✅ $f" -ForegroundColor Green
  } else {
    Write-Host "  ❌ $f NO existe — repetir el bloque correspondiente" -ForegroundColor Red
    $allOk = $false
  }
}

if ($allOk) {
  Write-Host "`n✅ PARTE 3 COMPLETADA — Infraestructura de validación y cálculo lista" -ForegroundColor Green
} else {
  Write-Host "`n❌ PARTE 3 INCOMPLETA — corregir antes de continuar" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si algun archivo no existe, repetir solo ese bloque. Los 3 deben existir antes de continuar — las partes siguientes los importan directamente.

---

## RESUMEN DE ESTA PARTE

**3 archivos creados — infraestructura generica, dominio-agnostica:**

| Archivo | Que instala | Lo que NO contiene |
|:--------|:------------|:-------------------|
| `src/lib/utils/validators.ts` | Config global de Zod en espanol + `loginSchema` | Schemas de clientes, productos, pedidos |
| `src/lib/utils/calculations.ts` | Config global de Decimal.js + 5 funciones matematicas universales | Calculos de impuestos, totales de negocio |
| `src/lib/utils/formatters.ts` | 7 funciones de formateo con locale como parametro | Logica de presentacion especifica del nicho |

**Como escala esto al agregar modulos de negocio:**

```
src/lib/utils/
├── validators.ts          ← esta parte (config global + loginSchema)
├── calculations.ts        ← esta parte (config global + matemáticas base)
├── formatters.ts          ← esta parte (formateo universal)
│
├── validators/            ← guías de módulo (Fase 1.x)
│   ├── clientes.ts        → import { z } from 'zod'  // ya configurado en español
│   ├── productos.ts       → import { z } from 'zod'
│   └── pedidos.ts         → import { z } from 'zod'
│
└── calculations/          ← guías de módulo (Fase 1.x)
    ├── impuestos.ts       → import { calcularPorcentaje } from '../calculations'
    └── pedidos.ts         → import { redondear, sumar } from '../calculations'
```

Cada modulo nuevo hereda la configuracion global automaticamente — no hay nada que configurar en los archivos de modulo.

---

## ➡️ SIGUIENTE PARTE

**-> Parte 4** — Fechas, Auth Store y Generacion de PDF

Se crean las utilidades de fecha con `date-fns` para logica temporal de negocio (vencimientos, rangos, diferencias), el store base de autenticacion con Zustand y la configuracion del generador de PDFs con `jspdf` + `html2canvas`.

---

> **Documento:** GUIA_0_2_Parte3_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
