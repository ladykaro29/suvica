import { PrismaClient } from "@prisma/client";
import { NOMINA_OFICIAL_SUVICA } from "../src/lib/fallback-store";

const prisma = new PrismaClient();

async function main() {
  console.log(
    `🌱 Sincronizando nómina completa (${NOMINA_OFICIAL_SUVICA.length} empleados de SUVICA, AGROSERVICIOS, SUVIAGRICOLA y SUVICARNE)...`
  );

  for (const trabajador of NOMINA_OFICIAL_SUVICA) {
    await prisma.trabajador.upsert({
      where: { cedula: trabajador.cedula },
      update: {
        nombre: trabajador.nombre,
        cargo: trabajador.cargo,
        departamento: trabajador.departamento,
        empresa: trabajador.empresa,
      },
      create: trabajador,
    });
  }

  const total = await prisma.trabajador.count();
  console.log(`✅ Nómina cargada con éxito. Total de trabajadores en BD: ${total}`);
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
