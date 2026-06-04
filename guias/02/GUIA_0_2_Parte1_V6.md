# GUIA 0.2 — DEPENDENCIAS DE NEGOCIO
## PARTE 1: INSTALACION DE DEPENDENCIAS NPM

> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Parte:** 1 de 5
> **Prerequisito:** Guia 0.1 completada — `npm run build` y `npx tsc --noEmit` exitosos sin errores
> **Prerequisito adicional (Guia 0.1):** `components.json` generado con alias `@/lib/utils` — verificar con `Test-Path components.json`
> **Siguiente parte:** `GUIA_0_2_Parte2_V6.md` — Clientes Supabase SSR
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

La Guia 0.1 instalo la capa visual del proyecto: Tailwind, sistema de temas, shadcn/ui y los primeros componentes UI. Esta parte instala la capa funcional: todo lo que el ERP necesita para conectarse a una base de datos, validar formularios, calcular montos con precision exacta, manejar fechas para FEFO, gestionar estado global y generar PDFs.

Se instalan 13 paquetes organizados en 3 grupos:

- **Bloque 1 — Grupo 1 (Backend + Validacion):** 6 paquetes para conexion con Supabase, formularios validados con Zod y aritmetica financiera exacta con Decimal.js.
- **Bloque 1 — Grupo 2 (UI + Utilidades):** 5 paquetes para tablas con paginacion, fechas en espanol, state management, toasts y generacion de PDFs del lado del cliente.
- **Bloque 1 — Grupo 3 (Radix UI avanzadas):** 2 primitivas accesibles para modales y selects — se suman a las 2 primitivas Radix ya instaladas en la Guia 0.1.

> **Al terminar esta parte:** Los 13 paquetes estan en `node_modules`, el proyecto sigue compilando sin errores y `npx tsc --noEmit` pasa limpio.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell. Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
> - `Get-Content "ruta" -Raw` -> `cat "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 1 — INSTALACION DE DEPENDENCIAS

**Proposito:** Instalar todas las dependencias de negocio con versiones pineadas y compatibles con el stack exacto que dejo la Guia 0.1: Next.js 16.2.3, React 19 y Tailwind 3.4.19.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Instalacion de dependencias NPM (sin archivos creados) |
| Ejecuta en | CLI — `npm install` modifica `package.json` y `node_modules` |
| Contrato | 13 paquetes disponibles para importar en las Partes 2-5 |
| Si lo modificas | Cambiar versiones puede romper compatibilidad con React 19 o generar conflictos de peer dependencies |

### DECISIONES DE DISENO

**Por que versiones pineadas exactas y no rangos (`^` o `~`)?**
Cada version fue seleccionada por tres criterios: (1) compatibilidad verificada con React 19, (2) estabilidad de API — ninguna de estas versiones tiene breaking changes pendientes en su rama, y (3) interoperabilidad — los 13 paquetes funcionan en conjunto sin conflictos de peer dependencies.

**Por que `--legacy-peer-deps` en algunos grupos?**
Next.js 16 incluye React 19. Algunas librerias maduras (`sonner`, primitivas Radix UI) aun declaran en su `package.json` soporte solo para React `^18`, aunque funcionan perfectamente con React 19. La bandera `--legacy-peer-deps` le indica a npm que ignore esa declaracion desactualizada. Es el procedimiento oficial documentado por Vercel y shadcn/ui para React 19.

> **PowerShell — regla de encadenamiento:** Ejecutar cada grupo en su propio comando. **No usar `&&`** para encadenar — en PowerShell provoca ejecucion concurrente que puede congelar la terminal o instalar paquetes en paralelo con resultados impredecibles.

> **Banderas obligatorias:** Todos los comandos usan `--no-fund --no-audit`. Estas banderas evitan que npm realice requests adicionales al registro durante la instalacion — en Windows esto puede congelar la terminal durante varios minutos.

---

### Grupo 1 — Backend y Validacion

```powershell
Write-Host "Instalando Backend + Validación..." -ForegroundColor Cyan
npm install @supabase/supabase-js@2.50.0 @supabase/ssr@0.6.1 react-hook-form@7.54.2 zod@3.24.2 @hookform/resolvers@3.10.0 decimal.js@10.5.0 --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `@supabase/supabase-js` | 2.50.0 | Cliente principal de Supabase: Auth, base de datos Postgres, Storage y Realtime. Es el punto de entrada a todos los servicios del backend. |
| `@supabase/ssr` | 0.6.1 | Helpers para App Router de Next.js. Crea los 3 clientes adaptados a cada contexto de ejecucion (browser, server, edge). **Esta version es obligatoria con Next.js 16:** la 0.5.x asume que `cookies()` de Next.js es sincrona, pero Next 16 la hizo `async`. La 0.6.x adapta los 3 clientes a la nueva firma. Usar 0.5.x con Next 16 genera warnings de deprecacion en cada request autenticado. |
| `react-hook-form` | 7.54.2 | Manejo de formularios sin re-renders innecesarios. A diferencia de formularios controlados con `useState`, RHF solo re-renderiza el campo que cambio — no el formulario completo. Critico en formularios largos de pedidos (30+ campos). |
| `zod` | 3.24.2 | Validacion con inferencia automatica de tipos TypeScript. Un schema Zod genera su tipo TypeScript correspondiente: `z.infer<typeof loginSchema>` produce el tipo exacto, sin escribirlo a mano. |
| `@hookform/resolvers` | 3.10.0 | Puente entre Zod y React Hook Form. Permite pasar un schema Zod directamente como validador: `resolver: zodResolver(loginSchema)`. Sin este paquete, habria que traducir manualmente los errores de Zod al formato de RHF. |
| `decimal.js` | 10.5.0 | Aritmetica de precision arbitraria para calculos financieros. JavaScript nativo representa numeros en punto flotante de 64 bits (IEEE 754), lo que produce `0.1 + 0.2 = 0.30000000000000004`. En facturas con IVA e IEPS eso es un error en el centavo que el SAT rechaza. Decimal.js garantiza exactitud con precision 20 configurada globalmente. |

