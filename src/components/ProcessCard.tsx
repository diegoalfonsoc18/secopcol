import React, { useRef } from "react";
import { View, Text, StyleSheet, Animated, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius, shadows } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useHaptics } from "../hooks/useHaptics";
import {
  CONTRACT_TYPES,
  getContractTypeColor,
  DEFAULT_CONTRACT_CONFIG,
  ContractTypeConfig,
} from "../constants/contractTypes";

// ============================================
// UTILIDADES (Tiempo y Formato)
// ============================================

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

    if (diffMins < 1) return "justo ahora";
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays === 1) return "ayer";
    if (diffDays < 7) return `hace ${diffDays} d`;
    return "";
  } catch {
    return "";
  }
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "Sin fecha";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Sin fecha";
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  } catch {
    return "Sin fecha";
  }
};

const isNewProcess = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    return (
      !isNaN(date.getTime()) &&
      (new Date().getTime() - date.getTime()) / 3600000 < 48
    );
  } catch {
    return false;
  }
};

const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text || text.toLowerCase() === "no definido") return "Sin información";
  return text.length <= maxLength
    ? text
    : text.substring(0, maxLength).trim() + "...";
};

// Mapa de configuración indexado por ID
const contractTypeMap: Record<string, ContractTypeConfig> = {};
CONTRACT_TYPES.forEach((type) => {
  contractTypeMap[type.id] = type;
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
interface ProcessCardProps {
  process: SecopProcess;
  onPress: () => void;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  onPress,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const scale = useRef(new Animated.Value(1)).current;
  const styles = createStyles(colors);

  const fase =
    process.fase || process.estado_del_procedimiento || "Desconocido";
  const isNew = isNewProcess(process.fecha_de_publicacion_del);

  // Lógica de Contrato e Iconos Personalizados
  const tipoContratoOriginal = process.tipo_de_contrato || "";

  // Normalización para búsqueda (Remover tildes y a Mayúsculas)
  const normalizedType = tipoContratoOriginal
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Buscar coincidencia (por ID exacto como "Obra" o por texto normalizado)
  const contractConfig =
    contractTypeMap[tipoContratoOriginal] ||
    CONTRACT_TYPES.find(
      (ct) =>
        ct.id
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase() === normalizedType.toUpperCase()
    ) ||
    DEFAULT_CONTRACT_CONFIG;

  const contractColor = getContractTypeColor(contractConfig, colors);

  const handlePress = () => {
    haptics.light();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
      }>
      <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>PROCESO</Text>
            <Text style={styles.idValue} numberOfLines={1}>
              {process.id_del_proceso || "---"}
            </Text>
          </View>
          <View style={styles.badgesContainer}>
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
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{fase}</Text>
            </View>
          </View>
        </View>

        {/* Badge de Contrato con CustomIcon */}
        <View
          style={[styles.contractTypeBadge, { borderColor: contractColor }]}>
          {contractConfig.CustomIcon ? (
            <contractConfig.CustomIcon size={14} color={contractColor} />
          ) : (
            <Ionicons
              name={(contractConfig.icon as any) || "document-text-outline"}
              size={14}
              color={contractColor}
            />
          )}
          <Text style={[styles.contractTypeText, { color: contractColor }]}>
            {contractConfig.label || tipoContratoOriginal}
          </Text>
        </View>

        {/* Títulos y descripción */}
        <Text style={styles.procedureName} numberOfLines={1}>
          {process.nombre_del_procedimiento &&
          process.nombre_del_procedimiento.toLowerCase() !== "no definido"
            ? process.nombre_del_procedimiento
            : "Procedimiento sin título"}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {truncateText(process.descripci_n_del_procedimiento, 120)}
        </Text>

        {/* Información Entidad y Ubicación */}
        <View style={styles.infoRow}>
          <Ionicons
            name="business-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {process.entidad && process.entidad.toLowerCase() !== "no definido"
              ? process.entidad
              : "Entidad por confirmar"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText} numberOfLines={1}>
            {[process.ciudad_entidad, process.departamento_entidad]
              .filter((v) => v && v.toLowerCase() !== "no definido")
              .join(", ") || "Ubicación por confirmar"}
          </Text>
        </View>

        <View style={styles.separator} />

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.valueContainer}>
            <Text style={styles.valueLabel}>NIT ENTIDAD</Text>
            <Text style={styles.nitValue}>{process.nit_entidad || "---"}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Publicación</Text>
            <View
              style={[
                styles.timeBadge,
                isNew
                  ? { backgroundColor: colors.successLight }
                  : { backgroundColor: colors.backgroundTertiary },
              ]}>
              <Ionicons
                name="time-outline"
                size={12}
                color={isNew ? colors.success : colors.textSecondary}
              />
              <Text
                style={[
                  styles.dateValue,
                  { color: isNew ? colors.success : colors.textPrimary },
                ]}>
                {getRelativeTime(process.fecha_de_publicacion_del) ||
                  formatDate(process.fecha_de_publicacion_del)}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    idContainer: { flex: 1 },
    idLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textTertiary,
      letterSpacing: 0.8,
    },
    idValue: { fontSize: 14, fontWeight: "700", color: colors.accent },
    badgesContainer: { flexDirection: "row", gap: spacing.xs },
    newBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    newBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.backgroundSecondary,
    },
    statusBadge: {
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    contractTypeBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      gap: 6,
      marginBottom: spacing.sm,
    },
    contractTypeText: { fontSize: 12, fontWeight: "700" },
    procedureName: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    description: {
      fontSize: 14,
      color: colors.textPrimary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: 4,
    },
    infoText: { flex: 1, fontSize: 13, color: colors.textSecondary },
    separator: {
      height: 1,
      backgroundColor: colors.separatorLight,
      marginVertical: spacing.md,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    valueContainer: { flex: 1 },
    valueLabel: { fontSize: 10, fontWeight: "600", color: colors.textTertiary },
    nitValue: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
    dateContainer: { alignItems: "flex-end" },
    dateLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: 2,
    },
    timeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
    },
    dateValue: { fontSize: 12, fontWeight: "700" },
  });

export default ProcessCard;
