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
import { ProcessCard } from "../components/index";
import { SecopProcess, advancedSearch } from "../api/secop";
import { colors, spacing, borderRadius } from "../theme";

// ============================================
// CONSTANTES DE FILTROS
// ============================================
const MODALIDADES = [
  { id: "licitacion", label: "Licitación pública", icon: "megaphone-outline" },
  {
    id: "seleccion_abreviada",
    label: "Selección abreviada",
    icon: "flash-outline",
  },
  {
    id: "contratacion_directa",
    label: "Contratación directa",
    icon: "person-outline",
  },
  { id: "minima_cuantia", label: "Mínima cuantía", icon: "wallet-outline" },
  {
    id: "concurso_meritos",
    label: "Concurso de méritos",
    icon: "trophy-outline",
  },
  { id: "regimen_especial", label: "Régimen especial", icon: "star-outline" },
];

const TIPOS_CONTRATO = [
  { id: "obra", label: "Obra", icon: "construct-outline" },
  { id: "consultoria", label: "Consultoría", icon: "bulb-outline" },
  {
    id: "prestacion_servicios",
    label: "Prestación de servicios",
    icon: "briefcase-outline",
  },
  { id: "suministro", label: "Suministro", icon: "cube-outline" },
  { id: "compraventa", label: "Compraventa", icon: "cart-outline" },
  { id: "interventoria", label: "Interventoría", icon: "eye-outline" },
  { id: "arrendamiento", label: "Arrendamiento", icon: "home-outline" },
];

const FASES = [
  { id: "borrador", label: "Borrador", icon: "document-outline" },
  { id: "seleccion", label: "Selección", icon: "search-outline" },
  { id: "contratacion", label: "Contratación", icon: "document-text-outline" },
  { id: "ejecucion", label: "Ejecución", icon: "play-outline" },
  { id: "terminado", label: "Terminado", icon: "checkmark-circle-outline" },
  { id: "liquidacion", label: "Liquidación", icon: "checkmark-done-outline" },
];

// Mapeo de IDs a valores reales de la API
const MODALIDAD_MAP: Record<string, string> = {
  licitacion: "Licitación pública",
  seleccion_abreviada: "Selección abreviada menor cuantía",
  contratacion_directa: "Contratación directa",
  minima_cuantia: "Mínima cuantía",
  concurso_meritos: "Concurso de méritos abierto",
  regimen_especial: "Contratación régimen especial",
};

const TIPO_CONTRATO_MAP: Record<string, string> = {
  obra: "Obra",
  consultoria: "Consultoría",
  prestacion_servicios: "Prestación de servicios",
  suministro: "Suministro",
  compraventa: "Compraventa",
  interventoria: "Interventoría",
  arrendamiento: "Arrendamiento",
};

