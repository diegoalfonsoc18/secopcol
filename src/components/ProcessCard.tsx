import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SecopProcess } from "../types/index";
import { colors, spacing, borderRadius } from "../theme";

// ============================================
// CONFIGURACIÓN DE FASES (Estados del proceso)
// ============================================
const phaseConfig: Record<string, { color: string; bg: string; icon: string }> =
  {
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

// ============================================
// UTILIDADES
// ============================================
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "No especificada";
  try {
    // La API de SECOP puede devolver fechas en formato ISO o timestamp
    const date = new Date(dateString);

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return "No especificada";
    }

    return date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "No especificada";
  }
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
  onFavoritePress,
  isFavorite = false,
}) => {
  const fase = process.fase || "Desconocido";
  const phaseStyle = phaseConfig[fase] || defaultPhase;
  // Justo antes del return del componente
  console.log("🔍 Proceso:", {
    id: process.id_del_proceso,
    fecha: process.fecha_de_publicacion_del,
    tipoFecha: typeof process.fecha_de_publicacion_del,
  });
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}>
      {/* Header: ID y Fase */}
      <View style={styles.header}>
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>PROCESO</Text>
          <Text style={styles.idValue} numberOfLines={1}>
            {process.id_del_proceso || "Sin ID"}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: phaseStyle.bg }]}>
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
          <Text style={styles.dateValue}>
            {formatDate(process.fecha_de_publicacion_del)}
          </Text>
        </View>
      </View>

      {/* Botón favorito */}
      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onFavoritePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={isFavorite ? colors.danger : colors.textTertiary}
          />
        </TouchableOpacity>
      )}

      {/* Chevron */}
      <View style={styles.chevronContainer}>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
        />
      </View>
    </Pressable>
  );
};

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  containerPressed: {
    opacity: 0.97,
    transform: [{ scale: 0.99 }],
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  idContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  idLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  idValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Descripción
  procedureName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.textPrimary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: spacing.sm,
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
    fontWeight: "500",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nitValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  dateContainer: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },

  // Favorite button
  favoriteButton: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg + 24,
  },

  // Chevron
  chevronContainer: {
    position: "absolute",
    right: spacing.md,
    top: "50%",
    marginTop: -9,
  },
});

export default ProcessCard;
