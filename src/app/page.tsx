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
  Plus,
  Trash2,
  Pencil,
  Images,
  UserCheck2,
} from "lucide-react";
import { compressImageClient } from "@/lib/image-compression";
import { trabajadoresFallback } from "@/lib/fallback-store";

type TipoEquipo = "Laptop" | "Celular" | "Radio" | "Otro";
type PropiedadEquipo = "Corporativo" | "Personal";

export interface DispositivoResumen {
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
  // Estado de trabajadores pre-cargado al instante en memoria (0ms de espera) y sincronizado en segundo plano
  const [trabajadores, setTrabajadores] =
    useState<Trabajador[]>(trabajadoresFallback);
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedTrabajador, setSelectedTrabajador] =
    useState<Trabajador | null>(null);

  // Meta de cantidad de dispositivos a registrar para el trabajador actual
  const [metaDispositivos, setMetaDispositivos] = useState<number>(2);

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

  // Estado de captura fotográfica múltiple y análisis IA
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [devicePhotos, setDevicePhotos] = useState<
    Array<{
      id: string;
      dataUrl: string;
      width: number;
      height: number;
      sizeKB: number;
    }>
  >([]);
  const [analyzing, setAnalyzing] = useState(false);

  // Estado del formulario de dispositivo (adaptable por tipo y propiedad)
  const [tipoEquipo, setTipoEquipo] = useState<TipoEquipo>("Laptop");
  const [propiedad, setPropiedad] = useState<PropiedadEquipo>("Corporativo");
  const [codigoInventario, setCodigoInventario] = useState("");
  const [marcaModelo, setMarcaModelo] = useState("");
  const [serial, setSerial] = useState("");
  const [especificaciones, setEspecificaciones] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");

  // Estado de guardado, edición y notificaciones
  const [savingDevice, setSavingDevice] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [deletingDeviceId, setDeletingDeviceId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const formStepRef = useRef<HTMLDivElement | null>(null);

  // Cargar trabajadores (incluyendo su conteo y lista de dispositivos) en segundo plano sin bloquear la UI
  const fetchTrabajadores = async (keepSelectedIdOrCedula?: string) => {
    try {
      const res = await fetch("/api/trabajadores");
      const data = await res.json();
      if (res.ok && Array.isArray(data.trabajadores)) {
        setTrabajadores(data.trabajadores);
        if (keepSelectedIdOrCedula) {
          const updated = data.trabajadores.find(
            (t: Trabajador) =>
              t.id === keepSelectedIdOrCedula ||
              t.cedula === keepSelectedIdOrCedula
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

  // Filtrado instantáneo por nombre, cédula (con o sin puntos), cargo, empresa o departamento
  const filteredTrabajadores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trabajadores.slice(0, 40);
    const cleanQ = q.replace(/[\.\-\s]/g, "");
    return trabajadores
      .filter((t) => {
        const cleanCedula = t.cedula.toLowerCase().replace(/[\.\-\s]/g, "");
        return (
          t.nombre.toLowerCase().includes(q) ||
          t.cedula.toLowerCase().includes(q) ||
          (cleanQ.length >= 2 && cleanCedula.includes(cleanQ)) ||
          t.cargo.toLowerCase().includes(q) ||
          t.departamento.toLowerCase().includes(q) ||
          t.empresa.toLowerCase().includes(q)
        );
      })
      .slice(0, 40);
  }, [trabajadores, searchQuery]);

  const handleSelectTrabajador = (t: Trabajador) => {
    setSelectedTrabajador(t);
    setSearchQuery(`${t.nombre} (${t.cedula})`);
    setDropdownOpen(false);
    setStatusMessage(null);
    const actuales = t._count?.dispositivos ?? t.dispositivos?.length ?? 0;
    setMetaDispositivos(Math.max(actuales + 1, 2));
  };

  const handleClearTrabajador = () => {
    setSelectedTrabajador(null);
    setSearchQuery("");
    setDropdownOpen(true);
    setStatusMessage(null);
  };

  // Cambiar tipo de equipo manualmente (limpia IMEI si cambia a un equipo sin IMEI)
  const handleSelectTipoEquipo = (nuevoTipo: TipoEquipo) => {
    setTipoEquipo(nuevoTipo);
    if (nuevoTipo !== "Celular") {
      setImei1("");
      setImei2("");
    }
  };

  // Cargar un dispositivo ya guardado en el formulario para editarlo
  const handleStartEditDispositivo = (d: DispositivoResumen) => {
    setEditingDeviceId(d.id);
    setTipoEquipo(d.tipoEquipo);
    setPropiedad(
      d.propiedad === "Personal" ? "Personal" : "Corporativo"
    );
    setCodigoInventario(d.codigoInventario ?? "");
    setMarcaModelo(d.marcaModelo ?? "");
    setSerial(d.serial ?? "");
    setEspecificaciones(d.especificaciones ?? "");
    setMacAddress(d.macAddress ?? "");
    setImei1(d.imei1 ?? "");
    setImei2(d.imei2 ?? "");
    setStatusMessage({
      type: "info",
      text: `Modo Edición: Modificando ${d.tipoEquipo} (${
        d.marcaModelo || "Sin modelo"
      }). Realiza los cambios en el Paso 3 y presiona "Actualizar Dispositivo".`,
    });
    setTimeout(() => {
      formStepRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // Eliminar un dispositivo de la lista del trabajador si se registró por error
  const handleDeleteDispositivo = async (id: string) => {
    if (!selectedTrabajador) return;
    setDeletingDeviceId(id);
    try {
      const res = await fetch(`/api/dispositivos?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (editingDeviceId === id) {
          resetDeviceForm();
        }
        const nuevosDispositivos = (selectedTrabajador.dispositivos || []).filter(
          (d) => d.id !== id
        );
        const actualizado: Trabajador = {
          ...selectedTrabajador,
          dispositivos: nuevosDispositivos,
          _count: { dispositivos: nuevosDispositivos.length },
        };
        setSelectedTrabajador(actualizado);
        setTrabajadores((prev) =>
          prev.map((t) =>
            t.id === selectedTrabajador.id ||
            t.cedula === selectedTrabajador.cedula
              ? actualizado
              : t
          )
        );
        void fetchTrabajadores(selectedTrabajador.cedula);
      }
    } catch (error) {
      console.error("Error eliminando dispositivo:", error);
    } finally {
      setDeletingDeviceId(null);
    }
  };

  // Enviar todas las fotos acumuladas del dispositivo actual a Gemini IA para reconocimiento combinado
  const analyzePhotosList = async (
    photosList: Array<{
      id: string;
      dataUrl: string;
      width: number;
      height: number;
      sizeKB: number;
    }>
  ) => {
    if (photosList.length === 0) return;
    setStatusMessage(null);
    setAnalyzing(true);

    try {
      const response = await fetch("/api/analizar-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photosList.map((p) => p.dataUrl),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudieron analizar las fotografías con IA."
        );
      }

      // Rellenar/fusionar el formulario conservando valores previos si la nueva foto no los incluye
      const detectedType: TipoEquipo =
        data.tipoEquipo &&
        ["Laptop", "Celular", "Radio", "Otro"].includes(data.tipoEquipo)
          ? (data.tipoEquipo as TipoEquipo)
          : tipoEquipo;

      setTipoEquipo(detectedType);
      if (data.marcaModelo) setMarcaModelo(data.marcaModelo);
      if (data.serial) setSerial(data.serial);
      if (data.especificaciones) setEspecificaciones(data.especificaciones);
      if (data.macAddress) setMacAddress(data.macAddress);

      if (detectedType === "Celular") {
        if (data.imei1) setImei1(data.imei1);
        if (data.imei2) setImei2(data.imei2);
      } else {
        setImei1("");
        setImei2("");
      }

      if (data.codigoInventario) {
        setCodigoInventario(data.codigoInventario);
      }

      setStatusMessage({
        type: "info",
        text: `IA analizó ${photosList.length} ${
          photosList.length === 1 ? "fotografía" : "fotografías combinadas"
        } y detectó: ${detectedType}${
          data.marcaModelo ? ` (${data.marcaModelo})` : ""
        }. Puedes subir otra foto más (ej. MAC o etiqueta) para completar datos o presionar Guardar.`,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar las fotografías.";
      setStatusMessage({
        type: "error",
        text: msg,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Manejar captura de cámara o subida múltiple desde galería, compresión cliente a máx 1200px JPEG 0.8 y envío a Gemini
  const handleCapturePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setStatusMessage(null);
    setAnalyzing(true);

    try {
      // 1. Comprimir todas las fotos seleccionadas en el cliente (máx 960px, JPEG 0.72 para subida ultrarrápida)
      const compressedList = await Promise.all(
        files.slice(0, 8).map(async (file, idx) => {
          const compressed = await compressImageClient(file, 960, 0.72);
          return {
            id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            dataUrl: compressed.dataUrl,
            width: compressed.width,
            height: compressed.height,
            sizeKB: compressed.sizeKB,
          };
        })
      );

      // 2. Acumular con las fotos que ya tenía cargadas este dispositivo (máximo 8 fotos por equipo)
      const updatedPhotos = [...devicePhotos, ...compressedList].slice(0, 8);
      setDevicePhotos(updatedPhotos);

      // 3. Analizar todas las fotos juntas con Gemini IA
      await analyzePhotosList(updatedPhotos);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al comprimir o procesar las fotografías.";
      setStatusMessage({
        type: "error",
        text: msg,
      });
      setAnalyzing(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setDevicePhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const resetDeviceForm = () => {
    setEditingDeviceId(null);
    setDevicePhotos([]);
    setCodigoInventario("");
    setMarcaModelo("");
    setSerial("");
    setEspecificaciones("");
    setMacAddress("");
    setImei1("");
    setImei2("");
  };

  // Guardar o actualizar el dispositivo en PostgreSQL y dejar todo listo para el siguiente dispositivo del mismo trabajador
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

    const isEditing = Boolean(editingDeviceId);

    try {
      const response = await fetch("/api/dispositivos", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingDeviceId } : {}),
          trabajadorId: selectedTrabajador.id,
          trabajadorCedula: selectedTrabajador.cedula,
          codigoInventario,
          tipoEquipo,
          propiedad,
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

      // Actualización optimista inmediata en memoria (0ms) + sincronización en segundo plano
      const actuales = selectedTrabajador.dispositivos || [];
      const nuevosDispositivos = isEditing
        ? actuales.map((d) => (d.id === editingDeviceId ? data : d))
        : [data, ...actuales];
      const trabajadorActualizado: Trabajador = {
        ...selectedTrabajador,
        id: data.trabajadorId || selectedTrabajador.id,
        dispositivos: nuevosDispositivos,
        _count: { dispositivos: nuevosDispositivos.length },
      };

      setSelectedTrabajador(trabajadorActualizado);
      setTrabajadores((prev) =>
        prev.map((t) =>
          t.id === selectedTrabajador.id ||
          t.cedula === selectedTrabajador.cedula
            ? trabajadorActualizado
            : t
        )
      );
      resetDeviceForm();
      void fetchTrabajadores(selectedTrabajador.cedula);

      if (isEditing) {
        setStatusMessage({
          type: "success",
          text: `¡Cambios guardados exitosamente en el dispositivo (${data.tipoEquipo} ${
            data.marcaModelo || ""
          }) de ${selectedTrabajador.nombre}!`,
        });
      } else {
        const nuevoConteo = totalEquiposTrabajador + 1;
        if (nuevoConteo < metaDispositivos) {
          setStatusMessage({
            type: "success",
            text: `¡Dispositivo #${nuevoConteo} (${data.tipoEquipo}) guardado! Ahora toma la foto del Dispositivo #${
              nuevoConteo + 1
            } de ${selectedTrabajador.nombre}.`,
          });
        } else {
          setStatusMessage({
            type: "success",
            text: `¡Dispositivo #${nuevoConteo} (${data.tipoEquipo}) guardado! Ya registraste los ${nuevoConteo} dispositivos de ${selectedTrabajador.nombre}. Puedes agregar otro más o cambiar de trabajador.`,
          });
        }
      }
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
          labelSpecs:
            "Características (Capacidad GB, RAM, Modelo Técnico, Línea)",
          placeholderSpecs: "Ej. 256GB / 8GB RAM • SM-A546E/DS • Corporativo",
          labelMac: "Dirección MAC Wi-Fi / Bluetooth (XX:XX:XX:XX:XX:XX)",
          mostrarImei: true,
        };
      case "Radio":
        return {
          tituloSeccion:
            "Datos del Radio Portátil / Comunicaciones (Sin IMEI)",
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
          placeholderModelo: 'Ej. Monitor Dell 24" / Impresora Epson / Tablet',
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
      {/* PASO 1: Selección de Trabajador y Gestión de sus Múltiples Dispositivos */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[11px]">
              1
            </span>
            Trabajador y Sus Dispositivos
          </label>
          <button
            type="button"
            onClick={() => setShowNewWorkerModal(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nuevo Trabajador
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
                  : "Buscar trabajador por nombre o cédula (ej. V-15234890)..."
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
                  <p>
                    No se encontraron trabajadores con &quot;{searchQuery}&quot;.
                  </p>
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

        {/* Expediente de Múltiples Dispositivos del Trabajador Seleccionado */}
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
                className="text-xs bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-lg font-semibold shrink-0 transition"
              >
                Cambiar Persona
              </button>
            </div>

            {/* Selector de cuántos dispositivos maneja este trabajador + Barra de progreso */}
            <div className="bg-white rounded-xl p-3 border border-blue-200/80 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    ¿Cuántos dispositivos maneja esta persona?
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Selecciona la cantidad total para ir registrándolos uno por
                    uno:
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const active = metaDispositivos === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMetaDispositivos(num)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                          active
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setMetaDispositivos((m) => m + 1)}
                    className="px-2 h-7 rounded-lg text-xs font-bold bg-slate-100 text-blue-700 hover:bg-blue-100 transition"
                    title="Más dispositivos"
                  >
                    +1
                  </button>
                </div>
              </div>

              {/* Barra de progreso visual de los dispositivos del trabajador */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-blue-700">
                    Progreso de registro de {selectedTrabajador.nombre.split(" ")[0]}:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {totalEquiposTrabajador} de{" "}
                    {Math.max(metaDispositivos, totalEquiposTrabajador)}{" "}
                    equipos registrados
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (totalEquiposTrabajador /
                            Math.max(
                              metaDispositivos,
                              totalEquiposTrabajador,
                              1
                            )) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
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

              {/* Lista de los múltiples dispositivos ya registrados a esta persona */}
              {dispositivosTrabajador.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Equipos cargados a este trabajador ({dispositivosTrabajador.length}):
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {dispositivosTrabajador.map((d, idx) => (
                      <div
                        key={d.id}
                        className={`text-xs px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition ${
                          editingDeviceId === d.id
                            ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
                            : "bg-slate-50 border-slate-200/80"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              #{dispositivosTrabajador.length - idx} • {d.tipoEquipo}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                d.propiedad === "Personal"
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {d.propiedad || "Corporativo"}
                            </span>
                            <span className="font-bold text-slate-800 truncate">
                              {d.marcaModelo || "Sin modelo"}
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-slate-500 truncate mt-0.5">
                            {d.serial ? `S/N: ${d.serial} ` : ""}
                            {d.tipoEquipo === "Celular" && d.imei1
                              ? `• IMEI: ${d.imei1} `
                              : ""}
                            {d.macAddress ? `• MAC: ${d.macAddress}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditDispositivo(d)}
                            className="px-2 py-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 hover:bg-blue-200 rounded-lg inline-flex items-center gap-1 transition"
                            title="Editar este equipo"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            disabled={deletingDeviceId === d.id}
                            onClick={() => handleDeleteDispositivo(d.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Eliminar este equipo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* PASO 2: Captura de Cámara o Subida de Varias Fotos para el Dispositivo Actual */}
      <section
        ref={formStepRef}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80"
      >
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[11px]">
              2
            </span>
            {selectedTrabajador ? (
              <span>
                Fotos del Dispositivo #{totalEquiposTrabajador + 1} de{" "}
                {Math.max(metaDispositivos, totalEquiposTrabajador + 1)} (
                {selectedTrabajador.nombre.split(" ")[0]})
              </span>
            ) : (
              <span>Escaneo Multi-Foto con IA</span>
            )}
          </label>
          {devicePhotos.length > 0 && (
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {devicePhotos.length}{" "}
              {devicePhotos.length === 1 ? "foto cargada" : "fotos cargadas"}
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

        {/* Input oculto para subir múltiples fotos a la vez desde galería o archivos */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleCapturePhoto}
          className="hidden"
        />

        <div className="space-y-2.5">
          {/* Botón Principal: Tomar Foto con Cámara */}
          <button
            type="button"
            disabled={analyzing}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 active:scale-[0.99] text-white shadow-lg shadow-blue-600/25 transition flex flex-col items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-blue-200" />
                <span className="text-sm font-bold">
                  Analizando {devicePhotos.length > 1 ? `${devicePhotos.length} fotografías` : "fotografía"} con Gemini IA...
                </span>
                <span className="text-xs text-blue-200 text-center">
                  Combinando Marca, Modelo, Serial, MAC, IMEI y especificaciones de todas las fotos
                </span>
              </>
            ) : (
              <>
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <span className="text-base font-bold tracking-tight">
                  {devicePhotos.length > 0
                    ? `+ Tomar Foto #${devicePhotos.length + 1} de este Equipo`
                    : selectedTrabajador
                    ? `Tomar Foto con Cámara (Dispositivo #${totalEquiposTrabajador + 1})`
                    : "Abrir Cámara y Fotografiar Equipo"}
                </span>
                <span className="text-xs text-blue-100 text-center max-w-xs">
                  Puedes tomar varias fotos del mismo equipo (ej. Foto 1: *#06# IMEI, Foto 2: Dirección MAC, Foto 3: Etiqueta S/N).
                </span>
              </>
            )}
          </button>

          {/* Botón Secundario: Subir Varias Fotos desde Galería / Archivos */}
          <button
            type="button"
            disabled={analyzing}
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300/80 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Images className="w-4 h-4 text-blue-600" />
            <span>
              {devicePhotos.length > 0
                ? "Agregar más fotos desde Galería / Archivos"
                : "Subir Varias Fotos a la Vez (Galería / Archivos)"}
            </span>
          </button>
        </div>

        {/* Galería de miniaturas de las fotos cargadas para el dispositivo actual */}
        {devicePhotos.length > 0 && (
          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Fotos del equipo actual ({devicePhotos.length}):
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={analyzing}
                  onClick={() => analyzePhotosList(devicePhotos)}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline disabled:opacity-50"
                >
                  Re-analizar juntas
                </button>
                <button
                  type="button"
                  disabled={analyzing}
                  onClick={() => setDevicePhotos([])}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                >
                  Borrar fotos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {devicePhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-slate-300 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.dataUrl}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-20 object-cover"
                  />
                  <span className="absolute bottom-1 left-1 bg-slate-900/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Foto #{index + 1} ({photo.sizeKB}KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 shadow-sm hover:bg-rose-700"
                    title="Quitar esta foto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Alertas de estado y botones rápidos para flujo multi-dispositivo */}
      {statusMessage && (
        <div
          className={`rounded-xl p-3.5 border text-xs font-medium space-y-2.5 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : statusMessage.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{statusMessage.text}</p>
          </div>

          {statusMessage.type === "success" && selectedTrabajador && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Escanear Otro Equipo de{" "}
                {selectedTrabajador.nombre.split(" ")[0]}
              </button>
              <button
                type="button"
                onClick={handleClearTrabajador}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold px-3 py-2 rounded-xl text-xs transition"
              >
                <UserCheck2 className="w-3.5 h-3.5 text-blue-600" />
                Pasar al Siguiente Trabajador
              </button>
              <Link
                href="/registros"
                className="inline-flex items-center gap-1 font-bold text-emerald-800 underline px-2 py-1"
              >
                Ver todos los registros <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* PASO 3: Formulario Inteligente adaptado a cada Tipo de Dispositivo */}
      <form
        onSubmit={handleSaveDevice}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span
              className={`w-5 h-5 rounded-full text-white inline-flex items-center justify-center text-[11px] ${
                editingDeviceId ? "bg-amber-500" : "bg-blue-600"
              }`}
            >
              3
            </span>
            {editingDeviceId
              ? `Editando ${tipoEquipo} Guardado`
              : configCampos.tituloSeccion}
          </label>
          <button
            type="button"
            onClick={resetDeviceForm}
            className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {editingDeviceId ? "Cancelar edición" : "Limpiar"}
          </button>
        </div>

        {editingDeviceId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-xs text-amber-900">
            <span className="font-semibold">
              Estás editando un registro guardado. Modifica cualquier campo y presiona &quot;Guardar Cambios&quot;.
            </span>
            <button
              type="button"
              onClick={resetDeviceForm}
              className="text-[11px] font-bold underline shrink-0 text-amber-800 hover:text-amber-950"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Selector visual de Tipo de Equipo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Categoría del Dispositivo #{totalEquiposTrabajador + 1} *
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

        {/* Selector de Propiedad: Corporativo vs Personal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ¿El equipo ({tipoEquipo}) es Corporativo o Personal? *
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPropiedad("Corporativo")}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                propiedad === "Corporativo"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Corporativo (Empresa)</span>
            </button>
            <button
              type="button"
              onClick={() => setPropiedad("Personal")}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                propiedad === "Personal"
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Personal (Propio)</span>
            </button>
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

        <div className="flex flex-col sm:flex-row gap-2">
          {editingDeviceId && (
            <button
              type="button"
              onClick={resetDeviceForm}
              className="py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
            >
              Cancelar Edición
            </button>
          )}
          <button
            type="submit"
            disabled={savingDevice || analyzing}
            className={`flex-1 py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 ${
              editingDeviceId
                ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-600/20"
                : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20"
            }`}
          >
            {savingDevice ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {editingDeviceId
                    ? "Actualizando Dispositivo..."
                    : "Guardando Dispositivo..."}
                </span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>
                  {editingDeviceId
                    ? `Guardar Cambios en ${tipoEquipo}`
                    : selectedTrabajador
                    ? `Guardar Dispositivo #${totalEquiposTrabajador + 1} (${tipoEquipo}) de ${
                        selectedTrabajador.nombre.split(" ")[0]
                      }`
                    : `Guardar ${tipoEquipo}`}
                </span>
              </>
            )}
          </button>
        </div>
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
