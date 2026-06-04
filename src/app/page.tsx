"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Globe, Sparkles, Type, Loader2, Users, Vote, Shield, Hash, Play, LogIn } from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";
import { getSession, saveSession } from "@/lib/session";

const REQUISITOS = [
  {
    icon: Globe,
    title: "La extensión es tuya",
    desc: ".mx, .com.mx, .lat, .dev, .io... lo que te guste. Tú decides qué queda mejor.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-400/20",
  },
  {
    icon: Type,
    title: "Que se pueda grabar",
    desc: "Nombres fáciles de decir y recordar. Nada de \"xqbn7z.mx\".",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-400/20",
  },
  {
    icon: Sparkles,
    title: "Ponte creativo",
    desc: "Náhuatl, tech, siglas, lo que se te ocurra. No hay límites aquí.",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-400/20",
  },
];

const PASOS = [
  { num: "1", titulo: "Ponte tu alias", desc: "Un nombre y un PIN y listo", color: "from-blue-500 to-blue-600" },
  { num: "2", titulo: "Suelta ideas", desc: "Mínimo 5 nombres con su onda", color: "from-emerald-500 to-emerald-600" },
  { num: "3", titulo: "Reparte puntos", desc: "Dale más love a tus favoritos", color: "from-indigo-500 to-indigo-600" },
  { num: "4", titulo: "El ganador", desc: "El más votado se lleva el nombre", color: "from-amber-500 to-amber-600" },
];

const MIN_PARTICIPANTS = 8;

export default function Home() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phaseInfo, setPhaseInfo] = useState<{ phase: string; participants: number; suggestions: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (session) {
      router.push("/dashboard");
      return;
    }
  }, [router]);

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
      setError("El alias tiene que tener al menos 2 letras");
      setLoading(false);
      return;
    }

    if (!pin || pin.length < 4) {
      setError("El PIN necesita al menos 4 dígitos");
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
        setError(authData.error || "No se pudo registrar");
        setLoading(false);
        return;
      }

      const user = authData.user;
      saveSession(user);

      const res = await fetch("/api/config");
      const config = await res.json();

      if (config.phase === "suggestions") {
        const { data: existing } = await supabase
          .from("suggestions")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (existing && existing.length > 0) {
          router.push("/dashboard");
          return;
        }
        router.push("/sugerir");
      } else if (config.phase === "voting") {
        router.push("/votar");
      } else {
        router.push("/resultados");
      }
    } catch {
      setError("No hay conexión, checa tu red");
      setLoading(false);
    }
  }

  const canGoToVoting = phaseInfo && phaseInfo.participants >= MIN_PARTICIPANTS && phaseInfo.phase === "voting";

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 sm:py-20">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              ¿Cómo le vamos a poner
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              al proyecto?
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Entre todos decidimos el nombre. Sugiere, vota y que gane el mejor.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-center text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6">
            El proceso en 4 pasos
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-center text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Tips para tu sugerencia
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

        {phaseInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="max-w-md mx-auto mb-8"
          >
            {phaseInfo.phase === "suggestions" && (
              <div className={`rounded-xl border p-4 flex items-center gap-3 ${phaseInfo.participants >= MIN_PARTICIPANTS
                ? "bg-emerald-500/5 border-emerald-400/20"
                : "bg-blue-500/5 border-blue-400/20"
                }`}>
                <Users className={`w-5 h-5 shrink-0 ${phaseInfo.participants >= MIN_PARTICIPANTS ? "text-emerald-400" : "text-blue-400"}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${phaseInfo.participants >= MIN_PARTICIPANTS ? "text-emerald-300" : "text-blue-300"}`}>
                    {phaseInfo.participants >= MIN_PARTICIPANTS
                      ? `¡Ya somos ${phaseInfo.participants}! Se puede empezar a votar`
                      : `Van ${phaseInfo.participants} de ${MIN_PARTICIPANTS} — faltan ${MIN_PARTICIPANTS - phaseInfo.participants} para arrancar`
                    }
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{phaseInfo.suggestions} ideas en la mesa</p>
                </div>
              </div>
            )}
            {phaseInfo.phase === "voting" && (
              <div className="rounded-xl border bg-indigo-500/5 border-indigo-400/20 p-4 flex items-center gap-3">
                <Vote className="w-5 h-5 text-indigo-400 shrink-0" />
                <p className="text-sm font-medium text-indigo-300">Ya empezó la votación — entra a repartir puntos</p>
              </div>
            )}
            {phaseInfo.phase === "closed" && (
              <div className="rounded-xl border bg-amber-500/5 border-amber-400/20 p-4 flex items-center gap-3">
                <Vote className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-sm font-medium text-amber-300">Ya cerró la votación — a ver quién ganó</p>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-md mx-auto"
        >
          <GlowCard hover={false} className="p-8">
            <h2 className="text-xl font-semibold text-white mb-1">Ponte tu alias</h2>
            <p className="text-sm text-slate-400 mb-6">
              Nombre y PIN para entrar. Si ya tienes cuenta, te reconoce solito.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tu alias</label>
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
                    PIN (nuevo o el que ya tienes)
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
                  <><Play className="w-5 h-5" /> REGISTRO</>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-slate-500">o</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/pre-votacion")}
              disabled={!canGoToVoting}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-lg ${
                canGoToVoting
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
              }`}
            >
              <LogIn className="w-5 h-5" />
              Ya quiero votar
            </button>

            {!canGoToVoting && phaseInfo?.phase === "suggestions" && (
              <p className="text-xs text-slate-500 text-center mt-2">
                {phaseInfo.participants < MIN_PARTICIPANTS
                  ? `Se activa con ${MIN_PARTICIPANTS} personas (faltan ${MIN_PARTICIPANTS - phaseInfo.participants})`
                  : "Esperando que el admin active la votación"}
              </p>
            )}

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
