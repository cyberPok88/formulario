"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * ThemeProvider — Wrapper sobre next-themes.
 *
 * Provee el contexto de tema (dark/light/system + paletas) a toda la app.
 * Debe envolver el contenido del RootLayout en src/app/layout.tsx.
 *
 * La configuración (attribute, defaultTheme, enableSystem) se pasa
 * desde layout.tsx — este componente no toma decisiones de configuración.
 *
 * No se reemplaza en guías posteriores. Es infraestructura permanente.
 */
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <NextThemesProvider {...props}>
            {children}
        </NextThemesProvider>
    )
}
