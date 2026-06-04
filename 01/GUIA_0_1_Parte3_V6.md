# GUIA 0.1 — SETUP INICIAL: NEXT.JS, TAILWIND, SHADCN/UI Y TEMAS
## PARTE 3: SEGURIDAD Y SISTEMA VISUAL

> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Parte:** 3 de 4
> **Prerequisito:** Parte 2 completada y Fingerprint aprobado — directorios, archivos base, `tailwind.config.ts`, `tsconfig.json` y scripts listos
> **Siguiente parte:** `GUIA_0_1_Parte4_V6.md` — Componentes y Verificacion Final
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE HACE EN ESTA PARTE?

Esta parte configura la primera capa de seguridad del proyecto (regla ESLint que bloquea `getSession()`), define los valores HSL reales para las 3 paletas × light/dark = 6 combinaciones (Capa 1 del sistema de 3 capas), y crea el layout raiz con ThemeProvider y la fuente Plus Jakarta Sans.

- **Bloque 8 — `eslint.config.mjs`:** Regla de seguridad que bloquea `getSession()` y configura flat config ESLint 9 para Next.js 16.
- **Bloque 9 — `src/app/globals.css`:** Variables CSS HSL para las 6 combinaciones de tema — Capa 1 del sistema visual.
- **Bloque 10 — `src/app/layout.tsx`:** Layout raiz con ThemeProvider, Plus Jakarta Sans y metadata global.

> **Al terminar esta parte:** El sistema de seguridad ESLint esta activo, las 6 combinaciones de tema existen en CSS, y el layout raiz esta listo para recibir los componentes de la Parte 4. `npx tsc --noEmit` pasa sin errores.

---

> **Nota de compatibilidad de shell:** Esta guia usa sintaxis PowerShell (`Write-Host`, `@'...'@`, `Set-Content`, `Remove-Item`). Si se ejecuta desde bash (Git Bash, WSL, macOS), usar los equivalentes:
> - `Write-Host "texto" -ForegroundColor Green` -> `echo "texto"`
> - `@'...'@ | Set-Content -Path "ruta"` -> heredoc `cat > ruta << 'EOF'`
> - `Remove-Item "ruta"` -> `rm -f "ruta"`
> - `Test-Path "ruta"` -> `test -f "ruta"`
>
> Verificar el shell activo antes de ejecutar: `$PSVersionTable` (PowerShell) o `echo $SHELL` (bash).

---

## BLOQUE 8 — REGLA DE SEGURIDAD ESLINT

📄 **ARCHIVO REEMPLAZADO** — `eslint.config.mjs`

**Proposito:** Bloquear en tiempo de desarrollo el uso de `getSession()` de Supabase Auth en cualquier archivo del proyecto. Es la primera capa de seguridad del sistema Zero-Trust — convierte un error de seguridad critico en un error de compilacion que nunca puede llegar a produccion.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Configuracion raiz |
| Ejecuta en | CLI (`npm run lint`) y editor (extension ESLint) |
| Contrato | Bloquea `getSession()` en todo el proyecto. Configura `argsIgnorePattern: "^_"` para parametros ignorados |
| Si lo modificas | Desactivar `no-restricted-syntax` permite que `getSession()` pase a produccion — un atacante puede falsificar su rol desde DevTools |

### DECISIONES DE DISENO

**Por que `getSession()` es peligroso?**

Supabase Auth ofrece dos metodos para verificar al usuario:

| Metodo | Fuente de datos | Seguridad |
|:-------|:----------------|:----------|
| `getSession()` | `localStorage` del navegador | ⚠️ El usuario puede abrir DevTools y modificar el token para falsificar su identidad o rol |
| `getUser()` | Servidor JWT de Supabase | ✅ Supabase verifica la firma criptografica — no se puede falsificar desde el cliente |

El escenario de ataque es concreto y reproducible sin conocimientos especiales:
1. El usuario abre DevTools → Application → Local Storage
2. Modifica el campo de rol en el token a `"administrador"`
3. Con `getSession()` → la app lee el token local → cree que es administrador → acceso total
4. Con `getUser()` → Supabase verifica el token contra su servidor → rechaza el token falsificado

**Por que flat config con `defineConfig()`?**
Next.js 16 usa ESLint 9 con flat config. El formato legacy (`.eslintrc.json`) fue descontinuado. `defineConfig()` provee autocompletado y validacion de tipos en el editor.

**Por que `securityConfig` antes de `nextVitals`?**
El orden importa en flat config. Al poner la regla de seguridad primero, tiene prioridad sobre cualquier configuracion que `eslint-config-next` pudiera definir sobre `no-restricted-syntax`.

