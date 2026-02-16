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
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  toggleAlert,
  ALERT_FREQUENCY_HOURS,
} from "../services/alertService";
import { Alert as AlertType, AlertFilters } from "../types/database";
import { useHaptics } from "../hooks/useHaptics";
import { FadeIn, SlideInUp } from "../components/Animations";
import { getDepartments, getMunicipalities } from "../services/divipola";
import { AlertIcon } from "../assets/icons";
import { spacing, scale } from "../theme";

// ============================================
// CONSTANTES DE FILTROS
// ============================================
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

const TIPOS = [
  { id: "obra", label: "Obra", value: "Obra" },
  { id: "servicios", label: "Servicios", value: "Prestación de servicios" },
  { id: "suministro", label: "Suministro", value: "Suministro" },
  { id: "consultoria", label: "Consultoría", value: "Consultoría" },
  { id: "compraventa", label: "Compraventa", value: "Compraventa" },
  { id: "interventoria", label: "Interventoría", value: "Interventoría" },
  { id: "arrendamiento", label: "Arrendamiento", value: "Arrendamiento" },
  { id: "concesion", label: "Concesión", value: "Concesión" },
];

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
      const tipo = TIPOS.find((t) => t.value === alert.filters.tipo_contrato);
      if (tipo) parts.push(tipo.label);
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

        <View style={styles.alertFooter}>
          <View style={styles.alertMeta}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.alertMetaText, { color: colors.textTertiary }]}>
              Cada {ALERT_FREQUENCY_HOURS} horas
            </Text>
          </View>

          {alert.last_check && (
            <View style={styles.alertMeta}>
              <Ionicons
                name="checkmark-circle-outline"
                size={14}
                color={colors.success}
              />
              <Text
                style={[styles.alertMetaText, { color: colors.textTertiary }]}>
                {alert.last_results_count} resultados
              </Text>
            </View>
          )}
        </View>
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

  // Estados del formulario
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selectedDepartamento, setSelectedDepartamento] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedModalidad, setSelectedModalidad] = useState("");
  const [selectedTipo, setSelectedTipo] = useState("");

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
      // Buscar el ID de modalidad/tipo por su valor
      const mod = MODALIDADES.find((m) => m.value === alert.filters.modalidad);
      setSelectedModalidad(mod?.id || "");
      const tipo = TIPOS.find((t) => t.value === alert.filters.tipo_contrato);
      setSelectedTipo(tipo?.id || "");
    } else if (initialFilters) {
      // Nueva alerta con filtros iniciales (desde SearchScreen)
      setName("");
      setKeyword(initialFilters.keyword || "");
      setSelectedDepartamento(initialFilters.departamento || "");
      setSelectedMunicipio(initialFilters.municipio || "");
      const mod = MODALIDADES.find((m) => m.value === initialFilters.modalidad);
      setSelectedModalidad(mod?.id || "");
      const tipo = TIPOS.find((t) => t.value === initialFilters.tipo_contrato);
      setSelectedTipo(tipo?.id || "");
    } else {
      // Nueva alerta vacía
      setName("");
      setKeyword("");
      setSelectedDepartamento("");
      setSelectedMunicipio("");
      setSelectedModalidad("");
      setSelectedTipo("");
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
    if (selectedModalidad) {
      const mod = MODALIDADES.find((m) => m.id === selectedModalidad);
      if (mod) filters.modalidad = mod.value;
    }
    if (selectedTipo) {
      const tipo = TIPOS.find((t) => t.id === selectedTipo);
      if (tipo) filters.tipo_contrato = tipo.value;
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

            {/* Palabra clave */}
            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Palabra clave
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
                value={keyword}
                onChangeText={setKeyword}
                placeholder="Ej: construcción, software, salud"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Ubicación */}
            <Text
              style={[
                styles.inputLabel,
                { color: colors.textSecondary, marginBottom: 8 },
              ]}>
              Ubicación
            </Text>
            <View style={styles.locationRow}>
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.separator,
                  },
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
                        {
                          color: selectedDepartamento
                            ? colors.accent
                            : colors.textSecondary,
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
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.separator,
                  },
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
                        {
                          color: selectedMunicipio
                            ? colors.accent
                            : colors.textSecondary,
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
                { color: colors.textSecondary, marginTop: 16, marginBottom: 8 },
              ]}>
              Modalidad de contratación
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}>
              {MODALIDADES.map((mod) => (
                <TouchableOpacity
                  key={mod.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.backgroundSecondary },
                    selectedModalidad === mod.id && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                  onPress={() =>
                    setSelectedModalidad(
                      selectedModalidad === mod.id ? "" : mod.id,
                    )
                  }>
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.textSecondary },
                      selectedModalidad === mod.id && { color: "#FFFFFF" },
                    ]}>
                    {mod.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tipo de contrato */}
            <Text
              style={[
                styles.inputLabel,
                { color: colors.textSecondary, marginTop: 16, marginBottom: 8 },
              ]}>
              Tipo de contrato
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}>
              {TIPOS.map((tipo) => (
                <TouchableOpacity
                  key={tipo.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.backgroundSecondary },
                    selectedTipo === tipo.id && {
                      backgroundColor: colors.accent,
                    },
                  ]}
                  onPress={() =>
                    setSelectedTipo(selectedTipo === tipo.id ? "" : tipo.id)
                  }>
                  <Text
                    style={[
                      styles.chipText,
                      { color: colors.textSecondary },
                      selectedTipo === tipo.id && { color: "#FFFFFF" },
                    ]}>
                    {tipo.label}
                  </Text>
                </TouchableOpacity>
              ))}
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
                Recibirás una notificación cada {ALERT_FREQUENCY_HOURS} horas
                cuando se publiquen nuevos procesos que coincidan con tus
                filtros.
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
// PANTALLA PRINCIPAL
// ============================================
const AlertsScreen: React.FC<{ route?: any }> = ({ route }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<AlertType | null>(null);
  const [initialFilters, setInitialFilters] = useState<
    AlertFilters | undefined
  >();

  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Cargar alertas
  const loadAlerts = useCallback(async () => {
    if (!user) return;
    try {
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
          onPress={handleNewAlert}>
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
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Sin alertas
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Crea una alerta para recibir notificaciones cuando se publiquen
                nuevos procesos.
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.accent }]}
                onPress={handleNewAlert}>
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
                onEdit={handleEdit}
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

      {/* Modal */}
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
  title: { fontSize: scale(34), fontWeight: "700" },
  addButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  contentContainer: { padding: 20 },

  // Alert Card
  alertCard: { padding: 16, borderRadius: scale(12), marginBottom: 12 },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    flex: 1,
  },
  alertName: { fontSize: scale(16), fontWeight: "600", flex: 1 },
  alertFilters: { fontSize: scale(14), marginBottom: 12, lineHeight: scale(20) },
  alertFooter: { flexDirection: "row", alignItems: "center", gap: scale(16) },
  alertMeta: { flexDirection: "row", alignItems: "center", gap: scale(4) },
  alertMetaText: { fontSize: scale(12) },

  // Delete action (mismo estilo que FavoritesScreen)
  deleteAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: scale(90),
    height: "100%",
    borderRadius: scale(12),
  },
  deleteText: {
    fontSize: scale(12),
    fontWeight: "600",
    marginTop: 4,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: scale(20),
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: scale(14),
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: scale(20),
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: scale(12),
    marginTop: 24,
  },
  emptyButtonText: { color: "#FFFFFF", fontSize: scale(16), fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    maxHeight: "95%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalCancel: { fontSize: scale(16) },
  modalTitle: { fontSize: scale(17), fontWeight: "600" },
  modalSave: { fontSize: scale(16), fontWeight: "600" },
  modalBody: { padding: 20 },

  // Inputs
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: scale(14), marginBottom: 8, fontWeight: "500" },
  input: {
    height: scale(48),
    borderRadius: scale(10),
    paddingHorizontal: 16,
    fontSize: scale(16),
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },

  // Location
  locationRow: { flexDirection: "row", gap: scale(10), marginBottom: 8 },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scale(10),
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: scale(6),
    borderWidth: 1,
  },
  locationText: { flex: 1, fontSize: scale(14) },

  // Chips
  chipsScroll: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: scale(20),
    marginRight: 8,
  },
  chipText: { fontSize: scale(13), fontWeight: "500" },

  // Info
  infoBox: {
    flexDirection: "row",
    gap: scale(12),
    padding: 16,
    borderRadius: scale(12),
    marginTop: 24,
    marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: scale(14), lineHeight: scale(20) },

  // Sub Modal
  subModalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    flex: 1,
    maxHeight: "80%",
    marginTop: "auto",
  },
  searchBarSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: scale(40),
    borderRadius: scale(10),
    gap: scale(8),
  },
  searchInputSmall: { flex: 1, fontSize: scale(16) },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  listItemText: { fontSize: scale(16) },
  listContainer: {
    flex: 1,
    minHeight: scale(200),
  },
  emptyList: {
    padding: 20,
    alignItems: "center",
  },
});

export default AlertsScreen;
