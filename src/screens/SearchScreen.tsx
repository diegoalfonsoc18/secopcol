import React, { useState, useRef, useCallback } from "react";
import {
  Animated,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MunicipalityFilter, ProcessCard } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";
import { colors, spacing, borderRadius } from "../theme";

// ============================================
// ESTADOS DE PROCESO
// ============================================
const PROCESS_STATUSES = [
  { id: "publicado", label: "Publicado", icon: "document-text-outline" },
  { id: "adjudicado", label: "Adjudicado", icon: "checkmark-circle-outline" },
  { id: "cerrado", label: "Cerrado", icon: "lock-closed-outline" },
  { id: "evaluacion", label: "En Evaluación", icon: "time-outline" },
  { id: "cancelado", label: "Cancelado", icon: "close-circle-outline" },
  { id: "suspendido", label: "Suspendido", icon: "pause-circle-outline" },
  { id: "desierto", label: "Desierto", icon: "remove-circle-outline" },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    processes,
    loading,
    error,
    fetchProcesses,
    selectedMunicipality,
    selectedStatus,
    setSelectedMunicipality,
    setSelectedStatus,
  } = useProcessesStore();

  const [keyword, setKeyword] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animaciones del header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [100, 60],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -10],
    extrapolate: "clamp",
  });

  // Handlers
  const handleSearch = async () => {
    Keyboard.dismiss();
    await fetchProcesses(selectedMunicipality, selectedStatus, keyword);
  };

  const handleProcessPress = (process: SecopProcess) => {
    navigation.navigate("Detail", { process });
  };

  const handleClearFilters = () => {
    setSelectedMunicipality("");
    setSelectedStatus("");
    setKeyword("");
  };

  const handleClearSearch = () => {
    setKeyword("");
    searchInputRef.current?.focus();
  };

  const handleStatusSelect = (statusLabel: string) => {
    setSelectedStatus(selectedStatus === statusLabel ? "" : statusLabel);
  };

  const hasActiveFilters = selectedMunicipality || selectedStatus || keyword;

  // Render del proceso
  const renderProcess = useCallback(
    ({ item }: { item: SecopProcess }) => (
      <ProcessCard process={item} onPress={() => handleProcessPress(item)} />
    ),
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
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}>
          <Text style={styles.title}>Buscar</Text>
          <Text style={styles.subtitle}>Procesos de contratación</Text>
        </Animated.View>
      </Animated.View>

      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused,
          ]}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Buscar por palabra clave..."
            placeholderTextColor={colors.textTertiary}
            value={keyword}
            onChangeText={setKeyword}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <View style={styles.clearButton}>
                <Ionicons
                  name="close"
                  size={12}
                  color={colors.backgroundSecondary}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenido scrolleable */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled">
        {/* Sección: Municipio */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>Municipio</Text>
          <MunicipalityFilter
            selected={selectedMunicipality}
            onSelect={setSelectedMunicipality}
          />
          {selectedMunicipality && (
            <View style={styles.selectedChip}>
              <Ionicons name="location" size={14} color={colors.accent} />
              <Text style={styles.selectedChipText}>
                {selectedMunicipality}
              </Text>
              <TouchableOpacity onPress={() => setSelectedMunicipality("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sección: Estado */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>Estado del proceso</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusScrollContent}>
            {PROCESS_STATUSES.map((status) => {
              const isSelected = selectedStatus === status.label;
              return (
                <TouchableOpacity
                  key={status.id}
                  style={[
                    styles.statusChip,
                    isSelected && styles.statusChipSelected,
                  ]}
                  onPress={() => handleStatusSelect(status.label)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={status.icon as any}
                    size={14}
                    color={
                      isSelected
                        ? colors.backgroundSecondary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.statusChipText,
                      isSelected && styles.statusChipTextSelected,
                    ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsSection}>
          <Pressable
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.searchButtonPressed,
            ]}
            onPress={handleSearch}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator
                color={colors.backgroundSecondary}
                size="small"
              />
            ) : (
              <>
                <Ionicons
                  name="search"
                  size={18}
                  color={colors.backgroundSecondary}
                />
                <Text style={styles.searchButtonText}>Buscar procesos</Text>
              </>
            )}
          </Pressable>

          {hasActiveFilters && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={handleClearFilters}>
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.accent}
              />
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
            </View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Resultados */}
        {processes.length > 0 ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Resultados</Text>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>{processes.length}</Text>
              </View>
            </View>

            {processes.map((process) => (
              <ProcessCard
                key={process.id_del_proceso}
                process={process}
                onPress={() => handleProcessPress(process)}
              />
            ))}
          </View>
        ) : hasActiveFilters && !loading ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyMessage}>
              No se encontraron procesos con los filtros aplicados
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={handleClearFilters}>
              <Text style={styles.emptyActionText}>Ajustar filtros</Text>
            </TouchableOpacity>
          </View>
        ) : !loading ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="documents-outline"
                size={48}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>Comienza tu búsqueda</Text>
            <Text style={styles.emptyMessage}>
              Selecciona filtros y presiona buscar para encontrar procesos
            </Text>
          </View>
        ) : null}

        {/* Espacio inferior */}
        <View style={{ height: insets.bottom + 40 }} />
      </Animated.ScrollView>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Buscando procesos...</Text>
          </View>
        </View>
      )}
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
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Search
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    height: 36,
  },
  searchContainerFocused: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: colors.textPrimary,
    padding: 0,
  },
  clearButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textTertiary,
    justifyContent: "center",
    alignItems: "center",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },

  // Filter sections
  filterSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  selectedChipText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "500",
  },

  // Status chips
  statusScrollContent: {
    gap: spacing.sm,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusChipSelected: {
    backgroundColor: colors.accent,
  },
  statusChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  statusChipTextSelected: {
    color: colors.backgroundSecondary,
  },

  // Actions
  actionsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  searchButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.backgroundSecondary,
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  clearFiltersText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: "500",
  },

  // Error
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  errorIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.danger,
    fontWeight: "500",
  },

  // Results
  resultsSection: {
    paddingHorizontal: spacing.lg,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  resultsBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  resultsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.backgroundSecondary,
  },

  // Empty state
  emptyStateContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  emptyAction: {
    marginTop: spacing.lg,
  },
  emptyActionText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: "600",
  },

  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});

export default SearchScreen;
