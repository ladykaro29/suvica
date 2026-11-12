import { NextRequest, NextResponse } from "next/server";
import { prisma, ensurePostgresSchema } from "@/lib/prisma";
import {
  NOMINA_OFICIAL_SUVICA,
  trabajadoresFallback,
  dispositivosFallback,
  loadFallbackFromDisk,
  saveFallbackToDisk,
} from "@/lib/fallback-store";

const CEDULAS_DEMO_ANTERIORES = [
  "V-15234890",
  "V-18902341",
  "V-20456123",
  "V-14789652",
  "V-22310987",
  "V-16543219",
  "V-19876543",
  "V-24112233",
];

const globalSync = globalThis as unknown as {
  nominaSuvicaSincronizada?: boolean;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL no configurada (modo vista previa local)");
    }

    await ensurePostgresSchema();

    // Sincronización ultrarrápida (1 sola consulta SQL masiva con createMany + skipDuplicates)
    if (!globalSync.nominaSuvicaSincronizada) {
      globalSync.nominaSuvicaSincronizada = true;
      const count = await prisma.trabajador.count();
      if (count < 150) {
        await prisma.trabajador
          .deleteMany({
            where: {
              cedula: { in: CEDULAS_DEMO_ANTERIORES },
              dispositivos: { none: {} },
            },
          })
          .catch(() => {});

        await prisma.trabajador
          .createMany({
            data: NOMINA_OFICIAL_SUVICA,
            skipDuplicates: true,
          })
          .catch(() => {});
      }
    }

    const cleanDigits = q ? q.replace(/[\.\s]/g, "") : "";

    const trabajadores = await prisma.trabajador.findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { cedula: { contains: cleanDigits, mode: "insensitive" } },
              { cargo: { contains: q, mode: "insensitive" } },
              { departamento: { contains: q, mode: "insensitive" } },
              { empresa: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        dispositivos: {
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { dispositivos: true },
        },
      },
      orderBy: {
        nombre: "asc",
      },
      take: 300,
    });

    return NextResponse.json({ trabajadores });
  } catch {
    loadFallbackFromDisk();
    // Fallback local en memoria/disco enriquecido con los dispositivos que maneja cada trabajador
    const cleanQ = q ? q.toLowerCase().replace(/[\.\s]/g, "") : "";
    const filtrados = (
      q
        ? trabajadoresFallback.filter(
            (t) =>
              t.nombre.toLowerCase().includes(q.toLowerCase()) ||
              t.cedula.toLowerCase().replace(/[\.\s]/g, "").includes(cleanQ) ||
              t.cargo.toLowerCase().includes(q.toLowerCase()) ||
              t.departamento.toLowerCase().includes(q.toLowerCase()) ||
              t.empresa.toLowerCase().includes(q.toLowerCase())
          )
        : trabajadoresFallback
    ).map((t) => {
      const misDispositivos = dispositivosFallback.filter(
        (d) => d.trabajadorId === t.id
      );
      return {
        ...t,
        dispositivos: misDispositivos,
        _count: {
          dispositivos: misDispositivos.length,
        },
      };
    });

    return NextResponse.json({ trabajadores: filtrados, mode: "local-preview" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cedula, nombre, cargo, departamento, empresa } = body;

    if (!cedula || !nombre || !departamento || !empresa) {
      return NextResponse.json(
        {
          error:
            "Los campos Cédula, Nombre, Departamento y Empresa son obligatorios.",
        },
        { status: 400 }
      );
    }

    const cedulaNormalizada = cedula
      .trim()
      .toUpperCase()
      .replace(/\./g, "");

    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("Modo vista previa local");
      }

      await ensurePostgresSchema();

      const trabajador = await prisma.trabajador.upsert({
        where: { cedula: cedulaNormalizada },
        update: {
          nombre: nombre.trim().toUpperCase(),
          cargo: cargo?.trim().toUpperCase() || "TRABAJADOR",
          departamento: departamento.trim().toUpperCase(),
          empresa: empresa.trim().toUpperCase(),
        },
        create: {
          cedula: cedulaNormalizada,
          nombre: nombre.trim().toUpperCase(),
          cargo: cargo?.trim().toUpperCase() || "TRABAJADOR",
          departamento: departamento.trim().toUpperCase(),
          empresa: empresa.trim().toUpperCase(),
        },
        include: {
          dispositivos: true,
          _count: {
            select: { dispositivos: true },
          },
        },
      });

      return NextResponse.json(trabajador, { status: 201 });
    } catch {
      const nuevo = {
        id: `emp-${Date.now()}`,
        cedula: cedulaNormalizada,
        nombre: nombre.trim().toUpperCase(),
        cargo: cargo?.trim().toUpperCase() || "TRABAJADOR",
        departamento: departamento.trim().toUpperCase(),
        empresa: empresa.trim().toUpperCase(),
        dispositivos: [],
        _count: { dispositivos: 0 },
      };
      trabajadoresFallback.unshift(nuevo);
      saveFallbackToDisk();
      return NextResponse.json(nuevo, { status: 201 });
    }
  } catch (error: unknown) {
    console.error("Error en POST /api/trabajadores:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error al registrar el trabajador.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
