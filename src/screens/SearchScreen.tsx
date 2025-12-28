import React, { useState, useEffect } from "react";
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard, SearchResultsSkeleton } from "../components/index";
import { SecopProcess, advancedSearch } from "../api/secop";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { exportSearchResults } from "../services/exportService";
import { useFiltersStore, SavedFilter } from "../store/filtersStore";
import { getDepartments, getMunicipalities } from "../services/divipola";
import type { ThemeColors } from "../theme/index";
// ============================================
// FILTROS
// ============================================
const MODALIDADES = [
  { id: "licitacion", label: "Licitación", value: "Licitación pública" },
  { id: "directa", label: "Directa", value: "Contratación directa" },
  { id: "minima", label: "Mínima cuantía", value: "Mínima cuantía" },
  {
    id: "abreviada",
    label: "Abreviada",
    value: "Selección abreviada menor cuantía",
  },
  { id: "concurso", label: "Concurso", value: "Concurso de méritos abierto" },
  {
    id: "especial",
    label: "Régimen especial",
    value: "Contratación régimen especial",
  },
];

const TIPOS = [
  { id: "obra", label: "Obra", value: "Obra" },
  { id: "servicios", label: "Servicios", value: "Prestación de servicios" },
  { id: "suministro", label: "Suministro", value: "Suministro" },
  { id: "consultoria", label: "Consultoría", value: "Consultoría" },
  { id: "compraventa", label: "Compraventa", value: "Compraventa" },
  { id: "interventoria", label: "Interventoría", value: "Interventoría" },
  { id: "arrendamiento", label: "Arrendamiento", value: "Arrendamiento" },
  { id: "concesion", label: "Concesión", value: "Concesión" },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SearchScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { savedFilters, addFilter, removeFilter } = useFiltersStore();

  const styles = createStyles(colors);

  // Estados DIVIPOLA
  const [departments, setDepartments] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingMunis, setLoadingMunis] = useState(false);

  // Estados de filtros
  const [keyword, setKeyword] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");

  // Estados de modales
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showMuniModal, setShowMuniModal] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [deptSearchText, setDeptSearchText] = useState("");
  const [muniSearchText, setMuniSearchText] = useState("");

  // Estados de resultados
  const [processes, setProcesses] = useState<SecopProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Cargar departamentos al iniciar
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepts(true);
      const data = await getDepartments();
      setDepartments(data);
      setLoadingDepts(false);
    };
    loadDepartments();
  }, []);

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    if (!selectedDepartamento) {
      setMunicipalities([]);
      return;
    }

    const loadMunicipalities = async () => {
      setLoadingMunis(true);
      setSelectedMunicipio("");
      const data = await getMunicipalities(selectedDepartamento);
      setMunicipalities(data);
      setLoadingMunis(false);
    };
    loadMunicipalities();
  }, [selectedDepartamento]);

  // Filtrar departamentos por búsqueda
  const filteredDepartments = deptSearchText
    ? departments.filter((d) =>
        d.toLowerCase().includes(deptSearchText.toLowerCase())
      )
    : departments;

  // Filtrar municipios por búsqueda
  const filteredMunicipalities = muniSearchText
    ? municipalities.filter((m) =>
        m.toLowerCase().includes(muniSearchText.toLowerCase())
      )
    : municipalities;

  // Contar filtros activos
  const activeFilters = [
    selectedModalidad,
    selectedTipo,
    selectedDepartamento,
    selectedMunicipio,
  ].filter(Boolean).length;

  // Buscar
  const handleSearch = async () => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const modalidadValue = MODALIDADES.find(
        (m) => m.id === selectedModalidad
      )?.value;
      const tipoValue = TIPOS.find((t) => t.id === selectedTipo)?.value;

      const results = await advancedSearch({
        keyword: keyword || undefined,
        departamento: selectedDepartamento || undefined,
        municipio: selectedMunicipio || undefined,
        modalidad: modalidadValue,
        tipoContrato: tipoValue,
        limit: 50,
      });

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

  // Guardar filtro actual
  const handleSaveFilter = () => {
    if (
      !keyword &&
      !selectedDepartamento &&
      !selectedModalidad &&
      !selectedTipo
    ) {
      Alert.alert("Sin filtros", "Agrega al menos un filtro para guardar");
      return;
    }

    Alert.prompt(
      "Guardar Búsqueda",
      "Dale un nombre a esta búsqueda:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          onPress: (name: string | undefined) => {
            if (name && name.trim()) {
              addFilter({
                name: name.trim(),
                filters: {
                  keyword: keyword || undefined,
                  departamento: selectedDepartamento || undefined,
                  municipio: selectedMunicipio || undefined,
                  modalidades: selectedModalidad ? [selectedModalidad] : [],
                  tiposContrato: selectedTipo ? [selectedTipo] : [],
                },
              });
              Alert.alert("Guardado", "Búsqueda guardada correctamente");
            }
          },
        },
      ],
      "plain-text",
      keyword || selectedDepartamento || "Mi búsqueda"
    );
  };

  // Cargar filtro guardado
  const handleLoadFilter = (filter: SavedFilter) => {
    setKeyword(filter.filters.keyword || "");
    setSelectedDepartamento(filter.filters.departamento || "");
    setSelectedMunicipio(filter.filters.municipio || "");
    setSelectedModalidad(filter.filters.modalidades[0] || "");
    setSelectedTipo(filter.filters.tiposContrato[0] || "");
    setShowSavedFilters(false);
  };

  // Eliminar filtro guardado
  const handleDeleteFilter = (filter: SavedFilter) => {
    Alert.alert("Eliminar búsqueda", `¿Eliminar "${filter.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => removeFilter(filter.id),
      },
    ]);
  };

  // Exportar
  const handleExport = async () => {
    if (processes.length === 0) {
      Alert.alert("Sin datos", "No hay procesos para exportar");
      return;
    }

    setExporting(true);
    try {
      await exportSearchResults(processes, keyword);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "No se pudo exportar"
      );
    } finally {
      setExporting(false);
    }
  };

  // Limpiar
  const handleClear = () => {
    setKeyword("");
    setSelectedDepartamento("");
    setSelectedMunicipio("");
    setSelectedModalidad("");
    setSelectedTipo("");
    setProcesses([]);
    setHasSearched(false);
    setError(null);
  };

  // Seleccionar departamento
  const handleSelectDept = (dept: string) => {
    setSelectedDepartamento(dept);
    setSelectedMunicipio("");
    setShowDeptModal(false);
    setDeptSearchText("");
  };

  // Seleccionar municipio
  const handleSelectMuni = (muni: string) => {
    setSelectedMunicipio(muni);
    setShowMuniModal(false);
    setMuniSearchText("");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Buscar</Text>

          {/* Botón filtros guardados */}
          <TouchableOpacity
            style={styles.savedButton}
            onPress={() => setShowSavedFilters(true)}>
            <Ionicons name="bookmark-outline" size={22} color={colors.accent} />
            {savedFilters.length > 0 && (
              <View style={styles.savedBadge}>
                <Text style={styles.savedBadgeText}>{savedFilters.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Palabra clave, entidad..."
            placeholderTextColor={colors.textTertiary}
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => setKeyword("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Ubicación */}
        <View style={styles.locationRow}>
          <TouchableOpacity
            style={[
              styles.locationButton,
              selectedDepartamento && styles.locationButtonActive,
            ]}
            onPress={() => setShowDeptModal(true)}
            disabled={loadingDepts}>
            {loadingDepts ? (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            ) : (
              <>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={
                    selectedDepartamento ? colors.accent : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.locationText,
                    selectedDepartamento && styles.locationTextActive,
                  ]}
                  numberOfLines={1}>
                  {selectedDepartamento || "Departamento"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.textTertiary}
                />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationButton,
              selectedMunicipio && styles.locationButtonActive,
              !selectedDepartamento && styles.locationButtonDisabled,
            ]}
            onPress={() => selectedDepartamento && setShowMuniModal(true)}
            disabled={!selectedDepartamento || loadingMunis}>
            {loadingMunis ? (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            ) : (
              <>
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={
                    selectedMunicipio ? colors.accent : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.locationText,
                    selectedMunicipio && styles.locationTextActive,
                  ]}
                  numberOfLines={1}>
                  {selectedMunicipio || "Municipio"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.textTertiary}
                />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Modalidades */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}>
          {MODALIDADES.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={[
                styles.chip,
                selectedModalidad === mod.id && styles.chipActive,
              ]}
              onPress={() =>
                setSelectedModalidad(selectedModalidad === mod.id ? "" : mod.id)
              }>
              <Text
                style={[
                  styles.chipText,
                  selectedModalidad === mod.id && styles.chipTextActive,
                ]}>
                {mod.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tipos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}>
          {TIPOS.map((tipo) => (
            <TouchableOpacity
              key={tipo.id}
              style={[
                styles.chip,
                selectedTipo === tipo.id && styles.chipActive,
              ]}
              onPress={() =>
                setSelectedTipo(selectedTipo === tipo.id ? "" : tipo.id)
              }>
              <Text
                style={[
                  styles.chipText,
                  selectedTipo === tipo.id && styles.chipTextActive,
                ]}>
                {tipo.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Botones */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons
              name="search"
              size={18}
              color={colors.backgroundSecondary}
            />
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveFilterButton}
            onPress={handleSaveFilter}>
            <Ionicons name="bookmark-outline" size={18} color={colors.accent} />
          </TouchableOpacity>

          {(keyword || activeFilters > 0) && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Resultados */}
      <ScrollView
        style={styles.results}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={colors.danger}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleSearch}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading */}
        {loading && <SearchResultsSkeleton />}

        {/* Resultados */}
        {!loading && processes.length > 0 && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {processes.length} resultados
              </Text>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExport}
                disabled={exporting}>
                {exporting ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <>
                    <Ionicons
                      name="download-outline"
                      size={16}
                      color={colors.accent}
                    />
                    <Text style={styles.exportText}>CSV</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {processes.map((process) => (
              <ProcessCard
                key={process.id_del_proceso}
                process={process}
                onPress={() => navigation.navigate("Detail", { process })}
              />
            ))}
          </>
        )}

        {/* Empty */}
        {!loading && hasSearched && processes.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyMessage}>Prueba con otros filtros</Text>
          </View>
        )}

        {/* Estado inicial */}
        {!hasSearched && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="filter-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>Buscar procesos</Text>
            <Text style={styles.emptyMessage}>
              Usa los filtros y presiona Buscar
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal Departamentos */}
      <Modal visible={showDeptModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Departamento</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDeptModal(false);
                  setDeptSearchText("");
                }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Búsqueda */}
            <View style={styles.modalSearchBar}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar departamento..."
                placeholderTextColor={colors.textTertiary}
                value={deptSearchText}
                onChangeText={setDeptSearchText}
                autoFocus
              />
              {deptSearchText.length > 0 && (
                <TouchableOpacity onPress={() => setDeptSearchText("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredDepartments}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectDept(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedDepartamento === item && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  No se encontraron departamentos
                </Text>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Municipios */}
      <Modal visible={showMuniModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Municipio</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowMuniModal(false);
                  setMuniSearchText("");
                }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Búsqueda */}
            <View style={styles.modalSearchBar}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar municipio..."
                placeholderTextColor={colors.textTertiary}
                value={muniSearchText}
                onChangeText={setMuniSearchText}
                autoFocus
              />
              {muniSearchText.length > 0 && (
                <TouchableOpacity onPress={() => setMuniSearchText("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredMunicipalities}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectMuni(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedMunicipio === item && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>
                  {loadingMunis
                    ? "Cargando municipios..."
                    : "No se encontraron municipios"}
                </Text>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Filtros Guardados */}
      <Modal visible={showSavedFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Búsquedas Guardadas</Text>
              <TouchableOpacity onPress={() => setShowSavedFilters(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {savedFilters.length === 0 ? (
              <View style={styles.emptyFilters}>
                <Ionicons
                  name="bookmark-outline"
                  size={48}
                  color={colors.textTertiary}
                />
                <Text style={styles.emptyFiltersTitle}>
                  Sin búsquedas guardadas
                </Text>
                <Text style={styles.emptyFiltersText}>
                  Usa el botón de guardar para guardar tus búsquedas frecuentes
                </Text>
              </View>
            ) : (
              <FlatList
                data={savedFilters}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.savedFilterItem}
                    onPress={() => handleLoadFilter(item)}>
                    <View style={styles.savedFilterInfo}>
                      <Text style={styles.savedFilterName}>{item.name}</Text>
                      <Text style={styles.savedFilterDetails}>
                        {[
                          item.filters.keyword,
                          item.filters.departamento,
                          item.filters.modalidades[0] &&
                            MODALIDADES.find(
                              (m) => m.id === item.filters.modalidades[0]
                            )?.label,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "Sin filtros"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteFilterButton}
                      onPress={() => handleDeleteFilter(item)}>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 34,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    savedButton: {
      position: "relative",
      padding: spacing.sm,
    },
    savedBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      backgroundColor: colors.danger,
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    savedBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.backgroundSecondary,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      height: 44,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    locationRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    locationButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
      minHeight: 40,
    },
    locationButtonActive: {
      backgroundColor: colors.accentLight,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    locationButtonDisabled: {
      opacity: 0.5,
    },
    locationText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
    },
    locationTextActive: {
      color: colors.accent,
      fontWeight: "500",
    },
    chipsScroll: {
      marginBottom: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.full,
      marginRight: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.accent,
    },
    chipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    chipTextActive: {
      color: colors.backgroundSecondary,
    },
    buttonsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    searchButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    searchButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
    saveFilterButton: {
      width: 48,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.md,
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    clearButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    results: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.dangerLight,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: colors.danger,
    },
    retryText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.accent,
    },
    resultsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    resultsCount: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    exportButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      padding: spacing.sm,
    },
    exportText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: "500",
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: spacing.xxl * 2,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    emptyMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    modalSearchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
      paddingHorizontal: spacing.md,
      height: 40,
      gap: spacing.sm,
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    modalItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    modalItemText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    emptyModalText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      padding: spacing.xl,
    },
    emptyFilters: {
      alignItems: "center",
      padding: spacing.xxl,
    },
    emptyFiltersTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    emptyFiltersText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    savedFilterItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    savedFilterInfo: {
      flex: 1,
    },
    savedFilterName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    savedFilterDetails: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    deleteFilterButton: {
      padding: spacing.sm,
    },
  });

export default SearchScreen;
