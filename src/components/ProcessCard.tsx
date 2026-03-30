import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

import { SecopProcess } from "../types/index";
import { spacing, borderRadius, scale, typography } from "../theme";
import { useTheme } from "../context/ThemeContext";
import {
  getContractTypeConfig,
  getContractTypeColor,
  DEFAULT_CONTRACT_CONFIG,
} from "../constants/contractTypes";

interface ProcessCardProps {
  process: SecopProcess;
  onPress: () => void;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  const typeConfig =
    getContractTypeConfig(process.tipo_de_contrato ?? "") ||
    DEFAULT_CONTRACT_CONFIG;
  const mainColor = getContractTypeColor(typeConfig);

  const fechaPubRaw = process.fecha_de_publicacion_del;
  const fechaPublicacion = fechaPubRaw ? parseISO(fechaPubRaw) : new Date();
  const fechaCierreRaw = process.fecha_de_recepcion_de;
  const fechaCierre = fechaCierreRaw ? parseISO(fechaCierreRaw) : null;

  const getEstadoProceso = (): { label: string; color: string; bg: string; icon: string } => {
    const estadoProc = process.estado_del_procedimiento?.toLowerCase() || "";
    const resumen = process.estado_resumen?.toLowerCase() || "";
    const adjudicado = process.adjudicado === "Si" || process.adjudicado === "Sí" || resumen.includes("adjudicado");

    if (estadoProc === "cancelado")
      return { label: "Cancelado", color: colors.danger, bg: "rgba(255, 59, 48, 0.10)", icon: "close-circle" };
    if (estadoProc === "suspendido")
      return { label: "Suspendido", color: colors.warning, bg: "rgba(255, 149, 0, 0.10)", icon: "pause-circle" };
    if (estadoProc === "borrador")
      return { label: "Borrador", color: colors.textTertiary, bg: "rgba(142, 142, 147, 0.10)", icon: "document-outline" };
    if (adjudicado || estadoProc === "seleccionado")
      return { label: "Adjudicado", color: "#007AFF", bg: "rgba(0, 122, 255, 0.12)", icon: "checkmark-circle" };
    if (estadoProc === "evaluación")
      return { label: "En evaluación", color: colors.warning, bg: "rgba(255, 149, 0, 0.10)", icon: "hourglass-outline" };
    if (estadoProc === "en aprobación" || estadoProc === "aprobado")
      return { label: "En aprobación", color: colors.warning, bg: "rgba(255, 149, 0, 0.10)", icon: "time-outline" };
    if (estadoProc === "publicado" || estadoProc === "abierto")
      return { label: "Publicado", color: colors.success, bg: "rgba(48, 209, 88, 0.12)", icon: "megaphone-outline" };
    if (resumen.includes("desierto"))
      return { label: "Desierto", color: colors.textTertiary, bg: "rgba(142, 142, 147, 0.10)", icon: "remove-circle-outline" };

    return { label: "", color: colors.textTertiary, bg: "rgba(142, 142, 147, 0.08)", icon: "help-circle-outline" };
  };

  const estadoProceso = getEstadoProceso();

  const styles = createStyles(colors, mainColor, isDark);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Top: Type badge + Status */}
      <View style={styles.topRow}>
        <View style={[styles.typeBadge, { backgroundColor: `${mainColor}12` }]}>
          <View style={[styles.typeIconDot, { backgroundColor: mainColor }]}>
            <typeConfig.CustomIcon size={12} color="#FFF" />
          </View>
          <Text style={[styles.typeText, { color: mainColor }]}>
            {typeConfig.label}
          </Text>
        </View>
        {estadoProceso.label !== "" && (
          <View style={[styles.estadoBadge, { backgroundColor: estadoProceso.bg }]}>
            <Ionicons name={estadoProceso.icon as any} size={11} color={estadoProceso.color} />
            <Text style={[styles.estadoText, { color: estadoProceso.color }]}>
              {estadoProceso.label}
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {process.descripci_n_del_procedimiento || "Sin descripción disponible"}
      </Text>

      {/* Entity */}
      <Text style={styles.entity} numberOfLines={1}>
        {process.entidad || "Sin entidad"}
      </Text>

      {/* Location */}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {process.ciudad_entidad}, {process.departamento_entidad}
        </Text>
      </View>

      {/* Footer: Price + Date */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.price}>
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            }).format(Number(process.precio_base || 0))}
          </Text>
        </View>
        <View style={styles.dateColumn}>
          <Text style={styles.dateLabel}>
            {format(fechaPublicacion, "dd MMM yyyy", { locale: es })}
          </Text>
          {fechaCierre && (
            <View style={styles.closingRow}>
              <Ionicons name="timer-outline" size={11} color={colors.danger} />
              <Text style={[styles.dateLabel, { color: colors.danger }]}>
                {format(fechaCierre, "dd MMM", { locale: es })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, mainColor: string, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? "#000" : "#4A6741",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 12,
        },
        android: {
          elevation: 2,
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.separatorLight,
        },
      }),
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    typeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: scale(3),
      borderRadius: 100,
      gap: scale(6),
    },
    typeIconDot: {
      width: scale(20),
      height: scale(20),
      borderRadius: scale(10),
      alignItems: "center",
      justifyContent: "center",
    },
    typeText: {
      fontSize: scale(11),
      fontWeight: "600",
    },
    estadoBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: scale(3),
      borderRadius: 100,
      gap: scale(3),
    },
    estadoText: {
      fontSize: scale(10),
      fontWeight: "600",
    },
    title: {
      ...typography.callout,
      fontWeight: "600",
      color: colors.textPrimary,
      letterSpacing: -0.3,
      marginBottom: scale(4),
      lineHeight: scale(20),
    },
    entity: {
      ...typography.footnote,
      color: colors.textSecondary,
      fontWeight: "500",
      marginBottom: scale(6),
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(4),
      marginBottom: spacing.md,
    },
    locationText: {
      fontSize: scale(12),
      color: colors.textTertiary,
      flex: 1,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separatorLight,
      paddingTop: spacing.sm,
    },
    price: {
      fontSize: scale(16),
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    dateColumn: {
      alignItems: "flex-end",
      gap: scale(2),
    },
    dateLabel: {
      fontSize: scale(11),
      fontWeight: "500",
      color: colors.textTertiary,
    },
    closingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(3),
    },
  });
