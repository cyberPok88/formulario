@AGENTS.md

# Estado del Proyecto — Votación de Dominios

## Qué es este proyecto
App de votación de dominios para colegas de TI del proyecto Tenochtitlan. Tres fases:
1. **Sugerencias** — cada usuario propone 5+ nombres de dominio con significado (extensiones flexibles)
2. **Votación** — reparten 5 puntos (max 3 por opción) entre grupos de 5 dominios aleatorios, por rondas
3. **Cerrada** — solo resultados

## Stack
- Next.js 16.2.3 (App Router), React 19, TypeScript
- Tailwind CSS 3.4.19 con sistema semántico dark
- Supabase JS (sin auth — usernames + PIN en localStorage)
- Framer Motion, Lucide React
- Dark mode forzado (`class="dark"` en html)

## Estado de implementación

### ✅ Completado
- **Sistema de auth con PIN**: registro/login unificado via `/api/auth`, SHA-256 hashing, sesión localStorage 12h
- **Sesión con expiración**: `src/lib/session.ts` — save/get/clear/isValid
- **Landing page**: hero, COMENZAR + IR A VOTAR (deshabilitado si <8 participantes)
- **Sugerencias**: formulario con extensiones flexibles (9 opciones), duplicate checking silencioso, revisión antes de enviar
- **Dashboard post-login**: estado del proyecto, stats, acciones contextuales según fase
- **Pre-votación**: participantes, progreso, listado de opciones, botón volver
- **Votación**: rondas aleatorias, PIN modal para confirmar, tags opcionales con colores/emojis
- **Resultados**: podium top 3, ranking con votos iniciales incluidos
- **Lógica de duplicados**: si alguien sugiere dominio existente, se merge silenciosamente incrementando `initial_votes`
- **Bloqueo de sugerencias**: cuando 8+ participantes, se cierra la fase de sugerencias
- **Navbar**: usuario + logout en pre-votacion y dashboard
- **Componentes UI**: GlowCard, DomainBadge (multi-extensión), ProgressBar, Podium
- **Build limpio** ✅

### ⏳ Pendiente
- **Transición automática de fase** — actualmente se cambia `app_config.phase` en Supabase manualmente
- **Deploy a Vercel** — cuando esté listo

## Reglas del negocio
- Extensiones flexibles: `.mx`, `.com.mx`, `.org.mx`, `.net.mx`, `.lat`, `.com`, `.org`, `.dev`, `.io`
- 5+ sugerencias por usuario (mínimo 5, sin máximo)
- 5 puntos por ronda, max 3 por opción
- Tags opcionales: "Suena chido" 🔥, "Sencillo" ✨, "Práctico" ⚡
- Mínimo 8 participantes para habilitar votación
- Duplicados permitidos: merge silencioso, votos iniciales suman al total
- Sin auth tradicional — username único + PIN en localStorage
- Sesión expira en 12 horas
- Fase controlada por `app_config.phase`: `suggestions` → `voting` → `closed`

## Archivos clave
- `src/lib/session.ts` — gestión de sesión con expiración
- `src/lib/types.ts` — tipos + TAG_CONFIG con colores/emojis
- `src/lib/supabase.ts` — cliente Supabase singleton
- `src/app/api/auth/route.ts` — API PIN (register/login/verify)
- `src/app/api/suggestions/route.ts` — GET lista + POST merge duplicados
- `src/app/api/check-domain/route.ts` — duplicate check silencioso
- `src/app/api/votes/route.ts` — votación con verificación PIN
- `src/app/api/results/route.ts` — resultados con initial_votes

## SQL de setup
```sql
ALTER TABLE users ADD COLUMN pin_hash TEXT;
ALTER TABLE suggestions ADD COLUMN initial_votes INTEGER DEFAULT 1;
```

## Componentes UI
| Componente | Archivo | Uso |
|:-----------|:--------|:----|
| GlowCard | `src/components/ui/glow-card.tsx` | Card glassmorphism con hover glow |
| DomainBadge | `src/components/ui/domain-badge.tsx` | Badge de dominio con extensiones dinámicas |
| ProgressBar | `src/components/ui/progress-bar.tsx` | Barra animada con gradiente |
| Podium | `src/components/ui/podium.tsx` | Top 3 con medallas para resultados |