**Por que `argsIgnorePattern: "^_"`?**
Patron estandar de TypeScript para parametros que se ignoran intencionalmente. Un parametro prefixado con `_` (ej: `_errorInfo`, `_event`) le indica tanto al desarrollador como a las herramientas que la omision es por diseno, no un olvido. Se configura aqui para que aplique en todo el proyecto — callbacks de eventos, Server Actions y class methods lo necesitaran en guias posteriores.

```powershell
$content = @'
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ════════════════════════════════════════════════════════════════════
// REGLA DE SEGURIDAD — Bloquear getSession() de Supabase Auth
//
// getSession() lee la sesion desde localStorage del navegador sin
// verificarla contra el servidor. Un atacante puede modificar el
// token desde DevTools y falsificar su identidad o rol.
//
// getUser() hace una peticion HTTP a Supabase Auth y verifica el
// token criptograficamente — no se puede falsificar desde el cliente.
//
// Esta regla convierte ese error en un error de compilacion.
// Se aplica a TODOS los archivos del proyecto sin excepcion.
// ════════════════════════════════════════════════════════════════════
const securityConfig = {
    name: "security-rules",
    rules: {
        // ── Parametros ignorados intencionalmente ─────────────────────
        // El prefijo _ en un parametro (ej: _errorInfo, _event) indica
        // que la omision es por diseno, no un olvido. Sin esta regla,
        // TypeScript strict marca error en callbacks y class methods
        // donde el parametro es obligatorio por la firma pero no se usa.
        //
        // Ejemplos en este proyecto:
        // componentDidCatch(error, _errorInfo) — firma obligatoria de React
        // onChange={(_event, value) => value}  — solo interesa el valor
        // async (_req, res) => res.json(...)   — solo interesa la respuesta
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                "argsIgnorePattern": "^_",
                "varsIgnorePattern": "^_",
                "caughtErrorsIgnorePattern": "^_"
            }
        ],

        // ── Seguridad de autenticacion ────────────────────────────────
        // Bloquea supabase.getSession() en cualquier archivo.
        // Solo getUser() esta permitido — verifica el token contra
        // el servidor de Supabase, no puede ser falsificado desde
        // el navegador.
        "no-restricted-syntax": [
            "error",
            {
                selector: 'CallExpression[callee.object.name="supabase"][callee.property.name="getSession"]',
                message: "SEGURIDAD: Usa getUser() en vez de getSession() — getSession() lee del storage local y puede ser manipulado por el usuario desde DevTools."
            }
        ]
    }
};

// securityConfig va primero — tiene prioridad sobre nextVitals y nextTs
const eslintConfig = defineConfig([
    securityConfig,
    ...nextVitals,
    ...nextTs,
    // globalIgnores al final — se aplica sobre todas las configs anteriores
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;
'@

New-Item -Path "eslint.config.mjs" -ItemType File -Force | Out-Null
Set-Content -Path "eslint.config.mjs" -Value $content -Encoding UTF8
Write-Host "✅ eslint.config.mjs creado — flat config ESLint 9 para Next.js 16" -ForegroundColor Green
Write-Host "🔐 Regla getSession() bloqueada — solo getUser() permitido" -ForegroundColor Cyan
Write-Host "⚡ securityConfig tiene prioridad — va antes de nextVitals en el array" -ForegroundColor Cyan
Write-Host "🔧 Patron _ configurado — parametros ignorados no generan warnings" -ForegroundColor Cyan
```

---

### Test de verificacion opcional

Confirma que la regla funciona antes de continuar. Crea un archivo temporal, ejecuta lint, y eliminalo:

```powershell
# 1. Crear archivo de prueba con getSession()
$test = @'
// ARCHIVO DE PRUEBA — SE ELIMINA DESPUES
const supabase = { getSession: () => {} }
supabase.getSession()
'@
Set-Content -Path "test-security-rule.ts" -Value $test -Encoding UTF8

# 2. Ejecutar lint — debe fallar con el mensaje de seguridad
npm run lint

# 3. Eliminar el archivo de prueba
Remove-Item "test-security-rule.ts" -Force
Write-Host "✅ Archivo de prueba eliminado" -ForegroundColor Green
```

**Resultado esperado:** ESLint falla con:
`❌ SEGURIDAD: Usa getUser() en vez de getSession()...`

Si ESLint pasa sin error, la regla no esta activa — repetir el bloque.

---

## BLOQUE 9 — VARIABLES CSS GLOBALES (SISTEMA DE TEMAS)

📄 **ARCHIVO REEMPLAZADO** — `src/app/globals.css`

