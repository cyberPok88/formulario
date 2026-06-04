# GUIA 0.2 — DEPENDENCIAS DE NEGOCIO
## PARTE 0: PANORAMA GENERAL

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 0 de 5 (documento de referencia)
> **Prerequisito:** Guia 0.1 completada — `npm run build` y `npx tsc --noEmit` exitosos sin errores
> **Prerequisito adicional (Guia 0.1):** `components.json` generado con alias `@/lib/utils` — verificar con `Test-Path components.json`
> **Siguiente parte:** `GUIA_0_2_Parte1_V6.md` — Instalacion de Dependencias NPM
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE CONSTRUYE EN ESTA GUIA?

La Guia 0.1 instalo la capa visual del proyecto: Tailwind, sistema de temas, shadcn/ui y los primeros componentes UI. Esta guia instala la capa funcional: todo lo que el ERP necesita para conectarse a una base de datos, validar formularios, calcular montos con precision exacta, manejar fechas para FEFO, gestionar estado global y generar PDFs.

Al terminar las 5 partes existira:

1. **13 dependencias NPM** instaladas con versiones pineadas y compatibles con Next.js 16.2.3 + React 19 + Tailwind 3.4.19
2. **3 clientes Supabase SSR** para los 3 contextos de ejecucion de Next.js App Router (Browser, Server, Edge)
3. **Infraestructura de validacion** con Zod configurado en espanol + schema de autenticacion
4. **Infraestructura de calculo** con Decimal.js configurado con precision 20 y ROUND_HALF_UP estandar bancario
5. **Infraestructura de formateo** con funciones de moneda, fecha y porcentaje usando Intl nativo
6. **Utilidades de fecha** con date-fns y locale espanol + funciones temporales universales
7. **Auth store base** con Zustand + `useSyncExternalStore` para SSR seguro
8. **Generador de PDFs** con jspdf + html2canvas encapsulado en funcion reutilizable
9. **Pagina de verificacion actualizada** con demos en vivo de Decimal.js, formatters y calculations

Al terminar: `npm run build` compila sin errores, `npm run lint` pasa limpio, y la pagina de verificacion muestra en vivo las utilidades de negocio.

---

## LO QUE NO SE CONSTRUYE AQUI

| Componente | Razon | Guia donde va |
|:-----------|:------|:--------------|
| Schemas de negocio (clientes, productos, pedidos) | Son logica de dominio — van en `src/lib/utils/validators/[modulo].ts` | Guias de modulo (Fase 1.x) |
| Calculos de impuestos (IVA, IEPS, regla del centavo) | Son logica fiscal especifica — van en `src/lib/utils/calculations/[modulo].ts` | Guias de modulo (Fase 1.x) |
| Logica FEFO, semaforos de vencimiento, dias habiles | Son logica de dominio — van en `src/lib/utils/dates/[modulo].ts` | Guias de modulo (Fase 1.x) |
| Plantillas de PDF (pedidos, facturas, reportes) | Requieren el modelo de datos implementado | Guias de modulo (Fase 1.x) |
| `src/proxy.ts` (interceptor Edge de Next.js) | Requiere la Guia de autenticacion completa | Guia 0.5 |
| Auth store con RBAC (`tienePermiso`, `puedeVerPagina`) | Requiere el sistema de permisos implementado | Guia 0.5 |
| App Shell (Sidebar, Topbar, Toolbar) | Requiere auth-store RBAC y modelo de menu dinamico | Guia 0.6 |

---

## ARQUITECTURA: DECISIONES CERRADAS

