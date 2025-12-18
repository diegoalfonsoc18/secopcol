import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";

interface ProcessCardProps {
  process: SecopProcess;
  onPress?: () => void;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({
  process,
  onPress,
}) => {
  const { isFavorite, addFavorite, removeFavorite } = useProcessesStore();
  const favorite = isFavorite(process.id_proceso);

  const handleToggleFavorite = () => {
    if (favorite) {
      removeFavorite(process.id_proceso);
    } else {
      addFavorite(process);
    }
  };

  const formatCurrency = (value: number) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "publicado":
        return "#3B82F6"; // Blue
      case "adjudicado":
        return "#10B981"; // Green
      case "cerrado":
        return "#6B7280"; // Gray
      case "en evaluación":
        return "#F59E0B"; // Amber
      case "cancelado":
        return "#EF4444"; // Red
      default:
        return "#8B5CF6"; // Purple
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.entity} numberOfLines={1}>
            {process.nombre_entidad}
          </Text>
          <Text style={styles.municipality}>{process.municipio}</Text>
        </View>
        <Pressable onPress={handleToggleFavorite} style={styles.favoriteButton}>
          <Text style={styles.favoriteIcon}>{favorite ? "★" : "☆"}</Text>
        </Pressable>
      </View>

      {/* Objeto */}
      <Text style={styles.objeto} numberOfLines={2}>
        {process.objeto}
      </Text>

      {/* Status y Valor */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(process.estado_proceso) },
          ]}>
          <Text style={styles.statusText}>{process.estado_proceso}</Text>
        </View>
        <Text style={styles.valor}>
          {formatCurrency(process.valor_estimado)}
        </Text>
      </View>

      {/* Fechas */}
      <View style={styles.footer}>
        <Text style={styles.date}>
          Publicado: {formatDate(process.fecha_publicacion)}
        </Text>
        <Text style={styles.date}>
          Cierre: {formatDate(process.fecha_cierre)}
        </Text>
      </View>

      {/* Tipo de proceso */}
      <Text style={styles.type}>{process.tipo_proceso}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  entity: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  municipality: {
    fontSize: 12,
    color: "#6B7280",
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 20,
    color: "#F59E0B",
  },
  objeto: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  valor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    marginBottom: 8,
  },
  date: {
    fontSize: 11,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  type: {
    fontSize: 11,
    color: "#6366F1",
    fontWeight: "500",
  },
});
