// src/components/ObligationFormModal.tsx
// Modal bottom-sheet para crear/editar obligaciones tributarias

import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../context/ThemeContext";
import { spacing, borderRadius, scale, typography } from "../theme";
import { ObligationType, ContractObligation } from "../types/database";
import { OBLIGATION_TYPE_CONFIG } from "../services/obligationService";
import { useHaptics } from "../hooks/useHaptics";

// ============================================
// TIPOS
// ============================================
interface ObligationFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: ObligationFormData) => Promise<void>;
  processId?: string;
  processName?: string;
  editObligation?: ContractObligation | null;
}

export interface ObligationFormData {
  obligation_type: ObligationType;
  title: string;
  description: string;
  due_date: string;
  estimated_amount: string;
  notes: string;
  process_id: string;
  process_name: string;
}

// ============================================
// CONSTANTES
// ============================================
const OBLIGATION_TYPES: { type: ObligationType; label: string; icon: string; color: string }[] = [
  { type: "estampilla", label: "Estampilla", icon: "receipt-outline", color: "#06923E" },
  { type: "retencion", label: "Retencion", icon: "cash-outline", color: "#FF9500" },
  { type: "seguridad_social", label: "Seg. Social", icon: "shield-checkmark-outline", color: "#5856D6" },
  { type: "informe", label: "Informe", icon: "document-text-outline", color: "#007AFF" },
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ObligationFormModal: React.FC<ObligationFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  processId = "",
  processName = "",
  editObligation,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const styles = createStyles(colors);

  const isEditing = !!editObligation;

  // Form state
  const [type, setType] = useState<ObligationType>("estampilla");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Inicializar con datos de edicion
  useEffect(() => {
    if (editObligation) {
      setType(editObligation.obligation_type);
      setTitle(editObligation.title);
      setDescription(editObligation.description || "");
      setDueDate(editObligation.due_date);
      setAmount(editObligation.estimated_amount?.toString() || "");
      setNotes(editObligation.notes || "");
    } else {
      resetForm();
    }
  }, [editObligation, visible]);

  const resetForm = () => {
    setType("estampilla");
    setTitle("");
    setDescription("");
    setDueDate("");
    setAmount("");
    setNotes("");
  };

  const isValid = title.trim().length > 0 && dueDate.trim().length > 0;

  const handleSubmit = useCallback(async () => {
    if (!isValid || submitting) return;

    // Validar formato de fecha YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dueDate.trim())) {
      Alert.alert("Fecha invalida", "Usa el formato AAAA-MM-DD (ej: 2026-03-15)");
      return;
    }

    setSubmitting(true);
    haptics.medium();

    try {
      await onSubmit({
        obligation_type: type,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate.trim(),
        estimated_amount: amount.trim(),
        notes: notes.trim(),
        process_id: processId,
        process_name: processName,
      });
      resetForm();
      onClose();
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar la obligacion");
    } finally {
      setSubmitting(false);
    }
  }, [isValid, submitting, type, title, description, dueDate, amount, notes, processId, processName, onSubmit, onClose, haptics]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? "Editar obligacion" : "Nueva obligacion"}
          </Text>
          <AnimatedPressable
            onPress={handleSubmit}
            disabled={!isValid || submitting}
            hapticType="medium"
            style={[
              styles.saveButton,
              isValid && { backgroundColor: colors.accent },
            ]}>
            <Text
              style={[
                styles.saveText,
                isValid && { color: "#FFFFFF" },
              ]}>
              {submitting ? "..." : "Guardar"}
            </Text>
          </AnimatedPressable>
        </View>

        <ScrollView
          style={styles.form}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
          keyboardShouldPersistTaps="handled">

          {/* Tipo de obligacion */}
          <Text style={styles.label}>Tipo de obligacion</Text>
          <View style={styles.typeGrid}>
            {OBLIGATION_TYPES.map((item) => {
              const selected = type === item.type;
              return (
                <AnimatedPressable
                  key={item.type}
                  style={[
                    styles.typeOption,
                    selected && {
                      backgroundColor: item.color + "15",
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => {
                    setType(item.type);
                    haptics.selection();
                  }}
                  scaleValue={0.95}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={selected ? item.color : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      selected && { color: item.color, fontWeight: "600" },
                    ]}>
                    {item.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {/* Titulo */}
          <Text style={styles.label}>Titulo *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Estampilla departamental de Cundinamarca"
            placeholderTextColor={colors.textTertiary}
            maxLength={200}
          />

          {/* Fecha de vencimiento */}
          <Text style={styles.label}>Fecha de vencimiento *</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="AAAA-MM-DD (ej: 2026-03-15)"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          {/* Monto estimado */}
          <Text style={styles.label}>Monto estimado (COP)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Ej: 500000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />

          {/* Descripcion */}
          <Text style={styles.label}>Descripcion</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detalle de la obligacion..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Notas */}
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas adicionales..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          {/* Proceso asociado */}
          {processName ? (
            <View style={styles.processInfo}>
              <Ionicons name="link-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.processInfoText} numberOfLines={1}>
                Proceso: {processName}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separatorLight,
    },
    cancelText: {
      fontSize: scale(16),
      color: colors.accent,
    },
    headerTitle: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    saveButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.backgroundTertiary,
    },
    saveText: {
      fontSize: scale(15),
      fontWeight: "600",
      color: colors.textTertiary,
    },
    form: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
    label: {
      fontSize: scale(14),
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      fontSize: scale(16),
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.separatorLight,
    },
    textArea: {
      minHeight: scale(80),
      paddingTop: spacing.md,
    },
    typeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    typeOption: {
      flex: 1,
      minWidth: "45%",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1.5,
      borderColor: colors.separatorLight,
      backgroundColor: colors.backgroundSecondary,
    },
    typeOptionText: {
      fontSize: scale(13),
      color: colors.textSecondary,
    },
    processInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.xl,
      padding: spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
    },
    processInfoText: {
      flex: 1,
      fontSize: scale(13),
      color: colors.textTertiary,
    },
  });

export default ObligationFormModal;
