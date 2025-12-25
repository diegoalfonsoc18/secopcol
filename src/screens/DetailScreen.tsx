import React from "react";
import {
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { colors, spacing, borderRadius } from "../theme";

// ============================================
// CONFIGURACIÓN DE FASES
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

// ============================================
// COMPONENTES AUXILIARES
// ============================================
const InfoRow: React.FC<{
  icon: string;
  label: string;
  value: string | undefined;
  isLast?: boolean;
}> = ({ icon, label, value, isLast }) => (
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

const Section: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const DetailScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { process } = route.params as { process: SecopProcess };
  const { isFavorite, addFavorite, removeFavorite } = useProcessesStore();
  const favorite = isFavorite(process.id_del_proceso);

  const fase = process.fase || "Desconocido";
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
📊 Fase: ${process.fase}

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
    if (process.urlproceso) {
      Linking.openURL(process.urlproceso);
    } else {
      // URL genérica de SECOP II
      Linking.openURL(
        "https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index"
      );
    }
  };

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
          {/* ID y Fase */}
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

        {/* Valor Adjudicado (si existe) */}
        {process.valor_total_adjudicacion && (
          <View style={[styles.priceCard, { borderLeftColor: colors.accent }]}>
            <View style={styles.priceHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={colors.accent}
              />
              <Text style={styles.priceLabel}>Valor Adjudicado</Text>
            </View>
            <Text style={[styles.priceValue, { color: colors.accent }]}>
              {formatCurrency(process.valor_total_adjudicacion)}
            </Text>
          </View>
        )}

        {/* Entidad Contratante */}
        <Section title="Entidad Contratante">
          <InfoRow icon="business" label="Nombre" value={process.entidad} />
          <InfoRow
            icon="card-outline"
            label="NIT"
            value={process.nit_entidad}
          />
          <InfoRow
            icon="location"
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
        <Section title="Información del Proceso">
          {process.modalidad_de_contratacion && (
            <InfoRow
              icon="layers-outline"
              label="Modalidad"
              value={process.modalidad_de_contratacion}
            />
          )}
          {process.tipo_de_contrato && (
            <InfoRow
              icon="document-text-outline"
              label="Tipo de Contrato"
              value={process.tipo_de_contrato}
            />
          )}
          {process.duracion && (
            <InfoRow
              icon="time-outline"
              label="Duración"
              value={`${process.duracion} ${process.unidad_de_duracion || ""}`}
            />
          )}
          {process.estado_del_procedimiento && (
            <InfoRow
              icon="flag-outline"
              label="Estado"
              value={process.estado_del_procedimiento}
              isLast
            />
          )}
        </Section>

        {/* Fechas */}
        <Section title="Fechas">
          <InfoRow
            icon="calendar-outline"
            label="Publicación"
            value={formatDateTime(process.fecha_de_publicacion_del)}
          />
          {process.fecha_de_ultima_publicaci && (
            <InfoRow
              icon="refresh-outline"
              label="Última Actualización"
              value={formatDateTime(process.fecha_de_ultima_publicaci)}
            />
          )}
          {process.fecha_de_recepcion_de && (
            <InfoRow
              icon="download-outline"
              label="Recepción de Ofertas"
              value={formatDateTime(process.fecha_de_recepcion_de)}
            />
          )}
          {process.fecha_adjudicacion && (
            <InfoRow
              icon="checkmark-done-outline"
              label="Adjudicación"
              value={formatDateTime(process.fecha_adjudicacion)}
              isLast
            />
          )}
        </Section>

        {/* Proveedor Adjudicado (si existe) */}
        {process.nombre_del_proveedor && (
          <Section title="Proveedor Adjudicado">
            <InfoRow
              icon="person"
              label="Nombre"
              value={process.nombre_del_proveedor}
            />
            {process.nit_del_proveedor_adjudicado && (
              <InfoRow
                icon="card-outline"
                label="NIT"
                value={process.nit_del_proveedor_adjudicado}
              />
            )}
            {process.ciudad_proveedor && (
              <InfoRow
                icon="location"
                label="Ciudad"
                value={`${process.ciudad_proveedor}${
                  process.departamento_proveedor
                    ? `, ${process.departamento_proveedor}`
                    : ""
                }`}
                isLast
              />
            )}
          </Section>
        )}

        {/* Estadísticas (si existen) */}
        {(process.proveedores_invitados || process.visualizaciones_del) && (
          <View style={styles.statsContainer}>
            {process.proveedores_invitados && (
              <View style={styles.statItem}>
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.statValue}>
                  {process.proveedores_invitados}
                </Text>
                <Text style={styles.statLabel}>Invitados</Text>
              </View>
            )}
            {process.visualizaciones_del && (
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={20} color={colors.accent} />
                <Text style={styles.statValue}>
                  {process.visualizaciones_del}
                </Text>
                <Text style={styles.statLabel}>Vistas</Text>
              </View>
            )}
            {process.respuestas_al_procedimiento && (
              <View style={styles.statItem}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={20}
                  color={colors.accent}
                />
                <Text style={styles.statValue}>
                  {process.respuestas_al_procedimiento}
                </Text>
                <Text style={styles.statLabel}>Respuestas</Text>
              </View>
            )}
          </View>
        )}

        {/* Botón Ver en SECOP */}
        <Pressable
          style={({ pressed }) => [
            styles.secopButton,
            pressed && styles.secopButtonPressed,
          ]}
          onPress={handleOpenSecop}>
          <Ionicons
            name="open-outline"
            size={20}
            color={colors.backgroundSecondary}
          />
          <Text style={styles.secopButtonText}>Ver en SECOP II</Text>
        </Pressable>

        {/* Referencia */}
        {process.referencia_del_proceso && (
          <View style={styles.referenceContainer}>
            <Text style={styles.referenceLabel}>Referencia del Proceso</Text>
            <Text style={styles.referenceValue}>
              {process.referencia_del_proceso}
            </Text>
          </View>
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          La información presentada proviene del Sistema Electrónico de
          Contratación Pública (SECOP II) y puede estar sujeta a
          actualizaciones.
        </Text>
      </ScrollView>
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
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
  },
  backText: {
    fontSize: 17,
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  headerButton: {
    padding: spacing.xs,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  // Hero
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
    marginBottom: spacing.xs,
  },
  idValue: {
    fontSize: 15,
    fontWeight: "600",
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
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 28,
    marginBottom: spacing.lg,
  },

  // Description Card
  descriptionCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 23,
  },

  // Price Card
  priceCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  priceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.success,
  },

  // Sections
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  sectionContent: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  // Info Row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.separatorLight,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // SECOP Button
  secopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secopButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  secopButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.backgroundSecondary,
  },

  // Reference
  referenceContainer: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  referenceLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  referenceValue: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "monospace",
  },

  // Disclaimer
  disclaimer: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },
});

export default DetailScreen;
