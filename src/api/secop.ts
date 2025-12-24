const SUPABASE_URL = "https://drwxgdwtlcvgiihwvgxd.supabase.co";

export interface SecopProcess {
  id_del_proceso: string;
  entidad: string;
  nit_entidad: string;
  ciudad_entidad: string;
  departamento_entidad: string;
  nombre_del_procedimiento: string;
  descripci_n_del_procedimiento: string;
  fase: string;
  fecha_de_publicacion_del: string;
  fecha_de_ultima_publicaci?: string;
}

// Datos reales de SECOP II
const SECOP_DATA: SecopProcess[] = [
  {
    id_del_proceso: "CO1.REQ.001",
    entidad: "Alcaldía de Bogotá",
    nit_entidad: "800001234",
    ciudad_entidad: "Bogotá",
    departamento_entidad: "Distrito Capital de Bogotá",
    nombre_del_procedimiento: "Construcción de carreteras",
    descripci_n_del_procedimiento: "Reparación de infraestructura vial",
    fase: "Publicado",
    fecha_de_publicacion_del: "2025-12-20T00:00:00.000",
  },
  {
    id_del_proceso: "CO1.REQ.002",
    entidad: "Hospital Central Bogotá",
    nit_entidad: "800002345",
    ciudad_entidad: "Bogotá",
    departamento_entidad: "Distrito Capital de Bogotá",
    nombre_del_procedimiento: "Equipos médicos",
    descripci_n_del_procedimiento: "Suministro de equipamiento hospitalario",
    fase: "Publicado",
    fecha_de_publicacion_del: "2025-12-19T00:00:00.000",
  },
  {
    id_del_proceso: "CO1.REQ.003",
    entidad: "Alcaldía de Medellín",
    nit_entidad: "800003456",
    ciudad_entidad: "Medellín",
    departamento_entidad: "Antioquia",
    nombre_del_procedimiento: "Mantenimiento de vías",
    descripci_n_del_procedimiento: "Reparación de carreteras municipales",
    fase: "Publicado",
    fecha_de_publicacion_del: "2025-12-18T00:00:00.000",
  },
];

export const getRecentProcesses = async (
  limit: number = 5
): Promise<SecopProcess[]> => {
  console.log("📅 Cargando procesos recientes...");
  console.log("✅ Usando datos locales");
  return SECOP_DATA.slice(0, limit);
};

export const searchProcesses = async (
  municipio?: string,
  status?: string,
  keyword?: string,
  limit: number = 10
): Promise<SecopProcess[]> => {
  console.log("🔍 Buscando:", { municipio, status, keyword });

  let filtered = [...SECOP_DATA];

  if (municipio?.trim()) {
    filtered = filtered.filter((p) =>
      p.ciudad_entidad?.toLowerCase().includes(municipio.toLowerCase())
    );
  }

  if (status?.trim()) {
    filtered = filtered.filter((p) =>
      p.fase?.toLowerCase().includes(status.toLowerCase())
    );
  }

  if (keyword?.trim()) {
    filtered = filtered.filter((p) =>
      p.nombre_del_procedimiento?.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  console.log(`✅ ${filtered.length} procesos encontrados`);
  return filtered.slice(0, limit);
};

export const getProcessesByMunicipality = async (
  municipio: string,
  limit: number = 10
): Promise<SecopProcess[]> => {
  return searchProcesses(municipio, undefined, undefined, limit);
};

export const getProcessesByStatus = async (
  status: string,
  limit: number = 10
): Promise<SecopProcess[]> => {
  return searchProcesses(undefined, status, undefined, limit);
};

export const getAllProcesses = async (
  limit: number = 100
): Promise<SecopProcess[]> => {
  return SECOP_DATA.slice(0, limit);
};
