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
import { AlertIcon, MarcadorIcon } from "../assets/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard, SearchResultsSkeleton, AnimatedPressable } from "../components/index";
import { SecopProcess, advancedSearch } from "../api/secop";
import { spacing, borderRadius, scale, shadows } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { useFiltersStore, SavedFilter } from "../store/filtersStore";
import { getDepartments, getMunicipalities } from "../services/divipola";
import {
  CONTRACT_TYPES,
  getContractTypeColor,
} from "../constants/contractTypes";
import { MODALIDADES } from "../constants/filterOptions";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SearchScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { savedFilters, addFilter } = useFiltersStore();
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
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showMuniModal, setShowMuniModal] = useState(false);
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

  // Consumir params de navegacion desde HomeScreen
  const pendingSearchRef = React.useRef<{ tipos: string[] } | null>(null);

  useEffect(() => {
    if (!route?.params) return;
    const params = route.params;
    let changed = false;

    if (params.departamento) {
      setSelectedDepartamento(params.departamento);
      changed = true;
    }

    const tiposToSearch = params.tipoContrato
      ? [params.tipoContrato]
      : params.tipos && Array.isArray(params.tipos)
        ? params.tipos
        : [];

    if (params.tipoContrato || params.tipos) {
      setSelectedTipos(tiposToSearch);
      changed = true;
    }

    if (changed) {
      navigation.setParams({ departamento: undefined, tipoContrato: undefined, tipos: undefined });
      pendingSearchRef.current = { tipos: tiposToSearch };
    }
  }, [route?.params]);

  // Ejecutar busqueda pendiente despues de que el estado se actualice
  useEffect(() => {
    if (pendingSearchRef.current) {
      const { tipos } = pendingSearchRef.current;
      pendingSearchRef.current = null;
      handleSearchWithTipos(tipos);
    }
  }, [selectedDepartamento, selectedTipos]);

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

  // Toggle tipo de contrato y buscar automáticamente
  const handleToggleTipo = (tipoId: string) => {
    const newSelectedTipos = selectedTipos.includes(tipoId)
      ? selectedTipos.filter((id) => id !== tipoId)
      : [...selectedTipos, tipoId];

    setSelectedTipos(newSelectedTipos);

    // Ejecutar búsqueda automáticamente con los nuevos tipos
    handleSearchWithTipos(newSelectedTipos);
  };

  // Búsqueda con tipos específicos (para llamar desde toggle)
  const handleSearchWithTipos = async (tipos: string[]) => {
    Keyboard.dismiss();
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const modalidadValue = MODALIDADES.find(
        (m) => m.id === selectedModalidad
      )?.value;

      const tipoValues = tipos.map((tipoId) => {
        const config = CONTRACT_TYPES.find((t) => t.id === tipoId);
        return config?.id || tipoId;
      });

      let allResults: SecopProcess[] = [];

      if (tipoValues.length === 0) {
        const results = await advancedSearch({
          keyword: keyword || undefined,
          departamento: selectedDepartamento || undefined,
          municipio: selectedMunicipio || undefined,
          modalidad: modalidadValue,
          limit: 50,
        });
        allResults = results;
      } else if (tipoValues.length === 1) {
        const results = await advancedSearch({
          keyword: keyword || undefined,
          departamento: selectedDepartamento || undefined,
          municipio: selectedMunicipio || undefined,
          modalidad: modalidadValue,
          tipoContrato: tipoValues[0],
          limit: 50,
        });
        allResults = results;
      } else {
        const promises = tipoValues.map((tipo) =>
          advancedSearch({
            keyword: keyword || undefined,
            departamento: selectedDepartamento || undefined,
            municipio: selectedMunicipio || undefined,
            modalidad: modalidadValue,
            tipoContrato: tipo,
            limit: 30,
          })
        );
        const resultsArrays = await Promise.all(promises);
        allResults = resultsArrays.flat();
      }

      const uniqueResults = allResults.filter(
        (process, index, self) =>
          index ===
          self.findIndex((p) => p.id_del_proceso === process.id_del_proceso)
      );

      uniqueResults.sort((a, b) => {
        const dateA =
          a.fecha_de_publicacion_del || a.fecha_de_ultima_publicaci || "";
        const dateB =
          b.fecha_de_publicacion_del || b.fecha_de_ultima_publicaci || "";
        return dateB.localeCompare(dateA);
      });

      setProcesses(uniqueResults.slice(0, 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    handleSearchWithTipos(selectedTipos);
  };

  const handleSaveFilter = () => {
    if (
      !keyword &&
      !selectedDepartamento &&
      !selectedModalidad &&
      selectedTipos.length === 0
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
                  tiposContrato: selectedTipos,
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

  const handleCreateAlert = () => {
    const modalidadValue = MODALIDADES.find(
      (m) => m.id === selectedModalidad
    )?.value;

    const alertFilters = {
      keyword: keyword || undefined,
      departamento: selectedDepartamento || undefined,
      municipio: selectedMunicipio || undefined,
      modalidad: modalidadValue || undefined,
      tipos_contrato: selectedTipos.length > 0 ? selectedTipos : undefined,
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
    setSelectedTipos(filter.filters.tiposContrato || []);
    setShowSuggestions(false);
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
    handleLoadFilter(filter);
  };

  const handleUseSuggestion = (text: string) => {
    setKeyword(text);
    setShowSuggestions(false);
  };

  // Contar filtros activos
  const activeFiltersCount = [
    keyword,
    selectedDepartamento,
    selectedMunicipio,
    selectedModalidad,
    ...selectedTipos,
  ].filter(Boolean).length;

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setKeyword("");
    setSelectedDepartamento("");
    setSelectedMunicipio("");
    setSelectedModalidad("");
    setSelectedTipos([]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Buscar</Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilters}>
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Barra de búsqueda */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={22} color={colors.textTertiary} />
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

            {/* Sugerencias */}
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
                        <Text
                          style={styles.suggestionDetails}
                          numberOfLines={1}>
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
              filteredSuggestions.suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <View style={styles.suggestionsHeader}>
                    <Text style={styles.suggestionsTitle}>Sugerencias</Text>
                  </View>
                  {filteredSuggestions.suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => handleUseSuggestion(suggestion)}>
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                      selectedDepartamento
                        ? colors.accent
                        : colors.textSecondary
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
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Modalidad</Text>
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
                    setSelectedModalidad(
                      selectedModalidad === mod.id ? "" : mod.id
                    )
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
          </View>

          {/* Tipos de Contrato */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Tipo de Contrato</Text>
              {selectedTipos.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedTipos([]);
                    handleSearchWithTipos([]);
                  }}>
                  <Text style={styles.clearSectionText}>
                    Limpiar ({selectedTipos.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.tiposChipsWrap}>
              {CONTRACT_TYPES.map((config) => {
                const typeColor = getContractTypeColor(config);
                const isActive = selectedTipos.includes(config.id);

                return (
                  <TouchableOpacity
                    key={config.id}
                    style={[
                      styles.tipoChip,
                      {
                        backgroundColor: isActive
                          ? typeColor
                          : "transparent",
                        borderWidth: 1,
                        borderColor: isActive
                          ? typeColor
                          : typeColor + "30",
                      },
                    ]}
                    onPress={() => handleToggleTipo(config.id)}
                    activeOpacity={0.7}>
                    <config.CustomIcon
                      size={14}
                      color={isActive ? "#FFF" : typeColor}
                    />
                    <Text
                      style={[
                        styles.tipoChipText,
                        { color: isActive ? "#FFF" : colors.textSecondary },
                      ]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Botones */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.searchButton, shadows.card]}
              onPress={() => {
                setShowSuggestions(false);
                handleSearch();
              }}
              activeOpacity={0.8}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.searchButtonText}>Buscar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveFilterButton}
              onPress={handleSaveFilter}
              activeOpacity={0.7}>
              <MarcadorIcon size={20} color={colors.accent} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.alertButton}
              onPress={handleCreateAlert}
              activeOpacity={0.7}>
              <AlertIcon size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resultados */}
        <View style={styles.results}>
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
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {processes.length} resultados
                </Text>
                {selectedTipos.length > 0 && (
                  <View style={styles.activeTypesRow}>
                    {selectedTipos.slice(0, 3).map((tipoId) => {
                      const config = CONTRACT_TYPES.find(
                        (t) => t.id === tipoId
                      );
                      if (!config) return null;
                      const typeColor = getContractTypeColor(config);
                      return (
                        <View
                          key={tipoId}
                          style={[
                            styles.activeTypeBadge,
                            { backgroundColor: `${typeColor}20` },
                          ]}>
                          <config.CustomIcon size={12} color={typeColor} />
                        </View>
                      );
                    })}
                    {selectedTipos.length > 3 && (
                      <Text style={styles.moreTypesText}>
                        +{selectedTipos.length - 3}
                      </Text>
                    )}
                  </View>
                )}
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

          {!loading && hasSearched && processes.length === 0 && !error && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="search-outline"
                  size={44}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyMessage}>Prueba con otros filtros</Text>
            </View>
          )}

          {!hasSearched && !loading && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="filter-outline"
                  size={44}
                  color={colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyTitle}>Buscar procesos</Text>
              <Text style={styles.emptyMessage}>
                Usa los filtros y presiona Buscar
              </Text>
            </View>
          )}
        </View>
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
    scrollContainer: { flex: 1 },
    header: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    title: { fontSize: scale(34), fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.5 },
    clearButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    clearButtonText: {
      fontSize: scale(14),
      fontWeight: "600",
      color: colors.accent,
    },
    searchBarContainer: {
      position: "relative",
      zIndex: 10,
      marginBottom: spacing.md,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "transparent",
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      height: 42,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.separatorLight,
    },
    searchInput: { flex: 1, fontSize: scale(16), color: colors.textPrimary },
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
      fontSize: scale(12),
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
      fontSize: scale(15),
      fontWeight: "500",
      color: colors.textPrimary,
    },
    suggestionDetails: {
      fontSize: scale(12),
      color: colors.textSecondary,
      marginTop: 2,
    },
    suggestionText: { flex: 1, fontSize: scale(15), color: colors.textPrimary },
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
      backgroundColor: "transparent",
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
      height: 42,
      borderWidth: 1,
      borderColor: colors.separatorLight,
    },
    locationButtonActive: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
    },
    locationButtonDisabled: { opacity: 0.5 },
    locationText: { flex: 1, fontSize: scale(14), color: colors.textSecondary },
    locationTextActive: { color: colors.accent, fontWeight: "500" },
    sectionContainer: {
      marginBottom: spacing.md,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    sectionLabel: {
      fontSize: scale(13),
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    clearSectionText: {
      fontSize: scale(12),
      fontWeight: "600",
      color: colors.accent,
    },
    chipsScroll: { marginBottom: 0 },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: "transparent",
      borderRadius: borderRadius.full,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.separatorLight,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: scale(13), color: colors.textSecondary, fontWeight: "500" },
    chipTextActive: { color: "#FFFFFF" },
    tiposChipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    tipoChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    tipoChipText: {
      fontSize: scale(13),
      fontWeight: "500",
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
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    searchButtonText: { fontSize: scale(16), fontWeight: "600", color: "#FFFFFF" },
    saveFilterButton: {
      width: scale(48),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.lg,
    },
    alertButton: {
      width: scale(48),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.lg,
    },
    results: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    resultsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    resultsCount: {
      fontSize: scale(15),
      fontWeight: "700",
      color: colors.textPrimary,
    },
    activeTypesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    activeTypeBadge: {
      width: scale(24),
      height: scale(24),
      borderRadius: scale(12),
      justifyContent: "center",
      alignItems: "center",
    },
    moreTypesText: {
      fontSize: scale(11),
      fontWeight: "600",
      color: colors.textTertiary,
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
    errorText: { flex: 1, fontSize: scale(14), color: colors.danger },
    retryText: { fontSize: scale(14), fontWeight: "600", color: colors.accent },
    emptyContainer: { alignItems: "center", paddingVertical: spacing.xxl * 2 },
    emptyIconContainer: {
      width: scale(88),
      height: scale(88),
      borderRadius: scale(44),
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyTitle: {
      fontSize: scale(18),
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    emptyMessage: {
      fontSize: scale(14),
      color: colors.textSecondary,
      marginTop: spacing.xs,
      maxWidth: scale(240),
      textAlign: "center",
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
    },
    modalTitle: { fontSize: scale(18), fontWeight: "700", color: colors.textPrimary },
    modalSearchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      marginHorizontal: spacing.lg,
      marginVertical: spacing.md,
      paddingHorizontal: spacing.md,
      height: 42,
      gap: spacing.sm,
    },
    modalSearchInput: { flex: 1, fontSize: scale(16), color: colors.textPrimary },
    modalItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.lg,
    },
    modalItemText: { fontSize: scale(16), color: colors.textPrimary },
  });

export default SearchScreen;
