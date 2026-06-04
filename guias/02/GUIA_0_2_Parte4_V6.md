# GUIA 0.2 — DEPENDENCIAS DE NEGOCIO
## PARTE 4: FECHAS, AUTH STORE Y GENERACION DE PDF

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 4 de 5
> **Prerequisito:** Parte 3 completada — `src/lib/utils/validators.ts`, `calculations.ts` y `formatters.ts` existen
> **Siguiente parte:** `GUIA_0_2_Parte5_V6.md` — Verificacion Final
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Completar la infraestructura de utilidades con los tres archivos restantes, todos dominio-agnosticos:

- **Bloque 1 — `dates.ts`:** Configuracion de `date-fns` con locale espanol + funciones temporales universales. Sin logica de negocio especifica — sin FEFO, sin semaforos de vencimiento. Esas van en modulos de negocio.
- **Bloque 2 — `auth-store.ts`:** Store Zustand con patron SSR correcto (`useSyncExternalStore`) y tipo `Usuario` generico minimo. La Guia 0.5 lo reemplaza con la version RBAC completa — este es el andamiaje.
- **Bloque 3 — `generador.ts`:** Funcion utilitaria `generarPDF()` que encapsula `html2canvas` + `jspdf`. Cualquier modulo del ERP que necesite exportar a PDF llama esta funcion — no reimplementa la logica de captura.

> **Al terminar esta parte:** La infraestructura completa de la Guia 0.2 esta lista. La Parte 5 actualiza la pagina de verificacion y ejecuta el build final.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — `dates.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/utils/dates.ts`

**Proposito:** Configurar el locale espanol de `date-fns` globalmente y proveer las funciones de manipulacion de fechas que cualquier app de negocio necesita: formateo para inputs HTML, calculo de diferencias, rangos y comparaciones.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Utilidades |
| Ejecuta en | Ambos (servidor y browser) |
| Importado por | Modulos de negocio que operen con fechas (`inventario.ts`, `facturacion.ts`), `page.tsx` de verificacion |
| Importa de | `date-fns`, `date-fns/locale` |
| Contrato | Exporta `formatearConPatron()`, `formatearParaInput()`, `formatearDistancia()`, `diferenciaDias()`, `estaEnRango()`, `rangoMesActual()` + re-exports de date-fns con locale preconfigurado |
| Si lo modificas | Las funciones re-exportadas con locale afectan a todos los modulos que importen desde aqui. Cambiar el locale cambia el idioma en toda la app |

### DECISIONES DE DISENO

**Por que `date-fns` para operaciones y `Intl` para presentacion?**
Los roles estan separados intencionalmente. `Intl.DateTimeFormat` (en `formatters.ts`) convierte una fecha ya calculada a string legible — es presentacion pura. `date-fns` opera sobre fechas: suma dias, calcula diferencias, verifica rangos. Mezclarlos en un solo archivo crearia dependencias cruzadas innecesarias. La regla practica: si necesitas un string para mostrar, usa `formatters.ts`; si necesitas operar con la fecha, usa `dates.ts`.

**Por que re-exportar funciones de `date-fns`?**
Evita que los modulos de negocio importen `date-fns` directamente y tengan que recordar pasar `{ locale }` en cada llamada. Al re-exportar con el locale ya configurado, los modulos importan desde `@/lib/utils/dates` y obtienen las funciones listas. Un solo lugar donde cambiar el locale si el proyecto necesita otro idioma.

**Por que la logica de dominio no va aqui?**
La logica de dominio que use estas funciones como base — semaforos de vencimiento para inventario, calculo de dias habiles para facturacion, rangos de fechas para reportes fiscales — va en `src/lib/utils/dates/[modulo].ts` e importa las primitivas de este archivo.

