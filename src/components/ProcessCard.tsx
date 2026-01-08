import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow, isAfter, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";

import { SecopProcess } from "../types/index";
import { spacing, borderRadius } from "../theme";
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
  const mainColor = getContractTypeColor(typeConfig, colors);

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

  let colorSemaforo = "#34C759"; // Verde por defecto (+72h)
  if (horasRestantes !== null && !estaCerrado) {
    if (horasRestantes <= 24) {
      colorSemaforo = "#FF3B30"; // Rojo (Menos de 24h)
    } else if (horasRestantes <= 72) {
      colorSemaforo = "#FFCC00"; // Amarillo (Entre 24h y 72h)
    }
  }

  // Cálculo de progreso para la barra
  let progreso = 0;
  if (fechaCierre && !estaCerrado) {
    const total = fechaCierre.getTime() - fechaPublicacion.getTime();
    const transcurrido = ahora.getTime() - fechaPublicacion.getTime();
    progreso = Math.min(Math.max(transcurrido / total, 0), 1);
  }

  const styles = createStyles(colors, mainColor);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* HEADER: Referencia del Proceso */}
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Proceso</Text>
          <Text style={styles.processId}>
            {process.id_del_proceso || "S/N"}
          </Text>
        </View>
        {horasRestantes !== null && horasRestantes < 24 && !estaCerrado && (
          <View style={[styles.badgeUrgent]}>
            <Ionicons name="time" size={12} color="#FFF" />
            <Text style={styles.badgeText}>CRÍTICO</Text>
          </View>
        )}
      </View>

      {/* TIPO DE CONTRATO */}
      <View
        style={[styles.typeContainer, { backgroundColor: `${mainColor}15` }]}>
        <View style={[styles.iconWrapper, { backgroundColor: mainColor }]}>
          {typeConfig.CustomIcon ? (
            /* Renderiza el icono personalizado de CONTRACT_TYPES */
            <typeConfig.CustomIcon size={14} color="#FFF" />
          ) : (
            /* Fallback a Ionicons si no hay CustomIcon */
            <Ionicons
              name={(typeConfig.icon as any) || "document-text-outline"}
              size={14}
              color="#FFF"
            />
          )}
        </View>
        <Text style={[styles.typeText, { color: mainColor }]}>
          {typeConfig.label}
        </Text>
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

      {/* BARRA DE PROGRESO DE TIEMPO (SEMÁFORO) */}
      {fechaCierre && !estaCerrado && (
        <View style={styles.timeBarContainer}>
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
            <Text style={styles.timeLabelLeft}>
              Cierra{" "}
              {formatDistanceToNow(fechaCierre, {
                addSuffix: true,
                locale: es,
              })}
            </Text>
            <Text style={[styles.timeLabelRight, { color: colorSemaforo }]}>
              {horasRestantes && horasRestantes < 24
                ? "¡CIERRA PRONTO!"
                : "DISPONIBLE"}
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
          <Text style={styles.label}>FECHA PUBLICACIÓN</Text>
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
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.separatorLight,
      elevation: 3,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    label: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textTertiary,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    processId: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: 2,
    },
    badgeUrgent: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FF3B30",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
      gap: 4,
    },
    badgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
    typeContainer: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 100,
      marginBottom: spacing.md,
      gap: 6,
    },
    iconWrapper: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    typeText: { fontSize: 12, fontWeight: "700" },
    title: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: spacing.sm,
    },
    infoText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    timeBarContainer: { marginTop: spacing.md, marginBottom: spacing.sm },
    timeBarTrack: {
      height: 6,
      backgroundColor: colors.background,
      borderRadius: 3,
      overflow: "hidden",
    },
    timeBarFill: { height: "100%", borderRadius: 3 },
    timeLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    timeLabelLeft: { fontSize: 11, color: colors.textTertiary },
    timeLabelRight: {
      fontSize: 11,
      fontWeight: "800",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginTop: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separatorLight,
    },
    priceText: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.textPrimary,
      marginTop: 2,
    },
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    dateText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
  });
