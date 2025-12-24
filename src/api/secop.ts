const API_URL = "http://192.168.101.23:3000";

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

const makeRequest = async (url: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send();
  });
};

export const getRecentProcesses = async (
  limit: number = 5
): Promise<SecopProcess[]> => {
  console.log("📅 Cargando procesos recientes...");
  try {
    const result = await makeRequest(`${API_URL}/api/recent?limit=${limit}`);
    if (result.success && Array.isArray(result.data)) {
      console.log(`✅ ${result.count} procesos`);
      return result.data;
    }
    throw new Error(result.error || "No data");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  }
};

export const searchProcesses = async (
  municipio?: string,
  status?: string,
  keyword?: string,
  limit: number = 10
): Promise<SecopProcess[]> => {
  console.log("🔍 Buscando:", { municipio, status, keyword });
  try {
    let url = `${API_URL}/api/search?limit=${limit}`;
    if (municipio) url += `&municipio=${encodeURIComponent(municipio)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

    const result = await makeRequest(url);
    if (result.success && Array.isArray(result.data)) {
      console.log(`✅ ${result.count} procesos encontrados`);
      return result.data;
    }
    return [];
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return [];
  }
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
  try {
    const result = await makeRequest(`${API_URL}/api/recent?limit=${limit}`);
    return result.success && Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error("❌ Error:", error);
    return [];
  }
};