```powershell
$content = @'
// ════════════════════════════════════════════════════════════════════════════
// INFRAESTRUCTURA DE FECHAS — DATE-FNS
//
// Este archivo hace DOS cosas:
//   1. Configura el locale español para todas las operaciones de fecha
//   2. Provee funciones temporales de uso universal
//
// Las funciones de dominio (semáforos de vencimiento, días hábiles,
// rangos fiscales, lógica FEFO) van en:
//   src/lib/utils/dates/[modulo].ts
// Cada uno importa desde aquí y hereda el locale automáticamente.
// ════════════════════════════════════════════════════════════════════════════

import {
  format,
  formatDistance,
  formatRelative,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addMonths,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'

// ─────────────────────────────────────────────────────────────────────────────
// LOCALE — configuración central
// Cambiar este valor afecta a todas las funciones de este módulo y a
// los módulos de negocio que importen desde aquí.
// ─────────────────────────────────────────────────────────────────────────────
const locale = es

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES DE FORMATEO CON DATE-FNS
// Para formateo de presentación simple (sin manipulación) preferir
// las funciones de src/lib/utils/formatters.ts que usan Intl nativo.
// Usar estas cuando se necesita un patrón personalizado de date-fns.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea una fecha con un patrón personalizado de date-fns en español.
 * Consultar patrones: https://date-fns.org/docs/format
 *
 * @example
 *   formatearConPatron(new Date(), 'EEEE dd MMMM yyyy') → "lunes 14 abril 2026"
 *   formatearConPatron(new Date(), 'MMM yyyy')           → "abr 2026"
 */
export function formatearConPatron(fecha: Date | string, patron: string): string {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha
  return format(date, patron, { locale })
}

/**
 * Formatea una fecha para inputs HTML type="date".
 * Los inputs de fecha del navegador requieren el formato yyyy-MM-dd exactamente.
 *
 * @example
 *   formatearParaInput(new Date('2026-04-14')) → "2026-04-14"
 */
export function formatearParaInput(fecha: Date | string): string {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha
  return format(date, 'yyyy-MM-dd')
}

/**
 * Formatea una fecha como distancia relativa al momento actual en español.
 * Para tiempo relativo simple preferir formatearTiempoRelativo() de formatters.ts.
 * Usar esta cuando se necesita la versión de date-fns con más control.
 *
 * @example
 *   formatearDistancia(hace3Dias) → "hace 3 días"
 *   formatearDistancia(en2Horas)  → "en 2 horas"
 */
export function formatearDistancia(
  fecha: Date | string,
  base: Date = new Date()
): string {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha
  return formatDistance(date, base, { locale, addSuffix: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES DE CÁLCULO TEMPORAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula la diferencia en días entre dos fechas.
 * El resultado es positivo si `fechaFin` es posterior a `fechaInicio`.
 *
 * @example
 *   diferenciaDias('2026-04-01', '2026-04-14') → 13
 *   diferenciaDias('2026-04-14', '2026-04-01') → -13
 */
export function diferenciaDias(
  fechaInicio: Date | string,
  fechaFin: Date | string = new Date()
): number {
  const inicio = typeof fechaInicio === 'string' ? parseISO(fechaInicio) : fechaInicio
  const fin = typeof fechaFin === 'string' ? parseISO(fechaFin) : fechaFin
  return differenceInDays(fin, inicio)
}

/**
 * Verifica si una fecha cae dentro de un rango (inclusivo en ambos extremos).
 *
 * @example
 *   estaEnRango('2026-04-14', '2026-04-01', '2026-04-30') → true
 *   estaEnRango('2026-05-01', '2026-04-01', '2026-04-30') → false
 */
export function estaEnRango(
  fecha: Date | string,
  inicio: Date | string,
  fin: Date | string
): boolean {
  const date = typeof fecha === 'string' ? parseISO(fecha) : fecha
  const start = typeof inicio === 'string' ? parseISO(inicio) : inicio
  const end = typeof fin === 'string' ? parseISO(fin) : fin
  return isWithinInterval(date, { start, end })
}

/**
 * Retorna el rango del mes actual: { inicio, fin }.
 * Útil para filtros por defecto en listados y reportes.
 *
 * @example
 *   rangoMesActual() → { inicio: 2026-04-01 00:00:00, fin: 2026-04-30 23:59:59 }
 */
export function rangoMesActual(): { inicio: Date; fin: Date } {
  const ahora = new Date()
  return {
    inicio: startOfMonth(ahora),
    fin: endOfMonth(ahora),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORTS — funciones de date-fns listas para usar con locale configurado
// Los módulos de negocio importan desde aquí en lugar de importar date-fns
// directamente, para no tener que pasar { locale } en cada llamada.
// ─────────────────────────────────────────────────────────────────────────────
export {
  addDays,
  addMonths,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  parseISO,
  differenceInHours,
  differenceInMinutes,
  formatRelative,
  locale as localeEs,
}
'@

New-Item -Path "src/lib/utils" -ItemType Directory -Force | Out-Null
New-Item -Path "src/lib/utils/dates.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/utils/dates.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/utils/dates.ts creado" -ForegroundColor Green
Write-Host "📅 Locale es configurado — 3 funciones de formateo, 3 de cálculo + re-exports" -ForegroundColor Cyan
Write-Host "🗂️  Lógica de dominio (FEFO, días hábiles) va en src/lib/utils/dates/[modulo].ts" -ForegroundColor Cyan
```

