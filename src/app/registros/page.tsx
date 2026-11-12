"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

interface DispositivoConTrabajador {
  id: string;
  codigoInventario: string | null;
  tipoEquipo: "Laptop" | "Celular" | "Radio" | "Otro";
  marcaModelo: string | null;
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
  const [dispositivos, setDispositivos] = useState<DispositivoConTrabajador[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("");

  const cargarRegistros = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (tipoFiltro) params.set("tipo", tipoFiltro);

      const res = await fetch(`/api/dispositivos?${params.toString()}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.dispositivos)) {
        setDispositivos(data.dispositivos);
      }
    } catch (error) {
      console.error("Error cargando dispositivos:", error);
    } finally {
      setLoading(false);
    }
  }, [q, tipoFiltro]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarRegistros();
    }, 200);
    return () => clearTimeout(timer);
  }, [cargarRegistros]);

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
              Equipos Escaneados ({dispositivos.length})
            </h2>
            <p className="text-xs text-slate-500">
              Consulta en tiempo real y descarga el reporte general
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
            placeholder="Filtrar por trabajador, cédula, MAC, IMEI o modelo..."
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
                {tipo || "Todos"}
              </button>
            );
          })}
        </div>
      </section>

      {/* Listado de tarjetas de dispositivos registrados */}
      <section className="space-y-2.5">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            Cargando registros de inventario...
          </div>
        ) : dispositivos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-200">
            No hay equipos registrados que coincidan con el filtro actual.
          </div>
        ) : (
          dispositivos.map((d) => (
            <article
              key={d.id}
              className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200">
                    {getBadgeIcon(d.tipoEquipo)}
                    {d.tipoEquipo}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    {d.marcaModelo || "Marca / Modelo no especificado"}
                  </h3>
                </div>
                {d.codigoInventario && (
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                    #{d.codigoInventario}
                  </span>
                )}
              </div>

              {/* Identificadores Técnicos (MAC / IMEIs) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-sans font-semibold">
                    MAC Address
                  </span>
                  <span className="text-slate-800 font-semibold">
                    {d.macAddress || "—"}
                  </span>
                </div>
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
              </div>

              {/* Datos del trabajador responsable */}
              <div className="pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>{d.trabajador.nombre}</span>
                  <span className="text-slate-400 font-mono">
                    ({d.trabajador.cedula})
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
          ))
        )}
      </section>
    </div>
  );
}