| # | Decision | Resultado | Razon |
|:-:|:---------|:----------|:------|
| 1 | `@supabase/ssr` | v0.6.1 — NO v0.5.x | Next.js 16 hizo `cookies()` async — la 0.5.x genera warnings de deprecacion en cada request autenticado |
| 2 | Clientes Supabase | 3 clientes separados (browser, server, proxy) | Cada contexto de Next.js App Router tiene un mecanismo de acceso a cookies distinto — un solo cliente no cubre los 3 |
| 3 | Validacion de sesion en Edge | `getClaims()` — no `getUser()` ni `getSession()` | `getClaims()` valida el JWT localmente sin red — ideal para el Edge que corre en cada request |
| 4 | Mapa de errores Zod | Configuracion global en espanol en `validators.ts` | Garantiza que todos los schemas del proyecto muestren errores en espanol sin configuracion adicional |
| 5 | Precision Decimal.js | 20 digitos + ROUND_HALF_UP | Cubre montos de hasta billones con 6 decimales. ROUND_HALF_UP es el estandar bancario que esperan sistemas fiscales de LATAM |
| 6 | Formateo de presentacion | `Intl` nativo con locale/moneda como parametros | Sin dependencias externas. Funciona para cualquier pais cambiando solo el default |
| 7 | Operaciones de fecha | `date-fns` con locale `es` centralizado | Las funciones re-exportan con locale ya configurado — los modulos de negocio no tienen que recordar pasarlo |
| 8 | Auth store SSR | `useSyncExternalStore` — no `useState` + `useEffect` | Patron oficial de React 19 para sincronizar stores externos. ESLint de Next.js 16 bloquea el patron alternativo |
| 9 | Generacion de PDFs | `jspdf` + `html2canvas` — no `@react-pdf/renderer` | El componente React existente ES el template del PDF — sin reescribir layouts en primitivas propias |
| 10 | Infraestructura vs dominio | Archivos base genericos + directorios para modulos | Los archivos de esta guia son dominio-agnosticos. La logica de negocio va en subdirectorios por modulo |

---

## ARQUITECTURA: DIAGRAMA — CAPAS DE INFRAESTRUCTURA

```
+─────────────────────────────────────────────────────────────────+
|  CAPA 1 — CONEXION (Parte 2)                                    |
|  3 clientes Supabase SSR — uno por contexto de Next.js          |
|                                                                  |
|  client.ts ──── Browser ──── document.cookie (automatico)        |
|  server.ts ──── Node.js ──── cookies() async (Batch API)         |
|  proxy.ts  ──── Edge    ──── request/response cookies            |
+──────────────────────────────┬──────────────────────────────────+
                               |
+──────────────────────────────┴──────────────────────────────────+
|  CAPA 2 — VALIDACION Y CALCULO (Parte 3)                        |
|  Infraestructura generica, dominio-agnostica                     |
|                                                                  |
|  validators.ts ──── Zod en espanol + loginSchema                 |
|  calculations.ts ── Decimal.js precision 20 + 5 funciones base   |
|  formatters.ts ──── Intl nativo: moneda, fecha, porcentaje       |
+──────────────────────────────┬──────────────────────────────────+
                               |
+──────────────────────────────┴──────────────────────────────────+
|  CAPA 3 — ESTADO Y UTILIDADES (Parte 4)                          |
|  date-fns, auth store, generador PDF                             |
|                                                                  |
|  dates.ts ───────── date-fns con locale es + funciones temporales|
|  auth-store.ts ──── Zustand + SSR-safe (base — Guia 0.5 expande)|
|  generador.ts ───── jspdf + html2canvas encapsulado              |
+─────────────────────────────────────────────────────────────────+
```

---

## INDICE DE PARTES

| Parte | Titulo | Bloques | Al terminar esta parte |
|:------|:-------|:--------|:-----------------------|
| **0** | Panorama general | -- | Este documento leido y entendido |
| **1** | Instalacion de Dependencias NPM | B1: 13 paquetes en 3 grupos (Backend+Validacion, UI+Utilidades, Radix avanzadas) | Los 13 paquetes estan en `node_modules`, `npx tsc --noEmit` pasa limpio |
| **2** | Clientes Supabase SSR | B1: client.ts (Browser), B2: server.ts (Server), B3: proxy.ts (Edge) | 3 clientes en `src/lib/supabase/` — infraestructura de conexion completa |
| **3** | Infraestructura de Validacion y Calculo | B1: validators.ts (Zod espanol), B2: calculations.ts (Decimal.js), B3: formatters.ts (Intl) | Infraestructura de validacion y aritmetica configurada |
| **4** | Fechas, Auth Store y Generador de PDF | B1: dates.ts (date-fns), B2: auth-store.ts (Zustand SSR), B3: generador.ts (jspdf) | Infraestructura completa lista para Parte 5 |
| **5** | Verificacion Final | B1: page.tsx actualizado (demo visual), B2: Validacion final (build + lint) | `npm run build` sin errores, demo visual funcional |