---

## BLOQUE 2 — `auth-store.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/stores/auth-store.ts`

**Proposito:** Store de autenticacion con Zustand. Persiste el usuario logueado en `localStorage` para mantener la sesion visible entre recargas sin llamar a Supabase en cada carga. Provee el hook `useAuth()` seguro para SSR.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Store |
| Patron | Store Zustand con persist + useSyncExternalStore para SSR |
| Ejecuta en | Ambos (servidor retorna valores vacios, browser hidrata desde localStorage) |
| Importado por | Todos los componentes que necesiten estado de autenticacion (layouts, guards, navbar) |
| Importa de | `zustand`, `zustand/middleware`, `react` |
| Contrato | Exporta `useAuthStore` (store directo), `useAuth()` (hook SSR-safe), interfaz `Usuario` |
| Si lo modificas | **SE REEMPLAZA EN GUIA 0.5** con version RBAC completa. Cambios en la key de localStorage (`erp-auth-storage`) invalidan todas las sesiones existentes |

### DECISIONES DE DISENO

**Por que `useSyncExternalStore` y no `useState` + `useEffect`?**
Zustand con `persist` lee de `localStorage` — que no existe en el servidor. Esto produce un mismatch entre el HTML del servidor (store vacio) y el cliente (store con datos). `useSyncExternalStore` es el hook oficial de React 19 para sincronizar stores externos con el ciclo de renderizado: retorna `false` en servidor y `true` en cliente, permitiendo que el componente decida que datos mostrar en cada contexto. ESLint estricto de Next.js 16 bloquea el patron `useState` + `useEffect` para hidratacion — `useSyncExternalStore` es la solucion que no genera warnings.

**Por que `isLoading` no se persiste en `partialize`?**
`isLoading` representa el estado de verificacion de la sesion actual — no tiene sentido entre sesiones. Si se persistiera, la app abriria con `isLoading: false` antes de verificar la sesion con Supabase, mostrando contenido protegido por un instante. Al iniciar siempre en `true`, el componente muestra un skeleton hasta que la sesion se verifica o descarta.

**Por que este store se reemplaza en la Guia 0.5?**
Este store es el andamiaje que permite que las Partes 2, 3 y 4 de esta guia compilen sin depender de la logica de autenticacion completa. La version 0.5 agrega `setAuth(usuario, menu, permisos)`, `tienePermiso(href, accion)` y `puedeVerPagina(href)`. El tipo `Usuario` tambien se expande con campos de rol y preferencias. El patron SSR (`useSyncExternalStore`) y la persistencia (`partialize`) se mantienen igual — solo crece el estado y las acciones.

