import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════════
// VARIANTES DEL BOTÓN
// Cada variante tiene un propósito semántico claro:
// - default: acción principal de la vista (solo una por pantalla)
// - secondary: acción secundaria o complementaria
// - outline: acción terciaria o de navegación
// - ghost: acción discreta — toolbars, iconos, menús
// - destructive: acciones irreversibles (eliminar, cancelar pedido)
// - link: navegación inline en texto
// ═══════════════════════════════════════════════════════════════════
const buttonVariants = cva(
    // Base: comportamiento y tipografía comunes a todas las variantes
    [
        "inline-flex items-center justify-center gap-2",
        "whitespace-nowrap rounded-md text-sm font-medium",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    ].join(" "),
    {
        variants: {
            variant: {
                // Acción principal: gradiente sutil + sombra de elevación mínima
                // El gradiente va del accent puro a un tono 10% más oscuro
                default: [
                    "bg-primary-accent text-primary-accent-text",
                    "bg-gradient-to-b from-primary-accent to-primary-accent/90",
                    "shadow-premium-sm",
                    "hover:opacity-95 hover:shadow-premium-md",
                    "active:shadow-none active:translate-y-px",
                ].join(" "),

                // Acción destructiva: rojo semántico del sistema
                destructive: [
                    "bg-error text-primary-accent-text",
                    "shadow-premium-sm",
                    "hover:opacity-90",
                    "active:shadow-none active:translate-y-px",
                ].join(" "),

                // Acción secundaria: fondo surface con borde definido
                outline: [
                    "border border-border bg-surface text-foreground",
                    "hover:bg-hover-background hover:shadow-premium-inner",
                    "active:bg-hover-background",
                ].join(" "),

                // Acción complementaria: fondo secondary-accent suave
                secondary: [
                    "bg-secondary-accent-bg text-secondary-accent",
                    "hover:bg-secondary-accent/20",
                ].join(" "),

                // Acción discreta: sin fondo hasta el hover
                ghost: [
                    "text-foreground",
                    "hover:bg-hover-background hover:text-foreground",
                ].join(" "),

                // Navegación inline: solo subrayado, sin fondo
                link: [
                    "text-primary-accent underline-offset-4",
                    "hover:underline",
                ].join(" "),
            },
            size: {
                // sm: formularios compactos, toolbars con espacio limitado
                sm:      "h-8 rounded-md px-3 text-xs",
                // default: uso general
                default: "h-9 px-4 py-2",
                // lg: CTAs destacados, botones de submit en formularios principales
                lg:      "h-10 rounded-md px-8",
                // icon: botones de solo ícono — toolbar, topbar, acciones de tabla
                icon:    "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    /**
     * Si true, el Button renderiza como su hijo directo usando Radix Slot.
     * Útil para usar el estilo de Button en un componente Link de Next.js:
     * <Button asChild><Link href="/dashboard">Ir al dashboard</Link></Button>
     */
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        // Slot permite que el Button "preste" sus estilos a su hijo
        // sin romper la semántica HTML ni el árbol de componentes
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
