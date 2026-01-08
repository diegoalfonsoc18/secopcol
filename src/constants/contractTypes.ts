import {
  ObraIcon,
  ConsultoriaIcon,
  ServiciosIcon,
  SuministroIcon,
  CompraventaIcon,
  InterventoriaIcon,
  ArrendamientoIcon,
  ConcesionIcon,
} from "../assets/icons";

// ============================================
// TIPOS
// ============================================
export interface ContractTypeConfig {
  id: string;
  label: string;
  description: string;
  CustomIcon: React.FC<{ size: number; color: string }> | null;
  icon: string | null;
  colorKey: "warning" | "accent" | "success" | "danger" | null;
  hexColor: string | null;
}

// ============================================
// TIPOS DE CONTRATO DISPONIBLES
// ============================================
export const CONTRACT_TYPES: ContractTypeConfig[] = [
  {
    id: "Obra",
    label: "Obra",
    description: "Construcción, infraestructura, obras civiles",
    CustomIcon: ObraIcon,
    icon: null,
    colorKey: null,
    hexColor: "#313647",
  },
  {
    id: "Consultoría",
    label: "Consultoría",
    description: "Estudios, asesorías, diseños técnicos",
    CustomIcon: ConsultoriaIcon,
    icon: null,
    colorKey: null,
    hexColor: "#313647",
  },
  {
    id: "Prestación de servicios",
    label: "Prestación de Servicios",
    description: "Servicios profesionales y técnicos",
    CustomIcon: ServiciosIcon,
    icon: null,
    colorKey: null,
    hexColor: "#313647",
  },
  {
    id: "Suministro",
    label: "Suministro",
    description: "Entrega periódica de bienes",
    CustomIcon: SuministroIcon,
    icon: null,
    colorKey: null,
    hexColor: "#313647",
  },
  {
    id: "Compraventa",
    label: "Compraventa",
    description: "Adquisición de bienes muebles",
    CustomIcon: CompraventaIcon,
    icon: null,
    colorKey: null,
    hexColor: "#313647",
  },
  {
    id: "Interventoría",
    label: "Interventoría",
    description: "Supervisión y control de contratos",
    CustomIcon: InterventoriaIcon,
    icon: null,
    colorKey: null,
    hexColor: "#313647",
  },
  {
    id: "Arrendamiento",
    label: "Arrendamiento",
    description: "Alquiler de bienes muebles e inmuebles",
    CustomIcon: ArrendamientoIcon,
    icon: null,
    colorKey: null,
    hexColor: "#313647",
  },
  {
    id: "Concesión",
    label: "Concesión",
    description: "Explotación de bienes o servicios públicos",
    CustomIcon: ConcesionIcon,
    icon: null,
    colorKey: null,
    hexColor: "#313647",
  },
];

// ============================================
// HELPER: Obtener config por ID
// ============================================
export const getContractTypeConfig = (
  id: string
): ContractTypeConfig | undefined => {
  return CONTRACT_TYPES.find((type) => type.id === id);
};

// ============================================
// HELPER: Obtener color dinámico
// ============================================
export const getContractTypeColor = (
  type: ContractTypeConfig,
  colors: Record<string, string>
): string => {
  if (type.hexColor) return type.hexColor;
  if (type.colorKey && colors[type.colorKey]) {
    return colors[type.colorKey];
  }
  return colors.accent || "#007AFF";
};

// ============================================
// DEFAULT CONFIG para tipos no definidos
// ============================================
export const DEFAULT_CONTRACT_CONFIG: ContractTypeConfig = {
  id: "unknown",
  label: "Otro",
  description: "Tipo de contrato no especificado",
  CustomIcon: null,
  icon: "help-outline",
  colorKey: null,
  hexColor: "#8E8E93",
};
