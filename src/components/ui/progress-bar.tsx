"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
    value: number
    max: number
    className?: string
    color?: "blue" | "green" | "amber"
}

export function ProgressBar({ value, max, className, color = "blue" }: ProgressBarProps) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    const gradients = {
        blue: "from-blue-500 to-indigo-500",
        green: "from-emerald-500 to-teal-500",
        amber: "from-amber-500 to-orange-500",
    }
    return (
        <div className={cn("h-2 bg-white/10 rounded-full overflow-hidden", className)}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("h-full rounded-full bg-gradient-to-r", gradients[color])}
            />
        </div>
    )
}
