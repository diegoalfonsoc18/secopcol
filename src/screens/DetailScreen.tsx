import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useHaptics } from "../hooks/useHaptics";
import { FadeIn, SlideInUp } from "../components/Animations";
import { analyzeProcess, AnalysisResult } from "../services/aiAnalysis";

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
      month: "long",
      day: "numeric",
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

const isAdjudicado = (process: SecopProcess): boolean => {
  return (
    process.adjudicado === "Si" ||
    process.adjudicado === "Sí" ||
    !!process.nombre_del_proveedor ||
    !!process.valor_total_adjudicacion
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const DetailScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const haptics = useHaptics();
  const { process } = route.params as { process: SecopProcess };
  const { isFavorite, addFavorite, removeFavorite } = useProcessesStore();
  const favorite = isFavorite(process.id_del_proceso);

  // Estado para análisis IA
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const styles = createStyles(colors);

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
  const adjudicado = isAdjudicado(process);

  const handleToggleFavorite = () => {
    if (favorite) {
      haptics.warning();
      removeFavorite(process.id_del_proceso);
    } else {
      haptics.success();
      addFavorite(process);
    }
  };

  const handleShare = async () => {
    haptics.light();
    try {
      const url = getProcessUrl(process.urlproceso);
      const message = `📋 *Proceso SECOP II*

📌 *${process.nombre_del_procedimiento || "Sin nombre"}*

🏢 *Entidad:* ${process.entidad}
📍 *Ubicación:* ${process.ciudad_entidad}, ${process.departamento_entidad}
💰 *Precio base:* ${formatCurrency(process.precio_base)}
📊 *Fase:* ${fase}
📅 *Publicado:* ${formatDateTime(process.fecha_de_publicacion_del)}${
        adjudicado
          ? `
✅ *Adjudicado a:* ${process.nombre_del_proveedor}
💵 *Valor adjudicado:* ${formatCurrency(process.valor_total_adjudicacion)}`
          : ""
      }

🔗 ${
        url ||
        "https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index"
      }

_Enviado desde SECOP Colombia App_`;

      await Share.share({
        message,
        title: "Compartir Proceso SECOP",
        url: url || undefined,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleOpenSecop = () => {
    haptics.medium();
    const url = getProcessUrl(process.urlproceso);
    if (url) {
      Linking.openURL(url);
    } else {
      Linking.openURL(
        "https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index"
      );
    }
  };

  // Handler para análisis con IA
  const handleAnalyze = async () => {
    if (analyzing) return;

    haptics.medium();
    setAnalyzing(true);

    try {
      const result = await analyzeProcess(process);
      setAnalysis(result);
      haptics.success();
    } catch (error) {
      console.error("Error analyzing:", error);
      haptics.error();
      Alert.alert(
        "Error",
        "No se pudo analizar el proceso. Intenta de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setAnalyzing(false);
    }
  };

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
    icon,
  }: {
    title: string;
    children: React.ReactNode;
    icon?: string;
  }) => (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        {icon && (
          <Ionicons name={icon as any} size={18} color={colors.accent} />
        )}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  // Componente para mostrar el análisis IA
  const AIAnalysisSection = () => {
    if (!analysis) return null;

    return (
      <View style={styles.aiSection}>
        <View style={styles.aiHeader}>
          <View style={styles.aiTitleRow}>
            <Ionicons name="sparkles" size={20} color="#8B5CF6" />
            <Text style={styles.aiTitle}>Análisis IA</Text>
          </View>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>Gemini</Text>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color={colors.accent}
            />
            <Text style={styles.aiCardTitle}>Resumen</Text>
          </View>
          <Text style={styles.aiCardText}>{analysis.resumen}</Text>
        </View>

        {/* Requisitos */}
        {(analysis?.requisitos?.otros?.length > 0 ||
          analysis?.requisitos?.experiencia ||
          analysis?.requisitos?.capacidad_financiera) && (
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>Requisitos Clave</Text>

            {analysis.requisitos.experiencia && (
              <Text style={styles.aiText}>
                • {analysis.requisitos.experiencia}
              </Text>
            )}

            {analysis.requisitos.otros?.map((item, index) => (
              <Text key={index} style={styles.aiText}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {/* Fechas Clave */}
        {analysis?.fechas_clave &&
          (analysis.fechas_clave.fecha_limite ||
            analysis.fechas_clave.otras_fechas?.length > 0) && (
            <View style={styles.aiCard}>
              <View style={styles.aiCardHeader}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.aiCardTitle}>Fechas Clave</Text>
              </View>

              {analysis.fechas_clave.fecha_limite && (
                <View style={styles.aiDateRow}>
                  <Text style={styles.aiDateLabel}>Fecha límite:</Text>
                  <Text style={styles.aiDateValue}>
                    {analysis.fechas_clave.fecha_limite}
                  </Text>
                </View>
              )}

              {analysis.fechas_clave.fecha_visita && (
                <View style={styles.aiDateRow}>
                  <Text style={styles.aiDateLabel}>Visita técnica:</Text>
                  <Text style={styles.aiDateValue}>
                    {analysis.fechas_clave.fecha_visita}
                  </Text>
                </View>
              )}
            </View>
          )}

        {/* Recomendaciones */}
        {analysis.recomendaciones.length > 0 && (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <Ionicons name="bulb-outline" size={16} color={colors.warning} />
              <Text style={styles.aiCardTitle}>Recomendaciones</Text>
            </View>
            {analysis.recomendaciones.map((rec, index) => (
              <View key={index} style={styles.aiRecommendation}>
                <Text style={styles.aiRecommendationNumber}>{index + 1}</Text>
                <Text style={styles.aiRecommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            navigation.goBack();
          }}
          style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
          <Text style={styles.backText}>Atrás</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.headerButton}>
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
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <FadeIn delay={50}>
          <View style={styles.heroSection}>
            <View style={styles.idContainer}>
              <Text style={styles.idLabel}>PROCESO</Text>
              <Text style={styles.idValue}>{process.id_del_proceso}</Text>
            </View>

            <View style={styles.badgesRow}>
              {adjudicado && (
                <View
                  style={[
                    styles.phaseBadge,
                    { backgroundColor: colors.backgroundTertiary },
                  ]}>
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.phaseText, { color: colors.textSecondary }]}>
                    ADJUDICADO
                  </Text>
                </View>
              )}
              <View
                style={[styles.phaseBadge, { backgroundColor: phaseStyle.bg }]}>
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
          </View>

          {/* Nombre del Procedimiento */}
          {process.nombre_del_procedimiento && (
            <Text style={styles.procedureName}>
              {process.nombre_del_procedimiento}
            </Text>
          )}

          {/* Descripción */}
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionLabel}>Objeto del Proceso</Text>
            <Text style={styles.descriptionText}>
              {process.descripci_n_del_procedimiento ||
                "Sin descripción disponible"}
            </Text>
          </View>
        </FadeIn>

        {/* Botón Analizar con IA */}
        <SlideInUp delay={75}>
          {!analysis ? (
            <TouchableOpacity
              style={[
                styles.analyzeButton,
                analyzing && styles.analyzeButtonDisabled,
              ]}
              onPress={handleAnalyze}
              disabled={analyzing}>
              {analyzing ? (
                <>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={styles.analyzeButtonText}>Analizando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                  <Text style={styles.analyzeButtonText}>Analizar con IA</Text>
                  <View style={styles.analyzeButtonBadge}>
                    <Text style={styles.analyzeButtonBadgeText}>Gratis</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <AIAnalysisSection />
          )}
        </SlideInUp>

        {/* Precio Base */}
        <SlideInUp delay={100}>
          {process.precio_base && (
            <View style={styles.priceCard}>
              <View style={styles.priceHeader}>
                <Ionicons name="cash-outline" size={22} color={colors.accent} />
                <Text style={styles.priceLabel}>Precio Base</Text>
              </View>
              <Text style={styles.priceValue}>
                {formatCurrency(process.precio_base)}
              </Text>
            </View>
          )}
        </SlideInUp>

        {/* SECCIÓN ADJUDICACIÓN - Mismo estilo que las demás */}
        {adjudicado && (
          <Section title="Contrato Adjudicado" icon="trophy-outline">
            {process.nombre_del_proveedor && (
              <InfoRow
                icon="person-outline"
                label="Adjudicatario"
                value={process.nombre_del_proveedor}
              />
            )}
            {process.nit_del_proveedor_adjudicado && (
              <InfoRow
                icon="card-outline"
                label="NIT"
                value={process.nit_del_proveedor_adjudicado}
              />
            )}
            {(process.ciudad_proveedor || process.departamento_proveedor) && (
              <InfoRow
                icon="location-outline"
                label="Ubicación"
                value={[
                  process.ciudad_proveedor,
                  process.departamento_proveedor,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
            {process.fecha_adjudicacion && (
              <InfoRow
                icon="calendar-outline"
                label="Fecha Adjudicación"
                value={formatDateTime(process.fecha_adjudicacion)}
              />
            )}
            {process.valor_total_adjudicacion && (
              <InfoRow
                icon="cash-outline"
                label="Valor del Contrato"
                value={formatCurrency(process.valor_total_adjudicacion)}
                isLast
              />
            )}
          </Section>
        )}

        {/* Información de la Entidad */}
        <Section title="Entidad Contratante" icon="business-outline">
          <InfoRow icon="business" label="Entidad" value={process.entidad} />
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

        {/* Detalles del Proceso */}
        <Section title="Detalles del Proceso" icon="document-text-outline">
          <InfoRow
            icon="layers-outline"
            label="Modalidad"
            value={process.modalidad_de_contratacion}
          />
          <InfoRow
            icon="briefcase-outline"
            label="Tipo de Contrato"
            value={process.tipo_de_contrato}
          />
          {process.duracion && (
            <InfoRow
              icon="time-outline"
              label="Duración"
              value={`${process.duracion} ${
                process.unidad_de_duracion || "días"
              }`}
            />
          )}
          <InfoRow
            icon="calendar-outline"
            label="Fecha Publicación"
            value={formatDateTime(process.fecha_de_publicacion_del)}
          />
          <InfoRow
            icon="close-circle-outline"
            label="Fecha de Cierre"
            value={formatDateTime(process.fecha_de_recepcion_de)}
            isLast
          />
        </Section>

        {/* Estadísticas */}
        {(process.respuestas_al_procedimiento ||
          process.visualizaciones_del) && (
          <Section title="Estadísticas" icon="stats-chart-outline">
            {process.visualizaciones_del && (
              <InfoRow
                icon="eye-outline"
                label="Visualizaciones"
                value={String(process.visualizaciones_del)}
              />
            )}
            {process.respuestas_al_procedimiento && (
              <InfoRow
                icon="document-attach-outline"
                label="Propuestas recibidas"
                value={String(process.respuestas_al_procedimiento)}
                isLast
              />
            )}
          </Section>
        )}

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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
    },
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
    badgesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    phaseBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    phaseText: {
      fontSize: 11,
      fontWeight: "600",
    },
    procedureName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.accent,
      marginBottom: spacing.lg,
    },
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

    // Botón Analizar con IA
    analyzeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(139, 92, 246, 0.1)",
      borderWidth: 1,
      borderColor: "#8B5CF6",
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    analyzeButtonDisabled: {
      opacity: 0.7,
    },
    analyzeButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#8B5CF6",
    },
    analyzeButtonBadge: {
      backgroundColor: "#8B5CF6",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    analyzeButtonBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    // Sección Análisis IA
    aiSection: {
      marginBottom: spacing.lg,
    },
    aiHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    aiTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    aiTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    aiBadge: {
      backgroundColor: "rgba(139, 92, 246, 0.15)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    aiBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#8B5CF6",
    },
    aiCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    aiCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    aiCardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    aiCardText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    aiList: {
      marginTop: spacing.sm,
    },
    aiListLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: spacing.xs,
    },
    aiListItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      marginBottom: 4,
    },
    aiText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 6,
    },
    aiListText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
    },
    aiDateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    aiDateLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    aiDateValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    aiRecommendation: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    aiRecommendationNumber: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.warningLight,
      color: colors.warning,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 20,
    },
    aiRecommendationText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    priceCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
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
      color: colors.accent,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    sectionContent: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      overflow: "hidden",
    },
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