---

### Grupo 2 — UI y Utilidades

```powershell
Write-Host "Instalando UI + Utilidades..." -ForegroundColor Cyan
npm install @tanstack/react-table@8.21.2 date-fns@4.1.0 zustand@5.0.3 sonner@1.7.4 jspdf@2.5.2 html2canvas@1.4.1 --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `@tanstack/react-table` | 8.21.2 | Tablas headless con sorting, filtrado y paginacion del lado del cliente. "Headless" significa que la libreria maneja la logica (que datos mostrar, en que orden, que pagina) pero no renderiza HTML — el ERP define su propio HTML con los tokens de diseno del sistema. |
| `date-fns` | 4.1.0 | Manipulacion de fechas con soporte completo de locale espanol. Fundamental para la logica FEFO (First Expire, First Out) del almacen: calcular que lote vence primero, alertas de vencimiento proximo, y presentar fechas en formato `dd/MM/yyyy` y `es-MX` en toda la UI. |
| `zustand` | 5.0.3 | State management minimalista con middleware de persistencia. La sesion del usuario, el menu del ERP y los permisos RBAC viviran en stores Zustand con persistencia selectiva en `localStorage`. La version 5.x usa la nueva API de React 19 para subscripciones. |
| `sonner` | 1.7.4 | Toasts de notificacion. Retroalimentacion visual para acciones del usuario: "Pedido guardado", "Error de validacion", "Sesion expirada". Se instala con `--legacy-peer-deps` porque declara peer dependency `react@^18`, aunque soporta React 19 correctamente. |
| `jspdf` | 2.5.2 | Motor de generacion de PDFs. Crea el documento PDF en el navegador a partir del canvas generado por `html2canvas`. Sin dependencias internas rotas — instala limpio en Node 24 + npm 11. **Siempre usar con `dynamic()` + `ssr: false`** — usa APIs del DOM que no existen en el servidor. |
| `html2canvas` | 1.4.1 | Rasteriza un elemento HTML del DOM a un canvas. La plantilla de pedido se construye como un componente React normal con los tokens del sistema de temas, y `html2canvas` la captura fielmente sin necesidad de reescribir el layout en primitivas propias. Se usa siempre junto con `jspdf`. |

---

### Grupo 3 — Primitivas Radix UI (Avanzadas)

```powershell
Write-Host "Instalando Radix UI primitivas avanzadas..." -ForegroundColor Cyan
npm install @radix-ui/react-dialog@1.1.15 @radix-ui/react-select@2.2.6 --legacy-peer-deps --no-fund --no-audit
```

| Paquete | Version | Proposito |
|:--------|:--------|:----------|
| `@radix-ui/react-dialog` | 1.1.15 | Modales accesibles con manejo automatico de foco, trap de teclado (el foco no puede salir del modal con Tab) y soporte para screen readers. Se usa en formularios de alta de clientes, confirmaciones de pedido y alertas de lote vencido. |
| `@radix-ui/react-select` | 2.2.6 | Selects accesibles con navegacion por teclado y soporte para screen readers. Se usa en selectores de cliente, producto, almacen y estado de pedido. Instalado con `--legacy-peer-deps` por la misma razon que el resto de Radix: peer dependency declarada en React `^18`. |

> **Por que no estan `@radix-ui/react-slot` y `@radix-ui/react-label` aqui?**
> Esas dos primitivas ya fueron instaladas en la Guia 0.1 (Bloque 2 — Grupo 5), junto con el sistema visual base. Son los cimientos de `Button` y `Label` de shadcn/ui. Si se reinstalan aqui, npm simplemente las ignora — pero el Fingerprint los excluye de la verificacion para evitar falsos positivos por diferencias de version de cache.

---

## FINGERPRINT — VALIDACION PARTE 1

```powershell
Write-Host "`nValidando Parte 1 de la Guía 0.2..." -ForegroundColor Yellow