```powershell
New-Item -Path "src/lib/stores" -ItemType Directory -Force | Out-Null

$content = @'
// ════════════════════════════════════════════════════════════════════════════
// AUTH STORE — VERSIÓN BASE (Guía 0.2)
//
// Almacena el usuario autenticado con persistencia en localStorage.
// Provee el hook useAuth() seguro para SSR via useSyncExternalStore.
//
// ⚠️  ESTE ARCHIVO SE REEMPLAZA EN GUÍA 0.5
// La versión 0.5 agrega: setAuth(usuario, menu, permisos),
// tienePermiso(), puedeVerPagina() y el tipo Usuario expandido con RBAC.
// El patrón SSR (useSyncExternalStore) y la persistencia (partialize)
// se mantienen igual — solo crece el estado y las acciones.
// ════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useSyncExternalStore } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// Usuario genérico mínimo — campos comunes a cualquier app con autenticación.
// En Guía 0.5 se reemplaza con el tipo Usuario completo del dominio RBAC.
// ─────────────────────────────────────────────────────────────────────────────

export interface Usuario {
  id: string
  email: string
  nombre: string
}

interface AuthState {
  usuario: Usuario | null
  isAuthenticated: boolean
  // isLoading: true por defecto — se desactiva cuando la sesión se verifica.
  // No se persiste en localStorage: siempre debe iniciar en true para
  // evitar mostrar contenido protegido antes de verificar la sesión.
  isLoading: boolean
  setUsuario: (usuario: Usuario | null) => void
  clearUsuario: () => void
  setLoading: (loading: boolean) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Store base de autenticación con persistencia selectiva en localStorage.
 *
 * Persistencia: solo 'usuario' e 'isAuthenticated'.
 * 'isLoading' se excluye — siempre inicia en true para forzar
 * la verificación de sesión en cada carga de la app.
 *
 * Key localStorage: 'erp-auth-storage'
 * Cambiar esta key invalida todas las sesiones existentes en los navegadores
 * de los usuarios — solo hacerlo intencionalmente (ej: migración de datos).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      isAuthenticated: false,
      isLoading: true,

      // Llamar después de login exitoso con los datos del usuario verificado
      setUsuario: (usuario) =>
        set({
          usuario,
          isAuthenticated: usuario !== null,
          isLoading: false,
        }),

      // Llamar en logout — limpia el estado y la cookie de Supabase
      clearUsuario: () =>
        set({
          usuario: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      // Llamar para activar/desactivar el estado de carga explícitamente
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'erp-auth-storage',
      storage: createJSONStorage(() => localStorage),

      // Solo persistir datos de sesión — no estados de UI
      partialize: (state) => ({
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
        // isLoading: excluido intencionalmente — ver comentario arriba
      }),
    }
  )
)

// ─────────────────────────────────────────────────────────────────────────────
// HOOK SSR-SAFE
// ─────────────────────────────────────────────────────────────────────────────

// useSyncExternalStore requiere un subscriber. Como solo detectamos
// el contexto client/server (no un store externo), el subscriber
// no necesita hacer nada — retorna el unsubscribe vacío que React espera.
const emptySubscribe = () => () => {}

/**
 * Hook de autenticación seguro para SSR.
 *
 * En servidor: retorna { usuario: null, isAuthenticated: false, isLoading: true }
 *   El HTML del servidor nunca incluye datos del usuario — correcto para SSR.
 *
 * En cliente: retorna los datos reales del store desde localStorage
 *   El usuario ve su sesión restaurada en el primer render del cliente.
 *
 * Este patrón evita el "hydration mismatch" de React: servidor y cliente
 * parten del mismo estado inicial vacío. Zustand hidrata el cliente
 * en el siguiente ciclo de renderizado sin discrepancias.
 *
 * Uso:
 *   const { usuario, isAuthenticated, isLoading } = useAuth()
 */
export function useAuth() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,   // getSnapshot — cliente
    () => false   // getServerSnapshot — servidor
  )

  const usuario = useAuthStore((state) => state.usuario)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  // En servidor: valores seguros que coinciden con el HTML del servidor
  if (!isClient) {
    return { usuario: null, isAuthenticated: false, isLoading: true }
  }

  return { usuario, isAuthenticated, isLoading }
}
'@

New-Item -Path "src/lib/stores/auth-store.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/stores/auth-store.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/stores/auth-store.ts creado" -ForegroundColor Green
Write-Host "🔐 Usuario genérico mínimo — se expande con RBAC en Guía 0.5" -ForegroundColor Cyan
Write-Host "⚡ useSyncExternalStore — patrón SSR correcto, sin useState/useEffect" -ForegroundColor Cyan
Write-Host "💾 partialize excluye isLoading — siempre inicia en true entre sesiones" -ForegroundColor Cyan
```

