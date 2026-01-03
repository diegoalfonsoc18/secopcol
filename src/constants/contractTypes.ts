import { ObraIcon } from "../assets/icons";

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
    colorKey: "warning",
    hexColor: null,
  },

  {
    id: "Consultoría",
    label: "Consultoría",
    description: "Estudios, asesorías, diseños técnicos",
    CustomIcon: null,
    icon: "bulb-outline",
    colorKey: null,
    hexColor: "#5856D6",
  },
  {
    id: "Prestación de servicios",
    label: "Prestación de Servicios",
    description: "Servicios profesionales y técnicos",
    CustomIcon: null,
    icon: "briefcase-outline",
    colorKey: "accent",
    hexColor: null,
  },
  {
    id: "Suministro",
    label: "Suministro",
    description: "Entrega periódica de bienes",
    CustomIcon: null,
    icon: "cube-outline",
    colorKey: "success",
    hexColor: null,
  },
  {
    id: "Compraventa",
    label: "Compraventa",
    description: "Adquisición de bienes muebles",
    CustomIcon: null,
    icon: "cart-outline",
    colorKey: "danger",
    hexColor: null,
  },
  {
    id: "Interventoría",
    label: "Interventoría",
    description: "Supervisión y control de contratos",
    CustomIcon: null,
    icon: "eye-outline",
    colorKey: null,
    hexColor: "#AF52DE",
  },
  {
    id: "Arrendamiento",
    label: "Arrendamiento",
    description: "Alquiler de bienes muebles e inmuebles",
    CustomIcon: null,
    icon: "home-outline",
    colorKey: "success",
    hexColor: null,
  },
  {
    id: "Concesión",
    label: "Concesión",
    description: "Explotación de bienes o servicios públicos",
    CustomIcon: null,
    icon: "key-outline",
    colorKey: "warning",
    hexColor: null,
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
