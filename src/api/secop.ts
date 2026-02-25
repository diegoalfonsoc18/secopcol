// API de SECOP II - Conexión directa a Datos Abiertos Colombia
// No requiere servidor backend

import { SecopProcess } from "../types/index";

const SECOP_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";

// Escapar comillas simples para prevenir SoQL injection
const escapeSoql = (val: string) => val.replace(/'/g, "''");

// App Token (aumenta límite de requests)
// Se lee de variable de entorno para no exponer el token en el código fuente
const APP_TOKEN = process.env.EXPO_PUBLIC_SECOP_APP_TOKEN || "";

// Re-exportar SecopProcess
export type { SecopProcess };

// Headers para la petición
const getHeaders = (): HeadersInit => {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-App-Token": APP_TOKEN,
  };
};

// Hacer petición a la API
const fetchSecop = async (query: string): Promise<SecopProcess[]> => {
  try {
    const url = `${SECOP_API_URL}?${query}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as SecopProcess[];
  } catch (error) {
    console.error("Error fetching SECOP data:", error);
    throw error;
  }
};
// Construir query SoQL para filtros
const buildQuery = (params: {
  municipio?: string;
  departamento?: string;
  entidad?: string;
  fase?: string;
  modalidad?: string | string[];
  tipoContrato?: string | string[];
  keyword?: string;
  noOffers?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  requireDate?: boolean;
  recentDays?: number;
}): string => {
  const conditions: string[] = [];

  // Filtrar por fecha reciente (últimos N días)
  if (params.recentDays) {
    const date = new Date();
    date.setDate(date.getDate() - params.recentDays);
    const dateStr = date.toISOString().split("T")[0];
    conditions.push(`fecha_de_ultima_publicaci >= '${escapeSoql(dateStr)}'`);
  } else if (params.requireDate !== false) {
    conditions.push("fecha_de_ultima_publicaci IS NOT NULL");
  }

  if (params.municipio) {
    const cleanMunicipio = params.municipio
      .replace(/,?\s*D\.?C\.?/gi, "")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();
    conditions.push(`upper(ciudad_entidad) LIKE upper('%${escapeSoql(cleanMunicipio)}%')`);
  }

  if (params.departamento) {
    const cleanDepartamento = params.departamento
      .replace(/,?\s*D\.?C\.?/gi, "")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();
    conditions.push(
      `upper(departamento_entidad) LIKE upper('%${escapeSoql(cleanDepartamento)}%')`,
    );
  }

  if (params.entidad) {
    conditions.push(`entidad='${escapeSoql(params.entidad)}'`);
  }

  if (params.fase) {
    conditions.push(`fase='${escapeSoql(params.fase)}'`);
  }

  if (params.modalidad) {
    const mods = Array.isArray(params.modalidad) ? params.modalidad : [params.modalidad];
    if (mods.length === 1) {
      conditions.push(`modalidad_de_contratacion='${escapeSoql(mods[0])}'`);
    } else if (mods.length > 1) {
      const orParts = mods.map(m => `modalidad_de_contratacion='${escapeSoql(m)}'`);
      conditions.push(`(${orParts.join(" OR ")})`);
    }
  }

  if (params.tipoContrato) {
    const tipos = Array.isArray(params.tipoContrato) ? params.tipoContrato : [params.tipoContrato];
    if (tipos.length === 1) {
      conditions.push(`tipo_de_contrato='${escapeSoql(tipos[0])}'`);
    } else if (tipos.length > 1) {
      const orParts = tipos.map(t => `tipo_de_contrato='${escapeSoql(t)}'`);
      conditions.push(`(${orParts.join(" OR ")})`);
    }
  }

  if (params.keyword) {
    const keyword = escapeSoql(params.keyword);
    conditions.push(
      `(upper(descripci_n_del_procedimiento) LIKE upper('%${keyword}%') OR upper(entidad) LIKE upper('%${keyword}%') OR upper(nombre_del_procedimiento) LIKE upper('%${keyword}%'))`,
    );
  }

  if (params.noOffers) {
    conditions.push(
      `(respuestas_al_procedimiento IS NULL OR respuestas_al_procedimiento = '0')`,
    );
  }

  let query = "";

  if (conditions.length > 0) {
    query += `$where=${encodeURIComponent(conditions.join(" AND "))}`;
  }

  const limit = params.limit || 50;
  query += `${query ? "&" : ""}$limit=${limit}`;

  if (params.offset) {
    query += `&$offset=${params.offset}`;
  }

  const orderBy = params.orderBy || "fecha_de_ultima_publicaci DESC";
  query += `&$order=${encodeURIComponent(orderBy)}`;

  return query;
};
// ============================================
// FUNCIONES PÚBLICAS
// ============================================

export const getRecentProcesses = async (
  limit: number = 50,
): Promise<SecopProcess[]> => {
  const query = buildQuery({
    limit,
    orderBy: "fecha_de_publicacion_del DESC",
  });
  return fetchSecop(query);
};

export const searchProcesses = async (
  keyword: string,
  limit: number = 50,
): Promise<SecopProcess[]> => {
  const query = buildQuery({
    keyword,
    limit,
    orderBy: "fecha_de_publicacion_del DESC",
  });
  return fetchSecop(query);
};

export const getProcessesByMunicipality = async (
  municipio: string,
  limit: number = 50,
): Promise<SecopProcess[]> => {
  const query = buildQuery({
    municipio,
    limit,
    orderBy: "fecha_de_publicacion_del DESC",
  });
  return fetchSecop(query);
};

export const getProcessesByDepartment = async (
  departamento: string,
  limit: number = 50,
): Promise<SecopProcess[]> => {
  const query = buildQuery({
    departamento,
    limit,
    orderBy: "fecha_de_publicacion_del DESC",
  });
  return fetchSecop(query);
};

export const getProcessesByPhase = async (
  fase: string,
  limit: number = 50,
): Promise<SecopProcess[]> => {
  const query = buildQuery({
    fase,
    limit,
    orderBy: "fecha_de_publicacion_del DESC",
  });
  return fetchSecop(query);
};

export const getProcessesByModality = async (
  modalidad: string,
  limit: number = 50,
): Promise<SecopProcess[]> => {
  const query = buildQuery({
    modalidad,
    limit,
    orderBy: "fecha_de_publicacion_del DESC",
  });
  return fetchSecop(query);
};

export const advancedSearch = async (params: {
  keyword?: string;
  departamento?: string;
  municipio?: string;
  entidad?: string;
  fase?: string;
  modalidad?: string | string[];
  tipoContrato?: string | string[];
  noOffers?: boolean;
  recentDays?: number;
  limit?: number;
  offset?: number;
}): Promise<SecopProcess[]> => {
  const query = buildQuery({
    ...params,
    orderBy: "fecha_de_ultima_publicaci DESC",
    requireDate: false, // No filtrar por fecha_de_publicacion_del
  });
  return fetchSecop(query);
};

export const getProcessById = async (
  id: string,
): Promise<SecopProcess | null> => {
  const query = `$where=${encodeURIComponent(
    `id_del_proceso='${escapeSoql(id)}'`,
  )}&$limit=1`;
  const results = await fetchSecop(query);
  return results.length > 0 ? results[0] : null;
};

export const getCountByMunicipality = async (
  municipio: string,
): Promise<number> => {
  try {
    const url = `${SECOP_API_URL}?$select=count(*)&$where=${encodeURIComponent(
      `ciudad_entidad='${escapeSoql(municipio)}'`,
    )}`;
    const response = await fetch(url, { headers: getHeaders() });
    const data = await response.json();
    return parseInt(data[0]?.count || "0", 10);
  } catch {
    return 0;
  }
};

// Dataset de Proponentes por Proceso SECOP II
const PROPONENTES_API_URL = "https://www.datos.gov.co/resource/hgi6-6wh3.json";

export interface SecopProponente {
  id_procedimiento: string;
  fecha_publicaci_n?: string;
  nombre_procedimiento?: string;
  entidad_compradora?: string;
  proveedor: string;
  nit_proveedor?: string;
}

export const getProponentesByProcess = async (
  processId: string,
): Promise<SecopProponente[]> => {
  try {
    const url = `${PROPONENTES_API_URL}?$where=${encodeURIComponent(
      `id_procedimiento='${escapeSoql(processId)}'`,
    )}&$order=proveedor ASC&$limit=100`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return [];
    const data: SecopProponente[] = await response.json();
    // Deduplicar por NIT del proveedor
    const seen = new Set<string>();
    return data.filter((p) => {
      const key = p.nit_proveedor || p.proveedor;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    return [];
  }
};

export const getEntitiesByLocation = async (params: {
  departamento?: string;
  municipio?: string;
}): Promise<string[]> => {
  try {
    const conditions: string[] = [];
    if (params.municipio) {
      conditions.push(`upper(ciudad_entidad) LIKE upper('%${escapeSoql(params.municipio)}%')`);
    }
    if (params.departamento) {
      conditions.push(`upper(departamento_entidad) LIKE upper('%${escapeSoql(params.departamento)}%')`);
    }
    if (conditions.length === 0) return [];

    const where = encodeURIComponent(conditions.join(" AND "));
    const url = `${SECOP_API_URL}?$select=entidad&$group=entidad&$order=entidad&$where=${where}&$limit=500`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) return [];
    const data: { entidad: string }[] = await response.json();
    return data.map((d) => d.entidad).filter(Boolean);
  } catch {
    return [];
  }
};

// Constantes útiles
export const SECOP_PHASES = [
  "Presentación de oferta",
  "Fase de ofertas",
  "Presentación de observaciones",
  "Manifestación de interés (Menor Cuantía)",
  "Fase de Selección (Presentación de ofertas)",
  "Proceso de ofertas",
  "Selección de ofertas (borrador)",
  "Pré-Calificación de competidores",
  "Fase de Concurso",
];

// Fases donde el proceso acepta ofertas (abierto)
export const SECOP_OPEN_PHASES = [
  "Presentación de oferta",
  "Fase de ofertas",
  "Fase de Selección (Presentación de ofertas)",
  "Proceso de ofertas",
  "Manifestación de interés (Menor Cuantía)",
];

export const SECOP_MODALITIES = [
  "Licitación pública",
  "Contratación directa",
  "Mínima cuantía",
  "Selección abreviada menor cuantía",
  "Concurso de méritos abierto",
  "Contratación régimen especial",
];

export default {
  getRecentProcesses,
  searchProcesses,
  getProcessesByMunicipality,
  getProcessesByDepartment,
  getProcessesByPhase,
  getProcessesByModality,
  advancedSearch,
  getProcessById,
  getCountByMunicipality,
  SECOP_PHASES,
  SECOP_MODALITIES,
};
