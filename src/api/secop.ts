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

// Datos de prueba expandidos
const MOCK_DATA: SecopProcess[] = [
  {
    id_proceso: "CO1.NTC.TEST.001",
    nombre_entidad: "Municipalidad de Bogotá",
    municipio: "Bogotá",
    estado_proceso: "Publicado",
    objeto: "Suministro de materiales de construcción para reparación de vías",
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
    objeto:
      "Contratación de servicios de mantenimiento preventivo de equipos médicos",
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
    objeto:
      "Suministro de uniformes y útiles escolares para establecimientos educativos",
    valor_estimado: 120000000,
    fecha_publicacion: "2024-12-15T00:00:00",
    fecha_cierre: "2024-12-25T00:00:00",
    tipo_proceso: "Contratación Directa",
    nit_entidad: "800567890",
  },
  {
    id_proceso: "CO1.NTC.TEST.004",
    nombre_entidad: "Alcaldía de Barranquilla",
    municipio: "Barranquilla",
    estado_proceso: "Adjudicado",
    objeto: "Servicio de recolección y disposición final de residuos sólidos",
    valor_estimado: 250000000,
    fecha_publicacion: "2024-12-14T00:00:00",
    fecha_cierre: "2024-12-24T00:00:00",
    tipo_proceso: "Licititud Pública",
    nit_entidad: "800234567",
  },
  {
    id_proceso: "CO1.NTC.TEST.005",
    nombre_entidad: "EAAB Cartagena",
    municipio: "Cartagena",
    estado_proceso: "Publicado",
    objeto:
      "Reparación y mantenimiento de líneas de distribución de agua potable",
    valor_estimado: 95000000,
    fecha_publicacion: "2024-12-13T00:00:00",
    fecha_cierre: "2024-12-23T00:00:00",
    tipo_proceso: "Selección Abreviada",
    nit_entidad: "800345678",
  },
  {
    id_proceso: "CO1.NTC.TEST.006",
    nombre_entidad: "Municipalidad de Bogotá",
    municipio: "Bogotá",
    estado_proceso: "Publicado",
    objeto: "Construcción de biblioteca municipal",
    valor_estimado: 500000000,
    fecha_publicacion: "2024-12-12T00:00:00",
    fecha_cierre: "2024-12-22T00:00:00",
    tipo_proceso: "Licititud Pública",
    nit_entidad: "800001235",
  },
  {
    id_proceso: "CO1.NTC.TEST.007",
    nombre_entidad: "Secretaría de Salud Bogotá",
    municipio: "Bogotá",
    estado_proceso: "Publicado",
    objeto: "Suministro de medicamentos y vacunas",
    valor_estimado: 800000000,
    fecha_publicacion: "2024-12-11T00:00:00",
    fecha_cierre: "2024-12-21T00:00:00",
    tipo_proceso: "Contratación Directa",
    nit_entidad: "800001236",
  },
  {
    id_proceso: "CO1.NTC.TEST.008",
    nombre_entidad: "Alcaldía de Medellín",
    municipio: "Medellín",
    estado_proceso: "Publicado",
    objeto: "Reparación de vías urbanas",
    valor_estimado: 350000000,
    fecha_publicacion: "2024-12-10T00:00:00",
    fecha_cierre: "2024-12-20T00:00:00",
    tipo_proceso: "Licititud Pública",
    nit_entidad: "890123457",
  },
  {
    id_proceso: "CO1.NTC.TEST.009",
    nombre_entidad: "Instituto de Cultura Cali",
    municipio: "Cali",
    estado_proceso: "Publicado",
    objeto: "Organización de eventos culturales",
    valor_estimado: 45000000,
    fecha_publicacion: "2024-12-09T00:00:00",
    fecha_cierre: "2024-12-19T00:00:00",
    tipo_proceso: "Contratación Directa",
    nit_entidad: "800567891",
  },
  {
    id_proceso: "CO1.NTC.TEST.010",
    nombre_entidad: "Empresa de Servicios Públicos",
    municipio: "Bogotá",
    estado_proceso: "Publicado",
    objeto: "Mantenimiento de sistemas de distribución de energía",
    valor_estimado: 200000000,
    fecha_publicacion: "2024-12-08T00:00:00",
    fecha_cierre: "2024-12-18T00:00:00",
    tipo_proceso: "Selección Abreviada",
    nit_entidad: "800001237",
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

// Obtener procesos recientes del API real (últimos 5)
export const getRecentProcesses = async (
  days: number = 7,
  limit: number = 5
): Promise<SecopProcess[]> => {
  try {
    console.log("📅 getRecentProcesses - Intentando API real");

    // Intentar conectar al API real con query simple
    const query = `?$limit=${limit}&$order=fecha_publicacion DESC`;
    const url = `${SECOP_API_BASE}${query}`;
    console.log("📡 URL:", url);
    console.log("⏳ Esperando respuesta (timeout: 5s)...");

    const startTime = Date.now();
    const response = await fetchWithTimeout(url, 5000);
    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const count = Array.isArray(data) ? data.length : 0;

    console.log(`✅ API real respondió en ${duration}ms`);
    console.log(`📊 Procesos recibidos: ${count}`);

    if (Array.isArray(data) && data.length > 0) {
      console.log("🎉 Usando datos del API real SECOP II");
      return data.slice(0, limit);
    } else {
      console.warn("⚠️ API devolvió datos vacíos - usando MOCK_DATA");
      return MOCK_DATA.slice(0, limit);
    }
  } catch (error: any) {
    console.warn("⚠️ API SECOP II no disponible");
    console.warn(`   Razón: ${error.message}`);
    console.warn("📦 Usando datos de prueba (MOCK_DATA)");
    return MOCK_DATA.slice(0, limit);
  }
};

// Búsqueda con filtros
export const searchProcesses = async (
  municipio?: string,
  status?: string,
  keyword?: string,
  limit: number = 10
): Promise<SecopProcess[]> => {
  try {
    console.log("🔍 searchProcesses INICIO:", { municipio, status, keyword });
    console.log("📊 Total MOCK_DATA:", MOCK_DATA.length);

    let filtered = [...MOCK_DATA];
    console.log("1️⃣ Datos iniciales:", filtered.length);

    // Filtrar por municipio
    if (municipio && municipio.trim()) {
      console.log("🔎 Filtrando por municipio:", municipio);
      filtered = filtered.filter((p) => {
        const match = p.municipio.toLowerCase() === municipio.toLowerCase();
        console.log(`  ${p.municipio} === ${municipio} ? ${match}`);
        return match;
      });
      console.log("2️⃣ Después de municipio:", filtered.length);
    }

    // Filtrar por estado
    if (status && status.trim()) {
      console.log("🔎 Filtrando por estado:", status);
      filtered = filtered.filter((p) => {
        const match = p.estado_proceso.toLowerCase() === status.toLowerCase();
        console.log(`  ${p.estado_proceso} === ${status} ? ${match}`);
        return match;
      });
      console.log("3️⃣ Después de estado:", filtered.length);
    }

    // Filtrar por palabra clave
    if (keyword && keyword.trim()) {
      console.log("🔎 Filtrando por keyword:", keyword);
      filtered = filtered.filter((p) =>
        p.objeto.toLowerCase().includes(keyword.toLowerCase())
      );
      console.log("4️⃣ Después de keyword:", filtered.length);
    }

    // Devolver solo los últimos N resultados
    const result = filtered.slice(0, limit);
    console.log("✅ Resultados finales:", result.length);

    return result;
  } catch (error) {
    console.error("❌ Error searching processes:", error);
    return [];
  }
};

// Filtro por municipio
export const getProcessesByMunicipality = async (
  municipio: string,
  limit: number = 10
): Promise<SecopProcess[]> => {
  return MOCK_DATA.filter((p) => p.municipio === municipio).slice(0, limit);
};

// Filtro por estado
export const getProcessesByStatus = async (
  status: string,
  limit: number = 10
): Promise<SecopProcess[]> => {
  return MOCK_DATA.filter((p) => p.estado_proceso === status).slice(0, limit);
};

// Obtener listado general
export const getAllProcesses = async (
  limit: number = 100
): Promise<SecopProcess[]> => {
  return MOCK_DATA.slice(0, limit);
};
