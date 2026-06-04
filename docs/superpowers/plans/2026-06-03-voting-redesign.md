# Voting App Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the domain voting app with a visually impressive UI for IT colleagues, add a 2-phase suggestion flow with review/edit, and implement multi-round elimination voting.

**Architecture:** Rewrite the 4 existing pages in-place. Extract shared visual patterns into small reusable components in `src/components/ui/`. Extend 2 API routes (`/api/suggestions` GET for stats, `/api/results` GET for stats). All styling uses existing Tailwind tokens + Framer Motion. The dark theme from globals.css `.dark` selector provides the visual base — the app forces dark mode.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 3 (semantic tokens), Framer Motion, Supabase JS, Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-06-03-voting-redesign.md`

---

## File Map

### New files
| File | Responsibility |
|:-----|:---------------|
| `src/components/ui/glow-card.tsx` | Glassmorphism card with border glow and hover effect |
| `src/components/ui/domain-badge.tsx` | Displays `name.mx` as a styled badge/chip |
| `src/components/ui/progress-bar.tsx` | Animated gradient progress bar |
| `src/components/ui/podium.tsx` | Top-3 podium display for results page |

### Modified files
| File | What changes |
|:-----|:-------------|
| `src/app/page.tsx` | Full rewrite — hero + context cards + login form |
| `src/app/sugerir/page.tsx` | Full rewrite — 2-phase flow (capture → review → confirm) |
| `src/app/votar/page.tsx` | Visual upgrade — better cards, sticky footer, round headers |
| `src/app/resultados/page.tsx` | Add podium, stats bar, upgrade card design |
| `src/app/api/suggestions/route.ts` | Add stats to GET response, allow >= 5 suggestions in POST |
| `src/app/api/results/route.ts` | Add aggregate stats (participants, total suggestions, total votes) |
| `src/app/globals.css` | Add dark-mode-only body class to force dark theme |
| `src/app/layout.tsx` | Force dark class on html element |

---

## Task 1: Force dark mode + layout prep

**Files:**
- Modify: `src/app/layout.tsx`

### Steps

- [ ] **Step 1: Force dark mode on html element**

The app is designed dark-only. Force `class="dark"` on the html element and remove ThemeProvider since we don't need theme switching for this project.

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: {
        template: "%s | Proyecto Tenochtitlan",
        default: "Votación de Dominio — Proyecto Tenochtitlan",
    },
    description: "Elige el mejor dominio .mx para nuestro proyecto",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`dark ${jakarta.variable}`}>
            <body className="antialiased font-sans bg-background text-foreground min-h-screen">
                {children}
            </body>
        </html>
    );
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit`
Expected: PASS (ThemeProvider import removed, no more dependency)

- [ ] **Step 3: Commit**

```
git add src/app/layout.tsx
git commit -m "feat: force dark mode, remove ThemeProvider for voting app"
```

---

## Task 2: Shared UI components

**Files:**
- Create: `src/components/ui/glow-card.tsx`
- Create: `src/components/ui/domain-badge.tsx`
- Create: `src/components/ui/progress-bar.tsx`
- Create: `src/components/ui/podium.tsx`

### Steps

- [ ] **Step 1: Create GlowCard**

```tsx
// src/components/ui/glow-card.tsx
import { cn } from "@/lib/utils"

interface GlowCardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
}

export function GlowCard({ children, className, hover = true }: GlowCardProps) {
    return (
        <div className={cn(
            "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6",
            hover && "transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:shadow-premium-md",
            className
        )}>
            {children}
        </div>
    )
}
```

- [ ] **Step 2: Create DomainBadge**

