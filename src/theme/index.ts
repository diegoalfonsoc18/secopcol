// Theme estilo Apple para SECOP App
// Los COLORES se manejan en ThemeContext (soporta dark/light mode)
// Aquí solo van: spacing, borderRadius, typography, shadows

import { Platform } from "react-native";

// Re-exportar colores desde ThemeContext para compatibilidad
export { lightColors as colors, darkColors } from "../context/ThemeContext";

// Factor de escala para Android (reduce tamaños ~10%)
const SCALE = Platform.OS === "android" ? 0.82 : 1;
export const scale = (size: number) => Math.round(size * SCALE);

export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
};

export const borderRadius = {
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  full: 9999,
};

export const typography = {
  // Large Title - Para headers principales
  largeTitle: {
    fontSize: scale(34),
    fontWeight: "700" as const,
    letterSpacing: 0.37,
    lineHeight: scale(41),
  },

  // Title 1
  title1: {
    fontSize: scale(28),
    fontWeight: "700" as const,
    letterSpacing: 0.36,
    lineHeight: scale(34),
  },

  // Title 2
  title2: {
    fontSize: scale(22),
    fontWeight: "700" as const,
    letterSpacing: 0.35,
    lineHeight: scale(28),
  },

  // Title 3
  title3: {
    fontSize: scale(20),
    fontWeight: "600" as const,
    letterSpacing: 0.38,
    lineHeight: scale(25),
  },

  // Headline
  headline: {
    fontSize: scale(17),
    fontWeight: "600" as const,
    letterSpacing: -0.41,
    lineHeight: scale(22),
  },

  // Body
  body: {
    fontSize: scale(17),
    fontWeight: "400" as const,
    letterSpacing: -0.41,
    lineHeight: scale(22),
  },

  // Callout
  callout: {
    fontSize: scale(16),
    fontWeight: "400" as const,
    letterSpacing: -0.32,
    lineHeight: scale(21),
  },

  // Subhead
  subhead: {
    fontSize: scale(15),
    fontWeight: "400" as const,
    letterSpacing: -0.24,
    lineHeight: scale(20),
  },

  // Footnote
  footnote: {
    fontSize: scale(13),
    fontWeight: "400" as const,
    letterSpacing: -0.08,
    lineHeight: scale(18),
  },

  // Caption 1
  caption1: {
    fontSize: scale(12),
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: scale(16),
  },

  // Caption 2
  caption2: {
    fontSize: scale(11),
    fontWeight: "400" as const,
    letterSpacing: 0.07,
    lineHeight: scale(13),
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

export default {
  spacing,
  borderRadius,
  typography,
  shadows,
};
