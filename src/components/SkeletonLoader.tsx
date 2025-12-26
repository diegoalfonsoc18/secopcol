import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

// ============================================
// SKELETON BASE
// ============================================
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width: w = "100%",
  height = 16,
  borderRadius: br = 4,
  style,
}) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: w,
          height,
          borderRadius: br,
          backgroundColor: colors.backgroundTertiary,
          opacity,
        },
        style,
      ]}
    />
  );
};

// ============================================
// SKELETON PARA PROCESS CARD
// ============================================
export const ProcessCardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton width={60} height={10} />
          <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
        </View>
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>

      {/* Título */}
      <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />

      {/* Descripción */}
      <Skeleton width="100%" height={16} style={{ marginBottom: 6 }} />
      <Skeleton width="75%" height={16} style={{ marginBottom: 16 }} />

      {/* Info rows */}
      <View style={styles.infoRow}>
        <Skeleton width={14} height={14} borderRadius={7} />
        <Skeleton width="60%" height={13} style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.infoRow}>
        <Skeleton width={14} height={14} borderRadius={7} />
        <Skeleton width="45%" height={13} style={{ marginLeft: 8 }} />
      </View>

      {/* Separator */}
      <View
        style={[styles.separator, { backgroundColor: colors.separatorLight }]}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Skeleton width={50} height={10} />
          <Skeleton width={100} height={14} style={{ marginTop: 4 }} />
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Skeleton width={60} height={10} />
          <Skeleton width={80} height={13} style={{ marginTop: 4 }} />
        </View>
      </View>
    </View>
  );
};

// ============================================
// SKELETON PARA STAT CARD
// ============================================
export const StatCardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.backgroundSecondary },
      ]}>
      <Skeleton width={40} height={40} borderRadius={8} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width={80} height={12} />
        <Skeleton width={60} height={22} style={{ marginTop: 4 }} />
        <Skeleton width={50} height={11} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

// ============================================
// SKELETON PARA DASHBOARD COMPLETO
// ============================================
export const DashboardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.dashboardContainer}>
      {/* Stats principales */}
      <View style={styles.statsRow}>
        <StatCardSkeleton />
        <StatCardSkeleton />
      </View>

      {/* Gráfico de barras */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.backgroundSecondary },
        ]}>
        <View style={styles.sectionHeader}>
          <Skeleton width={18} height={18} borderRadius={9} />
          <Skeleton width={100} height={15} style={{ marginLeft: 8 }} />
        </View>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.barRow}>
            <View style={styles.barHeader}>
              <Skeleton width={100} height={13} />
              <Skeleton width={30} height={13} />
            </View>
            <Skeleton width="100%" height={8} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Chips de tipo */}
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.backgroundSecondary },
        ]}>
        <View style={styles.sectionHeader}>
          <Skeleton width={18} height={18} borderRadius={9} />
          <Skeleton width={130} height={15} style={{ marginLeft: 8 }} />
        </View>
        <View style={styles.chipsRow}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={100} height={32} borderRadius={16} />
          ))}
        </View>
      </View>

      {/* Header procesos recientes */}
      <View style={styles.recentHeader}>
        <Skeleton width={150} height={20} />
        <Skeleton width={70} height={14} />
      </View>

      {/* Cards de procesos */}
      {[1, 2, 3].map((i) => (
        <ProcessCardSkeleton key={i} />
      ))}
    </View>
  );
};

// ============================================
// SKELETON PARA LISTA DE BÚSQUEDA
// ============================================
export const SearchResultsSkeleton: React.FC<{ count?: number }> = ({
  count = 5,
}) => {
  return (
    <View style={styles.searchResults}>
      {Array.from({ length: count }).map((_, i) => (
        <ProcessCardSkeleton key={i} />
      ))}
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  separator: {
    height: 1,
    marginVertical: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Stat card
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
  },

  // Dashboard
  dashboardContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionCard: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  barRow: {
    marginBottom: spacing.md,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  // Search
  searchResults: {
    paddingHorizontal: spacing.lg,
  },
});

export default {
  Skeleton,
  ProcessCardSkeleton,
  StatCardSkeleton,
  DashboardSkeleton,
  SearchResultsSkeleton,
};
