// API de SECOP II - Conexión directa a Datos Abiertos Colombia
// No requiere servidor backend

import { SecopProcess } from "../types/index";

const SECOP_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";

// App Token (opcional, aumenta límite de requests)
const APP_TOKEN = "";

// Re-exportar SecopProcess
export type { SecopProcess };

// Headers para la petición
const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (APP_TOKEN) {
    headers["X-App-Token"] = APP_TOKEN;
  }
  return headers;
};

// Construir query SoQL para filtros
const buildQuery = (params: {
  municipio?: string;
  departamento?: string;
  fase?: string;
  modalidad?: string;
  tipoContrato?: string;
  keyword?: string;
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
    conditions.push(`fecha_de_ultima_publicaci >= '${dateStr}'`);
  } else if (params.requireDate !== false) {
    conditions.push("fecha_de_ultima_publicaci IS NOT NULL");
  }

  if (params.municipio) {
    const cleanMunicipio = params.municipio
      .replace(/,?\s*D\.?C\.?/gi, "")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();
    conditions.push(`upper(ciudad_entidad) LIKE upper('%${cleanMunicipio}%')`);
  }

  if (params.departamento) {
    const cleanDepartamento = params.departamento
      .replace(/,?\s*D\.?C\.?/gi, "")
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();
    conditions.push(
      `upper(departamento_entidad) LIKE upper('%${cleanDepartamento}%')`,
    );
  }

  if (params.fase) {
    conditions.push(`fase='${params.fase}'`);
  }

  if (params.modalidad) {
    conditions.push(`modalidad_de_contratacion='${params.modalidad}'`);
  }

  if (params.tipoContrato) {
    conditions.push(`tipo_de_contrato='${params.tipoContrato}'`);
  }

  if (params.keyword) {
    const keyword = params.keyword.replace(/'/g, "''");
    conditions.push(
      `(upper(descripci_n_del_procedimiento) LIKE upper('%${keyword}%') OR upper(entidad) LIKE upper('%${keyword}%') OR upper(nombre_del_procedimiento) LIKE upper('%${keyword}%'))`,
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
  fase?: string;
  modalidad?: string;
  tipoContrato?: string;
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
    `id_del_proceso='${id}'`,
  )}&$limit=1`;
  const results = await fetchSecop(query);
  return results.length > 0 ? results[0] : null;
};

export const getCountByMunicipality = async (
  municipio: string,
): Promise<number> => {
  try {
    const url = `${SECOP_API_URL}?$select=count(*)&$where=${encodeURIComponent(
      `ciudad_entidad='${municipio}'`,
    )}`;
    const response = await fetch(url, { headers: getHeaders() });
    const data = await response.json();
    return parseInt(data[0]?.count || "0", 10);
  } catch {
    return 0;
  }
};

// Constantes útiles
export const SECOP_PHASES = [
  "Borrador",
  "Planeación",
  "Selección",
  "Contratación",
  "Ejecución",
  "Liquidación",
  "Terminado",
  "Cancelado",
  "Suspendido",
  "Desierto",
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
