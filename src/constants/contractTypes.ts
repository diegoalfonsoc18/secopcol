import {
  ObraIcon,
  ConsultoriaIcon,
  ServiciosIcon,
  SuministroIcon,
  CompraventaIcon,
  InterventoriaIcon,
  ArrendamientoIcon,
  ConcesionIcon,
  SegurosIcon,
  ComodatoIcon,
  OtroIcon,
} from "../assets/icons";

// ============================================
// TIPOS
// ============================================
export interface ContractTypeConfig {
  id: string;
  label: string;
  description: string;
  CustomIcon: React.FC<{ size: number; color: string }>;
  color: string;
}

export const CONTRACT_TYPES: ContractTypeConfig[] = [
  {
    id: "Prestación de servicios",
    label: "Prestación de Servicios",
    description: "Servicios profesionales y técnicos",
    CustomIcon: ServiciosIcon,
    color: "#3B82F6", // Azul
  },
  {
    id: "Decreto 092 de 2017",
    label: "Decreto 092",
    description: "Contratos con entidades sin ánimo de lucro",
    CustomIcon: OtroIcon,
    color: "#7C3AED", // Violeta oscuro
  },
  {
    id: "Suministros",
    label: "Suministros",
    description: "Entrega periódica de bienes",
    CustomIcon: SuministroIcon,
    color: "#10B981", // Esmeralda
  },
  {
    id: "Otro",
    label: "Otro",
    description: "Otros tipos de contrato",
    CustomIcon: OtroIcon,
    color: "#6B7280", // Gris
  },
  {
    id: "Compraventa",
    label: "Compraventa",
    description: "Adquisición de bienes muebles",
    CustomIcon: CompraventaIcon,
    color: "#06B6D4", // Cyan
  },
  {
    id: "Obra",
    label: "Obra",
    description: "Construcción, infraestructura, obras civiles",
    CustomIcon: ObraIcon,
    color: "#F59E0B", // Ámbar
  },
  {
    id: "Arrendamiento de inmuebles",
    label: "Arrend. inmuebles",
    description: "Alquiler de bienes inmuebles",
    CustomIcon: ArrendamientoIcon,
    color: "#EC4899", // Rosa
  },
  {
    id: "Seguros",
    label: "Seguros",
    description: "Pólizas y coberturas de riesgo",
    CustomIcon: SegurosIcon,
    color: "#EF4444", // Rojo
  },
  {
    id: "Interventoría",
    label: "Interventoría",
    description: "Supervisión y control de contratos",
    CustomIcon: InterventoriaIcon,
    color: "#6366F1", // Índigo
  },
  {
    id: "Consultoría",
    label: "Consultoría",
    description: "Estudios, asesorías, diseños técnicos",
    CustomIcon: ConsultoriaIcon,
    color: "#8B5CF6", // Violeta
  },
  {
    id: "Comodato",
    label: "Comodato",
    description: "Préstamo gratuito de bienes",
    CustomIcon: ComodatoIcon,
    color: "#14B8A6", // Teal
  },
  {
    id: "Acuerdo Marco de Precios",
    label: "Acuerdo Marco",
    description: "Contratos marco de precios",
    CustomIcon: OtroIcon,
    color: "#0EA5E9", // Sky
  },
  {
    id: "Arrendamiento de muebles",
    label: "Arrend. muebles",
    description: "Alquiler de bienes muebles",
    CustomIcon: ArrendamientoIcon,
    color: "#F472B6", // Rosa claro
  },
  {
    id: "Servicios financieros",
    label: "Serv. financieros",
    description: "Servicios del sector financiero",
    CustomIcon: OtroIcon,
    color: "#059669", // Esmeralda oscuro
  },
  {
    id: "Venta muebles",
    label: "Venta muebles",
    description: "Enajenación de bienes muebles",
    CustomIcon: OtroIcon,
    color: "#D97706", // Ámbar oscuro
  },
  {
    id: "Concesión",
    label: "Concesión",
    description: "Explotación de bienes o servicios públicos",
    CustomIcon: ConcesionIcon,
    color: "#EAB308", // Dorado
  },
  {
    id: "Operaciones de Crédito Público",
    label: "Crédito Público",
    description: "Operaciones de crédito público",
    CustomIcon: OtroIcon,
    color: "#DC2626", // Rojo oscuro
  },
  {
    id: "Asociación Público Privada",
    label: "Asoc. Público Privada",
    description: "Asociaciones público-privadas (APP)",
    CustomIcon: OtroIcon,
    color: "#4F46E5", // Índigo oscuro
  },
  {
    id: "Negocio fiduciario",
    label: "Negocio fiduciario",
    description: "Negocios fiduciarios y fideicomisos",
    CustomIcon: OtroIcon,
    color: "#0891B2", // Cyan oscuro
  },
  {
    id: "Venta inmuebles",
    label: "Venta inmuebles",
    description: "Enajenación de bienes inmuebles",
    CustomIcon: OtroIcon,
    color: "#B45309", // Ámbar más oscuro
  },
  {
    id: "Comisión",
    label: "Comisión",
    description: "Contratos de comisión",
    CustomIcon: OtroIcon,
    color: "#9333EA", // Púrpura
  },
  {
    id: "Acuerdo de cooperación",
    label: "Acuerdo cooperación",
    description: "Acuerdos de cooperación interinstitucional",
    CustomIcon: OtroIcon,
    color: "#2563EB", // Azul oscuro
  },
  {
    id: "Empréstito",
    label: "Empréstito",
    description: "Operaciones de empréstito",
    CustomIcon: OtroIcon,
    color: "#BE185D", // Rosa oscuro
  },
];

// ============================================
// HELPER: Obtener config por ID
// ============================================
export const getContractTypeConfig = (
  id: string,
): ContractTypeConfig | undefined => {
  return CONTRACT_TYPES.find((type) => type.id === id);
};

// ============================================
// HELPER: Obtener color del tipo
// ============================================
export const getContractTypeColor = (type: ContractTypeConfig): string => {
  return type.color;
};

// ============================================
// DEFAULT CONFIG para tipos no definidos
// ============================================
export const DEFAULT_CONTRACT_CONFIG: ContractTypeConfig = {
  id: "unknown",
  label: "Otro",
  description: "Tipo de contrato no especificado",
  CustomIcon: OtroIcon,
  color: "#6B7280", // Gris neutro
};
