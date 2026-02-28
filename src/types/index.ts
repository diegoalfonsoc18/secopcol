// Tipos basados en el Diccionario de Datos SECOP II - Procesos de Contratación
// Fuente: Agencia Nacional de Contratación Pública – Colombia Compra Eficiente
// Versión: 1.0 - Octubre 2025
// Total: 59 campos según diccionario oficial

export interface SecopProcess {
  // ============================================
  // 1-6: INFORMACIÓN DE LA ENTIDAD
  // ============================================
  entidad: string; // 1. Nombre de la Entidad
  nit_entidad: string; // 2. NIT de la Entidad
  departamento_entidad: string; // 3. Departamento de la entidad
  ciudad_entidad: string; // 4. Ciudad de la entidad
  ordenentidad?: string; // 5. Orden (Nacional, Regional)
  codigo_pci?: string; // 6. Si es centralizada

  // ============================================
  // 7-12: IDENTIFICACIÓN DEL PROCESO
  // ============================================
  id_del_proceso: string; // 7. ID único (generado por plataforma)
  referencia_del_proceso?: string; // 8. ID generado por la Entidad
  ppi?: string; // 9. Código Unidad-SubUnidad
  id_del_portafolio?: string; // 10. ID del portafolio
  nombre_del_procedimiento: string; // 11. Nombre del proceso
  descripci_n_del_procedimiento: string; // 12. Descripción del proceso (typo en API)

  // ============================================
  // 13-15: ESTADO Y FASE
  // ============================================
  fase?: string; // 13. Fase actual (puede no venir)
  fecha_de_publicacion_del?: string; // 14. Fecha publicación inicial (puede no venir)
  fecha_de_ultima_publicaci?: string; // 15. Fecha última publicación

  // ============================================
  // 16-20: FECHAS DE PUBLICACIÓN POR FASE
  // ============================================
  fecha_de_publicacion_fase?: string; // 16. Fecha fase Planeación Precalificación
  fecha_de_publicacion_fase_1?: string; // 17. Fecha fase Selección Precalificación
  fecha_de_publicacion?: string; // 18. Fecha Manifestación de Interés
  fecha_de_publicacion_fase_2?: string; // 19. Fecha fase Borrador
  fecha_de_publicacion_fase_3?: string; // 20. Fecha fase Selección

  // ============================================
  // 21-25: VALORES Y DURACIÓN (vienen como strings)
  // ============================================
  precio_base?: string | number; // 21. Precio base proyectado
  modalidad_de_contratacion?: string; // 22. Modalidad de selección
  justificaci_n_modalidad_de?: string; // 23. Justificación de modalidad
  duracion?: string | number; // 24. Duración estimada
  unidad_de_duracion?: string; // 25. Unidad de duración

  // ============================================
  // 26-30: FECHAS DE RESPUESTA Y APERTURA
  // ============================================
  fecha_de_recepcion_de?: string; // 26. Fecha recepción respuestas
  fecha_de_apertura_de_respuesta?: string; // 27. Fecha estimada apertura
  fecha_de_apertura_efectiva?: string; // 28. Fecha real apertura
  ciudad_de_la_unidad_de?: string; // 29. Ciudad unidad contratación
  nombre_de_la_unidad_de?: string; // 30. Nombre unidad contratación

  // ============================================
  // 31-39: ESTADÍSTICAS DE PROVEEDORES (vienen como strings)
  // ============================================
  proveedores_invitados?: string | number; // 31. Total invitados
  proveedores_con_invitacion?: string | number; // 32. Con invitación directa
  visualizaciones_del?: string | number; // 33. Visualizaciones del proceso
  proveedores_que_manifestaron?: string | number; // 34. Manifestaron interés
  respuestas_al_procedimiento?: string | number; // 35. Total respuestas
  respuestas_externas?: string | number; // 36. Respuestas externas
  conteo_de_respuestas_a_ofertas?: string | number; // 37. Respuestas a ofertas
  proveedores_unicos_con?: string | number; // 38. Proveedores únicos con respuestas
  numero_de_lotes?: string | number; // 39. Número de lotes

  // ============================================
  // 40-43: ESTADO DEL PROCEDIMIENTO
  // ============================================
  estado_del_procedimiento?: string; // 40. Estado actual
  id_estado_del_procedimiento?: string | number; // 41. ID del estado
  adjudicado?: string; // 42. Si fue adjudicado (Sí/No)
  id_adjudicacion?: string; // 43. ID de adjudicación

  // ============================================
  // 44-51: INFORMACIÓN DEL PROVEEDOR ADJUDICADO
  // ============================================
  codigoproveedor?: string; // 44. Código del proveedor
  departamento_proveedor?: string; // 45. Departamento del proveedor
  ciudad_proveedor?: string; // 46. Ciudad del proveedor
  fecha_adjudicacion?: string; // 47. Fecha de adjudicación
  valor_total_adjudicacion?: string | number; // 48. Valor total adjudicado
  nombre_del_adjudicador?: string; // 49. Nombre del adjudicador
  nombre_del_proveedor?: string; // 50. Nombre del proveedor
  nit_del_proveedor_adjudicado?: string; // 51. NIT del proveedor

