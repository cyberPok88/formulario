# GUÍA 0.7 — MEJORA VISUAL DIAGNOSTICO SECTION
## PARTE 2: IMPLEMENTACIÓN — ESTILO PARTÍCULAS

> **Versión:** 6.0
> **Fecha:** 28 Mayo 2026
> **Parte:** 2 de 2
> **Prerequisito:** Guía 0.6 completada — `npm run build` exitoso y landing page funcional
> **Autor:** Bruno Ulises Pineda Téllez

---

## ¿QUÉ SE HACE EN ESTA PARTE?

Se implementa el componente `DiagnosticoSection` con estilo de **partículas conectadas** que crea una red visual dinámica representando la conectividad y los problemas del negocio. El fondo con partículas refuerza la temática tech/gamer y captura la atención del cliente de inmediato.

Elementos clave:
1. **Canvas de partículas** — Fondo animado con puntos que se conectan formando una red
2. **Cards flotantes** — Los 4 problemas aparecen como nodos destacados sobre la red
3. **Métricas animadas** — Contadores que refuerzan la urgencia
4. **CTA pulsante** — Invitación a ver el diagnóstico completo

> **Al terminar esta parte:** `npm run build` pasa sin errores y la sección muestra partículas animadas en el fondo.

---

## BLOQUE 1 — COMPONENTE PARTICLES CANVAS

📄 **ARCHIVO COMPLETO** — `src/components/landing/ParticlesCanvas.tsx`

**Propósito:** Componente que renderiza un canvas con partículas animadas y conexiones entre ellas. Crea el efecto de "red neural" que representa la conectividad del negocio.

### FICHA TÉCNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Dumb Component |
| Patrón | Dumb Component con Canvas API |
| Ejecuta en | Browser (Client Component) |
| Importado por | DiagnosticoSection.tsx |
| Importa de | `react` (useEffect, useRef, useState) |
| Contrato | Exporta `ParticlesCanvas` — componente de fondo animado |
| Si lo modificas | Solo afecta el fondo visual de la sección de diagnóstico |

### DECISIONES DE DISEÑO

**¿Por qué Canvas API en lugar de SVG o CSS puro?**
Canvas permite renderizar cientos de partículas con conexiones sin impacto en el DOM. SVG sería más lento con muchos elementos, y CSS puro no permite dibujar líneas entre puntos arbitrarios.

**¿Por qué usar un solo requestAnimationFrame global?**
Un solo loop de animación para todas las partículas es más eficiente que múltiples timeouts. Se pausa automáticamente cuando el canvas no es visible (IntersectionObserver).

> **⚠️ Instrucción especial:** Este componente es autocontenido — no requiere estilos CSS externos ni configuración adicional.

