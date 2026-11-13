import { NextRequest, NextResponse } from "next/server";
import { prisma, ensurePostgresSchema } from "@/lib/prisma";
import {
  dispositivosFallback,
  loadFallbackFromDisk,
  saveFallbackToDisk,
} from "@/lib/fallback-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id).trim();

    let dispositivo = null;
    let storageMode: "postgresql" | "local" = "postgresql";

    // Intentar buscar en PostgreSQL por ID o por Código de Inventario o por Serial
    try {
      if (process.env.DATABASE_URL) {
        await ensurePostgresSchema();
        dispositivo = await prisma.dispositivo.findFirst({
          where: {
            OR: [
              { id: decodedId },
              { codigoInventario: { equals: decodedId, mode: "insensitive" } },
              { serial: { equals: decodedId, mode: "insensitive" } },
            ],
          },
          include: {
            trabajador: true,
          },
        });
      }
    } catch (dbErr) {
      console.warn("Error buscando en PostgreSQL, usando fallback:", dbErr);
      storageMode = "local";
    }

    // Si no se encontró en PostgreSQL o falló la conexión, buscar en el fallback local
    if (!dispositivo) {
      loadFallbackFromDisk();
      const term = decodedId.toLowerCase();
      dispositivo =
        dispositivosFallback.find(
          (d) =>
            d.id === decodedId ||
            d.codigoInventario?.toLowerCase() === term ||
            d.serial?.toLowerCase() === term
        ) || null;
      if (dispositivo) {
        storageMode = "local";
      }
    }

    if (!dispositivo) {
      return NextResponse.json(
        { error: `No se encontró ningún equipo con identificador "${decodedId}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({ dispositivo, storageMode });
  } catch (error: unknown) {
    console.error("GET /api/dispositivos/[id] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error interno al consultar el equipo.",
      },
      { status: 500 }
    );
  }
}

// Endpoint para registrar auditoría física rápida ("Verificado en inventario")
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const auditor = body.auditor || "Auditor TI";
    const fechaActual = new Date().toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
    const notaAuditoria = `[Auditoría: ${fechaActual} por ${auditor}]`;

    let updated = null;

    try {
      if (process.env.DATABASE_URL) {
        await ensurePostgresSchema();
        const current = await prisma.dispositivo.findUnique({ where: { id } });
        if (current) {
          const nuevasEspecificaciones = current.especificaciones
            ? `${current.especificaciones} • ${notaAuditoria}`
            : notaAuditoria;
          updated = await prisma.dispositivo.update({
            where: { id },
            data: { especificaciones: nuevasEspecificaciones },
            include: { trabajador: true },
          });
        }
      }
    } catch {
      // Usar fallback local
    }

    if (!updated) {
      loadFallbackFromDisk();
      const idx = dispositivosFallback.findIndex((d) => d.id === id);
      if (idx !== -1) {
        const item = dispositivosFallback[idx];
        item.especificaciones = item.especificaciones
          ? `${item.especificaciones} • ${notaAuditoria}`
          : notaAuditoria;
        dispositivosFallback[idx] = item;
        saveFallbackToDisk();
        updated = item;
      }
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Equipo no encontrado para auditar." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: `Auditoría registrada: ${fechaActual}`,
      dispositivo: updated,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al registrar la auditoría.",
      },
      { status: 500 }
    );
  }
}

