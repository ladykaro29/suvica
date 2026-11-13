"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  X,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ScanLine,
} from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (decodedText: string) => void;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: QRScannerModalProps) {
  const router = useRouter();
  const scannerRef = useRef<unknown>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerId = "html5-qr-reader-container";

  // Función para reproducir un beep de confirmación de lectura exitosa
  const playBeep = () => {
    try {
      if (typeof window !== "undefined") {
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        }
      }
    } catch {
      // AudioContext no disponible o bloqueado por política de usuario
    }
  };

  const procesarLectura = useCallback(
    (decodedText: string) => {
      if (isProcessing) return;
      setIsProcessing(true);
      playBeep();
      setScanResult(decodedText);

      if (onScanSuccess) {
        onScanSuccess(decodedText);
        return;
      }

      // Si el texto escaneado es una URL a /equipo/[id]
      try {
        if (decodedText.includes("/equipo/")) {
          const parts = decodedText.split("/equipo/");
          const equipoId = parts[1]?.split("?")[0]?.split("/")[0]?.trim();
          if (equipoId) {
            router.push(`/equipo/${equipoId}`);
            onClose();
            return;
          }
        }
      } catch {
        // Fallback a redirección directa
      }

      // Si es un ID o código directo
      if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
        window.location.href = decodedText;
      } else {
        // Redirigir a la vista de auditoría con ese ID/código
        router.push(`/equipo/${encodeURIComponent(decodedText)}`);
        onClose();
      }
    },
    [isProcessing, onScanSuccess, router, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let html5QrCode: any = null;
    let mounted = true;

    async function initScanner() {
      try {
        setErrorMsg(null);
        setScanResult(null);
        setIsProcessing(false);

        const { Html5Qrcode } = await import("html5-qrcode");

        // Asegurarse de que el elemento contenedor exista en el DOM
        const el = document.getElementById(containerId);
        if (!el || !mounted) return;

        html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        if (html5QrCode) {
          await html5QrCode.start(
            { facingMode: "environment" }, // Preferir cámara trasera en teléfonos móviles
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
            },
            (decodedText: string) => {
              if (mounted) {
                procesarLectura(decodedText);
              }
            },
            () => {
              // Frame sin código QR detectado (no es un error crítico)
            }
          );
        }
      } catch (err: unknown) {
        if (mounted) {
          console.warn("No se pudo iniciar la cámara en vivo:", err);
          setErrorMsg(
            "No se pudo acceder a la cámara trasera. Asegúrate de otorgar permisos o sube una foto con el código QR."
          );
        }
      }
    }

    const timer = setTimeout(() => {
      initScanner();
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const scanner = scannerRef.current as any;
          scanner
            .stop()
            .then(() => {
              try {
                scanner.clear();
              } catch {}
            })
            .catch(() => {});
        } catch {
          // Ignorar error al desmontar
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, procesarLectura]);

  // Manejo de escaneo mediante foto subida desde galería o cámara nativa
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("html5-qr-reader-temp");
      const result = await html5QrCode.scanFile(file, true);
      procesarLectura(result);
    } catch {
      setErrorMsg(
        "No se detectó ningún código QR nítido en la imagen seleccionada. Intenta con una foto más cercana."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 my-auto relative">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Escanear Etiqueta QR
              </h3>
              <p className="text-[11px] text-slate-500">
                Auditoría instantánea de equipos en inventario
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visor de Cámara de Escaneo */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-blue-600 aspect-square flex items-center justify-center">
            {/* Contenedor donde html5-qrcode renderiza el video */}
            <div id={containerId} className="w-full h-full" />
            <div id="html5-qr-reader-temp" className="hidden" />

            {/* Animación de escaneo superpuesta */}
            {!scanResult && !errorMsg && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
                <div className="w-56 h-56 border-2 border-dashed border-white/60 rounded-2xl relative flex items-center justify-center">
                  <div className="w-full h-0.5 bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)] animate-pulse" />
                </div>
                <span className="text-[11px] font-bold text-white/90 bg-black/60 px-3 py-1 rounded-full mt-3 backdrop-blur-xs">
                  Apunta la cámara al código QR del equipo
                </span>
              </div>
            )}

            {/* Mensaje de Resultado Exitoso */}
            {scanResult && (
              <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center space-y-2 z-10">
                <CheckCircle2 className="w-12 h-12 animate-bounce" />
                <h4 className="text-base font-bold">¡Código QR Detectado!</h4>
                <p className="text-xs text-emerald-100 font-mono truncate max-w-full px-2">
                  {scanResult}
                </p>
                <p className="text-[11px] text-white/90 animate-pulse">
                  Abriendo ficha de auditoría...
                </p>
              </div>
            )}
          </div>

          {/* Alerta de Error si la cámara no abrió */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Botón para subir foto alternativa con el QR */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <label className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition border border-slate-200">
              <Upload className="w-4 h-4" />
              <span>Subir Foto con QR</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

