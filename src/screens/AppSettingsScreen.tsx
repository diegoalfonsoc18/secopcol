import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { spacing, borderRadius } from "../theme";

type ThemeMode = "light" | "dark" | "system";

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: string }[] = [
  { id: "light", label: "Claro", icon: "sunny-outline" },
  { id: "dark", label: "Oscuro", icon: "moon-outline" },
  { id: "system", label: "Sistema", icon: "phone-portrait-outline" },
];

export const AppSettingsScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { mode, setMode, colors, isDark } = useTheme();
  const { user, logout } = useAuth();

  const handleOpenSecop = () => {
    Linking.openURL("https://community.secop.gov.co/");
  };

  const handleOpenDatosAbiertos = () => {
    Linking.openURL("https://www.datos.gov.co/");
  };

  const handleRateApp = () => {
    Alert.alert(
      "Próximamente",
      "La app estará disponible en las tiendas pronto."
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: () => logout(),
        },
      ]
    );
  };

  const styles = createStyles(colors);

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Ajustes
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}>
        {/* Sección: Cuenta */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Cuenta
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.backgroundSecondary },
            ]}>
            {/* Perfil del usuario */}
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarText}>
                  {user?.name ? getInitials(user.name) : "U"}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text
                  style={[styles.profileName, { color: colors.textPrimary }]}>
                  {user?.name || "Usuario"}
                </Text>
                <Text
                  style={[
                    styles.profileEmail,
                    { color: colors.textSecondary },
                  ]}>
                  {user?.email || "Sin email"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.divider,
                { backgroundColor: colors.separatorLight, marginLeft: 0 },
              ]}
            />

            {/* Botón cerrar sesión */}
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
              <View style={styles.optionInfo}>
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: colors.dangerLight },
                  ]}>
                  <Ionicons
                    name="log-out-outline"
                    size={20}
                    color={colors.danger}
                  />
                </View>
                <Text style={[styles.optionText, { color: colors.danger }]}>
                  Cerrar Sesión
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Apariencia */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={colors.accent}
            />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Apariencia
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.backgroundSecondary },
            ]}>
            {THEME_OPTIONS.map((option, index) => {
              const isSelected = mode === option.id;
              const isLast = index === THEME_OPTIONS.length - 1;

              return (
                <React.Fragment key={option.id}>
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => setMode(option.id)}>
                    <View style={styles.optionInfo}>
                      <View
                        style={[
                          styles.optionIcon,
                          { backgroundColor: colors.accentLight },
                        ]}>
                        <Ionicons
                          name={option.icon as any}
                          size={20}
                          color={colors.accent}
                        />
                      </View>
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.textPrimary },
                        ]}>
                        {option.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.accent}
                      />
                    )}
                  </TouchableOpacity>
                  {!isLast && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.separatorLight },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          <Text style={[styles.sectionFooter, { color: colors.textTertiary }]}>
            {isDark ? "🌙 Modo oscuro activo" : "☀️ Modo claro activo"}
          </Text>
        </View>

        {/* Sección: Enlaces */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link-outline" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Enlaces Útiles
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.backgroundSecondary },
            ]}>
            <TouchableOpacity style={styles.linkRow} onPress={handleOpenSecop}>
              <View style={styles.optionInfo}>
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: colors.successLight },
                  ]}>
                  <Ionicons
                    name="globe-outline"
                    size={20}
                    color={colors.success}
                  />
                </View>
                <View>
                  <Text
                    style={[styles.optionText, { color: colors.textPrimary }]}>
                    Portal SECOP II
                  </Text>
                  <Text
                    style={[
                      styles.optionSubtext,
                      { color: colors.textSecondary },
                    ]}>
                    community.secop.gov.co
                  </Text>
                </View>
              </View>
              <Ionicons
                name="open-outline"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.divider,
                { backgroundColor: colors.separatorLight },
              ]}
            />

            <TouchableOpacity
              style={styles.linkRow}
              onPress={handleOpenDatosAbiertos}>
              <View style={styles.optionInfo}>
                <View
                  style={[
                    styles.optionIcon,
                    { backgroundColor: colors.warningLight },
                  ]}>
                  <Ionicons
                    name="server-outline"
                    size={20}
                    color={colors.warning}
                  />
                </View>
                <View>
                  <Text
                    style={[styles.optionText, { color: colors.textPrimary }]}>
                    Datos Abiertos Colombia
                  </Text>
                  <Text
                    style={[
                      styles.optionSubtext,
                      { color: colors.textSecondary },
                    ]}>
                    datos.gov.co
                  </Text>
                </View>
              </View>
              <Ionicons
                name="open-outline"
                size={20}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Acerca de */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.accent}
            />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Acerca de
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.backgroundSecondary },
            ]}>
            <View style={styles.aboutRow}>
              <Text
                style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                Versión
              </Text>
              <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>
                1.0.0
              </Text>
            </View>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.separatorLight, marginLeft: 0 },
              ]}
            />
            <View style={styles.aboutRow}>
              <Text
                style={[styles.aboutLabel, { color: colors.textSecondary }]}>
                Desarrollado por
              </Text>
              <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>
                Diego Alfonso
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.rateButton, { backgroundColor: colors.accent }]}
            onPress={handleRateApp}>
            <Ionicons
              name="star-outline"
              size={20}
              color={colors.backgroundSecondary}
            />
            <Text
              style={[
                styles.rateButtonText,
                { color: colors.backgroundSecondary },
              ]}>
              Calificar la App
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.accentLight }]}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={colors.accent}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Esta app utiliza datos públicos del portal SECOP II de Colombia
            Compra Eficiente.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
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
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
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
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionFooter: {
      fontSize: 13,
      marginTop: spacing.sm,
      marginLeft: spacing.xs,
    },
    card: {
      borderRadius: borderRadius.md,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    // Profile styles
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.lg,
      gap: spacing.md,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: 20,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 2,
    },
    profileEmail: {
      fontSize: 14,
    },
    logoutRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
    },
    optionInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    optionIcon: {
      width: 36,
      height: 36,
      borderRadius: borderRadius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    optionText: {
      fontSize: 16,
      fontWeight: "500",
    },
    optionSubtext: {
      fontSize: 12,
      marginTop: 2,
    },
    divider: {
      height: 1,
      marginLeft: spacing.lg + 36 + spacing.md,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
    },
    aboutRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.lg,
    },
    aboutLabel: {
      fontSize: 15,
    },
    aboutValue: {
      fontSize: 15,
      fontWeight: "500",
    },
    rateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      borderRadius: borderRadius.md,
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    rateButtonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    infoCard: {
      flexDirection: "row",
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
  });

export default AppSettingsScreen;
