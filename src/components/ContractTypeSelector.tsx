import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { spacing, borderRadius, colors as themeColors } from "../theme";
import { useHaptics } from "../hooks/useHaptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ============================================
// TIPOS DE CONTRATO DISPONIBLES
// ============================================
const CONTRACT_TYPES = [
  {
    id: "Obra",
    label: "Obra",
    description: "Construcción, infraestructura",
    icon: "construct-outline",
    color: themeColors.warning,
  },
  {
    id: "Consultoría",
    label: "Consultoría",
    description: "Estudios, asesorías, diseños",
    icon: "bulb-outline",
    color: "#5856D6",
  },
  {
    id: "Prestación de servicios",
    label: "Prestación de Servicios",
    description: "Servicios profesionales",
    icon: "briefcase-outline",
    color: themeColors.accent,
  },
  {
    id: "Suministro",
    label: "Suministro",
    description: "Entrega periódica de bienes",
    icon: "cube-outline",
    color: themeColors.success,
  },
  {
    id: "Compraventa",
    label: "Compraventa",
    description: "Adquisición de bienes",
    icon: "cart-outline",
    color: themeColors.danger,
  },
  {
    id: "Interventoría",
    label: "Interventoría",
    description: "Supervisión de contratos",
    icon: "eye-outline",
    color: "#AF52DE",
  },
  {
    id: "Arrendamiento",
    label: "Arrendamiento",
    description: "Alquiler de bienes",
    icon: "home-outline",
    color: themeColors.success,
  },
  {
    id: "Concesión",
    label: "Concesión",
    description: "Explotación de servicios",
    icon: "key-outline",
    color: themeColors.warning,
  },
];

interface ContractTypeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export const ContractTypeSelector: React.FC<ContractTypeSelectorProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { preferences, updatePreferences } = useAuth();
  const haptics = useHaptics();

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Animaciones nativas
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const styles = createStyles(colors);

  // Sincronizar con preferencias cuando se abre
  useEffect(() => {
    if (visible) {
      setSelectedTypes(preferences.selectedContractTypes || []);
      setHasChanges(false);

      // Animar entrada
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, preferences.selectedContractTypes]);

  const handleClose = () => {
    haptics.light();

    // Animar salida
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        damping: 20,
        stiffness: 90,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const toggleType = (typeId: string) => {
    haptics.selection();
    setSelectedTypes((prev) => {
      const newSelection = prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId];

      // Verificar si hay cambios
      const originalSet = new Set(preferences.selectedContractTypes || []);
      const newSet = new Set(newSelection);
      const changed =
        originalSet.size !== newSet.size ||
        [...originalSet].some((x) => !newSet.has(x));
      setHasChanges(changed);

      return newSelection;
    });
  };

  const selectAll = () => {
    haptics.medium();
    if (selectedTypes.length === CONTRACT_TYPES.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(CONTRACT_TYPES.map((t) => t.id));
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      handleClose();
      return;
    }

    setLoading(true);
    haptics.success();

    try {
      await updatePreferences({ selectedContractTypes: selectedTypes });
      handleClose();
    } catch (error) {
      console.error("Error updating preferences:", error);
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const allSelected = selectedTypes.length === CONTRACT_TYPES.length;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="options-outline"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.title}>Tipos de Contrato</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Selecciona los tipos que quieres ver en tu dashboard
          </Text>

          {/* Select All */}
          <TouchableOpacity style={styles.selectAllButton} onPress={selectAll}>
            <View
              style={[styles.checkbox, allSelected && styles.checkboxSelected]}>
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
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {selectedTypes.length}/{CONTRACT_TYPES.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Lista de tipos */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {CONTRACT_TYPES.map((type) => {
              const isSelected = selectedTypes.includes(type.id);

              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    isSelected && styles.typeCardSelected,
                    isSelected && { borderColor: type.color },
                  ]}
                  onPress={() => toggleType(type.id)}
                  activeOpacity={0.7}>
                  <View
                    style={[
                      styles.typeIcon,
                      { backgroundColor: `${type.color}15` },
                      isSelected && { backgroundColor: `${type.color}25` },
                    ]}>
                    <Ionicons
                      name={type.icon as any}
                      size={20}
                      color={type.color}
                    />
                  </View>

                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeDescription} numberOfLines={1}>
                      {type.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.typeCheckbox,
                      isSelected && {
                        backgroundColor: type.color,
                        borderColor: type.color,
                      },
                    ]}>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.backgroundSecondary}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer con botón guardar */}
          <View style={styles.footer}>
            {hasChanges && (
              <View style={styles.changeIndicator}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={colors.accent}
                />
                <Text style={styles.changeText}>
                  Tienes cambios sin guardar
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                !hasChanges && styles.saveButtonSecondary,
              ]}
              onPress={handleSave}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.backgroundSecondary} />
              ) : (
                <>
                  <Ionicons
                    name={hasChanges ? "checkmark-circle" : "close-circle"}
                    size={20}
                    color={
                      hasChanges
                        ? colors.backgroundSecondary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.saveButtonText,
                      !hasChanges && styles.saveButtonTextSecondary,
                    ]}>
                    {hasChanges ? "Guardar cambios" : "Cerrar"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      maxHeight: "85%",
    },
    handleContainer: {
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.separator,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xs,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: "center",
      alignItems: "center",
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    selectAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
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
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    countBadge: {
      backgroundColor: colors.backgroundTertiary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    countText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    scrollView: {
      maxHeight: 350,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    typeCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 2,
      borderColor: "transparent",
      gap: spacing.md,
    },
    typeCardSelected: {
      backgroundColor: colors.backgroundSecondary,
    },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    typeInfo: {
      flex: 1,
    },
    typeLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    typeDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    typeCheckbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.separator,
      justifyContent: "center",
      alignItems: "center",
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.separatorLight,
    },
    changeIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    changeText: {
      fontSize: 13,
      color: colors.accent,
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accent,
      borderRadius: borderRadius.md,
      height: 48,
      gap: spacing.sm,
    },
    saveButtonSecondary: {
      backgroundColor: colors.backgroundSecondary,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
    saveButtonTextSecondary: {
      color: colors.textSecondary,
    },
  });

export default ContractTypeSelector;
