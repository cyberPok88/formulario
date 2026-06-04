"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Globe, Sparkles, Type, ArrowRight, Loader2, Users, Vote, Shield, Hash, Play } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";

const REQUISITOS = [
  {
    icon: Globe,
    title: "Extension .mx",
    desc: "Se derermino el uso de .mx como base, pero puedes cambiar la extención como prefieras. Tú decides cuál representa mejor al proyecto.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-400/20",
  },
  {
    icon: Type,
    title: "Nombres cortos",
    desc: "Representativos del proyecto Tenochtitlan. Fáciles de recordar y escribir.",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-400/20",
  },
  {
    icon: Sparkles,
    title: "Sé creativo",
    desc: "Todas las propuestas son válidas. Juega con náhuatl, tech, siglas, lo que se te ocurra.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-400/20",
  },
];

const PASOS = [
  { num: "1", titulo: "Identifícate", desc: "Ingresa alias y crea tu PIN de 4 dígitos", color: "from-blue-500 to-blue-600" },
  { num: "2", titulo: "Sugiere 5+ dominios", desc: "Con su significado o interpretación", color: "from-emerald-500 to-emerald-600" },
  { num: "3", titulo: "Vota por rondas", desc: "Reparte puntos entre tus favoritos", color: "from-indigo-500 to-indigo-600" },
  { num: "4", titulo: "Resultado final", desc: "El dominio con más votos gana", color: "from-amber-500 to-amber-600" },
];

export default function Home() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phaseInfo, setPhaseInfo] = useState<{ phase: string; participants: number; suggestions: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadStatus() {
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
      } catch { /* silent */ }
    }
    loadStatus();
  }, []);

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

    if (!pin || pin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      setLoading(false);
      return;
    }

    try {
      const authRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed, pin, mode: "register" }),
      });

      const authData = await authRes.json();

      if (!authRes.ok) {
        setError(authData.error || "Error al registrar");
        setLoading(false);
        return;
      }

      const user = authData.user;
      localStorage.setItem("vote_user", JSON.stringify(user));

      const res = await fetch("/api/config");
      const config = await res.json();

      if (config.phase === "suggestions") {
        const { data: existing } = await supabase
          .from("suggestions")
          .select("id")
          .eq("user_id", user.id)
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

        {/* Cómo funciona - Sección prominente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-center text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            Cómo funciona
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PASOS.map((paso, i) => (
              <motion.div
                key={paso.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <GlowCard className="h-full text-center">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${paso.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <span className="text-xl font-bold text-white">{paso.num}</span>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-1">{paso.titulo}</h3>
                  <p className="text-sm text-slate-400">{paso.desc}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Requisitos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-center text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Requisitos
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {REQUISITOS.map((req, i) => (
              <motion.div
                key={req.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <GlowCard className={`h-full ${req.bgColor} border ${req.borderColor}`}>
                  <req.icon className={`w-7 h-7 ${req.color} mb-3`} />
                  <h3 className="text-white font-semibold text-base mb-1">{req.title}</h3>
                  <p className="text-sm text-slate-300">{req.desc}</p>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Phase status banner */}
        {phaseInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="max-w-md mx-auto mb-8"
          >
            {phaseInfo.phase === "suggestions" && (
              <div className={`rounded-xl border p-4 flex items-center gap-3 ${phaseInfo.participants >= 5
                ? "bg-emerald-500/5 border-emerald-400/20"
                : "bg-blue-500/5 border-blue-400/20"
                }`}>
                <Users className={`w-5 h-5 shrink-0 ${phaseInfo.participants >= 5 ? "text-emerald-400" : "text-blue-400"}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${phaseInfo.participants >= 5 ? "text-emerald-300" : "text-blue-300"}`}>
                    {phaseInfo.participants >= 5
                      ? `${phaseInfo.participants} participantes listos — la votación puede iniciar`
                      : `${phaseInfo.participants} de 5 participantes — faltan ${5 - phaseInfo.participants}`
                    }
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{phaseInfo.suggestions} sugerencias recibidas</p>
                </div>
              </div>
            )}
            {phaseInfo.phase === "voting" && (
              <div className="rounded-xl border bg-indigo-500/5 border-indigo-400/20 p-4 flex items-center gap-3">
                <Vote className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-sm font-medium text-indigo-300">Fase de votación activa — entra y reparte tus puntos</p>
              </div>
            )}
            {phaseInfo.phase === "closed" && (
              <div className="rounded-xl border bg-amber-500/5 border-amber-400/20 p-4 flex items-center gap-3">
                <Vote className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm font-medium text-amber-300">Votación cerrada — ve los resultados finales</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Registro form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-md mx-auto"
        >
          <GlowCard hover={false} className="p-8">
            <h2 className="text-xl font-semibold text-white mb-1">Regístrate</h2>
            <p className="text-sm text-slate-400 mb-6">
              Elige un nombre de usuario y crea tu PIN para comenzar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej: juan_dev"
                  autoFocus
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-400" />
                    PIN (nuevo)
                  </span>
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="4 a 6 dígitos"
                  disabled={loading}
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm tracking-[0.5em] text-center text-lg font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all duration-200 text-lg"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Entrando...</>
                ) : (
                  <><Play className="w-5 h-5" /> COMENZAR</>
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
      </div>
    </div>
  );
}