**Contratos que establece cada parte para las siguientes:**
- **Parte 1 -> Parte 2:** Dependencias NPM instaladas — `@supabase/supabase-js`, `@supabase/ssr`, Zod, Decimal.js, date-fns, Zustand, etc.
- **Parte 2 -> Parte 3:** Clientes Supabase en `src/lib/supabase/` — los archivos de utilidades pueden importar tipos de Supabase
- **Parte 3 -> Parte 4:** `validators.ts`, `calculations.ts`, `formatters.ts` existen — la pagina de verificacion los importa
- **Parte 4 -> Parte 5:** `dates.ts`, `auth-store.ts`, `generador.ts` existen — verificacion final puede ejecutarse
- **Parte 5 -> Guia 0.3:** Proyecto funcional completo con toda la infraestructura de negocio, `npm run build` exitoso

---

## MANIFIESTO DE ARCHIVOS

### Archivos nuevos

| # | Archivo | Tipo | Parte | Proposito |
|:-:|:--------|:-----|:------|:----------|
| 1 | `src/lib/supabase/client.ts` | Cliente Supabase | P2-B1 | Cliente para Browser — cookies automaticas |
| 2 | `src/lib/supabase/server.ts` | Cliente Supabase | P2-B2 | Cliente para Server Components — API Batch |
| 3 | `src/lib/supabase/proxy.ts` | Cliente Supabase | P2-B3 | Helper Edge — getClaims() + redireccion |
| 4 | `src/lib/utils/validators.ts` | Validaciones | P3-B1 | Zod en espanol + loginSchema |
| 5 | `src/lib/utils/calculations.ts` | Utilidades | P3-B2 | Decimal.js config global + funciones base |
| 6 | `src/lib/utils/formatters.ts` | Utilidades | P3-B3 | Formateo de moneda, fecha, porcentaje |
| 7 | `src/lib/utils/dates.ts` | Utilidades | P4-B1 | date-fns con locale es + funciones temporales |
| 8 | `src/lib/stores/auth-store.ts` | Store Zustand | P4-B2 | Auth store base SSR-safe — se reemplaza en 0.5 |
| 9 | `src/lib/pdf/generador.ts` | Utilidades | P4-B3 | generarPDF() + generarPDFMultipagina() |

### Archivos reemplazados

| # | Archivo | Parte | Por que se reemplaza |
|:-:|:--------|:------|:---------------------|
| 1 | `src/app/page.tsx` | P5-B1 | Se extiende con demos de Decimal.js, formatters y calculations |

### Directorios nuevos

| Directorio | Proposito | Se usa desde |
|:-----------|:----------|:-------------|
| `src/lib/supabase/` | Clientes Supabase para los 3 contextos de Next.js | Guia 0.2 |
| `src/lib/utils/` | Funciones utilitarias de negocio (validacion, calculo, formateo, fechas) | Guia 0.2 |
| `src/lib/stores/` | Stores Zustand con persistencia selectiva | Guia 0.2 |
| `src/lib/pdf/` | Motor de generacion de PDFs | Guia 0.2 |

---

## NOTAS DE SOPORTE

| Tema | Detalle |
|:-----|:--------|
| **`--legacy-peer-deps`** | Requerido para Sonner y primitivas Radix UI — declaran peer dependency `react@^18` pero funcionan con React 19. Procedimiento oficial de Vercel y shadcn/ui |
| **`@supabase/ssr@0.6.1`** | Obligatoria con Next.js 16. La 0.5.x asume que `cookies()` es sincrona — la 0.6.x adapta los 3 clientes a la firma `async` |
| **Auth store base** | Andamiaje temporal. La Guia 0.5 lo reemplaza completamente con version RBAC que agrega `setAuth()`, `tienePermiso()`, `puedeVerPagina()` y tipo `Usuario` expandido |
| **Generador PDF** | Usa `html2canvas` + `jspdf`. Siempre importar con `dynamic()` + `ssr: false` — las APIs del DOM no existen en el servidor |
| **Infraestructura vs dominio** | Los archivos de esta guia son genericos. Schemas de negocio, calculos fiscales y logica FEFO van en subdirectorios por modulo en guias posteriores |
| **Versiones pineadas** | Todas las dependencias usan version exacta. Garantizan reproducibilidad entre maquinas y en el tiempo |

---

## SIGUIENTE GUIA

**-> Guia 0.3 — Modelo de Datos** (documento de referencia, no ejecutable)

Documenta el diseno completo de la base de datos: tablas, relaciones, convenciones de nomenclatura y sistema de permisos. Es lectura pura — el SQL ejecutable esta en la Guia 0.4.

---

> **Documento:** GUIA_0_2_Parte0_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
