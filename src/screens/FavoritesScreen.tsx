import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState, ProcessCard } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";

export const FavoritesScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { favorites, removeFavorite } = useProcessesStore();

  const handleProcessPress = (process: SecopProcess) => {
    navigation.navigate("Detail", { process });
  };

  const handleRemoveFavorite = (processId: string) => {
    removeFavorite(processId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Favoritos</Text>
        <Text style={styles.subtitle}>
          Procesos que guardaste para seguimiento
        </Text>
      </View>

      {/* Favorites List */}
      {favorites.length > 0 ? (
        <View style={styles.listContainer}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>⭐ {favorites.length}</Text>
          </View>
          <FlatList
            data={favorites}
            keyExtractor={(item) => item.id_proceso}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <ProcessCard
                  process={item}
                  onPress={() => handleProcessPress(item)}
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFavorite(item.id_proceso)}>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : (
        <EmptyState
          title="Sin favoritos"
          message="Guarda procesos como favoritos presionando la estrella para seguir su progreso"
          icon="⭐"
          actionText="Ir a Buscar"
          onAction={() => navigation.navigate("Search")}
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
    paddingBottom: 16,
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
  listContainer: {
    flex: 1,
  },
  countBadge: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  countText: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "600",
  },
  listContent: {
    paddingVertical: 8,
  },
  cardWrapper: {
    position: "relative",
  },
  removeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FEE2E2",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  removeIcon: {
    fontSize: 18,
    color: "#EF4444",
    fontWeight: "700",
  },
});