**Proposito:** Definir los valores HSL reales de cada token para las 3 paletas × light/dark = 6 combinaciones. Este archivo es la Capa 1 del sistema visual. El Bloque 6 (`tailwind.config.ts`) definio los nombres de los tokens — este bloque les da los valores concretos. Sin este archivo, todas las clases semanticas (`bg-primary-accent`, `text-foreground`, `border-surface`) renderizan transparente.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | CSS global |
| Ejecuta en | Browser (runtime) + Build time (Tailwind JIT) |
| Importado por | `src/app/layout.tsx` (via `import "./globals.css"`) |
| Importa de | Ninguno — es la fuente primaria de valores |
| Contrato | Define 30 variables CSS por combinacion × 6 combinaciones + `--radius`. Alimenta todos los tokens de `tailwind.config.ts` |
| Si lo modificas | Cambiar un valor HSL afecta todos los componentes que usen ese token. Eliminar una variable hace que el token correspondiente renderice transparente |

### DECISIONES DE DISENO

**Por que valores HSL sin `hsl()`?**
Las variables guardan solo los tres numeros (`221 83% 53%`) sin el wrapper `hsl()`. Esto permite que Tailwind aplique opacidad dinamica desde la clase: `bg-primary-accent/50` se convierte en `hsl(221 83% 53% / 0.5)`. Si la variable incluyera `hsl()`, esta sintaxis de opacidad no funcionaria — el valor quedaria como `hsl(hsl(...) / 0.5)` que el navegador no puede interpretar.

**Como se activan las paletas?**
- La clase `dark` en `<html>` activa el modo oscuro — la gestiona `next-themes`
- El atributo `data-theme` en `<html>` activa la paleta alternativa
- Ambos mecanismos son independientes y se combinan: `class="dark" data-theme="zinc"` → paleta zinc en modo oscuro

**Por que fondos light con matiz leve y no blanco puro?**
`background` usa `220 20% 97%` (no blanco puro) porque el blanco puro (`0 0% 100%`) fatiga la vista en sesiones largas con muchos elementos. Un matiz muy suave reduce el contraste maximo sin perder legibilidad.

**Por que sidebar siempre oscuro?**
`color-sidebar` usa el mismo valor en las 6 combinaciones: `220 13% 10%`. El sidebar es el ancla de navegacion — cambiar su color con el tema rompe la orientacion espacial del usuario.

**Por que los acentos suben en lightness en dark mode?**
Los acentos en dark mode tienen lightness mayor (`60%`) que en light (`53%`) porque sobre fondos oscuros, el mismo color se percibe mas apagado. Sin este ajuste, los botones CTA parecen desactivados en modo oscuro.

| Paleta | `data-theme` | Concepto | Nicho ideal |
|:-------|:-------------|:---------|:------------|
| Slate | *(default, sin atributo)* | Azul-grisaceo neutro + indigo | ERP, inventarios, procesos — la mas versatil |
| Zinc | `"zinc"` | Monocromatico calido + ambar | Ferreterias, cafeterias, negocios con caracter |
| Ocean | `"ocean"` | Azul profundo + teal | Clinicas, industria tecnica, procesos medicos |

