import React, { useRef } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius, shadows, typography } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useHaptics } from "../hooks/useHaptics";

// ============================================
// UTILIDADES
// ============================================

// Tiempo relativo
const getRelativeTime = (dateString: string | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "ahora";
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return "ayer";
    if (diffDays < 7) return `hace ${diffDays}d`;

    return "";
  } catch {
    return "";
  }
};

// Formato de fecha
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Sin fecha";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Sin fecha";
    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Sin fecha";
  }
};

// Verificar si es nuevo (hoy o ayer)
const isNewProcess = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / 3600000;

    return diffHours < 48; // Menos de 48 horas
  } catch {
    return false;
  }
};

// Obtener el estado/fase del proceso
const getProcessPhase = (process: SecopProcess): string => {
  return process.fase || process.estado_del_procedimiento || "Desconocido";
};

const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return "Sin descripción";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
interface ProcessCardProps {
  process: SecopProcess;
  onPress: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  onPress,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const scale = useRef(new Animated.Value(1)).current;
  const styles = createStyles(colors);

  // Configuración de fases
  const phaseConfig: Record<
    string,
    { color: string; bg: string; icon: string }
  > = {
    Borrador: {
      color: colors.textSecondary,
      bg: colors.backgroundTertiary,
      icon: "document-outline",
    },
    Planeación: {
      color: colors.warning,
      bg: colors.warningLight,
      icon: "clipboard-outline",
    },
    Selección: {
      color: colors.accent,
      bg: colors.accentLight,
      icon: "search-outline",
    },
    Contratación: {
      color: colors.accent,
      bg: colors.accentLight,
      icon: "document-text-outline",
    },
    Ejecución: {
      color: colors.success,
      bg: colors.successLight,
      icon: "play-circle-outline",
    },
    Liquidación: {
      color: colors.warning,
      bg: colors.warningLight,
      icon: "checkmark-done-outline",
    },
    Terminado: {
      color: colors.textSecondary,
      bg: colors.backgroundTertiary,
      icon: "checkmark-circle-outline",
    },
    Cancelado: {
      color: colors.danger,
      bg: colors.dangerLight,
      icon: "close-circle-outline",
    },
    Suspendido: {
      color: colors.warning,
      bg: colors.warningLight,
      icon: "pause-circle-outline",
    },
    Desierto: {
      color: colors.textSecondary,
      bg: colors.backgroundTertiary,
      icon: "remove-circle-outline",
    },
  };

  const defaultPhase = {
    color: colors.textSecondary,
    bg: colors.backgroundTertiary,
    icon: "help-circle-outline",
  };

  const fase = getProcessPhase(process);
  const phaseStyle = phaseConfig[fase] || defaultPhase;
  const isNew = isNewProcess(process.fecha_de_publicacion_del);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        {/* Header: ID y Badges */}
        <View style={styles.header}>
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>PROCESO</Text>
            <Text style={styles.idValue} numberOfLines={1}>
              {process.id_del_proceso || "Sin ID"}
            </Text>
          </View>

          <View style={styles.badgesContainer}>
            {/* Badge NUEVO */}
            {isNew && (
              <View style={styles.newBadge}>
                <Ionicons
                  name="sparkles"
                  size={10}
                  color={colors.backgroundSecondary}
                />
                <Text style={styles.newBadgeText}>NUEVO</Text>
              </View>
            )}

            {/* Badge Fase */}
            <View
              style={[styles.statusBadge, { backgroundColor: phaseStyle.bg }]}>
              <Ionicons
                name={phaseStyle.icon as any}
                size={12}
                color={phaseStyle.color}
              />
              <Text style={[styles.statusText, { color: phaseStyle.color }]}>
                {fase}
              </Text>
            </View>
          </View>
        </View>

        {/* Nombre del procedimiento */}
        {process.nombre_del_procedimiento && (
          <Text style={styles.procedureName} numberOfLines={1}>
            {process.nombre_del_procedimiento}
          </Text>
        )}

        {/* Descripción */}
        <Text style={styles.description} numberOfLines={2}>
          {truncateText(process.descripci_n_del_procedimiento, 120)}
        </Text>

        {/* Entidad */}
        <View style={styles.infoRow}>
          <Ionicons
            name="business-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {truncateText(process.entidad, 50)}
          </Text>
        </View>

        {/* Ciudad / Departamento */}
        {process.ciudad_entidad && (
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.infoText} numberOfLines={1}>
              {process.ciudad_entidad}
              {process.departamento_entidad
                ? `, ${process.departamento_entidad}`
                : ""}
            </Text>
          </View>
        )}

        {/* Separador */}
        <View style={styles.separator} />

        {/* Footer: NIT y Fecha */}
        <View style={styles.footer}>
          <View style={styles.valueContainer}>
            <Text style={styles.valueLabel}>NIT Entidad</Text>
            <Text style={styles.nitValue}>
              {process.nit_entidad || "No especificado"}
            </Text>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Publicación</Text>
            <View style={styles.timeRow}>
              <Text style={styles.dateValue}>
                {formatDate(process.fecha_de_publicacion_del)}
              </Text>
              <Text style={styles.relativeTime}>
                · {getRelativeTime(process.fecha_de_publicacion_del)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.card,
    },

    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    idContainer: {
      flex: 1,
    },
    idLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 2,
    },
    idValue: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.accent,
    },
    badgesContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    newBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.warning,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    newBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.backgroundSecondary,
      letterSpacing: 0.5,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
    },

    // Procedure name
    procedureName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.accent,
      marginBottom: spacing.xs,
    },

    // Description
    description: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },

    // Info rows
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
    },

    // Separator
    separator: {
      height: 1,
      backgroundColor: colors.separatorLight,
      marginVertical: spacing.md,
    },

    // Footer
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    valueContainer: {
      flex: 1,
    },
    valueLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: 2,
    },
    nitValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    dateContainer: {
      alignItems: "flex-end",
    },
    dateLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: 2,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    dateValue: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    relativeTime: {
      fontSize: 12,
      color: colors.textTertiary,
    },
  });

export default ProcessCard;
