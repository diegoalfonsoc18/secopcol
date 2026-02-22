// src/components/ObligationCard.tsx
// Tarjeta de obligacion tributaria con countdown y status

import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../context/ThemeContext";
import { spacing, borderRadius, scale, shadows } from "../theme";
import { ContractObligation } from "../types/database";
import {
  OBLIGATION_TYPE_CONFIG,
  OBLIGATION_STATUS_CONFIG,
} from "../services/obligationService";

// ============================================
// TIPOS
// ============================================
interface ObligationCardProps {
  obligation: ContractObligation;
  onPress?: () => void;
  onComplete?: () => void;
  compact?: boolean;
}

// ============================================
// HELPERS
// ============================================
const getCountdownText = (dueDateStr: string): { text: string; urgent: boolean } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + "T00:00:00");
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      text: absDays === 1 ? "Vencida hace 1 dia" : `Vencida hace ${absDays} dias`,
      urgent: true,
    };
  }
  if (diffDays === 0) return { text: "Vence hoy", urgent: true };
  if (diffDays === 1) return { text: "Vence manana", urgent: true };
  if (diffDays <= 7) return { text: `En ${diffDays} dias`, urgent: true };
  if (diffDays <= 30) return { text: `En ${diffDays} dias`, urgent: false };
  return { text: `En ${diffDays} dias`, urgent: false };
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ObligationCard: React.FC<ObligationCardProps> = ({
  obligation,
  onPress,
  onComplete,
  compact = false,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const typeConfig = OBLIGATION_TYPE_CONFIG[obligation.obligation_type];
  const statusConfig = OBLIGATION_STATUS_CONFIG[obligation.status];
  const countdown = useMemo(() => getCountdownText(obligation.due_date), [obligation.due_date]);
  const isCompleted = obligation.status === "completed";

  if (compact) {
    return (
      <AnimatedPressable
        style={styles.compactCard}
        onPress={onPress}
        scaleValue={0.97}>
        <View style={[styles.compactIndicator, { backgroundColor: typeConfig.color }]} />
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {obligation.title}
          </Text>
          <Text
            style={[
              styles.compactCountdown,
              countdown.urgent && !isCompleted && { color: "#FF3B30" },
              isCompleted && { color: colors.success },
            ]}>
            {isCompleted ? "Completada" : countdown.text}
          </Text>
        </View>
        <Text style={styles.compactDate}>{formatDate(obligation.due_date)}</Text>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      style={styles.card}
      onPress={onPress}
      scaleValue={0.97}>
      {/* Header: Tipo + Status */}
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <View style={[styles.typeIcon, { backgroundColor: typeConfig.color + "15" }]}>
            <Ionicons
              name={typeConfig.icon as any}
              size={18}
              color={typeConfig.color}
            />
          </View>
          <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
            {typeConfig.label}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "18" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Titulo */}
      <Text style={styles.title} numberOfLines={2}>
        {obligation.title}
      </Text>

      {/* Proceso */}
      {obligation.process_name && (
        <Text style={styles.processName} numberOfLines={1}>
          {obligation.process_name}
        </Text>
      )}

      {/* Footer: Fecha + Monto + Countdown */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.dateText}>{formatDate(obligation.due_date)}</Text>

          {obligation.estimated_amount != null && obligation.estimated_amount > 0 && (
            <>
              <Text style={styles.separator}>|</Text>
              <Text style={styles.amountText}>
                {formatCurrency(obligation.estimated_amount)}
              </Text>
            </>
          )}
        </View>

        <Text
          style={[
            styles.countdownText,
            countdown.urgent && !isCompleted && { color: "#FF3B30", fontWeight: "600" },
            isCompleted && { color: colors.success },
          ]}>
          {isCompleted ? "Completada" : countdown.text}
        </Text>
      </View>

      {/* Boton completar rapido */}
      {!isCompleted && onComplete && (
        <AnimatedPressable
          style={styles.completeButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onComplete();
          }}
          scaleValue={0.95}
          hapticType="medium">
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          <Text style={styles.completeText}>Marcar completada</Text>
        </AnimatedPressable>
      )}
    </AnimatedPressable>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    // Card completa
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadows.card,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    typeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    typeIcon: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      justifyContent: "center",
      alignItems: "center",
    },
    typeLabel: {
      fontSize: scale(13),
      fontWeight: "600",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: scale(11),
      fontWeight: "600",
    },
    title: {
      fontSize: scale(16),
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 4,
      lineHeight: scale(22),
    },
    processName: {
      fontSize: scale(13),
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    dateText: {
      fontSize: scale(13),
      color: colors.textTertiary,
    },
    separator: {
      fontSize: scale(13),
      color: colors.textTertiary,
      marginHorizontal: 2,
    },
    amountText: {
      fontSize: scale(13),
      color: colors.textSecondary,
      fontWeight: "500",
    },
    countdownText: {
      fontSize: scale(13),
      color: colors.textSecondary,
    },
    completeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separatorLight,
    },
    completeText: {
      fontSize: scale(14),
      color: colors.success,
      fontWeight: "600",
    },

    // Card compacta (para HomeScreen)
    compactCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadows.subtle,
    },
    compactIndicator: {
      width: 4,
      height: scale(36),
      borderRadius: 2,
      marginRight: spacing.md,
    },
    compactContent: {
      flex: 1,
    },
    compactTitle: {
      fontSize: scale(14),
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 2,
    },
    compactCountdown: {
      fontSize: scale(12),
      color: colors.textSecondary,
    },
    compactDate: {
      fontSize: scale(12),
      color: colors.textTertiary,
      fontWeight: "500",
      marginLeft: spacing.sm,
    },
  });

export default ObligationCard;
