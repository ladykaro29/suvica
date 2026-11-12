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
 * Cada sentencia se ejecuta de forma independiente para que ninguna bloquee a otra.
 */
export async function ensurePostgresSchema(): Promise<void> {
  if (globalForPrisma.schemaInitialized || !process.env.DATABASE_URL) {
    return;
  }

  const statements = [
    `CREATE TYPE "TipoEquipo" AS ENUM ('Laptop', 'Celular', 'Radio', 'Otro')`,
    `CREATE TABLE IF NOT EXISTS "Trabajador" (
      "id" TEXT NOT NULL,
      "empresa" TEXT NOT NULL,
      "departamento" TEXT NOT NULL,
      "cedula" TEXT NOT NULL,
      "nombre" TEXT NOT NULL,
      "cargo" TEXT NOT NULL,
      CONSTRAINT "Trabajador_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Trabajador_cedula_key" ON "Trabajador"("cedula")`,
    `CREATE TABLE IF NOT EXISTS "Dispositivo" (
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
    )`,
    `ALTER TABLE "Dispositivo" ADD COLUMN IF NOT EXISTS "propiedad" TEXT NOT NULL DEFAULT 'Corporativo'`,
    `ALTER TABLE "Dispositivo" ADD COLUMN IF NOT EXISTS "serial" TEXT`,
    `ALTER TABLE "Dispositivo" ADD COLUMN IF NOT EXISTS "especificaciones" TEXT`,
    `ALTER TABLE "Dispositivo" ADD COLUMN IF NOT EXISTS "firmaConformidad" TEXT`,
  ];

  let anySuccess = false;
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      anySuccess = true;
    } catch {
      // Ignorar si el tipo ENUM o índice ya existe; continuar siempre con las demás columnas
    }
  }

  if (anySuccess) {
    globalForPrisma.schemaInitialized = true;
  }
}
