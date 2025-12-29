import React, { useEffect, useRef, useCallback, useMemo } from "react";
import {
  Animated,
  FlatList,
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

  const styles = createStyles(colors);

  // Configuración de tipos de contrato (usando colores del theme)
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
  };

  // Filtrar procesos por tipos de contrato seleccionados
  const filteredProcesses = useMemo(() => {
    if (preferences.selectedContractTypes.length === 0) {
      return processes;
    }
    return processes.filter((process) =>
      preferences.selectedContractTypes.includes(process.tipo_de_contrato || "")
    );
  }, [processes, preferences.selectedContractTypes]);

  useEffect(() => {
    fetchRecentProcesses(100);
  }, [fetchRecentProcesses]);

  // Contar por tipo de contrato
  const porTipo = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProcesses.forEach((p) => {
      const tipo = p.tipo_de_contrato || "Otro";
      counts[tipo] = (counts[tipo] || 0) + 1;
    });
    return counts;
  }, [filteredProcesses]);

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

  // Handlers
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

  // Header del listado
  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Distribución por tipo */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="grid-outline" size={18} color={colors.accent} />
          <Text style={styles.sectionTitle}>Por Tipo de Contrato</Text>
        </View>
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
        </ScrollView>
      </View>

      {/* Header de procesos recientes */}
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Procesos Recientes</Text>
        <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Empty state
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

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate("Settings")}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.accent}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate("AppSettings")}>
              <Ionicons
                name="settings-outline"
                size={22}
                color={colors.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View style={{ opacity: subtitleOpacity }}>
          <Text style={styles.subtitle}>
            {user?.name
              ? `Hola, ${user.name.split(" ")[0]}`
              : "Contratación pública"}
          </Text>
          {preferences.selectedContractTypes.length > 0 && (
            <View style={styles.filterBadge}>
              <Ionicons name="filter" size={12} color={colors.accent} />
              <Text style={styles.filterBadgeText}>
                {preferences.selectedContractTypes.length} tipo
                {preferences.selectedContractTypes.length > 1 ? "s" : ""} de
                contrato
              </Text>
            </View>
          )}
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
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      justifyContent: "flex-end",
      paddingBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerButtons: {
      flexDirection: "row",
      gap: spacing.sm,
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
      marginTop: spacing.xs,
    },
    filterBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      alignSelf: "flex-start",
      marginTop: spacing.xs,
      gap: spacing.xs,
    },
    filterBadgeText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: "500",
    },

    // List
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    listHeader: {
      marginBottom: spacing.md,
    },

    // Section
    sectionCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    // Type chips
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

    // Recent header
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

    // Empty state
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
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.xl,
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
