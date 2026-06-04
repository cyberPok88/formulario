# Rediseño Visual y Funcional — Votación de Dominio

## Contexto

App de votación interna para colegas de TI del proyecto Tenochtitlan. Decidir el nombre de dominio `.mx` del proyecto. Dos fases: sugerencias y votación por rondas eliminatorias. Proyecto flash — debe verse profesional y dinámico a la primera.

## Stack existente (no cambia)

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS + tokens semánticos de Guía 0.1
- Supabase (sin auth — usernames en localStorage)
- Framer Motion
- 4 rutas: `/`, `/sugerir`, `/votar`, `/resultados`
- 4 API routes: `/api/config`, `/api/suggestions`, `/api/votes`, `/api/results`

---

## 1. Landing (`/`) — Hero + Contexto + Login

### Diseño

Layout vertical centrado con identidad visual fuerte:

1. **Header badge** — Icono del proyecto + "Proyecto Tenochtitlan" + badge `.mx`
2. **Hero** — Título grande "Elige el dominio de nuestro proyecto" con subtítulo motivacional
3. **3 cards de contexto** — Las reglas de la dinámica:
   - Card 1: "Extensión .mx" — Ya pactada por las ventajas de México
   - Card 2: "Nombres cortos" — Representativos del proyecto Tenochtitlan
   - Card 3: "Sé creativo" — Todas las propuestas son válidas
4. **Form de username** — Input + botón "Entrar", integrado en una card con glassmorphism
5. **Pasos de la dinámica** — 4 pasos visuales (los que ya existen pero con mejor diseño)

### Estilo visual

- Gradiente: `from-slate-950 via-indigo-950/50 to-slate-950`
- Glow sutil detrás del hero (blur grande con indigo/blue)
- Cards con bordes `border-white/10` y `backdrop-blur`
- Animaciones escalonadas con framer-motion (cada card aparece con delay)
- Tipografía bold para el hero, `text-transparent bg-clip-text bg-gradient-to-r` para el título

### Comportamiento

- Misma lógica actual: crear/buscar usuario en Supabase, guardar en localStorage, redirigir según fase
- Sin cambios en el API

---

## 2. Sugerencias (`/sugerir`) — Flujo de 2 fases

### Fase A — Captura

Layout: card principal con los 5 campos visibles (scroll vertical, no wizard paso a paso).

Cada sugerencia es un bloque con:
- Número indicador (1-5) con estado: vacío (gris), en progreso (blue pulse), completo (green check)
- Input de dominio con sufijo `.mx` fijo como badge visual (el usuario no lo escribe)
- Textarea de significado/descripción
- Al completar ambos campos, el indicador cambia a check verde

Barra de progreso arriba: "3 de 5 completadas"

Cuando las 5 están llenas → aparece botón "Revisar mis sugerencias" que transiciona a Fase B.

### Fase B — Revisión y edición

Vista de cards tipo resumen:
- Cada card muestra: `nombre.mx` prominente + descripción debajo
- Botón de editar (pencil icon) → inline edit del nombre y descripción
- Botón de eliminar (solo si hay más de 5)
- Botón `+ Agregar otra sugerencia` al final (sin límite máximo pero 5 es el mínimo)
- Botón principal: "Enviar N sugerencias"

### Post-envío — Confirmación con conteo

Pantalla de éxito con:
- Animación de confetti o check animado
- "Tus N sugerencias fueron registradas"
- Conteo en vivo: "Se han recibido X sugerencias de Y participantes"
- Indicador de fase: "Faltan Z participantes para iniciar la votación" o "La votación está lista"
- Botón para ir a resultados parciales o volver al inicio

### Cambios en API

- `GET /api/suggestions` — agregar endpoint que retorne conteo total + conteo de participantes únicos
- `POST /api/suggestions` — permitir más de 5 sugerencias (quitar validación de exactamente 5)

---

## 3. Votación (`/votar`) — Rondas eliminatorias