```powershell
$content = @'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {

  /* ═══════════════════════════════════════════════════════════════════
     PALETA SLATE — LIGHT (predeterminada, sin data-theme)
     Azul-grisáceo neutro con acento índigo.
     La paleta más versátil: ERP, inventarios, procesos, dashboards.
     Profesional sin ser fría. Legible en sesiones largas.
     ═══════════════════════════════════════════════════════════════════ */
  :root {

    /* ── FONDOS BASE ──────────────────────────────────────────────────
       background: fondo principal de la app. Matiz azul-gris muy suave
       (no blanco puro) para reducir fatiga visual en sesiones largas.
       ──────────────────────────────────────────────────────────────── */
    --color-background:         220 20% 97%;
    --color-foreground:         222 47% 11%;
    --color-muted-foreground:   215 16% 47%;
    --color-border:             220 13% 91%;

    /* ── CAPAS DE SUPERFICIE ──────────────────────────────────────────
       Tres niveles de elevación para cards, dropdowns y modales.
       Cada capa sube 2% en lightness para separar sin usar sombras fuertes.
       ──────────────────────────────────────────────────────────────── */
    --color-surface:            0 0% 100%;
    --color-surface-raised:     220 20% 99%;
    --color-surface-overlay:    0 0% 100%;
    --color-hover-background:   220 13% 95%;

    /* ── SIDEBAR ──────────────────────────────────────────────────────
       Valor fijo en las 6 combinaciones — el sidebar no cambia con el tema.
       Es el ancla visual de navegación: siempre oscuro, siempre reconocible.
       ──────────────────────────────────────────────────────────────── */
    --color-sidebar:            220 13% 10%;
    --color-sidebar-foreground: 220 13% 70%;
    --color-sidebar-hover:      220 13% 16%;

    /* ── ACCENT PRIMARIO — Índigo ─────────────────────────────────────
       Color de acción principal: botones CTA, links activos, selección.
       Índigo (221°) — profesional, confiable, sin ser clínico.
       ──────────────────────────────────────────────────────────────── */
    --color-primary-accent:      221 83% 53%;
    --color-primary-accent-bg:   221 100% 97%;
    --color-primary-accent-text: 0 0% 100%;

    /* ── ACCENT SECUNDARIO — Violeta ──────────────────────────────────
       Para acciones secundarias, tags, categorías visuales.
       Complementa al índigo sin competir con él.
       ──────────────────────────────────────────────────────────────── */
    --color-secondary-accent:      262 83% 58%;
    --color-secondary-accent-bg:   262 100% 97%;
    --color-secondary-accent-text: 0 0% 100%;

    /* ── ESTADOS DE FEEDBACK ──────────────────────────────────────────
       Los 4 estados obligatorios. Cada uno tiene color principal y
       fondo sutil para badges, alertas y banners sin hardcodear colores.
       ──────────────────────────────────────────────────────────────── */
    --color-success:     142 72% 36%;
    --color-success-bg:  142 72% 95%;
    --color-warning:     38 92% 45%;
    --color-warning-bg:  38 92% 95%;
    --color-error:       0 84% 55%;
    --color-error-bg:    0 84% 96%;
    --color-info:        199 89% 40%;
    --color-info-bg:     199 89% 95%;

    /* ── PALETA DE DATOS ──────────────────────────────────────────────
       4 colores para gráficas, badges de estado y categorías en tablas.
       Separados en hue mínimo 60° para distinguibilidad con daltonismo.
       índigo (221°) → verde (142°) → ámbar (38°) → teal (178°)
       ──────────────────────────────────────────────────────────────── */
    --color-chart-1:    221 83% 53%;
    --color-chart-2:    142 72% 36%;
    --color-chart-3:    38 92% 45%;
    --color-chart-4:    178 70% 38%;

    /* ── RADIO DE BORDES ──────────────────────────────────────────────
       Variable global que controla todos los border-radius del sistema.
       Cambiar este valor solo aquí actualiza tarjetas, botones, inputs
       y cualquier componente que use rounded-lg, rounded-md, rounded-sm.
       ──────────────────────────────────────────────────────────────── */
    --radius: 0.625rem;
  }

  /* ═══════════════════════════════════════════════════════════════════
     PALETA SLATE — DARK
     Los acentos suben en lightness (53% → 62%) porque sobre fondos
     oscuros el mismo color se percibe más apagado. Sin este ajuste,
     los botones CTA parecen desactivados en modo oscuro.
     ═══════════════════════════════════════════════════════════════════ */
  .dark {

    /* Fondos oscuros escalonados — no negro puro para evitar contraste
       excesivo. Matiz azul-oscuro (222°) cohesiona con el acento índigo. */
    --color-background:         222 47% 8%;
    --color-foreground:         210 40% 95%;
    --color-muted-foreground:   215 20% 55%;
    --color-border:             217 32% 18%;

    /* Capas de superficie en dark: suben en lightness para crear elevación */
    --color-surface:            222 47% 11%;
    --color-surface-raised:     222 47% 14%;
    --color-surface-overlay:    222 47% 16%;
    --color-hover-background:   217 32% 16%;

    /* Sidebar: mismo valor que light — ancla visual inmutable */
    --color-sidebar:            220 13% 10%;
    --color-sidebar-foreground: 220 13% 65%;
    --color-sidebar-hover:      220 13% 16%;

    /* Acento primario: +9% lightness respecto al light (53% → 62%) */
    --color-primary-accent:      217 91% 62%;
    --color-primary-accent-bg:   222 47% 16%;
    --color-primary-accent-text: 0 0% 100%;

    /* Acento secundario: +7% lightness */
    --color-secondary-accent:      262 83% 65%;
    --color-secondary-accent-bg:   262 83% 16%;
    --color-secondary-accent-text: 0 0% 100%;

    /* Estados de feedback: en dark, los fondos son oscuros (12%) no claros (95%) */
    --color-success:     142 72% 46%;
    --color-success-bg:  142 72% 12%;
    --color-warning:     38 92% 52%;
    --color-warning-bg:  38 92% 12%;
    --color-error:       0 84% 62%;
    --color-error-bg:    0 84% 12%;
    --color-info:        199 89% 52%;
    --color-info-bg:     199 89% 12%;

    /* Chart colors: +8-10% lightness en dark para mantener visibilidad */
    --color-chart-1:    217 91% 62%;
    --color-chart-2:    142 72% 46%;
    --color-chart-3:    38 92% 52%;
    --color-chart-4:    178 70% 48%;
  }


  /* ═══════════════════════════════════════════════════════════════════
     PALETA ZINC — LIGHT  [data-theme="zinc"]
     Monocromático cálido con acento ámbar-naranja.
     Para negocios con carácter: ferreterías, cafeterías, talleres.
     Evoca materiales, calidez, lo tangible. Menos corporativo.
     ═══════════════════════════════════════════════════════════════════ */
  [data-theme="zinc"] {

    /* Fondos: warm gray (matiz 30°) — más cálido que el slate neutro */
    --color-background:         30 10% 96%;
    --color-foreground:         20 14% 10%;
    --color-muted-foreground:   20 8% 45%;
    --color-border:             30 8% 88%;

    --color-surface:            0 0% 100%;
    --color-surface-raised:     30 10% 98%;
    --color-surface-overlay:    0 0% 100%;
    --color-hover-background:   30 8% 93%;

    /* Sidebar: idéntico al slate — ancla visual no cambia entre paletas */
    --color-sidebar:            220 13% 10%;
    --color-sidebar-foreground: 220 13% 70%;
    --color-sidebar-hover:      220 13% 16%;

    /* Acento primario — Ámbar oscuro: decisivo, cálido, visible */
    --color-primary-accent:      32 95% 40%;
    --color-primary-accent-bg:   32 95% 95%;
    --color-primary-accent-text: 0 0% 100%;

    /* Acento secundario — Naranja quemado: complementa sin saturar */
    --color-secondary-accent:      18 90% 48%;
    --color-secondary-accent-bg:   18 90% 95%;
    --color-secondary-accent-text: 0 0% 100%;

    /* Estados de feedback: mismos valores que slate — son semánticos */
    --color-success:     142 72% 36%;
    --color-success-bg:  142 72% 95%;
    --color-warning:     38 92% 45%;
    --color-warning-bg:  38 92% 95%;
    --color-error:       0 84% 55%;
    --color-error-bg:    0 84% 96%;
    --color-info:        199 89% 40%;
    --color-info-bg:     199 89% 95%;

    /* Chart: ámbar como chart-1 para cohesión con el acento de la paleta */
    --color-chart-1:    32 95% 40%;
    --color-chart-2:    142 72% 36%;
    --color-chart-3:    221 83% 53%;
    --color-chart-4:    18 90% 48%;
  }

  /* ═══════════════════════════════════════════════════════════════════
     PALETA ZINC — DARK  [data-theme="zinc"].dark
     ═══════════════════════════════════════════════════════════════════ */
  .dark[data-theme="zinc"],
  [data-theme="zinc"].dark {

    /* Fondos: warm dark — evita el azul-oscuro del slate para mantener
       la calidez de la paleta incluso en modo oscuro */
    --color-background:         20 8% 8%;
    --color-foreground:         30 10% 94%;
    --color-muted-foreground:   20 6% 55%;
    --color-border:             20 6% 18%;

    --color-surface:            20 8% 11%;
    --color-surface-raised:     20 8% 14%;
    --color-surface-overlay:    20 8% 16%;
    --color-hover-background:   20 6% 16%;

    --color-sidebar:            220 13% 10%;
    --color-sidebar-foreground: 220 13% 65%;
    --color-sidebar-hover:      220 13% 16%;

    /* Acento ámbar: sube lightness (40% → 55%) para no perderse en dark */
    --color-primary-accent:      32 95% 55%;
    --color-primary-accent-bg:   32 95% 14%;
    --color-primary-accent-text: 20 14% 6%;

    --color-secondary-accent:      18 90% 58%;
    --color-secondary-accent-bg:   18 90% 14%;
    --color-secondary-accent-text: 20 14% 6%;

    --color-success:     142 72% 46%;
    --color-success-bg:  142 72% 12%;
    --color-warning:     38 92% 52%;
    --color-warning-bg:  38 92% 12%;
    --color-error:       0 84% 62%;
    --color-error-bg:    0 84% 12%;
    --color-info:        199 89% 52%;
    --color-info-bg:     199 89% 12%;

    --color-chart-1:    32 95% 55%;
    --color-chart-2:    142 72% 46%;
    --color-chart-3:    217 91% 62%;
    --color-chart-4:    18 90% 58%;
  }


  /* ═══════════════════════════════════════════════════════════════════
     PALETA OCEAN — LIGHT  [data-theme="ocean"]
     Azul profundo con acento teal-cian.
     Para contextos técnicos e institucionales: clínicas, industria
     de precisión, procesos médicos, laboratorios.
     Evoca confianza, exactitud, higiene.
     ═══════════════════════════════════════════════════════════════════ */
  [data-theme="ocean"] {

    /* Fondo: azul muy pálido (210°, 95% lightness) — limpio, clínico */
    --color-background:         210 40% 96%;
    --color-foreground:         213 50% 10%;
    --color-muted-foreground:   213 20% 46%;
    --color-border:             210 30% 88%;

    --color-surface:            0 0% 100%;
    --color-surface-raised:     210 40% 98%;
    --color-surface-overlay:    0 0% 100%;
    --color-hover-background:   210 30% 93%;

    --color-sidebar:            220 13% 10%;
    --color-sidebar-foreground: 220 13% 70%;
    --color-sidebar-hover:      220 13% 16%;

    /* Acento primario — Teal (178°): preciso, técnico, diferenciado
       del slate-índigo por 43° de hue — claramente distinto en pantalla */
    --color-primary-accent:      178 72% 34%;
    --color-primary-accent-bg:   178 72% 94%;
    --color-primary-accent-text: 0 0% 100%;

    /* Acento secundario — Cian: complementa el teal con más brillo */
    --color-secondary-accent:      194 85% 38%;
    --color-secondary-accent-bg:   194 85% 94%;
    --color-secondary-accent-text: 0 0% 100%;

    --color-success:     142 72% 36%;
    --color-success-bg:  142 72% 95%;
    --color-warning:     38 92% 45%;
    --color-warning-bg:  38 92% 95%;
    --color-error:       0 84% 55%;
    --color-error-bg:    0 84% 96%;
    --color-info:        199 89% 40%;
    --color-info-bg:     199 89% 95%;

    /* Chart: teal como chart-1, cohesión con el acento */
    --color-chart-1:    178 72% 34%;
    --color-chart-2:    142 72% 36%;
    --color-chart-3:    38 92% 45%;
    --color-chart-4:    221 83% 53%;
  }

  /* ═══════════════════════════════════════════════════════════════════
     PALETA OCEAN — DARK  [data-theme="ocean"].dark
     ═══════════════════════════════════════════════════════════════════ */
  .dark[data-theme="ocean"],
  [data-theme="ocean"].dark {

    /* Fondos: azul-marino profundo — cohesiona con el acento teal */
    --color-background:         213 50% 7%;
    --color-foreground:         210 40% 95%;
    --color-muted-foreground:   213 20% 55%;
    --color-border:             213 30% 17%;

    --color-surface:            213 50% 10%;
    --color-surface-raised:     213 50% 13%;
    --color-surface-overlay:    213 50% 15%;
    --color-hover-background:   213 30% 15%;

    --color-sidebar:            220 13% 10%;
    --color-sidebar-foreground: 220 13% 65%;
    --color-sidebar-hover:      220 13% 16%;

    /* Teal: sube lightness (34% → 50%) para mantener visibilidad en dark */
    --color-primary-accent:      178 72% 50%;
    --color-primary-accent-bg:   178 72% 12%;
    --color-primary-accent-text: 213 50% 5%;

    --color-secondary-accent:      194 85% 52%;
    --color-secondary-accent-bg:   194 85% 12%;
    --color-secondary-accent-text: 213 50% 5%;

    --color-success:     142 72% 46%;
    --color-success-bg:  142 72% 12%;
    --color-warning:     38 92% 52%;
    --color-warning-bg:  38 92% 12%;
    --color-error:       0 84% 62%;
    --color-error-bg:    0 84% 12%;
    --color-info:        199 89% 52%;
    --color-info-bg:     199 89% 12%;

    --color-chart-1:    178 72% 50%;
    --color-chart-2:    142 72% 46%;
    --color-chart-3:    38 92% 52%;
    --color-chart-4:    221 83% 62%;
  }
}

@layer base {
  /* Aplicar border-color semántico a todos los elementos con border.
     Sin esta regla, los borders de Tailwind usan currentColor por defecto
     y aparecen del mismo color que el texto — no el color de borde del tema. */
  * {
    @apply border-border;
  }

  /* Fondo y texto semánticos en el body.
     transition-colors con duration-200 produce el efecto suave al
     cambiar de paleta. El cambio de dark/light desactiva la transición
     (disableTransitionOnChange en ThemeProvider) para evitar flash visual. */
  body {
    @apply bg-background text-foreground transition-colors duration-200;
  }

  /* Scrollbar personalizado para interfaces densas con tablas y listas largas.
     Los scrollbars nativos del sistema rompen la estética en Windows (muy anchos).
     Esta definición los adelgaza y los colorea con los tokens del sistema. */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-border rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground;
  }
}
'@

New-Item -Path "src/app/globals.css" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/globals.css" -Value $content -Encoding UTF8
Write-Host "✅ src/app/globals.css creado — 3 paletas × light/dark = 6 combinaciones" -ForegroundColor Green
Write-Host "🎨 Paletas: slate (default) | zinc (data-theme=zinc) | ocean (data-theme=ocean)" -ForegroundColor Cyan
Write-Host "🔲 Sidebar fijo en todas las combinaciones — ancla visual inmutable" -ForegroundColor Cyan
Write-Host "📊 Tokens nuevos: surface (3 capas) + chart (4 colores) + 4 estados con -bg" -ForegroundColor Cyan
Write-Host "🖱️ Scrollbar personalizado incluido — crítico en Windows con interfaces densas" -ForegroundColor Cyan
```

