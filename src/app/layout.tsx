import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Camera, ClipboardList, ShieldCheck } from "lucide-react";
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
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-900/60 border border-blue-400/30 px-2.5 py-1 rounded-full">
              Gemini 2.5
            </span>
          </div>
        </header>

        {/* Contenido principal centrado para móvil */}
        <main className="flex-1 w-full max-w-lg mx-auto px-3.5 py-4">
          {children}
        </main>

        {/* Barra de navegación inferior fija (Mobile-First) */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto grid grid-cols-2 h-16">
            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-1 text-slate-700 hover:text-blue-600 active:bg-slate-50 transition-colors font-medium text-xs"
            >
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Capturar Equipo</span>
            </Link>
            <Link
              href="/registros"
              className="flex flex-col items-center justify-center gap-1 text-slate-700 hover:text-blue-600 active:bg-slate-50 transition-colors font-medium text-xs border-l border-slate-100"
            >
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              <span>Registros / Exportar</span>
            </Link>
          </div>
        </nav>
      </body>
    </html>
  );
}

