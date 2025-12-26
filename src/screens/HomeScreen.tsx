import React, { useEffect, useRef, useCallback, useMemo } from "react";
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
  TopEntidades,
} from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";

// ============================================
// UTILIDADES
// ============================================
const formatCurrency = (value: number): string => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { processes, loading, fetchRecentProcesses } = useProcessesStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Configuraciones que dependen del tema
  const phaseConfig: Record<string, { color: string; icon: string }> = {
    Borrador: { color: colors.textSecondary, icon: "document-outline" },
    Planeación: { color: colors.warning, icon: "clipboard-outline" },
    Selección: { color: colors.accent, icon: "search-outline" },
    Contratación: { color: "#5856D6", icon: "document-text-outline" },
    Ejecución: { color: colors.success, icon: "play-circle-outline" },
    Liquidación: { color: "#FF9500", icon: "checkmark-done-outline" },
    Terminado: { color: "#8E8E93", icon: "checkmark-circle-outline" },
    Cancelado: { color: colors.danger, icon: "close-circle-outline" },
    Publicado: { color: colors.accent, icon: "megaphone-outline" },
  };

  const tipoContratoConfig: Record<string, { color: string; icon: string }> = {
    Obra: { color: "#FF9500", icon: "construct-outline" },
    Consultoría: { color: "#5856D6", icon: "bulb-outline" },
    "Prestación de servicios": {
      color: colors.accent,
      icon: "briefcase-outline",
    },
    Suministro: { color: colors.success, icon: "cube-outline" },
    Compraventa: { color: "#FF2D55", icon: "cart-outline" },
    Interventoría: { color: "#AF52DE", icon: "eye-outline" },
  };

  const styles = createStyles(colors);

  useEffect(() => {
    fetchRecentProcesses(50);
  }, []);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalProcesos = processes.length;

    const valorTotal = processes.reduce((sum, p) => {
      const precio =
        typeof p.precio_base === "string"
          ? parseFloat(p.precio_base) || 0
          : p.precio_base || 0;
      return sum + precio;
    }, 0);

    const porFase: Record<string, number> = {};
    processes.forEach((p) => {
      const fase = p.fase || p.estado_del_procedimiento || "Otro";
      porFase[fase] = (porFase[fase] || 0) + 1;
    });

    const porTipo: Record<string, number> = {};
    processes.forEach((p) => {
      const tipo = p.tipo_de_contrato || "Otro";
      porTipo[tipo] = (porTipo[tipo] || 0) + 1;
    });

    return { totalProcesos, valorTotal, porFase, porTipo };
  }, [processes]);

  // Animaciones del header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [110, 60],
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
      navigation.navigate("Detail", { process });
    },
    [navigation]
  );

  const handleRefresh = useCallback(async () => {
    await fetchRecentProcesses(50);
  }, [fetchRecentProcesses]);

  const handleViewAll = useCallback(() => {
    navigation.navigate("Search");
  }, [navigation]);

  // Componentes de estadísticas
  const StatCard: React.FC<{
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View
        style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const PhaseBar: React.FC<{
    phase: string;
    count: number;
    total: number;
    color: string;
    icon: string;
  }> = ({ phase, count, total, color, icon }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
      <View style={styles.barContainer}>
        <View style={styles.barHeader}>
          <View style={styles.barLabelContainer}>
            <Ionicons name={icon as any} size={14} color={color} />
            <Text style={styles.barLabel}>{phase}</Text>
          </View>
          <Text style={styles.barCount}>{count}</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(percentage, 2)}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    );
  };

  // Header del listado con estadísticas
  const ListHeader = () => (
    <View style={styles.listHeader}>
      {/* Stats principales */}
      <View style={styles.mainStats}>
        <StatCard
          title="Total Procesos"
          value={stats.totalProcesos.toString()}
          subtitle="Cargados"
          icon="documents-outline"
          color={colors.accent}
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(stats.valorTotal)}
          subtitle="Precio base"
          icon="cash-outline"
          color={colors.success}
        />
      </View>

      {/* Distribución por fase */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.accent} />
          <Text style={styles.sectionTitle}>Por Estado</Text>
        </View>
        <View style={styles.phaseBars}>
          {Object.entries(stats.porFase)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([fase, count]) => (
              <PhaseBar
                key={fase}
                phase={fase}
                count={count}
                total={stats.totalProcesos}
                color={phaseConfig[fase]?.color || colors.textSecondary}
                icon={phaseConfig[fase]?.icon || "help-circle-outline"}
              />
            ))}
        </View>
      </View>

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
          {Object.entries(stats.porTipo)
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

      {/* Top Entidades */}
      <TopEntidades processes={processes} limit={5} />

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
        No hay procesos disponibles en este momento
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.retryButton,
          pressed && styles.retryButtonPressed,
        ]}
        onPress={handleRefresh}>
        <Ionicons name="refresh-outline" size={18} color={colors.accent} />
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </Pressable>
    </View>
  );

  // Render item
  const renderProcess = useCallback(
    ({ item }: { item: SecopProcess }) => (
      <ProcessCard process={item} onPress={() => handleProcessPress(item)} />
    ),
    [handleProcessPress]
  );

  const keyExtractor = useCallback(
    (item: SecopProcess, index: number) => `${item.id_del_proceso}-${index}`,
    []
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
              <Text style={styles.title}>Dashboard</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>SECOP II</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate("Settings")}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.accent}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate("AppSettings")}>
              <Ionicons
                name="settings-outline"
                size={22}
                color={colors.accent}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Contratación pública en Colombia
        </Animated.Text>
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
          data={processes.slice(0, 10)}
          keyExtractor={keyExtractor}
          renderItem={renderProcess}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          ListHeaderComponent={processes.length > 0 ? ListHeader : null}
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
// ESTILOS DINÁMICOS
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
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
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

    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingCard: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.xl,
      borderRadius: borderRadius.lg,
      alignItems: "center",
      gap: spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    loadingText: {
      fontSize: 15,
      color: colors.textSecondary,
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

    // Stat cards
    mainStats: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderLeftWidth: 4,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    statContent: {
      flex: 1,
    },
    statTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 22,
      fontWeight: "700",
      marginTop: 2,
    },
    statSubtitle: {
      fontSize: 11,
      color: colors.textTertiary,
      marginTop: 2,
    },

    // Section cards
    sectionCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
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
    phaseBars: {
      gap: spacing.sm,
    },

    // Phase bars
    barContainer: {
      marginBottom: spacing.md,
    },
    barHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    barLabelContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    barLabel: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    barCount: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    barTrack: {
      height: 8,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 4,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 4,
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
      paddingVertical: spacing.xxl * 3,
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
    retryButtonPressed: {
      opacity: 0.8,
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.accent,
    },
  });

export default HomeScreen;
