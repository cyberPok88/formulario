# GUIA 0.1 — SETUP INICIAL: NEXT.JS, TAILWIND, SHADCN/UI Y TEMAS
## PARTE 0: PANORAMA GENERAL

> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Parte:** 0 de 4 (documento de referencia)
> **Prerequisito:** Node.js >= 20.9 instalado — verificar con `node -v` y `npm -v`
> **Siguiente parte:** `GUIA_0_1_Parte1_V6.md` — Proyecto Next.js + Dependencias Visuales + shadcn/ui CLI
> **Autor:** Bruno Ulises Pineda Tellez

---

## QUE SE CONSTRUYE EN ESTA GUIA?

Esta guia crea el proyecto desde cero y establece todas las bases tecnicas que las guias posteriores dan por sentadas. Al terminar las 4 partes existira:

1. **Next.js 16.2.3** con App Router, TypeScript en modo strict + reglas adicionales, ESLint 9 flat config
2. **Tailwind CSS 3.4.19** con sistema de tokens semanticos de 3 capas (variables CSS -> tailwind.config.ts -> clases en componentes)
3. **Sistema de temas** con paleta tech/gamer dark-first + soporte para light mode futuro
4. **Framer Motion** instalado y listo para animaciones scroll-triggered en las secciones
5. **shadcn/ui CLI 2.5.0** configurado con `components.json` + componentes base (Button, Input, Label)
6. **Utilidad `cn()`** (clsx + tailwind-merge) como estandar de merge de clases en todo el proyecto
7. **next-themes 0.4.6** con ThemeProvider y dark mode como tema por defecto
8. **Regla de seguridad ESLint** que bloquea `getSession()` en favor de `getUser()`
9. **Patron `_` configurado** en ESLint — parametros ignorados intencionalmente sin warnings
10. **Error Boundary global** para capturar errores sin pantalla en blanco
11. **Pagina de verificacion visual** con banco de pruebas del sistema de temas

Al terminar: `npm run build` compila sin errores y el navegador muestra una pagina con dark mode activo y tokens semanticos funcionando.

---

## CONTEXTO DEL PROYECTO

Este setup sirve como fundacion para una **pagina web interactiva tipo scroll-storytelling** que presenta al dueño de Tech Computer el diagnostico de su negocio y el plan maestro propuesto.

| Aspecto | Valor |
|:--------|:------|
| **Tipo de proyecto** | Pagina web interactiva de presentacion (NO es una app de gestion) |
| **Proposito** | Comunicar un analisis de negocio y plan de desarrollo de forma visual e impactante |
| **Audiencia** | El dueño de Tech Computer — navega solo, exigente en lo visual |
| **Tema visual** | Dark mode principal, estetica tech/gamer con acentos vibrantes |
| **Animaciones** | Scroll-triggered con Framer Motion — variedad visual entre secciones |
| **Auth** | Supabase Auth — login funcional como demo de capacidad tecnica |
| **Deploy** | Vercel (free tier) — link publico protegido por auth |
| **Documento de referencia** | `00_CONTEXTO_PROYECTO.md` en la raiz del proyecto |

---

## LO QUE NO SE CONSTRUYE AQUI

| Componente | Razon | Guia donde va |
|:-----------|:------|:--------------|
| Supabase (Auth, BD, RLS) | Requiere credenciales y configuracion en dashboard | Guia 0.2 |
| Zustand, React Hook Form, Zod | Dependencias de negocio — se instalan con su contexto completo | Guia 0.2 |
| Sonner (toasts) | Se instala junto con los componentes que lo usan | Guia 0.2 |
| Secciones del storytelling | Requieren layout + animaciones + contenido definido | Guias 0.4+ |
| Login page | Requiere Supabase Auth configurado | Guia 0.2 |
| Componentes de animacion (ScrollReveal, FadeIn) | Se crean junto con las secciones que los usan | Guia 0.3 |
| Contenido real de la presentacion | Se construye seccion por seccion en guias posteriores | Guias 0.4-0.9 |

---

## ARQUITECTURA: DECISIONES CERRADAS

