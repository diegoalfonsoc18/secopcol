import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard, DashboardSkeleton, StaggeredItem, ContractTypeSelector, AnimatedPressable, ScaleIn, SlideInRight, ObligationCard } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { useObligationsStore } from "../store/obligationsStore";
import { SecopProcess, advancedSearch } from "../api/secop";
import { getUpcomingObligations } from "../services/obligationService";
import { spacing, borderRadius, scale, shadows } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useHaptics } from "../hooks/useHaptics";
import { useLocation } from "../hooks/useLocation";
import { CONTRACT_TYPES, getContractTypeColor } from "../constants/contractTypes";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { ContractObligation } from "../types/database";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============================================
// OVERLAY DE LISTA DE PROCESOS
// ============================================
interface ProcessListOverlayProps {
  visible: boolean;
  title: string;
  processes: SecopProcess[];
  onClose: () => void;
  onViewProcess: (process: SecopProcess) => void;
  colors: any;
}

const ProcessListOverlay: React.FC<ProcessListOverlayProps> = ({
  visible,
  title,
  processes,
  onClose,
  onViewProcess,
  colors,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!rendered) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.5)", opacity: overlayOpacity },
        ]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          overlayStyles.container,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + spacing.lg,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        {/* Header */}
        <View style={overlayStyles.header}>
          <View style={{ flex: 1 }}>
            <Text
              style={[overlayStyles.title, { color: colors.textPrimary }]}
              numberOfLines={1}>
              {title}
            </Text>
            <Text style={[overlayStyles.subtitle, { color: colors.textSecondary }]}>
              {`${processes.length} proceso${processes.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[overlayStyles.closeButton, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Lista */}
        {processes.length === 0 ? (
          <View style={overlayStyles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={[overlayStyles.title, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Sin resultados
            </Text>
          </View>
        ) : (
          <ScrollView
            style={overlayStyles.list}
            showsVerticalScrollIndicator={false}>
            {processes.map((process, index) => (
              <View key={process.id_del_proceso || index} style={{ marginBottom: spacing.md }}>
                <ProcessCard
                  process={process}
                  onPress={() => onViewProcess(process)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

const overlayStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "85%",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: scale(17),
    fontWeight: "700",
  },
  subtitle: {
    fontSize: scale(12),
    marginTop: 2,
  },
  closeButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: spacing.lg,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: scale(60),
  },
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const haptics = useHaptics();
  const { user, preferences } = useAuth();
  const { processes, loading, fetchRecentProcesses } = useProcessesStore();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const {
    departamento: userDepartamento,
    municipio: userMunicipio,
    nearbyDepartamentos,
  } = useLocation();

  // Estados para las 3 fuentes de datos de las cards
  const [todayNearbyProcesses, setTodayNearbyProcesses] = useState<SecopProcess[]>([]);
  const [openProcesses, setOpenProcesses] = useState<SecopProcess[]>([]);
  const [noOffersProcesses, setNoOffersProcesses] = useState<SecopProcess[]>([]);
  const [upcomingObligations, setUpcomingObligations] = useState<ContractObligation[]>([]);

  // Estado para el modal overlay de cards
  const [cardModal, setCardModal] = useState<{
    visible: boolean;
    title: string;
    processes: SecopProcess[];
  }>({ visible: false, title: "", processes: [] });

  // Cargar obligaciones proximas
  useEffect(() => {
    if (user?.id) {
      getUpcomingObligations(user.id, 30)
        .then((data) => setUpcomingObligations(data.slice(0, 3)))
        .catch(() => setUpcomingObligations([]));
    }
  }, [user?.id]);

  const stats = useDashboardStats(
    todayNearbyProcesses,
    openProcesses,
    noOffersProcesses,
    preferences.selectedContractTypes
  );

  const styles = createStyles(colors);

  // Filtrar procesos por categorías favoritas del usuario
  const filteredProcesses = useMemo(() => {
    if (!preferences.selectedContractTypes.length) return processes;
    const favSet = new Set(preferences.selectedContractTypes);
    return processes.filter(p => favSet.has(p.tipo_de_contrato || ""));
  }, [processes, preferences.selectedContractTypes]);

  // Fetch procesos recientes (feed general)
  useEffect(() => {
    fetchRecentProcesses(100, false);
  }, [fetchRecentProcesses]);

  // Fetch "Hoy + Cerca" (departamentos a ≤20km)
  const fetchTodayNearby = useCallback(() => {
    const nearDepts = nearbyDepartamentos.filter(d => d.distance <= 20);
    if (nearDepts.length === 0) return;

    Promise.all(
      nearDepts.map(d =>
        advancedSearch({
          departamento: d.departamento,
          recentDays: 1,
          limit: 30,
        })
      )
    ).then(results => {
      const merged = results.flat();
      const seen = new Set<string>();
      const unique = merged.filter(p => {
        const id = p.id_del_proceso;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setTodayNearbyProcesses(unique);
    }).catch(() => setTodayNearbyProcesses([]));
  }, [nearbyDepartamentos]);

  useEffect(() => {
    fetchTodayNearby();
  }, [fetchTodayNearby]);

  // Fetch "Abiertos" (fase Selección, cercanos ≤20km, últimos 15 días)
  const fetchOpenProcesses = useCallback(() => {
    const nearDepts = nearbyDepartamentos.filter(d => d.distance <= 20);
    if (nearDepts.length === 0) return;

    Promise.all(
      nearDepts.map(d =>
        advancedSearch({
          departamento: d.departamento,
          fase: "Selección",
          recentDays: 15,
          limit: 50,
        })
      )
    ).then(results => {
      const merged = results.flat();
      const seen = new Set<string>();
      const unique = merged.filter(p => {
        const id = p.id_del_proceso;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setOpenProcesses(unique);
    }).catch(() => setOpenProcesses([]));
  }, [nearbyDepartamentos]);

  useEffect(() => {
    fetchOpenProcesses();
  }, [fetchOpenProcesses]);

  // Fetch "Sin ofertas" (fase Selección + sin respuestas, cercanos ≤20km, últimos 15 días)
  const fetchNoOffersProcesses = useCallback(() => {
    const nearDepts = nearbyDepartamentos.filter(d => d.distance <= 20);
    if (nearDepts.length === 0) return;

    Promise.all(
      nearDepts.map(d =>
        advancedSearch({
          departamento: d.departamento,
          fase: "Selección",
          noOffers: true,
          recentDays: 15,
          limit: 50,
        })
      )
    ).then(results => {
      const merged = results.flat();
      const seen = new Set<string>();
      const unique = merged.filter(p => {
        const id = p.id_del_proceso;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setNoOffersProcesses(unique);
    }).catch(() => setNoOffersProcesses([]));
  }, [nearbyDepartamentos]);

  useEffect(() => {
    fetchNoOffersProcesses();
  }, [fetchNoOffersProcesses]);

  // Animaciones del header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [120, 70],
    extrapolate: "clamp",
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.75],
    extrapolate: "clamp",
  });

  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const handleProcessPress = useCallback(
    (process: SecopProcess) => {
      haptics.light();
      navigation.navigate("Detail", { process });
    },
    [navigation, haptics]
  );

  const handleRefresh = useCallback(async () => {
    haptics.medium();
    await Promise.all([
      fetchRecentProcesses(100, false),
      fetchTodayNearby(),
      fetchOpenProcesses(),
      fetchNoOffersProcesses(),
    ]);
  }, [fetchRecentProcesses, fetchTodayNearby, fetchOpenProcesses, fetchNoOffersProcesses, haptics]);

  const navigateToSearch = useCallback(
    (params?: Record<string, any>) => {
      haptics.light();
      navigation.navigate("Search", {
        screen: "SearchTab",
        params,
      });
    },
    [navigation, haptics]
  );

  const openCardModal = useCallback(
    (title: string, procs: SecopProcess[]) => {
      haptics.light();
      setCardModal({ visible: true, title, processes: procs });
    },
    [haptics]
  );

  // ============================================
  // STATS CARDS
  // ============================================
  const statCards = [
    {
      key: "today",
      icon: "today-outline" as const,
      count: stats.todayNearbyCount,
      label: "Hoy",
      color: "#FF9500",
      bgColor: "rgba(255, 149, 0, 0.12)",
      onPress: () => openCardModal("Publicados hoy", stats.todayNearbyProcesses),
      show: true,
    },
    {
      key: "open",
      icon: "lock-open-outline" as const,
      count: stats.openCount,
      label: "Abiertos",
      color: colors.accent,
      bgColor: colors.accentLight,
      onPress: () => openCardModal("Abiertos", stats.openProcesses),
      show: true,
    },
    {
      key: "noOffers",
      icon: "hand-left-outline" as const,
      count: stats.noOffersCount,
      label: "Sin ofertas",
      color: colors.success,
      bgColor: "rgba(52, 199, 89, 0.12)",
      onPress: () => openCardModal("Sin ofertas", stats.noOffersProcesses),
      show: true,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header Animado */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
          },
        ]}>
        <View style={styles.headerRow}>
          <Animated.View
            style={{ transform: [{ scale: titleScale }], flex: 1 }}>
            <Text style={styles.title}>Inicio</Text>
          </Animated.View>

          <TouchableOpacity
            style={[styles.headerButton, { borderWidth: 1.5, borderColor: colors.accent + "30" }]}
            onPress={() => navigation.navigate("AppSettings")}>
            <Ionicons name="settings-outline" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: subtitleOpacity }}>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              {user?.name
                ? `Hola, ${user.name.split(" ")[0]}`
                : "Contratacion publica"}
            </Text>
            {(userMunicipio || userDepartamento) && (
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={12} color={colors.success} />
                <Text style={styles.locationText}>
                  {userMunicipio || userDepartamento}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>

      {/* Contenido */}
      {loading && processes.length === 0 ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <DashboardSkeleton />
        </ScrollView>
      ) : (
        <Animated.ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }>
          {/* ================================ */}
          {/* SECCION 1: Stats Summary        */}
          {/* ================================ */}
          <View style={styles.statsRow}>
            {statCards
              .filter((s) => s.show)
              .map((card, index) => (
                <ScaleIn key={card.key} delay={index * 80} style={{ flex: 1 }}>
                  <AnimatedPressable
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: card.bgColor,
                      },
                    ]}
                    onPress={card.onPress}
                    scaleValue={0.95}>
                    <Text style={[styles.statCount, { color: card.color }]}>
                      {card.count}
                    </Text>
                    <View style={styles.statCardFooter}>
                      <Ionicons
                        name={card.icon}
                        size={14}
                        color={colors.textTertiary}
                      />
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        {card.label}
                      </Text>
                    </View>
                  </AnimatedPressable>
                </ScaleIn>
              ))}
          </View>

          {/* ================================ */}
          {/* SECCION 2: Categorias favoritas  */}
          {/* ================================ */}
          <View style={styles.sectionSeparator} />
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <TouchableOpacity
              onPress={() => setShowCategorySelector(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.viewAllText}>Editar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}>
            {stats.favoriteTypeConfigs.map((config, index) => {
              const typeColor = getContractTypeColor(config);
              return (
                <SlideInRight key={config.id} delay={index * 60}>
                  <AnimatedPressable
                    style={styles.categoryItem}
                    onPress={() =>
                      navigateToSearch({ tipoContrato: config.id })
                    }
                    scaleValue={0.92}
                    hapticType="selection">
                    <View
                      style={[
                        styles.categoryIconCircle,
                        {
                          backgroundColor: typeColor + "15",
                          borderWidth: 1,
                          borderColor: typeColor + "25",
                        },
                      ]}>
                      {config.CustomIcon && (
                        <config.CustomIcon
                          size={26}
                          color={typeColor}
                        />
                      )}
                    </View>
                    <Text
                      style={[styles.categoryLabel, { color: colors.textPrimary }]}
                      numberOfLines={1}>
                      {config.label}
                    </Text>
                  </AnimatedPressable>
                </SlideInRight>
              );
            })}
          </ScrollView>

          {/* ================================ */}
          {/* SECCION 3: Obligaciones proximas */}
          {/* ================================ */}
          {upcomingObligations.length > 0 && (
            <View style={styles.processSection}>
              <View style={styles.sectionSeparator} />
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="#5856D6"
                  />
                  <Text style={styles.sectionTitle}>Obligaciones</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Obligations")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.viewAllText}>Ver todas</Text>
                </TouchableOpacity>
              </View>

              {upcomingObligations.map((obl, index) => (
                <StaggeredItem key={obl.id} index={index} staggerDelay={30}>
                  <ObligationCard
                    obligation={obl}
                    compact
                    onPress={() => navigation.navigate("Obligations")}
                  />
                </StaggeredItem>
              ))}
            </View>
          )}

          {/* ================================ */}
          {/* SECCION 4: Procesos recientes    */}
          {/* ================================ */}
          {filteredProcesses.length > 0 && (
            <View style={styles.processSection}>
              <View style={styles.sectionSeparator} />
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.accent}
                  />
                  <Text style={styles.sectionTitle}>Recientes</Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigateToSearch()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.viewAllText}>Ver mas</Text>
                </TouchableOpacity>
              </View>

              {filteredProcesses.slice(0, 20).map((process, index) => (
                <StaggeredItem key={process.id_del_proceso} index={index} staggerDelay={30}>
                  <ProcessCard
                    process={process}
                    onPress={() => handleProcessPress(process)}
                  />
                </StaggeredItem>
              ))}
            </View>
          )}

          {/* Estado vacio */}
          {filteredProcesses.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={52}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>Sin procesos destacados</Text>
              <Text style={styles.emptyMessage}>
                No hay procesos nuevos en este momento. Desliza hacia abajo
                para actualizar.
              </Text>
              <AnimatedPressable
                style={[styles.searchButton, { backgroundColor: colors.accent, ...shadows.card }]}
                onPress={() => navigateToSearch()}>
                <Ionicons name="search" size={18} color="#FFF" />
                <Text style={styles.searchButtonText}>Buscar procesos</Text>
              </AnimatedPressable>
            </View>
          )}
        </Animated.ScrollView>
      )}

      {/* Modal overlay para cards */}
      <ProcessListOverlay
        visible={cardModal.visible}
        title={cardModal.title}
        processes={cardModal.processes}
        onClose={() => setCardModal({ visible: false, title: "", processes: [] })}
        onViewProcess={(process) => {
          setCardModal({ visible: false, title: "", processes: [] });
          setTimeout(() => handleProcessPress(process), 300);
        }}
        colors={colors}
      />

      <ContractTypeSelector
        visible={showCategorySelector}
        onClose={() => setShowCategorySelector(false)}
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
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerButton: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: scale(34),
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: scale(15),
      color: colors.textSecondary,
    },
    subtitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.xs,
      gap: spacing.md,
    },
    locationBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(48, 209, 88, 0.12)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    locationText: {
      fontSize: scale(12),
      color: colors.success,
      fontWeight: "600",
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      padding: spacing.md,
      borderRadius: borderRadius.md,
    },
    statCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: spacing.xs,
    },
    statCount: {
      fontSize: scale(32),
      fontWeight: "800",
      letterSpacing: -1,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: scale(12),
      fontWeight: "500",
    },

    // Categories
    categoriesRow: {
      paddingVertical: spacing.sm,
      gap: spacing.lg,
    },
    categoryItem: {
      alignItems: "center",
      width: scale(72),
    },
    categoryIconCircle: {
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    categoryLabel: {
      fontSize: scale(11),
      fontWeight: "600",
      textAlign: "center",
    },

    // Section separators & headers
    sectionSeparator: {
      height: 1,
      backgroundColor: colors.separatorLight,
      marginTop: spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: scale(18),
      fontWeight: "700",
      color: colors.textPrimary,
    },
    viewAllText: {
      fontSize: scale(14),
      color: colors.accent,
      fontWeight: "600",
    },

    // Process sections
    processSection: {
      marginBottom: spacing.md,
    },

    // Empty state
    emptyContainer: {
      alignItems: "center",
      paddingVertical: spacing.xxl * 3,
      paddingHorizontal: spacing.xl,
    },
    emptyIconContainer: {
      width: scale(96),
      height: scale(96),
      borderRadius: scale(48),
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: scale(20),
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    emptyMessage: {
      fontSize: scale(15),
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: scale(22),
      maxWidth: scale(280),
    },
    searchButton: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.full,
      gap: spacing.sm,
    },
    searchButtonText: {
      fontSize: scale(15),
      fontWeight: "600",
      color: "#FFF",
    },
  });

export default HomeScreen;
