// src/screens/AlertsScreen.tsx
// Pantalla para gestionar alertas de búsqueda con filtros completos

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Swipeable } from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import * as NavigationBar from "expo-navigation-bar";
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  toggleAlert,
} from "../services/alertService";
import { getProcessById, advancedSearch } from "../api/secop";
import { SecopProcess } from "../types/index";
import { Alert as AlertType, AlertFilters } from "../types/database";
import { ProcessCard } from "../components/index";
import { useHaptics } from "../hooks/useHaptics";
import { FadeIn, SlideInUp } from "../components/Animations";
import { getDepartments, getMunicipalities } from "../services/divipola";
import { AlertIcon } from "../assets/icons";
import { spacing, scale, borderRadius, typography } from "../theme";
import { MODALIDADES } from "../constants/filterOptions";
import {
  CONTRACT_TYPES,
  getContractTypeColor,
} from "../constants/contractTypes";

// ============================================
// TIPOS PARA PROCESOS DE NOTIFICACIÓN
// ============================================
interface ProcessSummary {
  id: string;
  nombre: string;
  entidad: string;
  precio: string | number | null;
  fase: string | null;
}

// ============================================
// COMPONENTE: CARD DE ALERTA CON SWIPE
// ============================================
interface AlertCardProps {
  alert: AlertType;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (alert: AlertType) => void;
  onDelete: (id: string) => void;
  colors: any;
  swipeableRef: (ref: Swipeable | null) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onToggle,
  onEdit,
  onDelete,
  colors,
  swipeableRef,
}) => {
  const haptics = useHaptics();

  const handleToggle = () => {
    haptics.light();
    onToggle(alert.id, !alert.is_active);
  };

  // Formatear filtros para mostrar
  const getFiltersSummary = () => {
    const parts: string[] = [];
    if (alert.filters.keyword) parts.push(`"${alert.filters.keyword}"`);
    if (alert.filters.departamento) parts.push(alert.filters.departamento);
    if (alert.filters.municipio) parts.push(alert.filters.municipio);
    if (alert.filters.modalidad) {
      const mod = MODALIDADES.find((m) => m.value === alert.filters.modalidad);
      if (mod) parts.push(mod.label);
    }
    if (alert.filters.tipo_contrato) {
      const tipoValue = Array.isArray(alert.filters.tipo_contrato)
        ? alert.filters.tipo_contrato[0]
        : alert.filters.tipo_contrato;
      const tipo = CONTRACT_TYPES.find((t) => t.id === tipoValue);
      if (tipo) parts.push(tipo.label);
      if (Array.isArray(alert.filters.tipo_contrato) && alert.filters.tipo_contrato.length > 1) {
        parts.push(`+${alert.filters.tipo_contrato.length - 1}`);
      }
    }
    return parts.length > 0 ? parts.join(" • ") : "Todos los procesos";
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.8],
      extrapolate: "clamp",
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.danger }]}
          onPress={() => onDelete(alert.id)}>
          <AlertIcon
            size={22}
            filled={true} // Activa la versión SÓLIDA
            activeColor={colors.backgroundSecondary} // El color que tendrá el relleno
          />
          <Text
            style={[styles.deleteText, { color: colors.backgroundSecondary }]}>
            Eliminar
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={2}>
      <TouchableOpacity
        style={[
          styles.alertCard,
          { backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={() => onEdit(alert)}
        activeOpacity={0.7}>
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleRow}>
            <AlertIcon
              size={22}
              filled={true} // Activa la versión SÓLIDA
              activeColor={colors.accent} // El color que tendrá el relleno
            />
            <Text
              style={[styles.alertName, { color: colors.textPrimary }]}
              numberOfLines={1}>
              {alert.name}
            </Text>
          </View>
          <Switch
            value={alert.is_active}
            onValueChange={handleToggle}
            trackColor={{ false: colors.separator, true: colors.accent + "50" }}
            thumbColor={alert.is_active ? colors.accent : colors.textSecondary}
          />
        </View>

        <Text
          style={[styles.alertFilters, { color: colors.textSecondary }]}
          numberOfLines={2}>
          {getFiltersSummary()}
        </Text>

      </TouchableOpacity>
    </Swipeable>
  );
};

