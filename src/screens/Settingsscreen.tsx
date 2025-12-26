import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { spacing, borderRadius } from "../theme";
import { useTheme } from "../context/ThemeContext";
import {
  COLOMBIAN_DEPARTMENTS,
  MUNICIPALITIES_BY_DEPARTMENT,
} from "../types/index";
import {
  requestNotificationPermissions,
  getNotificationSettings,
  setNotificationsEnabled,
  addWatchedMunicipality,
  removeWatchedMunicipality,
  toggleWatchedModality,
  toggleWatchedContractType,
  checkForNewProcesses,
  NotificationSettings,
  MODALIDADES_CONTRATACION,
  TIPOS_CONTRATO,
} from "../services/Notificaciones";

// ============================================
// COMPONENTE DE SELECTOR DE MUNICIPIO
// ============================================
interface MunicipalitySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (municipality: string) => void;
  selectedMunicipalities: string[];
}

const MunicipalitySelector: React.FC<MunicipalitySelectorProps> = ({
  visible,
  onClose,
  onSelect,
  selectedMunicipalities,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState("");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const selectorStyles = createSelectorStyles(colors);

  const allMunicipalities = React.useMemo(() => {
    const result: { municipality: string; department: string }[] = [];
    const departments = selectedDept
      ? [selectedDept]
      : Object.keys(MUNICIPALITIES_BY_DEPARTMENT);

    departments.forEach((dept) => {
      const municipalities = MUNICIPALITIES_BY_DEPARTMENT[dept] || [];
      municipalities.forEach((mun) => {
        if (!selectedMunicipalities.includes(mun)) {
          result.push({ municipality: mun, department: dept });
        }
      });
    });

    return result;
  }, [selectedDept, selectedMunicipalities]);

  const filteredMunicipalities = React.useMemo(() => {
    if (!searchText) return allMunicipalities;
    const search = searchText.toLowerCase();
    return allMunicipalities.filter(
      (item) =>
        item.municipality.toLowerCase().includes(search) ||
        item.department.toLowerCase().includes(search)
    );
  }, [allMunicipalities, searchText]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={[selectorStyles.container, { paddingTop: insets.top }]}>
        <View style={selectorStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={selectorStyles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={selectorStyles.title}>Agregar Municipio</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={selectorStyles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={selectorStyles.searchInput}
            placeholder="Buscar municipio..."
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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={selectorStyles.deptScroll}
          contentContainerStyle={selectorStyles.deptContainer}>
          <TouchableOpacity
            style={[
              selectorStyles.deptChip,
              !selectedDept && selectorStyles.deptChipSelected,
            ]}
            onPress={() => setSelectedDept(null)}>
            <Text
              style={[
                selectorStyles.deptChipText,
                !selectedDept && selectorStyles.deptChipTextSelected,
              ]}>
              Todos
            </Text>
          </TouchableOpacity>
          {COLOMBIAN_DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[
                selectorStyles.deptChip,
                selectedDept === dept && selectorStyles.deptChipSelected,
              ]}
              onPress={() => setSelectedDept(dept)}>
              <Text
                style={[
                  selectorStyles.deptChipText,
                  selectedDept === dept && selectorStyles.deptChipTextSelected,
                ]}
                numberOfLines={1}>
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredMunicipalities}
          keyExtractor={(item) => `${item.department}-${item.municipality}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={selectorStyles.municipalityItem}
              onPress={() => {
                onSelect(item.municipality);
                onClose();
              }}>
              <View>
                <Text style={selectorStyles.municipalityName}>
                  {item.municipality}
                </Text>
                <Text style={selectorStyles.municipalityDept}>
                  {item.department}
                </Text>
              </View>
              <Ionicons name="add-circle" size={24} color={colors.accent} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View style={selectorStyles.separator} />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={() => (
            <View style={selectorStyles.emptyContainer}>
              <Ionicons
                name="location-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={selectorStyles.emptyText}>
                No se encontraron municipios
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SettingsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    watchedMunicipalities: [],
    watchedModalities: [],
    watchedContractTypes: [],
    lastCheckDate: null,
  });
  const [showSelector, setShowSelector] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const loaded = await getNotificationSettings();
    setSettings(loaded);
    setLoading(false);
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Permisos requeridos",
          "Necesitas permitir notificaciones para recibir alertas de nuevos procesos.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    await setNotificationsEnabled(value);
    setSettings((prev) => ({ ...prev, enabled: value }));
  };

  const handleAddMunicipality = async (municipality: string) => {
    const updated = await addWatchedMunicipality(municipality);
    setSettings((prev) => ({ ...prev, watchedMunicipalities: updated }));
  };

  const handleRemoveMunicipality = async (municipality: string) => {
    Alert.alert(
      "Eliminar municipio",
      `¿Dejar de recibir alertas de ${municipality}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const updated = await removeWatchedMunicipality(municipality);
            setSettings((prev) => ({
              ...prev,
              watchedMunicipalities: updated,
            }));
          },
        },
      ]
    );
  };

  const handleToggleModality = async (modalityId: string) => {
    const updated = await toggleWatchedModality(modalityId);
    setSettings((prev) => ({ ...prev, watchedModalities: updated }));
  };

  const handleToggleContractType = async (typeId: string) => {
    const updated = await toggleWatchedContractType(typeId);
    setSettings((prev) => ({ ...prev, watchedContractTypes: updated }));
  };

  const handleCheckNow = async () => {
    if (settings.watchedMunicipalities.length === 0) {
      Alert.alert(
        "Sin municipios",
        "Agrega al menos un municipio para verificar nuevos procesos."
      );
      return;
    }

    setChecking(true);
    const newProcesses = await checkForNewProcesses();
    setChecking(false);

    if (newProcesses.length > 0) {
      Alert.alert(
        "Nuevos procesos",
        `Se encontraron ${newProcesses.length} procesos nuevos en tus municipios de interés.`
      );
    } else {
      Alert.alert("Sin novedades", "No hay procesos nuevos en este momento.");
    }

    setSettings((prev) => ({
      ...prev,
      lastCheckDate: new Date().toISOString(),
    }));
  };

  const formatLastCheck = (dateString: string | null): string => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return date.toLocaleString("es-CO", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActiveFiltersCount = () => {
    return (
      settings.watchedMunicipalities.length +
      settings.watchedModalities.length +
      settings.watchedContractTypes.length
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}>
        {/* Sección: Activar notificaciones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.sectionTitle}>Alertas</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Activar notificaciones</Text>
                <Text style={styles.settingDesc}>
                  Recibe alertas de nuevos procesos
                </Text>
              </View>
              <Switch
                value={settings.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{
                  false: colors.backgroundTertiary,
                  true: colors.accentLight,
                }}
                thumbColor={
                  settings.enabled ? colors.accent : colors.textTertiary
                }
              />
            </View>

            {settings.enabled && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={handleCheckNow}
                  disabled={checking}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Verificar ahora</Text>
                    <Text style={styles.settingDesc}>
                      Última: {formatLastCheck(settings.lastCheckDate)}
                    </Text>
                  </View>
                  {checking ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons name="refresh" size={22} color={colors.accent} />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Resumen de filtros activos */}
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filtersSummary}>
              <Ionicons name="funnel-outline" size={16} color={colors.accent} />
              <Text style={styles.filtersSummaryText}>
                {getActiveFiltersCount()} filtro(s) activo(s)
              </Text>
            </View>
          )}
        </View>

        {/* Sección: Municipios de interés */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Municipios</Text>
            {settings.watchedMunicipalities.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {settings.watchedMunicipalities.length}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionDesc}>
            Recibirás alertas de procesos en estos municipios
          </Text>

          <View style={styles.card}>
            {settings.watchedMunicipalities.length === 0 ? (
              <View style={styles.emptyMunicipalities}>
                <Ionicons
                  name="location-outline"
                  size={32}
                  color={colors.textTertiary}
                />
                <Text style={styles.emptyText}>
                  No hay municipios seleccionados
                </Text>
              </View>
            ) : (
              settings.watchedMunicipalities.map((municipality, index) => (
                <React.Fragment key={municipality}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.municipalityRow}>
                    <View style={styles.municipalityInfo}>
                      <Ionicons
                        name="location"
                        size={18}
                        color={colors.accent}
                      />
                      <Text style={styles.municipalityName}>
                        {municipality}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveMunicipality(municipality)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </React.Fragment>
              ))
            )}

            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowSelector(true)}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.addButtonText}>Agregar municipio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Modalidad de contratación */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="layers-outline" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Modalidad</Text>
            {settings.watchedModalities.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {settings.watchedModalities.length}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionDesc}>
            Filtra por modalidad. Sin selección = todas las modalidades.
          </Text>

          <View style={styles.chipsGrid}>
            {MODALIDADES_CONTRATACION.map((modalidad) => {
              const isSelected = settings.watchedModalities.includes(
                modalidad.id
              );
              return (
                <TouchableOpacity
                  key={modalidad.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => handleToggleModality(modalidad.id)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={modalidad.icon as any}
                    size={16}
                    color={
                      isSelected ? colors.backgroundSecondary : colors.accent
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}>
                    {modalidad.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.backgroundSecondary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sección: Tipo de contrato */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.accent}
            />
            <Text style={styles.sectionTitle}>Tipo de Contrato</Text>
            {settings.watchedContractTypes.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {settings.watchedContractTypes.length}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionDesc}>
            Filtra por tipo. Sin selección = todos los tipos.
          </Text>

          <View style={styles.chipsGrid}>
            {TIPOS_CONTRATO.map((tipo) => {
              const isSelected = settings.watchedContractTypes.includes(
                tipo.id
              );
              return (
                <TouchableOpacity
                  key={tipo.id}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => handleToggleContractType(tipo.id)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={tipo.icon as any}
                    size={16}
                    color={
                      isSelected ? colors.backgroundSecondary : colors.success
                    }
                  />
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                    ]}>
                    {tipo.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.backgroundSecondary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.infoText}>
            Las notificaciones se verifican cuando abres la app. Combina
            municipios con modalidades y tipos de contrato para filtros
            precisos.
          </Text>
        </View>
      </ScrollView>

      {/* Selector de municipio */}
      <MunicipalitySelector
        visible={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={handleAddMunicipality}
        selectedMunicipalities={settings.watchedMunicipalities}
      />
    </View>
  );
};

// ============================================
// ESTILOS DEL SELECTOR
// ============================================
const createSelectorStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.separatorLight,
      backgroundColor: colors.backgroundSecondary,
    },
    cancelText: {
      fontSize: 16,
      color: colors.accent,
    },
    title: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundTertiary,
      margin: spacing.lg,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      height: 40,
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    deptScroll: {
      maxHeight: 44,
      marginBottom: spacing.md,
    },
    deptContainer: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    deptChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.separatorLight,
    },
    deptChipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    deptChipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    deptChipTextSelected: {
      color: colors.backgroundSecondary,
    },
    municipalityItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.backgroundSecondary,
    },
    municipalityName: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    municipalityDept: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    separator: {
      height: 1,
      backgroundColor: colors.separatorLight,
      marginLeft: spacing.lg,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: spacing.xxl,
      gap: spacing.md,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textTertiary,
    },
  });

// ============================================
// ESTILOS PRINCIPALES
// ============================================
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.background,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    // Scroll
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },

    // Sections
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionDesc: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
    badge: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
      minWidth: 22,
      alignItems: "center",
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.backgroundSecondary,
    },

    // Filters summary
    filtersSummary: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.full,
      alignSelf: "flex-start",
    },
    filtersSummaryText: {
      fontSize: 13,
      color: colors.accent,
      fontWeight: "500",
    },

    // Card
    card: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },

    // Setting row
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
    },
    settingInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    settingTitle: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    settingDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Divider
    divider: {
      height: 1,
      backgroundColor: colors.separatorLight,
      marginLeft: spacing.lg,
    },

    // Municipality
    emptyMunicipalities: {
      alignItems: "center",
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    municipalityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
    },
    municipalityInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    municipalityName: {
      fontSize: 16,
      color: colors.textPrimary,
    },

    // Add button
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      gap: spacing.sm,
    },
    addButtonText: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: "500",
    },

    // Chips grid
    chipsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: colors.separatorLight,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    chipSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipText: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    chipTextSelected: {
      color: colors.backgroundSecondary,
    },

    // Info
    infoCard: {
      flexDirection: "row",
      backgroundColor: colors.accentLight,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });

export default SettingsScreen;
