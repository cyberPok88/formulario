"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, Plus, Trash2, Send, ArrowLeft, ArrowRight, Loader2, Globe, Mail, ExternalLink, AtSign } from "lucide-react";
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

          <div className="space-y-4">
            {suggestions.map((s, i) => {
              const clean = s.domain_name.trim().replace(/\.mx$/i, "").toLowerCase();
              return (
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
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <DomainBadge name={s.domain_name} size="md" />
                          <div className="mt-3 pl-1 border-l-2 border-indigo-500/30 ml-1">
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

                      {clean && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">Así se vería</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                              <ExternalLink className="w-3 h-3 text-blue-500/60" />
                              {clean}.mx
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                              <Mail className="w-3 h-3 text-emerald-500/60" />
                              contacto@{clean}.mx
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                              <ExternalLink className="w-3 h-3 text-indigo-500/60" />
                              {clean}.mx/proyectos
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-xs font-mono text-slate-400">
                              <AtSign className="w-3 h-3 text-amber-500/60" />
                              @{clean}.mx
                            </span>
                          </div>
                        </div>
                      )}
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
