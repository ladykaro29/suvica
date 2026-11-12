"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Camera,
  Search,
  UserCheck,
  UserPlus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Laptop,
  Smartphone,
  Radio as RadioIcon,
  Cpu,
  Save,
  RotateCcw,
  Building2,
  Briefcase,
  X,
  ArrowRight,
  Layers,
  Hash,
  FileText,
} from "lucide-react";
import { compressImageClient } from "@/lib/image-compression";

type TipoEquipo = "Laptop" | "Celular" | "Radio" | "Otro";

export interface DispositivoResumen {
  id: string;
  codigoInventario: string | null;
  tipoEquipo: TipoEquipo;
  marcaModelo: string | null;
  serial: string | null;
  especificaciones: string | null;
  macAddress: string | null;
  imei1: string | null;
  imei2: string | null;
  createdAt: string;
}

export interface Trabajador {
  id: string;
  cedula: string;
  nombre: string;
  cargo: string;
  departamento: string;
  empresa: string;
  dispositivos?: DispositivoResumen[];
  _count?: {
    dispositivos: number;
  };
}

export default function CapturaInventarioPage() {
  // Estado de trabajadores y buscador autocompletable
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] =
    useState<Trabajador | null>(null);

  // Modal rápido para crear trabajador en campo si no existe
  const [showNewWorkerModal, setShowNewWorkerModal] = useState(false);
  const [newWorker, setNewWorker] = useState({
    cedula: "",
    nombre: "",
    cargo: "",
    departamento: "",
    empresa: "SUVICA",
  });
  const [savingWorker, setSavingWorker] = useState(false);

  // Estado de captura fotográfica y análisis IA
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
    sizeKB: number;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Estado del formulario de dispositivo (adaptable por tipo)
  const [tipoEquipo, setTipoEquipo] = useState<TipoEquipo>("Laptop");
  const [codigoInventario, setCodigoInventario] = useState("");
  const [marcaModelo, setMarcaModelo] = useState("");
  const [serial, setSerial] = useState("");
  const [especificaciones, setEspecificaciones] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");

  // Estado de guardado y notificaciones
  const [savingDevice, setSavingDevice] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Cargar trabajadores (incluyendo su conteo y lista de dispositivos)
  const fetchTrabajadores = async (keepSelectedId?: string) => {
    try {
      setLoadingTrabajadores(true);
      const res = await fetch("/api/trabajadores");
      const data = await res.json();
      if (res.ok && Array.isArray(data.trabajadores)) {
        setTrabajadores(data.trabajadores);
        if (keepSelectedId) {
          const updated = data.trabajadores.find(
            (t: Trabajador) => t.id === keepSelectedId
          );
          if (updated) {
            setSelectedTrabajador(updated);
          }
        }
      }
    } catch (error) {
      console.error("Error cargando trabajadores:", error);
    } finally {
      setLoadingTrabajadores(false);
    }
  };

  useEffect(() => {
    fetchTrabajadores();
  }, []);

  // Filtrado instantáneo por nombre, cédula, empresa o departamento
  const filteredTrabajadores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trabajadores.slice(0, 15);
    return trabajadores
      .filter(
        (t) =>
          t.nombre.toLowerCase().includes(q) ||
          t.cedula.toLowerCase().includes(q) ||
          t.departamento.toLowerCase().includes(q) ||
          t.empresa.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [trabajadores, searchQuery]);

  const handleSelectTrabajador = (t: Trabajador) => {
    setSelectedTrabajador(t);
    setSearchQuery(`${t.nombre} (${t.cedula})`);
    setDropdownOpen(false);
    setStatusMessage(null);
  };

  const handleClearTrabajador = () => {
    setSelectedTrabajador(null);
    setSearchQuery("");
    setDropdownOpen(true);
  };

  // Cambiar tipo de equipo manualmente (limpia IMEI si cambia a un equipo sin IMEI)
  const handleSelectTipoEquipo = (nuevoTipo: TipoEquipo) => {
    setTipoEquipo(nuevoTipo);
    if (nuevoTipo !== "Celular") {
      setImei1("");
      setImei2("");
    }
  };

  // Manejar captura de cámara, compresión cliente a máx 1200px JPEG 0.8 y envío a Gemini
  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    setAnalyzing(true);

    try {
      // 1. Comprimir en el cliente a máx 1200px con JPEG 0.8
      const compressed = await compressImageClient(file, 1200, 0.8);
      setPreviewImage(compressed.dataUrl);
      setImageMeta({
        width: compressed.width,
        height: compressed.height,
        sizeKB: compressed.sizeKB,
      });

      // 2. Enviar imagen base64 a /api/analizar-foto
      const response = await fetch("/api/analizar-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressed.dataUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo analizar la fotografía con IA."
        );
      }

      // 3. Rellenar formulario adaptando los campos al tipo de equipo detectado
      const detectedType: TipoEquipo =
        data.tipoEquipo &&
        ["Laptop", "Celular", "Radio", "Otro"].includes(data.tipoEquipo)
          ? (data.tipoEquipo as TipoEquipo)
          : tipoEquipo;

      setTipoEquipo(detectedType);
      setMarcaModelo(data.marcaModelo ?? "");
      setSerial(data.serial ?? "");
      setEspecificaciones(data.especificaciones ?? "");
      setMacAddress(data.macAddress ?? "");

      if (detectedType === "Celular") {
        setImei1(data.imei1 ?? "");
        setImei2(data.imei2 ?? "");
      } else {
        setImei1("");
        setImei2("");
      }

      if (data.codigoInventario) {
        setCodigoInventario(data.codigoInventario);
      }

      setStatusMessage({
        type: "info",
        text: `IA detectó: ${detectedType}${
          data.marcaModelo ? ` (${data.marcaModelo})` : ""
        }. Verifica los campos antes de guardar.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar la fotografía.";
      setStatusMessage({
        type: "error",
        text: msg,
      });
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const resetDeviceForm = () => {
    setPreviewImage(null);
    setImageMeta(null);
    setCodigoInventario("");
    setMarcaModelo("");
    setSerial("");
    setEspecificaciones("");
    setMacAddress("");
    setImei1("");
    setImei2("");
  };

  // Guardar el dispositivo en PostgreSQL
  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrabajador) {
      setStatusMessage({
        type: "error",
        text: "Primero debes seleccionar al trabajador en el Paso 1.",
      });
      return;
    }

    setSavingDevice(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/dispositivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trabajadorId: selectedTrabajador.id,
          codigoInventario,
          tipoEquipo,
          marcaModelo,
          serial,
          especificaciones,
          macAddress,
          imei1: tipoEquipo === "Celular" ? imei1 : null,
          imei2: tipoEquipo === "Celular" ? imei2 : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar el equipo.");
      }

      resetDeviceForm();
      await fetchTrabajadores(selectedTrabajador.id);

      setStatusMessage({
        type: "success",
        text: `Equipo (${data.tipoEquipo} ${
          data.marcaModelo || ""
        }) guardado para ${selectedTrabajador.nombre}. Si esta persona maneja otro dispositivo adicional, puedes escanearlo enseguida.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "No se pudo guardar el registro.";
      setStatusMessage({
        type: "error",
        text: msg,
      });
    } finally {
      setSavingDevice(false);
    }
  };

  // Crear nuevo trabajador desde el modal rápido
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWorker(true);
    try {
      const res = await fetch("/api/trabajadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorker),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error registrando trabajador");
      }
      await fetchTrabajadores(data.id);
      handleSelectTrabajador(data);
      setShowNewWorkerModal(false);
      setNewWorker({
        cedula: "",
        nombre: "",
        cargo: "",
        departamento: "",
        empresa: "SUVICA",
      });
    } catch (err: unknown) {
      alert(
        err instanceof Error ? err.message : "Error al crear el trabajador."
      );
    } finally {
      setSavingWorker(false);
    }
  };

  // Conteo y desglose de dispositivos que maneja el trabajador seleccionado
  const dispositivosTrabajador = selectedTrabajador?.dispositivos || [];
  const totalEquiposTrabajador =
    selectedTrabajador?._count?.dispositivos ?? dispositivosTrabajador.length;

  const resumenPorTipo = useMemo(() => {
    const counts = { Laptop: 0, Celular: 0, Radio: 0, Otro: 0 };
    for (const d of dispositivosTrabajador) {
      if (counts[d.tipoEquipo] !== undefined) {
        counts[d.tipoEquipo]++;
      }
    }
    return counts;
  }, [dispositivosTrabajador]);

  // Textos dinámicos según el tipo de equipo seleccionado
  const configCampos = useMemo(() => {
    switch (tipoEquipo) {
      case "Laptop":
        return {
          tituloSeccion: "Datos de la Laptop (Sin IMEI)",
          placeholderModelo: "Ej. Lenovo ThinkPad T14 / Dell Latitude 5430",
          labelSerial: "Número de Serie / Service Tag (S/N) *",
          placeholderSerial: "Ej. PF3XYZ12 / 8H2K9P3",
          labelSpecs: "Especificaciones (Procesador, RAM, Disco, Cargador)",
          placeholderSpecs:
            "Ej. Intel Core i5, 16GB RAM, 512GB SSD, Cargador 65W",
          labelMac: "Dirección MAC Wi-Fi / Ethernet (XX:XX:XX:XX:XX:XX)",
          mostrarImei: false,
        };
      case "Celular":
        return {
          tituloSeccion: "Datos del Teléfono Celular (Con IMEI)",
          placeholderModelo: "Ej. Samsung Galaxy A54 5G / Xiaomi Redmi Note 13",
          labelSerial: "Número de Serie (S/N)",
          placeholderSerial: "Ej. R58W40ABCDE (Opcional)",
          labelSpecs: "Características (Capacidad GB, RAM, Modelo Técnico, Línea)",
          placeholderSpecs: "Ej. 256GB / 8GB RAM • SM-A546E/DS • Corporativo",
          labelMac: "Dirección MAC Wi-Fi / Bluetooth (XX:XX:XX:XX:XX:XX)",
          mostrarImei: true,
        };
      case "Radio":
        return {
          tituloSeccion: "Datos del Radio Portátil / Comunicaciones (Sin IMEI)",
          placeholderModelo: "Ej. Motorola MOTOTRBO R7 / DEP450 / Hytera",
          labelSerial: "Número de Serie del Radio (S/N) *",
          placeholderSerial: "Ej. 871TZN1492",
          labelSpecs: "Banda (UHF/VHF), Frecuencia, ID Digital o Batería",
          placeholderSpecs: "Ej. UHF 400-527 MHz • 4W • Con cargador y antena",
          labelMac: "Dirección MAC / ID Bluetooth (Si aplica)",
          mostrarImei: false,
        };
      default:
        return {
          tituloSeccion: "Datos del Equipo / Otro Activo (Sin IMEI)",
          placeholderModelo: "Ej. Monitor Dell 24\" / Impresora Epson / Tablet",
          labelSerial: "Número de Serie (S/N)",
          placeholderSerial: "Ej. CN-0ABC123-742",
          labelSpecs: "Especificaciones Técnicas / Estado / Accesorios",
          placeholderSpecs: "Ej. Resolución FHD, incluye cable de poder",
          labelMac: "Dirección MAC (Si tiene tarjeta de red)",
          mostrarImei: false,
        };
    }
  }, [tipoEquipo]);

  return (
    <div className="space-y-4">
      {/* PASO 1: Selección de Trabajador y Cantidad de Dispositivos que Maneja */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[11px]">
              1
            </span>
            Trabajador y Cantidad de Equipos
          </label>
          <button
            type="button"
            onClick={() => setShowNewWorkerModal(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nuevo
          </button>
        </div>

        {/* Buscador Autocompletable */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedTrabajador(null);
                setDropdownOpen(true);
              }}
              placeholder={
                loadingTrabajadores
                  ? "Cargando nómina de trabajadores..."
                  : "Buscar por nombre o cédula (ej. V-15234890)..."
              }
              className="w-full pl-10 pr-9 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
            {(searchQuery || selectedTrabajador) && (
              <button
                type="button"
                onClick={handleClearTrabajador}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                title="Limpiar selección"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Lista desplegable de sugerencias mostrando cuántos equipos maneja cada persona */}
          {dropdownOpen && !selectedTrabajador && (
            <div className="absolute z-20 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {filteredTrabajadores.length === 0 ? (
                <div className="p-3.5 text-center text-xs text-slate-500 space-y-2">
                  <p>No se encontraron trabajadores con &quot;{searchQuery}&quot;.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowNewWorkerModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-blue-600 font-semibold underline"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Registrar nuevo
                    trabajador
                  </button>
                </div>
              ) : (
                filteredTrabajadores.map((t) => {
                  const cant =
                    t._count?.dispositivos ?? t.dispositivos?.length ?? 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTrabajador(t)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 active:bg-blue-100/60 transition flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {t.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          <span className="font-mono font-semibold text-slate-700">
                            {t.cedula}
                          </span>{" "}
                          • {t.cargo}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            cant > 0
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          {cant} {cant === 1 ? "equipo" : "equipos"}
                        </span>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {t.empresa} • {t.departamento}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Tarjeta resumen del trabajador seleccionado + Cantidad y Lista de Dispositivos que maneja */}
        {selectedTrabajador && (
          <div className="mt-3 bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-blue-950 font-bold text-sm">
                  <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{selectedTrabajador.nombre}</span>
                </div>
                <p className="text-xs text-slate-600 font-mono">
                  C.I: <strong>{selectedTrabajador.cedula}</strong> •{" "}
                  {selectedTrabajador.cargo}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    <Building2 className="w-3 h-3 text-blue-600" />
                    {selectedTrabajador.empresa}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                    <Briefcase className="w-3 h-3 text-indigo-600" />
                    {selectedTrabajador.departamento}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearTrabajador}
                className="text-[11px] text-blue-700 hover:underline font-semibold shrink-0"
              >
                Cambiar
              </button>
            </div>

            {/* Contador de dispositivos que maneja esta persona */}
            <div className="bg-white rounded-xl p-3 border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Dispositivos que maneja esta persona:
                </span>
                <span className="text-xs font-extrabold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                  {totalEquiposTrabajador}{" "}
                  {totalEquiposTrabajador === 1 ? "registrado" : "registrados"}
                </span>
              </div>

              {/* Desglose por tipo */}
              <div className="grid grid-cols-4 gap-1.5 text-center pt-0.5">
                <div className="bg-slate-50 rounded-lg py-1.5 px-1 border border-slate-200/70">
                  <p className="text-xs font-bold text-slate-900">
                    {resumenPorTipo.Laptop}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Laptops
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg py-1.5 px-1 border border-slate-200/70">
                  <p className="text-xs font-bold text-slate-900">
                    {resumenPorTipo.Celular}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Celulares
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg py-1.5 px-1 border border-slate-200/70">
                  <p className="text-xs font-bold text-slate-900">
                    {resumenPorTipo.Radio}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Radios
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg py-1.5 px-1 border border-slate-200/70">
                  <p className="text-xs font-bold text-slate-900">
                    {resumenPorTipo.Otro}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Otros
                  </p>
                </div>
              </div>

              {/* Lista compacta de los equipos ya escaneados de este trabajador */}
              {dispositivosTrabajador.length > 0 && (
                <div className="pt-1.5 border-t border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Equipos ya registrados a {selectedTrabajador.nombre}:
                  </p>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {dispositivosTrabajador.map((d, idx) => (
                      <div
                        key={d.id}
                        className="text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/70 flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-slate-800 truncate">
                          {idx + 1}. [{d.tipoEquipo}]{" "}
                          {d.marcaModelo || "Sin modelo"}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {d.tipoEquipo === "Celular" && d.imei1
                            ? `IMEI: ${d.imei1}`
                            : d.serial
                            ? `S/N: ${d.serial}`
                            : d.macAddress || ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* PASO 2: Botón grande de Cámara Trasera + Compresión + Visión IA */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[11px]">
              2
            </span>
            Escaneo Fotográfico con IA{" "}
            {selectedTrabajador
              ? `(Equipo #${totalEquiposTrabajador + 1})`
              : ""}
          </label>
          {imageMeta && (
            <span className="text-[11px] text-slate-500 font-mono">
              {imageMeta.width}x{imageMeta.height}px • {imageMeta.sizeKB}KB
            </span>
          )}
        </div>

        {/* Input oculto conectado a la cámara trasera del teléfono */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapturePhoto}
          className="hidden"
        />

        <button
          type="button"
          disabled={analyzing}
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-5 px-4 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 active:scale-[0.99] text-white shadow-lg shadow-blue-600/25 transition flex flex-col items-center justify-center gap-2 disabled:opacity-60"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-9 h-9 animate-spin text-blue-200" />
              <span className="text-base font-bold">
                Analizando fotografía con Gemini IA...
              </span>
              <span className="text-xs text-blue-200 text-center">
                Detectando tipo de equipo, Marca, Modelo, Serial, MAC, IMEI y
                especificaciones
              </span>
            </>
          ) : (
            <>
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight">
                {previewImage
                  ? "Tomar Otra Fotografía"
                  : "Abrir Cámara y Escanear Equipo"}
              </span>
              <span className="text-xs text-blue-100 text-center max-w-xs">
                Fotografía la etiqueta de la Laptop, Radio o pantalla *#06# del
                Celular. La IA adaptará los campos automáticamente.
              </span>
            </>
          )}
        </button>

        {/* Previsualización miniatura si se tomó foto */}
        {previewImage && (
          <div className="mt-3 flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Vista previa del equipo"
              className="w-16 h-16 object-cover rounded-lg border border-slate-300 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Imagen optimizada en cliente (JPEG 80%)</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Resolución enviada: {imageMeta?.width}×{imageMeta?.height}px (
                {imageMeta?.sizeKB} KB)
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Alertas de estado (éxito, error o información IA) */}
      {statusMessage && (
        <div
          className={`rounded-xl p-3.5 border text-xs font-medium flex items-start gap-2.5 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : statusMessage.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusMessage.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p>{statusMessage.text}</p>
            {statusMessage.type === "success" && (
              <Link
                href="/registros"
                className="inline-flex items-center gap-1 mt-1.5 font-bold text-emerald-700 underline"
              >
                Ver tabla general de equipos registrados{" "}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* PASO 3: Formulario Inteligente adaptado a cada Tipo de Dispositivo */}
      <form
        onSubmit={handleSaveDevice}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[11px]">
              3
            </span>
            {configCampos.tituloSeccion}
          </label>
          <button
            type="button"
            onClick={resetDeviceForm}
            className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </button>
        </div>

        {/* Selector visual de Tipo de Equipo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Categoría del Dispositivo *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                { id: "Laptop", label: "Laptop", icon: Laptop },
                { id: "Celular", label: "Celular", icon: Smartphone },
                { id: "Radio", label: "Radio", icon: RadioIcon },
                { id: "Otro", label: "Otro", icon: Cpu },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const active = tipoEquipo === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectTipoEquipo(id)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Marca/Modelo y Código de Inventario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Marca y Modelo *
            </label>
            <input
              type="text"
              value={marcaModelo}
              onChange={(e) => setMarcaModelo(e.target.value)}
              placeholder={configCampos.placeholderModelo}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:border-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Código de Inventario / Activo
            </label>
            <input
              type="text"
              value={codigoInventario}
              onChange={(e) => setCodigoInventario(e.target.value)}
              placeholder="Ej. SUV-0042 (Si tiene etiqueta)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono focus:bg-white focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        {/* Número de Serie (S/N o Service Tag) — Clave para Laptops, Radios y Celulares */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-blue-600" />
            {configCampos.labelSerial}
          </label>
          <input
            type="text"
            value={serial}
            onChange={(e) => setSerial(e.target.value.toUpperCase())}
            placeholder={configCampos.placeholderSerial}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono uppercase tracking-wider focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        {/* IMEI 1 e IMEI 2 — SOLO SE MUESTRAN CUANDO EL EQUIPO ES UN CELULAR */}
        {configCampos.mostrarImei && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-200/70">
            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">
                IMEI 1 (15 dígitos) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={17}
                value={imei1}
                onChange={(e) => setImei1(e.target.value.replace(/\D/g, ""))}
                placeholder="35XXXXXXXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-white text-sm font-mono tracking-wider focus:border-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-blue-900 mb-1">
                IMEI 2 (Dual SIM - 15 dígitos)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={17}
                value={imei2}
                onChange={(e) => setImei2(e.target.value.replace(/\D/g, ""))}
                placeholder="35XXXXXXXXXXXXX (Opcional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-white text-sm font-mono tracking-wider focus:border-blue-600 outline-none"
              />
            </div>
          </div>
        )}

        {/* Especificaciones propias del tipo de equipo (RAM/CPU en Laptop, Banda/Frecuencia en Radio, etc.) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            {configCampos.labelSpecs}
          </label>
          <input
            type="text"
            value={especificaciones}
            onChange={(e) => setEspecificaciones(e.target.value)}
            placeholder={configCampos.placeholderSpecs}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        {/* MAC Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {configCampos.labelMac}
          </label>
          <input
            type="text"
            value={macAddress}
            onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
            placeholder="AA:BB:CC:DD:EE:FF (Opcional)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm font-mono uppercase tracking-wider focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={savingDevice || analyzing}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {savingDevice ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Guardando en Base de Datos...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>
                Guardar {tipoEquipo}{" "}
                {selectedTrabajador
                  ? `de ${selectedTrabajador.nombre.split(" ")[0]}`
                  : ""}
              </span>
            </>
          )}
        </button>
      </form>

      {/* Modal para agregar un nuevo trabajador rápidamente en campo */}
      {showNewWorkerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Nuevo Trabajador
              </h3>
              <button
                type="button"
                onClick={() => setShowNewWorkerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cédula de Identidad *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V-12345678"
                  value={newWorker.cedula}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, cedula: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pedro José Pérez"
                  value={newWorker.nombre}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SUVICA"
                    value={newWorker.empresa}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, empresa: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departamento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Operaciones"
                    value={newWorker.departamento}
                    onChange={(e) =>
                      setNewWorker({
                        ...newWorker,
                        departamento: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Analista / Supervisor"
                  value={newWorker.cargo}
                  onChange={(e) =>
                    setNewWorker({ ...newWorker, cargo: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWorkerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingWorker}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingWorker ? "Guardando..." : "Guardar y Seleccionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
