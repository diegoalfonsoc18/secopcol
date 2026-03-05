// GlassWrapper: Componente utilitario para efectos de vidrio con fallback 3 niveles
// Tier 1: GlassView (iOS 26+ nativo)
// Tier 2: BlurView (expo-blur, iOS + Android SDK 31+) — solo en dev builds
// Tier 3: View con color semi-transparente (fallback universal / Expo Go)

import React from "react";
import { View, Platform, ViewStyle, StyleProp } from "react-native";
import Constants from "expo-constants";
import { useTheme } from "../context/ThemeContext";

// Detectar si estamos en Expo Go (BlurView no funciona bien ahi)
const isExpoGo = Constants.appOwnership === "expo";

// Intentar importar expo-glass-effect (solo disponible iOS 26+)
let GlassView: any = null;
let isGlassEffectAPIAvailable: (() => boolean) | null = null;

try {
  const glassModule = require("expo-glass-effect");
  GlassView = glassModule.GlassView;
  isGlassEffectAPIAvailable = glassModule.isGlassEffectAPIAvailable;
} catch {}

// Intentar importar expo-blur
let BlurView: any = null;
try {
  const blurModule = require("expo-blur");
  BlurView = blurModule.BlurView;
} catch {}

// Cache de disponibilidad (inmutable en runtime)
const _glassAvailable =
  !isExpoGo &&
  Platform.OS === "ios" &&
  isGlassEffectAPIAvailable != null &&
  isGlassEffectAPIAvailable();

// BlurView solo disponible en dev builds, no en Expo Go
const _blurAvailable = !isExpoGo && BlurView != null;

// ============================================
// TIPOS
// ============================================
export type GlassVariant = "regular" | "card" | "badge" | "header" | "overlay";

interface VariantPreset {
  glassStyle: string;
  blurIntensity: number;
  blurTint: "light" | "dark" | "default";
}

interface GlassWrapperProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: GlassVariant;
  /** Desactivar efecto glass (util para padres con opacity animada) */
  disabled?: boolean;
  /** Override intensidad del blur (1-100) */
  blurIntensity?: number;
  /** Override tint del BlurView */
  blurTint?: "light" | "dark" | "default";
  /** Override tint color para GlassView */
  glassTintColor?: string;
  /** Color de fondo cuando no hay blur ni glass disponible */
  fallbackColor?: string;
}

// ============================================
// PRESETS POR VARIANTE
// ============================================
const VARIANT_PRESETS: Record<GlassVariant, VariantPreset> = {
  regular: { glassStyle: "regular", blurIntensity: 80, blurTint: "default" },
  card: { glassStyle: "regular", blurIntensity: 60, blurTint: "default" },
  badge: { glassStyle: "clear", blurIntensity: 40, blurTint: "default" },
  header: { glassStyle: "regular", blurIntensity: 90, blurTint: "default" },
  overlay: { glassStyle: "regular", blurIntensity: 30, blurTint: "dark" },
};

// ============================================
// COMPONENTE
// ============================================
export const GlassWrapper: React.FC<GlassWrapperProps> = ({
  children,
  style,
  variant = "regular",
  disabled = false,
  blurIntensity,
  blurTint,
  glassTintColor,
  fallbackColor,
}) => {
  const { isDark, colors } = useTheme();

  const preset = VARIANT_PRESETS[variant];
  const resolvedBlurIntensity = blurIntensity ?? preset.blurIntensity;
  const resolvedBlurTint =
    blurTint ?? (variant === "overlay" ? "dark" : isDark ? "dark" : "light");
  const resolvedFallback =
    fallbackColor ?? colors.tabBarBackground;

  // Resolver estilo de glass: en dark mode usar "clear" para evitar fondo gris
  const resolvedGlassStyle = isDark ? "clear" : preset.glassStyle;

  // Tier 1: Native Liquid Glass (iOS 26+, solo dev builds)
  if (!disabled && _glassAvailable && GlassView) {
    return (
      <GlassView
        style={[style, { overflow: "hidden" }]}
        glassEffectStyle={resolvedGlassStyle}
        tintColor={glassTintColor}
      >
        {children}
      </GlassView>
    );
  }

  // Tier 2: expo-blur BlurView (solo dev builds, no Expo Go)
  if (!disabled && _blurAvailable && BlurView) {
    return (
      <BlurView
        style={[style, { overflow: "hidden" }]}
        intensity={resolvedBlurIntensity}
        tint={resolvedBlurTint}
      >
        {children}
      </BlurView>
    );
  }

  // Tier 3: View con fallback color (Expo Go + plataformas sin soporte)
  return (
    <View style={[style, { backgroundColor: resolvedFallback }]}>
      {children}
    </View>
  );
};

// ============================================
// HOOK DE DISPONIBILIDAD
// ============================================
export const useGlassAvailability = () => ({
  isNativeGlass: _glassAvailable,
  isBlurAvailable: _blurAvailable,
  isExpoGo,
  tier: _glassAvailable
    ? ("glass" as const)
    : _blurAvailable
      ? ("blur" as const)
      : ("fallback" as const),
});