---

## BLOQUE 3 — `generador.ts`

📄 **ARCHIVO COMPLETO** — `src/lib/pdf/generador.ts`

**Proposito:** Encapsular la logica de `html2canvas` + `jspdf` en una funcion utilitaria reutilizable. Cualquier modulo del ERP que necesite exportar a PDF — pedidos, facturas, reportes — llama `generarPDF()` apuntando a su elemento HTML ya renderizado en el DOM. No hay plantillas especiales ni componentes React propios del renderer: el "template" es un componente React normal que se captura tal como aparece en pantalla.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Utilidades |
| Ejecuta en | Browser unicamente (usa APIs del DOM: canvas, Blob) |
| Importado por | Client Components que exporten a PDF — siempre con `dynamic()` + `ssr: false` |
| Importa de | `html2canvas`, `jspdf` |
| Contrato | Exporta `generarPDF()`, `generarPDFMultipagina()`, interfaz `OpcionesPDF` |
| Si lo modificas | Afecta todos los exports PDF de la app. Cambiar la escala o margenes por defecto altera la apariencia de todos los documentos generados |

### DECISIONES DE DISENO

**Por que `html2canvas` + `jspdf` y no `@react-pdf/renderer`?**
`@react-pdf/renderer` requiere reescribir el layout del documento en primitivas propias (`<Document>`, `<Page>`, `<View>`, `<Text>`), completamente separadas de la UI existente. Con `html2canvas` + `jspdf`, el componente de pedido que ya existe en el ERP es el PDF — sin duplicar layouts. Ademas, `@react-pdf/renderer` esta roto en npm 11 + Node 24.

**Por que `generarPDF` recibe un `HTMLElement` y no un selector string?**
Recibir el elemento directamente — tipicamente via `ref.current` — es mas seguro que un selector: TypeScript garantiza que el elemento existe en el momento de la llamada, y no hay ambiguedad si hay multiples elementos con el mismo selector en el DOM.

**Por que `scale: 2` en `html2canvas`?**
Sin escala, el canvas se captura a la resolucion del viewport — 96 DPI. Con `scale: 2` se captura a 192 DPI, lo que produce un PDF nitido al imprimir o hacer zoom. El costo en memoria es cuatro veces mayor pero el resultado es visualmente correcto para documentos de negocio.

> **Ejemplo de uso en un componente real:**
> ```tsx
> // En la página del módulo — import dinámico obligatorio
> 'use client'
> import { useRef } from 'react'
> import { generarPDF } from '@/lib/pdf/generador'
>
> export default function PedidoPage() {
>   const ref = useRef<HTMLDivElement>(null)
>
>   const handleExportar = async () => {
>     if (ref.current) await generarPDF(ref.current, 'pedido-001')
>   }
>
>   return (
>     <>
>       <div ref={ref}>
>         {/* Contenido del pedido con tokens del sistema de temas */}
>       </div>
>       <button onClick={handleExportar}>Exportar PDF</button>
>     </>
>   )
> }
> ```

