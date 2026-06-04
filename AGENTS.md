<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Proyecto: Form (Tenochtitlan)

App de votación para selección de nombre de dominio. Los usuarios registran con username + PIN, sugieren dominios, y votan entre las opciones.

## Stack

- Next.js 16.2.3, React 19, TypeScript, Tailwind CSS 3.4.19
- Supabase (solo DB, sin auth — usernames en localStorage)
- Framer Motion, shadcn/ui, Lucide icons
- Dark mode forzado (`class="dark"` en html)

## Convenciones

- No usar `@latest` en npm — todas las versiones fijas
- Proyecto se llama "form" (no "tenochtitlan")
- Navbar: info del usuario + cerrar sesión
- PIN: 4-6 dígitos numéricos, hasheado con SHA-256
- Extensiones de dominio flexibles: `.mx`, `.com.mx`, `.lat`, `.dev`, `.io`, etc.

## Auth (sin Supabase Auth)

- `src/lib/session.ts` — localStorage con expiración 12h
  - `saveSession()`, `getSession()`, `clearSession()`, `isSessionValid()`
- `src/app/api/auth/route.ts` — API PIN-based
  - `register`: crea usuario o auto-login si PIN coincide
  - `login`: alias de register
  - `verify`: valida PIN contra hash
- Login sin modos separados: username + PIN → crea o valida

## Base de Datos (Supabase)

### Tabla `users`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| username | text | único |
| pin_hash | text | SHA-256 del PIN |
| created_at | timestamp | default now() |

### Tabla `suggestions`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| domain_name | text | dominio completo (ej: `tenoch.mx`) |
| meaning | text | significado/justificación |
| initial_votes | integer | votos iniciales por duplicados (default 1) |
| created_at | timestamp | default now() |

### Tabla `votes`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| suggestion_id | uuid | FK → suggestions |
| points | integer | 1-5 puntos asignados |
| round_number | integer | ronda de votación |
| created_at | timestamp | default now() |

### Tabla `vote_tags`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid | PK |
| vote_id | uuid | FK → votes |
| tag | text | `suena_chido`, `sencillo`, `practico` |

### Tabla `config`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | integer | PK (1) |
| phase | text | `suggestions`, `voting`, `closed` |
| points_per_round | integer | default 5 |
| options_per_page | integer | default 5 |
| updated_at | timestamp | |

### SQL de setup
```sql
ALTER TABLE users ADD COLUMN pin_hash TEXT;
ALTER TABLE suggestions ADD COLUMN initial_votes INTEGER DEFAULT 1;
```

## Lógica de Duplicados (en bambalinas)

- Si un usuario sugiere un dominio que ya existe, **se permite** silenciosamente
- Se incrementa `initial_votes` en el registro existente
- El usuario NO ve indicio de que alguien más lo pensó
- En votación/resultados se muestra "X personas pensaron en esto"
- Esos votos iniciales se suman al total: `total_points = vote_points + initial_votes`

## Fases del Proyecto

1. **Sugerencias** (`phase: "suggestions"`): usuarios agregan dominios (mínimo 5)
2. **Votación** (`phase: "voting"`): mínimo 8 participantes requeridos, usuarios reparten puntos
3. **Cerrada** (`phase: "closed"`): solo resultados

## Rutas / Pages

| Ruta | Descripción |
|------|-------------|
| `/` | Landing/login — COMENZAR + IR A VOTAR (deshabilitado <8) |
| `/sugerir` | Formulario de sugerencias con duplicate checking silencioso |
| `/pre-votacion` | Info antes de votar: participantes, progreso, listado de opciones |
| `/votar` | Votación por rondas con PIN modal para confirmar |
| `/resultados` | Podium + ranking con votos iniciales incluidos |
| `/dashboard` | Panel post-login con estado del proyecto |

## APIs

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/auth` | POST | register/login/verify con PIN |
| `/api/suggestions` | GET | lista sugerencias + stats |
| `/api/suggestions` | POST | envía sugerencias (merge duplicados) |
| `/api/check-domain` | GET | verifica si dominio existe + initial_votes |
| `/api/votes` | POST | registra votos con verificación PIN |
| `/api/results` | GET | resultados con initial_votes en total |
| `/api/config` | GET/POST | fase y configuración |

## Componentes UI

- `GlowCard` — card con efecto glow
- `DomainBadge` — badge de dominio con extensiones dinámicas
- `ProgressBar` — barra de progreso animada
- `Podium` — podium de top 3 en resultados

## Variables de Types

```typescript
// src/lib/types.ts
interface Suggestion {
  id: string;
  user_id: string;
  domain_name: string;
  meaning: string;
  initial_votes: number;  // votos iniciales por duplicados
  created_at: string;
}

type Phase = "suggestions" | "voting" | "closed";

// Tags de votación con colores/emojis
TAG_CONFIG: {
  suena_chido: { emoji: "🔥", color: orange }
  sencillo:    { emoji: "✨", color: emerald }
  practico:    { emoji: "⚡", color: blue }
}
```

## Constantes Importantes

- `MIN_PARTICIPANTS = 8` — mínimo para habilitar votación
- Session expiry: 12 horas
- PIN: 4-6 dígitos
- Sugerencias mínimas: 5 por usuario
- Puntos por ronda: 5
- Máximo por opción: 3 puntos
- Opciones por página (ronda): 5
