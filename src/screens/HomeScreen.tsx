import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard, DashboardSkeleton, StaggeredItem, ContractTypeSelector, AnimatedPressable, ScaleIn, ObligationCard, GlassWrapper } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess, advancedSearch, getAdvancedCount } from "../api/secop";
import { getUpcomingObligations } from "../services/obligationService";
import { spacing, borderRadius, scale, shadows } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useHaptics } from "../hooks/useHaptics";
import { useLocation } from "../hooks/useLocation";
import { CONTRACT_TYPES, ContractTypeConfig, getContractTypeColor } from "../constants/contractTypes";
import { ContractObligation } from "../types/database";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============================================
// OVERLAY DE LISTA DE PROCESOS
// ============================================
interface ProcessListOverlayProps {
  visible: boolean;
  title: string;
  processes: SecopProcess[];
  totalCount?: number;
  onClose: () => void;
  onViewProcess: (process: SecopProcess) => void;
  onViewMore?: () => void;
  colors: any;
}

const ProcessListOverlay: React.FC<ProcessListOverlayProps> = ({
  visible,
  title,
  processes,
  totalCount,
  onClose,
  onViewProcess,
  onViewMore,
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
      {/* Backdrop con blur */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: overlayOpacity },
        ]}>
        <GlassWrapper
          variant="overlay"
          style={StyleSheet.absoluteFill}
          fallbackColor="rgba(0,0,0,0.5)"
          blurIntensity={30}
          blurTint="dark"
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </GlassWrapper>
      </Animated.View>

      {/* Panel con glass */}
      <Animated.View
        style={[
          overlayStyles.container,
          {
            paddingBottom: insets.bottom + spacing.lg,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        {/* Glass background */}
        <GlassWrapper
          variant="regular"
          style={{
            ...StyleSheet.absoluteFillObject,
            borderTopLeftRadius: borderRadius.xl,
            borderTopRightRadius: borderRadius.xl,
          }}
          fallbackColor={colors.background}
        />
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
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.lg }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled>
            {processes.map((process, index) => (
              <View key={`${process.id_del_proceso}-${index}`} style={{ marginBottom: spacing.md }}>
                <ProcessCard
                  process={process}
                  onPress={() => onViewProcess(process)}
                />
              </View>
            ))}
            {totalCount != null && totalCount > processes.length && onViewMore && (
              <TouchableOpacity
                onPress={() => { onClose(); setTimeout(onViewMore, 300); }}
                style={{
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: borderRadius.lg,
                  backgroundColor: colors.accent + "15",
                  alignItems: "center",
                  marginTop: spacing.sm,
                  marginBottom: spacing.lg,
                }}>
                <Text style={{ color: colors.accent, fontWeight: "600", fontSize: scale(14) }}>
                  Ver los {totalCount.toLocaleString()} en Búsqueda
                </Text>
              </TouchableOpacity>
            )}
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
  const { colors, isDark } = useTheme();
  const haptics = useHaptics();
  const { user, preferences } = useAuth();
  useProcessesStore(); // mantener store inicializado
  const scrollY = useRef(new Animated.Value(0)).current;
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  const {
    departamento: userDepartamento,
    municipio: userMunicipio,
    nearbyDepartamentos,
  } = useLocation();

  // Procesos recientes (fuente para sección)
  const [recentProcesses, setRecentProcesses] = useState<SecopProcess[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  // Conteos stat cards
  const [closingCount, setClosingCount] = useState(0);
  const [noOffersCount, setNoOffersCount] = useState(0);
  const [newTodayCount, setNewTodayCount] = useState(0);
  const [upcomingObligations, setUpcomingObligations] = useState<ContractObligation[]>([]);

  // Estado para el modal overlay de cards
  const [cardModal, setCardModal] = useState<{
    visible: boolean;
    title: string;
    processes: SecopProcess[];
    totalCount?: number;
    searchParams?: Record<string, any>;
  }>({ visible: false, title: "", processes: [] });

  // Cargar obligaciones proximas
  useEffect(() => {
    if (user?.id) {
      getUpcomingObligations(user.id, 30)
        .then((data) => setUpcomingObligations(data.slice(0, 3)))
        .catch(() => setUpcomingObligations([]));
    }
  }, [user?.id]);

  // Configs de tipos favoritos para la sección de categorías
  const favoriteTypeConfigs = useMemo(() => {
    if (preferences.selectedContractTypes.length > 0) {
      return preferences.selectedContractTypes
        .map(id => CONTRACT_TYPES.find(t => t.id === id))
        .filter(Boolean) as ContractTypeConfig[];
    }
    return CONTRACT_TYPES;
  }, [preferences.selectedContractTypes]);

  const styles = createStyles(colors);

  // Departamentos: primero el del usuario, luego cercanos (≤30km)
  const cardDepts = useMemo(() => {
    const depts: string[] = [];
    if (userDepartamento) depts.push(userDepartamento);
    for (const d of nearbyDepartamentos) {
      if (d.distance <= 30 && d.departamento !== userDepartamento) {
        depts.push(d.departamento);
      }
    }
    return depts;
  }, [nearbyDepartamentos, userDepartamento]);

  // Priorizar: más cercano al usuario primero (según orden de cardDepts)
  const filteredProcesses = useMemo(() => {
    const deptPriority = new Map<string, number>();
    cardDepts.forEach((dept, i) => {
      deptPriority.set(dept.toUpperCase(), cardDepts.length - i);
    });
    return [...recentProcesses].sort((a, b) => {
      const aPri = deptPriority.get((a.departamento_entidad || "").toUpperCase()) || 0;
      const bPri = deptPriority.get((b.departamento_entidad || "").toUpperCase()) || 0;
      if (bPri !== aPri) return bPri - aPri;
      const dateA = a.fecha_de_ultima_publicaci || a.fecha_de_publicacion_del || "";
      const dateB = b.fecha_de_ultima_publicaci || b.fecha_de_publicacion_del || "";
      return dateB.localeCompare(dateA);
    });
  }, [recentProcesses, cardDepts]);

  // Fetch único: recientes por depto + tipos (fuente para cards + sección)
  const selectedTypes = preferences.selectedContractTypes;
  const fetchRecentForHome = useCallback(async () => {
    if (cardDepts.length === 0) return;
    setRecentLoading(true);
    try {
      const promises = cardDepts.map(dept =>
        advancedSearch({
          departamento: dept,
          estadoApertura: "Abierto",
          limit: 50,
          ...(selectedTypes.length > 0 && { tipoContrato: selectedTypes }),
        })
      );
      const results = await Promise.all(promises);
      const allResults = results.flat();

      // Dedup por id_del_proceso (como SearchScreen)
      const seen = new Set<string>();
      const unique = allResults.filter(p => {
        const id = p.id_del_proceso;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      // Ordenar por fecha más reciente (como SearchScreen)
      unique.sort((a, b) => {
        const dateA = a.fecha_de_ultima_publicaci || a.fecha_de_publicacion_del || "";
        const dateB = b.fecha_de_ultima_publicaci || b.fecha_de_publicacion_del || "";
        return dateB.localeCompare(dateA);
      });

      setRecentProcesses(unique.slice(0, 50));
    } catch {
      setRecentProcesses([]);
    } finally {
      setRecentLoading(false);
    }
  }, [cardDepts, selectedTypes]);

  useEffect(() => {
    fetchRecentForHome();
  }, [fetchRecentForHome]);

  // Conteos stat cards: cierran hoy + sin ofertas que cierran hoy (paralelo, eficiente)
  const fetchStatCounts = useCallback(async () => {
    const baseParams = {
      closingWithinDays: 0,
      estadoApertura: "Abierto" as const,
      ...(selectedTypes.length > 0 && { tipoContrato: selectedTypes }),
    };
    const typesParam = selectedTypes.length > 0 ? { tipoContrato: selectedTypes } : {};
    try {
      const [closing, noOffers, newToday] = await Promise.all([
        getAdvancedCount(baseParams),
        getAdvancedCount({ closingWithinDays: 3, estadoApertura: "Abierto", noOffers: true, ...typesParam }),
        getAdvancedCount({ recentDays: 7, ...typesParam }),
      ]);
      setClosingCount(closing);
      setNoOffersCount(noOffers);
      setNewTodayCount(newToday);
    } catch {
      setClosingCount(0);
      setNoOffersCount(0);
      setNewTodayCount(0);
    }
  }, [selectedTypes]);

  useEffect(() => {
    fetchStatCounts();
  }, [fetchStatCounts]);

  // Animaciones del header
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
    await Promise.all([fetchRecentForHome(), fetchStatCounts()]);
  }, [fetchRecentForHome, fetchStatCounts, haptics]);

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
    (title: string, procs: SecopProcess[], totalCount?: number, searchParams?: Record<string, any>) => {
      haptics.light();
      setCardModal({ visible: true, title, processes: procs, totalCount, searchParams });
    },
    [haptics]
  );

  // ============================================
  // STATS CARDS
  // ============================================
  const statCards = [
    {
      key: "newWeek",
      icon: "calendar-outline" as const,
      count: newTodayCount,
      label: "Esta semana",
      color: "#FF9500",
      bgColor: "rgba(255, 149, 0, 0.12)",
      onPress: async () => {
        const results = await advancedSearch({
          recentDays: 7,
          ...(selectedTypes.length > 0 && { tipoContrato: selectedTypes }),
          limit: 100,
        });
        openCardModal("Nuevos esta semana", results, newTodayCount, { recentDays: 7 });
      },
      show: true,
    },
    {
      key: "closing",
      icon: "timer-outline" as const,
      count: closingCount,
      label: "Cierran hoy",
      color: colors.danger,
      bgColor: "rgba(255, 59, 48, 0.12)",
      onPress: async () => {
        const results = await advancedSearch({
          closingWithinDays: 0,
          estadoApertura: "Abierto",
          ...(selectedTypes.length > 0 && { tipoContrato: selectedTypes }),
          limit: 100,
        });
        openCardModal("Cierran hoy", results, closingCount, { closingWithinDays: 0, estadoApertura: "Abierto" });
      },
      show: true,
    },
    {
      key: "noOffers",
      icon: "hand-left-outline" as const,
      count: noOffersCount,
      label: "Sin ofertas",
      color: colors.success,
      bgColor: "rgba(52, 199, 89, 0.12)",
      onPress: async () => {
        const results = await advancedSearch({
          closingWithinDays: 3,
          estadoApertura: "Abierto",
          noOffers: true,
          ...(selectedTypes.length > 0 && { tipoContrato: selectedTypes }),
          limit: 100,
        });
        openCardModal("Sin ofertas · Cierran en 3 días", results, noOffersCount, { closingWithinDays: 3, estadoApertura: "Abierto", noOffers: true });
      },
      show: true,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.accent }]}>
              <Text style={styles.avatarInitial}>
                {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Animated.Text style={[styles.greeting, { opacity: subtitleOpacity }]}>
              {user?.name
                ? `Hola, ${user.name.split(" ")[0]}`
                : "Bienvenido"}
            </Animated.Text>
            {(userMunicipio || userDepartamento) && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color={colors.accent} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {userMunicipio || userDepartamento}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => navigation.navigate("AppSettings")}>
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido */}
      {recentLoading && recentProcesses.length === 0 ? (
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
              refreshing={recentLoading}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }>
          {/* ================================ */}
          {/* SECCION 1: Stats Summary         */}
          {/* ================================ */}
          <View style={styles.statsRow}>
            {statCards
              .filter((s) => s.show)
              .map((card, index) => (
                <ScaleIn key={card.key} delay={index * 80} style={{ flex: 1 }}>
                  <AnimatedPressable
                    style={styles.statCard}
                    onPress={card.onPress}
                    scaleValue={0.95}>
                    <View style={[styles.statIconCircle, { backgroundColor: card.bgColor }]}>
                      <Ionicons name={card.icon} size={18} color={card.color} />
                    </View>
                    <Text style={[styles.statCount, { color: colors.textPrimary }]}>
                      {card.count}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {card.label}
                    </Text>
                  </AnimatedPressable>
                </ScaleIn>
              ))}
          </View>

          {/* ================================ */}
          {/* SECCION 2: Categorías            */}
          {/* ================================ */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorías</Text>
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
            {favoriteTypeConfigs.map((type) => {
              const typeColor = getContractTypeColor(type);
              return (
                <AnimatedPressable
                  key={type.id}
                  style={[styles.categoryChip, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() =>
                    navigateToSearch({ tipoContrato: type.label })
                  }>
                  <type.CustomIcon size={16} color={typeColor} />
                  <Text
                    style={[styles.categoryChipLabel, { color: colors.textPrimary }]}
                    numberOfLines={1}>
                    {type.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          {/* ================================ */}
          {/* SECCION 3: Procesos recientes    */}
          {/* ================================ */}
          {filteredProcesses.length > 0 && (
            <View style={styles.processSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recientes</Text>
                <TouchableOpacity
                  onPress={() => navigateToSearch()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.viewAllText}>Ver mas</Text>
                </TouchableOpacity>
              </View>

              {filteredProcesses.slice(0, 30).map((process, index) => (
                <StaggeredItem key={`${process.id_del_proceso}-${index}`} index={index} staggerDelay={30}>
                  <ProcessCard
                    process={process}
                    onPress={() => handleProcessPress(process)}
                  />
                </StaggeredItem>
              ))}
            </View>
          )}

          {/* ================================ */}
          {/* SECCION 4: Obligaciones proximas */}
          {/* ================================ */}
          {upcomingObligations.length > 0 && (
            <View style={styles.processSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Obligaciones</Text>
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
        totalCount={cardModal.totalCount}
        onClose={() => setCardModal({ visible: false, title: "", processes: [] })}
        onViewProcess={(process) => {
          setCardModal({ visible: false, title: "", processes: [] });
          setTimeout(() => handleProcessPress(process), 300);
        }}
        onViewMore={cardModal.searchParams ? () => navigateToSearch(cardModal.searchParams) : undefined}
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
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    avatar: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
    },
    avatarFallback: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      justifyContent: "center",
      alignItems: "center",
    },
    avatarInitial: {
      fontSize: scale(17),
      fontWeight: "700",
      color: "#FFFFFF",
    },
    headerButton: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      justifyContent: "center",
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    greeting: {
      fontSize: scale(14),
      color: colors.textSecondary,
      fontWeight: "500",
      marginBottom: scale(2),
    },
    title: {
      fontSize: scale(28),
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: -0.5,
      lineHeight: scale(34),
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 2,
    },
    locationText: {
      fontSize: scale(12),
      color: colors.accent,
      fontWeight: "500",
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#4A6741",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    statIconCircle: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    statCount: {
      fontSize: scale(24),
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: scale(11),
      fontWeight: "500",
      textAlign: "center",
    },

    // Categories
    categoriesRow: {
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    categoryChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.sm,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    categoryChipLabel: {
      fontSize: scale(13),
      fontWeight: "600",
    },

    // Section headers
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: scale(20),
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
      paddingHorizontal: spacing.xl,
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
