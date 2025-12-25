import React, { useState, useRef, useMemo } from "react";
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
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard } from "../components/index";
import { SecopProcess, advancedSearch } from "../api/secop";
import { colors, spacing, borderRadius } from "../theme";
import {
  COLOMBIAN_DEPARTMENTS,
  MUNICIPALITIES_BY_DEPARTMENT,
} from "../types/index";

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
// COMPONENTE DE SELECTOR MODAL
// ============================================
interface SelectorModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
}

const SelectorModal: React.FC<SelectorModalProps> = ({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  searchable = true,
}) => {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [options, searchText]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearchText("");
    onClose();
  };

  const handleClear = () => {
    onSelect("");
    setSearchText("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View style={[modalStyles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
            <Text style={modalStyles.closeText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>{title}</Text>
          <TouchableOpacity
            onPress={handleClear}
            style={modalStyles.clearButton}>
            <Text style={modalStyles.clearText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        {searchable && (
          <View style={modalStyles.searchContainer}>
            <Ionicons name="search" size={18} color={colors.textTertiary} />
            <TextInput
              style={modalStyles.searchInput}
              placeholder="Buscar..."
              placeholderTextColor={colors.textTertiary}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Lista */}
        <FlatList
          data={filteredOptions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = item === selectedValue;
            return (
              <TouchableOpacity
                style={[
                  modalStyles.option,
                  isSelected && modalStyles.optionSelected,
                ]}
                onPress={() => handleSelect(item)}>
                <Text
                  style={[
                    modalStyles.optionText,
                    isSelected && modalStyles.optionTextSelected,
                  ]}>
                  {item}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={() => (
            <View style={modalStyles.emptyContainer}>
              <Text style={modalStyles.emptyText}>
                No se encontraron resultados
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
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
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState("");
  const [selectedTipoContrato, setSelectedTipoContrato] = useState("");
  const [selectedFase, setSelectedFase] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Estados de modales
  const [showDepartamentoModal, setShowDepartamentoModal] = useState(false);
  const [showMunicipioModal, setShowMunicipioModal] = useState(false);

  // Estados de resultados
  const [processes, setProcesses] = useState<SecopProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Municipios filtrados por departamento
  const availableMunicipios = useMemo(() => {
    if (!selectedDepartamento) return [];
    return MUNICIPALITIES_BY_DEPARTMENT[selectedDepartamento] || [];
  }, [selectedDepartamento]);

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
        departamento: selectedDepartamento || undefined,
        municipio: selectedMunicipio || undefined,
        modalidad: selectedModalidad
          ? MODALIDAD_MAP[selectedModalidad]
          : undefined,
        tipoContrato: selectedTipoContrato
          ? TIPO_CONTRATO_MAP[selectedTipoContrato]
          : undefined,
        fase: selectedFase ? FASE_MAP[selectedFase] : undefined,
        limit: 50,
      });

      // Filtrar duplicados
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
    setSelectedDepartamento("");
    setSelectedMunicipio("");
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

  const handleDepartamentoSelect = (value: string) => {
    setSelectedDepartamento(value);
    // Limpiar municipio si cambia el departamento
    if (value !== selectedDepartamento) {
      setSelectedMunicipio("");
    }
  };

  const toggleFilter = (
    current: string,
    value: string,
    setter: (v: string) => void
  ) => {
    setter(current === value ? "" : value);
  };

  const hasActiveFilters =
    selectedDepartamento ||
    selectedMunicipio ||
    selectedModalidad ||
    selectedTipoContrato ||
    selectedFase ||
    keyword;

  const activeFiltersCount = [
    selectedDepartamento,
    selectedMunicipio,
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
        {/* Sección: Ubicación */}
        <View style={styles.filterSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={colors.accent} />
            <Text style={styles.sectionLabel}>Ubicación</Text>
          </View>

          <View style={styles.locationSelectors}>
            {/* Selector de Departamento */}
            <TouchableOpacity
              style={[
                styles.locationSelector,
                selectedDepartamento && styles.locationSelectorActive,
              ]}
              onPress={() => setShowDepartamentoModal(true)}>
              <Ionicons
                name="map-outline"
                size={18}
                color={
                  selectedDepartamento ? colors.accent : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.locationSelectorText,
                  selectedDepartamento && styles.locationSelectorTextActive,
                ]}
                numberOfLines={1}>
                {selectedDepartamento || "Departamento"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={
                  selectedDepartamento ? colors.accent : colors.textTertiary
                }
              />
            </TouchableOpacity>

            {/* Selector de Municipio */}
            <TouchableOpacity
              style={[
                styles.locationSelector,
                selectedMunicipio && styles.locationSelectorActive,
                !selectedDepartamento && styles.locationSelectorDisabled,
              ]}
              onPress={() =>
                selectedDepartamento && setShowMunicipioModal(true)
              }
              disabled={!selectedDepartamento}>
              <Ionicons
                name="business-outline"
                size={18}
                color={
                  !selectedDepartamento
                    ? colors.textTertiary
                    : selectedMunicipio
                    ? colors.accent
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.locationSelectorText,
                  selectedMunicipio && styles.locationSelectorTextActive,
                  !selectedDepartamento && styles.locationSelectorTextDisabled,
                ]}
                numberOfLines={1}>
                {selectedMunicipio || "Municipio"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={
                  !selectedDepartamento
                    ? colors.textTertiary
                    : selectedMunicipio
                    ? colors.accent
                    : colors.textTertiary
                }
              />
            </TouchableOpacity>
          </View>

          {/* Chips de ubicación seleccionada */}
          {(selectedDepartamento || selectedMunicipio) && (
            <View style={styles.selectedLocationChips}>
              {selectedDepartamento && (
                <View style={styles.selectedChip}>
                  <Ionicons name="map" size={12} color={colors.accent} />
                  <Text style={styles.selectedChipText}>
                    {selectedDepartamento}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDepartamento("");
                      setSelectedMunicipio("");
                    }}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              )}
              {selectedMunicipio && (
                <View style={styles.selectedChip}>
                  <Ionicons name="business" size={12} color={colors.accent} />
                  <Text style={styles.selectedChipText}>
                    {selectedMunicipio}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedMunicipio("")}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

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

      {/* Modales */}
      <SelectorModal
        visible={showDepartamentoModal}
        onClose={() => setShowDepartamentoModal(false)}
        title="Seleccionar Departamento"
        options={[...COLOMBIAN_DEPARTMENTS]}
        selectedValue={selectedDepartamento}
        onSelect={handleDepartamentoSelect}
      />

      <SelectorModal
        visible={showMunicipioModal}
        onClose={() => setShowMunicipioModal(false)}
        title="Seleccionar Municipio"
        options={availableMunicipios}
        selectedValue={selectedMunicipio}
        onSelect={setSelectedMunicipio}
      />
    </View>
  );
};

// ============================================
// ESTILOS DEL MODAL
// ============================================
const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.separatorLight,
    backgroundColor: colors.backgroundSecondary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    fontSize: 16,
    color: colors.accent,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  clearButton: {
    padding: spacing.sm,
  },
  clearText: {
    fontSize: 16,
    color: colors.danger,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundTertiary,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    height: 40,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
  },
  optionSelected: {
    backgroundColor: colors.accentLight,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: colors.separatorLight,
    marginLeft: spacing.lg,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: colors.textTertiary,
  },
});

// ============================================
// ESTILOS PRINCIPALES
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

  // Location selectors
  locationSelectors: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  locationSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationSelectorActive: {
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  locationSelectorDisabled: {
    opacity: 0.5,
  },
  locationSelectorText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  locationSelectorTextActive: {
    color: colors.accent,
    fontWeight: "600",
  },
  locationSelectorTextDisabled: {
    color: colors.textTertiary,
  },
  selectedLocationChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  selectedChipText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "500",
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
