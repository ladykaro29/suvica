"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Laptop,
  Smartphone,
  Printer,
  Radio as RadioIcon,
  Cpu,
  User,
  Building2,
  Calendar,
  Layers,
  Users,
  List,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  UserCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  PenTool,
  QrCode,
  ScanLine,
} from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";
import { EtiquetaQRModal } from "@/components/EtiquetaQRModal";
import { QRScannerModal } from "@/components/QRScannerModal";
import {
  mergeServerDevicesWithVault,
  saveDeviceToLocalVault,
  markDeviceDeletedInVault,
  getLocalVaultDevices,
} from "@/lib/local-vault";

type TipoEquipo = "Laptop" | "Celular" | "Impresora" | "Radio" | "Otro";
type PropiedadEquipo = "Corporativo" | "Personal";

interface DispositivoConTrabajador {
  id: string;
  codigoInventario: string | null;
  tipoEquipo: TipoEquipo;
  propiedad?: PropiedadEquipo | string;
  marcaModelo: string | null;
  serial: string | null;
  especificaciones: string | null;
  macAddress: string | null;
  imei1: string | null;
  imei2: string | null;
  firmaConformidad?: string | null;
  createdAt: string;
  trabajador: {
    id: string;
    cedula: string;
    nombre: string;
    cargo: string;
    departamento: string;
    empresa: string;
  };
}

