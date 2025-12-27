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
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ProcessCard, SearchResultsSkeleton } from "../components/index";
import { SecopProcess, advancedSearch } from "../api/secop";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { exportSearchResults } from "../services/exportService";
import {
  COLOMBIAN_DEPARTMENTS,
  MUNICIPALITIES_BY_DEPARTMENT,
} from "../types/index";

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
  const scrollY = useRef(new Animated.Value(0)).current;

  const styles = createStyles(colors);

  // Estados de filtros
  const [keyword, setKeyword] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");

  // Estados de modales
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showMuniModal, setShowMuniModal] = useState(false);

  // Estados de resultados
  const [processes, setProcesses] = useState<SecopProcess[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Municipios filtrados
  const municipios = useMemo(() => {
    if (!selectedDepartamento) return [];
    return MUNICIPALITIES_BY_DEPARTMENT[selectedDepartamento] || [];
  }, [selectedDepartamento]);

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
  };

  // Seleccionar municipio
  const handleSelectMuni = (muni: string) => {
    setSelectedMunicipio(muni);
    setShowMuniModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Buscar</Text>

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
            onPress={() => setShowDeptModal(true)}>
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
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationButton,
              selectedMunicipio && styles.locationButtonActive,
              !selectedDepartamento && styles.locationButtonDisabled,
            ]}
            onPress={() => selectedDepartamento && setShowMuniModal(true)}
            disabled={!selectedDepartamento}>
            <Ionicons
              name="business-outline"
              size={16}
              color={selectedMunicipio ? colors.accent : colors.textSecondary}
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
          </TouchableOpacity>
        </View>

        {/* Modalidad */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {MODALIDADES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.chip,
                  selectedModalidad === item.id && styles.chipActive,
                ]}
                onPress={() =>
                  setSelectedModalidad((prev) =>
                    prev === item.id ? "" : item.id
                  )
                }>
                <Text
                  style={[
                    styles.chipText,
                    selectedModalidad === item.id && styles.chipTextActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Tipo */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {TIPOS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.chip,
                  selectedTipo === item.id && styles.chipActive,
                ]}
                onPress={() =>
                  setSelectedTipo((prev) => (prev === item.id ? "" : item.id))
                }>
                <Text
                  style={[
                    styles.chipText,
                    selectedTipo === item.id && styles.chipTextActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Botones */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.backgroundSecondary}
              />
            ) : (
              <>
                <Ionicons
                  name="search"
                  size={18}
                  color={colors.backgroundSecondary}
                />
                <Text style={styles.searchButtonText}>Buscar</Text>
              </>
            )}
          </TouchableOpacity>

          {(activeFilters > 0 || keyword) && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Resultados */}
      <ScrollView
        style={styles.results}
        contentContainerStyle={[
          styles.resultsContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && <SearchResultsSkeleton count={5} />}

        {!loading && processes.length > 0 && (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
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
                    <Text style={styles.exportButtonText}>CSV</Text>
                  </>
                )}
              </TouchableOpacity>
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
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptyText}>Intenta con otros filtros</Text>
          </View>
        )}

        {!loading && !hasSearched && (
          <View style={styles.emptyState}>
            <Ionicons
              name="filter-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>Configura tu búsqueda</Text>
            <Text style={styles.emptyText}>
              Usa los filtros y presiona buscar
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal Departamento */}
      <Modal
        visible={showDeptModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Departamento</Text>
            <TouchableOpacity onPress={() => setShowDeptModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COLOMBIAN_DEPARTMENTS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedDepartamento === item && styles.modalItemActive,
                ]}
                onPress={() => handleSelectDept(item)}>
                <Text
                  style={[
                    styles.modalItemText,
                    selectedDepartamento === item && styles.modalItemTextActive,
                  ]}>
                  {item}
                </Text>
                {selectedDepartamento === item && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Modal Municipio */}
      <Modal
        visible={showMuniModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Municipio</Text>
            <TouchableOpacity onPress={() => setShowMuniModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={municipios}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  selectedMunicipio === item && styles.modalItemActive,
                ]}
                onPress={() => handleSelectMuni(item)}>
                <Text
                  style={[
                    styles.modalItemText,
                    selectedMunicipio === item && styles.modalItemTextActive,
                  ]}>
                  {item}
                </Text>
                {selectedMunicipio === item && (
                  <Ionicons name="checkmark" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyList}>
                Selecciona un departamento primero
              </Text>
            }
          />
        </View>
      </Modal>
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
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    title: {
      fontSize: 34,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },

    // Search bar
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

    // Location
    locationRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    locationButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      height: 40,
      gap: spacing.xs,
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

    // Chips
    chipScroll: {
      marginBottom: spacing.sm,
    },
    chipRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.backgroundSecondary,
    },
    chipActive: {
      backgroundColor: colors.accent,
    },
    chipText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.backgroundSecondary,
    },

    // Actions
    actionRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    searchButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderRadius: borderRadius.md,
      height: 44,
      gap: spacing.sm,
    },
    searchButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
    clearButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.lg,
      height: 44,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },

    // Results
    results: {
      flex: 1,
    },
    resultsContent: {
      padding: spacing.lg,
    },
    resultsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    resultsTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    exportButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
    },
    exportButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.accent,
    },

    // Error & Empty
    errorCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.dangerLight,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: colors.danger,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: spacing.xxl * 2,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
    },

    // Modal
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    modalItemActive: {
      backgroundColor: colors.accentLight,
    },
    modalItemText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    modalItemTextActive: {
      color: colors.accent,
      fontWeight: "600",
    },
    emptyList: {
      textAlign: "center",
      color: colors.textTertiary,
      padding: spacing.xl,
    },
  });

export default SearchScreen;