// ============================================
// COMPONENTE: MODAL CREAR/EDITAR ALERTA
// ============================================
interface AlertModalProps {
  visible: boolean;
  alert?: AlertType | null;
  initialFilters?: AlertFilters;
  onClose: () => void;
  onSave: (data: { name: string; filters: AlertFilters }) => void;
  colors: any;
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  alert,
  initialFilters,
  onClose,
  onSave,
  colors,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // Android: sincronizar nav bar con modal (solo builds nativos, no Expo Go)
  useEffect(() => {
    if (Platform.OS === "android") {
      try {
        NavigationBar.setBackgroundColorAsync(
          visible ? colors.background : (isDark ? "#000000" : "#F2F2F7")
        );
        NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
      } catch (_) {}
    }
  }, [visible, isDark]);

  // Estados del formulario
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedModalidades, setSelectedModalidades] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);

  // Estados DIVIPOLA
  const [departments, setDepartments] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingMunis, setLoadingMunis] = useState(false);

  // Estados modales de selección
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showMuniModal, setShowMuniModal] = useState(false);
  const [deptSearchText, setDeptSearchText] = useState("");
  const [muniSearchText, setMuniSearchText] = useState("");

  // Cargar departamentos
  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepts(true);
      const data = await getDepartments();
      setDepartments(data);
      setLoadingDepts(false);
    };
    if (visible) loadDepartments();
  }, [visible]);

  // Cargar municipios cuando cambia departamento
  useEffect(() => {
    if (!selectedDepartamento) {
      setMunicipalities([]);
      return;
    }
    const loadMunicipalities = async () => {
      setLoadingMunis(true);
      const data = await getMunicipalities(selectedDepartamento);
      setMunicipalities(data);
      setLoadingMunis(false);
    };
    loadMunicipalities();
  }, [selectedDepartamento]);

  // Inicializar formulario
  useEffect(() => {
    if (alert) {
      // Editar alerta existente
      setName(alert.name);
      setKeyword(alert.filters.keyword || "");
      setSelectedDepartamento(alert.filters.departamento || "");
      setSelectedMunicipio(alert.filters.municipio || "");
      // Buscar los IDs de modalidad/tipo por sus valores (soporta string o string[])
      const modValues = Array.isArray(alert.filters.modalidad)
        ? alert.filters.modalidad
        : alert.filters.modalidad ? [alert.filters.modalidad] : [];
      setSelectedModalidades(
        modValues.map(v => MODALIDADES.find(m => m.value === v)?.id).filter(Boolean) as string[]
      );
      const tipoValues = Array.isArray(alert.filters.tipo_contrato)
        ? alert.filters.tipo_contrato
        : alert.filters.tipo_contrato ? [alert.filters.tipo_contrato] : [];
      setSelectedTipos(
        tipoValues.filter(v => CONTRACT_TYPES.some(t => t.id === v))
      );
    } else if (initialFilters) {
      // Nueva alerta con filtros iniciales (desde SearchScreen)
      setName("");
      setKeyword(initialFilters.keyword || "");
      setSelectedDepartamento(initialFilters.departamento || "");
      setSelectedMunicipio(initialFilters.municipio || "");
      const modVal = Array.isArray(initialFilters.modalidad)
        ? initialFilters.modalidad
        : initialFilters.modalidad ? [initialFilters.modalidad] : [];
      setSelectedModalidades(
        modVal.map(v => MODALIDADES.find(m => m.value === v)?.id).filter(Boolean) as string[]
      );
      const tipoVal = Array.isArray(initialFilters.tipo_contrato)
        ? initialFilters.tipo_contrato
        : initialFilters.tipo_contrato ? [initialFilters.tipo_contrato] : [];
      setSelectedTipos(
        tipoVal.filter(v => CONTRACT_TYPES.some(t => t.id === v))
      );
    } else {
      // Nueva alerta vacía
      setName("");
      setKeyword("");
      setSelectedDepartamento("");
      setSelectedMunicipio("");
      setSelectedModalidades([]);
      setSelectedTipos([]);
    }
  }, [alert, initialFilters, visible]);

  const filteredDepartments = deptSearchText
    ? departments.filter((d) =>
        d.toLowerCase().includes(deptSearchText.toLowerCase()),
      )
    : departments;

  const filteredMunicipalities = muniSearchText
    ? municipalities.filter((m) =>
        m.toLowerCase().includes(muniSearchText.toLowerCase()),
      )
    : municipalities;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    const filters: AlertFilters = {};
    if (keyword.trim()) filters.keyword = keyword.trim();
    if (selectedDepartamento) filters.departamento = selectedDepartamento;
    if (selectedMunicipio) filters.municipio = selectedMunicipio;
    if (selectedModalidades.length > 0) {
      const values = selectedModalidades
        .map(id => MODALIDADES.find(m => m.id === id)?.value)
        .filter(Boolean) as string[];
      if (values.length === 1) filters.modalidad = values[0];
      else if (values.length > 1) filters.modalidad = values;
    }
    if (selectedTipos.length > 0) {
      if (selectedTipos.length === 1) filters.tipo_contrato = selectedTipos[0];
      else filters.tipo_contrato = selectedTipos;
    }

    if (Object.keys(filters).length === 0) {
      Alert.alert("Error", "Debes agregar al menos un filtro");
      return;
    }

    onSave({ name: name.trim(), filters });
  };

  const handleSelectDept = (dept: string) => {
    if (selectedDepartamento === dept) {
      setSelectedDepartamento("");
      setSelectedMunicipio("");
    } else {
      setSelectedDepartamento(dept);
      setSelectedMunicipio("");
    }
    setShowDeptModal(false);
    setDeptSearchText("");
  };

  const handleSelectMuni = (muni: string) => {
    setSelectedMunicipio(selectedMunicipio === muni ? "" : muni);
    setShowMuniModal(false);
    setMuniSearchText("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.modalCancel, { color: colors.accent }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {alert ? "Editar Alerta" : "Nueva Alerta"}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, { color: colors.accent }]}>
                Guardar
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
            {/* Nombre */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Nombre de la alerta *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.separator,
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Obras en Cundinamarca"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Sección: Filtros */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Filtros de búsqueda
            </Text>

            {/* Ubicación */}
            <Text
              style={[
                styles.inputLabel,
                { color: colors.textSecondary },
              ]}>
              Ubicación
            </Text>
            <View style={styles.locationRow}>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  { borderColor: colors.separatorLight },
                  selectedDepartamento && {
                    backgroundColor: colors.accentLight,
                    borderColor: colors.accent,
                  },
                ]}
                onPress={() => setShowDeptModal(true)}
                disabled={loadingDepts}>
                {loadingDepts ? (
                  <ActivityIndicator size="small" color={colors.textTertiary} />
                ) : (
                  <>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={
                        selectedDepartamento
                          ? colors.accent
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.locationText,
                        { color: colors.textSecondary },
                        selectedDepartamento && {
                          color: colors.accent,
                          fontWeight: "500",
                        },
                      ]}
                      numberOfLines={1}>
                      {selectedDepartamento || "Departamento"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.locationButton,
                  { borderColor: colors.separatorLight },
                  selectedMunicipio && {
                    backgroundColor: colors.accentLight,
                    borderColor: colors.accent,
                  },
                  !selectedDepartamento && { opacity: 0.5 },
                ]}
                onPress={() => selectedDepartamento && setShowMuniModal(true)}
                disabled={!selectedDepartamento || loadingMunis}>
                {loadingMunis ? (
                  <ActivityIndicator size="small" color={colors.textTertiary} />
                ) : (
                  <>
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={
                        selectedMunicipio ? colors.accent : colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.locationText,
                        { color: colors.textSecondary },
                        selectedMunicipio && {
                          color: colors.accent,
                          fontWeight: "500",
                        },
                      ]}
                      numberOfLines={1}>
                      {selectedMunicipio || "Municipio"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Modalidad */}
            <Text
              style={[
                styles.inputLabel,
                { color: colors.textSecondary, marginTop: spacing.lg },
              ]}>
              Modalidad de contratación
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}>
              {MODALIDADES.map((mod) => {
                const isSelected = selectedModalidades.includes(mod.id);
                return (
                  <TouchableOpacity
                    key={mod.id}
                    style={[
                      styles.chip,
                      { borderColor: colors.separatorLight },
                      isSelected && {
                        backgroundColor: colors.accent,
                        borderColor: colors.accent,
                      },
                    ]}
                    onPress={() =>
                      setSelectedModalidades(prev =>
                        prev.includes(mod.id)
                          ? prev.filter(id => id !== mod.id)
                          : [...prev, mod.id]
                      )
                    }>
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.textSecondary },
                        isSelected && { color: "#FFFFFF" },
                      ]}>
                      {mod.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Tipo de contrato */}
            <Text
              style={[
                styles.inputLabel,
                { color: colors.textSecondary, marginTop: spacing.lg },
              ]}>
              Tipo de contrato
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tiposChipsRow}>
              {CONTRACT_TYPES.map((config) => {
                const typeColor = getContractTypeColor(config);
                const isActive = selectedTipos.includes(config.id);
                return (
                  <TouchableOpacity
                    key={config.id}
                    style={[
                      styles.tipoChip,
                      {
                        backgroundColor: isActive ? typeColor : "transparent",
                        borderWidth: 1,
                        borderColor: isActive ? typeColor : typeColor + "30",
                      },
                    ]}
                    onPress={() =>
                      setSelectedTipos(prev =>
                        prev.includes(config.id)
                          ? prev.filter(id => id !== config.id)
                          : [...prev, config.id]
                      )
                    }
                    activeOpacity={0.7}>
                    <config.CustomIcon
                      size={14}
                      color={isActive ? "#FFF" : typeColor}
                    />
                    <Text
                      style={[
                        styles.tipoChipText,
                        { color: isActive ? "#FFF" : colors.textSecondary },
                      ]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Info */}
            <View
              style={[styles.infoBox, { backgroundColor: colors.accentLight }]}>
              <Ionicons
                name="information-circle"
                size={20}
                color={colors.accent}
              />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Recibirás una notificación cuando se publiquen nuevos procesos
                que coincidan con tus filtros.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Departamentos */}
      <Modal visible={showDeptModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View
            style={[
              styles.subModalContent,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom,
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Departamento
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDeptModal(false);
                  setDeptSearchText("");
                }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.searchBarSmall,
                { backgroundColor: colors.backgroundSecondary },
              ]}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.searchInputSmall, { color: colors.textPrimary }]}
                placeholder="Buscar departamento..."
                placeholderTextColor={colors.textTertiary}
                value={deptSearchText}
                onChangeText={setDeptSearchText}
                autoFocus
              />
              {deptSearchText.length > 0 && (
                <TouchableOpacity onPress={() => setDeptSearchText("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredDepartments}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.listContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    { borderBottomColor: colors.separator },
                  ]}
                  onPress={() => handleSelectDept(item)}>
                  <Text
                    style={[
                      styles.listItemText,
                      { color: colors.textPrimary },
                    ]}>
                    {item}
                  </Text>
                  {selectedDepartamento === item && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={{ color: colors.textTertiary }}>
                    No se encontraron resultados
                  </Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Municipios */}
      <Modal visible={showMuniModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}>
          <View
            style={[
              styles.subModalContent,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom,
              },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Municipio
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowMuniModal(false);
                  setMuniSearchText("");
                }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.searchBarSmall,
                { backgroundColor: colors.backgroundSecondary },
              ]}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={[styles.searchInputSmall, { color: colors.textPrimary }]}
                placeholder="Buscar municipio..."
                placeholderTextColor={colors.textTertiary}
                value={muniSearchText}
                onChangeText={setMuniSearchText}
                autoFocus
              />
              {muniSearchText.length > 0 && (
                <TouchableOpacity onPress={() => setMuniSearchText("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredMunicipalities}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.listContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    { borderBottomColor: colors.separator },
                  ]}
                  onPress={() => handleSelectMuni(item)}>
                  <Text
                    style={[
                      styles.listItemText,
                      { color: colors.textPrimary },
                    ]}>
                    {item}
                  </Text>
                  {selectedMunicipio === item && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={{ color: colors.textTertiary }}>
                    No se encontraron resultados
                  </Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Modal>
  );
};

// ============================================
// COMPONENTE: MODAL DE PROCESOS NUEVOS DETECTADOS
// ============================================
interface NewProcessesModalProps {
  visible: boolean;
  processes: ProcessSummary[];
  onClose: () => void;
  onViewProcess: (processId: string) => void;
  colors: any;
}

const formatPrice = (price: string | number | null): string => {
  if (!price) return "";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return "";
  return `$${num.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
};

const NewProcessesModal: React.FC<NewProcessesModalProps> = ({
  visible,
  processes,
  onClose,
  onViewProcess,
  colors,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // Android: sincronizar nav bar con modal (solo builds nativos, no Expo Go)
  useEffect(() => {
    if (Platform.OS === "android") {
      try {
        NavigationBar.setBackgroundColorAsync(
          visible ? colors.background : (isDark ? "#000000" : "#F2F2F7")
        );
        NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
      } catch (_) {}
    }
  }, [visible, isDark]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.newProcessesModalContent,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}>
          {/* Header */}
          <View style={styles.newProcessesHeader}>
            <View style={styles.newProcessesTitleRow}>
              <View
                style={[
                  styles.newProcessesIconBg,
                  { backgroundColor: colors.accentLight },
                ]}>
                <Ionicons
                  name="notifications"
                  size={20}
                  color={colors.accent}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.newProcessesTitle,
                    { color: colors.textPrimary },
                  ]}>
                  Procesos detectados
                </Text>
                <Text
                  style={[
                    styles.newProcessesSubtitle,
                    { color: colors.textSecondary },
                  ]}>
                  {processes.length} nuevo
                  {processes.length > 1 ? "s" : ""} proceso
                  {processes.length > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.newProcessesCloseButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Lista de procesos */}
          <ScrollView
            style={styles.newProcessesList}
            showsVerticalScrollIndicator={false}>
            {processes.map((process, index) => (
              <TouchableOpacity
                key={process.id || index}
                style={[
                  styles.newProcessCard,
                  { backgroundColor: colors.backgroundSecondary },
                  Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                    },
                    android: {
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.06)",
                    },
                  }),
                ]}
                onPress={() => onViewProcess(process.id)}
                activeOpacity={0.7}>
                <View style={styles.newProcessCardHeader}>
                  <View
                    style={[
                      styles.newProcessNumber,
                      { backgroundColor: colors.accentLight },
                    ]}>
                    <Text
                      style={[
                        styles.newProcessNumberText,
                        { color: colors.accent },
                      ]}>
                      {index + 1}
                    </Text>
                  </View>
                  {process.fase && (
                    <View
                      style={[
                        styles.newProcessFaseBadge,
                        { backgroundColor: colors.accentLight },
                      ]}>
                      <Text
                        style={[
                          styles.newProcessFaseText,
                          { color: colors.accent },
                        ]}>
                        {process.fase}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.newProcessName,
                    { color: colors.textPrimary },
                  ]}
                  numberOfLines={2}>
                  {process.nombre || "Sin nombre"}
                </Text>
                <Text
                  style={[
                    styles.newProcessEntity,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {process.entidad || "Entidad no especificada"}
                </Text>
                {process.precio && (
                  <Text
                    style={[
                      styles.newProcessPrice,
                      { color: colors.accent },
                    ]}>
                    {formatPrice(process.precio)}
                  </Text>
                )}
                <View style={styles.newProcessFooter}>
                  <Text
                    style={[
                      styles.newProcessViewText,
                      { color: colors.accent },
                    ]}>
                    Ver detalle
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.accent}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// MODAL DE RESULTADOS DE ALERTA
// ============================================
interface AlertResultsModalProps {
  visible: boolean;
  alert: AlertType | null;
  processes: SecopProcess[];
  loading: boolean;
  onClose: () => void;
  onEdit: () => void;
  onViewProcess: (process: SecopProcess) => void;
  colors: any;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const AlertResultsModal: React.FC<AlertResultsModalProps> = ({
  visible,
  alert,
  processes,
  loading,
  onClose,
  onEdit,
  onViewProcess,
  colors,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  // Animar entrada/salida
  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  // Android: back button cierra el overlay
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!rendered) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? "auto" : "none"}>
      {/* Fondo oscuro */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.5)", opacity: overlayOpacity },
        ]}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Contenido slide-up */}
      <Animated.View
        style={[
          styles.alertResultsOverlay,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + spacing.lg,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        {/* Header */}
        <View style={styles.newProcessesHeader}>
          <View style={styles.newProcessesTitleRow}>
            <View
              style={[
                styles.newProcessesIconBg,
                { backgroundColor: colors.accentLight },
              ]}>
              <Ionicons
                name="search"
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.newProcessesTitle,
                  { color: colors.textPrimary },
                ]}
                numberOfLines={1}>
                {alert?.name || "Resultados"}
              </Text>
              <Text
                style={[
                  styles.newProcessesSubtitle,
                  { color: colors.textSecondary },
                ]}>
                {loading
                  ? "Buscando..."
                  : `${processes.length} resultado${processes.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <TouchableOpacity
              onPress={onEdit}
              style={[
                styles.newProcessesCloseButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}>
              <Ionicons name="create-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.newProcessesCloseButton,
                { backgroundColor: colors.backgroundSecondary },
              ]}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenido */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: scale(60) }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.newProcessesSubtitle, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Buscando procesos...
            </Text>
          </View>
        ) : processes.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: scale(60) }}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.newProcessesTitle, { color: colors.textSecondary, marginTop: spacing.md }]}>
              Sin resultados
            </Text>
            <Text style={[styles.newProcessesSubtitle, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              No se encontraron procesos con estos filtros
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.newProcessesList}
            showsVerticalScrollIndicator={false}>
            {processes.map((process, index) => (
              <View key={process.id_del_proceso || index} style={{ marginBottom: spacing.md }}>
                <ProcessCard
                  process={process}
                  onPress={() => onViewProcess(process)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

// ============================================
// PANTALLA PRINCIPAL
// ============================================
const AlertsScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation: navProp }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  const navigation = navProp || useNavigation();

  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertType | null>(null);
  const [initialFilters, setInitialFilters] = useState<
    AlertFilters | undefined
  >();
  const [newProcesses, setNewProcesses] = useState<ProcessSummary[]>([]);
  const [showNewProcesses, setShowNewProcesses] = useState(false);

  // Estado para vista de resultados de alerta
  const [viewingAlert, setViewingAlert] = useState<AlertType | null>(null);
  const [alertResults, setAlertResults] = useState<SecopProcess[]>([]);
  const [alertResultsLoading, setAlertResultsLoading] = useState(false);
  const [showAlertResults, setShowAlertResults] = useState(false);

  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Cargar alertas y limpiar badge
  const loadAlerts = useCallback(async () => {
    if (!user) return;
    try {
      // Limpiar badge al abrir la pantalla de alertas
      Notifications.setBadgeCountAsync(0);

      const data = await getAlerts(user.id);
      setAlerts(data);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Abrir modal con filtros desde SearchScreen
  useEffect(() => {
    if (route?.params?.createWithFilters) {
      setInitialFilters(route.params.createWithFilters);
      setEditingAlert(null);
      setModalVisible(true);
    }
  }, [route?.params?.createWithFilters]);

  // Mostrar procesos detectados desde notificación
  useEffect(() => {
    if (route?.params?.newProcesses && route.params.newProcesses.length > 0) {
      setNewProcesses(route.params.newProcesses);
      setShowNewProcesses(true);
    }
  }, [route?.params?.newProcesses]);

  // Navegar a detalle de un proceso detectado
  const handleViewProcess = useCallback(
    async (processId: string) => {
      try {
        const process = await getProcessById(processId);
        if (process) {
          setShowNewProcesses(false);
          navigation.navigate("Detail", { process });
        } else {
          Alert.alert("Error", "No se pudo cargar el proceso");
        }
      } catch {
        Alert.alert("Error", "Error al cargar el proceso");
      }
    },
    [navigation],
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await toggleAlert(id, isActive);
    if (!error) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: isActive } : a)),
      );
    }
  };

  const handleEdit = (alert: AlertType) => {
    haptics.light();
    setEditingAlert(alert);
    setInitialFilters(undefined);
    setModalVisible(true);
  };

  // Ver resultados de una alerta (busca procesos que coinciden con sus filtros)
  const handleViewAlertResults = useCallback(
    async (alert: AlertType) => {
      haptics.light();
      setViewingAlert(alert);
      setShowAlertResults(true);
      setAlertResultsLoading(true);
      setAlertResults([]);

      try {
        const results = await advancedSearch({
          keyword: alert.filters.keyword,
          departamento: alert.filters.departamento,
          municipio: alert.filters.municipio,
          modalidad: alert.filters.modalidad,
          tipoContrato: alert.filters.tipo_contrato,
          limit: 20,
        });
        setAlertResults(results);
      } catch (error) {
        console.error("Error fetching alert results:", error);
        setAlertResults([]);
      } finally {
        setAlertResultsLoading(false);
      }
    },
    [haptics]
  );

  // Editar desde la vista de resultados
  const handleEditFromResults = useCallback(() => {
    if (!viewingAlert) return;
    setShowAlertResults(false);
    setTimeout(() => {
      handleEdit(viewingAlert);
    }, 300);
  }, [viewingAlert]);

  // Ver detalle de un proceso desde resultados
  const handleViewResultProcess = useCallback(
    (process: SecopProcess) => {
      setShowAlertResults(false);
      navigation.navigate("Detail" as never, { process } as never);
    },
    [navigation]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      haptics.warning();

      // Cerrar el swipeable
      const swipeable = swipeableRefs.current.get(id);
      if (swipeable) {
        swipeable.close();
      }

      // Eliminar después de un pequeño delay para la animación
      setTimeout(async () => {
        const { error } = await deleteAlert(id);
        if (!error) {
          setAlerts((prev) => prev.filter((a) => a.id !== id));
        }
      }, 200);
    },
    [haptics],
  );

  const handleSave = async (data: { name: string; filters: AlertFilters }) => {
    if (!user) return;

    if (editingAlert) {
      const { error } = await updateAlert(editingAlert.id, data);
      if (!error) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === editingAlert.id ? { ...a, ...data } : a)),
        );
        haptics.success();
      }
    } else {
      const { alert, error } = await createAlert(
        user.id,
        data.name,
        data.filters,
      );
      if (alert && !error) {
        setAlerts((prev) => [alert, ...prev]);
        haptics.success();
      }
    }

    setModalVisible(false);
    setEditingAlert(null);
    setInitialFilters(undefined);
  };

  const handleNewAlert = () => {
    haptics.light();
    setEditingAlert(null);
    setInitialFilters(undefined);
    setModalVisible(true);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Alertas
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={handleNewAlert}
          accessibilityLabel="Crear nueva alerta"
          accessibilityRole="button">
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : alerts.length === 0 ? (
          <FadeIn>
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: colors.accentLight },
                ]}>
                <Ionicons
                  name="notifications-off-outline"
                  size={scale(72)}
                  color={colors.accent}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Sin alertas
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Crea una alerta para recibir notificaciones cuando se publiquen
                nuevos procesos.
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.accent }]}
                onPress={handleNewAlert}
                accessibilityLabel="Crear primera alerta"
                accessibilityRole="button">
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Crear alerta</Text>
              </TouchableOpacity>
            </View>
          </FadeIn>
        ) : (
          alerts.map((alert, index) => (
            <SlideInUp key={alert.id} delay={index * 50}>
              <AlertCard
                alert={alert}
                onToggle={handleToggle}
                onEdit={handleViewAlertResults}
                onDelete={handleDelete}
                colors={colors}
                swipeableRef={(ref) => {
                  if (ref) {
                    swipeableRefs.current.set(alert.id, ref);
                  }
                }}
              />
            </SlideInUp>
          ))
        )}
      </ScrollView>

      {/* Modal crear/editar alerta */}
      <AlertModal
        visible={modalVisible}
        alert={editingAlert}
        initialFilters={initialFilters}
        onClose={() => {
          setModalVisible(false);
          setEditingAlert(null);
          setInitialFilters(undefined);
        }}
        onSave={handleSave}
        colors={colors}
      />

      {/* Modal procesos nuevos detectados */}
      <NewProcessesModal
        visible={showNewProcesses}
        processes={newProcesses}
        onClose={() => setShowNewProcesses(false)}
        onViewProcess={handleViewProcess}
        colors={colors}
      />

      {/* Modal resultados de alerta */}
      <AlertResultsModal
        visible={showAlertResults}
        alert={viewingAlert}
        processes={alertResults}
        loading={alertResultsLoading}
        onClose={() => {
          setShowAlertResults(false);
          setViewingAlert(null);
        }}
        onEdit={handleEditFromResults}
        onViewProcess={handleViewResultProcess}
        colors={colors}
      />
    </View>
  );
};

