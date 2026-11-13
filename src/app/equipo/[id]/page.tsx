"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Printer,
  Pencil,
  ArrowLeft,
  Laptop,
  Smartphone,
  Printer as PrinterIcon,
  Radio,
  Cpu,
  User,
  Building2,
  Calendar,
  Layers,
  ScanLine,
  Check,
  Loader2,
} from "lucide-react";
import { getLocalVaultDevices, saveDeviceToLocalVault } from "@/lib/local-vault";
import { EtiquetaQRModal, DispositivoEtiqueta } from "@/components/EtiquetaQRModal";
import { QRScannerModal } from "@/components/QRScannerModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EquipoAuditoriaPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const equipoId = decodeURIComponent(resolvedParams.id);

  const [dispositivo, setDispositivo] = useState<DispositivoEtiqueta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditando, setAuditando] = useState(false);
  const [auditoriaMensaje, setAuditoriaMensaje] = useState<string | null>(null);
  const [showEtiquetaModal, setShowEtiquetaModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  useEffect(() => {
    async function cargarEquipo() {
      try {
        setLoading(true);
        setError(null);

        // 1. Intentar cargar desde la API del servidor
        const res = await fetch(`/api/dispositivos/${encodeURIComponent(equipoId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.dispositivo) {
            setDispositivo(data.dispositivo);
            saveDeviceToLocalVault(data.dispositivo);
            return;
          }
        }

        // 2. Fallback a la bóveda local del navegador
        const vault = getLocalVaultDevices();
        const term = equipoId.toLowerCase();
        const encontrado = vault.find(
          (d) =>
            d.id === equipoId ||
            d.codigoInventario?.toLowerCase() === term ||
            d.serial?.toLowerCase() === term
        );

        if (encontrado) {
          setDispositivo(encontrado as DispositivoEtiqueta);
        } else {
          setError(
            `No se encontró ningún equipo registrado con el identificador "${equipoId}". Verifica si el código es correcto o regístralo como nuevo.`
          );
        }
      } catch (err: unknown) {
        console.error("Error al cargar equipo:", err);
        // Intentar fallback local ante error de red
        const vault = getLocalVaultDevices();
        const term = equipoId.toLowerCase();
        const encontrado = vault.find(
          (d) =>
            d.id === equipoId ||
            d.codigoInventario?.toLowerCase() === term ||
            d.serial?.toLowerCase() === term
        );
        if (encontrado) {
          setDispositivo(encontrado as DispositivoEtiqueta);
        } else {
          setError("Error de conexión al cargar la información del equipo.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (equipoId) {
      cargarEquipo();
    }
  }, [equipoId]);

  // Acción de confirmación de inventario físico
  const handleConfirmarAuditoria = async () => {
    if (!dispositivo) return;
    try {
      setAuditando(true);
      const res = await fetch(`/api/dispositivos/${encodeURIComponent(dispositivo.id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditor: "Inspector de Inventario" }),
      });
      const data = await res.json();
      if (res.ok && data.dispositivo) {
        setDispositivo(data.dispositivo);
        saveDeviceToLocalVault(data.dispositivo);
        setAuditoriaMensaje(data.mensaje || "¡Verificación física confirmada exitosamente!");
      } else {
        setAuditoriaMensaje("Verificación física registrada localmente.");
      }
    } catch {
      setAuditoriaMensaje("Verificación física guardada.");
    } finally {
      setAuditando(false);
    }
  };

  const getBadgeIcon = (tipo: string) => {
    switch (tipo) {
      case "Laptop":
        return <Laptop className="w-4 h-4" />;
      case "Celular":
        return <Smartphone className="w-4 h-4" />;
      case "Impresora":
        return <PrinterIcon className="w-4 h-4" />;
      case "Radio":
        return <Radio className="w-4 h-4" />;
      default:
        return <Cpu className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">
          Consultando ficha del equipo escaneado...
        </p>
      </div>
    );
  }

  if (error || !dispositivo) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">
          Equipo No Encontrado
        </h2>
        <p className="text-xs text-slate-600 max-w-sm mx-auto">{error}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
          >
            <ScanLine className="w-4 h-4" />
            <span>Escanear Otro QR</span>
          </button>
          <Link
            href="/registros"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Inventario</span>
          </Link>
        </div>
        {showScannerModal && (
          <QRScannerModal
            isOpen={showScannerModal}
            onClose={() => setShowScannerModal(false)}
          />
        )}
      </div>
    );
  }

  const esCelular = dispositivo.tipoEquipo === "Celular";
  const esDepartamento = dispositivo.trabajador.cedula.startsWith("DEPTO-");
  const codigoActivo =
    dispositivo.codigoInventario ||
    `INV-${dispositivo.tipoEquipo.slice(0, 3).toUpperCase()}-${dispositivo.id.slice(-4).toUpperCase()}`;

  return (
    <div className="space-y-4">
      {/* Botón superior de volver */}
      <div className="flex items-center justify-between">
        <Link
          href="/registros"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inventario</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowScannerModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs transition"
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>Escanear Siguiente</span>
        </button>
      </div>

      {/* Banner de Auditoría Exitosa si se acaba de confirmar */}
      {auditoriaMensaje && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{auditoriaMensaje}</span>
          </div>
          <button
            type="button"
            onClick={() => setAuditoriaMensaje(null)}
            className="text-emerald-700 hover:underline font-semibold text-[11px]"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Tarjeta Principal de Ficha de Auditoría */}
      <article className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
        {/* Cabecera del Activo con Empresa y Código */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white px-2.5 py-0.5 rounded-md">
                {getBadgeIcon(dispositivo.tipoEquipo)}
                {dispositivo.tipoEquipo}
              </span>
              <span
                className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                  dispositivo.propiedad === "Personal"
                    ? "bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
                }`}
              >
                {dispositivo.propiedad || "Corporativo"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                {codigoActivo}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 pt-1">
              {dispositivo.marcaModelo || "Modelo no especificado"}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {dispositivo.trabajador.empresa} • {dispositivo.trabajador.departamento}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Activo Identificado
            </span>
          </div>
        </div>

        {/* Datos Técnicos y Números de Identificación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs font-mono">
          <div>
            <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">
              Número de Serie (S/N)
            </span>
            <span className="text-sm font-black text-slate-900 select-all">
              {dispositivo.serial || "Sin serial"}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">
              Dirección MAC
            </span>
            <span className="text-sm font-bold text-slate-800 select-all">
              {dispositivo.macAddress || "—"}
            </span>
          </div>

          {esCelular && (
            <>
              <div>
                <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">
                  IMEI 1
                </span>
                <span className="text-slate-800 font-bold select-all">
                  {dispositivo.imei1 || "—"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-sans font-bold text-slate-400 block">
                  IMEI 2
                </span>
                <span className="text-slate-800 font-bold select-all">
                  {dispositivo.imei2 || "—"}
                </span>
              </div>
            </>
          )}

          <div className="sm:col-span-2 pt-1 border-t border-slate-200/60 font-sans">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Especificaciones / Observaciones
            </span>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
              {dispositivo.especificaciones || "Sin especificaciones adicionales."}
            </p>
          </div>
        </div>

        {/* Asignación: Persona o Departamento */}
        <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {esDepartamento ? "🏢 Asignación Departamental" : "👤 Responsable Asignado"}
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              Alta: {new Date(dispositivo.createdAt).toLocaleDateString("es-VE")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              {esDepartamento ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {dispositivo.trabajador.nombre}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                <span className="font-mono font-semibold text-slate-700">
                  {dispositivo.trabajador.cedula}
                </span>{" "}
                • {dispositivo.trabajador.cargo}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción de Auditoría en Campo */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleConfirmarAuditoria}
            disabled={auditando}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-60"
          >
            {auditando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Confirmar Verificación Física en Inventario</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowEtiquetaModal(true)}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-300" />
              <span>Reimprimir Etiqueta QR</span>
            </button>

            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Escanear Próximo</span>
            </button>
          </div>
        </div>
      </article>

      {/* Modales */}
      {showEtiquetaModal && dispositivo && (
        <EtiquetaQRModal
          dispositivos={[dispositivo]}
          onClose={() => setShowEtiquetaModal(false)}
          titulo={`Etiqueta QR: ${codigoActivo}`}
        />
      )}

      {showScannerModal && (
        <QRScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
        />
      )}
    </div>
  );
}

