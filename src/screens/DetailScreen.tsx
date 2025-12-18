import React from "react";
import {
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBadge } from "../components/index";
import { useProcessesStore } from "../store/processesStore";
import { SecopProcess } from "../types/index";

interface DetailScreenProps {
  route: {
    params: {
      process: SecopProcess;
    };
  };
  navigation: any;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { process } = route.params;
  const { isFavorite, addFavorite, removeFavorite } = useProcessesStore();
  const favorite = isFavorite(process.id_proceso);

  const handleToggleFavorite = () => {
    if (favorite) {
      removeFavorite(process.id_proceso);
    } else {
      addFavorite(process);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Proceso SECOP: ${process.objeto}\nMunicipio: ${
          process.municipio
        }\nValor: $${process.valor_estimado?.toLocaleString("es-CO")}`,
        title: "Compartir Proceso",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const formatCurrency = (value: number) => {
    if (!value) return "No disponible";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No disponible";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRemainingDays = (fechaCierre: string) => {
    if (!fechaCierre) return "N/A";
    const closing = new Date(fechaCierre);
    const today = new Date();
    const diff = closing.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));

    if (days < 0) return "Vencido";
    if (days === 0) return "Vence hoy";
    if (days === 1) return "Vence mañana";
    return `${days} días restantes`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={2}>
          Detalles del Proceso
        </Text>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={styles.favoriteHeaderButton}>
          <Text style={styles.favoriteHeaderIcon}>{favorite ? "★" : "☆"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <View style={styles.mainCard}>
          <StatusBadge status={process.estado_proceso} size="large" />
          <Text style={styles.entidad}>{process.nombre_entidad}</Text>
          <Text style={styles.municipio}>📍 {process.municipio}</Text>
        </View>

        {/* Objeto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objeto de la Contratación</Text>
          <Text style={styles.sectionContent}>{process.objeto}</Text>
        </View>

        {/* Valor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Valor Estimado</Text>
          <Text style={styles.valorText}>
            {formatCurrency(process.valor_estimado)}
          </Text>
        </View>

        {/* Tipo de Proceso */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Proceso</Text>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{process.tipo_proceso}</Text>
          </View>
        </View>

        {/* Fechas Importantes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Fechas Importantes</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Publicado</Text>
              <Text style={styles.dateValue}>
                {formatDate(process.fecha_publicacion)}
              </Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Fecha de Cierre</Text>
              <Text style={styles.dateValue}>
                {formatDate(process.fecha_cierre)}
              </Text>
              <Text
                style={[
                  styles.remainingDays,
                  getRemainingDays(process.fecha_cierre) === "Vencido" && {
                    color: "#EF4444",
                  },
                ]}>
                {getRemainingDays(process.fecha_cierre)}
              </Text>
            </View>
          </View>
        </View>

        {/* Entidad Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entidad Contratante</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NIT</Text>
            <Text style={styles.infoValue}>{process.nit_entidad || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoValue}>{process.nombre_entidad}</Text>
          </View>
        </View>

        {/* ID Proceso */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificador del Proceso</Text>
          <Text style={styles.idText}>{process.id_proceso}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}>
            <Text style={styles.actionButtonText}>📤 Compartir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => {
              // Aquí puedes agregar lógica para ver el proceso en SECOP
              Linking.openURL("https://contratos.gov.co");
            }}>
            <Text style={styles.viewButtonText}>🔗 Ver en SECOP</Text>
          </TouchableOpacity>
        </View>

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginHorizontal: 12,
  },
  favoriteHeaderButton: {
    padding: 8,
  },
  favoriteHeaderIcon: {
    fontSize: 24,
    color: "#F59E0B",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  entidad: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginVertical: 12,
  },
  municipio: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
    fontWeight: "500",
  },
  valorText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#059669",
  },
  typeTag: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    alignSelf: "flex-start",
  },
  typeText: {
    color: "#3B82F6",
    fontSize: 13,
    fontWeight: "600",
  },
  dateRow: {
    marginBottom: 12,
  },
  dateItem: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dateValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
    marginBottom: 4,
  },
  remainingDays: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  idText: {
    fontSize: 12,
    color: "#3B82F6",
    fontFamily: "monospace",
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 6,
    overflow: "hidden",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  viewButton: {
    backgroundColor: "#3B82F6",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    height: 20,
  },
});
