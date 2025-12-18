import React, { useEffect } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { EmptyState, LoadingSpinner, ProcessCard } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { processes, loading, error, fetchRecentProcesses } =
    useProcessesStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchRecentProcesses(7); // Últimos 7 días
  };

  const handleRefresh = async () => {
    await loadData();
  };

  const handleProcessPress = (process: SecopProcess) => {
    navigation.navigate("Detail", { process });
  };

  if (loading && processes.length === 0) {
    return (
      <LoadingSpinner visible={true} message="Cargando procesos recientes..." />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>secopcol</Text>
        <Text style={styles.subtitle}>Procesos de Contratación Pública</Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Processes List */}
      {processes.length > 0 ? (
        <FlatList
          data={processes}
          keyExtractor={(item) => item.id_proceso}
          renderItem={({ item }) => (
            <ProcessCard
              process={item}
              onPress={() => handleProcessPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={["#3B82F6"]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                📅 Últimos 7 días ({processes.length} procesos)
              </Text>
            </View>
          }
        />
      ) : (
        <EmptyState
          title="Sin procesos"
          message="No hay procesos disponibles en los últimos 7 días"
          icon="📭"
          actionText="Recargar"
          onAction={loadData}
        />
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
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#DBEAFE",
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    marginHorizontal: 16,
    marginTop: 12,
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
  listContent: {
    paddingVertical: 12,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
});
