// Proceso de contratación SECOP II
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
  [key: string]: any; // Para campos adicionales que pueda devolver la API
}

// Estados posibles de un proceso
export type ProcessStatus =
  | "Publicado"
  | "Adjudicado"
  | "Cerrado"
  | "En Evaluación"
  | "Cancelado"
  | "Suspendido"
  | "Desierto";

// Tipos de proceso de contratación
export type ProcessType =
  | "Licititud Pública"
  | "Selección Abreviada"
  | "Contratación Directa"
  | "Concurso de Méritos"
  | "Procedimiento Especial";

// Municipios de Colombia (principales)
export const COLOMBIAN_MUNICIPALITIES = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Bucaramanga",
  "Cúcuta",
  "Manizales",
  "Pereira",
  "Santa Marta",
  "Villavicencio",
  "Ibagué",
  "Montería",
  "Popayán",
  "Tunja",
  "Valledupar",
  "Quibdó",
  "Sincelejo",
  "Pasto",
  "Armenia",
  "Yopal",
  "Arauca",
  "Inírida",
  "Mitú",
  "Leticia",
  "Puerto Carreño",
] as const;

// Parámetros de búsqueda
export interface SearchParams {
  municipio?: string;
  status?: ProcessStatus;
  keyword?: string;
  limit?: number;
  days?: number;
}

// Respuesta de error
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// Interfaz para notificaciones
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  processId?: string;
}

// Interfaz para filtros guardados
export interface SavedFilter {
  id: string;
  name: string;
  municipio?: string;
  status?: ProcessStatus;
  keyword?: string;
  createdAt: Date;
}

// Respuesta de la API Socrata
export interface SocrataApiResponse {
  data: SecopProcess[];
  meta?: {
    view: {
      id: string;
      name: string;
      rowsUpdatedAt: number;
    };
  };
}
