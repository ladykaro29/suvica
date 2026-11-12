import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  BottomNav,
  HeaderUserBadge,
} from "@/components/NavigationControls";
import "./globals.css";

export const metadata: Metadata = {
  title: "SUVICA | Inventario Rápido con IA",
  description:
    "PWA móvil-primero para recolección rápida de inventario de equipos (Laptops, Celulares y Radios) con visión artificial Gemini 2.5 Flash.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Inventario IA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-100 pb-20">
        {/* Cabecera superior compacta estilo App Móvil */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="bg-white/15 p-2 rounded-xl backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5 text-blue-100" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight tracking-tight">
                  SUVICA Inventario IA
                </h1>
                <p className="text-[11px] text-blue-200 leading-none">
                  Captura Inteligente • Laptops, Celulares y Radios
                </p>
              </div>
            </Link>
            <HeaderUserBadge />
          </div>
        </header>

        {/* Contenido principal centrado para móvil */}
        <main className="flex-1 w-full max-w-lg mx-auto px-3.5 py-4">
          {children}
        </main>

        {/* Barra de navegación inferior fija (se oculta en /login) */}
        <BottomNav />
      </body>
    </html>
  );
}
