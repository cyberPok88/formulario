# Domain Voting App - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-phase app where team members (1) suggest domain names with meanings, then (2) vote on them by distributing points and tagging why they liked each one. Results stored in Supabase.

**Architecture:** Next.js 16 App Router with Route Handlers for API. Client components for interactive forms. Supabase JS client for DB operations. Two sequential phases controlled by a config row in Supabase: "suggestions" phase first, then "voting" phase. No auth — just unique usernames.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase JS (@supabase/supabase-js), Framer Motion (already installed), Radix UI (already installed)

---

## File Structure

```
src/
  lib/
    supabase.ts              — Supabase client singleton
    types.ts                 — TypeScript types for all entities
  app/
    layout.tsx               — (modify) Update metadata title/description
    page.tsx                 — (replace) Landing: username input → redirect to phase
    globals.css              — (modify) Add custom styles for the app
    sugerir/
      page.tsx               — Suggestions form: 5 domain suggestions with meanings
    votar/
      page.tsx               — Voting page: shows 5 random options, distribute 10 points
    resultados/
      page.tsx               — Results dashboard (simple table, point totals)
    api/
      config/
        route.ts             — GET current phase config
      suggestions/
        route.ts             — POST new suggestion, GET all suggestions
      votes/
        route.ts             — POST vote with points and tags
      results/
        route.ts             — GET aggregated results
```

## Supabase Schema (SQL to run in Supabase SQL Editor)

```sql
-- Phase config
create table app_config (
  id int primary key default 1,
  phase text not null default 'suggestions' check (phase in ('suggestions', 'voting', 'closed')),
  points_per_round int not null default 5,
  options_per_page int not null default 5,
  updated_at timestamptz default now()
);
insert into app_config (id, phase) values (1, 'suggestions');

-- Users (just usernames, no auth)
create table users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  created_at timestamptz default now()
);

-- Domain suggestions
create table suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  domain_name text not null,
  meaning text not null,
  created_at timestamptz default now()
);

-- Votes
create table votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  suggestion_id uuid references suggestions(id),
  points int not null check (points >= 0 and points <= 10),
  round_number int not null default 1,
  created_at timestamptz default now(),
  unique(user_id, suggestion_id)
);

-- Vote tags (why they liked it)
create table vote_tags (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid references votes(id) on delete cascade,
  tag text not null check (tag in ('suena_chido', 'sencillo', 'practico'))
);

-- Enable RLS but allow all (no auth needed for this temp app)
alter table app_config enable row level security;
alter table users enable row level security;
alter table suggestions enable row level security;
alter table votes enable row level security;
alter table vote_tags enable row level security;

create policy "Allow all on app_config" on app_config for all using (true) with check (true);
create policy "Allow all on users" on users for all using (true) with check (true);
create policy "Allow all on suggestions" on suggestions for all using (true) with check (true);
create policy "Allow all on votes" on votes for all using (true) with check (true);
create policy "Allow all on vote_tags" on vote_tags for all using (true) with check (true);
```

---

### Task 1: Install Supabase and create shared types

**Files:**
- Modify: `package.json` (add dependency)
- Create: `src/lib/supabase.ts`
- Create: `src/lib/types.ts`
- Create: `.env.local` (template)

- [ ] **Step 1: Install @supabase/supabase-js**

Run: `npm install @supabase/supabase-js`

- [ ] **Step 2: Create .env.local with Supabase credentials**

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Create shared types**

Create `src/lib/types.ts`:
```typescript
export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Suggestion {
  id: string;
  user_id: string;
  domain_name: string;
  meaning: string;
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  suggestion_id: string;
  points: number;
  round_number: number;
  created_at: string;
}

export interface VoteTag {
  id: string;
  vote_id: string;
  tag: "suena_chido" | "sencillo" | "practico";
}

export type Phase = "suggestions" | "voting" | "closed";

export interface AppConfig {
  id: number;
  phase: Phase;
  points_per_round: number;
  options_per_page: number;
  updated_at: string;
}

export const TAG_LABELS: Record<VoteTag["tag"], string> = {
  suena_chido: "Suena chido",
  sencillo: "Sencillo",
  practico: "Practico",
};
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/lib/types.ts .env.local package.json package-lock.json
git commit -m "feat: add Supabase client and shared types"
```

