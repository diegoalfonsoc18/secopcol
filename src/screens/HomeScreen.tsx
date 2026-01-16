import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  ProcessCard,
  DashboardSkeleton,
  StaggeredItem,
} from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useHaptics } from "../hooks/useHaptics";
import { useLocation } from "../hooks/useLocation";
import {
  CONTRACT_TYPES,
  getContractTypeColor,
} from "../constants/contractTypes";

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

  // Ubicación del usuario
  const {
    departamento: userDepartamento,
    municipio: userMunicipio,
    nearbyDepartamentos,
  } = useLocation();

  // Estado local para tipos activos
  // Por defecto: los que el usuario eligió en onboarding, o todos si no eligió ninguno
  const [activeTypes, setActiveTypes] = useState<string[]>(() => {
    return CONTRACT_TYPES.map((t) => t.id); // Todos activos
  });

  const styles = createStyles(colors);

  // Filtrar procesos por tipos ACTIVOS Y por ubicación cercana

  // ...
  const normalizeDepartamento = (dept: string): string => {
    return dept
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
      .replace(/DISTRITO CAPITAL DE BOGOTA/g, "BOGOTA")
      .replace(/BOGOTA D\.?C\.?/g, "BOGOTA")
      .trim();
  };

  const filteredProcesses = useMemo(() => {
    if (activeTypes.length === 0) return [];

    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const favoriteTypesSet = new Set(preferences.selectedContractTypes);

    const filtered = processes.filter((process) => {
      // Usar fecha_de_ultima_publicaci en lugar de fecha_de_publicacion
      const dateStr =
        process.fecha_de_ultima_publicaci || process.fecha_de_publicacion_del;
      const processDate = new Date(dateStr || 0);
      if (processDate < cutoffDate) return false;
      return activeTypes.includes(process.tipo_de_contrato || "");
    });

    if (filtered.length === 0) return [];

    const deptDistanceMap = new Map(
      nearbyDepartamentos.map((d) => [
        normalizeDepartamento(d.departamento),
        d.distance,
      ])
    );

    return filtered.sort((a, b) => {
      const aType = a.tipo_de_contrato || "";
      const bType = b.tipo_de_contrato || "";
      const aIsFavorite = favoriteTypesSet.has(aType);
      const bIsFavorite = favoriteTypesSet.has(bType);

      if (aIsFavorite !== bIsFavorite) {
        return aIsFavorite ? -1 : 1;
      }

      if (nearbyDepartamentos.length > 0) {
        const aDept = normalizeDepartamento(a.departamento_entidad || "");
        const bDept = normalizeDepartamento(b.departamento_entidad || "");
        const distA = deptDistanceMap.get(aDept) ?? Infinity;
        const distB = deptDistanceMap.get(bDept) ?? Infinity;
        if (distA !== distB) return distA - distB;
      }

      // También usar la fecha correcta para ordenar
      const dateA = new Date(
        a.fecha_de_ultima_publicaci || a.fecha_de_publicacion_del || 0
      ).getTime();
      const dateB = new Date(
        b.fecha_de_ultima_publicaci || b.fecha_de_publicacion_del || 0
      ).getTime();
      return dateB - dateA;
    });
  }, [
    processes,
    activeTypes,
    nearbyDepartamentos,
    preferences.selectedContractTypes,
  ]);

  useEffect(() => {
    fetchRecentProcesses(100, false);
  }, [fetchRecentProcesses]);

  // Conteo por tipo (de todos los procesos disponibles)
  const porTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let processesForCount = processes.filter((p) => {
      const dateStr = p.fecha_de_ultima_publicaci || p.fecha_de_publicacion_del;
      const processDate = new Date(dateStr || 0);
      return processDate >= cutoffDate;
    });

    // ... resto igual

    // Filtrar por ubicación si existe
    if (nearbyDepartamentos.length > 0) {
      const RADIUS_CLOSE = 80;
      const closeDepts = nearbyDepartamentos
        .filter((d) => d.distance <= RADIUS_CLOSE)
        .map((d) => d.departamento.toUpperCase());

      const closeProcesses = processesForCount.filter((process) => {
        const processDept = process.departamento_entidad?.toUpperCase() || "";
        return closeDepts.some(
          (dept) => processDept.includes(dept) || dept.includes(processDept)
        );
      });

      if (closeProcesses.length > 0) {
        processesForCount = closeProcesses;
      }
    }

    processesForCount.forEach((p) => {
      const tipo = p.tipo_de_contrato || "Otro";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    return counts;
  }, [processes, nearbyDepartamentos]);

  // Handler para toggle de tipo de contrato
  const handleToggleType = useCallback(
    (typeId: string) => {
      haptics.light();

      setActiveTypes((prev) => {
        if (prev.includes(typeId)) {
          return prev.filter((id) => id !== typeId);
        } else {
          return [...prev, typeId];
        }
      });
    },
    [haptics]
  );

  // Handler para activar/desactivar todos
  const handleToggleAll = useCallback(() => {
    haptics.medium();

    if (activeTypes.length === CONTRACT_TYPES.length) {
      setActiveTypes([]);
    } else {
      setActiveTypes(CONTRACT_TYPES.map((t) => t.id));
    }
  }, [haptics, activeTypes]);

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

  const handleViewAll = useCallback(() => {
    haptics.light();
    navigation.navigate("Search");
  }, [navigation, haptics]);

  const renderProcess = useCallback(
    ({ item, index }: { item: SecopProcess; index: number }) => (
      <StaggeredItem index={index} staggerDelay={30}>
        <ProcessCard process={item} onPress={() => handleProcessPress(item)} />
      </StaggeredItem>
    ),
    [handleProcessPress]
  );

  const keyExtractor = useCallback(
    (item: SecopProcess, index: number) => `${item.id_del_proceso}-${index}`,
    []
  );

  const ListHeader = () => {
    const allActive = activeTypes.length === CONTRACT_TYPES.length;
    const someActive =
      activeTypes.length > 0 && activeTypes.length < CONTRACT_TYPES.length;

    return (
      <View style={styles.listHeader}>
        {/* Por Tipo de Contrato */}
        <View style={styles.sectionCard}>
          {/* Header de la sección */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="grid-outline" size={18} color={colors.accent} />
              <Text style={styles.sectionTitle}>Tipo de Contrato</Text>
            </View>

            {/* Botón para seleccionar/deseleccionar todos */}
            <TouchableOpacity
              onPress={handleToggleAll}
              style={[
                styles.toggleAllButton,
                allActive && styles.toggleAllButtonActive,
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={
                  allActive
                    ? "checkmark-circle"
                    : someActive
                    ? "remove-circle-outline"
                    : "ellipse-outline"
                }
                size={14}
                color={allActive ? colors.success : colors.textSecondary}
              />
              <Text
                style={[
                  styles.toggleAllText,
                  allActive && { color: colors.success },
                ]}>
                Todos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid de todos los tipos de contrato */}
          <View style={styles.gridContainer}>
            {CONTRACT_TYPES.map((config) => {
              const typeColor = getContractTypeColor(config, colors);
              const count = porTipo[config.id] || 0;
              const isActive = activeTypes.includes(config.id);

              return (
                <TouchableOpacity
                  key={config.id}
                  style={styles.gridItem}
                  onPress={() => handleToggleType(config.id)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        borderColor: typeColor,
                        backgroundColor: isActive
                          ? typeColor
                          : colors.backgroundSecondary,
                      },
                      !isActive && styles.iconCircleInactive,
                    ]}>
                    {config.CustomIcon ? (
                      <config.CustomIcon
                        size={24}
                        color={isActive ? "#FFF" : typeColor}
                      />
                    ) : (
                      <Ionicons
                        name={(config.icon as any) || "document-text-outline"}
                        size={24}
                        color={isActive ? "#FFF" : typeColor}
                      />
                    )}
                    {/* Badge de conteo */}
                    {count > 0 && (
                      <View
                        style={[
                          styles.badgeFloating,
                          {
                            backgroundColor: isActive ? "#FFF" : typeColor,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.typeChipCount,
                            { color: isActive ? typeColor : "#FFF" },
                          ]}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.gridLabel,
                      {
                        color: isActive
                          ? colors.textPrimary
                          : colors.textTertiary,
                        fontWeight: isActive ? "600" : "500",
                      },
                    ]}
                    numberOfLines={1}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>
            Procesos Recientes
            {filteredProcesses.length > 0 && (
              <Text style={styles.processCount}>
                {" "}
                ({filteredProcesses.length})
              </Text>
            )}
          </Text>
          <TouchableOpacity
            onPress={handleViewAll}
            style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Ver todos</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name={
            activeTypes.length === 0
              ? "filter-outline"
              : "document-text-outline"
          }
          size={48}
          color={colors.textTertiary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTypes.length === 0 ? "Sin filtros activos" : "Sin procesos"}
      </Text>
      <Text style={styles.emptyMessage}>
        {activeTypes.length === 0
          ? "Selecciona al menos un tipo de contrato para ver procesos"
          : "No hay procesos disponibles con los filtros seleccionados"}
      </Text>

      {/* Botón para activar todos los filtros */}
      {activeTypes.length === 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.activateAllButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleToggleAll}>
          <Ionicons name="checkmark-done-outline" size={18} color="#FFF" />
          <Text style={styles.activateAllButtonText}>Activar todos</Text>
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.retryButton,
          pressed && { opacity: 0.8 },
        ]}
        onPress={handleRefresh}>
        <Ionicons name="refresh-outline" size={18} color={colors.accent} />
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Animado */}
      <Animated.View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            height: Animated.add(headerHeight, insets.top),
          },
        ]}>
        <View style={styles.headerRow}>
          <Animated.View
            style={{ transform: [{ scale: titleScale }], flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Inicio</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>SECOP II</Text>
              </View>
            </View>
          </Animated.View>

          {/* Botón de configuración */}
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
                : "Contratación pública"}
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
        <Animated.FlatList
          data={filteredProcesses.slice(0, 10)}
          keyExtractor={keyExtractor}
          renderItem={renderProcess}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
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
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
        />
      )}
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
      justifyContent: "flex-end",
      paddingBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    title: {
      fontSize: 34,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 0.37,
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    liveText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.accent,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 15,
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
      backgroundColor: colors.successLight || "rgba(48, 209, 88, 0.12)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    locationText: {
      fontSize: 12,
      color: colors.success,
      fontWeight: "600",
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    listHeader: {
      marginBottom: spacing.md,
    },
    sectionCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    toggleAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
      backgroundColor: colors.background,
    },
    toggleAllButtonActive: {
      backgroundColor: colors.successLight || "rgba(48, 209, 88, 0.12)",
    },
    toggleAllText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    recentTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    processCount: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textTertiary,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    viewAllText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: "600",
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: spacing.xxl * 2,
      paddingHorizontal: spacing.xl,
    },
    emptyIconContainer: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.backgroundTertiary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    emptyMessage: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    activateAllButton: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: borderRadius.full,
      gap: spacing.sm,
    },
    activateAllButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#FFF",
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.full,
      gap: spacing.sm,
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.accent,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      marginTop: 15,
    },
    gridItem: {
      width: "25%",
      alignItems: "center",
      marginBottom: 20,
    },
    iconCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    iconCircleInactive: {
      opacity: 0.6,
      elevation: 0,
      shadowOpacity: 0,
    },
    gridLabel: {
      fontSize: 10,
      marginTop: 8,
      textAlign: "center",
      fontWeight: "500",
    },
    badgeFloating: {
      position: "absolute",
      top: -5,
      right: -5,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    typeChipCount: {
      fontSize: 10,
      fontWeight: "bold",
    },
    activeFiltersIndicator: {
      alignItems: "center",
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    activeFiltersText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
  });

export default HomeScreen;
