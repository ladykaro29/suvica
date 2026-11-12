import { NextRequest, NextResponse } from "next/server";
import { prisma, ensurePostgresSchema } from "@/lib/prisma";
import { TipoEquipo } from "@prisma/client";
import {
  dispositivosFallback,
  trabajadoresFallback,
  loadFallbackFromDisk,
  saveFallbackToDisk,
} from "@/lib/fallback-store";

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes('"') || str.includes(",") || str.includes(";") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");
    const q = searchParams.get("q")?.trim();
    const tipo = searchParams.get("tipo")?.trim();
    const propiedad = searchParams.get("propiedad")?.trim();

    let dispositivos: Array<{
      id: string;
      codigoInventario: string | null;
      tipoEquipo: string;
      propiedad: string;
      marcaModelo: string | null;
      serial: string | null;
      especificaciones: string | null;
      macAddress: string | null;
      imei1: string | null;
      imei2: string | null;
      firmaConformidad?: string | null;
      createdAt: Date | string;
      trabajador: {
        id: string;
        cedula: string;
        nombre: string;
        cargo: string;
        departamento: string;
        empresa: string;
      };
    }> = [];

    let storageMode: "postgresql" | "local" = "postgresql";
    let dbWarning: string | null = null;

    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("Variable DATABASE_URL no configurada");
      }

      await ensurePostgresSchema();

      dispositivos = await prisma.dispositivo.findMany({
        where: {
          ...(tipo &&
          ["Laptop", "Celular", "Impresora", "Radio", "Otro"].includes(tipo)
            ? { tipoEquipo: tipo as TipoEquipo }
            : {}),
          ...(propiedad && ["Corporativo", "Personal"].includes(propiedad)
            ? { propiedad }
            : {}),
          ...(q
            ? {
                OR: [
                  { codigoInventario: { contains: q, mode: "insensitive" } },
                  { marcaModelo: { contains: q, mode: "insensitive" } },
                  { serial: { contains: q, mode: "insensitive" } },
                  { especificaciones: { contains: q, mode: "insensitive" } },
                  { macAddress: { contains: q, mode: "insensitive" } },
                  { imei1: { contains: q, mode: "insensitive" } },
                  { imei2: { contains: q, mode: "insensitive" } },
                  {
                    trabajador: {
                      OR: [
                        { nombre: { contains: q, mode: "insensitive" } },
                        { cedula: { contains: q, mode: "insensitive" } },
                        { departamento: { contains: q, mode: "insensitive" } },
                        { empresa: { contains: q, mode: "insensitive" } },
                      ],
                    },
                  },
                ],
              }
            : {}),
        },
        include: {
          trabajador: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (err: unknown) {
      storageMode = "local";
      dbWarning = err instanceof Error ? err.message : "Conexión local";
      console.warn("GET /api/dispositivos usando respaldo local:", dbWarning);
      loadFallbackFromDisk();
      dispositivos = dispositivosFallback.filter((d) => {
        if (tipo && d.tipoEquipo !== tipo) return false;
        if (propiedad && d.propiedad !== propiedad) return false;
        if (!q) return true;
        const term = q.toLowerCase();
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
    }

    // Contar cuántos dispositivos en total maneja cada trabajador en este listado
    const conteoPorTrabajador = new Map<string, number>();
    for (const d of dispositivos) {
      conteoPorTrabajador.set(
        d.trabajador.id,
        (conteoPorTrabajador.get(d.trabajador.id) || 0) + 1
      );
    }

    // Exportación directa a CSV compatible con Excel (UTF-8 con BOM)
    if (format === "csv" || format === "excel") {
      const separator = format === "excel" ? ";" : ",";
      const headers = [
        "ID Registro",
        "Fecha Escaneo",
        "Cédula Trabajador",
        "Nombre Trabajador",
        "Cargo",
        "Departamento",
        "Empresa",
        "Total Equipos del Trabajador",
        "Tipo de Equipo",
        "Propiedad (Corporativo / Personal)",
        "Código Inventario",
        "Marca / Modelo",
        "Serial (S/N)",
        "Especificaciones / Detalles",
        "MAC Address",
        "IMEI 1",
        "IMEI 2",
        "Firma de Conformidad",
      ];

      const rows = dispositivos.map((d) => [
        escapeCsvField(d.id),
        escapeCsvField(new Date(d.createdAt).toLocaleString("es-VE")),
        escapeCsvField(d.trabajador.cedula),
        escapeCsvField(d.trabajador.nombre),
        escapeCsvField(d.trabajador.cargo),
        escapeCsvField(d.trabajador.departamento),
        escapeCsvField(d.trabajador.empresa),
        escapeCsvField(String(conteoPorTrabajador.get(d.trabajador.id) || 1)),
        escapeCsvField(d.tipoEquipo),
        escapeCsvField(d.propiedad || "Corporativo"),
        escapeCsvField(d.codigoInventario),
        escapeCsvField(d.marcaModelo),
        escapeCsvField(d.serial),
        escapeCsvField(d.especificaciones),
        escapeCsvField(d.macAddress),
        escapeCsvField(d.imei1 ? `'${d.imei1}` : ""),
        escapeCsvField(d.imei2 ? `'${d.imei2}` : ""),
        escapeCsvField(d.firmaConformidad ? "FIRMADO" : "PENDIENTE"),
      ]);

      const csvContent =
        "\uFEFF" +
        [headers.join(separator), ...rows.map((r) => r.join(separator))].join("\r\n");

      const filename = `inventario_equipos_${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      total: dispositivos.length,
      storageMode,
      dbWarning,
      dispositivos,
    });
  } catch (error: unknown) {
    console.error("Error en GET /api/dispositivos:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error al obtener los dispositivos registrados.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      trabajadorId,
      codigoInventario,
      tipoEquipo,
      propiedad,
      marcaModelo,
      serial,
      especificaciones,
      macAddress,
      imei1,
      imei2,
      firmaConformidad,
      aplicarFirmaATodos,
    } = body;

    if (!trabajadorId || typeof trabajadorId !== "string") {
      return NextResponse.json(
        { error: "Debe seleccionar un trabajador válido." },
        { status: 400 }
      );
    }

    const tiposValidos: TipoEquipo[] = [
      "Laptop",
      "Celular",
      "Impresora",
      "Radio",
      "Otro",
    ];
    const tipoFinal: TipoEquipo = tiposValidos.includes(tipoEquipo)
      ? tipoEquipo
      : "Otro";

    const propiedadFinal: "Corporativo" | "Personal" =
      propiedad === "Personal" ? "Personal" : "Corporativo";

    // Solo guardar IMEI si es Celular
    const esCelular = tipoFinal === "Celular";

    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("Modo vista previa local");
      }

      await ensurePostgresSchema();

      let trabajadorExiste = await prisma.trabajador.findUnique({
        where: { id: trabajadorId },
      });

      if (!trabajadorExiste && body?.trabajadorCedula) {
        trabajadorExiste = await prisma.trabajador.findUnique({
          where: { cedula: String(body.trabajadorCedula).trim() },
        });
      }

      if (!trabajadorExiste) {
        const fallbackMatch =
          trabajadoresFallback.find(
            (t) => t.id === trabajadorId || t.cedula === body?.trabajadorCedula
          ) ||
          (body?.trabajadorData?.cedula
            ? {
                cedula: String(body.trabajadorData.cedula).trim(),
                nombre: String(body.trabajadorData.nombre || "TRABAJADOR").trim(),
                cargo: String(body.trabajadorData.cargo || "TRABAJADOR").trim(),
                departamento: String(
                  body.trabajadorData.departamento || "GENERAL"
                ).trim(),
                empresa: String(body.trabajadorData.empresa || "SUVICA").trim(),
              }
            : null);

        if (fallbackMatch) {
          trabajadorExiste = await prisma.trabajador.upsert({
            where: { cedula: fallbackMatch.cedula },
            update: {},
            create: {
              cedula: fallbackMatch.cedula,
              nombre: fallbackMatch.nombre,
              cargo: fallbackMatch.cargo,
              departamento: fallbackMatch.departamento,
              empresa: fallbackMatch.empresa,
            },
          });
        }
      }

      if (!trabajadorExiste) {
        return NextResponse.json(
          { error: "El trabajador seleccionado no existe en la base de datos." },
          { status: 404 }
        );
      }

      const createPayload = {
        data: {
          trabajadorId: trabajadorExiste.id,
          codigoInventario: codigoInventario?.trim() || null,
          tipoEquipo: tipoFinal,
          propiedad: propiedadFinal,
          marcaModelo: marcaModelo?.trim() || null,
          serial: serial?.trim()?.toUpperCase() || null,
          especificaciones: especificaciones?.trim() || null,
          macAddress: macAddress?.trim()?.toUpperCase() || null,
          imei1: esCelular ? imei1?.trim() || null : null,
          imei2: esCelular ? imei2?.trim() || null : null,
          firmaConformidad: firmaConformidad || null,
        },
        include: {
          trabajador: true,
        },
      };

      let nuevoDispositivo;
      try {
        nuevoDispositivo = await prisma.dispositivo.create(createPayload);
      } catch {
        await prisma
          .$executeRawUnsafe(
            `ALTER TYPE "TipoEquipo" ADD VALUE IF NOT EXISTS 'Impresora'`
          )
          .catch(() => {});
        nuevoDispositivo = await prisma.dispositivo.create(createPayload);
      }

      if (firmaConformidad && aplicarFirmaATodos !== false) {
        await prisma.dispositivo
          .updateMany({
            where: { trabajadorId: trabajadorExiste.id },
            data: { firmaConformidad },
          })
          .catch(() => {});
      }

      return NextResponse.json(nuevoDispositivo, { status: 201 });
    } catch {
      const trabajador =
        trabajadoresFallback.find((t) => t.id === trabajadorId) ||
        trabajadoresFallback[0];
      const nuevoDemo = {
        id: `dev-demo-${Date.now()}`,
        codigoInventario: codigoInventario?.trim() || null,
        tipoEquipo: tipoFinal,
        propiedad: propiedadFinal,
        marcaModelo: marcaModelo?.trim() || null,
        serial: serial?.trim()?.toUpperCase() || null,
        especificaciones: especificaciones?.trim() || null,
        macAddress: macAddress?.trim()?.toUpperCase() || null,
        imei1: esCelular ? imei1?.trim() || null : null,
        imei2: esCelular ? imei2?.trim() || null : null,
        firmaConformidad: firmaConformidad || null,
        trabajadorId: trabajador.id,
        createdAt: new Date().toISOString(),
        trabajador,
      };
      dispositivosFallback.unshift(nuevoDemo);
      if (firmaConformidad && aplicarFirmaATodos !== false) {
        for (const item of dispositivosFallback) {
          if (item.trabajadorId === trabajador.id) {
            item.firmaConformidad = firmaConformidad;
          }
        }
      }
      saveFallbackToDisk();
      return NextResponse.json(nuevoDemo, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error en POST /api/dispositivos:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error al guardar el dispositivo en la base de datos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      trabajadorId,
      codigoInventario,
      tipoEquipo,
      propiedad,
      marcaModelo,
      serial,
      especificaciones,
      macAddress,
      imei1,
      imei2,
      firmaConformidad,
      aplicarFirmaATodos,
    } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Falta el ID del registro a editar." },
        { status: 400 }
      );
    }

    const tiposValidos: TipoEquipo[] = [
      "Laptop",
      "Celular",
      "Impresora",
      "Radio",
      "Otro",
    ];
    const tipoFinal: TipoEquipo = tiposValidos.includes(tipoEquipo)
      ? tipoEquipo
      : "Otro";

    const propiedadFinal: "Corporativo" | "Personal" =
      propiedad === "Personal" ? "Personal" : "Corporativo";

    const esCelular = tipoFinal === "Celular";

    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("Modo vista previa local");
      }

      await ensurePostgresSchema();

      const actualizado = await prisma.dispositivo.update({
        where: { id },
        data: {
          codigoInventario: codigoInventario?.trim() || null,
          tipoEquipo: tipoFinal,
          propiedad: propiedadFinal,
          marcaModelo: marcaModelo?.trim() || null,
          serial: serial?.trim()?.toUpperCase() || null,
          especificaciones: especificaciones?.trim() || null,
          macAddress: macAddress?.trim()?.toUpperCase() || null,
          imei1: esCelular ? imei1?.trim() || null : null,
          imei2: esCelular ? imei2?.trim() || null : null,
          ...(firmaConformidad !== undefined
            ? { firmaConformidad: firmaConformidad || null }
            : {}),
        },
        include: {
          trabajador: true,
        },
      });

      if (firmaConformidad && aplicarFirmaATodos !== false) {
        await prisma.dispositivo
          .updateMany({
            where: { trabajadorId: actualizado.trabajadorId },
            data: { firmaConformidad },
          })
          .catch(() => {});
      }

      return NextResponse.json(actualizado, { status: 200 });
    } catch {
      const idx = dispositivosFallback.findIndex((d) => d.id === id);
      if (idx === -1) {
        return NextResponse.json(
          { error: "No se encontró el dispositivo a editar." },
          { status: 404 }
        );
      }

      const actual = dispositivosFallback[idx];
      const trabajador = trabajadorId
        ? trabajadoresFallback.find((t) => t.id === trabajadorId) ||
          actual.trabajador
        : actual.trabajador;

      const actualizadoDemo = {
        ...actual,
        trabajadorId: trabajador.id,
        trabajador,
        codigoInventario: codigoInventario?.trim() || null,
        tipoEquipo: tipoFinal,
        propiedad: propiedadFinal,
        marcaModelo: marcaModelo?.trim() || null,
        serial: serial?.trim()?.toUpperCase() || null,
        especificaciones: especificaciones?.trim() || null,
        macAddress: macAddress?.trim()?.toUpperCase() || null,
        imei1: esCelular ? imei1?.trim() || null : null,
        imei2: esCelular ? imei2?.trim() || null : null,
        firmaConformidad:
          firmaConformidad !== undefined
            ? firmaConformidad || null
            : actual.firmaConformidad,
      };

      dispositivosFallback[idx] = actualizadoDemo;
      if (firmaConformidad && aplicarFirmaATodos !== false) {
        for (const item of dispositivosFallback) {
          if (item.trabajadorId === trabajador.id) {
            item.firmaConformidad = firmaConformidad;
          }
        }
      }
      saveFallbackToDisk();
      return NextResponse.json(actualizadoDemo, { status: 200 });
    }
  } catch (error: unknown) {
    console.error("Error en PUT /api/dispositivos:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar el dispositivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { error: "Falta el ID del dispositivo a eliminar." },
        { status: 400 }
      );
    }

    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("Modo vista previa local");
      }
      await ensurePostgresSchema();
      await prisma.dispositivo.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch {
      loadFallbackFromDisk();
      const idx = dispositivosFallback.findIndex((d) => d.id === id);
      if (idx !== -1) {
        dispositivosFallback.splice(idx, 1);
        saveFallbackToDisk();
      }
      return NextResponse.json({ ok: true });
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Error al eliminar el dispositivo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
