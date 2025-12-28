// Theme estilo Apple para SECOP App
// Diseño minimalista, limpio y elegante

export const colors = {
  // Backgrounds
  background: "#F2F2F7",
  backgroundSecondary: "#FFFFFF",
  backgroundTertiary: "#E5E5EA",

  // Text
  textPrimary: "#1C1C1E",
  textSecondary: "#8E8E93",
  textTertiary: "#AEAEB2",

  // Accent - Azul Apple
  accent: "#ff0000ff",
  accentLight: "#E3F2FF",

  // Status colors
  success: "#34C759",
  successLight: "#E8F9ED",
  warning: "#FF9500",
  warningLight: "#FFF4E5",
  danger: "#FF3B30",
  dangerLight: "#FFEBE9",

  // Estados de contrato SECOP
  contractActive: "#34C759",
  contractPending: "#FF9500",
  contractClosed: "#8E8E93",
  contractCancelled: "#FF3B30",

  // Separadores
  separator: "#C6C6C8",
  separatorLight: "#E5E5EA",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.4)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  // Large Title - Para headers principales
  largeTitle: {
    fontSize: 34,
    fontWeight: "700" as const,
    letterSpacing: 0.37,
    lineHeight: 41,
  },

  // Title 1
  title1: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.36,
    lineHeight: 34,
  },

  // Title 2
  title2: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: 0.35,
    lineHeight: 28,
  },

  // Title 3
  title3: {
    fontSize: 20,
    fontWeight: "600" as const,
    letterSpacing: 0.38,
    lineHeight: 25,
  },

  // Headline
  headline: {
    fontSize: 17,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
    lineHeight: 22,
  },

  // Body
  body: {
    fontSize: 17,
    fontWeight: "400" as const,
    letterSpacing: -0.41,
    lineHeight: 22,
  },

  // Callout
  callout: {
    fontSize: 16,
    fontWeight: "400" as const,
    letterSpacing: -0.32,
    lineHeight: 21,
  },

  // Subhead
  subhead: {
    fontSize: 15,
    fontWeight: "400" as const,
    letterSpacing: -0.24,
    lineHeight: 20,
  },

  // Footnote
  footnote: {
    fontSize: 13,
    fontWeight: "400" as const,
    letterSpacing: -0.08,
    lineHeight: 18,
  },

  // Caption 1
  caption1: {
    fontSize: 12,
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: 16,
  },

  // Caption 2
  caption2: {
    fontSize: 11,
    fontWeight: "400" as const,
    letterSpacing: 0.07,
    lineHeight: 13,
  },
};

export const shadows = {
  // Sombra suave para cards
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Sombra más pronunciada para elementos elevados
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },

  // Sombra sutil
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
};

// Estados de contratos para badges
export const contractStatusConfig = {
  activo: {
    label: "Activo",
    color: colors.contractActive,
    backgroundColor: colors.successLight,
  },
  pendiente: {
    label: "Pendiente",
    color: colors.contractPending,
    backgroundColor: colors.warningLight,
  },
  cerrado: {
    label: "Cerrado",
    color: colors.contractClosed,
    backgroundColor: colors.backgroundTertiary,
  },
  cancelado: {
    label: "Cancelado",
    color: colors.contractCancelled,
    backgroundColor: colors.dangerLight,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  contractStatusConfig,
};
export type ThemeColors = typeof colors;