---

### Task 2: API Route — Config

**Files:**
- Create: `src/app/api/config/route.ts`

- [ ] **Step 1: Create config API route**

Create `src/app/api/config/route.ts`:
```typescript
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from("app_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

- [ ] **Step 2: Verify the route compiles**

Run: `npx next build --no-lint 2>&1 | head -20`
Expected: No TypeScript errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/config/route.ts
git commit -m "feat: add config API route"
```

---

### Task 3: API Route — Suggestions

**Files:**
- Create: `src/app/api/suggestions/route.ts`

- [ ] **Step 1: Create suggestions API route**

Create `src/app/api/suggestions/route.ts`:
```typescript
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabase
    .from("suggestions")
    .select("id, domain_name, meaning, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, suggestions } = body as {
    user_id: string;
    suggestions: { domain_name: string; meaning: string }[];
  };

  if (!user_id || !suggestions || suggestions.length !== 5) {
    return NextResponse.json(
      { error: "Se requieren exactamente 5 sugerencias" },
      { status: 400 }
    );
  }

  // Check user hasn't already submitted
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

- [ ] **Step 2: Commit**

```bash
git add src/app/api/suggestions/route.ts
git commit -m "feat: add suggestions API route (GET/POST)"
```

---

### Task 4: API Route — Votes

**Files:**
- Create: `src/app/api/votes/route.ts`

- [ ] **Step 1: Create votes API route**

Create `src/app/api/votes/route.ts`:
```typescript
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface VoteInput {
  suggestion_id: string;
  points: number;
  tags: string[];
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { user_id, round_number, votes } = body as {
    user_id: string;
    round_number: number;
    votes: VoteInput[];
  };

  if (!user_id || !votes || !round_number) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // Validate total points <= 10
  const totalPoints = votes.reduce((sum, v) => sum + v.points, 0);
  if (totalPoints > 5) {
    return NextResponse.json(
      { error: "Maximo 5 puntos por ronda" },
      { status: 400 }
    );
  }

  // Validate max 3 points per option
  if (votes.some((v) => v.points > 3)) {
    return NextResponse.json(
      { error: "Maximo 3 puntos por opcion" },
      { status: 400 }
    );
  }

  // Insert votes (only those with points > 0)
  const votesWithPoints = votes.filter((v) => v.points > 0);

  for (const vote of votesWithPoints) {
    const { data: voteData, error: voteError } = await supabase
      .from("votes")
      .insert({
        user_id,
        suggestion_id: vote.suggestion_id,
        points: vote.points,
        round_number,
      })
      .select("id")
      .single();

    if (voteError) {
      return NextResponse.json(
        { error: voteError.message },
        { status: 500 }
      );
    }

    // Insert tags for this vote
    if (vote.tags.length > 0) {
      const tagRows = vote.tags.map((tag) => ({
        vote_id: voteData.id,
        tag,
      }));

      const { error: tagError } = await supabase
        .from("vote_tags")
        .insert(tagRows);

      if (tagError) {
        return NextResponse.json(
          { error: tagError.message },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/votes/route.ts
git commit -m "feat: add votes API route with tags"
```

---

### Task 5: API Route — Results

**Files:**
- Create: `src/app/api/results/route.ts`

- [ ] **Step 1: Create results API route**

Create `src/app/api/results/route.ts`:
```typescript
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  // Get all suggestions with their vote totals
  const { data: suggestions, error: sugError } = await supabase
    .from("suggestions")
    .select("id, domain_name, meaning");

  if (sugError) {
    return NextResponse.json({ error: sugError.message }, { status: 500 });
  }

  // Get votes with tags
  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("suggestion_id, points, vote_tags(tag)");

  if (votesError) {
    return NextResponse.json({ error: votesError.message }, { status: 500 });
  }

  // Aggregate
  const results = suggestions.map((s) => {
    const suggestionVotes = votes.filter((v) => v.suggestion_id === s.id);
    const totalPoints = suggestionVotes.reduce((sum, v) => sum + v.points, 0);
    const voteCount = suggestionVotes.length;

    // Count tags
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

  // Sort by total points descending
  results.sort((a, b) => b.total_points - a.total_points);

  return NextResponse.json(results);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/results/route.ts
git commit -m "feat: add results API route with aggregation"
```

---

### Task 6: Landing Page — Username Input

**Files:**
- Modify: `src/app/layout.tsx`
- Replace: `src/app/page.tsx`

- [ ] **Step 1: Update layout metadata**

Modify `src/app/layout.tsx` — change the metadata:
```typescript
export const metadata: Metadata = {
  title: "Votacion de Dominio",
  description: "Sugiere y vota por el mejor dominio para nuestro proyecto",
};
```

- [ ] **Step 2: Create landing page with username input**

Replace `src/app/page.tsx` entirely:
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

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
      // Try to get existing user or create new one
      let { data: user } = await supabase
        .from("users")
        .select("id, username")
        .eq("username", trimmed)
        .single();

      if (!user) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ username: trimmed })
          .select("id, username")
          .single();

        if (insertError) {
          setError("Error al crear usuario. Intenta otro nombre.");
          setLoading(false);
          return;
        }
        user = newUser;
      }

      // Store user in localStorage
      localStorage.setItem("vote_user", JSON.stringify(user));

      // Check current phase
      const res = await fetch("/api/config");
      const config = await res.json();

      if (config.phase === "suggestions") {
        // Check if user already submitted suggestions
        const { data: existing } = await supabase
          .from("suggestions")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (existing && existing.length > 0) {
          setError("Ya enviaste tus sugerencias. Espera la fase de votacion.");
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
      setError("Error de conexion. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white text-center mb-2">
            Votacion de Dominio
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Ayudanos a elegir el mejor dominio para el proyecto
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Tu nombre de usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej: juan_dev"
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-semibold rounded-xl transition-colors duration-200"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Run dev server to verify it renders**

Run: `npm run dev`
Expected: Page loads at localhost:3000 with username input form.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: landing page with username input and phase routing"
```

---

### Task 7: Suggestions Page — Submit 5 Domain Ideas

**Files:**
- Create: `src/app/sugerir/page.tsx`

- [ ] **Step 1: Create suggestions page**

Create `src/app/sugerir/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@/lib/types";

interface SuggestionField {
  domain_name: string;
  meaning: string;
}

const EMPTY_SUGGESTION: SuggestionField = { domain_name: "", meaning: "" };

export default function SugerirPage() {
  const [user, setUser] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionField[]>(
    Array(5).fill(null).map(() => ({ ...EMPTY_SUGGESTION }))
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("vote_user");
    if (!stored) {
      router.push("/");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  function updateSuggestion(index: number, field: keyof SuggestionField, value: string) {
    setSuggestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleNext() {
    const current = suggestions[currentStep];
    if (!current.domain_name.trim()) {
      setError("Escribe el nombre del dominio");
      return;
    }
    if (!current.meaning.trim()) {
      setError("Escribe el significado o interpretacion");
      return;
    }
    setError("");
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setError("");
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleSubmit() {
    // Validate all fields
    for (let i = 0; i < 5; i++) {
      if (!suggestions[i].domain_name.trim() || !suggestions[i].meaning.trim()) {
        setError(`La sugerencia ${i + 1} esta incompleta`);
        setCurrentStep(i);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user!.id,
          suggestions: suggestions.map((s) => ({
            domain_name: s.domain_name.trim(),
            meaning: s.meaning.trim(),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al enviar");
        setLoading(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Error de conexion");
      setLoading(false);
    }
  }

  if (!user) return null;

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-xl text-center max-w-md"
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Sugerencias enviadas
          </h2>
          <p className="text-slate-400">
            Gracias {user.username}! Tus 5 sugerencias fueron registradas.
            Te avisaremos cuando inicie la votacion.
          </p>
        </motion.div>
      </div>
    );
  }

  const current = suggestions[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white">
              Sugiere un dominio
            </h1>
            <span className="text-sm text-slate-400">
              {currentStep + 1} de 5
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 mb-8">
            {Array(5)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    i <= currentStep ? "bg-blue-500" : "bg-slate-700"
                  }`}
                />
              ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre sugerido
                </label>
                <input
                  type="text"
                  value={current.domain_name}
                  onChange={(e) =>
                    updateSuggestion(currentStep, "domain_name", e.target.value)
                  }
                  placeholder="ej: it-tlan.mx"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Significado o interpretacion
                </label>
                <textarea
                  value={current.meaning}
                  onChange={(e) =>
                    updateSuggestion(currentStep, "meaning", e.target.value)
                  }
                  placeholder="ej: Combina IT (tecnologia) con Tlan (lugar en nahuatl)"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center mt-4"
            >
              {error}
            </motion.p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Anterior
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? "Enviando..." : "Enviar 5 sugerencias"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders**

Run: Navigate to `http://localhost:3000/sugerir` (dev server must be running).
Expected: Step-by-step form with domain name and meaning fields.

- [ ] **Step 3: Commit**

```bash
git add src/app/sugerir/page.tsx
git commit -m "feat: suggestions page with 5-step form"
```

---

### Task 8: Voting Page — Distribute Points with Tag Popup

**Files:**
- Create: `src/app/votar/page.tsx`

- [ ] **Step 1: Create voting page**

Create `src/app/votar/page.tsx`:
```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
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
  const [tagPopup, setTagPopup] = useState<string | null>(null); // suggestion_id
  const [done, setDone] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const OPTIONS_PER_PAGE = 5;
  const MAX_POINTS = 5;
  const MAX_PER_OPTION = 3;

  const loadNextRound = useCallback(
    (suggestions: Suggestion[], alreadyVoted: Set<string>, round: number) => {
      const available = suggestions.filter((s) => !alreadyVoted.has(s.id));
      if (available.length === 0) {
        setDone(true);
        return;
      }
      // Shuffle and take 5
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const batch = shuffled.slice(0, OPTIONS_PER_PAGE);
      setCurrentOptions(batch);
      setRoundNumber(round);
      // Init votes for this round
      const initial: Record<string, VoteState> = {};
      for (const s of batch) {
        initial[s.id] = { points: 0, tags: [] };
      }
      setVotes(initial);
    },
    []
  );

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem("vote_user");
      if (!stored) {
        router.push("/");
        return;
      }
      const u = JSON.parse(stored) as User;
      setUser(u);

      // Load all suggestions
      const { data: suggestions } = await supabase
        .from("suggestions")
        .select("id, domain_name, meaning, created_at");

      if (!suggestions || suggestions.length === 0) {
        setError("No hay sugerencias todavia");
        setLoading(false);
        return;
      }

      // Get user's existing votes to exclude already-voted options
      const { data: existingVotes } = await supabase
        .from("votes")
        .select("suggestion_id, round_number")
        .eq("user_id", u.id);

      const voted = new Set<string>();
      let maxRound = 0;
      if (existingVotes) {
        for (const v of existingVotes) {
          voted.add(v.suggestion_id);
          if (v.round_number > maxRound) maxRound = v.round_number;
        }
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

  function addPoint(suggestionId: string) {
    setVotes((prev) => {
      const current = prev[suggestionId];
      if (current.points >= MAX_PER_OPTION || pointsLeft <= 0) return prev;
      return {
        ...prev,
        [suggestionId]: { ...current, points: current.points + 1 },
      };
    });
    // Show tag popup when first point is assigned
    setTagPopup(suggestionId);
  }

  function removePoint(suggestionId: string) {
    setVotes((prev) => {
      const current = prev[suggestionId];
      if (current.points <= 0) return prev;
      const newPoints = current.points - 1;
      return {
        ...prev,
        [suggestionId]: {
          ...current,
          points: newPoints,
          tags: newPoints === 0 ? [] : current.tags,
        },
      };
    });
  }

  function toggleTag(suggestionId: string, tag: string) {
    setVotes((prev) => {
      const current = prev[suggestionId];
      const newTags = current.tags.includes(tag)
        ? current.tags.filter((t) => t !== tag)
        : [...current.tags, tag];
      return {
        ...prev,
        [suggestionId]: { ...current, tags: newTags },
      };
    });
  }

  async function handleSubmitRound() {
    setSubmitting(true);
    setError("");

    const voteData = Object.entries(votes)
      .filter(([, v]) => v.points > 0)
      .map(([suggestion_id, v]) => ({
        suggestion_id,
        points: v.points,
        tags: v.tags,
      }));

    if (voteData.length === 0) {
      setError("Asigna al menos 1 punto");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user!.id,
          round_number: roundNumber,
          votes: voteData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al votar");
        setSubmitting(false);
        return;
      }

      // Mark these as voted
      const newVotedIds = new Set(votedIds);
      for (const opt of currentOptions) {
        newVotedIds.add(opt.id);
      }
      setVotedIds(newVotedIds);

      // Load next round
      loadNextRound(allSuggestions, newVotedIds, roundNumber + 1);
      setSubmitting(false);
    } catch {
      setError("Error de conexion");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-xl text-center max-w-md"
        >
          <div className="text-5xl mb-4">🗳️</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Votacion completada
          </h2>
          <p className="text-slate-400 mb-6">
            Votaste en todas las opciones disponibles. Gracias {user?.username}!
          </p>
          <button
            onClick={() => router.push("/resultados")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            Ver resultados
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Vota</h1>
            <p className="text-slate-400 text-sm">Ronda {roundNumber}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{pointsLeft}</div>
            <div className="text-xs text-slate-400">puntos restantes</div>
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-6">
          Reparte 5 puntos entre estas opciones (max {MAX_PER_OPTION} por opcion).
          Toca + para asignar puntos.
        </p>

        {/* Options */}
        <div className="space-y-4">
          {currentOptions.map((option) => {
            const vote = votes[option.id];
            if (!vote) return null;

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-5 transition-colors ${
                  vote.points > 0
                    ? "border-blue-500/50"
                    : "border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">
                      {option.domain_name}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      {option.meaning}
                    </p>
                  </div>

                  {/* Point controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removePoint(option.id)}
                      disabled={vote.points === 0}
                      className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <span className="text-xl font-bold text-white w-6 text-center">
                      {vote.points}
                    </span>
                    <button
                      onClick={() => addPoint(option.id)}
                      disabled={vote.points >= MAX_PER_OPTION || pointsLeft <= 0}
                      className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Tags (shown when points > 0) */}
                <AnimatePresence>
                  {vote.points > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-2">
                          Por que te gusto? (opcional)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(TAG_LABELS).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => toggleTag(option.id, key)}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                vote.tags.includes(key)
                                  ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                  : "bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm text-center mt-4"
          >
            {error}
          </motion.p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmitRound}
          disabled={submitting || pointsUsed === 0}
          className="w-full mt-8 py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-colors text-lg"
        >
          {submitting
            ? "Enviando..."
            : `Enviar votos (${pointsUsed} puntos usados)`}
        </button>
      </div>

      {/* Tag popup overlay (used on mobile) */}
      <AnimatePresence>
        {tagPopup && votes[tagPopup]?.points > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
            onClick={() => setTagPopup(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-white font-semibold mb-1">
                Por que te gusto?
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {currentOptions.find((o) => o.id === tagPopup)?.domain_name}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(TAG_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleTag(tagPopup, key)}
                    className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                      votes[tagPopup]?.tags.includes(key)
                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                        : "bg-slate-900/50 border-slate-600 text-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setTagPopup(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
              >
                Listo
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verify voting page renders**

Run: Navigate to `http://localhost:3000/votar` (dev server must be running).
Expected: 5 cards with + / - buttons and point counter.

- [ ] **Step 3: Commit**

```bash
git add src/app/votar/page.tsx
git commit -m "feat: voting page with point distribution and tag selection"
```

---

### Task 9: Results Page

**Files:**
- Create: `src/app/resultados/page.tsx`

- [ ] **Step 1: Create results page**

Create `src/app/resultados/page.tsx`:
```typescript
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TAG_LABELS } from "@/lib/types";

interface Result {
  id: string;
  domain_name: string;
  meaning: string;
  total_points: number;
  vote_count: number;
  tag_counts: Record<string, number>;
}

export default function ResultadosPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/results");
      const data = await res.json();
      setResults(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <p className="text-slate-400">Cargando resultados...</p>
      </div>
    );
  }

  const maxPoints = results.length > 0 ? results[0].total_points : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Resultados</h1>
        <p className="text-slate-400 mb-8">
          {results.length} dominios sugeridos
        </p>

        <div className="space-y-3">
          {results.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-slate-500 font-mono text-sm mt-1">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">
                      {result.domain_name}
                    </h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {result.meaning}
                    </p>

                    {/* Tags */}
                    {Object.keys(result.tag_counts).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(result.tag_counts).map(([tag, count]) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-xs rounded-full bg-slate-700/50 text-slate-300"
                          >
                            {TAG_LABELS[tag as keyof typeof TAG_LABELS]} ({count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-400">
                    {result.total_points}
                  </div>
                  <div className="text-xs text-slate-500">
                    {result.vote_count} voto{result.vote_count !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Bar */}
              <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${maxPoints > 0 ? (result.total_points / maxPoints) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.8, delay: index * 0.05 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </motion.div>
          ))}

          {results.length === 0 && (
            <div className="text-center text-slate-400 py-12">
              No hay resultados todavia
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/resultados/page.tsx
git commit -m "feat: results page with ranked list and tag breakdown"
```

---

### Task 10: Clean up globals.css and delete page.module.css

**Files:**
- Modify: `src/app/globals.css`
- Delete: `src/app/page.module.css`

- [ ] **Step 1: Simplify globals.css**

Replace `src/app/globals.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: Delete page.module.css**

Run: `rm src/app/page.module.css`

- [ ] **Step 3: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git rm src/app/page.module.css
git commit -m "chore: clean up CSS, remove unused module styles"
```

---

### Task 11: Environment and Deploy Setup

**Files:**
- Modify: `.gitignore` (verify .env.local is ignored)

- [ ] **Step 1: Verify .env.local is gitignored**

Run: `grep ".env" .gitignore`
Expected: `.env*.local` or `.env.local` is listed.

- [ ] **Step 2: Test full flow locally**

1. Run `npm run dev`
2. Go to `http://localhost:3000`
3. Enter a username → should redirect to `/sugerir`
4. Submit 5 suggestions
5. Change Supabase `app_config.phase` to `'voting'`
6. Login again → should redirect to `/votar`
7. Distribute points and submit
8. Check `/resultados`

- [ ] **Step 3: Deploy to Vercel**

Run: `npx vercel` (follow prompts)
Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 4: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: ready for Vercel deploy"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-06-03-domain-voting-app.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
