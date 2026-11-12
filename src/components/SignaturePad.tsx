"use client";

import React, { useRef, useEffect, useState } from "react";
import { PenTool, Eraser, CheckCircle2 } from "lucide-react";

interface SignaturePadProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  workerName?: string;
}

export function SignaturePad({
  value,
  onChange,
  workerName,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Inicializar o restaurar el lienzo cuando cambia `value` externamente (ej. al limpiar o editar)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!value) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Si ya hay una firma guardada y el canvas está vacío, dibujarla
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = value;
  }, [value]);

  const getCoordinates = (
    e: React.PointerEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Dibujar un punto si solo toca
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();

    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange(null);
  };

  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-50/80 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800">
            Firma de Conformidad del Trabajador
          </span>
        </div>
        <div className="flex items-center gap-2">
          {value && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Firmado
            </span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-slate-200 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition"
          >
            <Eraser className="w-3.5 h-3.5" />
            Borrar Firma
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-600 leading-snug">
        {workerName ? (
          <>
            Yo, <strong className="text-slate-900">{workerName}</strong>, hago
            constar que manejo/poseo los dispositivos registrados y confirmo la
            veracidad de los datos:
          </>
        ) : (
          <>
            El trabajador firma en el recuadro con el dedo o lápiz táctil para
            confirmar que maneja estos dispositivos:
          </>
        )}
      </p>

      {/* Lienzo táctil para firmar con el dedo en el celular o con el mouse */}
      <div className="relative bg-white rounded-xl border-2 border-dashed border-slate-300 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-36 cursor-crosshair touch-none select-none block"
        />
        {!value && !isDrawing && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <PenTool className="w-5 h-5 mb-1 opacity-50" />
            <span className="text-xs font-semibold">
              Firme aquí con el dedo
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute bottom-3 inset-x-8 border-b border-slate-300/80" />
      </div>
    </div>
  );
}
