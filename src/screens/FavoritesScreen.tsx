import React, { useRef, useCallback } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { colors, spacing, borderRadius } from "../theme";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const FavoritesScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { favorites, removeFavorite } = useProcessesStore();
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -8],
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

  const handleRemoveFavorite = useCallback(
    (process: SecopProcess) => {
      Alert.alert(
        "Eliminar favorito",
        `¿Deseas eliminar "${process.descripci_n_del_procedimiento?.substring(
          0,
          50
        )}..." de tus favoritos?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => removeFavorite(process.id_del_proceso),
          },
        ]
      );
    },
    [removeFavorite]
  );

  // Render item con swipe action
  const renderFavorite = useCallback(
    ({ item, index }: { item: SecopProcess; index: number }) => (
      <Animated.View
        style={[
          styles.favoriteItem,
          {
            opacity: scrollY.interpolate({
              inputRange: [-50, 0],
              outputRange: [0.5, 1],
              extrapolate: "clamp",
            }),
          },
        ]}>
        <ProcessCard process={item} onPress={() => handleProcessPress(item)} />

        {/* Botón de eliminar */}
        <Pressable
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}
          onPress={() => handleRemoveFavorite(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name="heart-dislike-outline"
            size={14}
            color={colors.danger}
          />
          <Text style={styles.removeButtonText}>Quitar de favoritos</Text>
        </Pressable>
      </Animated.View>
    ),
    [handleProcessPress, handleRemoveFavorite, scrollY]
  );

  const keyExtractor = useCallback(
    (item: SecopProcess) => item.id_del_proceso,
    []
  );

  // Header del listado
  const ListHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.infoCard}>
        <View style={styles.infoIconContainer}>
          <Ionicons name="bookmark" size={20} color={colors.accent} />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>
            {favorites.length}{" "}
            {favorites.length === 1 ? "proceso guardado" : "procesos guardados"}
          </Text>
          <Text style={styles.infoSubtitle}>
            Accede rápidamente a los procesos que te interesan
          </Text>
        </View>
      </View>
    </View>
  );

  // Empty state
  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="heart-outline" size={48} color={colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>Sin favoritos</Text>
      <Text style={styles.emptyMessage}>
        Guarda procesos para acceder a ellos rápidamente desde aquí
      </Text>

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={18} color={colors.warning} />
        <Text style={styles.tipText}>
          Presiona el ícono de corazón en cualquier proceso para guardarlo
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.exploreButton,
          pressed && styles.exploreButtonPressed,
        ]}
        onPress={() => navigation.navigate("Search")}>
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.backgroundSecondary}
        />
        <Text style={styles.exploreButtonText}>Explorar procesos</Text>
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
        <Animated.View
          style={{
            transform: [{ scale: titleScale }, { translateY: titleTranslateY }],
            transformOrigin: "left center",
          }}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Favoritos</Text>
            {favorites.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{favorites.length}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Procesos guardados
        </Animated.Text>
      </Animated.View>

      {/* Lista de favoritos */}
      <Animated.FlatList
        data={favorites}
        keyExtractor={keyExtractor}
        renderItem={renderFavorite}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.xxl },
          favorites.length === 0 && styles.listContentEmpty,
        ]}
        ListHeaderComponent={favorites.length > 0 ? ListHeader : null}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        // Optimizaciones
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
      />
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
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
  countBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 28,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.backgroundSecondary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  listContentEmpty: {
    flex: 1,
  },
  listHeader: {
    marginBottom: spacing.lg,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  infoSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Favorite item
  favoriteItem: {
    marginBottom: spacing.lg,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  removeButtonPressed: {
    opacity: 0.6,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: spacing.xl,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  exploreButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  exploreButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.backgroundSecondary,
  },
});

export default FavoritesScreen;
