"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trophy, Loader2, ChevronRight, Hash, Lock, UsersRound, Mail, Globe, Heart } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import type { User, Suggestion, VoteTag } from "@/lib/types";
import { TAG_CONFIG } from "@/lib/types";

interface VoteState {
  points: number;
  tags: string[];
}

const CARD_ACCENTS = [
  { bg: "from-blue-500/10 to-indigo-500/10", border: "border-blue-400/20", ring: "ring-blue-500/30", text: "text-blue-300", pill: "bg-blue-500/20 text-blue-300" },
  { bg: "from-purple-500/10 to-pink-500/10", border: "border-purple-400/20", ring: "ring-purple-500/30", text: "text-purple-300", pill: "bg-purple-500/20 text-purple-300" },
  { bg: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-400/20", ring: "ring-emerald-500/30", text: "text-emerald-300", pill: "bg-emerald-500/20 text-emerald-300" },
  { bg: "from-amber-500/10 to-orange-500/10", border: "border-amber-400/20", ring: "ring-amber-500/30", text: "text-amber-300", pill: "bg-amber-500/20 text-amber-300" },
  { bg: "from-rose-500/10 to-red-500/10", border: "border-rose-400/20", ring: "ring-rose-500/30", text: "text-rose-300", pill: "bg-rose-500/20 text-rose-300" },
];

function parseDomain(fullName: string) {
  const extensions = [".com.mx", ".org.mx", ".net.mx", ".mx", ".lat", ".com", ".org", ".dev", ".io"];
  let clean = fullName;
  let ext = ".mx";
  for (const e of extensions) {
    if (fullName.toLowerCase().endsWith(e)) {
      clean = fullName.slice(0, -e.length);
      ext = e;
      break;
    }
  }
  return { name: clean, ext };
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
        .from("suggestions").select("id, user_id, domain_name, meaning, initial_votes, created_at");
      if (!suggestions || suggestions.length === 0) { setError("Aún no hay ideas en la mesa"); setLoading(false); return; }

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
      setError("Tienes que dar al menos 1 punto");
      return;
    }
    setError("");
    setShowPinModal(true);
    setPin("");
  }

  async function handleSubmitRound() {
    if (!pin || pin.length < 4) {
      setError("El PIN necesita al menos 4 dígitos");
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
        setError(data.error || "No se pudieron guardar tus votos");
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
      setError("No hay conexión, checa tu red");
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
            <h2 className="text-2xl font-bold text-white mb-2">Ya votaste</h2>
            <p className="text-slate-400 mb-6">Le diste a todas las opciones, {user?.username}. ¡Buen trabajo!</p>
            <button onClick={() => router.push("/resultados")}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Ver quién ganó <ChevronRight className="w-4 h-4" />
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                Ronda {roundNumber}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">¿Cuáles te gustan más?</h1>
            <p className="text-sm text-slate-400 mt-1">
              Reparte hasta <span className="text-white font-medium">{MAX_POINTS}</span> puntos entre las opciones
            </p>
          </div>
          <div className="text-center">
            <motion.div key={pointsLeft} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center"
            >
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-indigo-400">
                {pointsLeft}
              </span>
            </motion.div>
            <p className="text-xs text-slate-500 mt-1">puntos</p>
          </div>
        </div>

        <div className="space-y-5">
          {currentOptions.map((option, i) => {
            const vote = votes[option.id];
            if (!vote) return null;
            const hasPoints = vote.points > 0;
            const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
            const { name: cleanName, ext } = parseDomain(option.domain_name);
            const pointsBarWidth = (vote.points / MAX_PER_OPTION) * 100;

            return (
              <motion.div key={option.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <div className={`rounded-2xl border backdrop-blur-sm p-0 overflow-hidden transition-all duration-300 ${
                  hasPoints
                    ? `border-blue-400/40 bg-gradient-to-br ${accent.bg} ring-2 ${accent.ring} shadow-lg shadow-blue-500/10`
                    : `border-white/10 bg-white/5 hover:bg-white/[0.07] hover:border-white/15`
                }`}>
                  {/* Header: dominio grande + puntos */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Dominio grande y bonito */}
                        <div className="mb-3">
                          <span className={`text-2xl font-bold tracking-tight ${hasPoints ? "text-white" : "text-white/90"}`}>
                            {cleanName}
                          </span>
                          <span className={`text-2xl font-bold ${accent.text}`}>{ext}</span>
                        </div>

                        {/* Preview: email + web */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400">
                            <Mail className="w-3 h-3 text-slate-500" />
                            correo@{option.domain_name}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400">
                            <Globe className="w-3 h-3 text-slate-500" />
                            www.{option.domain_name}
                          </span>
                        </div>

                        {/* Significado */}
                        <div className="mt-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border-l-2 border-white/10">
                          <p className={`text-base leading-relaxed ${hasPoints ? "text-slate-200" : "text-slate-300"}`}>
                            {option.meaning}
                          </p>
                        </div>

                        {/* Duplicados */}
                        {option.initial_votes > 1 && (
                          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-400/20 w-fit">
                            <UsersRound className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-300 font-medium">{option.initial_votes} personas pensaron igual</span>
                          </div>
                        )}
                      </div>

                      {/* Panel de puntos */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <button onClick={() => addPoint(option.id)} disabled={vote.points >= MAX_PER_OPTION || pointsLeft <= 0}
                          className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:bg-slate-700 text-white flex items-center justify-center transition-all active:scale-95"
                        ><Plus className="w-5 h-5" /></button>

                        <motion.div key={vote.points} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                            hasPoints ? "bg-blue-500/20 border border-blue-400/40 text-white" : "bg-white/5 border border-white/10 text-slate-500"
                          }`}
                        >{vote.points}</motion.div>

                        <button onClick={() => removePoint(option.id)} disabled={vote.points === 0}
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-20 text-white flex items-center justify-center transition-all active:scale-95"
                        ><Minus className="w-5 h-5" /></button>
                      </div>
                    </div>

                    {/* Barra visual de puntos */}
                    {hasPoints && (
                      <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pointsBarWidth}%` }}
                          className={`h-full rounded-full bg-gradient-to-r ${accent.bg.replace("/10", "/40")}`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <AnimatePresence>
                    {hasPoints && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="px-5 py-4 border-t border-white/10 bg-white/[0.02]">
                          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                            <Heart className="w-3 h-3" /> ¿Qué te gusta de este nombre?
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(Object.entries(TAG_CONFIG) as [VoteTag["tag"], typeof TAG_CONFIG[VoteTag["tag"]]][]).map(([key, config]) => {
                              const isSelected = vote.tags.includes(key);
                              return (
                                <motion.button
                                  key={key}
                                  onClick={() => toggleTag(option.id, key)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-medium ${
                                    isSelected
                                      ? `bg-white/10 ${config.selectedBorder} ${config.selectedColor} shadow-lg`
                                      : `bg-white/5 ${config.borderColor} ${config.color} hover:bg-white/10`
                                  }`}
                                >
                                  <span className="text-lg">{config.emoji}</span>
                                  <span className="text-sm">{config.label}</span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-white/10 p-4 z-20">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <button onClick={handleSubmitClick} disabled={submitting || pointsUsed === 0}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Lock className="w-4 h-4" />
              {submitting ? "Mandando..." : pointsUsed > 0 ? `Listo, mandar mis ${pointsUsed} puntos` : "Reparte tus puntos"}
            </button>
          </div>
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
                  <h3 className="text-lg font-semibold text-white mb-1">Pon tu PIN</h3>
                  <p className="text-sm text-slate-400">Necesitamos confirmar que eres tú</p>
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
                      <>Confirma</>
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
