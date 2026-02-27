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
    id: "Obra",
    label: "Obra",
    description: "Construcción, infraestructura, obras civiles",
    CustomIcon: ObraIcon,
    color: "#F59E0B", // Ámbar - Construcción, energía
  },
  {
    id: "Consultoría",
    label: "Consultoría",
    description: "Estudios, asesorías, diseños técnicos",
    CustomIcon: ConsultoriaIcon,
    color: "#8B5CF6", // Violeta - Conocimiento, estrategia
  },
  {
    id: "Arrendamiento",
    label: "Arrendamiento",
    description: "Alquiler de bienes muebles e inmuebles",
    CustomIcon: ArrendamientoIcon,
    color: "#EC4899", // Rosa - Propiedad, bienes raíces
  },
  {
    id: "Prestación de servicios",
    label: "Prestación de Servicios",
    description: "Servicios profesionales y técnicos",
    CustomIcon: ServiciosIcon,
    color: "#3B82F6", // Azul - Profesionalismo, confianza
  },
  {
    id: "Suministros",
    label: "Suministros",
    description: "Entrega periódica de bienes",
    CustomIcon: SuministroIcon,
    color: "#10B981", // Esmeralda - Logística, flujo
  },
  {
    id: "Compraventa",
    label: "Compraventa",
    description: "Adquisición de bienes muebles",
    CustomIcon: CompraventaIcon,
    color: "#06B6D4", // Cyan - Transacción, comercio
  },
  {
    id: "Interventoría",
    label: "Interventoría",
    description: "Supervisión y control de contratos",
    CustomIcon: InterventoriaIcon,
    color: "#6366F1", // Índigo - Supervisión, autoridad
  },
  {
    id: "Concesión",
    label: "Concesión",
    description: "Explotación de bienes o servicios públicos",
    CustomIcon: ConcesionIcon,
    color: "#EAB308", // Dorado - Acuerdos, permisos importantes
  },
  {
    id: "Seguros",
    label: "Seguros",
    description: "Pólizas y coberturas de riesgo",
    CustomIcon: SegurosIcon,
    color: "#EF4444", // Rojo - Riesgo, protección
  },
  {
    id: "Comodato",
    label: "Comodato",
    description: "Préstamo gratuito de bienes",
    CustomIcon: ComodatoIcon,
    color: "#14B8A6", // Teal - Compartir, préstamo
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
