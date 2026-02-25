import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { parseISO, format, isAfter } from "date-fns";
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

  // 2. LÓGICA DE TIEMPO Y FECHAS
  const fechaPubRaw =
    process.fecha_de_publicacion_del || process.fecha_de_ultima_publicaci;
  const fechaPublicacion = fechaPubRaw ? parseISO(fechaPubRaw) : new Date();

  const fechaCierreRaw = process.fecha_de_recepcion_de;
  const fechaCierre = fechaCierreRaw ? parseISO(fechaCierreRaw) : null;

  const ahora = new Date();
  const estaCerrado = fechaCierre ? isAfter(ahora, fechaCierre) : false;

  // 3. LÓGICA DE SEMÁFORO (Verde, Amarillo, Rojo)
  const horasRestantes = fechaCierre
    ? (fechaCierre.getTime() - ahora.getTime()) / (1000 * 60 * 60)
    : null;

  let colorSemaforo = colors.success; // Verde por defecto (+72h)
  let estadoTiempo = "Abierto";

  if (estaCerrado) {
    colorSemaforo = colors.textTertiary; // Gris para cerrado
    estadoTiempo = "Cerrado";
  } else if (horasRestantes !== null) {
    if (horasRestantes <= 24) {
      colorSemaforo = colors.danger; // Rojo (Menos de 24h)
      estadoTiempo = "Urgente";
    } else if (horasRestantes <= 72) {
      colorSemaforo = colors.warning; // Amarillo (Entre 24h y 72h)
      estadoTiempo = "Próximo";
    }
  }

  // 4. CÁLCULO DE PROGRESO PARA LA BARRA
  let progreso = 0;
  if (fechaCierre) {
    if (estaCerrado) {
      progreso = 1;
    } else {
      const total = fechaCierre.getTime() - fechaPublicacion.getTime();
      const transcurrido = ahora.getTime() - fechaPublicacion.getTime();
      progreso = Math.min(Math.max(transcurrido / total, 0), 1);
    }
  }

  // 5. FORMATO DE TIEMPO RESTANTE
  const formatTiempoRestante = (): string => {
    if (!fechaCierre) return "Sin fecha límite";
    if (estaCerrado) return "Proceso cerrado";

    if (horasRestantes !== null) {
      if (horasRestantes < 1) {
        const minutos = Math.round(horasRestantes * 60);
        return `${minutos} min restantes`;
      } else if (horasRestantes < 24) {
        const horas = Math.round(horasRestantes);
        return `${horas}h restantes`;
      } else {
        const dias = Math.round(horasRestantes / 24);
        return `${dias} día${dias !== 1 ? "s" : ""} restante${
          dias !== 1 ? "s" : ""
        }`;
      }
    }
    return "";
  };

  const styles = createStyles(colors, mainColor);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* HEADER: Número del Proceso y Entidad */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>N° PROCESO</Text>
          <Text style={styles.processId}>
            {process.id_del_proceso || "S/N"}
          </Text>
        </View>

        <View style={styles.entidadContainer}>
          <Text style={styles.label}>ENTIDAD</Text>
          <Text style={styles.entidadText} numberOfLines={2}>
            {process.entidad || "Sin entidad"}
          </Text>
        </View>

        {horasRestantes !== null && horasRestantes < 24 && !estaCerrado && (
          <View style={styles.badgeUrgent}>
            <Ionicons name="time" size={12} color="#FFF" />
            <Text style={styles.badgeText}>CRÍTICO</Text>
          </View>
        )}
      </View>

      {/* TIPO DE CONTRATO + FASE */}
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
        {process.fase && (
          <View style={[styles.faseBadge, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="flag-outline" size={12} color={colors.accent} />
            <Text style={[styles.faseText, { color: colors.accent }]}>
              {process.fase}
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

      {/* BARRA DE TIEMPO / PROGRESO */}
      {fechaCierre && (
        <View style={styles.timeBarContainer}>
          <View style={styles.timeHeader}>
            <View style={styles.timeStatusGroup}>
              <View
                style={[styles.statusDot, { backgroundColor: colorSemaforo }]}
              />
              <Text style={[styles.statusText, { color: colorSemaforo }]}>
                {estadoTiempo}
              </Text>
            </View>
            <Text style={[styles.timeRemaining, { color: colorSemaforo }]}>
              {formatTiempoRestante()}
            </Text>
          </View>

          <View style={styles.timeBarTrack}>
            <View
              style={[
                styles.timeBarFill,
                {
                  width: `${progreso * 100}%`,
                  backgroundColor: colorSemaforo,
                },
              ]}
            />
          </View>

          <View style={styles.timeLabels}>
            <Text style={styles.timeLabelText}>
              {format(fechaPublicacion, "dd MMM", { locale: es })}
            </Text>
            <Text style={styles.timeLabelText}>
              Cierre: {format(fechaCierre, "dd MMM yyyy", { locale: es })}
            </Text>
          </View>
        </View>
      )}

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
    badgeUrgent: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.danger,
      paddingHorizontal: scale(8),
      paddingVertical: scale(4),
      borderRadius: borderRadius.sm,
      gap: scale(4),
    },
    badgeText: {
      color: "#FFF",
      fontSize: scale(11),
      fontWeight: "700",
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
    faseBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 100,
      gap: scale(4),
    },
    faseText: {
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
    // Estilos de la barra de tiempo
    timeBarContainer: {
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    timeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    timeStatusGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    statusDot: {
      width: scale(8),
      height: scale(8),
      borderRadius: scale(4),
    },
    statusText: {
      ...typography.caption1,
      fontWeight: "600",
    },
    timeRemaining: {
      ...typography.caption2,
      fontWeight: "600",
    },
    timeBarTrack: {
      height: scale(4),
      backgroundColor: colors.separatorLight,
      borderRadius: scale(2),
      overflow: "hidden",
    },
    timeBarFill: {
      height: "100%",
      borderRadius: 3,
    },
    timeLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.sm,
    },
    timeLabelText: {
      ...typography.caption2,
      color: colors.textTertiary,
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
