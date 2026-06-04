@AGENTS.md

# Estado del Proyecto — Votación de Dominios

## Qué es este proyecto
App de votación de dominios `.mx` para colegas de TI del proyecto Tenochtitlan. Dos fases secuenciales:
1. **Sugerencias** — cada usuario propone 5+ nombres de dominio con significado (extensión .mx ya pactada)
2. **Votación** — reparten 5 puntos (max 3 por opción) entre grupos de 5 dominios anónimos y aleatorios, por rondas

## Stack
- Next.js 16.2.3 (App Router), React 19, TypeScript
- Tailwind CSS 3 con sistema semántico dark (Guía 0.1 aplicada completa — Partes 2, 3, 4)
- Supabase JS (sin auth — solo usernames únicos en localStorage)
- Framer Motion, tailwindcss-animate, Lucide React
- Dark mode forzado (sin ThemeProvider, `class="dark"` directo en html)
- Deploy: Vercel (gratis, temporal)

## Estado de implementación

### ✅ Completado
- **Rediseño visual completo** (junio 2026):
  - Landing: hero con gradient text, 3 context cards (.mx, nombres cortos, creatividad), glassmorphism login, banner de estado de fase
  - Sugerencias: flujo 2 fases (captura → revisión con previews de email/URL/handle → confirmación con stats)
  - Votación: GlowCards, DomainBadge `.mx`, sticky footer, animated counters
  - Resultados: podio top 3, stats bar (sugerencias/participantes/votantes/votos), ranking con gradient progress bars
- **Componentes UI compartidos**: GlowCard, DomainBadge, ProgressBar, Podium (`src/components/ui/`)
- **APIs con stats**: GET `/api/suggestions` y `/api/results` retornan stats agregados
- **Sugerencias flexibles**: mínimo 5, sin máximo (POST acepta >= 5)
- Guía 0.1 completa: Partes 2 (tailwind tokens), 3 (globals.css + eslint + layout), 4 (theme-provider, error-boundary, button/input/label)
- Todas las API routes: `/api/config`, `/api/suggestions`, `/api/votes`, `/api/results`
- Supabase client + tipos compartidos (`src/lib/supabase.ts`, `src/lib/types.ts`)
- Build compilando sin errores ✅

### ⏳ Pendiente
- **Sistema de rondas eliminatorias** — 2-3 rondas donde las menos votadas se eliminan, hasta quedar 2 finalistas
- **Transición automática** — cuando 5+ usuarios envíen sugerencias, habilitar votación (actualmente se cambia `app_config.phase` en Supabase manualmente)
- **Deploy a Vercel** — cuando esté listo para la dinámica

## Archivos clave
- Plan original: `docs/superpowers/plans/2026-06-03-domain-voting-app.md`
- Spec rediseño: `docs/superpowers/specs/2026-06-03-voting-redesign.md`
- Plan rediseño: `docs/superpowers/plans/2026-06-03-voting-redesign.md`

## Reglas del negocio
- Extensión `.mx` ya pactada — todos los dominios son `.mx`
- Nombres cortos y representativos del proyecto Tenochtitlan
- Creatividad libre — todas las propuestas son válidas
- 5+ sugerencias por usuario (mínimo 5, sin máximo)
- 5 puntos por ronda, max 3 por opción
- Tags opcionales al votar: "Suena chido", "Sencillo", "Practico"
- Fase controlada por `app_config.phase` en Supabase: `suggestions` → `voting` → `closed`
- Opciones en votación: anónimas y aleatorias
- Sin auth — username único guardado en localStorage
- Threshold de 5 participantes para habilitar votación (mostrado en landing)

## Componentes UI custom
| Componente | Archivo | Uso |
|:-----------|:--------|:----|
| GlowCard | `src/components/ui/glow-card.tsx` | Card glassmorphism con hover glow |
| DomainBadge | `src/components/ui/domain-badge.tsx` | Muestra `nombre.mx` como badge |
| ProgressBar | `src/components/ui/progress-bar.tsx` | Barra animada con gradiente |
| Podium | `src/components/ui/podium.tsx` | Top 3 con medallas para resultados |
