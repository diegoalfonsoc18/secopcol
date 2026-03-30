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
import { AlertIcon } from "../assets/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard, SearchResultsSkeleton, GlassWrapper } from "../components/index";
import { SecopProcess, advancedSearch, getEntitiesByLocation } from "../api/secop";
import { spacing, borderRadius, scale, shadows } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { getDepartments, getMunicipalities } from "../services/divipola";
import {
  CONTRACT_TYPES,
  getContractTypeColor,
} from "../constants/contractTypes";
import { MODALIDADES, ESTADOS_PROCESO } from "../constants/filterOptions";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SearchScreen: React.FC<{ navigation: any; route?: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Estados
  const [departments, setDepartments] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingMunis, setLoadingMunis] = useState(false);
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedMunicipios, setSelectedMunicipios] = useState<string[]>([]);
  const [selectedModalidad, setSelectedModalidad] = useState("");
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedEstados, setSelectedEstados] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [selectedEntidad, setSelectedEntidad] = useState("");
  const [entidadInput, setEntidadInput] = useState("");
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showMuniModal, setShowMuniModal] = useState(false);
  const [showEntidadModal, setShowEntidadModal] = useState(false);
  const [deptSearchText, setDeptSearchText] = useState("");
  const [muniSearchText, setMuniSearchText] = useState("");
  const [entidadSearchText, setEntidadSearchText] = useState("");
  const [processes, setProcesses] = useState<SecopProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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
      setSelectedMunicipios([]);
      const data = await getMunicipalities(selectedDepartamento);
      setMunicipalities(data);
      setLoadingMunis(false);
    };
    loadMunicipalities();
  }, [selectedDepartamento]);

  useEffect(() => {
    if (selectedMunicipios.length === 0) {
      setEntities([]);
      setSelectedEntidad("");
      return;
    }
    const loadEntities = async () => {
      setLoadingEntities(true);
      setSelectedEntidad("");
      // Cargar entidades del primer municipio seleccionado
      const data = await getEntitiesByLocation({
        departamento: selectedDepartamento,
        municipio: selectedMunicipios[0],
      });
      setEntities(data);
      setLoadingEntities(false);
    };
    loadEntities();
  }, [selectedDepartamento, selectedMunicipios]);

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

  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredDepartments = deptSearchText
    ? departments.filter((d) =>
        normalize(d).includes(normalize(deptSearchText))
      )
    : departments;

  const filteredMunicipalities = muniSearchText
    ? municipalities.filter((m) =>
        normalize(m).includes(normalize(muniSearchText))
      )
    : municipalities;

  const filteredEntities = entidadSearchText
    ? entities.filter((e) =>
        normalize(e).includes(normalize(entidadSearchText))
      )
    : entities;

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

      // Si no se selecciona estado, por defecto "Publicado" y máximo 30 días
      const useDefaultEstado = selectedEstados.length === 0;
      const baseParams = {
        departamento: selectedDepartamento || undefined,
        municipio: selectedMunicipios.length > 0 ? selectedMunicipios : undefined,
        entidad: selectedEntidad || undefined,
        entidadSearch: entidadInput.trim() || undefined,
        modalidad: modalidadValue,
        estadoProcedimiento: useDefaultEstado ? ["Publicado"] : selectedEstados,
        ...(useDefaultEstado && { recentDays: 30 }),
      };

      const results = await advancedSearch({
        ...baseParams,
        tipoContrato: tipoValues.length > 0 ? tipoValues : undefined,
        limit: 50,
      });
      allResults = results;

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

  const handleCreateAlert = () => {
    const modalidadValue = MODALIDADES.find(
      (m) => m.id === selectedModalidad
    )?.value;

    const alertFilters = {
      departamento: selectedDepartamento || undefined,
      municipio: selectedMunicipios.length > 0 ? selectedMunicipios : undefined,
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

  const handleSelectDept = (dept: string) => {
    if (selectedDepartamento === dept) {
      setSelectedDepartamento("");
      setSelectedMunicipios([]);
    } else {
      setSelectedDepartamento(dept);
      setSelectedMunicipios([]);
    }
    setShowDeptModal(false);
    setDeptSearchText("");
  };

  const handleSelectMuni = (muni: string) => {
    setSelectedMunicipios(prev =>
      prev.includes(muni)
        ? prev.filter(m => m !== muni)
        : [...prev, muni]
    );
  };

  const handleSelectEntidad = (entidad: string) => {
    setSelectedEntidad(selectedEntidad === entidad ? "" : entidad);
    setShowEntidadModal(false);
    setEntidadSearchText("");
  };

  // Toggle estado del proceso
  const handleToggleEstado = (estadoValue: string) => {
    const newEstados = selectedEstados.includes(estadoValue)
      ? selectedEstados.filter((e) => e !== estadoValue)
      : [...selectedEstados, estadoValue];
    setSelectedEstados(newEstados);
  };

  // Contar filtros activos
  const activeFiltersCount = [
    selectedDepartamento,
    ...selectedMunicipios,
    selectedEntidad,
    entidadInput,
    selectedModalidad,
    ...selectedTipos,
    ...selectedEstados,
  ].filter(Boolean).length;

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSelectedDepartamento("");
    setSelectedMunicipios([]);
    setSelectedEntidad("");
    setEntidadInput("");
    setSelectedModalidad("");
    setSelectedTipos([]);
    setSelectedEstados([]);
  };

  return (
    <View style={styles.container}>
      {/* Header fijo */}
      <View
        style={[styles.fixedHeader, { paddingTop: insets.top + spacing.md, backgroundColor: colors.background }]}
      >
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
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Filtros */}
        <View style={styles.header}>
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
                selectedMunicipios.length > 0 && styles.locationButtonActive,
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
                      selectedMunicipios.length > 0 ? colors.accent : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.locationText,
                      selectedMunicipios.length > 0 && styles.locationTextActive,
                    ]}
                    numberOfLines={1}>
                    {selectedMunicipios.length > 0
                      ? selectedMunicipios.length === 1
                        ? selectedMunicipios[0]
                        : `${selectedMunicipios.length} municipios`
                      : "Municipio"}
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

          {/* Entidad */}
          <TouchableOpacity
            style={[
              styles.entidadButton,
              selectedEntidad && styles.locationButtonActive,
              selectedMunicipios.length === 0 && styles.locationButtonDisabled,
            ]}
            onPress={() => selectedMunicipios.length > 0 && setShowEntidadModal(true)}
            disabled={selectedMunicipios.length === 0 || loadingEntities}>
            {loadingEntities ? (
              <ActivityIndicator size="small" color={colors.textTertiary} />
            ) : (
              <>
                <Ionicons
                  name="shield-outline"
                  size={16}
                  color={
                    selectedEntidad ? colors.accent : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.locationText,
                    selectedEntidad && styles.locationTextActive,
                  ]}
                  numberOfLines={1}>
                  {selectedEntidad || "Entidad"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.textTertiary}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Buscar entidad por nombre o NIT */}
          <View style={styles.entidadInputContainer}>
            <Ionicons
              name="search-outline"
              size={16}
              color={entidadInput ? colors.accent : colors.textTertiary}
              style={{ marginRight: spacing.xs }}
            />
            <TextInput
              style={[styles.entidadInputText, { color: colors.textPrimary }]}
              placeholder="Buscar entidad por nombre o NIT"
              placeholderTextColor={colors.textTertiary}
              value={entidadInput}
              onChangeText={setEntidadInput}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {entidadInput.length > 0 && (
              <TouchableOpacity onPress={() => setEntidadInput("")}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tiposChipsRow}>
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
            </ScrollView>
          </View>

          {/* Estado del Proceso */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Estado del Proceso</Text>
              {selectedEstados.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedEstados([])}>
                  <Text style={styles.clearSectionText}>
                    Limpiar ({selectedEstados.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tiposChipsRow}>
              {ESTADOS_PROCESO.map((estado) => {
                const isActive = selectedEstados.includes(estado.id);
                return (
                  <TouchableOpacity
                    key={estado.id}
                    style={[
                      styles.tipoChip,
                      {
                        backgroundColor: isActive ? estado.color : "transparent",
                        borderWidth: 1,
                        borderColor: isActive ? estado.color : estado.color + "30",
                      },
                    ]}
                    onPress={() => handleToggleEstado(estado.id)}
                    activeOpacity={0.7}>
                    <Ionicons
                      name={estado.icon}
                      size={14}
                      color={isActive ? "#FFF" : estado.color}
                    />
                    <Text
                      style={[
                        styles.tipoChipText,
                        { color: isActive ? "#FFF" : colors.textSecondary },
                      ]}>
                      {estado.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Botones */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.searchButton, shadows.card]}
              onPress={() => {
                handleSearch();
              }}
              activeOpacity={0.8}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.searchButtonText}>Buscar</Text>
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
              </View>
              {processes.map((process, index) => (
                <ProcessCard
                  key={`${process.id_del_proceso}-${index}`}
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
          <GlassWrapper
            variant="regular"
            style={[styles.modalContent, { paddingBottom: insets.bottom }]}
            fallbackColor={colors.background}
          >
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
          </GlassWrapper>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Municipios */}
      <Modal visible={showMuniModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <GlassWrapper
            variant="regular"
            style={[styles.modalContent, { paddingBottom: insets.bottom }]}
            fallbackColor={colors.background}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedMunicipios.length > 0
                  ? `${selectedMunicipios.length} seleccionado${selectedMunicipios.length > 1 ? "s" : ""}`
                  : "Municipios"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowMuniModal(false);
                  setMuniSearchText("");
                }}>
                <Text style={{ color: colors.accent, fontWeight: "600", fontSize: 16 }}>
                  Listo
                </Text>
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
              {muniSearchText.length > 0 && (
                <TouchableOpacity onPress={() => setMuniSearchText("")}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredMunicipalities}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selectedMunicipios.includes(item);
                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleSelectMuni(item)}>
                    <Text style={[
                      styles.modalItemText,
                      isSelected && { color: colors.accent, fontWeight: "600" },
                    ]}>{item}</Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
                  <Text style={{ color: colors.textTertiary }}>
                    No se encontraron resultados
                  </Text>
                </View>
              }
            />
          </GlassWrapper>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Entidades */}
      <Modal visible={showEntidadModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <GlassWrapper
            variant="regular"
            style={[styles.modalContent, { paddingBottom: insets.bottom }]}
            fallbackColor={colors.background}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entidad</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEntidadModal(false);
                  setEntidadSearchText("");
                }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchBar}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar entidad..."
                placeholderTextColor={colors.textTertiary}
                value={entidadSearchText}
                onChangeText={setEntidadSearchText}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredEntities}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectEntidad(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedEntidad === item && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </GlassWrapper>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    fixedHeader: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
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
      marginBottom: spacing.sm,
    },
    title: {
      fontSize: scale(28),
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    clearButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.full,
    },
    clearButtonText: {
      fontSize: scale(13),
      fontWeight: "600",
      color: colors.accent,
    },
    locationRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    locationButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
      height: 44,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
      }),
    },
    entidadButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
      height: 44,
      marginBottom: spacing.sm,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
      }),
    },
    entidadInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.xl,
      paddingHorizontal: spacing.md,
      height: 44,
      marginBottom: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
      }),
    },
    entidadInputText: {
      flex: 1,
      fontSize: scale(14),
      padding: 0,
    },
    locationButtonActive: {
      backgroundColor: colors.accentLight,
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    locationButtonDisabled: { opacity: 0.4 },
    locationText: { flex: 1, fontSize: scale(14), color: colors.textSecondary },
    locationTextActive: { color: colors.accent, fontWeight: "600" },
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
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    clearSectionText: {
      fontSize: scale(12),
      fontWeight: "600",
      color: colors.accent,
    },
    chipsScroll: { marginBottom: 0 },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.full,
      marginRight: spacing.sm,
    },
    chipActive: { backgroundColor: colors.accent },
    chipText: { fontSize: scale(13), color: colors.textSecondary, fontWeight: "500" },
    chipTextActive: { color: "#FFFFFF" },
    tiposChipsRow: {
      flexDirection: "row",
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
      marginTop: spacing.md,
    },
    searchButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderRadius: borderRadius.full,
      height: 44,
      gap: spacing.sm,
    },
    searchButtonText: { fontSize: scale(16), fontWeight: "700", color: "#FFFFFF" },
    alertButton: {
      width: scale(52),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.full,
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
      borderRadius: borderRadius.xl,
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
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: { elevation: 1 },
      }),
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
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalContent: {
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
      backgroundColor: colors.backgroundTertiary,
      borderRadius: borderRadius.xl,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      height: 44,
      gap: spacing.sm,
    },
    modalSearchInput: { flex: 1, fontSize: scale(15), color: colors.textPrimary },
    modalItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    modalItemText: { fontSize: scale(16), color: colors.textPrimary },
  });

export default SearchScreen;
