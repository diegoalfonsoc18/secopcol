// Bottom Sheet de Filtros para Búsqueda
import React, { forwardRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import BottomSheetLib from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheet,
  FilterSection,
  FilterChip,
  FilterButtons,
} from "./BottomSheet";
import { useTheme } from "../context/ThemeContext";
import { spacing } from "../theme";

// Configuración de filtros
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

const TIPOS_CONTRATO = [
  { id: "obra", label: "Obra", icon: "construct-outline", color: "#FF9500" },
  {
    id: "servicios",
    label: "Servicios",
    icon: "briefcase-outline",
    color: "#007AFF",
  },
  {
    id: "suministro",
    label: "Suministro",
    icon: "cube-outline",
    color: "#34C759",
  },
  {
    id: "consultoria",
    label: "Consultoría",
    icon: "bulb-outline",
    color: "#5856D6",
  },
  {
    id: "compraventa",
    label: "Compraventa",
    icon: "cart-outline",
    color: "#FF2D55",
  },
  {
    id: "interventoria",
    label: "Interventoría",
    icon: "eye-outline",
    color: "#AF52DE",
  },
  {
    id: "arrendamiento",
    label: "Arrendamiento",
    icon: "home-outline",
    color: "#00C7BE",
  },
  {
    id: "concesion",
    label: "Concesión",
    icon: "key-outline",
    color: "#FF9F0A",
  },
];

const FASES = [
  { id: "borrador", label: "Borrador" },
  { id: "planeacion", label: "Planeación" },
  { id: "seleccion", label: "Selección" },
  { id: "contratacion", label: "Contratación" },
  { id: "ejecucion", label: "Ejecución" },
  { id: "terminado", label: "Terminado" },
];

export interface SearchFilters {
  modalidad: string;
  tipoContrato: string;
  fase: string;
}

interface FilterBottomSheetProps {
  initialFilters?: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClear: () => void;
}

export const FilterBottomSheet = forwardRef<
  BottomSheetLib,
  FilterBottomSheetProps
>(({ initialFilters, onApply, onClear }, ref) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Estado local de filtros
  const [modalidad, setModalidad] = useState(initialFilters?.modalidad || "");
  const [tipoContrato, setTipoContrato] = useState(
    initialFilters?.tipoContrato || ""
  );
  const [fase, setFase] = useState(initialFilters?.fase || "");

  // Sincronizar con filtros externos
  useEffect(() => {
    if (initialFilters) {
      setModalidad(initialFilters.modalidad || "");
      setTipoContrato(initialFilters.tipoContrato || "");
      setFase(initialFilters.fase || "");
    }
  }, [initialFilters]);

  // Contar filtros activos
  const activeCount = [modalidad, tipoContrato, fase].filter(Boolean).length;

  const handleApply = () => {
    onApply({ modalidad, tipoContrato, fase });
    (ref as any)?.current?.close();
  };

  const handleClear = () => {
    setModalidad("");
    setTipoContrato("");
    setFase("");
    onClear();
  };

  return (
    <BottomSheet
      ref={ref}
      title="Filtros"
      snapPoints={["70%", "90%"]}
      scrollable>
      {/* Resumen de filtros activos */}
      {activeCount > 0 && (
        <View style={styles.activeFiltersBar}>
          <Ionicons name="filter" size={16} color={colors.accent} />
          <Text style={styles.activeFiltersText}>
            {activeCount} filtro{activeCount > 1 ? "s" : ""} activo
            {activeCount > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Modalidad de contratación */}
      <FilterSection title="Modalidad de contratación">
        <View style={styles.chipsContainer}>
          {MODALIDADES.map((mod) => (
            <FilterChip
              key={mod.id}
              label={mod.label}
              selected={modalidad === mod.id}
              onPress={() => setModalidad(modalidad === mod.id ? "" : mod.id)}
            />
          ))}
        </View>
      </FilterSection>

      {/* Tipo de contrato */}
      <FilterSection title="Tipo de contrato">
        <View style={styles.chipsContainer}>
          {TIPOS_CONTRATO.map((tipo) => (
            <FilterChip
              key={tipo.id}
              label={tipo.label}
              selected={tipoContrato === tipo.id}
              onPress={() =>
                setTipoContrato(tipoContrato === tipo.id ? "" : tipo.id)
              }
              icon={tipo.icon}
              color={tipo.color}
            />
          ))}
        </View>
      </FilterSection>

      {/* Fase del proceso */}
      <FilterSection title="Fase del proceso">
        <View style={styles.chipsContainer}>
          {FASES.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              selected={fase === f.id}
              onPress={() => setFase(fase === f.id ? "" : f.id)}
            />
          ))}
        </View>
      </FilterSection>

      {/* Botones */}
      <FilterButtons
        onApply={handleApply}
        onClear={handleClear}
        applyLabel={`Aplicar${activeCount > 0 ? ` (${activeCount})` : ""}`}
      />
    </BottomSheet>
  );
});

FilterBottomSheet.displayName = "FilterBottomSheet";

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    activeFiltersBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accentLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    activeFiltersText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: "500",
    },
    chipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
  });

export default FilterBottomSheet;
