// GlassWrapper: Componente utilitario para efectos de vidrio con fallback 3 niveles
// Tier 1: LiquidGlassView (@callstack/liquid-glass, iOS 26+)
// Tier 2: BlurView (expo-blur, iOS + Android SDK 31+) — solo en dev builds
// Tier 3: View con color semi-transparente (fallback universal / Expo Go)

import React from "react";
import { View, Platform, ViewStyle, StyleProp } from "react-native";
import Constants from "expo-constants";
import { useTheme } from "../context/ThemeContext";

// Detectar si estamos en Expo Go (BlurView no funciona bien ahi)
const isExpoGo = Constants.appOwnership === "expo";

// Intentar importar @callstack/liquid-glass (solo iOS 26+)
let LiquidGlassView: any = null;
let isLiquidGlassSupported = false;

try {
  const lgModule = require("@callstack/liquid-glass");
  LiquidGlassView = lgModule.LiquidGlassView;
  isLiquidGlassSupported = lgModule.isLiquidGlassSupported === true;
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
  isLiquidGlassSupported &&
  LiquidGlassView != null;

// BlurView solo disponible en dev builds, no en Expo Go
const _blurAvailable = !isExpoGo && BlurView != null;

// ============================================
// TIPOS
// ============================================
export type GlassVariant = "regular" | "card" | "badge" | "header" | "overlay";

interface VariantPreset {
  glassEffect: "regular" | "clear";
  blurIntensity: number;
  blurTint: "light" | "dark" | "default";
  interactive: boolean;
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
  /** Override tint color para LiquidGlassView */
  glassTintColor?: string;
  /** Color de fondo cuando no hay blur ni glass disponible */
  fallbackColor?: string;
}

// ============================================
// PRESETS POR VARIANTE
// ============================================
const VARIANT_PRESETS: Record<GlassVariant, VariantPreset> = {
  regular: { glassEffect: "regular", blurIntensity: 80, blurTint: "default", interactive: false },
  card: { glassEffect: "regular", blurIntensity: 60, blurTint: "default", interactive: false },
  badge: { glassEffect: "clear", blurIntensity: 40, blurTint: "default", interactive: true },
  header: { glassEffect: "regular", blurIntensity: 90, blurTint: "default", interactive: false },
  overlay: { glassEffect: "regular", blurIntensity: 30, blurTint: "dark", interactive: false },
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

  // Resolver efecto glass: en dark mode usar "clear" para evitar fondo gris
  const resolvedGlassEffect = isDark ? "clear" : preset.glassEffect;

  // Tier 1: @callstack/liquid-glass (iOS 26+)
  if (!disabled && _glassAvailable && LiquidGlassView) {
    return (
      <LiquidGlassView
        style={[style, { overflow: "hidden" }]}
        effect={resolvedGlassEffect}
        interactive={preset.interactive}
        tintColor={glassTintColor}
        colorScheme={isDark ? "dark" : "light"}
      >
        {children}
      </LiquidGlassView>
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
