import { cn } from "@/lib/utils"

interface GlowCardProps {
    children: React.ReactNode
    className?: string
    hover?: boolean
}

export function GlowCard({ children, className, hover = true }: GlowCardProps) {
    return (
        <div className={cn(
            "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6",
            hover && "transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:shadow-premium-md",
            className
        )}>
            {children}
        </div>
    )
}