export default function RegistrosPage() {
  const [todosDispositivos, setTodosDispositivos] = useState<
    DispositivoConTrabajador[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("");
  const [propiedadFiltro, setPropiedadFiltro] = useState<string>("");
  const [vistaModo, setVistaModo] = useState<"por-persona" | "por-equipo">(
    "por-persona"
  );

  // Estado de empleados desplegados (acordeón: por defecto cerrados para ver solo el nombre)
  const [expandedWorkers, setExpandedWorkers] = useState<
    Record<string, boolean>
  >({});

  // Estado para edición y eliminación de registros guardados
  const [editingDevice, setEditingDevice] =
    useState<DispositivoConTrabajador | null>(null);
  const [editForm, setEditForm] = useState({
    tipoEquipo: "Laptop" as TipoEquipo,
    propiedad: "Corporativo" as PropiedadEquipo,
    codigoInventario: "",
    marcaModelo: "",
    serial: "",
    especificaciones: "",
    macAddress: "",
    imei1: "",
    imei2: "",
    firmaConformidad: null as string | null,
    aplicarFirmaATodos: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<"postgresql" | "local" | null>(
    null
  );
  const [etiquetaDevices, setEtiquetaDevices] = useState<
    DispositivoConTrabajador[] | null
  >(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  const cargarRegistros = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dispositivos");
      const data = await res.json();
      if (res.ok && Array.isArray(data.dispositivos)) {
        const { merged, missingOnServer } = mergeServerDevicesWithVault(
          data.dispositivos
        );
        setTodosDispositivos(merged as DispositivoConTrabajador[]);
        if (data.storageMode) {
          setStorageMode(data.storageMode);
        }

        // Auto-resincronización: si el navegador tenía algún registro en la bóveda local que no estaba en la BD, subirlo automáticamente
        if (missingOnServer.length > 0) {
          for (const missing of missingOnServer) {
            try {
              const syncRes = await fetch("/api/dispositivos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  trabajadorId: missing.trabajador.id,
                  trabajadorCedula: missing.trabajador.cedula,
                  trabajadorData: missing.trabajador,
                  codigoInventario: missing.codigoInventario,
                  tipoEquipo: missing.tipoEquipo,
                  propiedad: missing.propiedad || "Corporativo",
                  marcaModelo: missing.marcaModelo,
                  serial: missing.serial,
                  especificaciones: missing.especificaciones,
                  macAddress: missing.macAddress,
                  imei1: missing.imei1,
                  imei2: missing.imei2,
                  firmaConformidad: missing.firmaConformidad || null,
                }),
              });
              if (syncRes.ok) {
                const synced = await syncRes.json();
                saveDeviceToLocalVault(synced);
              }
            } catch {
              // Se reintentará en la próxima carga
            }
          }
        }
      } else {
        const fallbackLocal = getLocalVaultDevices();
        if (fallbackLocal.length > 0) {
          setTodosDispositivos(fallbackLocal as DispositivoConTrabajador[]);
        }
      }
    } catch (error) {
      console.error("Error cargando dispositivos:", error);
      const fallbackLocal = getLocalVaultDevices();
      if (fallbackLocal.length > 0) {
        setTodosDispositivos(fallbackLocal as DispositivoConTrabajador[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarRegistros();
  }, [cargarRegistros]);

  // Filtrado instantáneo en memoria (0ms de espera al escribir o cambiar filtros)
  const dispositivos = useMemo(() => {
    const term = q.trim().toLowerCase();
    return todosDispositivos.filter((d) => {
      if (tipoFiltro && d.tipoEquipo !== tipoFiltro) return false;
      if (propiedadFiltro && (d.propiedad || "Corporativo") !== propiedadFiltro)
        return false;
      if (!term) return true;
      return (
        d.codigoInventario?.toLowerCase().includes(term) ||
        d.marcaModelo?.toLowerCase().includes(term) ||
        d.serial?.toLowerCase().includes(term) ||
        d.especificaciones?.toLowerCase().includes(term) ||
        d.macAddress?.toLowerCase().includes(term) ||
        d.imei1?.toLowerCase().includes(term) ||
        d.imei2?.toLowerCase().includes(term) ||
        d.trabajador.nombre.toLowerCase().includes(term) ||
        d.trabajador.cedula.toLowerCase().includes(term) ||
        d.trabajador.departamento.toLowerCase().includes(term) ||
        d.trabajador.empresa.toLowerCase().includes(term)
      );
    });
  }, [todosDispositivos, q, tipoFiltro, propiedadFiltro]);

  const toggleWorkerExpand = (trabajadorId: string) => {
    setExpandedWorkers((prev) => ({
      ...prev,
      [trabajadorId]: !prev[trabajadorId],
    }));
  };

  // Abrir modal de edición con los datos actuales del dispositivo
  const handleOpenEdit = (d: DispositivoConTrabajador) => {
    setEditingDevice(d);
    setEditForm({
      tipoEquipo: d.tipoEquipo,
      propiedad: d.propiedad === "Personal" ? "Personal" : "Corporativo",
      codigoInventario: d.codigoInventario ?? "",
      marcaModelo: d.marcaModelo ?? "",
      serial: d.serial ?? "",
      especificaciones: d.especificaciones ?? "",
      macAddress: d.macAddress ?? "",
      imei1: d.imei1 ?? "",
      imei2: d.imei2 ?? "",
      firmaConformidad: d.firmaConformidad ?? null,
      aplicarFirmaATodos: true,
    });
  };

  // Guardar cambios del registro editado (PUT /api/dispositivos)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDevice) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/dispositivos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingDevice.id,
          trabajadorId: editingDevice.trabajador.id,
          tipoEquipo: editForm.tipoEquipo,
          propiedad: editForm.propiedad,
          codigoInventario: editForm.codigoInventario,
          marcaModelo: editForm.marcaModelo,
          serial: editForm.serial,
          especificaciones: editForm.especificaciones,
          macAddress: editForm.macAddress,
          imei1: editForm.tipoEquipo === "Celular" ? editForm.imei1 : null,
          imei2: editForm.tipoEquipo === "Celular" ? editForm.imei2 : null,
          firmaConformidad: editForm.firmaConformidad,
          aplicarFirmaATodos: editForm.aplicarFirmaATodos,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar el registro.");
      }
      saveDeviceToLocalVault(data);
      setTodosDispositivos((prev) =>
        prev.map((item) => {
          if (item.id === editingDevice.id) return data;
          if (
            editForm.firmaConformidad &&
            editForm.aplicarFirmaATodos &&
            item.trabajador.id === editingDevice.trabajador.id
          ) {
            return { ...item, firmaConformidad: editForm.firmaConformidad };
          }
          return item;
        })
      );
      setEditingDevice(null);
    } catch (error: unknown) {
      alert(
        error instanceof Error
          ? error.message
          : "Error al guardar los cambios del dispositivo."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // Eliminar un registro guardado
  const handleDeleteDevice = async (d: DispositivoConTrabajador) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el equipo ${d.tipoEquipo} (${
        d.marcaModelo || "Sin modelo"
      }) asignado a ${d.trabajador.nombre}?`
    );
    if (!confirmar) return;

    setDeletingId(d.id);
    try {
      const res = await fetch(`/api/dispositivos?id=${d.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        markDeviceDeletedInVault(d.id);
        setTodosDispositivos((prev) => prev.filter((item) => item.id !== d.id));
      }
    } catch (error) {
      console.error("Error eliminando registro:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // Calcular cuántos dispositivos maneja cada trabajador y agruparlos por trabajador
  const conteoPorTrabajador = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dispositivos) {
      map.set(d.trabajador.id, (map.get(d.trabajador.id) || 0) + 1);
    }
    return map;
  }, [dispositivos]);

  const gruposPorTrabajador = useMemo(() => {
    const grupos = new Map<
      string,
      {
        trabajador: DispositivoConTrabajador["trabajador"];
        equipos: DispositivoConTrabajador[];
      }
    >();

    for (const d of dispositivos) {
      const existing = grupos.get(d.trabajador.id);
      if (existing) {
        existing.equipos.push(d);
      } else {
        grupos.set(d.trabajador.id, {
          trabajador: d.trabajador,
          equipos: [d],
        });
      }
    }

    return Array.from(grupos.values());
  }, [dispositivos]);

  const getBadgeIcon = (tipo: string) => {
    switch (tipo) {
      case "Laptop":
        return <Laptop className="w-3.5 h-3.5" />;
      case "Celular":
        return <Smartphone className="w-3.5 h-3.5" />;
      case "Impresora":
        return <Printer className="w-3.5 h-3.5" />;
      case "Radio":
        return <RadioIcon className="w-3.5 h-3.5" />;
      default:
        return <Cpu className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera de exportación y resumen */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                Inventario General ({dispositivos.length} equipos en{" "}
                {gruposPorTrabajador.length}{" "}
                {gruposPorTrabajador.length === 1 ? "empleado" : "empleados"})
              </h2>
              {storageMode && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    storageMode === "postgresql"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
                >
                  {storageMode === "postgresql"
                    ? "● BD PostgreSQL Permanente"
                    : "● Memoria Local"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Toca el nombre de un empleado para desplegar sus dispositivos y
              firma
            </p>
          </div>
          <button
            type="button"
            onClick={cargarRegistros}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Selector de modo de visualización: Agrupado por Persona vs Lista de Equipos */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setVistaModo("por-persona")}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              vistaModo === "por-persona"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Por Empleado ({gruposPorTrabajador.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setVistaModo("por-equipo")}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              vistaModo === "por-equipo"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Por Dispositivo ({dispositivos.length})</span>
          </button>
        </div>

        {/* Botones de Descarga CSV, Excel e Impresión de Etiquetas QR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setEtiquetaDevices(dispositivos)}
            disabled={dispositivos.length === 0}
            className="py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
            title="Generar e imprimir etiquetas QR para los equipos mostrados"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Etiquetas QR ({dispositivos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="py-2.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
            title="Abrir cámara para escanear QR de un equipo"
          >
            <ScanLine className="w-4 h-4 text-white" />
            <span>Escanear QR</span>
          </button>
          <a
            href="/api/dispositivos?format=csv"
            download
            className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </a>
          <a
            href="/api/dispositivos?format=excel"
            download
            className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </a>
        </div>
      </section>

      {/* Filtros de búsqueda y categoría */}
      <section className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 space-y-2.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filtrar por empleado, cédula, serial, MAC, IMEI o modelo..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {["", "Laptop", "Celular", "Impresora", "Radio", "Otro"].map(
            (tipo) => {
              const active = tipoFiltro === tipo;
              return (
                <button
                  key={tipo || "all"}
                  type="button"
                  onClick={() => setTipoFiltro(tipo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tipo || "Todos los Tipos"}
                </button>
              );
            }
          )}
        </div>

        {/* Filtro por Propiedad: Corporativo vs Personal */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { id: "", label: "Corporativos y Personales" },
            { id: "Corporativo", label: "Solo Corporativos" },
            { id: "Personal", label: "Solo Personales" },
          ].map((item) => {
            const active = propiedadFiltro === item.id;
            return (
              <button
                key={item.id || "all-prop"}
                type="button"
                onClick={() => setPropiedadFiltro(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                  active
                    ? item.id === "Personal"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* CONTENIDO: Vista Agrupada y Desplegable por Empleado o Lista Individual */}
      <section className="space-y-2.5">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            Cargando registros de inventario...
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            No hay equipos registrados que coincidan con el filtro actual.
          </div>
        ) : vistaModo === "por-persona" ? (
          gruposPorTrabajador.map(({ trabajador, equipos }) => {
            const isExpanded = Boolean(expandedWorkers[trabajador.id]);
            const firmaEmpleado =
              equipos.find((e) => Boolean(e.firmaConformidad))
                ?.firmaConformidad ?? null;

            return (
              <article
                key={trabajador.id}
                className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition"
              >
                {/* Cabecera Desplegable: Muestra el Nombre del Empleado y Cantidad de Equipos */}
                <button
                  type="button"
                  onClick={() => toggleWorkerExpand(trabajador.id)}
                  className="w-full text-left px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {trabajador.cedula.startsWith("DEPTO-") ? (
                        <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <User className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {trabajador.nombre}
                      </h3>
                      {trabajador.cedula.startsWith("DEPTO-") && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                          🏢 Equipo de Departamento
                        </span>
                      )}
                      {firmaEmpleado ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Firmado
                        </span>
                      ) : (
                        !trabajador.cedula.startsWith("DEPTO-") && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                            Sin firma
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      <span className="font-mono font-semibold text-slate-700">
                        {trabajador.cedula}
                      </span>{" "}
                      • {trabajador.cargo} ({trabajador.empresa})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-blue-600 text-white px-2.5 py-1 rounded-full">
                      <Layers className="w-3.5 h-3.5" />
                      {equipos.length}
                    </span>
                    <div className="p-1 rounded-lg bg-slate-100 text-slate-600">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Contenido Desplegable al hacer clic en el empleado */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/40">
                    <div className="space-y-2">
                      {equipos.map((d, index) => {
                        const esCelular = d.tipoEquipo === "Celular";
                        return (
                          <div
                            key={d.id}
                            className="bg-white rounded-xl p-3 border border-slate-200/90 space-y-2 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                                  {getBadgeIcon(d.tipoEquipo)}
                                  Equipo #{index + 1}: {d.tipoEquipo}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                                    d.propiedad === "Personal"
                                      ? "bg-amber-100 text-amber-800 border-amber-200"
                                      : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  }`}
                                >
                                  {d.propiedad || "Corporativo"}
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {d.marcaModelo || "Sin modelo especificado"}
                                </span>
                                {d.codigoInventario && (
                                  <span className="text-[10px] font-mono font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                    #{d.codigoInventario}
                                  </span>
                                )}
                              </div>

                              {/* Botones de Etiqueta QR, Editar y Eliminar */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEtiquetaDevices([d])}
                                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition"
                                  title="Generar e imprimir etiqueta con código QR"
                                >
                                  <QrCode className="w-3 h-3 text-blue-300" />
                                  <span>QR</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(d)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition"
                                  title="Editar o firmar este registro"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingId === d.id}
                                  onClick={() => handleDeleteDevice(d)}
                                  className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition"
                                  title="Eliminar este registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {d.especificaciones && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200/60">
                                {d.especificaciones}
                              </p>
                            )}

                            <div
                              className={`grid grid-cols-1 ${
                                esCelular ? "sm:grid-cols-4" : "sm:grid-cols-2"
                              } gap-1.5 text-[11px] font-mono pt-0.5`}
                            >
                              <div>
                                <span className="text-[10px] text-slate-400 font-sans font-semibold">
                                  S/N:{" "}
                                </span>
                                <span className="text-slate-800 font-semibold">
                                  {d.serial || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 font-sans font-semibold">
                                  MAC:{" "}
                                </span>
                                <span className="text-slate-800 font-semibold">
                                  {d.macAddress || "—"}
                                </span>
                              </div>
                              {esCelular && (
                                <>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-sans font-semibold">
                                      IMEI 1:{" "}
                                    </span>
                                    <span className="text-slate-800 font-semibold">
                                      {d.imei1 || "—"}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 font-sans font-semibold">
                                      IMEI 2:{" "}
                                    </span>
                                    <span className="text-slate-800 font-semibold">
                                      {d.imei2 || "—"}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Recuadro de Firma de Conformidad del Empleado */}
                    <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-blue-600" />
                          Conformidad de {trabajador.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {firmaEmpleado
                            ? "El empleado firmó en conformidad la tenencia y datos de estos dispositivos."
                            : "Este empleado aún no ha registrado su firma digital."}
                        </p>
                      </div>

                      {firmaEmpleado ? (
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={firmaEmpleado}
                            alt={`Firma de ${trabajador.nombre}`}
                            className="h-14 w-36 object-contain bg-slate-50 border border-slate-200 rounded-lg p-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(equipos[0])}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Cambiar firma
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(equipos[0])}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Firmar Ahora</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          dispositivos.map((d) => {
            const totalDeEsteTrabajador =
              conteoPorTrabajador.get(d.trabajador.id) || 1;
            const esCelular = d.tipoEquipo === "Celular";

            return (
              <article
                key={d.id}
                className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {getBadgeIcon(d.tipoEquipo)}
                        {d.tipoEquipo}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${
                          d.propiedad === "Personal"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {d.propiedad || "Corporativo"}
                      </span>
                      {d.firmaConformidad && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Firmado
                        </span>
                      )}
                      {d.codigoInventario && (
                        <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                          #{d.codigoInventario}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {d.marcaModelo || "Marca / Modelo no especificado"}
                    </h3>
                  </div>

                  {/* Botones de Etiqueta QR, Editar y Eliminar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEtiquetaDevices([d])}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition"
                      title="Generar e imprimir etiqueta con código QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-300" />
                      <span>QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(d)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === d.id}
                      onClick={() => handleDeleteDevice(d)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {d.especificaciones && (
                  <p className="text-xs text-slate-600 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-lg">
                    {d.especificaciones}
                  </p>
                )}

                <div
                  className={`grid grid-cols-1 ${
                    esCelular ? "sm:grid-cols-4" : "sm:grid-cols-2"
                  } gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-mono`}
                >
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-sans font-semibold">
                      Serial (S/N)
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {d.serial || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-sans font-semibold">
                      MAC Address
                    </span>
                    <span className="text-slate-800 font-semibold">
                      {d.macAddress || "—"}
                    </span>
                  </div>
                  {esCelular && (
                    <>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-sans font-semibold">
                          IMEI 1
                        </span>
                        <span className="text-slate-800 font-semibold">
                          {d.imei1 || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-sans font-semibold">
                          IMEI 2
                        </span>
                        <span className="text-slate-800 font-semibold">
                          {d.imei2 || "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex flex-wrap items-center gap-1.5 font-medium text-slate-800">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{d.trabajador.nombre}</span>
                    <span className="text-slate-400 font-mono">
                      ({d.trabajador.cedula})
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      <Layers className="w-2.5 h-2.5" />
                      Maneja {totalDeEsteTrabajador}{" "}
                      {totalDeEsteTrabajador === 1 ? "equipo" : "equipos"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {d.trabajador.empresa} • {d.trabajador.departamento}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.createdAt).toLocaleDateString("es-VE")}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* MODAL PARA EDITAR UN DISPOSITIVO GUARDADO O FIRMAR */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-600" />
                  Editar Dispositivo y Firma
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Empleado:{" "}
                  <strong className="text-slate-800">
                    {editingDevice.trabajador.nombre}
                  </strong>{" "}
                  ({editingDevice.trabajador.cedula})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingDevice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              {/* Tipo de Equipo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Categoría del Equipo *
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    ["Laptop", "Celular", "Impresora", "Radio", "Otro"] as const
                  ).map((tipo) => {
                    const active = editForm.tipoEquipo === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            tipoEquipo: tipo,
                            ...(tipo !== "Celular"
                              ? { imei1: "", imei2: "" }
                              : {}),
                          })
                        }
                        className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tipo}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Propiedad: Corporativo vs Personal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ¿Es Corporativo o Personal? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({ ...editForm, propiedad: "Corporativo" })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      editForm.propiedad === "Corporativo"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Corporativo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({ ...editForm, propiedad: "Personal" })
                    }
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      editForm.propiedad === "Personal"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Personal</span>
                  </button>
                </div>
              </div>

              {/* Marca / Modelo y Código de Inventario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marca y Modelo
                  </label>
                  <input
                    type="text"
                    value={editForm.marcaModelo}
                    onChange={(e) =>
                      setEditForm({ ...editForm, marcaModelo: e.target.value })
                    }
                    placeholder="Ej. Lenovo ThinkPad / Samsung A54"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Inventario / Activo
                  </label>
                  <input
                    type="text"
                    value={editForm.codigoInventario}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        codigoInventario: e.target.value,
                      })
                    }
                    placeholder="Ej. SUV-0042"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Serial y MAC Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número de Serie (S/N)
                  </label>
                  <input
                    type="text"
                    value={editForm.serial}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        serial: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="S/N o Service Tag"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dirección MAC
                  </label>
                  <input
                    type="text"
                    value={editForm.macAddress}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        macAddress: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                  />
                </div>
              </div>

              {/* IMEI 1 e IMEI 2 solo para Celular */}
              {editForm.tipoEquipo === "Celular" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1">
                      IMEI 1 (15 dígitos)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={17}
                      value={editForm.imei1}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          imei1: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1">
                      IMEI 2 (Dual SIM)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={17}
                      value={editForm.imei2}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          imei2: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white text-sm font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Especificaciones */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Especificaciones / Características / Observaciones
                </label>
                <input
                  type="text"
                  value={editForm.especificaciones}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      especificaciones: e.target.value,
                    })
                  }
                  placeholder="RAM, procesador, capacidad, estado, accesorios..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              {/* Cuadro de Firma Digital también dentro del modal de edición */}
              <div className="space-y-2 pt-1">
                <SignaturePad
                  value={editForm.firmaConformidad}
                  onChange={(sig) =>
                    setEditForm({ ...editForm, firmaConformidad: sig })
                  }
                  workerName={editingDevice.trabajador.nombre}
                />
                <label className="flex items-center gap-2 text-xs text-slate-700 font-medium px-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.aplicarFirmaATodos}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        aplicarFirmaATodos: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Aplicar esta firma a todos los dispositivos de{" "}
                    <strong>{editingDevice.trabajador.nombre}</strong>
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDevice(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Generación e Impresión de Etiquetas con Código QR */}
      {etiquetaDevices && (
        <EtiquetaQRModal
          dispositivos={etiquetaDevices}
          onClose={() => setEtiquetaDevices(null)}
          titulo={
            etiquetaDevices.length === 1
              ? `Etiqueta QR: ${
                  etiquetaDevices[0].codigoInventario ||
                  etiquetaDevices[0].marcaModelo ||
                  "Equipo"
                }`
              : `Etiquetas QR de Inventario (${etiquetaDevices.length} equipos)`
          }
        />
      )}

      {/* Modal de Escaneo en Vivo con Cámara */}
      {showScannerModal && (
        <QRScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
        />
      )}
    </div>
  );
}
