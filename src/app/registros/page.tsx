"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Laptop,
  Smartphone,
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
} from "lucide-react";

type TipoEquipo = "Laptop" | "Celular" | "Radio" | "Otro";
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
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cargarRegistros = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dispositivos");
      const data = await res.json();
      if (res.ok && Array.isArray(data.dispositivos)) {
        setTodosDispositivos(data.dispositivos);
      }
    } catch (error) {
      console.error("Error cargando dispositivos:", error);
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo actualizar el registro.");
      }
      setTodosDispositivos((prev) =>
        prev.map((item) => (item.id === editingDevice.id ? data : item))
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
            <h2 className="text-base font-bold text-slate-900">
              Inventario General ({dispositivos.length} equipos en{" "}
              {gruposPorTrabajador.length}{" "}
              {gruposPorTrabajador.length === 1 ? "persona" : "personas"})
            </h2>
            <p className="text-xs text-slate-500">
              Visualiza, edita o exporta los equipos registrados por trabajador
              o por dispositivo
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
            <span>Por Trabajador ({gruposPorTrabajador.length})</span>
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

        {/* Botones de Descarga CSV y Excel */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href="/api/dispositivos?format=csv"
            download
            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </a>
          <a
            href="/api/dispositivos?format=excel"
            download
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
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
            placeholder="Filtrar por trabajador, cédula, serial, MAC, IMEI o modelo..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-medium focus:bg-white focus:border-blue-600 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {["", "Laptop", "Celular", "Radio", "Otro"].map((tipo) => {
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
          })}
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

      {/* CONTENIDO: Vista Agrupada por Trabajador o Lista Individual */}
      <section className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            Cargando registros de inventario...
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            No hay equipos registrados que coincidan con el filtro actual.
          </div>
        ) : vistaModo === "por-persona" ? (
          gruposPorTrabajador.map(({ trabajador, equipos }) => (
            <article
              key={trabajador.id}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 space-y-3"
            >
              {/* Encabezado del Trabajador */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {trabajador.nombre}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-mono font-semibold text-slate-700">
                      {trabajador.cedula}
                    </span>{" "}
                    • {trabajador.cargo} ({trabajador.empresa} /{" "}
                    {trabajador.departamento})
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-blue-600 text-white px-2.5 py-1 rounded-full shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                  {equipos.length}{" "}
                  {equipos.length === 1 ? "Dispositivo" : "Dispositivos"}
                </span>
              </div>

              {/* Lista de los múltiples dispositivos que maneja esta persona */}
              <div className="space-y-2">
                {equipos.map((d, index) => {
                  const esCelular = d.tipoEquipo === "Celular";
                  return (
                    <div
                      key={d.id}
                      className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2"
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
                            <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              #{d.codigoInventario}
                            </span>
                          )}
                        </div>

                        {/* Botones de Editar y Eliminar */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(d)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-xs transition"
                            title="Editar este registro"
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
                        <p className="text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200/60">
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
            </article>
          ))
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

                  {/* Botones de Editar y Eliminar */}
                  <div className="flex items-center gap-1.5 shrink-0">
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

      {/* MODAL PARA EDITAR UN DISPOSITIVO GUARDADO */}
      {editingDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-600" />
                  Editar Dispositivo Guardado
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trabajador:{" "}
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
                <div className="grid grid-cols-4 gap-2">
                  {(["Laptop", "Celular", "Radio", "Otro"] as const).map(
                    (tipo) => {
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
                          className={`py-2 px-2 rounded-xl border text-xs font-bold transition ${
                            active
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {tipo}
                        </button>
                      );
                    }
                  )}
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
    </div>
  );
}
