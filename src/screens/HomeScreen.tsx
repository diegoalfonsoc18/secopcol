import React, { useEffect } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingSpinner, ProcessCard, EmptyState } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { processes, loading, fetchRecentProcesses } = useProcessesStore();

  useEffect(() => {
    fetchRecentProcesses();
  }, []);

  const handleProcessPress = (process: SecopProcess) => {
    navigation.navigate("Detail", { process });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>📋 Procesos SECOP II</Text>
        <Text style={styles.subtitle}>Últimos procesos de contratación</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner visible={true} message="Cargando procesos..." />
        </View>
      ) : processes.length > 0 ? (
        <FlatList
          data={processes}
          keyExtractor={(item) => item.id_del_proceso}
          renderItem={({ item }) => (
            <ProcessCard
              process={item}
              onPress={() => handleProcessPress(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          scrollIndicatorInsets={{ right: 1 }}
        />
      ) : (
        <View style={styles.centerContainer}>
          <EmptyState
            title="Sin procesos"
            message="No hay procesos disponibles en este momento"
            icon="📭"
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
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
