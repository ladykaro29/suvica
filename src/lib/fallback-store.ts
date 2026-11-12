export interface TrabajadorDemo {
  id: string;
  cedula: string;
  nombre: string;
  cargo: string;
  departamento: string;
  empresa: string;
}

export interface DispositivoDemo {
  id: string;
  codigoInventario: string | null;
  tipoEquipo: "Laptop" | "Celular" | "Radio" | "Otro";
  marcaModelo: string | null;
  macAddress: string | null;
  imei1: string | null;
  imei2: string | null;
  trabajadorId: string;
  createdAt: string;
  trabajador: TrabajadorDemo;
}

const globalFallback = globalThis as unknown as {
  trabajadoresDemo?: TrabajadorDemo[];
  dispositivosDemo?: DispositivoDemo[];
};

export const trabajadoresFallback: TrabajadorDemo[] =
  globalFallback.trabajadoresDemo ?? [
    {
      id: "demo-1",
      cedula: "V-15234890",
      nombre: "Carlos Eduardo Mendoza",
      cargo: "Supervisor de Operaciones",
      departamento: "Operaciones",
      empresa: "SUVICA",
    },
    {
      id: "demo-2",
      cedula: "V-18902341",
      nombre: "María Fernanda Gómez",
      cargo: "Coordinadora de Logística",
      departamento: "Logística",
      empresa: "SUVICA",
    },
    {
      id: "demo-3",
      cedula: "V-20456123",
      nombre: "José Gregorio Rivas",
      cargo: "Especialista de Soporte TI",
      departamento: "Tecnología (IT)",
      empresa: "SUVICA",
    },
    {
      id: "demo-4",
      cedula: "V-14789652",
      nombre: "Ana Gabriela Pérez",
      cargo: "Gerente de Seguridad Industrial",
      departamento: "SHA / Seguridad",
      empresa: "SUVICA",
    },
    {
      id: "demo-5",
      cedula: "V-22310987",
      nombre: "Luis Alberto Bolívar",
      cargo: "Técnico de Telecomunicaciones",
      departamento: "Telecomunicaciones",
      empresa: "SUVICA",
    },
    {
      id: "demo-6",
      cedula: "V-16543219",
      nombre: "Yolanda Carolina Salas",
      cargo: "Analista de Administración",
      departamento: "Administración y Finanzas",
      empresa: "SUVICA",
    },
    {
      id: "demo-7",
      cedula: "V-19876543",
      nombre: "Rafael Antonio Castellanos",
      cargo: "Jefe de Almacén y Control",
      departamento: "Almacén",
      empresa: "SUVICA",
    },
    {
      id: "demo-8",
      cedula: "V-24112233",
      nombre: "Daniela Valentina Rojas",
      cargo: "Coordinadora de Talento Humano",
      departamento: "Recursos Humanos",
      empresa: "SUVICA",
    },
  ];

export const dispositivosFallback: DispositivoDemo[] =
  globalFallback.dispositivosDemo ?? [
    {
      id: "dev-demo-1",
      codigoInventario: "SUV-CEL-0104",
      tipoEquipo: "Celular",
      marcaModelo: "Samsung Galaxy A54 5G",
      macAddress: "A4:77:33:8E:12:9C",
      imei1: "354891104523891",
      imei2: "354891104523899",
      trabajadorId: "demo-1",
      createdAt: new Date().toISOString(),
      trabajador: trabajadoresFallback[0],
    },
    {
      id: "dev-demo-2",
      codigoInventario: "SUV-RAD-0021",
      tipoEquipo: "Radio",
      marcaModelo: "Motorola MOTOTRBO R7",
      macAddress: "00:1B:63:84:45:E6",
      imei1: null,
      imei2: null,
      trabajadorId: "demo-5",
      createdAt: new Date().toISOString(),
      trabajador: trabajadoresFallback[4],
    },
  ];

globalFallback.trabajadoresDemo = trabajadoresFallback;
globalFallback.dispositivosDemo = dispositivosFallback;

