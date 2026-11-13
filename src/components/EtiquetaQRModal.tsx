"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Printer,
  Download,
  X,
  QrCode,
  Laptop,
  Smartphone,
  Printer as PrinterIcon,
  Radio,
  Cpu,
  Layers,
  Building2,
  User,
  ShieldCheck,
  Check,
  Share2,
} from "lucide-react";
import { generateQRDataUrl } from "@/lib/qr-generator";

export interface DispositivoEtiqueta {
  id: string;
  codigoInventario: string | null;
  tipoEquipo: string;
  propiedad?: string | null;
  marcaModelo: string | null;
  serial: string | null;
  especificaciones?: string | null;
  macAddress: string | null;
  imei1: string | null;
  imei2: string | null;
  createdAt: string | Date;
  trabajador: {
    id: string;
    cedula: string;
    nombre: string;
    cargo: string;
    departamento: string;
    empresa: string;
  };
}

interface EtiquetaQRModalProps {
  dispositivos: DispositivoEtiqueta[];
  onClose: () => void;
  titulo?: string;
}

export function EtiquetaQRModal({
  dispositivos,
  onClose,
  titulo,
}: EtiquetaQRModalProps) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [tamanoEtiqueta, setTamanoEtiqueta] = useState<"estandar" | "compacta">("estandar");
  const printableRef = useRef<HTMLDivElement>(null);

  // Generar QR para cada dispositivo (apunta a la URL de auditoría)
  useEffect(() => {
    let cancelado = false;
    async function generarTodos() {
      setGenerating(true);
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const nuevoMapa: Record<string, string> = {};

      for (const d of dispositivos) {
        try {
          const auditUrl = `${origin}/equipo/${d.id}`;
          const dataUrl = await generateQRDataUrl(auditUrl, {
            width: 220,
            margin: 1,
            errorCorrectionLevel: "M",
          });
          nuevoMapa[d.id] = dataUrl;
        } catch (e) {
          console.error("Error generando QR para:", d.id, e);
        }
      }

      if (!cancelado) {
        setQrMap(nuevoMapa);
        setGenerating(false);
      }
    }

    if (dispositivos.length > 0) {
      generarTodos();
    } else {
      setGenerating(false);
    }

    return () => {
      cancelado = true;
    };
  }, [dispositivos]);

  const handlePrint = () => {
    window.print();
  };

  const handleDescargarQR = (dataUrl: string, codigo: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `QR-${codigo || "inventario"}.png`;
    link.click();
  };

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case "Laptop":
        return <Laptop className="w-3.5 h-3.5" />;
      case "Celular":
        return <Smartphone className="w-3.5 h-3.5" />;
      case "Impresora":
        return <PrinterIcon className="w-3.5 h-3.5" />;
      case "Radio":
        return <Radio className="w-3.5 h-3.5" />;
      default:
        return <Cpu className="w-3.5 h-3.5" />;
    }
  };

  const formatearFecha = (f: string | Date) => {
    try {
      const d = new Date(f);
      return d.toLocaleDateString("es-VE", {
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      {/* Estilos específicos de impresión: oculta la interfaz y deja solo las etiquetas en cuadrícula nítida */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #seccion-impresion-etiquetas,
          #seccion-impresion-etiquetas * {
            visibility: visible !important;
          }
          #seccion-impresion-etiquetas {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
          }
          .etiqueta-print-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1.5px solid #0f172a !important;
            box-shadow: none !important;
            margin-bottom: 5mm !important;
          }
          header,
          nav,
          button {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[94vh] flex flex-col">
          {/* Cabecera del Modal */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                {titulo || `Etiquetas con Código QR (${dispositivos.length})`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generadas para rotulado físico y escaneo rápido en futuros inventarios
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Acciones y Controles de Impresión */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Formato:</span>
              <button
                type="button"
                onClick={() => setTamanoEtiqueta("estandar")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  tamanoEtiqueta === "estandar"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                Estándar (Activo Completo)
              </button>
              <button
                type="button"
                onClick={() => setTamanoEtiqueta("compacta")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  tamanoEtiqueta === "compacta"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                Compacta (Mini-Etiqueta)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={generating || dispositivos.length === 0}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimir {dispositivos.length === 1 ? "Etiqueta" : `Etiquetas (${dispositivos.length})`}</span>
              </button>
            </div>
          </div>

          {/* Vista previa con scroll de las etiquetas */}
          <div className="flex-1 overflow-y-auto pr-1">
            {generating ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <QrCode className="w-8 h-8 text-blue-500 animate-pulse mx-auto" />
                <p>Generando códigos QR de alta resolución...</p>
              </div>
            ) : dispositivos.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No hay dispositivos seleccionados para generar etiqueta.
              </div>
            ) : (
              <div
                id="seccion-impresion-etiquetas"
                ref={printableRef}
                className={`grid ${
                  tamanoEtiqueta === "compacta"
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2"
                } gap-4 p-1`}
              >
                {dispositivos.map((d) => {
                  const qrUrl = qrMap[d.id];
                  const esDepartamento = d.trabajador.cedula.startsWith("DEPTO-");
                  const codigoActivo =
                    d.codigoInventario ||
                    `INV-${d.tipoEquipo.slice(0, 3).toUpperCase()}-${d.id.slice(-4).toUpperCase()}`;

                  return (
                    <div
                      key={d.id}
                      className="etiqueta-print-card bg-white rounded-xl border-2 border-slate-900 p-3 shadow-sm flex flex-col justify-between text-slate-900 font-sans relative overflow-hidden"
                      style={{
                        minHeight: tamanoEtiqueta === "compacta" ? "140px" : "180px",
                      }}
                    >
                      {/* Cabecera de la etiqueta física */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs tracking-wider uppercase text-slate-950">
                            {d.trabajador.empresa || "SUVICA"}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                            CONTROL TI
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono font-black text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                            {codigoActivo}
                          </span>
                        </div>
                      </div>

                      {/* Cuerpo de la etiqueta: QR a la izquierda + Ficha técnica a la derecha */}
                      <div className="flex items-center gap-2.5 flex-1">
                        {/* Bloque QR */}
                        <div className="shrink-0 flex flex-col items-center">
                          {qrUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={qrUrl}
                              alt={`QR Activo ${codigoActivo}`}
                              className="w-20 h-20 sm:w-22 sm:h-22 object-contain bg-white border border-slate-300 rounded p-0.5"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                              QR...
                            </div>
                          )}
                          <span className="text-[8px] font-black uppercase text-slate-600 mt-0.5 tracking-tighter">
                            Escanear p/ Auditar
                          </span>
                        </div>

                        {/* Bloque Datos del Activo */}
                        <div className="min-w-0 flex-1 space-y-1 text-left">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                              {getIcono(d.tipoEquipo)}
                              {d.tipoEquipo}
                            </span>
                            <span className="text-[9px] font-bold uppercase text-slate-600 border border-slate-300 px-1 rounded">
                              {d.propiedad || "Corporativo"}
                            </span>
                          </div>

                          <p className="text-[11px] font-bold text-slate-950 truncate leading-tight">
                            {d.marcaModelo || "Modelo no especificado"}
                          </p>

                          <div className="text-[10px] font-mono leading-tight space-y-0.5 text-slate-800">
                            <div>
                              <span className="font-sans font-bold text-slate-500">S/N: </span>
                              <strong className="text-slate-950 font-black">{d.serial || "S/S"}</strong>
                            </div>

                            {d.macAddress && (
                              <div className="truncate">
                                <span className="font-sans font-bold text-slate-500">MAC: </span>
                                <span>{d.macAddress}</span>
                              </div>
                            )}

                            {d.tipoEquipo === "Celular" && d.imei1 && (
                              <div className="truncate">
                                <span className="font-sans font-bold text-slate-500">IMEI: </span>
                                <span>{d.imei1}</span>
                              </div>
                            )}
                          </div>

                          {/* Responsable o Departamento */}
                          <div className="text-[10px] leading-tight pt-0.5 border-t border-slate-200">
                            <p className="font-bold text-slate-900 truncate">
                              {esDepartamento ? "🏢 " : "👤 "}
                              {d.trabajador.nombre}
                            </p>
                            <p className="text-[9px] text-slate-600 truncate">
                              {d.trabajador.departamento} • {formatearFecha(d.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pie de seguridad de la etiqueta */}
                      <div className="mt-1.5 pt-1 border-t border-slate-800 text-[8px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                        <span>SUVICA • NO REMOVER ETIQUETA</span>
                        {qrUrl && (
                          <button
                            type="button"
                            onClick={() => handleDescargarQR(qrUrl, codigoActivo)}
                            className="text-blue-700 hover:underline print:hidden flex items-center gap-0.5 font-bold"
                            title="Descargar solo imagen QR en PNG"
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span>PNG</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pie de modal con instrucciones y botón cerrar */}
          <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <p className="text-[11px] text-slate-500">
              💡 <strong>Tip:</strong> Puedes imprimir en papel adhesivo estándar o rotuladora. Al escanear con cualquier celular abrirá la ficha técnica del equipo.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