### Mecánica de rondas

La votación se controla desde `app_config` en Supabase:
- `phase`: `voting_round_1`, `voting_round_2`, `voting_final`
- El admin cambia la fase manualmente (o con un script)

**Ronda 1:** Todas las sugerencias, en batches de 5. El usuario reparte 5 puntos por batch (max 3 por opción). Tags opcionales. Cuando el usuario votó todos los batches → "Ronda 1 completada, espera la siguiente ronda".

**Ronda 2:** Solo las sugerencias que quedaron (top N, decidido por el admin). Misma mecánica.

**Ronda Final:** Las últimas 2-3 opciones. Votación simple: elige tu favorita (1 voto). Sin puntos distribuidos.

### Diseño visual

- Header con: badge de ronda actual, opciones restantes en esta ronda, barra de progreso
- Cards de opciones más grandes y vistosas: nombre del dominio en tipografía grande, descripción debajo
- Controles de puntos: botones +/- con contador animado en el centro
- Tags como pills seleccionables debajo de cada card (solo si tiene puntos asignados)
- Footer sticky con: puntos restantes (número grande) + botón de enviar

### Transiciones entre rondas

- Pantalla intermedia: "Ronda X completada"
- Preview de resultados parciales: top 5 con puntos
- Lista de eliminadas con tachado sutil
- Timer o mensaje "La siguiente ronda inicia cuando el admin la active"

### Cambios en API

- `GET /api/config` — retornar la ronda actual
- `POST /api/votes` — aceptar `round_number` dinámico
- `GET /api/results` — filtrar por ronda si se pasa como query param

---

## 4. Resultados (`/resultados`) — Podio + Ranking

### Diseño

1. **Podio visual** (top 3):
   - 3 columnas: plata (2do, izq), oro (1ro, centro, más alto), bronce (3ro, der)
   - Cada posición con medalla emoji/icono, nombre del dominio, puntos
   - Animación de entrada escalonada

2. **Ranking completo** (debajo del podio):
   - Lista ordenada por puntos
   - Cada fila: posición, nombre, descripción, puntos, votos, barras de progreso
   - Tags acumulados como pills con conteo
   - Barras con gradiente blue→indigo

3. **Stats generales**:
   - Total de participantes
   - Total de sugerencias
   - Total de votos emitidos

### Cambios en API

- `GET /api/results` — agregar stats generales (participantes, total sugerencias, total votos)

---

## 5. Componentes compartidos nuevos

| Componente | Propósito |
|:-----------|:----------|
| `GlowCard` | Card con glassmorphism + borde sutil + hover glow — reemplaza las cards actuales |
| `ProgressBar` | Barra de progreso animada con gradiente — reutilizable en sugerencias y resultados |
| `StepIndicator` | Indicador de paso (vacío/activo/completo) con animación |
| `Podium` | Componente del podio de 3 posiciones para resultados |
| `DomainBadge` | Muestra `nombre.mx` con estilo de badge/chip prominente |

Estos van en `src/components/ui/` junto a los existentes (button, input, label).

---

## 6. Esquema de colores y estilo

- **Primario:** Gradientes indigo/blue (ya presente en el sistema de tokens)
- **Fondo:** Slate-950 con tintes de indigo (más rico que el actual slate-900 plano)
- **Cards:** Glassmorphism — `bg-white/5 backdrop-blur border-white/10`
- **Acentos:** Green para éxito/completado, amber para warnings, blue para interacciones
- **Tipografía:** Plus Jakarta Sans (ya configurada en layout.tsx) — bold para títulos, medium para body
- **Animaciones:** Framer Motion para todas las transiciones — stagger en listas, spring en contadores

---

## Fuera de scope

- Autenticación real (se queda con localStorage)
- Panel admin para cambiar fases (se hace directo en Supabase)
- Notificaciones push
- Responsive perfecto para móvil (se ve bien pero desktop es la prioridad)
