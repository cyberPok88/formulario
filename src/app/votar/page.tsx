"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trophy, Loader2, ChevronRight, Hash, Lock } from "lucide-react";
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
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
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

  function handleSubmitClick() {
    const voteData = Object.entries(votes).filter(([, v]) => v.points > 0);
    if (voteData.length === 0) {
      setError("Asigna al menos 1 punto");
      return;
    }
    setError("");
    setShowPinModal(true);
    setPin("");
  }

  async function handleSubmitRound() {
    if (!pin || pin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }

    setSubmitting(true);
    setError("");
    const voteData = Object.entries(votes).filter(([, v]) => v.points > 0).map(([id, v]) => ({ suggestion_id: id, points: v.points, tags: v.tags }));

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user!.id, round_number: roundNumber, votes: voteData, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al votar");
        setSubmitting(false);
        if (data.error?.includes("PIN")) {
          setPin("");
        }
        return;
      }

      const newVoted = new Set(votedIds);
      for (const opt of currentOptions) newVoted.add(opt.id);
      setVotedIds(newVoted);
      setShowPinModal(false);
      setPin("");
      loadNextRound(allSuggestions, newVoted, roundNumber + 1);
      setSubmitting(false);
    } catch {
      setError("Error de conexión");
      setSubmitting(false);
    }
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

      <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-white/10 p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <button onClick={handleSubmitClick} disabled={submitting || pointsUsed === 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all text-lg flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {submitting ? "Enviando..." : `Enviar votos · ${pointsUsed} puntos usados`}
          </button>
        </div>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowPinModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm"
            >
              <GlowCard hover={false} className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-4">
                    <Hash className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">Confirmar PIN</h3>
                  <p className="text-sm text-slate-400">Ingresa tu PIN para validar tu voto</p>
                </div>

                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="4 a 6 dígitos"
                  disabled={submitting}
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-center text-lg font-mono tracking-[0.5em] mb-4"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && pin.length >= 4 && !submitting) {
                      handleSubmitRound();
                    }
                  }}
                />

                {error && (
                  <p className="text-red-400 text-sm text-center mb-4">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPinModal(false)}
                    disabled={submitting}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitRound}
                    disabled={submitting || pin.length < 4}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                    ) : (
                      <>Confirmar</>
                    )}
                  </button>
                </div>
              </GlowCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
