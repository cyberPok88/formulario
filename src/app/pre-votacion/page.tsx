"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Users, FileText, Vote, Eye, LogOut, Loader2, ListChecks, ArrowLeft } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { DomainBadge } from "@/components/ui/domain-badge";
import { getSession, clearSession } from "@/lib/session";
import type { User, Suggestion } from "@/lib/types";

const MIN_PARTICIPANTS = 8;

export default function PreVotacionPage() {
  const [user, setUser] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [phaseInfo, setPhaseInfo] = useState<{ phase: string; participants: number; suggestions: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
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
      try {
        const [configRes, suggestionsRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/suggestions"),
        ]);
        const config = await configRes.json();
        const suggestionsData = await suggestionsRes.json();
        setPhaseInfo({
          phase: config.phase,
          participants: suggestionsData.stats?.total_participants ?? 0,
          suggestions: suggestionsData.stats?.total_suggestions ?? 0,
        });
        setSuggestions(suggestionsData.suggestions || []);
      } catch { /* silent */ }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (phaseInfo?.phase === "voting") {
      router.push("/votar");
    }
  }, [phaseInfo, router]);

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
  const missing = MIN_PARTICIPANTS - participants;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

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
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Próximamente las votaciones</h1>
          <p className="text-slate-400">Estamos reuniendo las opciones de todos los participantes.</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <GlowCard hover={false} className="text-center">
            <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{participants}</p>
            <p className="text-sm text-slate-400">participantes</p>
            {missing > 0 && (
              <p className="text-xs text-amber-400 mt-1">Faltan {missing} para habilitar votación</p>
            )}
          </GlowCard>

          <GlowCard hover={false} className="text-center">
            <FileText className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{suggestionsCount}</p>
            <p className="text-sm text-slate-400">opciones propuestas</p>
          </GlowCard>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Progreso de participantes</span>
            <span className="text-white font-medium">{participants}/{MIN_PARTICIPANTS}</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((participants / MIN_PARTICIPANTS) * 100, 100)}%` }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className={`h-full rounded-full ${
                participants >= MIN_PARTICIPANTS
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
              }`}
            />
          </div>
        </motion.div>

        {/* Botón ver sugerencias */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            {showAll ? <ListChecks className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            {showAll ? "Ocultar opciones" : `Ver las ${suggestionsCount} opciones`}
          </button>
        </motion.div>

        {/* Lista de sugerencias */}
        {showAll && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3 mb-8"
          >
            {suggestions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <GlowCard hover={false} className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-blue-300">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <DomainBadge name={s.domain_name} size="sm" />
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Mensaje */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-6 text-center"
        >
          <Vote className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold mb-2">¿Listo para votar?</h3>
          <p className="text-sm text-slate-400">
            Las votaciones se habilitarán automáticamente cuando hayan al menos {MIN_PARTICIPANTS} participantes.
            <br />
            <span className="text-amber-400">Sé paciente mientras juntamos las opciones de todos.</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
