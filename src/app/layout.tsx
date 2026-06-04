import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-jakarta",
    display: "swap",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: {
        template: "%s | Proyecto Tenochtitlan",
        default: "Votación de Dominio — Proyecto Tenochtitlan",
    },
    description: "Elige el mejor dominio .mx para nuestro proyecto",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`dark ${jakarta.variable}`}>
            <body className="antialiased font-sans bg-background text-foreground min-h-screen">
                {children}
            </body>
        </html>
    );
}