  // ============================================
  // 52-56: CATEGORÍAS Y TIPO DE CONTRATO
  // ============================================
  codigo_principal_de_categoria?: string; // 52. Código UNSPSC principal
  estado_de_apertura_del_proceso?: string; // 53. Estado de apertura
  tipo_de_contrato?: string; // 54. Tipo de contrato
  subtipo_de_contrato?: string; // 55. Subtipo de contrato
  categorias_adicionales?: string; // 56. Categorías adicionales

  // ============================================
  // 57-59: METADATOS
  // ============================================
  urlproceso?: string | { url: string }; // 57. URL del proceso (puede ser objeto)
  codigo_entidad?: string | number; // 58. Código de la entidad
  estado_resumen?: string; // 59. Resumen del estado
}

// ============================================
// TIPOS AUXILIARES
// ============================================

// Fases del proceso según SECOP II
export type ProcessPhase =
  | "Borrador"
  | "Planeación"
  | "Selección"
  | "Contratación"
  | "Ejecución"
  | "Liquidación"
  | "Terminado"
  | "Cancelado"
  | "Suspendido"
  | "Desierto";

// Estados del procedimiento
export type ProcessStatus =
  | "Publicado"
  | "Adjudicado"
  | "Cerrado"
  | "En Evaluación"
  | "Cancelado"
  | "Suspendido"
  | "Desierto";

// Modalidades de contratación
export type ContractModality =
  | "Licitación pública"
  | "Selección abreviada menor cuantía"
  | "Selección abreviada subasta inversa"
  | "Selección abreviada acuerdo marco"
  | "Contratación directa"
  | "Concurso de méritos abierto"
  | "Concurso de méritos con lista corta"
  | "Mínima cuantía"
  | "Contratación régimen especial"
  | "Contratación régimen especial (con ofertas)"
  | "Asociación Público Privada";

// Tipos de contrato
export type ContractType =
  | "Prestación de servicios"
  | "Decreto 092 de 2017"
  | "Suministros"
  | "Otro"
  | "Compraventa"
  | "Obra"
  | "Arrendamiento de inmuebles"
  | "Seguros"
  | "Interventoría"
  | "Consultoría"
  | "Comodato"
  | "Acuerdo Marco de Precios"
  | "Arrendamiento de muebles"
  | "Servicios financieros"
  | "Venta muebles"
  | "Concesión"
  | "Operaciones de Crédito Público"
  | "Asociación Público Privada"
  | "Negocio fiduciario"
  | "Venta inmuebles"
  | "Comisión"
  | "Acuerdo de cooperación"
  | "Empréstito";

// ============================================
// INTERFACES DE BÚSQUEDA
// ============================================

export interface SearchParams {
  // Filtros de ubicación
  departamento_entidad?: string;
  ciudad_entidad?: string;

  // Filtros de estado
  fase?: ProcessPhase | string;
  estado_del_procedimiento?: ProcessStatus | string;
  modalidad_de_contratacion?: ContractModality | string;

  // Filtros de texto
  keyword?: string;
  entidad?: string;

  // Filtros de fecha
  fecha_desde?: string;
  fecha_hasta?: string;

  // Paginación
  limit?: number;
  offset?: number;
}

// ============================================
// INTERFACES DE API
// ============================================

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

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// ============================================
// INTERFACES DE LA APP
// ============================================

export interface FavoriteProcess extends SecopProcess {
  savedAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  processId?: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  params: SearchParams;
  createdAt: Date;
}

// ============================================
// CONSTANTES
// ============================================

// Fases disponibles
export const SECOP_PHASES: ProcessPhase[] = [
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

// Modalidades disponibles
export const SECOP_MODALITIES = [
  "Licitación pública",
  "Selección abreviada menor cuantía",
  "Selección abreviada subasta inversa",
  "Contratación directa",
  "Concurso de méritos abierto",
  "Mínima cuantía",
  "Contratación régimen especial",
] as const;

// Municipios principales de Colombia
export const COLOMBIAN_MUNICIPALITIES = [
  "Bogotá D.C.",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena de Indias",
  "Bucaramanga",
  "Pereira",
  "Manizales",
  "Santa Marta",
  "Ibagué",
  "Cúcuta",
  "Villavicencio",
  "Pasto",
  "Montería",
  "Neiva",
  "Valledupar",
  "Armenia",
  "Sincelejo",
  "Popayán",
  "Floridablanca",
  "Tunja",
  "Palmira",
  "Buenaventura",
  "Soacha",
  "Bello",
  "Soledad",
  "Itagüí",
  "Envigado",
  "Dosquebradas",
  "Tocancipá",
] as const;

// Departamentos de Colombia
export const COLOMBIAN_DEPARTMENTS = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
] as const;

