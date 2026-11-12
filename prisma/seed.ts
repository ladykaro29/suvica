import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Lista inicial de trabajadores para poblar la base de datos.
 * Puedes ampliar este arreglo o importar desde un CSV/JSON corporativo.
 */
export const TRABAJADORES_INICIALES = [
  {
    cedula: "V-15234890",
    nombre: "Carlos Eduardo Mendoza",
    cargo: "Supervisor de Operaciones",
    departamento: "Operaciones",
    empresa: "SUVICA",
  },
  {
    cedula: "V-18902341",
    nombre: "María Fernanda Gómez",
    cargo: "Coordinadora de Logística",
    departamento: "Logística",
    empresa: "SUVICA",
  },
  {
    cedula: "V-20456123",
    nombre: "José Gregorio Rivas",
    cargo: "Especialista de Soporte TI",
    departamento: "Tecnología (IT)",
    empresa: "SUVICA",
  },
  {
    cedula: "V-14789652",
    nombre: "Ana Gabriela Pérez",
    cargo: "Gerente de Seguridad Industrial",
    departamento: "SHA / Seguridad",
    empresa: "SUVICA",
  },
  {
    cedula: "V-22310987",
    nombre: "Luis Alberto Bolívar",
    cargo: "Técnico de Telecomunicaciones",
    departamento: "Telecomunicaciones",
    empresa: "SUVICA",
  },
  {
    cedula: "V-16543219",
    nombre: "Yolanda Carolina Salas",
    cargo: "Analista de Administración",
    departamento: "Administración y Finanzas",
    empresa: "SUVICA",
  },
  {
    cedula: "V-19876543",
    nombre: "Rafael Antonio Castellanos",
    cargo: "Jefe de Almacén y Control",
    departamento: "Almacén",
    empresa: "SUVICA",
  },
  {
    cedula: "V-24112233",
    nombre: "Daniela Valentina Rojas",
    cargo: "Coordinadora de Talento Humano",
    departamento: "Recursos Humanos",
    empresa: "SUVICA",
  },
];

async function main() {
  console.log("🌱 Iniciando seed de la tabla Trabajador...");

  for (const trabajador of TRABAJADORES_INICIALES) {
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
  console.log(`✅ Seed completado con éxito. Trabajadores registrados: ${total}`);
}

main()
  .catch((e) => {
    console.error("❌ Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

