// src/components/CalendarGrid.tsx
// Grid de calendario mensual custom para obligaciones tributarias

import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "./AnimatedPressable";
import { useTheme } from "../context/ThemeContext";
import { spacing, borderRadius, scale } from "../theme";
import { ContractObligation } from "../types/database";
import { OBLIGATION_TYPE_CONFIG } from "../services/obligationService";

// ============================================
// TIPOS
// ============================================
interface CalendarGridProps {
  year: number;
  month: number; // 1-12
  obligations: ContractObligation[];
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
}

interface DayCell {
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  obligations: ContractObligation[];
}

// ============================================
// HELPERS
// ============================================
const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const getMonthDays = (year: number, month: number): DayCell[] => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();

  // Lunes = 0, Domingo = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: DayCell[] = [];

  // Dias del mes anterior (relleno)
  const prevMonthLast = new Date(year, month - 1, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const day = prevMonthLast - i;
    const prevMonth = month - 1 <= 0 ? 12 : month - 1;
    const prevYear = month - 1 <= 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      day,
      dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      obligations: [],
    });
  }

  // Dias del mes actual
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      obligations: [],
    });
  }

  // Dias del mes siguiente (relleno hasta completar semana)
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    const nextMonth = month + 1 > 12 ? 1 : month + 1;
    const nextYear = month + 1 > 12 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        obligations: [],
      });
    }
  }

  return cells;
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const CalendarGrid: React.FC<CalendarGridProps> = ({
  year,
  month,
  obligations,
  selectedDate,
  onSelectDate,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Mapear obligaciones a dias
  const cells = useMemo(() => {
    const baseCells = getMonthDays(year, month);

    // Crear mapa de obligaciones por fecha
    const oblMap: Record<string, ContractObligation[]> = {};
    obligations.forEach((obl) => {
      const key = obl.due_date;
      if (!oblMap[key]) oblMap[key] = [];
      oblMap[key].push(obl);
    });

    return baseCells.map((cell) => ({
      ...cell,
      obligations: oblMap[cell.dateStr] || [],
    }));
  }, [year, month, obligations]);

  // Agrupar en semanas
  const weeks = useMemo(() => {
    const result: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    return result;
  }, [cells]);

  return (
    <View style={styles.container}>
      {/* Header dias de la semana */}
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Grid de dias */}
      {weeks.map((week, weekIdx) => (
        <View key={weekIdx} style={styles.weekRow}>
          {week.map((cell) => {
            const isSelected = cell.dateStr === selectedDate;
            const hasObligations = cell.obligations.length > 0;

            return (
              <AnimatedPressable
                key={cell.dateStr}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: colors.accent },
                  cell.isToday && !isSelected && styles.todayCell,
                ]}
                onPress={() => onSelectDate(cell.dateStr)}
                scaleValue={0.9}
                hapticType="selection">
                <Text
                  style={[
                    styles.dayText,
                    !cell.isCurrentMonth && { color: colors.textTertiary },
                    cell.isToday && !isSelected && { color: colors.accent, fontWeight: "700" },
                    isSelected && { color: "#FFFFFF", fontWeight: "700" },
                  ]}>
                  {cell.day}
                </Text>

                {/* Dots de obligaciones */}
                {hasObligations && (
                  <View style={styles.dotsRow}>
                    {cell.obligations.slice(0, 3).map((obl, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isSelected
                              ? "#FFFFFF"
                              : OBLIGATION_TYPE_CONFIG[obl.obligation_type]?.color || colors.accent,
                          },
                        ]}
                      />
                    ))}
                  </View>
                )}
              </AnimatedPressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      paddingVertical: spacing.sm,
    },
    weekRow: {
      flexDirection: "row",
    },
    weekDayCell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    weekDayText: {
      fontSize: scale(12),
      fontWeight: "600",
      color: colors.textTertiary,
      textTransform: "uppercase",
    },
    dayCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm,
      minHeight: scale(44),
      borderRadius: borderRadius.sm,
      marginHorizontal: 1,
      marginVertical: 1,
    },
    todayCell: {
      backgroundColor: colors.accentLight,
    },
    dayText: {
      fontSize: scale(15),
      fontWeight: "400",
      color: colors.textPrimary,
    },
    dotsRow: {
      flexDirection: "row",
      marginTop: 2,
      gap: 2,
    },
    dot: {
      width: scale(5),
      height: scale(5),
      borderRadius: scale(2.5),
    },
  });

export default CalendarGrid;
