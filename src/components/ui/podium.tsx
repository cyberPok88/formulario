"use client"

import { motion } from "framer-motion"
import { DomainBadge } from "./domain-badge"

interface PodiumEntry {
    domain_name: string
    meaning: string
    total_points: number
}

interface PodiumProps {
    top3: PodiumEntry[]
}

export function Podium({ top3 }: PodiumProps) {
    if (top3.length < 2) return null

    const medals = ["🥇", "🥈", "🥉"]
    const heights = ["h-36", "h-28", "h-24"]
    const order = top3.length >= 3 ? [1, 0, 2] : [1, 0]
    const delays = [0.3, 0.1, 0.5]

    return (
        <div className="flex items-end justify-center gap-4 py-8">
            {order.map((idx) => {
                const entry = top3[idx]
                if (!entry) return null
                return (
                    <motion.div
                        key={idx}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: delays[idx], duration: 0.5, type: "spring" }}
                        className="flex flex-col items-center gap-3 flex-1 max-w-[200px]"
                    >
                        <span className="text-3xl">{medals[idx]}</span>
                        <DomainBadge name={entry.domain_name} size={idx === 0 ? "lg" : "sm"} />
                        <p className="text-xs text-slate-400 text-center line-clamp-2">{entry.meaning}</p>
                        <div className={`w-full ${heights[idx]} rounded-t-xl bg-gradient-to-t ${
                            idx === 0 ? "from-amber-500/20 to-amber-400/5 border-amber-400/30" :
                            idx === 1 ? "from-slate-400/20 to-slate-400/5 border-slate-400/30" :
                            "from-orange-600/20 to-orange-600/5 border-orange-600/30"
                        } border border-b-0 flex items-center justify-center`}>
                            <span className="text-2xl font-bold text-white">{entry.total_points}pts</span>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
