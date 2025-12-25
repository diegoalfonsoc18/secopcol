// API de SECOP II - Conexión directa a Datos Abiertos Colombia
// No requiere servidor backend

import { SecopProcess } from "../types/index";

const SECOP_API_URL = "https://www.datos.gov.co/resource/p6dx-8zbt.json";

// App Token (opcional, aumenta límite de requests)
// Obtener en: https://www.datos.gov.co/profile/edit/developer_settings
const APP_TOKEN = "";

// Re-exportar SecopProcess para que otros archivos puedan importarlo desde aquí
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
}): string => {
  const conditions: string[] = [];

  // Por defecto, solo traer procesos con fecha de publicación
  if (params.requireDate !== false) {
    conditions.push("fecha_de_publicacion_del IS NOT NULL");
  }

  if (params.municipio) {
    conditions.push(`ciudad_entidad='${params.municipio}'`);
  }

  if (params.departamento) {
    conditions.push(`departamento_entidad='${params.departamento}'`);
  }

  if (params.fase) {
    // Buscar en fase O en estado_del_procedimiento
    conditions.push(
      `(fase='${params.fase}' OR estado_del_procedimiento='${params.fase}')`
    );
  }

  if (params.modalidad) {
    conditions.push(`modalidad_de_contratacion='${params.modalidad}'`);
  }

  if (params.tipoContrato) {
    conditions.push(`tipo_de_contrato='${params.tipoContrato}'`);
  }

  if (params.keyword) {
    // Buscar en nombre o descripción (case insensitive)
    const keyword = params.keyword.toLowerCase();
    conditions.push(
      `(lower(nombre_del_procedimiento) like '%${keyword}%' OR lower(descripci_n_del_procedimiento) like '%${keyword}%' OR lower(entidad) like '%${keyword}%')`
    );
  }

  const queryParams = new URLSearchParams();

  if (conditions.length > 0) {
    queryParams.append("$where", conditions.join(" AND "));
  }

  queryParams.append("$limit", String(params.limit || 20));

  if (params.offset) {
    queryParams.append("$offset", String(params.offset));
  }

  queryParams.append(
    "$order",
    params.orderBy || "fecha_de_publicacion_del DESC"
  );

  return queryParams.toString();
};

// Petición genérica
const fetchFromSecop = async (queryString: string): Promise<SecopProcess[]> => {
  const url = `${SECOP_API_URL}?${queryString}`;
  console.log("🌐 SECOP API:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ ${data.length} procesos obtenidos`);
    return data;
  } catch (error) {
    console.error("❌ Error SECOP API:", error);
    throw error;
  }
};

// ============================================
// FUNCIONES PÚBLICAS
// ============================================

/**
 * Obtener procesos recientes
 */
export const getRecentProcesses = async (
  limit: number = 20
): Promise<SecopProcess[]> => {
  console.log("📅 Cargando procesos recientes...");
  const query = buildQuery({
    limit,
    orderBy: "fecha_de_publicacion_del DESC",
  });
  return fetchFromSecop(query);
};

/**
 * Buscar procesos con filtros
 */
export const searchProcesses = async (
  municipio?: string,
  status?: string, // Este parámetro ahora se usa como "fase"
  keyword?: string,
  limit: number = 20
): Promise<SecopProcess[]> => {
  console.log("🔍 Buscando:", { municipio, status, keyword });
  const query = buildQuery({
    municipio,
    fase: status,
    keyword,
    limit,
  });
  return fetchFromSecop(query);
};

/**
 * Buscar por municipio
 */
export const getProcessesByMunicipality = async (
  municipio: string,
  limit: number = 20
): Promise<SecopProcess[]> => {
  console.log("📍 Buscando en:", municipio);
  const query = buildQuery({ municipio, limit });
  return fetchFromSecop(query);
};

/**
 * Buscar por departamento
 */
export const getProcessesByDepartment = async (
  departamento: string,
  limit: number = 20
): Promise<SecopProcess[]> => {
  console.log("🗺️ Buscando en departamento:", departamento);
  const query = buildQuery({ departamento, limit });
  return fetchFromSecop(query);
};

/**
 * Buscar por fase/estado
 */
export const getProcessesByPhase = async (
  fase: string,
  limit: number = 20
): Promise<SecopProcess[]> => {
  console.log("📊 Buscando fase:", fase);
  const query = buildQuery({ fase, limit });
  return fetchFromSecop(query);
};

/**
 * Buscar por modalidad de contratación
 */
export const getProcessesByModality = async (
  modalidad: string,
  limit: number = 20
): Promise<SecopProcess[]> => {
  console.log("📋 Buscando modalidad:", modalidad);
  const query = buildQuery({ modalidad, limit });
  return fetchFromSecop(query);
};

/**
 * Búsqueda avanzada con múltiples filtros
 */
export const advancedSearch = async (params: {
  municipio?: string;
  departamento?: string;
  fase?: string;
  modalidad?: string;
  tipoContrato?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}): Promise<SecopProcess[]> => {
  console.log("🔎 Búsqueda avanzada:", params);
  const query = buildQuery(params);
  return fetchFromSecop(query);
};

/**
 * Obtener un proceso por ID
 */
export const getProcessById = async (
  id: string
): Promise<SecopProcess | null> => {
  console.log("🔍 Buscando proceso:", id);
  const query = `$where=id_del_proceso='${id}'&$limit=1`;
  const results = await fetchFromSecop(query);
  return results.length > 0 ? results[0] : null;
};

/**
 * Obtener estadísticas (count) por municipio
 */
export const getCountByMunicipality = async (
  municipio: string
): Promise<number> => {
  const url = `${SECOP_API_URL}?$select=count(*)&$where=ciudad_entidad='${municipio}'`;
  try {
    const response = await fetch(url, { headers: getHeaders() });
    const data = await response.json();
    return parseInt(data[0]?.count || "0", 10);
  } catch (error) {
    console.error("Error getting count:", error);
    return 0;
  }
};

// Fases disponibles en SECOP II
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
] as const;

// Modalidades de contratación
export const SECOP_MODALITIES = [
  "Licitación Pública",
  "Selección Abreviada",
  "Contratación Directa",
  "Concurso de Méritos",
  "Mínima Cuantía",
  "Contratación régimen especial",
  "Contratación Régimen Especial (con ofertas)",
  "Asociación Público Privada",
] as const;

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