// ============================================
// ESTILOS
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.largeTitle, fontWeight: "800", letterSpacing: -0.5 },
  addButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg },

  // Alert Card
  alertCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
      },
    }),
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  alertName: { ...typography.callout, fontWeight: "600", flex: 1 },
  alertFilters: { ...typography.subhead, marginBottom: spacing.sm },

  // Delete action
  deleteAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: spacing.lg,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: scale(90),
    height: "100%",
    borderRadius: borderRadius.lg,
  },
  deleteText: {
    ...typography.caption1,
    fontWeight: "600",
    marginTop: spacing.xs,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(80),
  },
  emptyIconContainer: {
    width: scale(96),
    height: scale(96),
    borderRadius: scale(48),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    ...typography.title3,
    fontWeight: "700",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.subhead,
    textAlign: "center",
    maxWidth: scale(280),
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xxl,
  },
  emptyButtonText: { color: "#FFFFFF", ...typography.callout, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: "95%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalCancel: { ...typography.callout },
  modalTitle: { ...typography.headline },
  modalSave: { ...typography.callout, fontWeight: "600" },
  modalBody: { padding: spacing.lg },

  // Inputs
  inputGroup: { marginBottom: spacing.xl },
  inputLabel: { ...typography.subhead, fontWeight: "500", marginBottom: spacing.sm },
  input: {
    height: 42,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    ...typography.callout,
    borderWidth: 1,
  },
  sectionTitle: {
    ...typography.title3,
    fontWeight: "600",
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },

  // Location
  locationRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    height: 42,
    borderWidth: 1,
  },
  locationText: { fontSize: scale(14), flex: 1 },

  // Chips
  chipsScroll: { marginBottom: 0 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "transparent",
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  chipText: { fontSize: scale(13), fontWeight: "500" },

  // Tipo de contrato chips
  tiposChipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  tipoChipText: {
    fontSize: scale(13),
    fontWeight: "500",
  },

  // Info
  infoBox: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  infoText: { ...typography.subhead, flex: 1 },

  // Sub Modal
  subModalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    flex: 1,
    maxHeight: "80%",
    marginTop: "auto",
  },
  searchBarSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInputSmall: { ...typography.callout, flex: 1 },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
  },
  listItemText: { ...typography.callout },
  listContainer: {
    flex: 1,
    minHeight: scale(200),
  },
  emptyList: {
    padding: spacing.xl,
    alignItems: "center",
  },

  // New Processes Modal
  // Alert Results Overlay (no usa Modal, se queda en la misma Activity)
  alertResultsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "85%",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },

  newProcessesModalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: "85%",
  },
  newProcessesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  newProcessesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  newProcessesIconBg: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  newProcessesTitle: {
    ...typography.headline,
  },
  newProcessesSubtitle: {
    ...typography.caption1,
    marginTop: 2,
  },
  newProcessesCloseButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  newProcessesList: {
    padding: spacing.lg,
  },
  newProcessCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  newProcessCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  newProcessNumber: {
    width: scale(24),
    height: scale(24),
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  newProcessNumberText: {
    ...typography.caption2,
    fontWeight: "700",
  },
  newProcessFaseBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  newProcessFaseText: {
    ...typography.caption2,
    fontWeight: "600",
  },
  newProcessName: {
    ...typography.subhead,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  newProcessEntity: {
    ...typography.caption1,
    marginBottom: spacing.xs,
  },
  newProcessPrice: {
    ...typography.callout,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  newProcessFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  newProcessViewText: {
    ...typography.caption1,
    fontWeight: "600",
  },
});

export default AlertsScreen;