```powershell
$content = @'
// ════════════════════════════════════════════════════════════════════════════
// GENERADOR DE PDF — jsPDF + html2canvas
//
// Usar en: Client Components ('use client') únicamente.
// Importar siempre con dynamic() + ssr: false si se usa en una página:
//
//   const generarPDF = dynamic(
//     () => import('@/lib/pdf/generador').then(m => m.generarPDF),
//     { ssr: false }
//   )
//
// html2canvas y jsPDF usan APIs del DOM (canvas, Blob) que no existen
// en el entorno Node.js del servidor de Next.js.
// ════════════════════════════════════════════════════════════════════════════

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface OpcionesPDF {
  /** Escala de captura del canvas. 2 = 192 DPI — recomendado para documentos de negocio */
  escala?: number
  /** Orientación del documento PDF */
  orientacion?: 'portrait' | 'landscape'
  /** Tamaño del papel */
  formato?: 'a4' | 'letter' | 'legal'
  /** Margen en mm aplicado dentro del PDF antes de colocar la imagen */
  margen?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Captura un elemento HTML como imagen y lo exporta como PDF descargable.
 *
 * El elemento puede ser cualquier componente React ya renderizado en el DOM:
 * una tabla de pedido, un resumen de factura, un reporte de inventario.
 * No se necesita reescribir el layout en primitivas especiales.
 *
 * @param elemento  Referencia al elemento HTML a capturar (ref.current)
 * @param nombre    Nombre del archivo PDF sin extensión (ej: 'pedido-001')
 * @param opciones  Configuración opcional — ver OpcionesPDF
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null)
 * await generarPDF(ref.current!, 'pedido-001')
 * await generarPDF(ref.current!, 'reporte', { orientacion: 'landscape', formato: 'letter' })
 */
export async function generarPDF(
  elemento: HTMLElement,
  nombre: string,
  opciones: OpcionesPDF = {}
): Promise<void> {
  const {
    escala = 2,
    orientacion = 'portrait',
    formato = 'letter',
    margen = 10,
  } = opciones

  // ── Paso 1: Capturar el elemento como canvas de alta resolución ────────────

  const canvas = await html2canvas(elemento, {
    scale: escala,           // 2 = 192 DPI — nítido al imprimir o hacer zoom
    useCORS: true,           // Permite capturar imágenes de dominios externos (logos, etc.)
    logging: false,          // Silenciar logs de debug en producción
    backgroundColor: '#ffffff', // Fondo blanco explícito — evita fondo transparente en PDF
  })

  // ── Paso 2: Convertir el canvas a imagen PNG ───────────────────────────────

  const imgData = canvas.toDataURL('image/png')

  // ── Paso 3: Crear el documento PDF con dimensiones del papel ──────────────
  // CORRECCIÓN: mapeo explícito de las variables en español a las props en inglés de jsPDF
  const pdf = new jsPDF({
    orientation: orientacion,
    unit: 'mm',
    format: formato,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // Área disponible después de aplicar márgenes en los 4 lados
  const areaAncho = pageWidth - margen * 2
  const areaAlto = pageHeight - margen * 2

  // ── Paso 4: Escalar la imagen para que quepa en el área disponible ─────────

  // Relación de aspecto del canvas capturado (en píxeles)
  const canvasAncho = canvas.width
  const canvasAlto = canvas.height
  const relacionAspecto = canvasAncho / canvasAlto

  // Calcular dimensiones en mm manteniendo la proporción
  let imgAncho = areaAncho
  let imgAlto = areaAncho / relacionAspecto

  // Si la imagen excede la altura disponible, ajustar por altura
  if (imgAlto > areaAlto) {
    imgAlto = areaAlto
    imgAncho = areaAlto * relacionAspecto
  }

  // ── Paso 5: Agregar imagen al PDF y descargar ─────────────────────────────

  pdf.addImage(
    imgData,
    'PNG',
    margen,   // Posición X (margen izquierdo)
    margen,   // Posición Y (margen superior)
    imgAncho,
    imgAlto
  )

  // Disparar descarga en el navegador
  pdf.save(`${nombre}.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDAD: MULTIPÁGINA
// Para documentos que exceden una página de alto.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Versión multipágina de generarPDF.
 * Divide automáticamente el contenido en páginas cuando excede la altura.
 * Usar para reportes largos, listas de productos o estados de cuenta.
 *
 * @param elemento  Referencia al elemento HTML a capturar
 * @param nombre    Nombre del archivo PDF sin extensión
 * @param opciones  Configuración opcional — ver OpcionesPDF
 */
