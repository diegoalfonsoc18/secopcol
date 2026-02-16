import React, { useRef, useCallback, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import { ProcessCard, StaggeredItem } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { spacing, borderRadius, scale } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { exportFavorites } from "../services/exportService";
import { useHaptics } from "../hooks/useHaptics";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const FavoritesScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const haptics = useHaptics();
  const { favorites, removeFavorite } = useProcessesStore();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [exporting, setExporting] = useState(false);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const styles = createStyles(colors);

  // Handler de exportación
  const handleExport = async () => {
    if (favorites.length === 0) {
      Alert.alert("Sin datos", "No hay favoritos para exportar");
      return;
    }

    haptics.light();
    setExporting(true);
    try {
      await exportFavorites(favorites);
      haptics.success();
    } catch (err) {
      haptics.error();
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "No se pudo exportar"
      );
    } finally {
      setExporting(false);
    }
  };

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
      haptics.light();
      navigation.navigate("Detail", { process });
    },
    [navigation, haptics]
  );

  const handleRemoveFavorite = useCallback(
    (process: SecopProcess) => {
      // Haptic feedback
      haptics.warning();

      // Cerrar el swipeable
      const swipeable = swipeableRefs.current.get(process.id_del_proceso);
      if (swipeable) {
        swipeable.close();
      }

      // Eliminar después de un pequeño delay para la animación
      setTimeout(() => {
        removeFavorite(process.id_del_proceso);
      }, 200);
    },
    [removeFavorite, haptics]
  );

  // Render del botón de eliminar (swipe right)
  const createRightActions = useCallback(
    (process: SecopProcess) => {
      const RightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
      ) => {
        const scale = dragX.interpolate({
          inputRange: [-100, 0],
          outputRange: [1, 0.8],
          extrapolate: "clamp",
        });

        const opacity = dragX.interpolate({
          inputRange: [-100, -50, 0],
          outputRange: [1, 0.8, 0],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            style={[
              styles.deleteAction,
              {
                transform: [{ scale }],
                opacity,
              },
            ]}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveFavorite(process)}>
              <Ionicons
                name="trash-outline"
                size={24}
                color={colors.backgroundSecondary}
              />
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      };
      return RightActions;
    },
    [handleRemoveFavorite, styles, colors.backgroundSecondary]
  );

  // Render item con swipe
  const renderFavorite = useCallback(
    ({ item, index }: { item: SecopProcess; index: number }) => (
      <StaggeredItem index={index} staggerDelay={40}>
        <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(item.id_del_proceso, ref);
            }
          }}
          renderRightActions={createRightActions(item)}
          rightThreshold={40}
          overshootRight={false}
          friction={2}>
          <View style={styles.favoriteItem}>
            <ProcessCard
              process={item}
              onPress={() => handleProcessPress(item)}
            />
          </View>
        </Swipeable>
      </StaggeredItem>
    ),
    [handleProcessPress, createRightActions, styles]
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
            Desliza hacia la izquierda para eliminar
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
        <View style={styles.headerRow}>
          <Animated.View
            style={{
              flex: 1,
              transform: [{ scale: titleScale }],
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

          {/* Botón exportar */}
          {favorites.length > 0 && (
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExport}
              disabled={exporting}>
              {exporting ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={22}
                  color={colors.accent}
                />
              )}
            </TouchableOpacity>
          )}
        </View>

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
          { paddingBottom: insets.bottom + 100 },
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
        removeClippedSubviews={false}
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
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    title: {
      fontSize: scale(34),
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 0.37,
    },
    exportButton: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    countBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      minWidth: scale(28),
      alignItems: "center",
    },
    countBadgeText: {
      fontSize: scale(14),
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
    subtitle: {
      fontSize: scale(15),
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
      width: scale(40),
      height: scale(40),
      borderRadius: borderRadius.sm,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: scale(15),
      fontWeight: "600",
      color: colors.textPrimary,
    },
    infoSubtitle: {
      fontSize: scale(13),
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },

    // Favorite item
    favoriteItem: {
      backgroundColor: colors.background,
      marginBottom: spacing.md,
    },

    // Delete action
    deleteAction: {
      justifyContent: "center",
      alignItems: "flex-end",
      marginBottom: spacing.md,
    },
    deleteButton: {
      backgroundColor: colors.danger,
      justifyContent: "center",
      alignItems: "center",
      width: scale(90),
      height: "100%",
      borderRadius: borderRadius.md,
    },
    deleteText: {
      color: colors.backgroundSecondary,
      fontSize: scale(12),
      fontWeight: "600",
      marginTop: 4,
    },

    // Empty state
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    emptyIconContainer: {
      width: scale(88),
      height: scale(88),
      borderRadius: scale(44),
      backgroundColor: colors.backgroundTertiary,
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
      fontSize: scale(13),
      color: colors.textSecondary,
      lineHeight: scale(18),
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
      fontSize: scale(15),
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
  });

export default FavoritesScreen;
