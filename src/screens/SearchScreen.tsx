import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  EmptyState,
  LoadingSpinner,
  MunicipalityFilter,
  ProcessCard,
} from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";

const PROCESS_STATUSES = [
  "Publicado",
  "Adjudicado",
  "Cerrado",
  "En Evaluación",
  "Cancelado",
  "Suspendido",
  "Desierto",
];

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

  const handleSearch = async () => {
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

  const hasActiveFilters = selectedMunicipality || selectedStatus || keyword;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Buscar Procesos</Text>
        <Text style={styles.subtitle}>
          Filtra por municipio, estado o palabra clave
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner visible={true} message="Buscando procesos..." />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <FlatList
            data={[{ id: "filters" }]}
            keyExtractor={(item) => item.id}
            renderItem={() => (
              <View style={styles.filtersContent}>
                {/* Keyword Search */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🔍 Palabra clave</Text>
                  <TextInput
                    style={styles.keywordInput}
                    placeholder="Ej: infraestructura, salud..."
                    placeholderTextColor="#9CA3AF"
                    value={keyword}
                    onChangeText={setKeyword}
                  />
                </View>

                {/* Municipality Filter */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📍 Municipio</Text>
                  <MunicipalityFilter
                    selected={selectedMunicipality}
                    onSelect={setSelectedMunicipality}
                  />
                  {selectedMunicipality && (
                    <View style={styles.selectedTag}>
                      <Text style={styles.selectedTagText}>
                        ✓ {selectedMunicipality}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Status Filter */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📊 Estado del proceso</Text>
                  <View style={styles.statusGrid}>
                    {PROCESS_STATUSES.map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusButton,
                          selectedStatus === status &&
                            styles.statusButtonActive,
                        ]}
                        onPress={() =>
                          setSelectedStatus(
                            selectedStatus === status ? "" : status
                          )
                        }>
                        <Text
                          style={[
                            styles.statusButtonText,
                            selectedStatus === status &&
                              styles.statusButtonTextActive,
                          ]}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>🔍 Buscar</Text>
                  </TouchableOpacity>

                  {hasActiveFilters && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={handleClearFilters}>
                      <Text style={styles.clearButtonText}>
                        Limpiar filtros
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                )}

                {/* Results Header */}
                {processes.length > 0 && (
                  <View style={styles.resultsHeader}>
                    <Text style={styles.resultsTitle}>
                      Resultados ({processes.length})
                    </Text>
                  </View>
                )}
              </View>
            )}
            ListFooterComponent={
              processes.length > 0 ? (
                <FlatList
                  data={processes}
                  keyExtractor={(item) => item.id_del_proceso}
                  renderItem={({ item }) => (
                    <ProcessCard
                      process={item}
                      onPress={() => handleProcessPress(item)}
                    />
                  )}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                />
              ) : hasActiveFilters ? (
                <EmptyState
                  title="Sin resultados"
                  message="No se encontraron procesos con los filtros aplicados"
                  icon="🔍"
                  actionText="Ajustar filtros"
                  onAction={handleClearFilters}
                />
              ) : (
                <EmptyState
                  title="Comienza tu búsqueda"
                  message="Selecciona filtros y presiona 'Buscar' para encontrar procesos"
                  icon="📋"
                />
              )
            }
            scrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#DBEAFE",
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  keywordInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
  },
  selectedTag: {
    marginTop: 8,
    backgroundColor: "#EFF6FF",
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  selectedTagText: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "500",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  statusButtonActive: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  statusButtonText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "500",
  },
  statusButtonTextActive: {
    color: "#FFFFFF",
  },
  buttonsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  searchButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  clearButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  clearButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    marginHorizontal: 0,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "500",
  },
  resultsHeader: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
});
