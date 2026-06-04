# Seguimiento de Diferencias — Guías 0.1 y 0.2

## Guía 0.1 — Diferencias detectadas

| # | Parte | Bloque | Archivo | Diferencia | Estado |
|:-:|:------|:-------|:--------|:-----------|:-------|
| 1 | Parte 3 | Bloque 10 | `src/app/layout.tsx` | Importación adicional: `import "@/styles/imperial.css";` — no documentada en la guía | Pendiente de verificar en qué guía se agregó |

## Guía 0.2 — Diferencias detectadas

| # | Parte | Bloque | Archivo | Diferencia | Estado |
|:-:|:------|:-------|:--------|:-----------|:-------|
| 2 | Parte 4 | Bloque 2 | `src/lib/stores/auth-store.ts` | Ya fue modificado por Guía 0.3: importa `Usuario` desde `@/types/auth`, acciones `setAuth`/`clearAuth` en vez de `setUsuario`/`clearUsuario`, key localStorage `tc-auth-storage` en vez de `erp-auth-storage` | ⏳ Pendiente de verificar en qué guía se cambió |
| 3 | Parte 5 | Bloque 1 | `src/app/page.tsx` | Completamente reemplazado por Guía 0.3: redirector Zero-Trust en vez de página de verificación con demos | ⏳ Pendiente de verificar en qué guía se cambió |
| 4 | Parte 2 | Bloque 3 | `src/lib/supabase/proxy.ts` | Retorna `{ supabaseResponse, user }` en vez de solo `supabaseResponse` | ⏳ Pendiente de verificar en qué guía se cambió |

## Notas

- **Guía 0.1:** 97% de coincidencia. Solo falta importación en `layout.tsx`
- **Guía 0.2:** 85% de coincidencia. Las diferencias en `auth-store.ts` y `page.tsx` son porque la Guía 0.3 ya fue implementada
- Los archivos de Supabase (`client.ts`, `server.ts`, `proxy.ts`) coinciden funcionalmente
- Los archivos de utilidades (`validators.ts`, `calculations.ts`, `formatters.ts`, `dates.ts`) coinciden
- No se modificaron archivos reales ni guías — se documentan las diferencias para referencia

## Guía 0.5 — Diferencias detectadas

| # | Parte | Bloque | Archivo | Diferencia | Estado |
|:-:|:------|:-------|:--------|:-----------|:-------|
| 5 | Parte 5 | Bloque 3 | `src/app/dashboard/page.tsx` | La guía dice "página de bienvenida con datos del usuario", pero el archivo real es una landing page con scroll-storytelling (Guía 0.6+) | ⏳ Pendiente de verificar — probablemente reemplazado por Guía 0.6 |
| 6 | — | — | `src/app/dashboard/plan/` | Directorio adicional no documentado en la Guía 0.5 | ⏳ Pendiente de verificar en qué guía se agregó |

### Archivos que SÍ coinciden (14 archivos):
- `src/lib/supabase/server.ts` ✅
- `src/lib/supabase/proxy.ts` ✅
- `src/proxy.ts` ✅
- `src/types/auth.ts` ✅
- `src/lib/stores/auth-store.ts` ✅
- `src/lib/actions/auth.ts` ✅
- `src/lib/validations/password.ts` ✅
- `src/components/auth/BrandPanel.tsx` ✅
- `src/components/auth/PasswordRequirements.tsx` ✅
- `src/components/auth/LoginForm.tsx` ✅
- `src/app/login/page.tsx` ✅
- `src/components/auth/AuthWrapper.tsx` ✅
- `src/app/dashboard/layout.tsx` ✅
- `src/components/auth/index.ts` ✅

---

## Guía 0.6 — Diferencias detectadas

### Archivos que SÍ coinciden (23 archivos):
- `src/hooks/useScrollLanding.ts` ✅
- `src/components/layout/Navbar.tsx` ✅
- `src/components/layout/SessionStatus.tsx` ✅
- `src/components/layout/ThemeToggle.tsx` ✅
- `src/components/layout/ScrollNav.tsx` ✅
- `src/components/layout/Footer.tsx` ✅
- `src/components/layout/index.ts` ✅
- `src/components/landing/HeroSection.tsx` ✅
- `src/components/landing/DiagnosticoSection.tsx` ✅
- `src/components/landing/VisionSection.tsx` ✅
- `src/components/landing/IdentidadSection.tsx` ✅
- `src/components/landing/MarketingSection.tsx` ✅
- `src/components/landing/OperacionSection.tsx` ✅
- `src/components/landing/CtaSection.tsx` ✅
- `src/components/landing/ExpedienteSection.tsx` ✅
- `src/components/landing/index.ts` ✅
- `src/app/dashboard/plan/vision/page.tsx` ✅
- `src/app/dashboard/plan/expediente/page.tsx` ✅
- `src/app/dashboard/plan/diagnostico/page.tsx` ✅
- `src/app/dashboard/plan/identidad/page.tsx` ✅
- `src/app/dashboard/plan/marketing/page.tsx` ✅
- `src/app/dashboard/plan/operacion/page.tsx` ✅
- `src/app/dashboard/plan/cotizaciones/page.tsx` ✅
- `src/app/dashboard/page.tsx` ✅

### Diferencias menores:
| # | Archivo | Diferencia | Estado |
|:-:|:--------|:-----------|:-------|
| 7 | `src/components/layout/nav/` | Directorio adicional no documentado en la guía | ⏳ Pendiente de verificar |

---

> **Última actualización:** 27 Mayo 2026