```tsx
// src/components/ui/domain-badge.tsx
import { cn } from "@/lib/utils"

interface DomainBadgeProps {
    name: string
    size?: "sm" | "md" | "lg"
    className?: string
}

export function DomainBadge({ name, size = "md", className }: DomainBadgeProps) {
    const sizes = {
        sm: "text-sm px-3 py-1",
        md: "text-base px-4 py-1.5",
        lg: "text-lg px-5 py-2 font-semibold",
    }
    const clean = name.replace(/\.mx$/i, "")
    return (
        <span className={cn(
            "inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-300 font-mono tracking-wide",
            sizes[size],
            className
        )}>
            {clean}<span className="text-blue-500">.mx</span>
        </span>
    )
}
```

- [ ] **Step 3: Create ProgressBar**

```tsx
// src/components/ui/progress-bar.tsx
"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
    value: number
    max: number
    className?: string
    color?: "blue" | "green" | "amber"
}

export function ProgressBar({ value, max, className, color = "blue" }: ProgressBarProps) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    const gradients = {
        blue: "from-blue-500 to-indigo-500",
        green: "from-emerald-500 to-teal-500",
        amber: "from-amber-500 to-orange-500",
    }
    return (
        <div className={cn("h-2 bg-white/10 rounded-full overflow-hidden", className)}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("h-full rounded-full bg-gradient-to-r", gradients[color])}
            />
        </div>
    )
}
```

- [ ] **Step 4: Create Podium**

```tsx
// src/components/ui/podium.tsx
"use client"

import { motion } from "framer-motion"
import { DomainBadge } from "./domain-badge"

interface PodiumEntry {
    domain_name: string
    meaning: string
    total_points: number
}

interface PodiumProps {
    top3: PodiumEntry[]
}

export function Podium({ top3 }: PodiumProps) {
    if (top3.length < 2) return null

    const medals = ["🥇", "🥈", "🥉"]
    const heights = ["h-36", "h-28", "h-24"]
    const order = top3.length >= 3 ? [1, 0, 2] : [1, 0]
    const delays = [0.3, 0.1, 0.5]

    return (
        <div className="flex items-end justify-center gap-4 py-8">
            {order.map((idx) => {
                const entry = top3[idx]
                if (!entry) return null
                return (
                    <motion.div
                        key={idx}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: delays[idx], duration: 0.5, type: "spring" }}
                        className="flex flex-col items-center gap-3 flex-1 max-w-[200px]"
                    >
                        <span className="text-3xl">{medals[idx]}</span>
                        <DomainBadge name={entry.domain_name} size={idx === 0 ? "lg" : "sm"} />
                        <p className="text-xs text-slate-400 text-center line-clamp-2">{entry.meaning}</p>
                        <div className={`w-full ${heights[idx]} rounded-t-xl bg-gradient-to-t ${
                            idx === 0 ? "from-amber-500/20 to-amber-400/5 border-amber-400/30" :
                            idx === 1 ? "from-slate-400/20 to-slate-400/5 border-slate-400/30" :
                            "from-orange-600/20 to-orange-600/5 border-orange-600/30"
                        } border border-b-0 flex items-center justify-center`}>
                            <span className="text-2xl font-bold text-white">{entry.total_points}pts</span>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
```

- [ ] **Step 5: Verify build**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```
git add src/components/ui/glow-card.tsx src/components/ui/domain-badge.tsx src/components/ui/progress-bar.tsx src/components/ui/podium.tsx
git commit -m "feat: add shared UI components (GlowCard, DomainBadge, ProgressBar, Podium)"
```

---

## Task 3: API updates

**Files:**
- Modify: `src/app/api/suggestions/route.ts`
- Modify: `src/app/api/results/route.ts`

### Steps

- [ ] **Step 1: Update suggestions GET to include stats, POST to allow >= 5**

