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
  ContractTypeSelector,
} from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useHaptics } from "../hooks/useHaptics";
import { useLocation } from "../hooks/useLocation";

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

  // Estado para el modal de tipos de contrato
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const styles = createStyles(colors);

  const tipoContratoConfig: Record<string, { color: string; icon: string }> = {
    Obra: { color: colors.warning, icon: "construct-outline" },
    Consultoría: { color: "#5856D6", icon: "bulb-outline" },
    "Prestación de servicios": {
      color: colors.accent,
      icon: "briefcase-outline",
    },
    Suministro: { color: colors.success, icon: "cube-outline" },
    Compraventa: { color: colors.danger, icon: "cart-outline" },
    Interventoría: { color: "#AF52DE", icon: "eye-outline" },
    Arrendamiento: { color: colors.success, icon: "home-outline" },
    Concesión: { color: colors.warning, icon: "key-outline" },
  };

  // Filtrar procesos por tipo de contrato Y por ubicación cercana
  const filteredProcesses = useMemo(() => {
    let filtered: SecopProcess[] = [...processes];

    // Filtrar por tipos de contrato seleccionados
    if (preferences.selectedContractTypes.length > 0) {
      filtered = filtered.filter((process) =>
        preferences.selectedContractTypes.includes(
          process.tipo_de_contrato || ""
        )
      );
      console.log("después de filtro por tipo:", filtered.length);
      console.log("selectedContractTypes:", preferences.selectedContractTypes);
    }

    // Si no hay ubicación, retornar filtrados solo por tipo
    if (nearbyDepartamentos.length === 0) {
      return filtered;
    }

    // Filtrar por departamentos cercanos (priorizar 80km, luego expandir)
    const RADIUS_CLOSE = 80; // km

    // Departamentos dentro de 80km
    const closeDepts = nearbyDepartamentos
      .filter((d) => d.distance <= RADIUS_CLOSE)
      .map((d) => d.departamento.toUpperCase());

    // Filtrar por departamentos cercanos (80km)
    const closeProcesses = filtered.filter((process) => {
      const processDept = process.departamento_entidad?.toUpperCase() || "";
      return closeDepts.some(
        (dept) => processDept.includes(dept) || dept.includes(processDept)
      );
    });

    // Si hay procesos cercanos, retornarlos
    if (closeProcesses.length > 0) {
      return closeProcesses;
    }

    // Si no hay cercanos, buscar en todos los departamentos disponibles
    const allNearbyDepts = nearbyDepartamentos.map((d) =>
      d.departamento.toUpperCase()
    );

    const expandedProcesses = filtered.filter((process) => {
      const processDept = process.departamento_entidad?.toUpperCase() || "";
      return allNearbyDepts.some(
        (dept) => processDept.includes(dept) || dept.includes(processDept)
      );
    });

    // Si hay procesos en el rango expandido, retornarlos
    if (expandedProcesses.length > 0) {
      return expandedProcesses;
    }

    // Si no hay nada, retornar todos los filtrados por tipo (sin filtro de ubicación)
    return filtered;
  }, [processes, preferences.selectedContractTypes, nearbyDepartamentos]);

  useEffect(() => {
    fetchRecentProcesses(100, false, preferences.selectedContractTypes);
  }, [fetchRecentProcesses, preferences.selectedContractTypes]);

  const porTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProcesses.forEach((p) => {
      const tipo = p.tipo_de_contrato || "Otro";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return counts;
  }, [filteredProcesses]);

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
    await fetchRecentProcesses(100);
  }, [fetchRecentProcesses, haptics]);

  const handleViewAll = useCallback(() => {
    haptics.light();
    navigation.navigate("Search");
  }, [navigation, haptics]);

  // Handler para abrir el selector de tipos
  const handleOpenTypeSelector = useCallback(() => {
    haptics.light();
    setShowTypeSelector(true);
  }, [haptics]);

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

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Por Tipo de Contrato */}
      <View style={styles.sectionCard}>
        {/* Header de la sección con botón de editar */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="grid-outline" size={18} color={colors.accent} />
            <Text style={styles.sectionTitle}>Por Tipo de Contrato</Text>
          </View>
          {/* Botón para editar tipos de contrato */}
          <TouchableOpacity
            onPress={handleOpenTypeSelector}
            style={styles.editButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="pencil" size={14} color={colors.accent} />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Chips de tipos de contrato */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeChips}>
          {Object.entries(porTipo)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tipo, count]) => {
              const config = tipoContratoConfig[tipo] || {
                color: colors.textSecondary,
                icon: "help-outline",
              };
              return (
                <View
                  key={tipo}
                  style={[styles.typeChip, { borderColor: config.color }]}>
                  <Ionicons
                    name={config.icon as any}
                    size={14}
                    color={config.color}
                  />
                  <Text style={styles.typeChipLabel} numberOfLines={1}>
                    {tipo}
                  </Text>
                  <View
                    style={[
                      styles.typeChipBadge,
                      { backgroundColor: config.color },
                    ]}>
                    <Text style={styles.typeChipCount}>{count}</Text>
                  </View>
                </View>
              );
            })}

          {/* Chip para agregar más tipos si no hay ninguno o pocos */}
          {preferences.selectedContractTypes.length === 0 && (
            <TouchableOpacity
              style={styles.addTypeChip}
              onPress={handleOpenTypeSelector}>
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={styles.addTypeChipText}>Filtrar tipos</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Procesos Recientes</Text>
        <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name="document-text-outline"
          size={48}
          color={colors.textTertiary}
        />
      </View>
      <Text style={styles.emptyTitle}>Sin procesos</Text>
      <Text style={styles.emptyMessage}>
        No hay procesos disponibles con los filtros seleccionados
      </Text>

      {/* Botón para cambiar filtros cuando está vacío */}
      {preferences.selectedContractTypes.length > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.changeFiltersButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleOpenTypeSelector}>
          <Ionicons name="options-outline" size={18} color={colors.accent} />
          <Text style={styles.changeFiltersButtonText}>Cambiar filtros</Text>
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

          {/* Solo botón de configuración de la app */}
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
      {loading && filteredProcesses.length === 0 ? (
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
          ListHeaderComponent={filteredProcesses.length > 0 ? ListHeader : null}
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

      {/* Modal para seleccionar tipos de contrato */}
      <ContractTypeSelector
        visible={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
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
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    editButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.accent,
    },
    typeChips: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    typeChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
      borderWidth: 1,
    },
    typeChipLabel: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: "500",
      maxWidth: 100,
    },
    typeChipBadge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
      minWidth: 20,
      alignItems: "center",
    },
    typeChipCount: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.backgroundSecondary,
    },
    addTypeChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.accent,
      borderStyle: "dashed",
    },
    addTypeChipText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: "600",
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
    changeFiltersButton: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.full,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    changeFiltersButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.accent,
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
  });

export default HomeScreen;
