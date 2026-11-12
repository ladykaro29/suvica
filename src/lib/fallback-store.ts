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
  propiedad: "Corporativo" | "Personal";
  marcaModelo: string | null;
  serial: string | null;
  especificaciones: string | null;
  macAddress: string | null;
  imei1: string | null;
  imei2: string | null;
  trabajadorId: string;
  createdAt: string;
  trabajador: TrabajadorDemo;
}

/**
 * Nómina oficial completa extraída de:
 * - Trabajadores con su Cargo SUVICA.pdf (SUPLIDORA EL VIGIA, C.A.)
 * - PERSONAL AGROSERVICIO.pdf (SUVICA AGROSERVICIOS, C.A.)
 * - PERSONAL SUVIAGRICOLA.pdf (SUVIAGRICOLA, C.A.)
 * - PERSONAL SUVICARNE.pdf (SUVICARNE, C.A.)
 */
export const NOMINA_OFICIAL_SUVICA: Omit<TrabajadorDemo, "id">[] = [
  // =========================================================================
  // 1. SUPLIDORA EL VIGIA, C.A. (SUVICA) - DIRECCIÓN
  // =========================================================================
  { cedula: "V-4146975", nombre: "GOVEA CABRERA, DAVID ENRIQUE", cargo: "DIRECTOR", departamento: "DIRECCIÓN", empresa: "SUVICA" },
  { cedula: "V-7714416", nombre: "RUBIO DE GOVEA, NORA ELISA", cargo: "DIRECTOR", departamento: "DIRECCIÓN", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - ADMINISTRACIÓN
  // =========================================================================
  { cedula: "V-13559069", nombre: "CARREÑO, CLAUDIA", cargo: "GERENTE DE TALENTO HUMANO", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-15127223", nombre: "MOTA NAVA, MAHLY NAKARI", cargo: "GERENTE DE MEJORAS CONTINUAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-15518080", nombre: "SUAREZ, ROSMART", cargo: "COORDINADOR NACIONAL DE VENTAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-15553372", nombre: "MOLLEDA, JOSE", cargo: "COORDINADOR DE LOGISTICA", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-15926718", nombre: "ZAMBRANO, ANAIS", cargo: "GERENTE DE FINANZAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-16038659", nombre: "CASTRO, PAOLA", cargo: "GERENTE DE VENTAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-21027947", nombre: "ABRIL CAMACHO, NUBIA KRISMAR", cargo: "ASISTENTE DE COMPRAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-21602951", nombre: "SENA RAMIREZ, MARIANYULY YUDGREY", cargo: "ASISTENTE DE COMPRAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-23556159", nombre: "MOLINA, MILEIDYS", cargo: "ASISTENTE DE COMPRAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-24625218", nombre: "YNDRIAGO LOPEZ, JOSE JULIAN", cargo: "GERENTE DE OPERACIONES", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-24936410", nombre: "MELO VERDI, LISETH ANDREINA", cargo: "ASISTENTE DE CONTABILIDAD", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-26923520", nombre: "MARTINEZ BELEÑO, ANA VICTORIA", cargo: "COORDINADOR DE ALMACEN", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-27063230", nombre: "BOTELLO TORRES, YUISBEL", cargo: "ASISTENTE DE CONTABILIDAD", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-28015336", nombre: "FERNANDEZ, SCARLET", cargo: "ASISTENTE DE VENTAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-28440279", nombre: "GOVEA MORAN, HUGO DAVID", cargo: "ASISTENTE DE CONTABILIDAD", departamento: "ADMINISTRACIÓN", empresa: "SUVICA / SUVIAGRICOLA" },
  { cedula: "V-30269431", nombre: "LEAL, FABIAN", cargo: "ASISTENTE DE COMPRAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-16306587", nombre: "GOVEA RUBIO, DAVID ENRIQUE", cargo: "GERENTE GENERAL", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },
  { cedula: "V-13496402", nombre: "RODRIGUEZ LUGO, ANGEL DOMINGO", cargo: "COORDINADOR DE ALMACEN", departamento: "ADMINISTRACIÓN", empresa: "SUVICA / SUVICARNE" },
  { cedula: "V-16039069", nombre: "CONTRERAS ZAMBRANO, NEILA ANDREINA", cargo: "ASISTENTE DE VENTAS", departamento: "ADMINISTRACIÓN", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS BARQUISIMETO
  // =========================================================================
  { cedula: "V-15730609", nombre: "ROA ALVARADO, CARLOS ENRIQUE", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS BARQUISIMETO", empresa: "SUVICA" },
  { cedula: "V-24163014", nombre: "LEAL, ROBINSON", cargo: "CALETERO", departamento: "VENTAS Y CALETAS BARQUISIMETO", empresa: "SUVICA" },
  { cedula: "V-25842971", nombre: "LEAL, RUBEN", cargo: "CALETERO", departamento: "VENTAS Y CALETAS BARQUISIMETO", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS VALENCIA
  // =========================================================================
  { cedula: "V-14161178", nombre: "CARRILLO PADILLA, WILFREDO FRANCISCO", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS VALENCIA", empresa: "SUVICA" },
  { cedula: "V-30017240", nombre: "MONTERO DE VICENTE, DARIO JOSE", cargo: "MERCADERISTA", departamento: "VENTAS Y CALETAS VALENCIA", empresa: "SUVICA" },
  { cedula: "V-30461576", nombre: "LOPEZ CASTELLANO, EDUARDO JOSE", cargo: "CALETERO", departamento: "VENTAS Y CALETAS VALENCIA", empresa: "SUVICA" },
  { cedula: "V-31284249", nombre: "VILLASMIL LANDAETA, JESUS ANDRES", cargo: "CALETERO", departamento: "VENTAS Y CALETAS VALENCIA", empresa: "SUVICA" },
  { cedula: "V-7720376", nombre: "GONZALEZ, ANGEL", cargo: "CALETERO", departamento: "VENTAS Y CALETAS VALENCIA", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - GALPÓN
  // =========================================================================
  { cedula: "V-13478794", nombre: "OSORIO, EDUARDO", cargo: "MANTENIMIENTO DE GALPON", departamento: "GALPÓN", empresa: "SUVICA" },
  { cedula: "V-28501196", nombre: "VILLASMIL VILLARREAL, HECTOR MANUEL", cargo: "VIGILANTE / MANTENIMIENTO", departamento: "GALPÓN / OPERACIONES", empresa: "SUVICA / AGROSERVICIOS / SUVICARNE" },
  { cedula: "V-32597590", nombre: "BONYES, HECTOR", cargo: "MANTENIMIENTO DE GALPON", departamento: "GALPÓN", empresa: "SUVICA" },
  { cedula: "V-8711725", nombre: "VIVAS, LUIS", cargo: "MANTENIMIENTO DE GALPON", departamento: "GALPÓN", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS MARACAY
  // =========================================================================
  { cedula: "V-12138275", nombre: "PEREZ CABEZA, JERRY ANTONIO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS MARACAY", empresa: "SUVICA" },
  { cedula: "V-15074520", nombre: "GAVIDIA MOLINA, REINALDO JOSE", cargo: "CALETERO", departamento: "VENTAS Y CALETAS MARACAY", empresa: "SUVICA" },
  { cedula: "V-31807892", nombre: "LINARES BASTO, FRANYER EDUARDO", cargo: "MERCADERISTA", departamento: "VENTAS Y CALETAS MARACAY", empresa: "SUVICA" },
  { cedula: "V-9648877", nombre: "SEGNINI CORREA, HENRY RAFAEL", cargo: "CALETERO", departamento: "VENTAS Y CALETAS MARACAY", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS CARACAS
  // =========================================================================
  { cedula: "V-12654950", nombre: "MOGOLLON, ANDRES", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-13894369", nombre: "MEDINA, JONATAN", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-15220971", nombre: "JIMENEZ, JOSE", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-15316926", nombre: "GONZALEZ NIEVES, RAMON ANTONIO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-15432988", nombre: "VASQUEZ, JESUS", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-15508371", nombre: "ORELLANA, ALVARO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-16309636", nombre: "SANCHEZ, SHEIS", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-16497091", nombre: "QUINTERO SUAREZ, ANGEL LUIS", cargo: "MERCADERISTA", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-17532913", nombre: "OLEAGA, BEIKER", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-18150708", nombre: "RAMIREZ FUENTES, JESUS EDUARDO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-19794306", nombre: "RODRIGUEZ, YESENIA", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-22785477", nombre: "PEREZ, ALEXIS", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-23110277", nombre: "ROMERO, ANDERSON", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-24886167", nombre: "PEREZ, LETZAEL", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-30954349", nombre: "HERNANDEZ VELASQUEZ, DANIEL DEIKER", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-31566284", nombre: "ORAN, DAVID", cargo: "MERCADERISTA", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-31613502", nombre: "BUCCINI CARREÑO, VICTORIA ALEJANDRA", cargo: "MERCADERISTA", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-31795981", nombre: "ACOSTA, CRISTHIAN", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-31811163", nombre: "URBANO, JOSEITHER", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-33281344", nombre: "PRADO RUIZ, JHODAYSBEL JESUS OKANAMI", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-33897158", nombre: "PRADO, JOHNFER", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },
  { cedula: "V-19587296", nombre: "MARCANO PERDOMO, RONALD ANTONIO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CARACAS", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS BARCELONA
  // =========================================================================
  { cedula: "V-19169515", nombre: "LEAL MACUARE, JUAN CARLOS", cargo: "CALETERO", departamento: "VENTAS Y CALETAS BARCELONA", empresa: "SUVICA" },
  { cedula: "V-32127892", nombre: "LEAL HEREDIA, JESUS GABRIEL", cargo: "MERCADERISTA", departamento: "VENTAS Y CALETAS BARCELONA", empresa: "SUVICA" },
  { cedula: "V-30516739", nombre: "LEAL, LEONARDO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS BARCELONA", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS CUMANÁ
  // =========================================================================
  { cedula: "V-23582876", nombre: "ZARRAMERA, JESUS", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS CUMANA", empresa: "SUVICA" },
  { cedula: "V-15290467", nombre: "CORDOVA BRITO, JOSE GREGORIO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS CUMANA", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS MATURÍN
  // =========================================================================
  { cedula: "V-21050279", nombre: "MUJICA, YORDI", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS MATURIN", empresa: "SUVICA" },
  { cedula: "V-29879323", nombre: "AZOCAR, DAYAN", cargo: "CALETERO", departamento: "VENTAS Y CALETAS MATURIN", empresa: "SUVICA" },
  { cedula: "V-32934225", nombre: "MIRANDA, ISMAEL", cargo: "CALETERO", departamento: "VENTAS Y CALETAS MATURIN", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS PUERTO ORDAZ
  // =========================================================================
  { cedula: "V-14579168", nombre: "MATA ROJAS, FRANCISCO MODESTO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PUERTO ORDAZ", empresa: "SUVICA" },
  { cedula: "V-24302091", nombre: "ROJAS BARCELO, JOSE ANTONIO", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS PUERTO ORDAZ", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - VENTAS Y CALETAS PORLAMAR
  // =========================================================================
  { cedula: "V-8398132", nombre: "NARVAEZ, NICOLAS", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-11537966", nombre: "MARCANO, FRANCISCO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-13848045", nombre: "RODRIGUEZ, DAVID", cargo: "VIGILANTE", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-15676513", nombre: "DUBEN, PEDRO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-16336270", nombre: "RODRIGUEZ, JOSE JESUS", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-16337709", nombre: "COVA SALAZAR, GABRIEL JESUS", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-19064822", nombre: "ROMERO, ROLAND", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-20022730", nombre: "GIL, LUIS", cargo: "SUPERVISOR DE VENTAS", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-28166652", nombre: "CEDEÑO MILLAN, OSIRIS JAVIER", cargo: "MERCADERISTA", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-28629936", nombre: "RODRIGUEZ MILLAN, YOJANKIS TAYLOR", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-28693465", nombre: "ROSAS SALAZAR, JOSE EMILIO", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-31256974", nombre: "PARACO ORDAZ, JHONAIKEL DANIEL", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-32791295", nombre: "MATA, MAIKEL", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-27872083", nombre: "BELMONTE, JONATHAN", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "V-33693843", nombre: "GONZALEZ, JOSE", cargo: "CALETERO", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },
  { cedula: "E-84503030", nombre: "PARRA SEVILLA, MARCOS ANTONIO", cargo: "MERCADERISTA", departamento: "VENTAS Y CALETAS PORLAMAR", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - EMPAQUE
  // =========================================================================
  { cedula: "V-9200404", nombre: "MOLINA, MARIO", cargo: "SUPERVISOR DE CAMPO", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-12800942", nombre: "DAVILA MOLINA, CARLOS ORANGEL", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-12957736", nombre: "MURGAS, JOHAN", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-13022257", nombre: "FLORIDA, CARLOS", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-15134499", nombre: "HERNANDEZ SANCHEZ, JOSE ENRIQUE", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-18209839", nombre: "BARRIOS, YONFREDD", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-18499531", nombre: "CHACON PARRA, YOEL ANTONIO", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-18902382", nombre: "MANRIQUE RAMIREZ, ABDEKARIN", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-19319701", nombre: "DIAZ, YORMAN", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-19440963", nombre: "ROJAS, YON", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-20571849", nombre: "VERDI, JUAN", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-23717318", nombre: "CARMONA CARMONA, JAVIER ALFONSO", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-24190395", nombre: "GIMENEZ POSADA, YEISON HABRAHAM", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-26021013", nombre: "CHACON PARRA, SERGIO ALEJANDRO", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-26553509", nombre: "GOMEZ, JULIO", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-27399637", nombre: "SARAZA SULBARAN, EUDRIS ELI", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-27632630", nombre: "GONZALEZ ZAMBRANO, MAURICIO JOSE", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-27668284", nombre: "VERDI, FABIAN", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-27778102", nombre: "GUTIERREZ, CARLOS", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-27778151", nombre: "CARREÑO, VICTOR", cargo: "SUPERVISOR DE CAMPO", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-27855887", nombre: "YRIGOYEN ZAMBRANO, MAYKEL JOSE", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-28717236", nombre: "COY, GREGORI", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-28730909", nombre: "MARQUEZ, VICTOR", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-31042349", nombre: "CONTRERAS URBINA, CARLOS EDUARDO", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-31431180", nombre: "LAYA PEREZ, ABRAHAM ALEXANDER", cargo: "CALETERO", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-31837654", nombre: "MENDEZ, ERICK", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-32180940", nombre: "VIVAS, ANTHON", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-32532685", nombre: "UZCATEGUI, JOSE", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-33171887", nombre: "MARTINEZ, JAVIER", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-33455889", nombre: "CONTRERAS, CLEDER", cargo: "CALETERO", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-32041470", nombre: "GONZALEZ ZAMBRANO, MICKEY MICHAEL", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-28610309", nombre: "CALDERON GARCIA, REIMON ALEXANDER", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-27905016", nombre: "RAMIREZ FLORES, ANDRES GERARDO", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-28610231", nombre: "CHACIN MARTINEZ, EDIXON ANDRES", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-35074900", nombre: "HERNANDEZ PACHECO, WASLER GABRIEL", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-31911118", nombre: "MUÑOZ CUADRADO, MANUEL MIGUEL", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },
  { cedula: "V-25586547", nombre: "CHAVEZ, ARMANDO", cargo: "EMPACADOR", departamento: "EMPAQUE", empresa: "SUVICA" },

  // =========================================================================
  // SUPLIDORA EL VIGIA, C.A. (SUVICA) - ACCIONISTA
  // =========================================================================
  { cedula: "V-23724063", nombre: "GOVEA RUBIO, DANIELA DEL VALLE", cargo: "ACCIONISTA", departamento: "ACCIONISTA", empresa: "SUVICA" },

  // =========================================================================
  // 2. SUVICA AGROSERVICIOS, C.A.
  // =========================================================================
  { cedula: "V-23726745", nombre: "SAVEDRA RIVERA, ANA GABRIELA", cargo: "ASISTENTE DE CONTABILIDAD", departamento: "ADMINISTRACIÓN", empresa: "SUVICA AGROSERVICIOS" },
  { cedula: "V-25438774", nombre: "RIVERA MERCADO, MARYORIE YAIRI", cargo: "GESTION NOMINA", departamento: "ADMINISTRACIÓN", empresa: "SUVICA AGROSERVICIOS" },
  { cedula: "V-14761817", nombre: "SAAVEDRA CARREÑO, JAIRO HUMBERTO", cargo: "COORDINADOR DE LOGISTICA", departamento: "OPERACIONES", empresa: "SUVICA AGROSERVICIOS" },
  { cedula: "V-10236329", nombre: "RAMIREZ, JOSE", cargo: "CHOFER", departamento: "CHOFERES", empresa: "SUVICA AGROSERVICIOS" },
  { cedula: "V-13677773", nombre: "ZERPA, PEDRO", cargo: "CHOFER", departamento: "CHOFERES", empresa: "SUVICA AGROSERVICIOS" },
  { cedula: "V-13790583", nombre: "VIVAS, ANTONIO", cargo: "CHOFER", departamento: "CHOFERES", empresa: "SUVICA AGROSERVICIOS" },
  { cedula: "V-18579855", nombre: "MORA VIVAS, JOSE PEDRO ANTONIO", cargo: "CHOFER", departamento: "CHOFERES", empresa: "SUVICA AGROSERVICIOS" },
  { cedula: "V-19901720", nombre: "IBARRA, RENE", cargo: "AYUDANTE DE CHOFER", departamento: "CHOFERES", empresa: "SUVICA AGROSERVICIOS" },
  { cedula: "V-11218135", nombre: "CARRERO ROJAS, NIXON EDUARDO", cargo: "CHOFER", departamento: "CHOFERES", empresa: "SUVICA AGROSERVICIOS" },

  // =========================================================================
  // 3. SUVIAGRICOLA, C.A.
  // =========================================================================
  { cedula: "V-8082380", nombre: "RAMIREZ LABRADOR, JAVIER ALEXANDER", cargo: "DIRECTOR", departamento: "DIRECCIÓN", empresa: "SUVIAGRICOLA" },
  { cedula: "V-15854759", nombre: "BARRIENTOS, ARMANDO DE JESUS", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-16467098", nombre: "URDANETA CHAVEZ, ISRAEL JOSE", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-16561971", nombre: "OCHOA GONZALEZ, RICARDO JOSE", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-16885617", nombre: "LOPEZ, JULIAN", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-21570225", nombre: "GONZALEZ GONZALEZ, LUIS EMIRO", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-22490375", nombre: "YEPES MONTES, JANER JOSE", cargo: "SUPERVISOR DE CAMPO", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-24251580", nombre: "MATO, ANGEL", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-24267359", nombre: "CONTRERA MEDINA, ELVIS DANIEL", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-25312270", nombre: "SOTO SOTO, CARLOS EDUARDO", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-25489064", nombre: "PEÑA ROJAS, JOSE CANDELARIO", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-26222128", nombre: "CIFUENTES, KENNEDY", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-27340626", nombre: "SUAREZ PEREZ, JOSE IGNACIO", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-27533774", nombre: "ARAQUE MEZA, JESUS DAVID", cargo: "SUPERVISOR DE CAMPO", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-27713426", nombre: "CONTRERAS DUQUE, MELVIS YOEL", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-27983521", nombre: "GONZALEZ MUÑOZ, GERMARY GABRIEL", cargo: "ASISTENTE DE CONTABILIDAD", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-31591408", nombre: "PEÑA VIVAS, JOSE GREGORIO", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-31697161", nombre: "DE LA HOZ PALMAR, CARLOS ALEJANDRO", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-32320986", nombre: "MORALES OCHOA, BRANDO ELI", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },
  { cedula: "V-33736522", nombre: "YANES DE LA HOZ, ADELIO ENRRIQUE", cargo: "OBREROS DE FINCA", departamento: "FINCA MIRAFLORES", empresa: "SUVIAGRICOLA" },

  // =========================================================================
  // 4. SUVICARNE, C.A.
  // =========================================================================
  { cedula: "V-26923361", nombre: "CONTRERAS, CRISTHIAN JOSUE", cargo: "COORDINADOR DE LOGISTICA", departamento: "ADMINISTRACIÓN", empresa: "SUVICARNE" },
  { cedula: "V-13009305", nombre: "MACHADO DE MOLINA, MABEL MARIA", cargo: "ASISTENTE DE CONTABILIDAD", departamento: "ADMINISTRACIÓN", empresa: "SUVICARNE" },
  { cedula: "V-27069873", nombre: "GUERRERO RAMIREZ, JHAN CARLOS", cargo: "COORDINADOR DE LOGISTICA", departamento: "ADMINISTRACIÓN", empresa: "SUVICARNE" },
  { cedula: "V-20532201", nombre: "AVILA MUÑOZ, ORNEY CHIQUINQUIRA", cargo: "MANTENIMIENTO DE OFICINA", departamento: "GALPÓN", empresa: "SUVICARNE" },
];

const globalFallback = globalThis as unknown as {
  trabajadoresDemo?: TrabajadorDemo[];
  dispositivosDemo?: DispositivoDemo[];
};

export const trabajadoresFallback: TrabajadorDemo[] =
  globalFallback.trabajadoresDemo ??
  NOMINA_OFICIAL_SUVICA.map((t, index) => ({
    id: `emp-${index + 1}`,
    ...t,
  }));

export const dispositivosFallback: DispositivoDemo[] =
  globalFallback.dispositivosDemo ?? [];

globalFallback.trabajadoresDemo = trabajadoresFallback;
globalFallback.dispositivosDemo = dispositivosFallback;
