// Bottom Sheet de Ubicación (Departamento/Municipio)
import React, { forwardRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import BottomSheetLib from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "./BottomSheet";
import { useTheme } from "../context/ThemeContext";
import { spacing, borderRadius } from "../theme";
import { useHaptics } from "../hooks/useHaptics";
import {
  getDepartments,
  getMunicipalities,
  searchMunicipalities,
} from "../services/divipola";

interface LocationBottomSheetProps {
  onSelectLocation: (departamento: string, municipio?: string) => void;
  initialDepartamento?: string;
  initialMunicipio?: string;
}

export const LocationBottomSheet = forwardRef<
  BottomSheetLib,
  LocationBottomSheetProps
>(({ onSelectLocation, initialDepartamento, initialMunicipio }, ref) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const styles = createStyles(colors);

  // Estados
  const [searchText, setSearchText] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<
    { nom_mpio: string; dpto: string }[]
  >([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(
    initialDepartamento || null
  );
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingMunis, setLoadingMunis] = useState(false);
  const [searching, setSearching] = useState(false);

  // Cargar departamentos
  useEffect(() => {
    const loadDepts = async () => {
      setLoadingDepts(true);
      const data = await getDepartments();
      setDepartments(data);
      setLoadingDepts(false);
    };
    loadDepts();
  }, []);

  // Cargar municipios cuando cambia departamento
  useEffect(() => {
    if (!selectedDept) {
      setMunicipalities([]);
      return;
    }
    const loadMunis = async () => {
      setLoadingMunis(true);
      const data = await getMunicipalities(selectedDept);
      setMunicipalities(data);
      setLoadingMunis(false);
    };
    loadMunis();
  }, [selectedDept]);

  // Buscar en toda Colombia
  useEffect(() => {
    if (searchText.length < 2 || selectedDept) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const results = await searchMunicipalities(searchText);
      setSearchResults(
        results.map((r) => ({ nom_mpio: r.nom_mpio, dpto: r.dpto }))
      );
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchText, selectedDept]);

  // Seleccionar departamento
  const handleSelectDept = (dept: string) => {
    haptics.selection();
    if (selectedDept === dept) {
      setSelectedDept(null);
    } else {
      setSelectedDept(dept);
      setSearchText("");
    }
  };

  // Seleccionar municipio
  const handleSelectMuni = (muni: string, dept?: string) => {
    haptics.success();
    onSelectLocation(dept || selectedDept || "", muni);
    (ref as any)?.current?.close();
  };

  // Seleccionar solo departamento
  const handleSelectDeptOnly = () => {
    if (selectedDept) {
      haptics.success();
      onSelectLocation(selectedDept, "");
      (ref as any)?.current?.close();
    }
  };

  // Limpiar selección
  const handleClear = () => {
    haptics.light();
    setSelectedDept(null);
    setSearchText("");
    onSelectLocation("", "");
    (ref as any)?.current?.close();
  };

  // Filtrar municipios localmente
  const filteredMunicipalities =
    searchText && selectedDept
      ? municipalities.filter((m) =>
          m.toLowerCase().includes(searchText.toLowerCase())
        )
      : municipalities;

  // Datos a mostrar
  const listData =
    !selectedDept && searchText.length >= 2
      ? searchResults.map((r) => ({
          id: `${r.dpto}-${r.nom_mpio}`,
          name: r.nom_mpio,
          subtitle: r.dpto,
        }))
      : selectedDept
      ? filteredMunicipalities.map((m) => ({
          id: `${selectedDept}-${m}`,
          name: m,
          subtitle: selectedDept,
        }))
      : [];

  return (
    <BottomSheet ref={ref} title="Ubicación" snapPoints={["70%", "90%"]}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            selectedDept
              ? `Buscar en ${selectedDept}...`
              : "Buscar municipio en Colombia..."
          }
          placeholderTextColor={colors.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Departamento seleccionado */}
      {selectedDept && (
        <View style={styles.selectedDeptBanner}>
          <Ionicons name="location" size={18} color={colors.accent} />
          <Text style={styles.selectedDeptText}>{selectedDept}</Text>
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              setSelectedDept(null);
            }}
            style={styles.clearDeptBtn}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.selectDeptBtn}
            onPress={handleSelectDeptOnly}>
            <Text style={styles.selectDeptBtnText}>Solo depto.</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de departamentos (horizontal) */}
      {!selectedDept && !searchText && (
        <>
          <Text style={styles.sectionLabel}>Departamentos</Text>
          {loadingDepts ? (
            <ActivityIndicator style={styles.loader} color={colors.accent} />
          ) : (
            <FlatList
              horizontal
              data={departments}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.deptList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deptChip}
                  onPress={() => handleSelectDept(item)}>
                  <Text style={styles.deptChipText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* Hint */}
      {!selectedDept && searchText.length === 0 && (
        <Text style={styles.hint}>
          Selecciona un departamento o escribe para buscar en toda Colombia
        </Text>
      )}

      {/* Loading */}
      {(loadingMunis || searching) && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loaderText}>
            {searching ? "Buscando..." : "Cargando municipios..."}
          </Text>
        </View>
      )}

      {/* Lista de municipios */}
      {!loadingMunis && !searching && listData.length > 0 && (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          style={styles.muniList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.muniItem}
              onPress={() => handleSelectMuni(item.name, item.subtitle)}>
              <View style={styles.muniInfo}>
                <Text style={styles.muniName}>{item.name}</Text>
                <Text style={styles.muniDept}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron resultados</Text>
          }
        />
      )}

      {/* Botón limpiar */}
      {(initialDepartamento || initialMunicipio) && (
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.clearBtnText}>Limpiar ubicación</Text>
        </TouchableOpacity>
      )}
    </BottomSheet>
  );
});

LocationBottomSheet.displayName = "LocationBottomSheet";

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      height: 44,
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    selectedDeptBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    selectedDeptText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.accent,
    },
    clearDeptBtn: {
      padding: 2,
    },
    selectDeptBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    selectDeptBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    deptList: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    deptChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.separatorLight,
    },
    deptChipText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    hint: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: "center",
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    loader: {
      marginVertical: spacing.lg,
    },
    loaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    loaderText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    muniList: {
      marginTop: spacing.md,
      flex: 1,
    },
    muniItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    muniInfo: {
      flex: 1,
    },
    muniName: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    muniDept: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textTertiary,
      textAlign: "center",
      marginTop: spacing.xl,
    },
    clearBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    clearBtnText: {
      fontSize: 15,
      color: colors.danger,
      fontWeight: "500",
    },
  });

export default LocationBottomSheet;
