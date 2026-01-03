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
  Animated,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard, SearchResultsSkeleton } from "../components/index";
import { SecopProcess, advancedSearch } from "../api/secop";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";

import { useFiltersStore, SavedFilter } from "../store/filtersStore";
import { getDepartments, getMunicipalities } from "../services/divipola";

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

  // Estados
  const [departments, setDepartments] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingMunis, setLoadingMunis] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showMuniModal, setShowMuniModal] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [deptSearchText, setDeptSearchText] = useState("");
  const [muniSearchText, setMuniSearchText] = useState("");
  const [processes, setProcesses] = useState<SecopProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepts(true);
      const data = await getDepartments();
      setDepartments(data);
      setLoadingDepts(false);
    };
    loadDepartments();
  }, []);

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

  const filteredDepartments = deptSearchText
    ? departments.filter((d) =>
        d.toLowerCase().includes(deptSearchText.toLowerCase())
      )
    : departments;

  const filteredMunicipalities = muniSearchText
    ? municipalities.filter((m) =>
        m.toLowerCase().includes(muniSearchText.toLowerCase())
      )
    : municipalities;

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

  // ============================================
  // CREAR ALERTA DESDE BÚSQUEDA ACTUAL
  // ============================================
  const handleCreateAlert = () => {
    const modalidadValue = MODALIDADES.find(
      (m) => m.id === selectedModalidad
    )?.value;
    const tipoValue = TIPOS.find((t) => t.id === selectedTipo)?.value;

    const alertFilters = {
      keyword: keyword || undefined,
      departamento: selectedDepartamento || undefined,
      municipio: selectedMunicipio || undefined,
      modalidad: modalidadValue || undefined,
      tipo_contrato: tipoValue || undefined,
    };

    const hasFilters = Object.values(alertFilters).some((v) => v !== undefined);

    if (!hasFilters) {
      Alert.alert(
        "Sin filtros",
        "Agrega al menos un filtro para crear una alerta"
      );
      return;
    }

    navigation.navigate("Alerts", {
      screen: "AlertsTab",
      params: { createWithFilters: alertFilters },
    });
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    setKeyword(filter.filters.keyword || "");
    setSelectedDepartamento(filter.filters.departamento || "");
    setSelectedMunicipio(filter.filters.municipio || "");
    setSelectedModalidad(filter.filters.modalidades[0] || "");
    setSelectedTipo(filter.filters.tiposContrato[0] || "");
    setShowSavedFilters(false);
  };

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

  const handleSelectDept = (dept: string) => {
    if (selectedDepartamento === dept) {
      setSelectedDepartamento("");
      setSelectedMunicipio("");
    } else {
      setSelectedDepartamento(dept);
      setSelectedMunicipio("");
    }
    setShowDeptModal(false);
    setDeptSearchText("");
  };

  const handleSelectMuni = (muni: string) => {
    setSelectedMunicipio(selectedMunicipio === muni ? "" : muni);
    setShowMuniModal(false);
    setMuniSearchText("");
  };

  const COMMON_SUGGESTIONS = [
    "Construcción",
    "Obra",
    "Consultoría",
    "Servicios",
    "Suministro",
    "Mantenimiento",
    "Infraestructura",
    "Transporte",
    "Salud",
    "Educación",
    "Tecnología",
    "Software",
  ];

  const getFilteredSuggestions = () => {
    if (keyword.length === 0)
      return { type: "saved" as const, items: savedFilters.slice(0, 5) };
    const searchTerm = keyword.toLowerCase();
    const matchingFilters = savedFilters
      .filter(
        (f) =>
          f.name.toLowerCase().includes(searchTerm) ||
          f.filters.keyword?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 3);
    const matchingCommon = COMMON_SUGGESTIONS.filter(
      (s) =>
        s.toLowerCase().includes(searchTerm) && s.toLowerCase() !== searchTerm
    ).slice(0, 4);
    return {
      type: "mixed" as const,
      filters: matchingFilters,
      suggestions: matchingCommon,
    };
  };

  const filteredSuggestions = getFilteredSuggestions();

  const handleLoadSuggestion = (filter: SavedFilter) => {
    setKeyword(filter.filters.keyword || "");
    setSelectedDepartamento(filter.filters.departamento || "");
    setSelectedMunicipio(filter.filters.municipio || "");
    setSelectedModalidad(filter.filters.modalidades[0] || "");
    setSelectedTipo(filter.filters.tiposContrato[0] || "");
    setShowSuggestions(false);
  };

  const handleUseSuggestion = (text: string) => {
    setKeyword(text);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Buscar</Text>

        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Palabra clave, entidad..."
              placeholderTextColor={colors.textTertiary}
              value={keyword}
              onChangeText={(text) => {
                setKeyword(text);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              returnKeyType="search"
              onSubmitEditing={() => {
                setShowSuggestions(false);
                handleSearch();
              }}
            />
            {keyword.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setKeyword("");
                  setShowSuggestions(true);
                }}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>

          {showSuggestions &&
            filteredSuggestions.type === "saved" &&
            filteredSuggestions.items.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <View style={styles.suggestionsHeader}>
                  <Text style={styles.suggestionsTitle}>
                    Búsquedas guardadas
                  </Text>
                  <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                    <Ionicons
                      name="close"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
                {filteredSuggestions.items.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    style={styles.suggestionItem}
                    onPress={() => handleLoadSuggestion(filter)}>
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionName}>{filter.name}</Text>
                      <Text style={styles.suggestionDetails} numberOfLines={1}>
                        {[filter.filters.keyword, filter.filters.departamento]
                          .filter(Boolean)
                          .join(" • ") || "Sin filtros"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

          {showSuggestions &&
            filteredSuggestions.type === "mixed" &&
            (filteredSuggestions.filters.length > 0 ||
              filteredSuggestions.suggestions.length > 0) && (
              <View style={styles.suggestionsContainer}>
                {filteredSuggestions.suggestions.length > 0 && (
                  <>
                    <View style={styles.suggestionsHeader}>
                      <Text style={styles.suggestionsTitle}>Sugerencias</Text>
                    </View>
                    {filteredSuggestions.suggestions.map(
                      (suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionItem}
                          onPress={() => handleUseSuggestion(suggestion)}>
                          <Text style={styles.suggestionText}>
                            {suggestion}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </>
                )}
              </View>
            )}
        </View>

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
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              setShowSuggestions(false);
              handleSearch();
            }}>
            <Ionicons name="search" size={18} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveFilterButton}
            onPress={handleSaveFilter}>
            <Ionicons name="bookmark-outline" size={20} color={colors.accent} />
          </TouchableOpacity>

          {/* NUEVO: Botón crear alerta */}
          <TouchableOpacity
            style={styles.alertButton}
            onPress={handleCreateAlert}>
            <Ionicons name="notifications-outline" size={20} color="#FF9500" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.results}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
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

        {loading && <SearchResultsSkeleton />}

        {!loading && processes.length > 0 && (
          <>
            <Text style={styles.resultsCount}>
              {processes.length} resultados
            </Text>
            {processes.map((process) => (
              <ProcessCard
                key={process.id_del_proceso}
                process={process}
                onPress={() => navigation.navigate("Detail", { process })}
              />
            ))}
          </>
        )}

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
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    title: { fontSize: 34, fontWeight: "700", color: colors.textPrimary },
    searchBarContainer: {
      position: "relative",
      zIndex: 10,
      marginBottom: spacing.md,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      height: 44,
      gap: spacing.sm,
    },
    searchInput: { flex: 1, fontSize: 16, color: colors.textPrimary },
    suggestionsContainer: {
      position: "absolute",
      top: 48,
      left: 0,
      right: 0,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 100,
    },
    suggestionsHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    suggestionsTitle: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      color: colors.textTertiary,
      textTransform: "uppercase",
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    suggestionContent: { flex: 1 },
    suggestionName: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.textPrimary,
    },
    suggestionDetails: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    suggestionText: { flex: 1, fontSize: 15, color: colors.textPrimary },
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
    locationButtonDisabled: { opacity: 0.5 },
    locationText: { flex: 1, fontSize: 14, color: colors.textSecondary },
    locationTextActive: { color: colors.accent, fontWeight: "500" },
    chipsScroll: { marginBottom: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.full,
      marginRight: spacing.sm,
    },
    chipActive: { backgroundColor: colors.accent },
    chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
    chipTextActive: { color: "#FFFFFF" },
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
    searchButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
    saveFilterButton: {
      width: 48,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.md,
    },
    alertButton: {
      width: 48,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFF3CD",
      borderRadius: borderRadius.md,
    },
    results: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.dangerLight,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    errorText: { flex: 1, fontSize: 14, color: colors.danger },
    retryText: { fontSize: 14, fontWeight: "600", color: colors.accent },
    resultsCount: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    emptyContainer: { alignItems: "center", paddingVertical: spacing.xxl * 2 },
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
    modalTitle: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
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
    modalSearchInput: { flex: 1, fontSize: 16, color: colors.textPrimary },
    modalItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    modalItemText: { fontSize: 16, color: colors.textPrimary },
  });

export default SearchScreen;
