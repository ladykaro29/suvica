import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  trabajadoresFallback,
  dispositivosFallback,
} from "@/lib/fallback-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL no configurada (modo vista previa local)");
    }

    // Si la tabla Trabajador está vacía en el primer arranque en producción, poblarla automáticamente
    if (!q) {
      const count = await prisma.trabajador.count();
      if (count === 0) {
        for (const t of trabajadoresFallback) {
          await prisma.trabajador.upsert({
            where: { cedula: t.cedula },
            update: {},
            create: {
              cedula: t.cedula,
              nombre: t.nombre,
              cargo: t.cargo,
              departamento: t.departamento,
              empresa: t.empresa,
            },
          });
        }
      }
    }

    const trabajadores = await prisma.trabajador.findMany({
      where: q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { cedula: { contains: q, mode: "insensitive" } },
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
      take: 100,
    });

    return NextResponse.json({ trabajadores });
  } catch {
    // Fallback local en memoria enriquecido con los dispositivos que maneja cada trabajador
    const filtrados = (
      q
        ? trabajadoresFallback.filter(
            (t) =>
              t.nombre.toLowerCase().includes(q.toLowerCase()) ||
              t.cedula.toLowerCase().includes(q.toLowerCase()) ||
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

    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("Modo vista previa local");
      }

      const trabajador = await prisma.trabajador.upsert({
        where: { cedula: cedula.trim().toUpperCase() },
        update: {
          nombre: nombre.trim(),
          cargo: cargo?.trim() || "Trabajador",
          departamento: departamento.trim(),
          empresa: empresa.trim(),
        },
        create: {
          cedula: cedula.trim().toUpperCase(),
          nombre: nombre.trim(),
          cargo: cargo?.trim() || "Trabajador",
          departamento: departamento.trim(),
          empresa: empresa.trim(),
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
        id: `demo-${Date.now()}`,
        cedula: cedula.trim().toUpperCase(),
        nombre: nombre.trim(),
        cargo: cargo?.trim() || "Trabajador",
        departamento: departamento.trim(),
        empresa: empresa.trim(),
        dispositivos: [],
        _count: { dispositivos: 0 },
      };
      trabajadoresFallback.unshift(nuevo);
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