| # | Decision | Resultado | Razon |
|:-:|:---------|:----------|:------|
| 1 | Version de Next.js | 16.2.3 pineada (no `@latest`) | Reproducibilidad garantizada — `@latest` puede introducir breaking changes sin aviso |
| 2 | Turbopack en dev | Desactivado — script `dev` usa `--webpack` | Turbopack consume 2-4GB RAM extra. En maquinas con RAM limitada causa freezes. Webpack es estable y suficiente |
| 3 | Tailwind CSS | v3.4.19 — NO v4 | v4 elimina `tailwind.config.ts` y migra a CSS-first (`@theme`), rompiendo el sistema de 3 capas semantico y la compatibilidad con shadcn/ui v2.x |
| 4 | Sistema de temas | Dark-first con paleta tech/gamer | El cliente es del sector tecnologia. Dark mode transmite modernidad y profesionalismo tech. Light mode queda como V2 |
| 5 | Paleta | Tech Dark — negro profundo + acentos vibrantes | Acentos en cyan/teal + violeta/magenta. Evocan RGB gamer sin ser infantiles. Profesional pero con caracter |
| 6 | Tokens | `surface` (3 capas), `chart-1..4`, `error`, `info`, `*-bg` | La presentacion muestra datos, tablas comparativas, timelines y costos — necesita tokens de feedback y datos |
| 7 | Framer Motion | Instalado desde el inicio | El proyecto ES animacion. No tiene sentido agregarlo despues — es tan fundamental como Tailwind |
| 8 | ESLint | Flat config con `defineConfig()` — formato ESLint 9 | Next.js 16 elimino `next lint` y el formato legacy `.eslintrc.json` esta descontinuado |
| 9 | Patron `_` | `argsIgnorePattern: "^_"` en ESLint | Callbacks de eventos y Server Actions tienen parametros obligatorios que a menudo no se usan |
| 10 | `getSession()` bloqueado | Regla `no-restricted-syntax` que rechaza cualquier uso | `getSession()` lee de localStorage — un atacante puede falsificar el token desde DevTools. Solo `getUser()` verifica el JWT contra el servidor |
| 11 | shadcn CLI | v2.5.0 pineado (no v3 ni v4) | Ultima version de la linea 2.x — compatible con React 19, genera `components.json` |
| 12 | Button | Gradiente sutil + `shadow-premium-sm` en variante default | En la presentacion, los botones CTA (proximos pasos, contacto) deben destacar visualmente |
| 13 | TypeScript | Strict mode + reglas adicionales | Previene errores silenciosos en logica de auth y manejo de datos |
| 14 | Import alias | `@/*` -> `src/` | Permite `import { cn } from '@/lib/utils'` en lugar de rutas relativas |
| 15 | App Router | Obligatorio (no Pages Router) | App Router permite Server Components — fundacion de la arquitectura |
| 16 | Fuente | Inter via `next/font` | Maxima legibilidad en pantalla, moderna, tech-clean. Variable `--font-inter` inyectada en `<html>` |

---

## ARQUITECTURA: DIAGRAMA — SISTEMA DE TEMAS (3 CAPAS)

```
+---------------------------------------------------------------+
|  CAPA 1 -- globals.css                                         |
|  Variables CSS con valores HSL reales para el tema dark        |
|                                                                |
|  :root {                                                       |
|    --color-primary-accent: 178 72% 50%;  /* cyan/teal */       |
|    --color-background:     220 20% 97%;  /* gris claro */      |
|  }                                                             |
|  .dark {                                                       |
|    --color-primary-accent: 178 100% 50%; /* cyan vibrante */   |
|    --color-background:     222 47% 5%;   /* casi negro */      |
|  }                                                             |
+----------------------------+----------------------------------+
                             | tailwind.config.ts lee las variables
                             v
+---------------------------------------------------------------+
|  CAPA 2 -- tailwind.config.ts                                  |
|  Mapea variables CSS a tokens Tailwind                         |
|                                                                |
|  colors: {                                                     |
|    'primary-accent': 'hsl(var(--color-primary-accent) / ...)', |
|    background:       'hsl(var(--color-background) / ...)',      |
|  }                                                             |
|  Incluye: sombras premium, border-radius, tipografia           |
+----------------------------+----------------------------------+
                             | Componentes usan clases semanticas
                             v
+---------------------------------------------------------------+
|  CAPA 3 -- Componentes (JSX/TSX)                               |
|  Usan clases semanticas que NUNCA cambian                      |
|                                                                |
|  <button className="bg-primary-accent text-primary-accent-text">
|  <div className="bg-surface shadow-premium-sm">                |
|  <span className="text-muted-foreground">                      |
|                                                                |
|  Resultado: para cambiar toda la paleta de la app, solo se     |
|  modifica globals.css. Ningun componente se toca.               |
+---------------------------------------------------------------+
```

---

## ARQUITECTURA: PALETA TECH DARK

| Elemento | Valor | Proposito |
|:---------|:------|:----------|
| **Background dark** | Negro profundo con matiz azul (222° 47% 5%) | Base oscura sin ser negro puro — reduce fatiga visual |
| **Acento primario** | Cyan/Teal (178° 100% 50%) | Evoca tecnologia, RGB, modernidad. Alta visibilidad en fondos oscuros |
| **Acento secundario** | Violeta/Magenta (270° 80% 65%) | Complementa el cyan. Referencia a iluminacion RGB gamer |
| **Superficies** | Escala de grises-azul (8% → 16% lightness) | Capas de elevacion sutiles para cards y secciones |
| **Texto principal** | Blanco con 95% lightness | Alto contraste sobre fondos oscuros sin ser blanco puro |
| **Texto secundario** | Gris claro 55% lightness | Para subtitulos, metadata, descripciones |