export async function generarPDFMultipagina(
  elemento: HTMLElement,
  nombre: string,
  opciones: OpcionesPDF = {}
): Promise<void> {
  const {
    escala = 2,
    orientacion = 'portrait',
    formato = 'letter',
    margen = 10,
  } = opciones

  const canvas = await html2canvas(elemento, {
    scale: escala,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  // CORRECCIÓN: Se elimina el imgData global no utilizado
  // y se mapean explícitamente orientacion y formato.
  const pdf = new jsPDF({ 
    orientation: orientacion, 
    unit: 'mm', 
    format: formato 
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const areaAncho = pageWidth - margen * 2
  const areaAlto = pageHeight - margen * 2

  // Altura de una página en píxeles del canvas (para saber cuánto cortar)
  const altosPorPagina = Math.floor(
    (canvas.width / areaAncho) * areaAlto
  )

  let posicionY = 0
  let pagina = 0

  while (posicionY < canvas.height) {
    if (pagina > 0) pdf.addPage()

    // Crear un canvas temporal con el segmento de esta página
    const canvasPagina = document.createElement('canvas')
    canvasPagina.width = canvas.width
    canvasPagina.height = Math.min(altosPorPagina, canvas.height - posicionY)

    const ctx = canvasPagina.getContext('2d')!
    ctx.drawImage(canvas, 0, -posicionY)

    const imgPagina = canvasPagina.toDataURL('image/png')
    const altoImgMm = (canvasPagina.height / canvas.width) * areaAncho

    pdf.addImage(imgPagina, 'PNG', margen, margen, areaAncho, altoImgMm)

    posicionY += altosPorPagina
    pagina++
  }

  pdf.save(`${nombre}.pdf`)
}
'@

New-Item -Path "src/lib/pdf/generador.ts" -ItemType File -Force | Out-Null
Set-Content -Path "src/lib/pdf/generador.ts" -Value $content -Encoding UTF8
Write-Host "✅ src/lib/pdf/generador.ts corregido" -ForegroundColor Green
```

---

## FINGERPRINT — VALIDACION PARTE 4

```powershell
Write-Host "`nValidando Parte 4 de la Guía 0.2..." -ForegroundColor Yellow

$files = @(
  "src/lib/utils/dates.ts",
  "src/lib/stores/auth-store.ts",
  "src/lib/pdf/generador.ts"
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
  Write-Host "`n✅ PARTE 4 COMPLETADA — Fechas, auth store y generador PDF listos" -ForegroundColor Green
} else {
  Write-Host "`n❌ PARTE 4 INCOMPLETA — corregir antes de continuar" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si algun archivo no existe, repetir solo ese bloque. Los 3 deben existir antes de continuar a la Parte 5.

---

## RESUMEN DE ESTA PARTE

**3 archivos creados — infraestructura generica, dominio-agnostica:**

| Archivo | Que instala | Lo que NO contiene |
|:--------|:------------|:-------------------|
| `src/lib/utils/dates.ts` | Locale `es` + 3 funciones de formateo + 3 de calculo + re-exports | FEFO, semaforos de vencimiento, dias habiles |
| `src/lib/stores/auth-store.ts` | Store Zustand SSR-safe + `Usuario` generico + `useAuth()` | Campos RBAC, `tienePermiso()`, `puedeVerPagina()` |
| `src/lib/pdf/generador.ts` | `generarPDF()` + `generarPDFMultipagina()` con `jspdf` + `html2canvas` | Plantillas de documentos especificas del negocio |

**Como escala al agregar modulos:**

```
src/lib/
├── utils/
│   ├── dates.ts               ← esta parte (infraestructura)
│   └── dates/                 ← guias de modulo (Fase 1.x)
│       ├── inventario.ts      → import { diferenciaDias, addDays } from '../dates'
│       └── facturacion.ts     → import { rangoMesActual, estaEnRango } from '../dates'
│
├── stores/
│   └── auth-store.ts          ← esta parte (base) → reemplazado en Guia 0.5
│
└── pdf/
    ├── generador.ts           ← esta parte (motor universal)
    └── templates/             ← guias de modulo (Fase 1.x)
        ├── pedido.tsx         → componente React normal + generarPDF(ref.current, 'pedido')
        └── reporte.tsx        → componente React normal + generarPDFMultipagina(...)
```

---

## SIGUIENTE PARTE

**-> Parte 5** — Verificacion Final

Se actualiza `src/app/page.tsx` para reflejar el estado acumulado de las Guias 0.1 y 0.2, y se ejecuta la validacion final completa: existencia de todos los archivos creados en esta guia + `npm run build` sin errores.

---

> **Documento:** GUIA_0_2_Parte4_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