---

## BLOQUE 10 — LAYOUT RAIZ CON THEMEPROVIDER

📄 **ARCHIVO REEMPLAZADO** — `src/app/layout.tsx`

**Proposito:** El layout raiz es el envoltorio que nunca cambia — el unico archivo que rodea absolutamente todo en la app: todas las paginas, todos los modulos, todos los componentes. Se ejecuta una vez en cada carga y nunca se vuelve a tocar salvo que cambie la fuente, el titulo de la app o el proveedor de temas.

### FICHA TECNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | layout.tsx (siempre Server Component) |
| Ejecuta en | Servidor |
| Importa de | `globals.css`, `ThemeProvider` (`@/components/theme-provider`) |
| Contrato | Inyecta `--font-jakarta` en `<html>`, envuelve toda la app con `ThemeProvider`, define metadata global con template |
| Si lo modificas | Quitar `ThemeProvider` desactiva dark mode y paletas en toda la app. Quitar `suppressHydrationWarning` genera warnings en consola en cada carga |

### DECISIONES DE DISENO

**Por que `defaultTheme="system"`?**
La app detecta automaticamente si el sistema operativo del usuario usa light o dark y arranca con ese modo. El usuario no necesita configurar nada al abrir la app por primera vez.

**Por que `disableTransitionOnChange`?**
Evita el flash visual al cambiar entre light y dark mode. El cambio de paleta si tiene transicion (definida en `globals.css` con `transition-colors duration-200`) pero el cambio de modo es instantaneo.