// Mapa de departamentos con sus municipios principales
export const MUNICIPALITIES_BY_DEPARTMENT: Record<string, string[]> = {
  Amazonas: ["Leticia", "Puerto Nariño"],
  Antioquia: [
    "Medellín",
    "Bello",
    "Itagüí",
    "Envigado",
    "Apartadó",
    "Rionegro",
    "Turbo",
    "Caucasia",
    "Copacabana",
    "La Estrella",
    "Sabaneta",
  ],
  Arauca: ["Arauca", "Tame", "Saravena", "Fortul"],
  Atlántico: [
    "Barranquilla",
    "Soledad",
    "Malambo",
    "Sabanalarga",
    "Puerto Colombia",
    "Galapa",
  ],
  "Bogotá D.C.": ["Bogotá D.C."],
  Bolívar: [
    "Cartagena de Indias",
    "Magangué",
    "Turbaco",
    "Arjona",
    "El Carmen de Bolívar",
  ],
  Boyacá: [
    "Tunja",
    "Duitama",
    "Sogamoso",
    "Chiquinquirá",
    "Puerto Boyacá",
    "Paipa",
    "Guateque",
  ],
  Caldas: ["Manizales", "La Dorada", "Chinchiná", "Villamaría", "Riosucio"],
  Caquetá: [
    "Florencia",
    "San Vicente del Caguán",
    "Puerto Rico",
    "El Doncello",
  ],
  Casanare: ["Yopal", "Aguazul", "Villanueva", "Tauramena", "Paz de Ariporo"],
  Cauca: [
    "Popayán",
    "Santander de Quilichao",
    "Puerto Tejada",
    "Patía",
    "El Tambo",
  ],
  Cesar: [
    "Valledupar",
    "Aguachica",
    "Codazzi",
    "Bosconia",
    "La Jagua de Ibirico",
  ],
  Chocó: ["Quibdó", "Istmina", "Tadó", "Condoto", "Riosucio"],
  Córdoba: [
    "Montería",
    "Cereté",
    "Lorica",
    "Sahagún",
    "Planeta Rica",
    "Montelíbano",
  ],
  Cundinamarca: [
    "Soacha",
    "Facatativá",
    "Zipaquirá",
    "Chía",
    "Fusagasugá",
    "Girardot",
    "Madrid",
    "Mosquera",
    "Funza",
    "Cajicá",
    "Tocancipá",
    "Sopó",
    "La Calera",
    "Cota",
    "Tabio",
    "Tenjo",
    "Sibaté",
    "Ubaté",
  ],
  Guainía: ["Inírida"],
  Guaviare: ["San José del Guaviare", "Calamar", "El Retorno"],
  Huila: ["Neiva", "Pitalito", "Garzón", "La Plata", "Campoalegre"],
  "La Guajira": [
    "Riohacha",
    "Maicao",
    "Uribia",
    "Manaure",
    "San Juan del Cesar",
  ],
  Magdalena: ["Santa Marta", "Ciénaga", "Fundación", "El Banco", "Plato"],
  Meta: ["Villavicencio", "Acacías", "Granada", "Puerto López", "San Martín"],
  Nariño: ["Pasto", "Tumaco", "Ipiales", "Túquerres", "La Unión"],
  "Norte de Santander": [
    "Cúcuta",
    "Ocaña",
    "Pamplona",
    "Villa del Rosario",
    "Los Patios",
  ],
  Putumayo: ["Mocoa", "Puerto Asís", "Orito", "Valle del Guamuez"],
  Quindío: ["Armenia", "Calarcá", "Montenegro", "La Tebaida", "Quimbaya"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal", "La Virginia"],
  "San Andrés y Providencia": ["San Andrés", "Providencia"],
  Santander: [
    "Bucaramanga",
    "Floridablanca",
    "Girón",
    "Piedecuesta",
    "Barrancabermeja",
    "San Gil",
  ],
  Sucre: ["Sincelejo", "Corozal", "San Marcos", "Sampués", "Tolú"],
  Tolima: ["Ibagué", "Espinal", "Melgar", "Chaparral", "Honda", "Mariquita"],
  "Valle del Cauca": [
    "Cali",
    "Buenaventura",
    "Palmira",
    "Tuluá",
    "Cartago",
    "Buga",
    "Jamundí",
    "Yumbo",
  ],
  Vaupés: ["Mitú", "Carurú"],
  Vichada: ["Puerto Carreño", "La Primavera", "Cumaribo"],
};

// URL base de la API
export const SECOP_API_BASE_URL =
  "https://www.datos.gov.co/resource/p6dx-8zbt.json";

// App Token (opcional)
export const SECOP_APP_TOKEN = "";
