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
  const { colors } = useTheme();

  // 1. CONFIGURACIÓN VISUAL DINÁMICA
  const typeConfig =
    getContractTypeConfig(process.tipo_de_contrato ?? "") ||
    DEFAULT_CONTRACT_CONFIG;
  const mainColor = getContractTypeColor(typeConfig);

  // 2. FECHAS
  const fechaPubRaw =
    process.fecha_de_publicacion_del || process.fecha_de_ultima_publicaci;
  const fechaPublicacion = fechaPubRaw ? parseISO(fechaPubRaw) : new Date();
  const fechaCierreRaw = process.fecha_de_recepcion_de;
  const fechaCierre = fechaCierreRaw ? parseISO(fechaCierreRaw) : null;

  // 3. ESTADO RESUMEN
  const estadoResumen = process.estado_resumen;

  const getEstadoColor = (estado?: string) => {
    if (!estado || estado === "No Definido")
      return { bg: "rgba(142, 142, 147, 0.08)", text: colors.textTertiary };
    const lower = estado.toLowerCase();
    // Adjudicado / Seleccionado → azul
    if (lower.includes("adjudicado") || lower === "seleccionado")
      return { bg: "rgba(0, 122, 255, 0.12)", text: "#007AFF" };
    // Abierto para ofertar → verde
    if (lower.includes("oferta") || lower === "publicado" || lower === "abierto")
      return { bg: "rgba(48, 209, 88, 0.12)", text: colors.success };
    // En evaluación → naranja
    if (lower.includes("observacion") || lower.includes("concurso") || lower.includes("calificaci") || lower === "evaluación")
      return { bg: "rgba(255, 149, 0, 0.10)", text: colors.warning };
    // Cancelado / Suspendido → rojo
    if (lower.includes("cancelado") || lower.includes("desierto") || lower === "suspendido")
      return { bg: "rgba(255, 59, 48, 0.10)", text: colors.danger };
    // Borrador / En aprobación → gris
    if (lower === "borrador" || lower.includes("aprobaci"))
      return { bg: "rgba(142, 142, 147, 0.10)", text: colors.textTertiary };
    return { bg: "rgba(142, 142, 147, 0.08)", text: colors.textSecondary };
  };

  const estadoStyle = getEstadoColor(estadoResumen);

  const styles = createStyles(colors, mainColor);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* HEADER: Número del Proceso y Entidad */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>N° PROCESO</Text>
          <Text style={styles.processId}>
            {process.referencia_del_proceso || process.id_del_proceso || "S/N"}
          </Text>
        </View>

        <View style={styles.entidadContainer}>
          <Text style={styles.label}>ENTIDAD</Text>
          <Text style={styles.entidadText} numberOfLines={2}>
            {process.entidad || "Sin entidad"}
          </Text>
        </View>

      </View>

      {/* TIPO DE CONTRATO + ESTADO + FASE */}
      <View style={styles.badgesRow}>
        <View
          style={[styles.typeContainer, { backgroundColor: `${mainColor}15` }]}>
          <View style={[styles.iconWrapper, { backgroundColor: mainColor }]}>
            <typeConfig.CustomIcon size={14} color="#FFF" />
          </View>
          <Text style={[styles.typeText, { color: mainColor }]}>
            {typeConfig.label}
          </Text>
        </View>
        {estadoResumen && estadoResumen !== "No Definido" && (
          <View style={[
            styles.estadoBadge,
            { backgroundColor: estadoStyle.bg },
          ]}>
            <View style={[
              styles.estadoDot,
              { backgroundColor: estadoStyle.text },
            ]} />
            <Text style={[
              styles.estadoText,
              { color: estadoStyle.text },
            ]}>
              {estadoResumen}
            </Text>
          </View>
        )}
      </View>

      {/* TÍTULO */}
      <Text style={styles.title} numberOfLines={3}>
        {process.descripci_n_del_procedimiento || "Sin descripción disponible"}
      </Text>

      {/* ENTIDAD Y UBICACIÓN */}
      <View style={styles.infoRow}>
        <Ionicons
          name="location-outline"
          size={14}
          color={colors.textTertiary}
        />
        <Text style={styles.infoText} numberOfLines={1}>
          {process.ciudad_entidad}, {process.departamento_entidad}
        </Text>
      </View>

      {/* FOOTER: Valor y Fecha de Publicación */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>VALOR ESTIMADO</Text>
          <Text style={styles.priceText}>
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            }).format(Number(process.precio_base || 0))}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.label}>PUBLICADO</Text>
          <View style={styles.dateContainer}>
            <Ionicons
              name="megaphone-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.dateText}>
              {format(fechaPublicacion, "dd MMM yyyy", { locale: es })}
            </Text>
          </View>
          {fechaCierre && (
            <>
              <Text style={[styles.label, { marginTop: spacing.sm }]}>CIERRE</Text>
              <View style={styles.dateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.danger}
                />
                <Text style={[styles.dateText, { color: colors.danger }]}>
                  {format(fechaCierre, "dd MMM yyyy", { locale: es })}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any, mainColor: string) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        },
        android: {
          borderWidth: 1,
          borderColor: colors.separatorLight,
        },
      }),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.sm,
    },
    label: {
      ...typography.caption2,
      fontWeight: "600",
      color: colors.textTertiary,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    processId: {
      ...typography.subhead,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: scale(2),
    },
    badgesRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    typeContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 100,
      gap: spacing.sm,
    },
    estadoBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 100,
      gap: scale(4),
    },
    estadoDot: {
      width: scale(6),
      height: scale(6),
      borderRadius: scale(3),
    },
    estadoText: {
      ...typography.caption2,
      fontWeight: "600",
    },
    iconWrapper: {
      width: scale(24),
      height: scale(24),
      borderRadius: scale(12),
      alignItems: "center",
      justifyContent: "center",
    },
    typeText: {
      ...typography.caption1,
      fontWeight: "600",
    },
    title: {
      ...typography.callout,
      fontWeight: "600",
      color: colors.textPrimary,
      letterSpacing: -0.3,
      marginBottom: spacing.sm,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(8),
      marginBottom: spacing.sm,
    },
    infoText: {
      ...typography.footnote,
      color: colors.textSecondary,
      flex: 1,
    },
    // Footer
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: spacing.lg,
    },
    priceText: {
      ...typography.headline,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: -0.5,
      marginTop: scale(2),
    },
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: scale(4),
      marginTop: scale(4),
    },
    dateText: {
      ...typography.footnote,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    entidadContainer: {
      flex: 1,
      alignItems: "flex-end",
      marginLeft: spacing.md,
    },
    entidadText: {
      ...typography.caption1,
      fontWeight: "500",
      color: colors.textSecondary,
      textAlign: "right",
      marginTop: scale(2),
    },
  });