**Por que `attribute="class"`?**
Le indica a `next-themes` que use la clase CSS `dark` en `<html>` para activar el modo oscuro. Necesita coincidir con `darkMode: ["class"]` en `tailwind.config.ts` — si uno usa `class` y el otro usa `data-theme`, el dark mode no funciona.

**Por que `suppressHydrationWarning`?**
`next-themes` modifica la clase `dark` en el cliente despues del SSR, creando una diferencia intencional entre el HTML del servidor y el del cliente. Sin este atributo, React lanza warnings de hidratacion en consola en cada carga. Es un uso documentado y seguro — la diferencia es por diseno, no un bug.

```powershell
$content = @'
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// ═══════════════════════════════════════════════════════════════════
// FUENTE — Plus Jakarta Sans
//
// next/font optimiza la carga de la fuente automáticamente:
// - Genera el CSS inline (sin petición adicional a Google Fonts)
// - 'display: swap' muestra la fuente del sistema mientras carga,
//   evitando el bloqueo de renderizado (FOUT controlado)
// - La variable CSS --font-jakarta queda disponible globalmente
//   para que tailwind.config.ts la use en fontFamily.sans
// ═══════════════════════════════════════════════════════════════════
const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
    // Precargar los pesos más usados en interfaces de negocio:
    // 400 (cuerpo), 500 (labels), 600 (títulos), 700 (énfasis)
    weight: ["400", "500", "600", "700"],
});

// ═══════════════════════════════════════════════════════════════════
// METADATA GLOBAL
//
// Aparece en: pestaña del navegador, resultados de Google,
// previews de redes sociales (Open Graph) y bookmarks.
// Cada page.tsx puede sobreescribir title y description con
// export const metadata: Metadata = { title: "...", ... }
// ═══════════════════════════════════════════════════════════════════
export const metadata: Metadata = {
    title: {
        // template: permite que las páginas hijas agreguen su propio título
        // Resultado en una página: "Diagnóstico | Tech Computer"
        template: "%s | Tech Computer",
        // Título por defecto cuando la página no define el suyo
        default: "Tech Computer",
    },
    description: "Diagnóstico interactivo y plan maestro para Tech Computer",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // suppressHydrationWarning en <html>:
        // next-themes modifica class="dark" en el cliente después del SSR.
        // Esa diferencia entre servidor y cliente es INTENCIONAL — no es un bug.
        // Sin este atributo, React lanza warnings de hidratación en cada carga.
        //
        // jakarta.variable inyecta --font-jakarta como variable CSS disponible
        // en todo el árbol de componentes desde el nivel raíz.
        <html lang="es" suppressHydrationWarning className={jakarta.variable}>
            <body className="antialiased font-sans" suppressHydrationWarning>
                {/*
                    ThemeProvider es el interruptor maestro del sistema visual.
                    Sin él, useTheme(), dark mode y las 3 paletas no funcionan.

                    attribute="class"    → usa clase CSS 'dark' en <html>
                                           debe coincidir con darkMode:["class"]
                                           en tailwind.config.ts
                    defaultTheme="system" → detecta la preferencia del SO
                    enableSystem         → habilita prefers-color-scheme
                    disableTransitionOnChange → cambio de modo instantáneo,
                                           sin flash visual entre light y dark
                */}
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
'@

New-Item -Path "src/app/layout.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/app/layout.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/app/layout.tsx creado — layout raíz con ThemeProvider" -ForegroundColor Green
Write-Host "🎨 Plus Jakarta Sans cargada con pesos 400/500/600/700 via next/font" -ForegroundColor Cyan
Write-Host "🌗 ThemeProvider activo — dark mode, paletas y useTheme() disponibles globalmente" -ForegroundColor Cyan
Write-Host "📋 Metadata con template '%s | Tech Computer' — cada página agrega su propio título" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACION PARTE 3

```powershell
Write-Host "`nValidando Parte 3..." -ForegroundColor Yellow

