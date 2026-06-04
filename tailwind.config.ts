// ═══════════════════════════════════════════════════════════════════════
// TAILWIND CONFIG — SISTEMA DE TOKENS SEMANTICOS TECH DARK
// Paleta tech/gamer: cyan/teal + violeta/magenta sobre negro profundo
// Los componentes consumen clases semanticas, nunca colores HSL directos.
// ═══════════════════════════════════════════════════════════════════════
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  // Activa dark mode por clase CSS (.dark en <html>) — manejado por next-themes.
  // El modo "media" (prefers-color-scheme) no permite que el usuario overridee
  // su preferencia del sistema operativo.
  darkMode: ["class"],

  // Tailwind escanea estos archivos para generar solo las clases que se usan.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {

        // ═══════════════════════════════════════════════════════════════
        // CAPA BASE — Fondos y texto principal
        // ═══════════════════════════════════════════════════════════════

        // Fondo principal (gris claro en light, negro profundo con matiz azul en dark)
        background:             'hsl(var(--color-background) / <alpha-value>)',

        // Texto sobre background — contraste WCAG AA (4.5:1) garantizado
        foreground:             'hsl(var(--color-foreground) / <alpha-value>)',

        // Texto secundario: subtitulos, placeholders, metadatos
        'muted-foreground':     'hsl(var(--color-muted-foreground) / <alpha-value>)',

        // Bordes de inputs, divisores y separadores
        border:                 'hsl(var(--color-border) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // CAPAS DE SUPERFICIE — Elevacion visual de componentes
        // La presentacion muestra datos en cards, tablas comparativas y
        // secciones con profundidad — necesita capas para separar visualmente.
        // ═══════════════════════════════════════════════════════════════

        // Fondo de cards, paneles, secciones — una capa sobre background
        surface:                'hsl(var(--color-surface) / <alpha-value>)',

        // Fondo de dropdowns, tooltips, popovers — segunda capa de elevacion
        'surface-raised':       'hsl(var(--color-surface-raised) / <alpha-value>)',

        // Fondo de modales y drawers — la capa mas elevada
        'surface-overlay':      'hsl(var(--color-surface-overlay) / <alpha-value>)',

        // Hover sobre filas, items de lista, botones ghost
        'hover-background':     'hsl(var(--color-hover-background) / <alpha-value>)',

        // Fondo del sidebar — fijo, no cambia con el tema (ancla visual)
        sidebar:                'hsl(var(--color-sidebar) / <alpha-value>)',

        // Texto sobre el sidebar oscuro
        'sidebar-foreground':   'hsl(var(--color-sidebar-foreground) / <alpha-value>)',

        // Hover sobre items del sidebar
        'sidebar-hover':        'hsl(var(--color-sidebar-hover) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // ACCENT PRIMARIO — Cyan/Teal (color de marca tech)
        // Botones CTA, links activos, indicadores de seleccion.
        // Evoca tecnologia, RGB, modernidad.
        // ═══════════════════════════════════════════════════════════════

        'primary-accent':       'hsl(var(--color-primary-accent) / <alpha-value>)',

        // Fondo sutil para badges, highlights y estados activos
        'primary-accent-bg':    'hsl(var(--color-primary-accent-bg) / <alpha-value>)',

        // Texto sobre primary-accent (normalmente blanco o negro segun contraste)
        'primary-accent-text':  'hsl(var(--color-primary-accent-text) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // ACCENT SECUNDARIO — Violeta/Magenta (complemento gamer)
        // Acciones secundarias, tags, categorias visuales, decoracion.
        // ═══════════════════════════════════════════════════════════════

        'secondary-accent':      'hsl(var(--color-secondary-accent) / <alpha-value>)',
        'secondary-accent-bg':   'hsl(var(--color-secondary-accent-bg) / <alpha-value>)',
        'secondary-accent-text': 'hsl(var(--color-secondary-accent-text) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // ESTADOS DE FEEDBACK — Los 4 estados obligatorios
        // ═══════════════════════════════════════════════════════════════

        success:            'hsl(var(--color-success) / <alpha-value>)',
        'success-bg':       'hsl(var(--color-success-bg) / <alpha-value>)',
        warning:            'hsl(var(--color-warning) / <alpha-value>)',
        'warning-bg':       'hsl(var(--color-warning-bg) / <alpha-value>)',
        error:              'hsl(var(--color-error) / <alpha-value>)',
        'error-bg':         'hsl(var(--color-error-bg) / <alpha-value>)',
        info:               'hsl(var(--color-info) / <alpha-value>)',
        'info-bg':          'hsl(var(--color-info-bg) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // PALETA DE DATOS — Graficas, badges, categorias en tablas
        // ═══════════════════════════════════════════════════════════════

        'chart-1':          'hsl(var(--color-chart-1) / <alpha-value>)',
        'chart-2':          'hsl(var(--color-chart-2) / <alpha-value>)',
        'chart-3':          'hsl(var(--color-chart-3) / <alpha-value>)',
        'chart-4':          'hsl(var(--color-chart-4) / <alpha-value>)',


        // ═══════════════════════════════════════════════════════════════
        // COMPATIBILIDAD SHADCN/UI
        // shadcn/ui usa nombres de token propios. Este bloque mapea
        // los tokens semanticos del proyecto a los nombres que shadcn espera,
        // para que Button, Dialog, Toast funcionen sin modificaciones.
        // ═══════════════════════════════════════════════════════════════

        primary:                  'hsl(var(--color-primary-accent) / <alpha-value>)',
        'primary-foreground':     'hsl(var(--color-primary-accent-text) / <alpha-value>)',

        secondary:                'hsl(var(--color-secondary-accent) / <alpha-value>)',
        'secondary-foreground':   'hsl(var(--color-secondary-accent-text) / <alpha-value>)',

        muted:                    'hsl(var(--color-surface) / <alpha-value>)',

        accent:                   'hsl(var(--color-hover-background) / <alpha-value>)',
        'accent-foreground':      'hsl(var(--color-foreground) / <alpha-value>)',

        destructive:              'hsl(var(--color-error) / <alpha-value>)',
        'destructive-foreground': 'hsl(var(--color-primary-accent-text) / <alpha-value>)',

        ring:                     'hsl(var(--color-primary-accent) / <alpha-value>)',

        input:                    'hsl(var(--color-border) / <alpha-value>)',

        popover:                  'hsl(var(--color-surface-raised) / <alpha-value>)',
        'popover-foreground':     'hsl(var(--color-foreground) / <alpha-value>)',

        card:                     'hsl(var(--color-surface) / <alpha-value>)',
        'card-foreground':        'hsl(var(--color-foreground) / <alpha-value>)',
      },

      // ═══════════════════════════════════════════════════════════════
      // BORDER RADIUS — Controlado por variable CSS para consistencia global
      // ═══════════════════════════════════════════════════════════════
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        xs:   "calc(var(--radius) - 6px)",
      },

      // ═══════════════════════════════════════════════════════════════
      // TIPOGRAFIA — Inter como fuente del sistema
      // Se carga con next/font (inline CSS, cero FOUT).
      // La variable --font-inter se inyecta en <html> desde layout.tsx.
      // ═══════════════════════════════════════════════════════════════
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ═══════════════════════════════════════════════════════════════
      // SOMBRAS PREMIUM — Para estetica dark con profundidad
      // ═══════════════════════════════════════════════════════════════
      boxShadow: {
        // Cards, secciones — elevacion minima
        "premium-sm":    "0 2px 8px -1px rgba(0,0,0,0.06), 0 1px 4px -1px rgba(0,0,0,0.04)",
        // Dropdowns, selects, tooltips — elevacion media
        "premium-md":    "0 8px 24px -4px rgba(0,0,0,0.10), 0 4px 12px -2px rgba(0,0,0,0.06)",
        // Modales, drawers — elevacion alta
        "premium-lg":    "0 20px 48px -8px rgba(0,0,0,0.14), 0 12px 24px -4px rgba(0,0,0,0.08)",
        // Inputs focus — sombra interna
        "premium-inner": "inset 0 1px 3px 0 rgba(0,0,0,0.06)",
        // Sidebar, nav fija — sombra lateral derecha
        "premium-side":  "4px 0 16px -2px rgba(0,0,0,0.08)",
      },

      // ═══════════════════════════════════════════════════════════════
      // ANIMACIONES — Para transiciones de entrada en secciones
      // ═══════════════════════════════════════════════════════════════
      keyframes: {
        // Entrada suave para contenido al navegar entre secciones
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Entrada para modales y overlays
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },

  // tailwindcss-animate: requerido por los componentes shadcn/ui (Dialog,
  // Sheet, Popover) para sus animaciones de entrada/salida.
  plugins: [tailwindcssAnimate],
};

export default config;
