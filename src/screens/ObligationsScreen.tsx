// src/screens/ObligationsScreen.tsx
// Pantalla principal del Calendario Tributario

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CalendarGrid } from "../components/CalendarGrid";
import { ObligationCard } from "../components/ObligationCard";
import { ObligationFormModal, ObligationFormData } from "../components/ObligationFormModal";
import { AnimatedPressable, FadeIn, StaggeredItem } from "../components/index";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useHaptics } from "../hooks/useHaptics";
import { useObligationsStore } from "../store/obligationsStore";
import { OBLIGATION_TYPE_CONFIG } from "../services/obligationService";
import { spacing, borderRadius, scale, shadows, typography } from "../theme";
import { ObligationType, ContractObligation } from "../types/database";

// ============================================
// CONSTANTES
// ============================================
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const VIEW_MODES = [
  { key: "calendar", label: "Calendario", icon: "calendar-outline" },
  { key: "timeline", label: "Timeline", icon: "list-outline" },
] as const;

type ViewMode = (typeof VIEW_MODES)[number]["key"];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const ObligationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const haptics = useHaptics();
  const { user } = useAuth();
  const styles = createStyles(colors);

  const {
    obligations,
    loading,
    fetchObligations,
    fetchByMonth,
    addObligation,
    removeObligation,
    markCompleted,
    checkOverdue,
  } = useObligationsStore();

  // State
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [showForm, setShowForm] = useState(false);
  const [editObligation, setEditObligation] = useState<ContractObligation | null>(null);

  // Cargar datos
  useEffect(() => {
    if (user?.id) {
      fetchByMonth(user.id, currentYear, currentMonth);
      checkOverdue(user.id);
    }
  }, [user?.id, currentYear, currentMonth]);

  // Refresh
  const handleRefresh = useCallback(async () => {
    if (user?.id) {
      haptics.medium();
      await fetchByMonth(user.id, currentYear, currentMonth);
      await checkOverdue(user.id);
    }
  }, [user?.id, currentYear, currentMonth, haptics]);

  // Navegacion de mes
  const goToPrevMonth = useCallback(() => {
    haptics.light();
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [currentMonth, haptics]);

  const goToNextMonth = useCallback(() => {
    haptics.light();
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [currentMonth, haptics]);

  const goToToday = useCallback(() => {
    haptics.light();
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setSelectedDate(todayStr);
  }, [haptics]);

  // Filtrar obligaciones por fecha seleccionada
  const filteredObligations = useMemo(() => {
    if (!selectedDate) return obligations;
    return obligations.filter((o) => o.due_date === selectedDate);
  }, [obligations, selectedDate]);

  // Stats del mes
  const monthStats = useMemo(() => {
    const pending = obligations.filter((o) => o.status === "pending").length;
    const overdue = obligations.filter((o) => o.status === "overdue").length;
    const completed = obligations.filter((o) => o.status === "completed").length;
    return { total: obligations.length, pending, overdue, completed };
  }, [obligations]);

  // Handlers
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  }, []);

  const handleSubmitForm = useCallback(
    async (data: ObligationFormData) => {
      if (!user?.id) return;

      if (editObligation) {
        const { success, error } = await useObligationsStore.getState().updateObligation(
          editObligation.id,
          {
            obligation_type: data.obligation_type,
            title: data.title,
            description: data.description || null,
            due_date: data.due_date,
            estimated_amount: data.estimated_amount ? Number(data.estimated_amount) : null,
            notes: data.notes || null,
          }
        );
        if (!success) Alert.alert("Error", error || "No se pudo actualizar");
      } else {
        const { success, error } = await addObligation({
          user_id: user.id,
          process_id: data.process_id || "manual",
          process_name: data.process_name || undefined,
          obligation_type: data.obligation_type,
          title: data.title,
          description: data.description || undefined,
          due_date: data.due_date,
          estimated_amount: data.estimated_amount ? Number(data.estimated_amount) : undefined,
          notes: data.notes || undefined,
        });
        if (!success) Alert.alert("Error", error || "No se pudo crear");
      }
      setEditObligation(null);
    },
    [user?.id, editObligation, addObligation]
  );

  const handleComplete = useCallback(
    async (id: string) => {
      haptics.medium();
      const { success } = await markCompleted(id);
      if (!success) Alert.alert("Error", "No se pudo completar");
    },
    [markCompleted, haptics]
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Eliminar obligacion", "Esta accion no se puede deshacer.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            haptics.medium();
            await removeObligation(id);
          },
        },
      ]);
    },
    [removeObligation, haptics]
  );

  const handleEditObligation = useCallback((obl: ContractObligation) => {
    setEditObligation(obl);
    setShowForm(true);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={28} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendario Tributario</Text>
          <TouchableOpacity
            onPress={goToToday}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.todayButton}>Hoy</Text>
          </TouchableOpacity>
        </View>

        {/* Navegacion de mes */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={22} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-forward" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* View mode toggle */}
        <View style={styles.viewToggle}>
          {VIEW_MODES.map((mode) => (
            <AnimatedPressable
              key={mode.key}
              style={[
                styles.viewToggleButton,
                viewMode === mode.key && { backgroundColor: colors.accent },
              ]}
              onPress={() => {
                setViewMode(mode.key);
                haptics.selection();
              }}
              scaleValue={0.95}>
              <Ionicons
                name={mode.icon as any}
                size={16}
                color={viewMode === mode.key ? "#FFFFFF" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === mode.key && { color: "#FFFFFF" },
                ]}>
                {mode.label}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      {/* Contenido */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }>

        {/* Stats del mes */}
        <FadeIn>
          <View style={styles.statsRow}>
            <View style={[styles.statPill, { backgroundColor: "#FF9500" + "18" }]}>
              <Text style={[styles.statNumber, { color: "#FF9500" }]}>{monthStats.pending}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: "#FF3B30" + "18" }]}>
              <Text style={[styles.statNumber, { color: "#FF3B30" }]}>{monthStats.overdue}</Text>
              <Text style={styles.statLabel}>Vencidas</Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: "#34C759" + "18" }]}>
              <Text style={[styles.statNumber, { color: "#34C759" }]}>{monthStats.completed}</Text>
              <Text style={styles.statLabel}>Completadas</Text>
            </View>
          </View>
        </FadeIn>

        {/* Vista Calendario */}
        {viewMode === "calendar" && (
          <FadeIn>
            <View style={styles.calendarContainer}>
              <CalendarGrid
                year={currentYear}
                month={currentMonth}
                obligations={obligations}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            </View>
          </FadeIn>
        )}

        {/* Leyenda */}
        <View style={styles.legend}>
          {Object.entries(OBLIGATION_TYPE_CONFIG).map(([key, config]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: config.color }]} />
              <Text style={styles.legendText}>{config.label}</Text>
            </View>
          ))}
        </View>

        {/* Lista de obligaciones */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {selectedDate
                ? `Obligaciones del ${selectedDate.split("-").reverse().join("/")}`
                : "Todas las obligaciones del mes"}
            </Text>
            {selectedDate && (
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Text style={styles.clearFilter}>Limpiar filtro</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredObligations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>Sin obligaciones</Text>
              <Text style={styles.emptyMessage}>
                {selectedDate
                  ? "No hay obligaciones para esta fecha"
                  : "No hay obligaciones este mes. Agrega una con el boton +"}
              </Text>
            </View>
          ) : (
            filteredObligations.map((obl, index) => (
              <StaggeredItem key={obl.id} index={index} staggerDelay={30}>
                <ObligationCard
                  obligation={obl}
                  onPress={() => handleEditObligation(obl)}
                  onComplete={() => handleComplete(obl.id)}
                />
              </StaggeredItem>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <AnimatedPressable
        style={[
          styles.fab,
          { bottom: insets.bottom + spacing.xl },
        ]}
        onPress={() => {
          setEditObligation(null);
          setShowForm(true);
        }}
        scaleValue={0.9}
        hapticType="medium">
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </AnimatedPressable>

      {/* Modal de formulario */}
      <ObligationFormModal
        visible={showForm}
        onClose={() => {
          setShowForm(false);
          setEditObligation(null);
        }}
        onSubmit={handleSubmitForm}
        editObligation={editObligation}
      />
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separatorLight,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    todayButton: {
      fontSize: scale(15),
      color: colors.accent,
      fontWeight: "600",
    },
    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xl,
      marginTop: spacing.md,
    },
    monthTitle: {
      ...typography.title3,
      color: colors.textPrimary,
      minWidth: scale(180),
      textAlign: "center",
    },
    viewToggle: {
      flexDirection: "row",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.full,
      padding: 3,
      marginTop: spacing.md,
    },
    viewToggleButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
    },
    viewToggleText: {
      fontSize: scale(13),
      fontWeight: "600",
      color: colors.textSecondary,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    statPill: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    statNumber: {
      fontSize: scale(22),
      fontWeight: "800",
    },
    statLabel: {
      fontSize: scale(10),
      color: colors.textTertiary,
      fontWeight: "600",
      marginTop: 2,
    },

    // Calendar
    calendarContainer: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      ...shadows.card,
    },

    // Legend
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: scale(11),
      color: colors.textTertiary,
    },

    // List
    listSection: {
      marginTop: spacing.md,
    },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    listTitle: {
      fontSize: scale(16),
      fontWeight: "700",
      color: colors.textPrimary,
      flex: 1,
    },
    clearFilter: {
      fontSize: scale(13),
      color: colors.accent,
      fontWeight: "600",
    },

    // Empty
    emptyContainer: {
      alignItems: "center",
      paddingVertical: spacing.xxxl,
    },
    emptyTitle: {
      fontSize: scale(18),
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    emptyMessage: {
      fontSize: scale(14),
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.sm,
      maxWidth: scale(260),
      lineHeight: scale(20),
    },

    // FAB
    fab: {
      position: "absolute",
      right: spacing.lg,
      width: scale(56),
      height: scale(56),
      borderRadius: scale(28),
      backgroundColor: colors.accent,
      justifyContent: "center",
      alignItems: "center",
      ...shadows.elevated,
    },
  });

export default ObligationsScreen;