$files = @(
    "eslint.config.mjs",
    "src/app/globals.css",
    "src/app/layout.tsx"
)

$allOk = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file NO existe — repetir el bloque correspondiente" -ForegroundColor Red
        $allOk = $false
    }
}

if ($allOk) {
    Write-Host "`n✅ PARTE 3 COMPLETADA" -ForegroundColor Green
} else {
    Write-Host "`n❌ PARTE 3 INCOMPLETA — corregir antes de continuar" -ForegroundColor Red
}
```

> 🛑 **STOP-ON-FAIL:** Si algun archivo falta, repetir el bloque correspondiente antes de continuar a la Parte 4. Causas comunes:
> - `eslint.config.mjs` sin `defineConfig` → formato incorrecto para ESLint 9 flat config
> - `globals.css` sin alguna paleta → esa combinacion renderiza transparente
> - `layout.tsx` sin `ThemeProvider` → dark mode y paletas no funcionan en ningun componente

---

## RESUMEN DE ESTA PARTE

**Archivos reemplazados:**

| Archivo | Que contiene |
|:--------|:-------------|
| `eslint.config.mjs` | Regla de seguridad que bloquea `getSession()` en todo el proyecto |
| `src/app/globals.css` | 3 paletas × light/dark — todos los tokens HSL del sistema visual |
| `src/app/layout.tsx` | Envoltorio raiz — fuente, ThemeProvider y metadata global |

**Variables que define cada paleta:**

```
--color-background, --color-foreground, --color-muted-foreground, --color-border
--color-surface, --color-surface-raised, --color-surface-overlay, --color-hover-background
--color-sidebar, --color-sidebar-foreground, --color-sidebar-hover
--color-primary-accent, --color-primary-accent-bg, --color-primary-accent-text
--color-secondary-accent, --color-secondary-accent-bg, --color-secondary-accent-text
--color-success, --color-success-bg, --color-warning, --color-warning-bg
--color-error, --color-error-bg, --color-info, --color-info-bg
--color-chart-1, --color-chart-2, --color-chart-3, --color-chart-4
--radius (solo en :root — no se repite por paleta)
```

---

## ➡️ SIGUIENTE PARTE

**→ Parte 4** — Componentes y Verificacion Final

Se crean los componentes de tema, el Error Boundary global y la pagina de verificacion visual. Al terminar, el proyecto compila sin errores y el sistema de temas es verificable en el navegador.

---

> **Documento:** GUIA_0_1_Parte3_V6.md
> **Proyecto:** Presentación Interactiva Tech Computer / Tenochtitlán
> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