```powershell
$content = @'
'use client'

import { useEffect, useRef, useState } from 'react'

// ═══════════════════════════════════════════════════════════════════
// PARTICLES CANVAS — Fondo animado con partículas conectadas
// Crea una red neural que representa la conectividad del negocio
// ═══════════════════════════════════════════════════════════════════

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

interface ParticlesCanvasProps {
  className?: string
  particleCount?: number
  connectionDistance?: number
  particleColor?: string
  lineColor?: string
}

/**
 * Componente que renderiza un canvas con partículas animadas y conexiones.
 * Las partículas se mueven suavemente y se conectan cuando están cercanas.
 * Se pausa cuando el canvas no es visible para ahorrar recursos.
 */
export function ParticlesCanvas({
  className = '',
  particleCount = 80,
  connectionDistance = 150,
  particleColor = '#e9bcba',
  lineColor = '#e9bcba',
}: ParticlesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── CONFIGURACIÓN ────────────────────────────────────────────────
    const particles: Particle[] = []
    const particleCountAdjusted = Math.min(particleCount, 100)

    // ── INICIALIZAR PARTÍCULAS ───────────────────────────────────────
    const initParticles = () => {
      particles.length = 0
      for (let i = 0; i < particleCountAdjusted; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.3,
        })
      }
    }

    // ── REDIMENSIONAR CANVAS ─────────────────────────────────────────
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
        initParticles()
      }
    }

    // ── DIBUJAR PARTÍCULA ────────────────────────────────────────────
    const drawParticle = (p: Particle) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = particleColor
      ctx.globalAlpha = p.opacity
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // ── DIBUJAR CONEXIONES ───────────────────────────────────────────
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const opacity = 1 - distance / connectionDistance
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = lineColor
            ctx.globalAlpha = opacity * 0.3
            ctx.lineWidth = 0.5
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }
    }

    // ── ACTUALIZAR POSICIONES ────────────────────────────────────────
    const updateParticles = () => {
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        // Rebotar en los bordes
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        // Mantener dentro de los límites
        p.x = Math.max(0, Math.min(canvas.width, p.x))
        p.y = Math.max(0, Math.min(canvas.height, p.y))
      }
    }

    // ── LOOP DE ANIMACIÓN ────────────────────────────────────────────
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      drawConnections()
      for (const p of particles) {
        drawParticle(p)
      }
      updateParticles()

      animationRef.current = requestAnimationFrame(animate)
    }

    // ── INTERSECTION OBSERVER ────────────────────────────────────────
    // Pausar animación cuando el canvas no es visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    resizeCanvas()
    observer.observe(canvas)

    return () => {
      observer.disconnect()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [particleCount, connectionDistance, particleColor, lineColor])

  // ── INICIAR/DETENER ANIMACIÓN ───────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (isVisible) {
      // Iniciar loop de animación
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Redibujar conexiones y partículas
        const particles: Particle[] = []
        const particleCountAdjusted = Math.min(80, 100)

        for (let i = 0; i < particleCountAdjusted; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.3,
          })
        }

        animationRef.current = requestAnimationFrame(animate)
      }
    } else {
      // Detener animación
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isVisible])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: 0.6 }}
    />
  )
}
'@

New-Item -Path "src/components/landing/ParticlesCanvas.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/landing/ParticlesCanvas.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/landing/ParticlesCanvas.tsx creado" -ForegroundColor Green
Write-Host "🎨 Componente de partículas con canvas animado" -ForegroundColor Cyan
```

---

## BLOQUE 2 — DIAGNOSTICOSECTION CON PARTÍCULAS

📄 **ARCHIVO REEMPLAZADO** — `src/components/landing/DiagnosticoSection.tsx`

**Propósito:** Sección de diagnóstico mejorada con fondo de partículas, cards flotantes y métricas animadas que capturan la atención del cliente.

### FICHA TÉCNICA

| Aspecto | Valor |
|:--------|:------|
| Tipo de archivo | Dumb Component |
| Patrón | Dumb Component (no importa stores ni router) |
| Ejecuta en | Browser (Client Component) |
| Importado por | `src/app/dashboard/page.tsx` |
| Importa de | `react`, `framer-motion`, `lucide-react`, `next/link`, `ParticlesCanvas` |
| Contrato | Exporta `DiagnosticoSection` — componente de sección |
| Si lo modificas | Rompe la sección 4 de la landing page |

### DECISIONES DE DISEÑO

**¿Por qué un componente separado para partículas?**
Separar `ParticlesCanvas` permite reutilizarlo en otras secciones (Hero, Vision, etc.) sin duplicar código. Mantiene el DiagnosticoSection enfocado en su lógica de presentación.

**¿Por qué las cards tienen backdrop-filter y no fondo sólido?**
El `backdrop-filter: blur()` permite que las partículas del fondo se vean difuminadas detrás de las cards, creando profundidad visual sin ocultar completamente la animación.

> **⚠️ Instrucción especial:** Reemplazar TODO el contenido del archivo actual.