const FASE_MAP: Record<string, string> = {
  borrador: "Borrador",
  seleccion: "Selección",
  contratacion: "Contratación",
  ejecucion: "Ejecución",
  terminado: "Terminado",
  liquidacion: "Liquidación",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  // Estados de filtros
  const [keyword, setKeyword] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState("");
  const [selectedTipoContrato, setSelectedTipoContrato] = useState("");
  const [selectedFase, setSelectedFase] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Estados de resultados
  const [processes, setProcesses] = useState<SecopProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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

  // Handlers
  const handleSearch = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await advancedSearch({
        keyword: keyword || undefined,
        modalidad: selectedModalidad
          ? MODALIDAD_MAP[selectedModalidad]
          : undefined,
        tipoContrato: selectedTipoContrato
          ? TIPO_CONTRATO_MAP[selectedTipoContrato]
          : undefined,
        fase: selectedFase ? FASE_MAP[selectedFase] : undefined,
        limit: 50,
      });

      // Filtrar duplicados por id_del_proceso
      const uniqueResults = results.filter(
        (process, index, self) =>
          index ===
          self.findIndex((p) => p.id_del_proceso === process.id_del_proceso)
      );

      setProcesses(uniqueResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPress = (process: SecopProcess) => {
    navigation.navigate("Detail", { process });
  };

  const handleClearFilters = () => {
    setSelectedModalidad("");
    setSelectedTipoContrato("");
    setSelectedFase("");
    setKeyword("");
    setProcesses([]);
    setHasSearched(false);
  };

  const handleClearSearch = () => {
    setKeyword("");
    searchInputRef.current?.focus();
  };

  const toggleFilter = (
    current: string,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(current === value ? "" : value);
  };

  const hasActiveFilters =
    selectedModalidad || selectedTipoContrato || selectedFase || keyword;

  const activeFiltersCount = [
    selectedModalidad,
    selectedTipoContrato,
    selectedFase,
    keyword,
  ].filter(Boolean).length;

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
        <Animated.View style={{ opacity: titleOpacity }}>
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
            <TouchableOpacity onPress={handleClearSearch}>
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
        {/* Sección: Modalidad de Contratación */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="layers-outline" size={18} color={colors.accent} />
            <Text style={styles.sectionLabel}>Modalidad de Contratación</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}>
            {MODALIDADES.map((item) => {
              const isSelected = selectedModalidad === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() =>
                    toggleFilter(
                      selectedModalidad,
                      item.id,
                      setSelectedModalidad
                    )
                  }
                  activeOpacity={0.7}>
                  <Ionicons
                    name={item.icon as any}
                    size={14}
                    color={
                      isSelected
                        ? colors.backgroundSecondary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sección: Tipo de Contrato */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="document-text-outline"
              size={18}
              color={colors.accent}
            />
            <Text style={styles.sectionLabel}>Tipo de Contrato</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}>
            {TIPOS_CONTRATO.map((item) => {
              const isSelected = selectedTipoContrato === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() =>
                    toggleFilter(
                      selectedTipoContrato,
                      item.id,
                      setSelectedTipoContrato
                    )
                  }
                  activeOpacity={0.7}>
                  <Ionicons
                    name={item.icon as any}
                    size={14}
                    color={
                      isSelected
                        ? colors.backgroundSecondary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Sección: Fase del Proceso */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag-outline" size={18} color={colors.accent} />
            <Text style={styles.sectionLabel}>Fase del Proceso</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}>
            {FASES.map((item) => {
              const isSelected = selectedFase === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() =>
                    toggleFilter(selectedFase, item.id, setSelectedFase)
                  }
                  activeOpacity={0.7}>
                  <Ionicons
                    name={item.icon as any}
                    size={14}
                    color={
                      isSelected
                        ? colors.backgroundSecondary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filtros activos */}
        {hasActiveFilters && (
          <View style={styles.activeFiltersSection}>
            <View style={styles.activeFiltersHeader}>
              <Text style={styles.activeFiltersTitle}>
                Filtros activos ({activeFiltersCount})
              </Text>
              <TouchableOpacity onPress={handleClearFilters}>
                <Text style={styles.clearAllText}>Limpiar todos</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botón de búsqueda */}
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

            {processes.map((process, index) => (
              <ProcessCard
                key={`${process.id_del_proceso}-${index}`}
                process={process}
                onPress={() => handleProcessPress(process)}
              />
            ))}
          </View>
        ) : hasSearched && !loading ? (
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
              No se encontraron procesos con los filtros seleccionados
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={handleClearFilters}>
              <Text style={styles.emptyActionText}>Limpiar filtros</Text>
            </TouchableOpacity>
          </View>
        ) : !loading && !hasSearched ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons
                name="options-outline"
                size={48}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>Configura tu búsqueda</Text>
            <Text style={styles.emptyMessage}>
              Selecciona los filtros y presiona buscar para encontrar procesos
              de contratación
            </Text>
          </View>
        ) : null}

        {/* Espacio inferior */}
        <View style={{ height: insets.bottom + 100 }} />
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
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Search
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchContainerFocused: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
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
    paddingTop: spacing.sm,
  },

  // Filter sections
  filterSection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  chipsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  // Chips
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    gap: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.backgroundSecondary,
  },

  // Active filters
  activeFiltersSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  activeFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeFiltersTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  clearAllText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
  },

  // Actions
  actionsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.backgroundSecondary,
  },

  // Error
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.danger,
  },

  // Results
  resultsSection: {
    paddingHorizontal: spacing.lg,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  resultsBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  resultsBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.backgroundSecondary,
  },

  // Empty state
  emptyStateContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
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
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.full,
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
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
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 15,
    color: colors.textSecondary,
  },
});

export default SearchScreen;