**Como funciona la activacion:**
- La clase `dark` en `<html>` activa el modo oscuro — la gestiona `next-themes`
- `defaultTheme="dark"` hace que el dark mode sea el default al abrir la pagina
- Light mode disponible como V2 — los tokens `:root` definen los valores para light
- Persistencia: la preferencia se guarda en `localStorage`

---

## ARQUITECTURA: TOKENS DEL SISTEMA

Cada modo (light/dark) define exactamente las mismas variables, con valores HSL distintos:

| Grupo | Variables |
|:------|:----------|
| **Fondos base** | `--color-background`, `--color-foreground`, `--color-muted-foreground`, `--color-border` |
| **Capas de superficie** | `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-hover-background` |
| **Accent primario** | `--color-primary-accent`, `--color-primary-accent-bg`, `--color-primary-accent-text` |
| **Accent secundario** | `--color-secondary-accent`, `--color-secondary-accent-bg`, `--color-secondary-accent-text` |
| **Feedback** | `--color-success` + `-bg`, `--color-warning` + `-bg`, `--color-error` + `-bg`, `--color-info` + `-bg` |
| **Datos** | `--color-chart-1`, `--color-chart-2`, `--color-chart-3`, `--color-chart-4` |
| **Bordes** | `--radius` (variable global que controla todos los border-radius) |

**Regla HSL:** Las variables guardan solo los tres numeros (`178 100% 50%`) sin el wrapper `hsl()`. Esto permite opacidad dinamica desde Tailwind: `bg-primary-accent/50` se convierte en `hsl(178 100% 50% / 0.5)`.

---

## INDICE DE PARTES

| Parte | Titulo | Bloques | Al terminar esta parte |
|:------|:-------|:--------|:-----------------------|
| **0** | Panorama general | -- | Este documento leido y entendido |
| **1** | Proyecto Next.js + Dependencias Visuales + shadcn/ui CLI | B1: create-next-app, B2: Dependencias visuales (7 grupos), B2.5: shadcn init, B3: PostCSS | Proyecto existe en disco, 12 dependencias visuales + framer-motion instaladas, `components.json` generado, PostCSS configurado. `npx tsc --noEmit` pasa limpio |
| **2** | Estructura + Configuracion Base | B4: Carpetas, B5: Archivos base (.env, utils.ts, types), B6: tailwind.config.ts (tokens), B7: tsconfig.json (strict), B8: package.json scripts | Arquitectura de carpetas lista, Tailwind con tokens semanticos, TypeScript strict, scripts actualizados |
| **3** | Seguridad ESLint + Sistema Visual CSS | B9: eslint.config.mjs (getSession + patron _), B10: globals.css (paleta tech dark), B11: layout.tsx (ThemeProvider + fuente) | Seguridad ESLint activa, paleta tech/gamer en CSS, layout raiz listo |
| **4** | Componentes + Verificacion Final | B12: theme-provider.tsx, B13: ThemeSwitcher (simplificado), B14: ErrorBoundary, B15: Button/Input/Label (shadcn CLI + reemplazo), B16: page.tsx verificacion | `npm run build` sin errores, sistema de temas verificable en `http://localhost:3000` |

**Contratos que establece cada parte para las siguientes:**
- **Parte 1 -> Parte 2:** Proyecto existe, `node_modules` con dependencias visuales + framer-motion, `components.json` generado
- **Parte 2 -> Parte 3:** Estructura de carpetas, `cn()` en `src/lib/utils.ts`, tokens en `tailwind.config.ts`, TypeScript strict
- **Parte 3 -> Parte 4:** ESLint con reglas de seguridad, variables CSS tech dark en `globals.css`, `layout.tsx` con ThemeProvider
- **Parte 4 -> Guia 0.2:** Proyecto funcional completo, dark mode, componentes UI base, `npm run build` exitoso

---

## MANIFIESTO DE ARCHIVOS

### Archivos nuevos

