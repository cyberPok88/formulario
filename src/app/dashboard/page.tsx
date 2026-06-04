"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Users, FileText, Vote, LogOut, Loader2, Pencil, Eye, CheckCircle, AlertCircle } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { getSession, clearSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/types";

const MIN_PARTICIPANTS = 8;

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [phaseInfo, setPhaseInfo] = useState<{ phase: string; participants: number; suggestions: number } | null>(null);
  const [hasSuggestions, setHasSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.push("/");
      return;
    }
    setUser(session);
  }, [router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [configRes, statsRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/suggestions"),
        ]);
        const config = await configRes.json();
        const statsData = await statsRes.json();
        setPhaseInfo({
          phase: config.phase,
          participants: statsData.stats?.total_participants ?? 0,
          suggestions: statsData.stats?.total_suggestions ?? 0,
        });

        const { data: existing } = await supabase
          .from("suggestions")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        setHasSuggestions(!!existing && existing.length > 0);
      } catch { /* silent */ }
      setLoading(false);
    }
    loadData();
  }, [user]);

  useEffect(() => {
    if (phaseInfo?.phase === "voting" && hasSuggestions) {
      router.push("/votar");
    }
  }, [phaseInfo, hasSuggestions, router]);

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const participants = phaseInfo?.participants ?? 0;
  const suggestionsCount = phaseInfo?.suggestions ?? 0;
  const canVote = phaseInfo?.phase === "voting" || phaseInfo?.phase === "closed";
  const missing = MIN_PARTICIPANTS - participants;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/10 bg-background/80 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-300">{user?.username?.charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-white font-medium">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Qué onda, {user?.username}</h1>
          <p className="text-slate-400">Resumen de las cosas.</p>
        </motion.div>

        {/* Estado actual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GlowCard hover={false} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                phaseInfo?.phase === "suggestions"
                  ? "bg-blue-500/20 border border-blue-400/30"
                  : phaseInfo?.phase === "voting"
                  ? "bg-emerald-500/20 border border-emerald-400/30"
                  : "bg-amber-500/20 border border-amber-400/30"
              }`}>
                {phaseInfo?.phase === "suggestions" ? (
                  <FileText className="w-5 h-5 text-blue-400" />
                ) : phaseInfo?.phase === "voting" ? (
                  <Vote className="w-5 h-5 text-emerald-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-white font-semibold">Cómo vamos</h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Gente en la ronda</span>
                </div>
                <span className="text-white font-semibold">{participants}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Ideas en la mesa</span>
                </div>
                <span className="text-white font-semibold">{suggestionsCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-sm text-slate-300">Fase</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  phaseInfo?.phase === "suggestions"
                    ? "bg-blue-500/20 text-blue-300"
                    : phaseInfo?.phase === "voting"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}>
                  {phaseInfo?.phase === "suggestions" ? "Juntando ideas" : phaseInfo?.phase === "voting" ? "Votando" : "Ya cerró"}
                </span>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Acciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {!hasSuggestions && phaseInfo?.phase === "suggestions" && (
            <button
              onClick={() => router.push("/sugerir")}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all flex items-center justify-center gap-2 text-lg"
            >
              <Pencil className="w-5 h-5" />
              Agrega tus ideas
            </button>
          )}

          {hasSuggestions && !canVote && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm text-amber-300 font-medium">
                    {missing > 0
                      ? `Faltan ${missing} personas para arrancar la votación`
                      : "Esperando que el admin le dé verde a la votación"}
                  </p>
                  <p className="text-xs text-slate-400">Ya mandaste tus ideas.</p>
                </div>
              </div>
            </div>
          )}

          {canVote && hasSuggestions && (
            <button
              onClick={() => router.push("/votar")}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all flex items-center justify-center gap-2 text-lg"
            >
              <Vote className="w-5 h-5" />
              Ir a votar
            </button>
          )}

          {canVote && !hasSuggestions && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                <p className="text-sm text-red-300 font-medium">No mandaste ideas</p>
                <p className="text-xs text-slate-400">La etapa de sugerencias ya cerró. Ya no puedes votar.</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push("/pre-votacion")}
            className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-5 h-5" />
            Ver las otras ideas
          </button>
        </motion.div>
      </div>
    </div>
  );
}