```ts
// src/app/api/suggestions/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data: suggestions, error } = await supabase
    .from("suggestions")
    .select("id, user_id, domain_name, meaning, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uniqueUsers = new Set(suggestions.map((s) => s.user_id));

  return NextResponse.json({
    suggestions,
    stats: {
      total_suggestions: suggestions.length,
      total_participants: uniqueUsers.size,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, suggestions } = body as {
    user_id: string;
    suggestions: { domain_name: string; meaning: string }[];
  };

  if (!user_id || !suggestions || suggestions.length < 5) {
    return NextResponse.json(
      { error: "Se requieren al menos 5 sugerencias" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("suggestions")
    .select("id")
    .eq("user_id", user_id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Ya enviaste tus sugerencias" },
      { status: 409 }
    );
  }

  const rows = suggestions.map((s) => ({
    user_id,
    domain_name: s.domain_name.trim().toLowerCase(),
    meaning: s.meaning.trim(),
  }));

  const { data, error } = await supabase
    .from("suggestions")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Update results GET to include aggregate stats**

```ts
// src/app/api/results/route.ts
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: suggestions, error: sugError } = await supabase
    .from("suggestions")
    .select("id, domain_name, meaning, user_id");

  if (sugError) {
    return NextResponse.json({ error: sugError.message }, { status: 500 });
  }

  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("suggestion_id, points, user_id, vote_tags(tag)");

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  const results = suggestions.map((s) => {
    const suggestionVotes = votes.filter((v) => v.suggestion_id === s.id);
    const totalPoints = suggestionVotes.reduce((sum, v) => sum + v.points, 0);
    const voteCount = suggestionVotes.length;

    const tagCounts: Record<string, number> = {};
    for (const v of suggestionVotes) {
      const tags = v.vote_tags as { tag: string }[];
      for (const t of tags) {
        tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
      }
    }

    return {
      id: s.id,
      domain_name: s.domain_name,
      meaning: s.meaning,
      total_points: totalPoints,
      vote_count: voteCount,
      tag_counts: tagCounts,
    };
  });

  results.sort((a, b) => b.total_points - a.total_points);

  const uniqueSuggesters = new Set(suggestions.map((s) => s.user_id));
  const uniqueVoters = new Set(votes.map((v) => v.user_id));

  return NextResponse.json({
    results,
    stats: {
      total_suggestions: suggestions.length,
      total_participants: uniqueSuggesters.size,
      total_voters: uniqueVoters.size,
      total_votes: votes.length,
    },
  });
}
```

- [ ] **Step 3: Commit**

```
git add src/app/api/suggestions/route.ts src/app/api/results/route.ts
git commit -m "feat: add stats to suggestions and results APIs, allow 5+ suggestions"
```

---

## Task 4: Landing page redesign (`/`)

**Files:**
- Modify: `src/app/page.tsx`

### Steps

- [ ] **Step 1: Rewrite landing page**

Full rewrite of `src/app/page.tsx` with:
- Hero with gradient text title
- 3 context cards (extension .mx, nombres cortos, creatividad)
- Username form with glassmorphism card
- Animated steps of the dynamic
- Ambient glow effects in background

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Globe, Sparkles, Type, ArrowRight, Loader2 } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";

const RULES = [
  {
    icon: Globe,
    title: "Extensión .mx",
    desc: "Ya pactada. Ventajas de presencia en México — confianza, identidad, disponibilidad.",
    color: "text-blue-400",
  },
  {
    icon: Type,
    title: "Nombres cortos",
    desc: "Representativos del proyecto Tenochtitlan. Fáciles de recordar y escribir.",
    color: "text-emerald-400",
  },
  {
    icon: Sparkles,
    title: "Sé creativo",
    desc: "Todas las propuestas son válidas. Juega con náhuatl, tech, siglas, lo que se te ocurra.",
    color: "text-amber-400",
  },
];

const PASOS = [
  { num: "01", titulo: "Identifícate", desc: "Ingresa tu nombre de usuario" },
  { num: "02", titulo: "Sugiere 5+ dominios", desc: "Con su significado o interpretación" },
  { num: "03", titulo: "Vota por rondas", desc: "Reparte puntos entre tus favoritos" },
  { num: "04", titulo: "Resultado final", desc: "El dominio con más votos gana" },
];

export default function Home() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmed = username.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) {
      setError("El usuario debe tener al menos 2 caracteres");
      setLoading(false);
      return;
    }

    try {
      let { data: user } = await supabase
        .from("users")
        .select("id, username")
        .eq("username", trimmed)
        .maybeSingle();

      if (!user) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ username: trimmed })
          .select("id, username")
          .single();

        if (insertError) {
          setError("No se pudo crear el usuario. Intenta otro nombre.");
          setLoading(false);
          return;
        }
        user = newUser;
      }

      localStorage.setItem("vote_user", JSON.stringify(user));

      const res = await fetch("/api/config");
      const config = await res.json();

      if (config.phase === "suggestions") {
        const { data: existing } = await supabase
          .from("suggestions")
          .select("id")
          .eq("user_id", user!.id)
          .limit(1);

        if (existing && existing.length > 0) {
          setError("Ya enviaste tus sugerencias. Espera la fase de votación.");
          setLoading(false);
          return;
        }
        router.push("/sugerir");
      } else if (config.phase === "voting") {
        router.push("/votar");
      } else {
        router.push("/resultados");
      }
    } catch {
      setError("Error de conexión. Verifica tu red e intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Header badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-300">Proyecto Tenochtitlan</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">.mx</span>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Elige el dominio de
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              nuestro proyecto
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Sugiere, vota y decide — entre todos elegimos el nombre que nos representará.
          </p>
        </motion.div>

        {/* Rules cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {RULES.map((rule, i) => (
            <motion.div
              key={rule.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <GlowCard className="h-full">
                <rule.icon className={`w-8 h-8 ${rule.color} mb-3`} />
                <h3 className="text-white font-semibold mb-1">{rule.title}</h3>
                <p className="text-sm text-slate-400">{rule.desc}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>

        {/* Login form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-md mx-auto"
        >
          <GlowCard hover={false} className="p-8">
            <h2 className="text-xl font-semibold text-white mb-1">¿Cómo te llamas?</h2>
            <p className="text-sm text-slate-400 mb-6">
              Usa el mismo usuario cada vez que entres.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: juan_dev"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
                ) : (
                  <>Entrar <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm mt-3 text-center"
              >
                {error}
              </motion.p>
            )}
          </GlowCard>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16"
        >
          <h3 className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-6">
            Cómo funciona
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {PASOS.map((paso, i) => (
              <motion.div
                key={paso.num}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center"
              >
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600">
                  {paso.num}
                </span>
                <p className="text-white font-medium text-sm mt-2">{paso.titulo}</p>
                <p className="text-slate-500 text-xs mt-1">{paso.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify dev server renders correctly**

Run: `npm run dev` — open http://localhost:3000
Expected: Dark hero page with glow, 3 rule cards, login form, steps.

- [ ] **Step 3: Commit**

```
git add src/app/page.tsx
git commit -m "feat: redesign landing page with hero, context cards, glassmorphism form"
```

---

## Task 5: Suggestions page redesign (`/sugerir`)

**Files:**
- Modify: `src/app/sugerir/page.tsx`

### Steps

- [ ] **Step 1: Rewrite suggestions page with 2-phase flow**

Full rewrite with:
- **Phase A:** All 5+ fields visible with completion indicators, `.mx` suffix badge, progress bar
- **Phase B:** Review cards with inline edit, add more, delete (if > 5)
- **Post-submit:** Stats confirmation screen

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, Plus, Trash2, Send, ArrowLeft, Loader2, Globe } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { DomainBadge } from "@/components/ui/domain-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { User } from "@/lib/types";

interface SuggestionField {
  domain_name: string;
  meaning: string;
}

type Phase = "capture" | "review" | "done";

export default function SugerirPage() {
  const [user, setUser] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionField[]>(
    Array(5).fill(null).map(() => ({ domain_name: "", meaning: "" }))
  );
  const [phase, setPhase] = useState<Phase>("capture");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ total_suggestions: number; total_participants: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("vote_user");
    if (!stored) { router.push("/"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  const completedCount = suggestions.filter(s => s.domain_name.trim() && s.meaning.trim()).length;
  const allComplete = completedCount >= 5;

  function updateSuggestion(index: number, field: keyof SuggestionField, value: string) {
    setSuggestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addSuggestion() {
    setSuggestions(prev => [...prev, { domain_name: "", meaning: "" }]);
  }

  function removeSuggestion(index: number) {
    if (suggestions.length <= 5) return;
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  }

  function handleReview() {
    const incomplete = suggestions.findIndex(s => !s.domain_name.trim() || !s.meaning.trim());
    if (incomplete !== -1) {
      setError(`La sugerencia ${incomplete + 1} está incompleta`);
      return;
    }
    setError("");
    setPhase("review");
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user!.id,
          suggestions: suggestions.map(s => ({
            domain_name: s.domain_name.trim(),
            meaning: s.meaning.trim(),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al enviar"); setLoading(false); return; }

      // Fetch stats
      const statsRes = await fetch("/api/suggestions");
      const statsData = await statsRes.json();
      setStats(statsData.stats);
      setPhase("done");
    } catch {
      setError("Error de conexión");
      setLoading(false);
    }
  }

  if (!user) return null;

  // ── DONE PHASE ──
  if (phase === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10">
          <GlowCard hover={false} className="max-w-md text-center p-10">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-8 h-8 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">{suggestions.length} sugerencias enviadas</h2>
            <p className="text-slate-400 mb-6">Gracias {user.username}!</p>

            {stats && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-2xl font-bold text-blue-400">{stats.total_suggestions}</p>
                  <p className="text-xs text-slate-500">sugerencias totales</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <p className="text-2xl font-bold text-indigo-400">{stats.total_participants}</p>
                  <p className="text-xs text-slate-500">participantes</p>
                </div>
              </div>
            )}

            <button onClick={() => router.push("/")}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors text-sm"
            >
              Volver al inicio
            </button>
          </GlowCard>
        </motion.div>
      </div>
    );
  }

  // ── REVIEW PHASE ──
  if (phase === "review") {
    return (
      <div className="min-h-screen p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto py-8">
          <button onClick={() => setPhase("capture")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a editar
          </button>

          <h1 className="text-2xl font-bold text-white mb-1">Tus propuestas</h1>
          <p className="text-slate-400 text-sm mb-6">Revisa antes de enviar. Puedes editar o agregar más.</p>

          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlowCard className="relative">
                  {editingIndex === i ? (
                    <div className="space-y-3">
                      <input type="text" value={s.domain_name}
                        onChange={e => updateSuggestion(i, "domain_name", e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                      />
                      <textarea value={s.meaning}
                        onChange={e => updateSuggestion(i, "meaning", e.target.value)} rows={2}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                      />
                      <button onClick={() => setEditingIndex(null)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >Listo</button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <DomainBadge name={s.domain_name} size="sm" />
                        <p className="text-sm text-slate-400 mt-2">{s.meaning}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditingIndex(i)}
                          className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        ><Pencil className="w-4 h-4" /></button>
                        {suggestions.length > 5 && (
                          <button onClick={() => removeSuggestion(i)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                          ><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  )}
                </GlowCard>
              </motion.div>
            ))}
          </div>

          <button onClick={addSuggestion}
            className="w-full mt-4 py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Agregar otra sugerencia
          </button>

          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-lg"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : <><Send className="w-5 h-5" /> Enviar {suggestions.length} sugerencias</>}
          </button>
        </div>
      </div>
    );
  }

  // ── CAPTURE PHASE ──
  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Sugiere dominios</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Propón al menos 5 nombres con su significado. El sufijo <span className="text-blue-400 font-mono">.mx</span> se agrega automáticamente.
        </p>

        <ProgressBar value={completedCount} max={5} className="mb-8" color={allComplete ? "green" : "blue"} />

        <div className="space-y-4">
          {suggestions.map((s, i) => {
            const isComplete = s.domain_name.trim() && s.meaning.trim();
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlowCard hover={false} className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isComplete ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30" : "bg-white/5 text-slate-500 border border-white/10"
                    }`}>
                      {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className="text-sm text-slate-400">Sugerencia {i + 1}{i >= 5 ? " (extra)" : ""}</span>
                    {i >= 5 && (
                      <button onClick={() => removeSuggestion(i)} className="ml-auto p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="relative">
                      <input type="text" value={s.domain_name} onChange={e => updateSuggestion(i, "domain_name", e.target.value)}
                        placeholder="nombre-del-dominio"
                        className="w-full px-4 py-2.5 pr-16 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 font-mono text-sm font-bold">.mx</span>
                    </div>
                    <textarea value={s.meaning} onChange={e => updateSuggestion(i, "meaning", e.target.value)}
                      placeholder="¿Qué significa o por qué lo elegiste?"
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm resize-none"
                    />
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>

        <button onClick={addSuggestion}
          className="w-full mt-4 py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Agregar otra sugerencia
        </button>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}

        <AnimatePresence>
          {allComplete && (
            <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={handleReview}
              className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-lg"
            >
              Revisar mis sugerencias <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Run: open http://localhost:3000/sugerir (with a user in localStorage)
Expected: 5 fields visible, progress bar, completion indicators, review phase, extra suggestions button.

- [ ] **Step 3: Commit**

```
git add src/app/sugerir/page.tsx
git commit -m "feat: redesign suggestions with 2-phase flow, review, extras"
```

---

## Task 6: Voting page visual upgrade (`/votar`)

**Files:**
- Modify: `src/app/votar/page.tsx`

### Steps

- [ ] **Step 1: Visually upgrade the voting page**

Keep the existing voting logic but upgrade the visual treatment: GlowCards, DomainBadge, gradient buttons, ambient glow, sticky footer with points counter, better round header.

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trophy, Loader2, ChevronRight } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { DomainBadge } from "@/components/ui/domain-badge";
import type { User, Suggestion } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";

interface VoteState {
  points: number;
  tags: string[];
}

export default function VotarPage() {
  const [user, setUser] = useState<User | null>(null);
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([]);
  const [currentOptions, setCurrentOptions] = useState<Suggestion[]>([]);
  const [votes, setVotes] = useState<Record<string, VoteState>>({});
  const [roundNumber, setRoundNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const OPTIONS_PER_PAGE = 5;
  const MAX_POINTS = 5;
  const MAX_PER_OPTION = 3;

  const loadNextRound = useCallback(
    (suggestions: Suggestion[], alreadyVoted: Set<string>, round: number) => {
      const available = suggestions.filter((s) => !alreadyVoted.has(s.id));
      if (available.length === 0) { setDone(true); return; }
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const batch = shuffled.slice(0, OPTIONS_PER_PAGE);
      setCurrentOptions(batch);
      setRoundNumber(round);
      const initial: Record<string, VoteState> = {};
      for (const s of batch) { initial[s.id] = { points: 0, tags: [] }; }
      setVotes(initial);
    }, []
  );

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem("vote_user");
      if (!stored) { router.push("/"); return; }
      const u = JSON.parse(stored) as User;
      setUser(u);

      const { data: suggestions } = await supabase
        .from("suggestions").select("id, user_id, domain_name, meaning, created_at");
      if (!suggestions || suggestions.length === 0) { setError("No hay sugerencias todavía"); setLoading(false); return; }

      const { data: existingVotes } = await supabase
        .from("votes").select("suggestion_id, round_number").eq("user_id", u.id);

      const voted = new Set<string>();
      let maxRound = 0;
      if (existingVotes) {
        for (const v of existingVotes) { voted.add(v.suggestion_id); if (v.round_number > maxRound) maxRound = v.round_number; }
      }
      setVotedIds(voted);
      setAllSuggestions(suggestions);
      loadNextRound(suggestions, voted, maxRound + 1);
      setLoading(false);
    }
    init();
  }, [router, loadNextRound]);

  const pointsUsed = Object.values(votes).reduce((sum, v) => sum + v.points, 0);
  const pointsLeft = MAX_POINTS - pointsUsed;

  function addPoint(id: string) {
    setVotes(prev => {
      const c = prev[id];
      if (c.points >= MAX_PER_OPTION || pointsLeft <= 0) return prev;
      return { ...prev, [id]: { ...c, points: c.points + 1 } };
    });
  }

  function removePoint(id: string) {
    setVotes(prev => {
      const c = prev[id];
      if (c.points <= 0) return prev;
      const p = c.points - 1;
      return { ...prev, [id]: { ...c, points: p, tags: p === 0 ? [] : c.tags } };
    });
  }

  function toggleTag(id: string, tag: string) {
    setVotes(prev => {
      const c = prev[id];
      const tags = c.tags.includes(tag) ? c.tags.filter(t => t !== tag) : [...c.tags, tag];
      return { ...prev, [id]: { ...c, tags } };
    });
  }

  async function handleSubmitRound() {
    setSubmitting(true);
    setError("");
    const voteData = Object.entries(votes).filter(([, v]) => v.points > 0).map(([id, v]) => ({ suggestion_id: id, points: v.points, tags: v.tags }));
    if (voteData.length === 0) { setError("Asigna al menos 1 punto"); setSubmitting(false); return; }

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user!.id, round_number: roundNumber, votes: voteData }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al votar"); setSubmitting(false); return; }

      const newVoted = new Set(votedIds);
      for (const opt of currentOptions) newVoted.add(opt.id);
      setVotedIds(newVoted);
      loadNextRound(allSuggestions, newVoted, roundNumber + 1);
      setSubmitting(false);
    } catch { setError("Error de conexión"); setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10">
          <GlowCard hover={false} className="max-w-md text-center p-10">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Votación completada</h2>
            <p className="text-slate-400 mb-6">Votaste en todas las opciones disponibles. Gracias {user?.username}!</p>
            <button onClick={() => router.push("/resultados")}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Ver resultados <ChevronRight className="w-4 h-4" />
            </button>
          </GlowCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Round header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                Ronda {roundNumber}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Reparte tus puntos</h1>
            <p className="text-sm text-slate-400 mt-1">Máximo {MAX_PER_OPTION} puntos por opción. Toca + para asignar.</p>
          </div>
          <div className="text-center">
            <motion.div key={pointsLeft} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
              className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-indigo-400"
            >
              {pointsLeft}
            </motion.div>
            <p className="text-xs text-slate-500">restantes</p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {currentOptions.map((option, i) => {
            const vote = votes[option.id];
            if (!vote) return null;
            const hasPoints = vote.points > 0;
            return (
              <motion.div key={option.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <GlowCard hover={false} className={hasPoints ? "border-blue-500/30 bg-blue-500/5" : ""}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <DomainBadge name={option.domain_name} size="md" />
                      <p className="text-sm text-slate-400 mt-2">{option.meaning}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => removePoint(option.id)} disabled={vote.points === 0}
                        className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-20 text-white flex items-center justify-center transition-all"
                      ><Minus className="w-4 h-4" /></button>
                      <motion.span key={vote.points} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                        className="text-xl font-bold text-white w-8 text-center"
                      >{vote.points}</motion.span>
                      <button onClick={() => addPoint(option.id)} disabled={vote.points >= MAX_PER_OPTION || pointsLeft <= 0}
                        className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:bg-slate-700 text-white flex items-center justify-center transition-all"
                      ><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {hasPoints && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-xs text-slate-500 mb-2">¿Por qué te gustó? (opcional)</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(TAG_LABELS).map(([key, label]) => (
                              <button key={key} onClick={() => toggleTag(option.id, key)}
                                className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                                  vote.tags.includes(key)
                                    ? "bg-blue-500/20 border-blue-400/40 text-blue-300"
                                    : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                                }`}
                              >{label}</button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-white/10 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <button onClick={handleSubmitRound} disabled={submitting || pointsUsed === 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all text-lg"
          >
            {submitting ? "Enviando..." : `Enviar votos · ${pointsUsed} puntos usados`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Expected: Glassmorphism cards with DomainBadge, animated point counters, sticky footer, ambient glow.

- [ ] **Step 3: Commit**

```
git add src/app/votar/page.tsx
git commit -m "feat: visually upgrade voting page with GlowCards, DomainBadge, sticky footer"
```

---

## Task 7: Results page with podium (`/resultados`)

**Files:**
- Modify: `src/app/resultados/page.tsx`

### Steps

- [ ] **Step 1: Rewrite results page with podium and stats**

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, MessageSquare, Trophy, Loader2 } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { DomainBadge } from "@/components/ui/domain-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Podium } from "@/components/ui/podium";
import { TAG_LABELS } from "@/lib/types";

interface Result {
  id: string;
  domain_name: string;
  meaning: string;
  total_points: number;
  vote_count: number;
  tag_counts: Record<string, number>;
}

interface Stats {
  total_suggestions: number;
  total_participants: number;
  total_voters: number;
  total_votes: number;
}

export default function ResultadosPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/results");
      const data = await res.json();
      setResults(data.results || data);
      setStats(data.stats || null);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const maxPoints = results.length > 0 ? results[0].total_points : 1;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h1 className="text-3xl font-bold text-white">Resultados</h1>
        </div>
        <p className="text-slate-400 mb-8">{results.length} dominios sugeridos</p>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Sugerencias", value: stats.total_suggestions, icon: MessageSquare, color: "text-blue-400" },
              { label: "Participantes", value: stats.total_participants, icon: Users, color: "text-indigo-400" },
              { label: "Votantes", value: stats.total_voters, icon: Users, color: "text-emerald-400" },
              { label: "Votos", value: stats.total_votes, icon: BarChart3, color: "text-amber-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Podium */}
        {results.length >= 2 && <Podium top3={results.slice(0, 3)} />}

        {/* Full ranking */}
        <div className="space-y-3 mt-8">
          {results.map((result, index) => (
            <motion.div key={result.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
              <GlowCard>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className={`text-sm font-mono mt-1 w-6 text-center shrink-0 ${
                      index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : index === 2 ? "text-orange-400" : "text-slate-600"
                    }`}>
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <DomainBadge name={result.domain_name} size="sm" />
                      <p className="text-sm text-slate-400 mt-1.5">{result.meaning}</p>
                      {Object.keys(result.tag_counts).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {Object.entries(result.tag_counts).map(([tag, count]) => (
                            <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-white/5 border border-white/10 text-slate-400">
                              {TAG_LABELS[tag as keyof typeof TAG_LABELS]} ({count})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-indigo-400">
                      {result.total_points}
                    </p>
                    <p className="text-xs text-slate-500">{result.vote_count} voto{result.vote_count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <ProgressBar value={result.total_points} max={maxPoints} className="mt-3" />
              </GlowCard>
            </motion.div>
          ))}

          {results.length === 0 && (
            <div className="text-center text-slate-400 py-12">No hay resultados todavía</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test in browser**

Expected: Podium for top 3, stats bar, GlowCards with DomainBadge and gradient progress bars.

- [ ] **Step 3: Commit**

```
git add src/app/resultados/page.tsx
git commit -m "feat: add podium, stats bar, and visual upgrade to results page"
```

---

## Task 8: Final verification

### Steps

- [ ] **Step 1: Build check**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Visual walkthrough**

Run: `npm run dev` — walk through the full flow:
1. `/` — hero, 3 rule cards, login form
2. `/sugerir` — 5 fields, progress, add extra, review phase, submit
3. `/votar` — GlowCards, DomainBadge, point controls, sticky footer
4. `/resultados` — stats, podium, ranking with progress bars

- [ ] **Step 3: Final commit**

```
git add -A
git commit -m "feat: complete voting app visual redesign"
```
