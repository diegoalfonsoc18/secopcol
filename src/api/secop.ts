import axios from "axios";

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

interface SecopApiResponse {
  data: SecopProcess[];
  meta: {
    view: {
      id: string;
      name: string;
      rowsUpdatedAt: number;
    };
  };
}

// Filtro por municipio
export const getProcessesByMunicipality = async (
  municipio: string,
  limit: number = 50
): Promise<SecopProcess[]> => {
  try {
    const query = `?$where=municipio like '%${municipio}%'&$limit=${limit}&$order=fecha_publicacion DESC`;
    const response = await axios.get<SecopApiResponse>(
      `${SECOP_API_BASE}${query}`
    );

    // Los datos reales vienen en el array 'data'
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching processes by municipality:", error);
    throw error;
  }
};

// Filtro por estado del proceso
export const getProcessesByStatus = async (
  status: string,
  limit: number = 50
): Promise<SecopProcess[]> => {
  try {
    const query = `?$where=estado_proceso='${status}'&$limit=${limit}&$order=fecha_publicacion DESC`;
    const response = await axios.get<SecopApiResponse>(
      `${SECOP_API_BASE}${query}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching processes by status:", error);
    throw error;
  }
};

// Búsqueda general con múltiples filtros
export const searchProcesses = async (
  municipio?: string,
  status?: string,
  keyword?: string,
  limit: number = 50
): Promise<SecopProcess[]> => {
  try {
    let query = "?$limit=" + limit;

    if (municipio) {
      query += `&$where=municipio like '%${municipio}%'`;
    }

    if (status) {
      if (municipio) {
        query += ` AND estado_proceso='${status}'`;
      } else {
        query += `&$where=estado_proceso='${status}'`;
      }
    }

    if (keyword) {
      const whereClause = municipio || status ? " AND " : "&$where=";
      query += `${whereClause}objeto like '%${keyword}%'`;
    }

    query += "&$order=fecha_publicacion DESC";

    const response = await axios.get<SecopApiResponse>(
      `${SECOP_API_BASE}${query}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error searching processes:", error);
    throw error;
  }
};

// Obtener procesos recientes
export const getRecentProcesses = async (
  days: number = 7,
  limit: number = 50
): Promise<SecopProcess[]> => {
  try {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const formattedDate = date.toISOString().split("T")[0];

    const query = `?$where=fecha_publicacion > '${formattedDate}'&$limit=${limit}&$order=fecha_publicacion DESC`;
    const response = await axios.get<SecopApiResponse>(
      `${SECOP_API_BASE}${query}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching recent processes:", error);
    throw error;
  }
};

// Obtener listado general (útil para cargar en caché)
export const getAllProcesses = async (
  limit: number = 100
): Promise<SecopProcess[]> => {
  try {
    const query = `?$limit=${limit}&$order=fecha_publicacion DESC`;
    const response = await axios.get<SecopApiResponse>(
      `${SECOP_API_BASE}${query}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching all processes:", error);
    throw error;
  }
};
