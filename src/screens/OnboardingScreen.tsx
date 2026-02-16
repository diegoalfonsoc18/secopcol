import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { spacing, borderRadius } from "../theme";
import {
  CONTRACT_TYPES,
  ContractTypeConfig,
  getContractTypeColor,
} from "../constants/contractTypes";

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, completeOnboarding } = useAuth();

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const styles = createStyles(colors);

  // Helper para obtener color del tipo
  const getTypeColor = (type: ContractTypeConfig): string => {
    return getContractTypeColor(type);
  };

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  const selectAll = () => {
    if (selectedTypes.length === CONTRACT_TYPES.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(CONTRACT_TYPES.map((t) => t.id));
    }
  };

  const handleContinue = async () => {
    if (selectedTypes.length === 0) return;

    setLoading(true);
    try {
      await completeOnboarding(selectedTypes);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const allSelected = selectedTypes.length === CONTRACT_TYPES.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            ¡Hola, {user?.name?.split(" ")[0]}!
          </Text>
          <Text style={styles.stepIndicator}>Paso 1 de 1</Text>
        </View>
        <Text style={styles.title}>¿Qué tipos de contratos te interesan?</Text>
        <Text style={styles.subtitle}>
          Selecciona los tipos de contratos que quieres ver en tu dashboard.
          Podrás cambiar esto después en ajustes.
        </Text>
      </View>

      {/* Seleccionar todos */}
      <TouchableOpacity style={styles.selectAllButton} onPress={selectAll}>
        <View style={[styles.checkbox, allSelected && styles.checkboxSelected]}>
          {allSelected && (
            <Ionicons
              name="checkmark"
              size={14}
              color={colors.backgroundSecondary}
            />
          )}
        </View>
        <Text style={styles.selectAllText}>
          {allSelected ? "Deseleccionar todos" : "Seleccionar todos"}
        </Text>
      </TouchableOpacity>

      {/* Lista de tipos */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}>
        {CONTRACT_TYPES.map((type) => {
          const isSelected = selectedTypes.includes(type.id);
          const typeColor = getTypeColor(type);

          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                isSelected && styles.typeCardSelected,
                isSelected && { borderColor: typeColor },
              ]}
              onPress={() => toggleType(type.id)}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.typeIcon,
                  { backgroundColor: `${typeColor}15` },
                  isSelected && { backgroundColor: `${typeColor}25` },
                ]}>
                <type.CustomIcon size={24} color={typeColor} />
              </View>

              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>{type.label}</Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
              </View>

              <View
                style={[
                  styles.typeCheckbox,
                  isSelected && {
                    backgroundColor: typeColor,
                    borderColor: typeColor,
                  },
                ]}>
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={colors.backgroundSecondary}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Botón continuar */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.selectionInfo}>
          <Ionicons
            name={
              selectedTypes.length > 0
                ? "checkmark-circle"
                : "information-circle-outline"
            }
            size={20}
            color={
              selectedTypes.length > 0 ? colors.success : colors.textTertiary
            }
          />
          <Text style={styles.selectionText}>
            {selectedTypes.length === 0
              ? "Selecciona al menos un tipo"
              : `${selectedTypes.length} tipo${
                  selectedTypes.length > 1 ? "s" : ""
                } seleccionado${selectedTypes.length > 1 ? "s" : ""}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedTypes.length === 0 && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedTypes.length === 0 || loading}>
          {loading ? (
            <ActivityIndicator color={colors.backgroundSecondary} />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continuar</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.backgroundSecondary}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
    },
    welcomeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    welcomeText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.accent,
    },
    stepIndicator: {
      fontSize: 13,
      color: colors.textTertiary,
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      lineHeight: 22,
    },

    // Select all
    selectAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.separator,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    selectAllText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    // Scroll
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
    },

    // Type card
    typeCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 2,
      borderColor: "transparent",
      gap: spacing.md,
    },
    typeCardSelected: {
      backgroundColor: colors.backgroundSecondary,
    },
    typeIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: "center",
      alignItems: "center",
    },
    typeInfo: {
      flex: 1,
    },
    typeLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    typeDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    typeCheckbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.separator,
      justifyContent: "center",
      alignItems: "center",
    },

    // Footer
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separatorLight,
    },
    selectionInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    selectionText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    continueButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderRadius: borderRadius.md,
      height: 52,
      gap: spacing.sm,
    },
    continueButtonDisabled: {
      backgroundColor: colors.textTertiary,
    },
    continueButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
  });

export default OnboardingScreen;
