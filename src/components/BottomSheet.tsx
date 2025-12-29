// Componente Bottom Sheet reutilizable
import React, { forwardRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import BottomSheetLib, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { spacing, borderRadius } from "../theme";
import { useHaptics } from "../hooks/useHaptics";

interface BottomSheetProps {
  title?: string;
  snapPoints?: (string | number)[];
  children: React.ReactNode;
  onClose?: () => void;
  showHandle?: boolean;
  scrollable?: boolean;
}

export const BottomSheet = forwardRef<BottomSheetLib, BottomSheetProps>(
  (
    {
      title,
      snapPoints: customSnapPoints,
      children,
      onClose,
      showHandle = true,
      scrollable = false,
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const haptics = useHaptics();

    const snapPoints = useMemo(
      () => customSnapPoints || ["50%", "80%"],
      [customSnapPoints]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === 0) {
          haptics.light();
        }
        if (index === -1) {
          onClose?.();
        }
      },
      [haptics, onClose]
    );

    const styles = createStyles(colors);

    const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <BottomSheetLib
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        style={styles.sheet}>
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={() => {
                haptics.light();
                (ref as any)?.current?.close();
              }}
              style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        <ContentWrapper
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}>
          {children}
        </ContentWrapper>
      </BottomSheetLib>
    );
  }
);

BottomSheet.displayName = "BottomSheet";

// ============================================
// COMPONENTES AUXILIARES PARA FILTROS
// ============================================

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  color?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
  icon,
  color,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const styles = createStyles(colors);

  const handlePress = () => {
    haptics.selection();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        selected && color && { backgroundColor: color, borderColor: color },
      ]}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={
            selected
              ? colors.backgroundSecondary
              : color || colors.textSecondary
          }
        />
      )}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={16}
          color={colors.backgroundSecondary}
        />
      )}
    </Pressable>
  );
};

interface FilterOptionProps {
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
}

export const FilterOption: React.FC<FilterOptionProps> = ({
  label,
  sublabel,
  selected,
  onPress,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const styles = createStyles(colors);

  const handlePress = () => {
    haptics.selection();
    onPress();
  };

  return (
    <TouchableOpacity style={styles.option} onPress={handlePress}>
      <View style={styles.optionContent}>
        <Text style={styles.optionLabel}>{label}</Text>
        {sublabel && <Text style={styles.optionSublabel}>{sublabel}</Text>}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

interface FilterButtonsProps {
  onApply: () => void;
  onClear: () => void;
  applyLabel?: string;
  clearLabel?: string;
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  onApply,
  onClear,
  applyLabel = "Aplicar filtros",
  clearLabel = "Limpiar",
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  const styles = createStyles(colors);

  return (
    <View style={styles.buttonsRow}>
      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => {
          haptics.light();
          onClear();
        }}>
        <Text style={styles.clearButtonText}>{clearLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => {
          haptics.medium();
          onApply();
        }}>
        <Text style={styles.applyButtonText}>{applyLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    sheet: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 16,
    },
    background: {
      backgroundColor: colors.backgroundSecondary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    handleIndicator: {
      backgroundColor: colors.separator,
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.xs,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },

    // Section
    section: {
      marginTop: spacing.lg,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },

    // Chips
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.separatorLight,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    chipTextSelected: {
      color: colors.backgroundSecondary,
    },

    // Options (radio style)
    option: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
    },
    optionContent: {
      flex: 1,
    },
    optionLabel: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    optionSublabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.separator,
      alignItems: "center",
      justifyContent: "center",
    },
    radioSelected: {
      borderColor: colors.accent,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accent,
    },

    // Buttons
    buttonsRow: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.separatorLight,
    },
    clearButton: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.background,
      alignItems: "center",
    },
    clearButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    applyButton: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.accent,
      alignItems: "center",
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },
  });

export default BottomSheet;
