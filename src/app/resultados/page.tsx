"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, MessageSquare, Trophy, Loader2, UsersRound } from "lucide-react";
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
  initial_votes: number;
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
          <h1 className="text-3xl font-bold text-white">Los resultados</h1>
        </div>
        <p className="text-slate-400 mb-8">{results.length} ideas compitiendo</p>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Ideas", value: stats.total_suggestions, icon: MessageSquare, color: "text-blue-400" },
              { label: "Gente", value: stats.total_participants, icon: Users, color: "text-indigo-400" },
              { label: "Votaron", value: stats.total_voters, icon: Users, color: "text-emerald-400" },
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

        {results.length >= 2 && <Podium top3={results.slice(0, 3)} />}

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
                      {result.initial_votes > 1 && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20 w-fit">
                          <UsersRound className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-emerald-300">{result.initial_votes} personas</span>
                        </div>
                      )}
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
            <div className="text-center text-slate-400 py-12">Aún no hay resultados, espérate</div>
          )}
        </div>
      </div>
    </div>
  );
}
