import React, { useState, useEffect } from "react";
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
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius, typography, scale } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useHaptics } from "../hooks/useHaptics";
import { FadeIn, SlideInUp } from "../components/Animations";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { ObligationFormModal, ObligationFormData } from "../components/ObligationFormModal";
import { analyzeProcess, AnalysisResult } from "../services/aiAnalysis";
import { getProponentesByProcess, SecopProponente } from "../api/secop";
import { useObligationsStore } from "../store/obligationsStore";
import { useAuth } from "../context/AuthContext";

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

  const { user } = useAuth();
  const { addObligation } = useObligationsStore();

  // Estado para análisis IA
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showObligationForm, setShowObligationForm] = useState(false);
  const [proponentes, setProponentes] = useState<SecopProponente[]>([]);
  const [loadingProponentes, setLoadingProponentes] = useState(true);

  useEffect(() => {
    const fetchProponentes = async () => {
      setLoadingProponentes(true);
      const data = await getProponentesByProcess(process.id_del_proceso);
      setProponentes(data);
      setLoadingProponentes(false);
    };
    fetchProponentes();
  }, [process.id_del_proceso]);

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
            <Ionicons name="sparkles" size={20} color={colors.accent} />
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
          style={styles.backButton}
          accessibilityLabel="Volver"
          accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
          <Text style={styles.backText}>Atrás</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerButton}
            accessibilityLabel="Compartir proceso"
            accessibilityRole="button">
            <Ionicons name="share-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={styles.headerButton}
            accessibilityLabel={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            accessibilityRole="button">
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
              <Text style={styles.idValue}>{process.referencia_del_proceso || process.id_del_proceso}</Text>
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
            <Text style={styles.descriptionLabel}>Descripción</Text>
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
              disabled={analyzing}
              accessibilityLabel={analyzing ? "Analizando proceso" : "Analizar con inteligencia artificial"}
              accessibilityRole="button">
              {analyzing ? (
                <>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={styles.analyzeButtonText}>Analizando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color={colors.accent} />
                  <Text style={styles.analyzeButtonText}>Analizar con IA</Text>
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

        {/* Botón: Agregar Obligación Tributaria */}
        {adjudicado && (
          <SlideInUp delay={120}>
            <AnimatedPressable
              style={styles.obligationButton}
              onPress={() => setShowObligationForm(true)}
              scaleValue={0.97}
              hapticType="medium">
              <Ionicons name="calendar-outline" size={20} color="#5856D6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.obligationButtonTitle}>Agregar obligacion tributaria</Text>
                <Text style={styles.obligationButtonSubtitle}>Estampillas, retenciones, seg. social, informes</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </AnimatedPressable>
          </SlideInUp>
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

        {/* Oferentes / Proponentes */}
        <Section title="Oferentes" icon="people-outline">
          {loadingProponentes ? (
            <View style={styles.proponentesLoading}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.proponentesLoadingText}>Cargando oferentes...</Text>
            </View>
          ) : proponentes.length > 0 ? (
            proponentes.map((prop, index) => (
              <View
                key={`${prop.nit_proveedor}-${index}`}
                style={[
                  styles.proponenteRow,
                  index < proponentes.length - 1 && styles.infoRowBorder,
                ]}>
                <View style={styles.proponentePosition}>
                  <Text style={styles.proponentePositionText}>{index + 1}</Text>
                </View>
                <View style={styles.proponenteInfo}>
                  <Text style={styles.proponenteName} numberOfLines={2}>
                    {prop.proveedor}
                  </Text>
                  {prop.nit_proveedor && (
                    <Text style={styles.proponenteNit}>
                      NIT: {prop.nit_proveedor}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.proponentesEmpty}>
              <Ionicons name="people-outline" size={24} color={colors.textTertiary} />
              <Text style={styles.proponentesEmptyText}>Sin oferentes registrados</Text>
            </View>
          )}
        </Section>

        {/* Botón Ver en SECOP */}
        <TouchableOpacity
          style={styles.secopButton}
          onPress={handleOpenSecop}
          accessibilityLabel="Ver en SECOP II"
          accessibilityRole="link">
          <Ionicons
            name="open-outline"
            size={20}
            color={colors.backgroundSecondary}
          />
          <Text style={styles.secopButtonText}>Ver en SECOP II</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal: Agregar Obligación Tributaria */}
      <ObligationFormModal
        visible={showObligationForm}
        onClose={() => setShowObligationForm(false)}
        processId={process.id_del_proceso}
        processName={process.nombre_del_procedimiento || process.entidad || ""}
        onSubmit={async (data: ObligationFormData) => {
          if (!user?.id) return;
          const { success, error } = await addObligation({
            user_id: user.id,
            process_id: data.process_id || process.id_del_proceso,
            process_name: data.process_name || process.nombre_del_procedimiento || process.entidad || "",
            obligation_type: data.obligation_type,
            title: data.title,
            description: data.description || undefined,
            due_date: data.due_date,
            estimated_amount: data.estimated_amount ? Number(data.estimated_amount) : undefined,
            notes: data.notes || undefined,
          });
          if (!success) {
            Alert.alert("Error", error || "No se pudo crear la obligacion");
          }
        }}
      />
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
      ...typography.headline,
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
      ...typography.caption2,
      fontWeight: "600",
      color: colors.textTertiary,
      letterSpacing: 1,
      marginBottom: spacing.xs,
    },
    idValue: {
      ...typography.callout,
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
      gap: spacing.xs,
    },
    phaseText: {
      ...typography.caption2,
      fontWeight: "600",
    },
    procedureName: {
      ...typography.subhead,
      fontWeight: "600",
      color: colors.accent,
      marginBottom: spacing.lg,
    },
    descriptionCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
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
    descriptionLabel: {
      ...typography.caption1,
      fontWeight: "600",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    descriptionText: {
      ...typography.subhead,
      color: colors.textPrimary,
    },

    // Botón Analizar con IA
    analyzeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.accent,
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
      ...typography.subhead,
      fontWeight: "600",
      color: colors.accent,
    },
    analyzeButtonBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
    },
    analyzeButtonBadgeText: {
      fontSize: scale(10),
      fontWeight: "700",
      color: colors.background,
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
      ...typography.title3,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    aiBadge: {
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    aiBadgeText: {
      ...typography.caption2,
      fontWeight: "600",
      color: colors.accent,
    },
    aiCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
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
    aiCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    aiCardTitle: {
      ...typography.footnote,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    aiCardText: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    aiList: {
      marginTop: spacing.sm,
    },
    aiListLabel: {
      ...typography.caption1,
      fontWeight: "600",
      color: colors.textTertiary,
      marginBottom: spacing.xs,
    },
    aiListItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    aiText: {
      ...typography.footnote,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    aiListText: {
      flex: 1,
      ...typography.footnote,
      color: colors.textSecondary,
    },
    aiDateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    aiDateLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    aiDateValue: {
      ...typography.footnote,
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
      borderRadius: borderRadius.full,
      backgroundColor: colors.warningLight,
      color: colors.warning,
      ...typography.caption1,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 20,
    },
    aiRecommendationText: {
      flex: 1,
      ...typography.footnote,
      color: colors.textSecondary,
    },

    priceCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
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
    priceHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    priceLabel: {
      ...typography.footnote,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    priceValue: {
      ...typography.title1,
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
      ...typography.title3,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    sectionContent: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      overflow: "hidden",
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
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: spacing.md,
    },
    infoRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separatorLight,
    },
    infoIconContainer: {
      width: scale(36),
      height: scale(36),
      borderRadius: borderRadius.full,
      backgroundColor: colors.accentLight,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginBottom: 2,
    },
    infoValue: {
      ...typography.subhead,
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
      ...typography.callout,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
    obligationButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(88, 86, 214, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(88, 86, 214, 0.2)",
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    obligationButtonTitle: {
      ...typography.subhead,
      fontWeight: "600",
      color: "#5856D6",
    },
    obligationButtonSubtitle: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 2,
    },
    // Proponentes
    proponenteRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
    },
    proponentePosition: {
      width: scale(28),
      height: scale(28),
      borderRadius: scale(14),
      backgroundColor: colors.accentLight,
      justifyContent: "center",
      alignItems: "center",
      marginRight: spacing.md,
    },
    proponentePositionText: {
      ...typography.caption1,
      fontWeight: "700",
      color: colors.accent,
    },
    proponenteInfo: {
      flex: 1,
    },
    proponenteName: {
      ...typography.subhead,
      color: colors.textPrimary,
    },
    proponenteNit: {
      ...typography.caption1,
      color: colors.textTertiary,
      marginTop: 2,
    },
    proponentesLoading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      gap: spacing.sm,
    },
    proponentesLoadingText: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    proponentesEmpty: {
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      gap: spacing.sm,
    },
    proponentesEmptyText: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
  });

export default DetailScreen;
