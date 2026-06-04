import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina clases de Tailwind de forma inteligente.
 *
 * - Resuelve conflictos: cn('p-2', 'p-4') -> 'p-4'
 * - Permite clases condicionales: cn('base', isActive && 'active')
 * - Permite override desde el padre: cn('bg-surface', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
