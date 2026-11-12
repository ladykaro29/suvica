"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, ClipboardList, LogOut } from "lucide-react";

export function HeaderUserBadge() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") {
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-900/60 border border-blue-400/30 px-2.5 py-1 rounded-full">
        Acceso Seguro
      </span>
    );
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-1.5 rounded-xl transition"
      title="Cerrar sesión"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Salir</span>
    </button>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-lg mx-auto grid grid-cols-2 h-16">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center gap-1 transition-colors font-semibold text-xs ${
            pathname === "/"
              ? "text-blue-600 bg-blue-50/50"
              : "text-slate-600 hover:text-blue-600"
          }`}
        >
          <Camera className="w-5 h-5" />
          <span>Capturar Equipo</span>
        </Link>
        <Link
          href="/registros"
          className={`flex flex-col items-center justify-center gap-1 transition-colors font-semibold text-xs border-l border-slate-100 ${
            pathname === "/registros"
              ? "text-indigo-600 bg-indigo-50/50"
              : "text-slate-600 hover:text-indigo-600"
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span>Registros / Exportar</span>
        </Link>
      </div>
    </nav>
  );
}
