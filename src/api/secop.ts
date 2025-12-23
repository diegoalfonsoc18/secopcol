const SECOP_API_BASE = "https://www.datos.gov.co/api/views/p6dx-8zbt/rows.json";

export interface SecopProcess {
  id_proceso: string;
  nombre_entidad: string;
  municipio: string;
  estado_proceso: string;
  objeto: string;
  valor_estimado: number;
  fecha_publicacion: string;
  fecha_cierre: string;
  tipo_proceso: string;
  nit_entidad: string;
}

// Datos de prueba
const MOCK_DATA: SecopProcess[] = [
  {
    id_proceso: "CO1.NTC.TEST.001",
    nombre_entidad: "Municipalidad de Bogotá",
    municipio: "Bogotá",
    estado_proceso: "Publicado",
    objeto: "Suministro de materiales de construcción",
    valor_estimado: 150000000,
    fecha_publicacion: "2024-12-17T00:00:00",
    fecha_cierre: "2024-12-27T00:00:00",
    tipo_proceso: "Licititud Pública",
    nit_entidad: "800001234",
  },
  {
    id_proceso: "CO1.NTC.TEST.002",
    nombre_entidad: "Hospital San Rafael",
    municipio: "Medellín",
    estado_proceso: "Publicado",
    objeto: "Servicios de mantenimiento de equipos médicos",
    valor_estimado: 85000000,
    fecha_publicacion: "2024-12-16T00:00:00",
    fecha_cierre: "2024-12-26T00:00:00",
    tipo_proceso: "Selección Abreviada",
    nit_entidad: "890123456",
  },
  {
    id_proceso: "CO1.NTC.TEST.003",
    nombre_entidad: "Secretaría de Educación Cali",
    municipio: "Cali",
    estado_proceso: "En Evaluación",
    objeto: "Uniformes y útiles escolares",
    valor_estimado: 120000000,
    fecha_publicacion: "2024-12-15T00:00:00",
    fecha_cierre: "2024-12-25T00:00:00",
    tipo_proceso: "Contratación Directa",
    nit_entidad: "800567890",
  },
];

function fetchWithTimeout(
  url: string,
  timeout: number = 8000
): Promise<Response> {
  return Promise.race([
    fetch(url),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), timeout)
    ),
  ]);
}

export const getRecentProcesses = async (
  days: number = 7,
  limit: number = 20
): Promise<SecopProcess[]> => {
  try {
    console.log("📅 getRecentProcesses");
    const query = `?$limit=${limit}&$order=fecha_publicacion DESC`;
    const url = `${SECOP_API_BASE}${query}`;
    console.log("⏳ Enviando request...");

    try {
      const response = await fetchWithTimeout(url, 8000);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log("✅ Got", data.length, "items from API");
      return Array.isArray(data) ? data : MOCK_DATA;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.warn("⚠️ API timeout - usando datos de prueba");
      return MOCK_DATA;
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return MOCK_DATA;
  }
};

export const searchProcesses = async (
  municipio?: string,
  status?: string,
  keyword?: string,
  limit: number = 50
): Promise<SecopProcess[]> => {
  try {
    let filtered = [...MOCK_DATA];
    if (municipio) {
      filtered = filtered.filter((p) =>
        p.municipio.toLowerCase().includes(municipio.toLowerCase())
      );
    }
    if (status) {
      filtered = filtered.filter(
        (p) => p.estado_proceso.toLowerCase() === status.toLowerCase()
      );
    }
    if (keyword) {
      filtered = filtered.filter((p) =>
        p.objeto.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    return filtered;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return MOCK_DATA;
  }
};

export const getProcessesByMunicipality = async (
  municipio: string,
  limit: number = 50
): Promise<SecopProcess[]> => {
  return MOCK_DATA.filter((p) => p.municipio === municipio);
};

export const getProcessesByStatus = async (
  status: string,
  limit: number = 50
): Promise<SecopProcess[]> => {
  return MOCK_DATA.filter((p) => p.estado_proceso === status);
};

export const getAllProcesses = async (
  limit: number = 100
): Promise<SecopProcess[]> => {
  return MOCK_DATA;
};
