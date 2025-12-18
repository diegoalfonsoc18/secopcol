import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLOMBIAN_MUNICIPALITIES } from "../types/index";

interface MunicipalityFilterProps {
  selected?: string;
  onSelect: (municipality: string) => void;
}

export const MunicipalityFilter: React.FC<MunicipalityFilterProps> = ({
  selected,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredMunicipalities = COLOMBIAN_MUNICIPALITIES.filter((m) =>
    m.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelect = (municipality: string) => {
    onSelect(municipality);
    setModalVisible(false);
    setSearchText("");
  };

  return (
    <>
      {/* Button to open modal */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>
          {selected || "Seleccionar municipio"}
        </Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Municipios de Colombia</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar municipio..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              clearButtonMode="while-editing"
            />

            {/* Municipality List */}
            <ScrollView style={styles.listContainer}>
              {filteredMunicipalities.length > 0 ? (
                filteredMunicipalities.map((municipality) => (
                  <TouchableOpacity
                    key={municipality}
                    style={[
                      styles.municipalityItem,
                      selected === municipality && styles.selectedItem,
                    ]}
                    onPress={() => handleSelect(municipality)}>
                    <Text
                      style={[
                        styles.municipalityText,
                        selected === municipality &&
                          styles.selectedMunicipalityText,
                      ]}>
                      {municipality}
                    </Text>
                    {selected === municipality && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResults}>
                  No se encontraron municipios
                </Text>
              )}
            </ScrollView>

            {/* Clear Selection Button */}
            {selected && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  onSelect("");
                  setModalVisible(false);
                }}>
                <Text style={styles.clearButtonText}>Limpiar selección</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  buttonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeButton: {
    fontSize: 24,
    color: "#6B7280",
    padding: 8,
  },
  searchInput: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    fontSize: 14,
    color: "#1F2937",
  },
  listContainer: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  municipalityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  selectedItem: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  municipalityText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  selectedMunicipalityText: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 18,
    color: "#3B82F6",
    fontWeight: "700",
  },
  noResults: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 14,
    paddingVertical: 20,
  },
  clearButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 12,
  },
  clearButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