| # | Archivo | Tipo | Parte | Proposito |
|:-:|:--------|:-----|:------|:----------|
| 1 | `.env.local` | Configuracion | P2-B5 | Variables de entorno (no va al repositorio) |
| 2 | `.env.example` | Configuracion | P2-B5 | Plantilla para el equipo (va al repositorio) |
| 3 | `src/lib/utils.ts` | Utilidades | P2-B5 | Funcion `cn()` — clsx + tailwind-merge |
| 4 | `src/types/index.ts` | Tipos TypeScript | P2-B5 | Tipos base: ApiResponse, LoadingState |
| 5 | `src/components/theme-provider.tsx` | Smart Component | P4-B12 | Wrapper permanente de next-themes |
| 6 | `src/components/theme-switcher.tsx` | Smart Component | P4-B13 | Selector de modo dark/light (simplificado) |
| 7 | `src/components/error-boundary.tsx` | Smart Component | P4-B14 | Captura errores — UI amigable en produccion |
| 8 | `src/components/ui/button.tsx` | Componente UI base | P4-B15 | Button premium (variantes, gradiente, sombras) |
| 9 | `src/components/ui/input.tsx` | Componente UI base | P4-B15 | Input con bg-surface + ring semantico |
| 10 | `src/components/ui/label.tsx` | Componente UI base | P4-B15 | Label accesible via Radix |
| 11 | `src/app/page.tsx` | Pagina Server | P4-B16 | Pagina de verificacion visual (demo de temas) |

### Archivos reemplazados

| # | Archivo | Parte | Por que se reemplaza |
|:-:|:--------|:------|:---------------------|
| 1 | `tailwind.config.ts` | P2-B6 | El generado tiene config minima — se reemplaza con sistema de tokens semanticos completo |
| 2 | `tsconfig.json` | P2-B7 | El generado tiene config basica — se reemplaza con strict mode + reglas adicionales |
| 3 | `postcss.config.mjs` | P1-B3 | El generado usa export anonimo que ESLint marca como warning |
| 4 | `eslint.config.mjs` | P3-B9 | El generado no incluye regla `getSession` ni patron `_` |
| 5 | `package.json` (scripts) | P2-B8 | Los scripts generados usan Turbopack y `next lint` — se actualizan para Next.js 16 |
| 6 | `src/app/globals.css` | P3-B10 | El generado tiene estilos default — se reemplaza con paleta tech dark |
| 7 | `src/app/layout.tsx` | P3-B11 | El generado tiene layout minimo — se reemplaza con ThemeProvider + Inter |

### Directorios nuevos

| Directorio | Proposito | Se usa desde |
|:-----------|:----------|:-------------|
| `src/components/ui/` | Componentes shadcn/ui (archivos locales, no paquete npm) | Guia 0.1 |
| `src/components/sections/` | Secciones del scroll-storytelling (Hero, Diagnostico, etc.) | Guia 0.4+ |
| `src/lib/` | Funciones utilitarias, clientes de servicios, stores | Guia 0.1 |
| `src/types/` | Interfaces y tipos TypeScript compartidos | Guia 0.1 |

---

## NOTAS DE SOPORTE

| Tema | Detalle |
|:-----|:--------|
| **ThemeSwitcher** | Componente simplificado para verificacion visual. Solo dark/light toggle. Se elimina o integra en la UI final cuando la presentacion este armada |
| **`components.json`** | Generado por `npx shadcn@2.5.0 init`. Registra los alias de rutas — necesario para que `npx shadcn add` instale componentes en las rutas correctas en guias posteriores |
| **Error Boundary** | En desarrollo Next.js muestra su propio overlay de error. En produccion muestra la UI personalizada del componente |
| **Regla ESLint getSession** | Permanente en todo el proyecto. Cualquier guia futura que use Supabase Auth debe usar `getUser()`. La regla lo valida en cada `npm run lint` |
| **Versiones pineadas** | Todas las dependencias usan version exacta. Garantizan reproducibilidad entre maquinas y en el tiempo |
| **Turbopack desactivado** | Solo en `dev` con `--webpack`. El build de produccion (`next build`) usa el bundler que Next.js detecte como apropiado |
| **HSL sin wrapper** | Las variables CSS guardan `178 100% 50%` (no `hsl(178 100% 50%)`). Esto permite opacidad dinamica desde Tailwind: `bg-primary-accent/50` |
| **`--legacy-peer-deps`** | Procedimiento oficial de Vercel y shadcn/ui para React 19. Radix UI y next-themes aun declaran peer deps para React ^18. Funciona correctamente con React 19 |
| **Framer Motion** | Se instala en Parte 1 pero los componentes de animacion (ScrollReveal, FadeIn, etc.) se crean en Guia 0.3 junto con las secciones que los usan |

---

## SIGUIENTE GUIA

**-> Guia 0.2 — Auth + Dependencias de Negocio**

Instala Supabase SSR, configura auth con login funcional, y agrega las dependencias operativas del proyecto. La pantalla de login es la primera impresion visual del cliente.

---

> **Documento:** GUIA_0_1_Parte0_V6.md
> **Proyecto:** Presentacion Interactiva Tech Computer / Tenochtitlan
> **Version:** 7.0
> **Fecha:** 25 Mayo 2026
> **Autor:** Bruno Ulises Pineda Tellez
