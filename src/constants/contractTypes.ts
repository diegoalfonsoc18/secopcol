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
// PALETA DE COLORES SEMÁNTICOS
// ============================================
// Cada color está pensado para representar el tipo de contrato:
//
// 🏗️ Obra         → Naranja/Ámbar   - Construcción, energía, trabajo físico
// 🧠 Consultoría  → Violeta         - Conocimiento, estrategia, pensamiento
// 👥 Servicios    → Azul            - Profesionalismo, confianza, servicio
// 📦 Suministro   → Verde Esmeralda - Logística, flujo, entrega
// 🛒 Compraventa  → Teal/Cyan       - Transacción, intercambio comercial
// 🔍 Interventoría→ Índigo          - Supervisión, control, autoridad
// 🏠 Arrendamiento→ Rosa/Magenta    - Propiedad, hogar, bienes raíces
// 🤝 Concesión    → Oro/Dorado      - Acuerdos importantes, valor, permisos
// ============================================

export const CONTRACT_TYPES: ContractTypeConfig[] = [
  {
    id: "Obra",
    label: "Obra",
    description: "Construcción, infraestructura, obras civiles",
    CustomIcon: ObraIcon,
    icon: null,
    colorKey: null,
    hexColor: "#F59E0B", // Ámbar - Construcción, energía
  },
  {
    id: "Consultoría",
    label: "Consultoría",
    description: "Estudios, asesorías, diseños técnicos",
    CustomIcon: ConsultoriaIcon,
    icon: null,
    colorKey: null,
    hexColor: "#8B5CF6", // Violeta - Conocimiento, estrategia
  },
  {
    id: "Prestación de servicios",
    label: "Prestación de Servicios",
    description: "Servicios profesionales y técnicos",
    CustomIcon: ServiciosIcon,
    icon: null,
    colorKey: null,
    hexColor: "#3B82F6", // Azul - Profesionalismo, confianza
  },
  {
    id: "Suministro",
    label: "Suministro",
    description: "Entrega periódica de bienes",
    CustomIcon: SuministroIcon,
    icon: null,
    colorKey: null,
    hexColor: "#10B981", // Esmeralda - Logística, flujo
  },
  {
    id: "Compraventa",
    label: "Compraventa",
    description: "Adquisición de bienes muebles",
    CustomIcon: CompraventaIcon,
    icon: null,
    colorKey: null,
    hexColor: "#06B6D4", // Cyan - Transacción, comercio
  },
  {
    id: "Interventoría",
    label: "Interventoría",
    description: "Supervisión y control de contratos",
    CustomIcon: InterventoriaIcon,
    icon: null,
    colorKey: null,
    hexColor: "#6366F1", // Índigo - Supervisión, autoridad
  },
  {
    id: "Arrendamiento",
    label: "Arrendamiento",
    description: "Alquiler de bienes muebles e inmuebles",
    CustomIcon: ArrendamientoIcon,
    icon: null,
    colorKey: null,
    hexColor: "#EC4899", // Rosa - Propiedad, bienes raíces
  },
  {
    id: "Concesión",
    label: "Concesión",
    description: "Explotación de bienes o servicios públicos",
    CustomIcon: ConcesionIcon,
    icon: null,
    colorKey: null,
    hexColor: "#EAB308", // Dorado - Acuerdos, permisos importantes
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
  hexColor: "#6B7280", // Gris neutro
};
