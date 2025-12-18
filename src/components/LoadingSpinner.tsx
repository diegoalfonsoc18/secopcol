import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LoadingSpinnerProps {
  visible: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible,
  message = "Cargando...",
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#3B82F6" />
      {message && <Text style={styles.text}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
});
