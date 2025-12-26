import { Share, Platform } from "react-native";
import { SecopProcess } from "../types/index";

// ============================================
// FORMATEO DE DATOS
// ============================================
const formatCurrency = (value: string | number | undefined): string => {
  if (!value) return "";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "";
  return numValue.toString();
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
};

const escapeCSV = (value: string | undefined | null): string => {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// ============================================
// GENERACIÓN DE CSV
// ============================================
export const generateCSV = (processes: SecopProcess[]): string => {
  const headers = [
    "ID Proceso",
    "Nombre Procedimiento",
    "Descripción",
    "Entidad",
    "NIT Entidad",
    "Ciudad",
    "Departamento",
    "Modalidad",
    "Tipo Contrato",
    "Fase",
    "Precio Base",
    "Valor Adjudicado",
    "Fecha Publicación",
    "Fecha Última Actualización",
  ];

  const rows = processes.map((p) => [
    escapeCSV(p.id_del_proceso),
    escapeCSV(p.nombre_del_procedimiento),
    escapeCSV(p.descripci_n_del_procedimiento),
    escapeCSV(p.entidad),
    escapeCSV(p.nit_entidad),
    escapeCSV(p.ciudad_entidad),
    escapeCSV(p.departamento_entidad),
    escapeCSV(p.modalidad_de_contratacion),
    escapeCSV(p.tipo_de_contrato),
    escapeCSV(p.fase || p.estado_del_procedimiento),
    formatCurrency(p.precio_base),
    formatCurrency(p.valor_total_adjudicacion),
    formatDate(p.fecha_de_publicacion_del),
    formatDate(p.fecha_de_ultima_publicaci),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return "\ufeff" + csvContent;
};

// ============================================
// EXPORTAR Y COMPARTIR
// ============================================
export const exportToCSV = async (
  processes: SecopProcess[],
  filename?: string
): Promise<boolean> => {
  try {
    if (processes.length === 0) {
      throw new Error("No hay procesos para exportar");
    }

    const date = new Date().toISOString().split("T")[0];
    const finalFilename = filename || `secop_procesos_${date}.csv`;
    const csvContent = generateCSV(processes);

    // Usar Share de React Native (funciona en Expo Go y builds nativos)
    const result = await Share.share(
      Platform.OS === "ios"
        ? {
            url: `data:text/csv;charset=utf-8,${encodeURIComponent(
              csvContent
            )}`,
          }
        : { message: csvContent, title: finalFilename }
    );

    return result.action === Share.sharedAction;
  } catch (error) {
    console.error("Error exportando CSV:", error);
    throw error;
  }
};

// ============================================
// EXPORTAR FAVORITOS
// ============================================
export const exportFavorites = async (
  favorites: SecopProcess[]
): Promise<boolean> => {
  return exportToCSV(
    favorites,
    `secop_favoritos_${new Date().toISOString().split("T")[0]}.csv`
  );
};

// ============================================
// EXPORTAR RESULTADOS DE BÚSQUEDA
// ============================================
export const exportSearchResults = async (
  results: SecopProcess[],
  searchTerm?: string
): Promise<boolean> => {
  const suffix = searchTerm
    ? `_${searchTerm.replace(/\s+/g, "_").substring(0, 20)}`
    : "";
  return exportToCSV(
    results,
    `secop_busqueda${suffix}_${new Date().toISOString().split("T")[0]}.csv`
  );
};

export default {
  generateCSV,
  exportToCSV,
  exportFavorites,
  exportSearchResults,
};
