import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TipoEquipo } from "@prisma/client";
import {
  dispositivosFallback,
  trabajadoresFallback,
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

    let dispositivos: Array<{
      id: string;
      codigoInventario: string | null;
      tipoEquipo: string;
      marcaModelo: string | null;
      macAddress: string | null;
      imei1: string | null;
      imei2: string | null;
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

    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("Modo vista previa local");
      }

      dispositivos = await prisma.dispositivo.findMany({
        where: {
          ...(tipo && ["Laptop", "Celular", "Radio", "Otro"].includes(tipo)
            ? { tipoEquipo: tipo as TipoEquipo }
            : {}),
          ...(q
            ? {
                OR: [
                  { codigoInventario: { contains: q, mode: "insensitive" } },
                  { marcaModelo: { contains: q, mode: "insensitive" } },
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
    } catch {
      dispositivos = dispositivosFallback.filter((d) => {
        if (tipo && d.tipoEquipo !== tipo) return false;
        if (!q) return true;
        const term = q.toLowerCase();
        return (
          d.codigoInventario?.toLowerCase().includes(term) ||
          d.marcaModelo?.toLowerCase().includes(term) ||
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

    // Exportación directa a CSV compatible con Excel (UTF-8 con BOM)
    if (format === "csv" || format === "excel") {
      const separator = format === "excel" ? ";" : ",";
      const headers = [
        "ID Registro",
        "Fecha Escaneo",
        "Código Inventario",
        "Tipo de Equipo",
        "Marca / Modelo",
        "MAC Address",
        "IMEI 1",
        "IMEI 2",
        "Cédula Trabajador",
        "Nombre Trabajador",
        "Cargo",
        "Departamento",
        "Empresa",
      ];

      const rows = dispositivos.map((d) => [
        escapeCsvField(d.id),
        escapeCsvField(new Date(d.createdAt).toLocaleString("es-VE")),
        escapeCsvField(d.codigoInventario),
        escapeCsvField(d.tipoEquipo),
        escapeCsvField(d.marcaModelo),
        escapeCsvField(d.macAddress),
        escapeCsvField(d.imei1 ? `'${d.imei1}` : ""),
        escapeCsvField(d.imei2 ? `'${d.imei2}` : ""),
        escapeCsvField(d.trabajador.cedula),
        escapeCsvField(d.trabajador.nombre),
        escapeCsvField(d.trabajador.cargo),
        escapeCsvField(d.trabajador.departamento),
        escapeCsvField(d.trabajador.empresa),
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
      marcaModelo,
      macAddress,
      imei1,
      imei2,
    } = body;

    if (!trabajadorId || typeof trabajadorId !== "string") {
      return NextResponse.json(
        { error: "Debe seleccionar un trabajador válido." },
        { status: 400 }
      );
    }

    const tiposValidos: TipoEquipo[] = ["Laptop", "Celular", "Radio", "Otro"];
    const tipoFinal: TipoEquipo = tiposValidos.includes(tipoEquipo)
      ? tipoEquipo
      : "Otro";

    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("Modo vista previa local");
      }

      const trabajadorExiste = await prisma.trabajador.findUnique({
        where: { id: trabajadorId },
      });

      if (!trabajadorExiste) {
        return NextResponse.json(
          { error: "El trabajador seleccionado no existe en la base de datos." },
          { status: 404 }
        );
      }

      const nuevoDispositivo = await prisma.dispositivo.create({
        data: {
          trabajadorId,
          codigoInventario: codigoInventario?.trim() || null,
          tipoEquipo: tipoFinal,
          marcaModelo: marcaModelo?.trim() || null,
          macAddress: macAddress?.trim()?.toUpperCase() || null,
          imei1: imei1?.trim() || null,
          imei2: imei2?.trim() || null,
        },
        include: {
          trabajador: true,
        },
      });

      return NextResponse.json(nuevoDispositivo, { status: 201 });
    } catch {
      const trabajador =
        trabajadoresFallback.find((t) => t.id === trabajadorId) ||
        trabajadoresFallback[0];
      const nuevoDemo = {
        id: `dev-demo-${Date.now()}`,
        codigoInventario: codigoInventario?.trim() || null,
        tipoEquipo: tipoFinal,
        marcaModelo: marcaModelo?.trim() || null,
        macAddress: macAddress?.trim()?.toUpperCase() || null,
        imei1: imei1?.trim() || null,
        imei2: imei2?.trim() || null,
        trabajadorId: trabajador.id,
        createdAt: new Date().toISOString(),
        trabajador,
      };
      dispositivosFallback.unshift(nuevoDemo);
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
