"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, Plus, Trash2, Send, ArrowLeft, ArrowRight, Loader2, Globe, Mail, ExternalLink, AtSign, Hash, Users, Vote, Clock, BarChart3, Eye } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { DomainBadge } from "@/components/ui/domain-badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { User } from "@/lib/types";

const MIN_PARTICIPANTS = 8;

const EXTENSIONS = [
  { value: ".mx", label: ".mx" },
  { value: ".com.mx", label: ".com.mx" },
  { value: ".org.mx", label: ".org.mx" },
  { value: ".net.mx", label: ".net.mx" },
  { value: ".lat", label: ".lat" },
  { value: ".com", label: ".com" },
  { value: ".org", label: ".org" },
  { value: ".dev", label: ".dev" },
  { value: ".io", label: ".io" },
];

interface SuggestionField {
  domain_name: string;
  extension: string;
  meaning: string;
}

interface DuplicateCheck {
  exists: boolean;
  initialVotes: number;
  checking: boolean;
}

type Phase = "capture" | "review" | "done";

export default function SugerirPage() {
  const [user, setUser] = useState<User | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionField[]>(
    Array(5).fill(null).map(() => ({ domain_name: "", extension: ".mx", meaning: "" }))
  );
  const [phase, setPhase] = useState<Phase>("capture");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ total_suggestions: number; total_participants: number } | null>(null);
  const [duplicateChecks, setDuplicateChecks] = useState<Record<number, DuplicateCheck>>({});
  const [phaseInfo, setPhaseInfo] = useState<{ phase: string; participants: number; suggestions: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("vote_user");
    if (!stored) { router.push("/"); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    async function loadPhaseInfo() {
      try {
        const [configRes, statsRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/suggestions"),
        ]);
        const config = await configRes.json();
        const statsData = await statsRes.json();
        const participants = statsData.stats?.total_participants ?? 0;
        setPhaseInfo({
          phase: config.phase,
          participants,
          suggestions: statsData.stats?.total_suggestions ?? 0,
        });
        if (participants >= MIN_PARTICIPANTS && config.phase === "suggestions") {
          setBlocked(true);
        }
      } catch { /* silent */ }
    }
    loadPhaseInfo();
  }, []);

  const completedCount = suggestions.filter(s => s.domain_name.trim() && s.meaning.trim()).length;
  const allComplete = completedCount >= 5;

  const checkDuplicate = useCallback(async (index: number, domainName: string, extension: string) => {
    if (!domainName.trim()) {
      setDuplicateChecks(prev => ({ ...prev, [index]: { exists: false, initialVotes: 0, checking: false } }));
      return;
    }

    setDuplicateChecks(prev => ({ ...prev, [index]: { exists: false, initialVotes: 0, checking: true } }));

    try {
      const fullDomain = `${domainName.trim().toLowerCase()}${extension}`;
      const res = await fetch(`/api/check-domain?domain=${encodeURIComponent(fullDomain)}`);
      const data = await res.json();

      setDuplicateChecks(prev => ({
        ...prev,
        [index]: {
          exists: data.exists,
          initialVotes: data.initial_votes || 0,
          checking: false,
        },
      }));
    } catch {
      setDuplicateChecks(prev => ({ ...prev, [index]: { exists: false, initialVotes: 0, checking: false } }));
    }
  }, []);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    suggestions.forEach((s, i) => {
      if (s.domain_name.trim()) {
        const timer = setTimeout(() => checkDuplicate(i, s.domain_name, s.extension), 500);
        timers.push(timer);
      }
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [suggestions, checkDuplicate]);

  function updateSuggestion(index: number, field: keyof SuggestionField, value: string) {
    setSuggestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function addSuggestion() {
    setSuggestions(prev => [...prev, { domain_name: "", extension: ".mx", meaning: "" }]);
  }

  function removeSuggestion(index: number) {
    if (suggestions.length <= 5) return;
    setSuggestions(prev => prev.filter((_, i) => i !== index));
    setDuplicateChecks(prev => {
      const newChecks = { ...prev };
      delete newChecks[index];
      return newChecks;
    });
  }

  function handleReview() {
    const incomplete = suggestions.findIndex(s => !s.domain_name.trim() || !s.meaning.trim());
    if (incomplete !== -1) {
      setError(`La idea ${incomplete + 1} está incompleta`);
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
            domain_name: `${s.domain_name.trim().toLowerCase()}${s.extension}`,
            meaning: s.meaning.trim(),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {       setError(data.error || "No se pudieron guardar"); setLoading(false); return; }

      const statsRes = await fetch("/api/suggestions");
      const statsData = await statsRes.json();
      setStats(statsData.stats);
      setPhase("done");
    } catch {
      setError("No hay conexión");
      setLoading(false);
    }
  }

  if (!user) return null;

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-lg mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Se acabó el tiempo</h1>
            <p className="text-slate-400 mb-8">
              Ya hay {phaseInfo?.participants} personas registradas. La etapa de sugerencias ya cerró.
              <br />
              Pronto arrancan las votaciones.
            </p>
            <button
              onClick={() => router.push("/pre-votacion")}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
            >
              Ver qué hay en la mesa
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const isVotingPhase = phaseInfo?.phase === "voting" || phaseInfo?.phase === "closed";

    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-lg mx-auto py-12">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {/* Header de éxito */}
            <div className="text-center mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto mb-4"
              >
                <Check className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">¡Listo, ya quedó!</h1>
              <p className="text-slate-400">Gracias {user.username}, ya registramos tus ideas.</p>
            </div>

            {/* Stats del usuario */}
            <GlowCard hover={false} className="p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Tu resumen</h3>
                  <p className="text-sm text-slate-400">Tus ideas registradas</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{suggestions.length}</p>
                  <p className="text-xs text-slate-500 mt-1">tus ideas</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                  <p className="text-3xl font-bold text-indigo-400">{stats?.total_suggestions ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-1">total de ideas</p>
                </div>
              </div>
            </GlowCard>

            {/* Estado de la fase */}
            <GlowCard hover={false} className="p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">¿Qué sigue?</h3>
                  <p className="text-sm text-slate-400">Estado del cotorreo</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Participantes</span>
                  </div>
                  <span className="text-white font-semibold">{phaseInfo?.participants ?? stats?.total_participants ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">¿En qué etapa vamos?</span>
                  </div>
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

            {/* Botón de votación */}
            {phaseInfo?.phase === "suggestions" && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-300 font-medium">Las votaciones están por empezar</p>
                    <p className="text-xs text-slate-400">
                      Se activan cuando haya al menos {MIN_PARTICIPANTS} personas y el admin le dé verde.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {isVotingPhase && (
                <button
                  onClick={() => router.push("/votar")}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all flex items-center justify-center gap-2 text-lg"
                >
                  <Vote className="w-5 h-5" />
                  Ir a votar
                </button>
              )}

              <button
                onClick={() => router.push("/pre-votacion")}
                className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                Ver las ideas de todos
              </button>
            </div>

            <button onClick={() => router.push("/")}
              className="w-full mt-3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
            >
              Volver al inicio
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="min-h-screen p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto py-8">
          <button onClick={() => setPhase("capture")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Seguir editando
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Revisa tus ideas</h1>
              <p className="text-slate-400 text-sm">Dale una checada antes de mandar. Puedes editar o agregar más.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20">
              <Hash className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 font-semibold">{suggestions.length}</span>
              <span className="text-slate-400 text-sm">en total</span>
            </div>
          </div>

          <div className="space-y-4">
            {suggestions.map((s, i) => {
              const fullDomain = `${s.domain_name.trim().toLowerCase()}${s.extension}`;
              return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlowCard className="relative">
                  {editingIndex === i ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input type="text" value={s.domain_name}
                          onChange={e => updateSuggestion(i, "domain_name", e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 font-mono"
                        />
                        <select
                          value={s.extension}
                          onChange={e => updateSuggestion(i, "extension", e.target.value)}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        >
                          {EXTENSIONS.map(ext => (
                            <option key={ext.value} value={ext.value} className="bg-slate-800">{ext.label}</option>
                          ))}
                        </select>
                      </div>
                      <textarea value={s.meaning}
                        onChange={e => updateSuggestion(i, "meaning", e.target.value)} rows={2}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                      />
                      <button onClick={() => setEditingIndex(null)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >OK</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                          <span className="text-lg font-bold text-blue-300">{i + 1}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold text-lg">{s.domain_name}</span>
                                <span className="text-blue-400 font-mono text-sm">{s.extension}</span>
                              </div>
                              <div className="mt-2 pl-1 border-l-2 border-indigo-500/30 ml-1">
                                <p className="text-sm text-slate-300 pl-3 italic">&ldquo;{s.meaning}&rdquo;</p>
                              </div>
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

                          {fullDomain && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Cómo se vería</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                                  <ExternalLink className="w-3 h-3 text-blue-500/60" />
                                  {fullDomain}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                                  <Mail className="w-3 h-3 text-emerald-500/60" />
                                  contacto@{fullDomain}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                                  <ExternalLink className="w-3 h-3 text-indigo-500/60" />
                                  {fullDomain}/proyectos
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                                  <AtSign className="w-3 h-3 text-amber-500/60" />
                                  @{fullDomain}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </GlowCard>
              </motion.div>
              );
            })}
          </div>

          <button onClick={addSuggestion}
            className="w-full mt-4 py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2 text-sm"
          >
          <Plus className="w-4 h-4" /> Otra idea más
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

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Suelta tus ideas</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Mínimo 5 nombres con su significado. La extensión la tú escoges.
        </p>

        <ProgressBar value={completedCount} max={5} className="mb-8" color={allComplete ? "green" : "blue"} />

        <div className="space-y-4">
          {suggestions.map((s, i) => {
            const isComplete = s.domain_name.trim() && s.meaning.trim();
            const check = duplicateChecks[i];
            const isChecking = check?.checking;

            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlowCard hover={false} className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isComplete ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30" : "bg-white/5 text-slate-500 border border-white/10"
                    }`}>
                      {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                    <span className="text-sm text-slate-400">Idea {i + 1}{i >= 5 ? " (extra)" : ""}</span>
                    {i >= 5 && (
                      <button onClick={() => removeSuggestion(i)} className="ml-auto p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type="text" value={s.domain_name} onChange={e => updateSuggestion(i, "domain_name", e.target.value)}
                          placeholder="nombre-chido"
                          className="w-full px-4 py-2.5 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm font-mono"
                        />
                        {isChecking && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
                        )}
                      </div>
                      <select
                        value={s.extension}
                        onChange={e => updateSuggestion(i, "extension", e.target.value)}
                        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 min-w-[90px]"
                      >
                        {EXTENSIONS.map(ext => (
                          <option key={ext.value} value={ext.value} className="bg-slate-800">{ext.label}</option>
                        ))}
                      </select>
                    </div>

                    <textarea value={s.meaning} onChange={e => updateSuggestion(i, "meaning", e.target.value)}
                      placeholder="¿Por qué este nombre?"
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
              Revisar mis ideas <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
