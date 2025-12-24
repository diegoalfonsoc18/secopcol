import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ProcessCard, EmptyState } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";

export const FavoritesScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.title}>⭐ Favoritos</Text>
        <Text style={styles.subtitle}>Procesos guardados</Text>
      </View>

      {/* Content */}
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id_del_proceso}
          renderItem={({ item }) => (
            <View style={styles.favoriteItem}>
              <ProcessCard
                process={item}
                onPress={() => handleProcessPress(item)}
              />
              <Text
                style={styles.removeText}
                onPress={() => handleRemoveFavorite(item.id_del_proceso)}>
                Eliminar ✕
              </Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.centerContainer}>
          <EmptyState
            title="Sin favoritos"
            message="Guarda procesos para acceder rápidamente"
            icon="☆"
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
  favoriteItem: {
    marginBottom: 12,
  },
  removeText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "right",
    paddingHorizontal: 16,
  },
});