# ─── 1. Verificar las 13 dependencias de negocio ───────────────────────────

$deps = @(
    "@supabase/supabase-js",
    "@supabase/ssr",
    "react-hook-form",
    "zod",
    "@hookform/resolvers",
    "decimal.js",
    "@tanstack/react-table",
    "date-fns",
    "zustand",
    "sonner",
    "@react-pdf/renderer",
    "@radix-ui/react-dialog",
    "@radix-ui/react-select"
)

$allOk = $true
foreach ($dep in $deps) {
    $result = npm list $dep --depth=0 2>&1
    if ($result -match [regex]::Escape($dep)) {
        Write-Host "  ✅ $dep" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $dep NO encontrado" -ForegroundColor Red
        $allOk = $false
    }
}

```

> 🛑 **STOP-ON-FAIL:** Si alguna dependencia aparece con ❌, las causas mas comunes son:
> - **Terminal se congelo durante la instalacion** -> Verificar con `npm list <paquete>`. Si no esta, repetir solo ese grupo con sus banderas completas (`--legacy-peer-deps` si el grupo lo requeria).
> - **Version incorrecta de `@supabase/ssr`** -> La 0.5.x es la version de la guia anterior. Si npm resolvio a 0.5.x por cache, forzar con `npm install @supabase/ssr@0.6.1 --no-fund --no-audit --save-exact`.
> - **`@react-pdf/renderer` en version 4.1.x** -> Misma causa. Forzar con `npm install @react-pdf/renderer@4.3.0 --legacy-peer-deps --no-fund --no-audit --save-exact`.
> - **TypeScript reporta errores** -> En esta parte no se crearon archivos TypeScript. Si `tsc --noEmit` falla, el problema viene de la Guia 0.1 — volver a verificar el Fingerprint de la Parte 4 de la 0.1.

---

## RESUMEN DE ESTA PARTE

**13 paquetes instalados en 3 grupos:**

| Grupo | Paquetes instalados | Bandera especial |
|:------|:--------------------|:-----------------|
| Backend + Validacion | `@supabase/supabase-js@2.50.0`, `@supabase/ssr@0.6.1`, `react-hook-form@7.54.2`, `zod@3.24.2`, `@hookform/resolvers@3.10.0`, `decimal.js@10.5.0` | — |
| UI + Utilidades | `@tanstack/react-table@8.21.2`, `date-fns@4.1.0`, `zustand@5.0.3`, `sonner@1.7.4`, `@react-pdf/renderer@4.3.0` | `--legacy-peer-deps` |
| Radix UI Avanzadas | `@radix-ui/react-dialog@1.1.15`, `@radix-ui/react-select@2.2.6` | `--legacy-peer-deps` |

**Sin cambios en ningun archivo del proyecto** — esta parte es pura instalacion de dependencias.

**Contexto de los cambios de version respecto a la guia anterior:**

| Paquete | Version anterior | Version nueva | Razon del cambio |
|:--------|:-----------------|:--------------|:-----------------|
| `@supabase/ssr` | 0.5.2 | 0.6.1 | Next.js 16 hizo `cookies()` async — la 0.5.x generaba warnings en cada request |
| `@react-pdf/renderer` | 4.1.6 | 4.3.0 | Bug de reconciliacion en React 19 resuelto en 4.3.x |
| `@supabase/supabase-js` | 2.48.1 | 2.50.0 | Parches de seguridad — API identica |

---

## ➡️ SIGUIENTE PARTE

**-> Parte 2** — Clientes Supabase SSR

Se crean los 3 clientes Supabase para los 3 contextos de ejecucion de Next.js App Router: Browser (Client Components), Server (Server Components y Route Handlers) y Edge/Proxy (refresh automatico de token JWT). La version `@supabase/ssr@0.6.1` instalada en esta parte define la firma exacta de los helpers — la Parte 2 la aprovecha con la API `async cookies()` de Next 16.

---

> **Documento:** GUIA_0_2_Parte1_V6.md
> **Proyecto:** Natutech ERP
> **Version:** 6.0
> **Fecha:** 14 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
