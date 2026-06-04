import { cn } from "@/lib/utils"

interface DomainBadgeProps {
    name: string
    size?: "sm" | "md" | "lg"
    className?: string
}

export function DomainBadge({ name, size = "md", className }: DomainBadgeProps) {
    const sizes = {
        sm: "text-sm px-3 py-1",
        md: "text-base px-4 py-1.5",
        lg: "text-lg px-5 py-2 font-semibold",
    }
    const clean = name.replace(/\.mx$/i, "")
    return (
        <span className={cn(
            "inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 text-blue-300 font-mono tracking-wide",
            sizes[size],
            className
        )}>
            {clean}<span className="text-blue-500">.mx</span>
        </span>
    )
}
