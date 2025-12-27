import React from "react";
import {
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";

// ============================================
// UTILIDADES
// ============================================
const formatCurrency = (value: string | number | undefined): string => {
  if (!value) return "No especificado";
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) return "No especificado";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
};

const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return "No disponible";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "No disponible";
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const getProcessPhase = (process: SecopProcess): string => {
  return process.fase || process.estado_del_procedimiento || "Desconocido";
};

const getProcessUrl = (
  urlproceso: string | { url: string } | undefined
): string | null => {
  if (!urlproceso) return null;
  if (typeof urlproceso === "string") return urlproceso;
  if (typeof urlproceso === "object" && urlproceso.url) return urlproceso.url;
  return null;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const DetailScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { process } = route.params as { process: SecopProcess };
  const { isFavorite, addFavorite, removeFavorite } = useProcessesStore();
  const favorite = isFavorite(process.id_del_proceso);

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

  const handleToggleFavorite = () => {
    if (favorite) {
      removeFavorite(process.id_del_proceso);
    } else {
      addFavorite(process);
    }
  };

  const handleShare = async () => {
    try {
      const message = `📋 Proceso SECOP II

${process.nombre_del_procedimiento || "Sin nombre"}

🏢 Entidad: ${process.entidad}
📍 Ubicación: ${process.ciudad_entidad}, ${process.departamento_entidad}
💰 Precio base: ${formatCurrency(process.precio_base)}
📊 Fase: ${fase}

🔗 Ver más en SECOP II`;

      await Share.share({
        message,
        title: "Compartir Proceso SECOP",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleOpenSecop = () => {
    const url = getProcessUrl(process.urlproceso);
    if (url) {
      Linking.openURL(url);
    } else {
      Linking.openURL(
        "https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index"
      );
    }
  };

  // Componentes internos con acceso a styles y colors
  const InfoRow = ({
    icon,
    label,
    value,
    isLast = false,
  }: {
    icon: string;
    label: string;
    value: string | undefined;
    isLast?: boolean;
  }) => (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon as any} size={18} color={colors.accent} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "No disponible"}</Text>
      </View>
    </View>
  );

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
          <Text style={styles.backText}>Atrás</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="share-outline" size={22} color={colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.headerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={22}
              color={favorite ? colors.danger : colors.accent}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.idContainer}>
            <Text style={styles.idLabel}>PROCESO</Text>
            <Text style={styles.idValue}>{process.id_del_proceso}</Text>
          </View>

          <View style={[styles.phaseBadge, { backgroundColor: phaseStyle.bg }]}>
            <Ionicons
              name={phaseStyle.icon as any}
              size={14}
              color={phaseStyle.color}
            />
            <Text style={[styles.phaseText, { color: phaseStyle.color }]}>
              {fase}
            </Text>
          </View>
        </View>

        {/* Nombre del Procedimiento */}
        {process.nombre_del_procedimiento && (
          <Text style={styles.procedureName}>
            {process.nombre_del_procedimiento}
          </Text>
        )}

        {/* Descripción Card */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionLabel}>Objeto del Proceso</Text>
          <Text style={styles.descriptionText}>
            {process.descripci_n_del_procedimiento ||
              "Sin descripción disponible"}
          </Text>
        </View>

        {/* Precio Base Card */}
        {process.precio_base && (
          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Ionicons name="cash-outline" size={22} color={colors.success} />
              <Text style={styles.priceLabel}>Precio Base</Text>
            </View>
            <Text style={styles.priceValue}>
              {formatCurrency(process.precio_base)}
            </Text>
          </View>
        )}

        {/* Información de la Entidad */}
        <Section title="Entidad Contratante">
          <InfoRow
            icon="business-outline"
            label="Entidad"
            value={process.entidad}
          />
          <InfoRow
            icon="card-outline"
            label="NIT"
            value={process.nit_entidad}
          />
          <InfoRow
            icon="location-outline"
            label="Ciudad"
            value={process.ciudad_entidad}
          />
          <InfoRow
            icon="map-outline"
            label="Departamento"
            value={process.departamento_entidad}
            isLast
          />
        </Section>

        {/* Información del Proceso */}
        <Section title="Detalles del Proceso">
          <InfoRow
            icon="document-text-outline"
            label="Modalidad"
            value={process.modalidad_de_contratacion}
          />
          <InfoRow
            icon="briefcase-outline"
            label="Tipo de Contrato"
            value={process.tipo_de_contrato}
          />
          <InfoRow
            icon="calendar-outline"
            label="Fecha Publicación"
            value={formatDateTime(process.fecha_de_publicacion_del)}
          />
          <InfoRow
            icon="time-outline"
            label="Última Actualización"
            value={formatDateTime(process.fecha_de_ultima_publicaci)}
            isLast
          />
        </Section>

        {/* Botón Ver en SECOP */}
        <TouchableOpacity style={styles.secopButton} onPress={handleOpenSecop}>
          <Ionicons
            name="open-outline"
            size={20}
            color={colors.backgroundSecondary}
          />
          <Text style={styles.secopButtonText}>Ver en SECOP II</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.background,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    backText: {
      fontSize: 17,
      color: colors.accent,
    },
    headerActions: {
      flexDirection: "row",
      gap: spacing.md,
    },
    headerButton: {
      padding: spacing.xs,
    },

    // ScrollView
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
    },

    // Hero Section
    heroSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: spacing.lg,
    },
    idContainer: {
      flex: 1,
    },
    idLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textTertiary,
      letterSpacing: 1,
      marginBottom: 4,
    },
    idValue: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.accent,
    },
    phaseBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    phaseText: {
      fontSize: 13,
      fontWeight: "600",
    },

    // Procedure Name
    procedureName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.accent,
      marginBottom: spacing.lg,
    },

    // Description Card
    descriptionCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    descriptionLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    descriptionText: {
      fontSize: 15,
      color: colors.textPrimary,
      lineHeight: 22,
    },

    // Price Card
    priceCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.success,
    },
    priceHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    priceLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    priceValue: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.success,
    },

    // Section
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    sectionContent: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      overflow: "hidden",
    },

    // Info Row
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: spacing.md,
    },
    infoRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    infoIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.accentLight,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textTertiary,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.textPrimary,
    },

    // SECOP Button
    secopButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    secopButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
  });

export default DetailScreen;
