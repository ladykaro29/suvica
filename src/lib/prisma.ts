import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  schemaInitialized?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Asegura de forma 100% no destructiva (sin borrar jamás registros existentes)
 * que las tablas "Trabajador" y "Dispositivo" y todas las columnas nuevas
 * (propiedad, serial, especificaciones, firmaConformidad) existan en PostgreSQL.
 */
export async function ensurePostgresSchema(): Promise<void> {
  if (globalForPrisma.schemaInitialized || !process.env.DATABASE_URL) {
    return;
  }

  try {
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "TipoEquipo" AS ENUM ('Laptop', 'Celular', 'Radio', 'Otro');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Trabajador" (
        "id" TEXT NOT NULL,
        "empresa" TEXT NOT NULL,
        "departamento" TEXT NOT NULL,
        "cedula" TEXT NOT NULL,
        "nombre" TEXT NOT NULL,
        "cargo" TEXT NOT NULL,
        CONSTRAINT "Trabajador_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Trabajador_cedula_key" ON "Trabajador"("cedula");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Dispositivo" (
        "id" TEXT NOT NULL,
        "codigoInventario" TEXT,
        "tipoEquipo" "TipoEquipo" NOT NULL,
        "propiedad" TEXT NOT NULL DEFAULT 'Corporativo',
        "marcaModelo" TEXT,
        "serial" TEXT,
        "especificaciones" TEXT,
        "macAddress" TEXT,
        "imei1" TEXT,
        "imei2" TEXT,
        "firmaConformidad" TEXT,
        "trabajadorId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Dispositivo_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Dispositivo_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // Agregar columnas nuevas de forma segura si la tabla Dispositivo fue creada en una versión anterior
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Dispositivo" ADD COLUMN IF NOT EXISTS "propiedad" TEXT NOT NULL DEFAULT 'Corporativo';
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Dispositivo" ADD COLUMN IF NOT EXISTS "serial" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Dispositivo" ADD COLUMN IF NOT EXISTS "especificaciones" TEXT;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Dispositivo" ADD COLUMN IF NOT EXISTS "firmaConformidad" TEXT;
    `);

    globalForPrisma.schemaInitialized = true;
  } catch (err) {
    console.warn("Aviso al verificar esquema PostgreSQL:", err);
  }
}
