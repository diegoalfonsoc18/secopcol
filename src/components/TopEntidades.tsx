import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";

// ============================================
// TIPOS
// ============================================
interface EntidadStats {
  nombre: string;
  count: number;
  valorTotal: number;
}

interface TopEntidadesProps {
  processes: SecopProcess[];
  limit?: number;
  onEntidadPress?: (entidad: string) => void;
}

// ============================================
// UTILIDADES
// ============================================
const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(0)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const TopEntidades: React.FC<TopEntidadesProps> = ({
  processes,
  limit = 5,
  onEntidadPress,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Calcular estadísticas por entidad
  const entidadesStats = useMemo(() => {
    const statsMap: Record<string, EntidadStats> = {};

    processes.forEach((process) => {
      const entidad = process.entidad || "Sin entidad";
      const valor =
        typeof process.precio_base === "string"
          ? parseFloat(process.precio_base) || 0
          : process.precio_base || 0;

      if (!statsMap[entidad]) {
        statsMap[entidad] = {
          nombre: entidad,
          count: 0,
          valorTotal: 0,
        };
      }

      statsMap[entidad].count += 1;
      statsMap[entidad].valorTotal += valor;
    });

    // Ordenar por cantidad de procesos
    return Object.values(statsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }, [processes, limit]);

  const maxCount = entidadesStats[0]?.count || 1;

  if (entidadesStats.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="podium-outline" size={18} color={colors.accent} />
        <Text style={styles.title}>Top Entidades</Text>
      </View>

      {entidadesStats.map((entidad, index) => {
        const percentage = (entidad.count / maxCount) * 100;
        const medalColors = ["#FFD700", "#C0C0C0", "#CD7F32"];
        const medalColor = index < 3 ? medalColors[index] : colors.textTertiary;

        return (
          <TouchableOpacity
            key={entidad.nombre}
            style={styles.entidadRow}
            onPress={() => onEntidadPress?.(entidad.nombre)}
            activeOpacity={onEntidadPress ? 0.7 : 1}
            disabled={!onEntidadPress}>
            {/* Posición */}
            <View
              style={[styles.position, { backgroundColor: `${medalColor}20` }]}>
              {index < 3 ? (
                <Ionicons name="medal" size={16} color={medalColor} />
              ) : (
                <Text
                  style={[
                    styles.positionText,
                    { color: colors.textSecondary },
                  ]}>
                  {index + 1}
                </Text>
              )}
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.entidadNombre} numberOfLines={1}>
                {truncateText(entidad.nombre, 35)}
              </Text>

              {/* Barra de progreso */}
              <View style={styles.barContainer}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          index === 0 ? colors.accent : colors.success,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons
                    name="document-text-outline"
                    size={12}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.statText}>{entidad.count} procesos</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons
                    name="cash-outline"
                    size={12}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.statText}>
                    {formatCurrency(entidad.valorTotal)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Chevron si hay acción */}
            {onEntidadPress && (
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    // Entidad row
    entidadRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      gap: spacing.md,
    },
    position: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    positionText: {
      fontSize: 14,
      fontWeight: "700",
    },
    info: {
      flex: 1,
    },
    entidadNombre: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },

    // Bar
    barContainer: {
      marginBottom: spacing.xs,
    },
    barTrack: {
      height: 6,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 3,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 3,
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    statText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });

export default TopEntidades;
