import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard, DashboardSkeleton, StaggeredItem, ContractTypeSelector } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess, advancedSearch } from "../api/secop";
import { spacing, borderRadius, scale } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useHaptics } from "../hooks/useHaptics";
import { useLocation } from "../hooks/useLocation";
import { CONTRACT_TYPES, getContractTypeColor } from "../constants/contractTypes";
import { useDashboardStats } from "../hooks/useDashboardStats";

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
  } = useLocation();

  const [nearbyProcesses, setNearbyProcesses] = useState<SecopProcess[]>([]);

  const stats = useDashboardStats(
    processes,
    nearbyProcesses,
    preferences.selectedContractTypes
  );

  const styles = createStyles(colors);

  useEffect(() => {
    fetchRecentProcesses(100, false);
  }, [fetchRecentProcesses]);

  // Fetch procesos del municipio del usuario
  useEffect(() => {
    if (!userMunicipio) return;
    advancedSearch({ municipio: userMunicipio, limit: 50 })
      .then(setNearbyProcesses)
      .catch(() => setNearbyProcesses([]));
  }, [userMunicipio]);

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
    await fetchRecentProcesses(100, false);
  }, [fetchRecentProcesses, haptics]);

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

  // ============================================
  // STATS CARDS
  // ============================================
  const statCards = [
    {
      key: "recent",
      icon: "calendar-outline" as const,
      count: stats.recentCount,
      label: "Recientes",
      color: colors.accent,
      bgColor: colors.accentLight,
      onPress: () => navigateToSearch(),
      show: true,
    },
    {
      key: "nearby",
      icon: "location-outline" as const,
      count: stats.nearbyCount,
      label: "Cerca de ti",
      color: colors.success,
      bgColor: "rgba(52, 199, 89, 0.12)",
      onPress: () =>
        navigateToSearch({ departamento: userDepartamento }),
      show: !!userMunicipio,
    },
    {
      key: "favorites",
      icon: "bookmark-outline" as const,
      count: stats.favoriteTypesCount,
      label: "Tus tipos",
      color: "#FF9500",
      bgColor: "rgba(255, 149, 0, 0.12)",
      onPress: () =>
        navigateToSearch({ tipos: preferences.selectedContractTypes }),
      show: preferences.selectedContractTypes.length > 0,
    },
  ];

  const hasLocation = !!userMunicipio;

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
            style={styles.headerButton}
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
              .map((card) => (
                <TouchableOpacity
                  key={card.key}
                  style={[styles.statCard, { backgroundColor: card.bgColor }]}
                  onPress={card.onPress}
                  activeOpacity={0.7}>
                  <View style={styles.statCardHeader}>
                    <View
                      style={[
                        styles.statIconCircle,
                        { backgroundColor: card.color + "20" },
                      ]}>
                      <Ionicons
                        name={card.icon}
                        size={18}
                        color={card.color}
                      />
                    </View>
                  </View>
                  <Text style={[styles.statCount, { color: card.color }]}>
                    {card.count}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {card.label}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          {/* ================================ */}
          {/* SECCION 2: Categorias favoritas  */}
          {/* ================================ */}
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
            {stats.favoriteTypeConfigs.map((config) => (
              <TouchableOpacity
                key={config.id}
                style={styles.categoryItem}
                onPress={() =>
                  navigateToSearch({ tipoContrato: config.id })
                }
                activeOpacity={0.7}>
                <View style={styles.categoryIconCircle}>
                  {config.CustomIcon && (
                    <config.CustomIcon
                      size={26}
                      color={getContractTypeColor(config)}
                    />
                  )}
                </View>
                <Text
                  style={[styles.categoryLabel, { color: colors.textPrimary }]}
                  numberOfLines={1}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ================================ */}
          {/* SECCION 3: Procesos destacados   */}
          {/* ================================ */}

          {/* Sub-seccion: Cerca de ti */}
          {hasLocation && stats.nearbyProcesses.length > 0 && (
            <View style={styles.processSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.success}
                  />
                  <Text style={styles.sectionTitle}>
                    {userMunicipio || "Cerca de ti"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigateToSearch({ municipio: userMunicipio })
                  }
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.viewAllText}>Ver mas</Text>
                </TouchableOpacity>
              </View>

              {stats.nearbyProcesses.map((process, index) => (
                <StaggeredItem key={process.id_del_proceso} index={index} staggerDelay={30}>
                  <ProcessCard
                    process={process}
                    onPress={() => handleProcessPress(process)}
                  />
                </StaggeredItem>
              ))}
            </View>
          )}

          {/* Sub-seccion: Recientes */}
          {stats.recentProcesses.length > 0 && (
            <View style={styles.processSection}>
              {stats.recentProcesses.map((process, index) => (
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
          {stats.recentProcesses.length === 0 &&
            stats.nearbyProcesses.length === 0 && (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                </View>
                <Text style={styles.emptyTitle}>Sin procesos destacados</Text>
                <Text style={styles.emptyMessage}>
                  No hay procesos nuevos en este momento. Desliza hacia abajo
                  para actualizar.
                </Text>
                <TouchableOpacity
                  style={[styles.searchButton, { backgroundColor: colors.accent }]}
                  onPress={() => navigateToSearch()}>
                  <Ionicons name="search" size={18} color="#FFF" />
                  <Text style={styles.searchButtonText}>Buscar procesos</Text>
                </TouchableOpacity>
              </View>
            )}
        </Animated.ScrollView>
      )}
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
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: scale(34),
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 0.37,
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
    statCardHeader: {
      marginBottom: spacing.sm,
    },
    statIconCircle: {
      width: scale(36),
      height: scale(36),
      borderRadius: scale(18),
      justifyContent: "center",
      alignItems: "center",
    },
    statCount: {
      fontSize: scale(28),
      fontWeight: "700",
      marginBottom: 2,
    },
    statLabel: {
      fontSize: scale(13),
      fontWeight: "500",
    },

    // Categories
    categoriesRow: {
      paddingVertical: spacing.sm,
      gap: spacing.lg,
    },
    categoryItem: {
      alignItems: "center",
      width: scale(70),
    },
    categoryIconCircle: {
      width: scale(52),
      height: scale(52),
      borderRadius: scale(26),
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    categoryLabel: {
      fontSize: scale(11),
      fontWeight: "500",
      textAlign: "center",
    },

    // Section headers
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.lg,
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
      paddingVertical: spacing.xxl * 2,
      paddingHorizontal: spacing.xl,
    },
    emptyIconContainer: {
      width: scale(88),
      height: scale(88),
      borderRadius: scale(44),
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: scale(20),
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    emptyMessage: {
      fontSize: scale(15),
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: scale(22),
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