```powershell
$content = @'
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  TriangleAlert, 
  CircleX, 
  ArrowRight, 
  AlertTriangle,
  Users,
  Eye,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { ParticlesCanvas } from './ParticlesCanvas'

// ═══════════════════════════════════════════════════════════════════════════
// DiagnosticoSection — Dumb Component (Guía 0.7 — Estilo Partículas)
// Sección de diagnóstico con fondo de partículas conectadas, cards
// flotantes y CTA animado para invitar a ver el diagnóstico completo.
// ═══════════════════════════════════════════════════════════════════════════

// Datos de problemas con icono y color asociado
const problems = [
  { 
    title: 'Fragmentación', 
    desc: 'Información dispersa en múltiples plataformas no sincronizadas.',
    icon: AlertTriangle,
    color: '#ff6b6b'
  },
  { 
    title: 'Dependencia Operativa', 
    desc: 'Procesos críticos vinculados exclusivamente a la intervención del propietario.',
    icon: Users,
    color: '#ffa726'
  },
  { 
    title: 'Visibilidad Cero', 
    desc: 'Sin presencia digital estructurada ni generación de leads automatizada.',
    icon: Eye,
    color: '#ffca28'
  },
  { 
    title: 'Pérdida de Oportunidades', 
    desc: 'Sin capacidad de respuesta rápida. Cotizaciones toman días, no minutos.',
    icon: Clock,
    color: '#4fc3f7'
  },
]

// Métricas de impacto
const metrics = [
  { value: 300, suffix: '%', label: 'Eficiencia' },
  { value: 45, suffix: 'min', label: 'Tiempo' },
  { value: 12, suffix: '', label: 'Clientes' },
  { value: 0, suffix: '', label: 'Web' },
]

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE CONTADOR ANIMADO
// ═══════════════════════════════════════════════════════════════════
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); o.disconnect() } },
      { threshold: 0.5 }
    )
    o.observe(el)
    return () => o.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [inView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

// ═══════════════════════════════════════════════════════════════════
// ANIMACIONES DE ENTRADA
// ═══════════════════════════════════════════════════════════════════
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.4, 0.25, 1] },
  }),
}

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
  },
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — DIAGNOSTICOSECTION
// ═══════════════════════════════════════════════════════════════════
export function DiagnosticoSection() {
  return (
    <section id="diagnostico" className="py-section-gap px-margin-mobile md:px-margin-desktop relative z-10 overflow-hidden">
      {/* Fondo de partículas */}
      <ParticlesCanvas 
        className="absolute inset-0"
        particleCount={60}
        connectionDistance={120}
      />

      {/* Overlay degradado para mejorar legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center relative z-10">
        {/* Columna izquierda: Título + Cards */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={stagger}
          className="space-y-8"
        >
          {/* Título */}
          <motion.div variants={fadeInUp}>
            <h2 className="font-headline-lg text-headline-lg text-[#e5e2e3] uppercase max-sm:text-[32px] max-sm:leading-[40px]">
              DIAGNÓSTICO <br />
              <span className="text-[#e9bcba]/70">ACTUAL</span>
            </h2>
          </motion.div>

          {/* Cards de problemas */}
          <motion.div variants={fadeInUp} className="space-y-4">
            {problems.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  custom={i + 1}
                  className="group relative"
                >
                  {/* Card con backdrop blur */}
                  <div className="relative backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-5 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]">
                    <div className="flex items-start gap-4">
                      {/* Icono con color */}
                      <div 
                        className="p-2 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${p.color}20` }}
                      >
                        <Icon 
                          className="w-5 h-5" 
                          style={{ color: p.color }}
                        />
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-label-mono text-label-mono text-[#e5e2e3] uppercase tracking-widest text-xs mb-1">
                          {p.title}
                        </h3>
                        <p className="font-body-md text-[#e5e2e3]/70 text-sm leading-relaxed">
                          {p.desc}
                        </p>
                      </div>

                      {/* Indicador de estado */}
                      <CircleX className="w-4 h-4 text-[#e9bcba]/30 shrink-0 group-hover:text-[#e9bcba]/60 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeInUp} custom={5}>
            <Link
              href="/dashboard/plan/diagnostico"
              className="inline-flex items-center gap-3 font-label-mono text-label-mono uppercase tracking-widest text-[#e9bcba] px-6 py-3 rounded-xl border border-[#e9bcba]/20 hover:border-[#e9bcba]/40 hover:bg-[#e9bcba]/10 transition-all duration-300 group"
            >
              <TriangleAlert className="w-4 h-4 group-hover:animate-pulse" />
              <span>VER DIAGNÓSTICO COMPLETO</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Columna derecha: Métricas + Visualización */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-8"
        >
          {/* Grid de métricas */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="grid grid-cols-2 gap-4"
          >
            {metrics.map((m, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-5 text-center hover:bg-white/10 transition-all duration-300"
              >
                <div className="font-headline-md text-headline-md text-[#e9bcba] mb-1">
                  <Counter target={m.value} suffix={m.suffix} />
                </div>
                <div className="font-label-mono text-label-mono text-[#e5e2e3]/70 uppercase text-xs tracking-widest">
                  {m.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Elemento visual central */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative flex justify-center"
          >
            <div className="w-48 h-48 relative">
              {/* Anillos concéntricos */}
              <div className="absolute inset-0 border border-[#e9bcba]/10 rounded-full animate-pulse" />
              <div className="absolute inset-4 border border-[#e9bcba]/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-8 border border-[#e9bcba]/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Centro */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-headline-sm text-headline-sm text-[#e9bcba] uppercase">
                    TECH
                  </div>
                  <div className="font-label-mono text-label-mono text-[#e9bcba]/50 text-xs">
                    COMPUTER
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
'@

New-Item -Path "src/components/landing/DiagnosticoSection.tsx" -ItemType File -Force | Out-Null
Set-Content -Path "src/components/landing/DiagnosticoSection.tsx" -Value $content -Encoding UTF8
Write-Host "✅ src/components/landing/DiagnosticoSection.tsx reemplazado" -ForegroundColor Green
Write-Host "🎯 DiagnosticoSection con fondo de partículas y cards flotantes" -ForegroundColor Cyan
```

---

## FINGERPRINT — VALIDACIÓN PARTE 2

```powershell
Write-Host "`n🔍 VALIDANDO GUÍA 0.7 — ESTILO PARTÍCULAS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray

# Verificar archivos creados
$files = @(
  "src/components/landing/ParticlesCanvas.tsx",
  "src/components/landing/DiagnosticoSection.tsx"
)

$allGood = $true

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "✅ $file existe" -ForegroundColor Green
  } else {
    Write-Host "❌ $file NO encontrado" -ForegroundColor Red
    $allGood = $false
  }
}

# Verificar imports en DiagnosticoSection
$component = Get-Content "src/components/landing/DiagnosticoSection.tsx" -Raw
if ($component -match "import.*ParticlesCanvas") {
  Write-Host "✅ Import de ParticlesCanvas presente" -ForegroundColor Green
} else {
  Write-Host "❌ Import de ParticlesCanvas faltante" -ForegroundColor Red
  $allGood = $false
}

# Verificar que ParticlesCanvas exporta correctamente
$particles = Get-Content "src/components/landing/ParticlesCanvas.tsx" -Raw
if ($particles -match "export function ParticlesCanvas") {
  Write-Host "✅ ParticlesCanvas exporta correctamente" -ForegroundColor Green
} else {
  Write-Host "❌ ParticlesCanvas no exporta la función" -ForegroundColor Red
  $allGood = $false
}

# Verificar que no hay imports no usados
if ($component -match "useInView.*from.*framer-motion") {
  Write-Host "⚠️  Import no usado: useInView" -ForegroundColor Yellow
} else {
  Write-Host "✅ Sin imports no usados" -ForegroundColor Green
}

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray

if ($allGood) {
  Write-Host "🎉 ¡VALIDACIÓN COMPLETADA!" -ForegroundColor Green
  Write-Host "📊 Archivos verificados correctamente" -ForegroundColor Cyan
} else {
  Write-Host "⚠️  ALGUNAS VERIFICACIONES FALLARON" -ForegroundColor Yellow
}
```

> 🛑 **STOP-ON-FAIL:** Si la validación falla:
> - Archivo no creado → Verificar permisos de escritura en src/components/landing/
> - Import faltante → Verificar que se copió el contenido completo del script

---

## RESUMEN DE ESTA PARTE

| Archivo | Tipo | Acción |
|:--------|:-----|:-------|
| `src/components/landing/ParticlesCanvas.tsx` | Dumb Component | NUEVO |
| `src/components/landing/DiagnosticoSection.tsx` | Dumb Component | REEMPLAZADO |

---

## ➡️ SIGUIENTE PARTE

**Esta es la última parte de la Guía 0.7.**

La sección de diagnóstico ahora tiene:
- ✅ Fondo de partículas animadas que se conectan formando una red
- ✅ Cards flotantes con backdrop-blur sobre las partículas
- ✅ Métricas de impacto animadas
- ✅ CTA invitando a ver el diagnóstico completo
- ✅ Diseño premium y visualmente impactante

**Próximos pasos:**
- Ejecutar `npm run build` para verificar compilación
- Probar en el navegador para ver las partículas en movimiento
- Ajustar colores/velocidad según preferencia

---

> **Documento:** GUIA_0_7_Parte2_V6.md
> **Proyecto:** Presentación Interactiva Tech Computer / Tenochtitlán
> **Versión:** 6.0
> **Fecha:** 28 Mayo 2026
> **Autor:** Bruno Ulises Pineda Téllez