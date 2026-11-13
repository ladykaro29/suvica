"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QRScannerModal } from "@/components/QRScannerModal";
import { ScanLine, ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";

export default function EscanearPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(true);

  const handleScanSuccess = (decoded: string) => {
    // Si contiene la URL de un equipo
    if (decoded.includes("/equipo/")) {
      const parts = decoded.split("/equipo/");
      const id = parts[1]?.split("?")[0]?.split("/")[0]?.trim();
      if (id) {
        router.push(`/equipo/${id}`);
        return;
      }
    }

    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      window.location.href = decoded;
    } else {
      router.push(`/equipo/${encodeURIComponent(decoded)}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-slate-200 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
          <QrCode className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">
            Escáner de Activos con Código QR
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Apunta la cámara a la etiqueta física pegada en el equipo para abrir su ficha técnica de auditoría en tiempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition"
        >
          <ScanLine className="w-4 h-4" />
          <span>Iniciar Cámara para Escanear</span>
        </button>

        <div className="pt-2">
          <Link
            href="/registros"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a la lista de inventario</span>
          </Link>
        </div>
      </div>

      <QRScannerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}

