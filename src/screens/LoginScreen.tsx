import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { spacing, borderRadius } from "../theme";

type AuthMode = "login" | "register";

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const styles = createStyles(colors);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (mode === "register" && !name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!email.trim()) {
      newErrors.email = "El correo es requerido";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Correo inválido";
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida";
    } else if (password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres";
    }

    if (mode === "register" && password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "login") {
        const result = await login(email, password);
        if (!result.success) {
          Alert.alert("Error", result.error || "Credenciales incorrectas");
        }
      } else {
        const result = await register(name, email, password);
        if (!result.success) {
          Alert.alert("Error", result.error || "No se pudo crear la cuenta");
        }
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setErrors({});
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Logo y título */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="document-text" size={48} color={colors.accent} />
          </View>
          <Text style={styles.title}>SECOP Colombia</Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Inicia sesión para continuar"
              : "Crea tu cuenta"}
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre (solo registro) */}
          {mode === "register" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.name && styles.inputError,
                ]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textTertiary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View
              style={[
                styles.inputContainer,
                errors.email && styles.inputError,
              ]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View
              style={[
                styles.inputContainer,
                errors.password && styles.inputError,
              ]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textTertiary}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirmar contraseña (solo registro) */}
          {mode === "register" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword && styles.inputError,
                ]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textTertiary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          )}

          {/* Botón principal */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.backgroundSecondary} />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Alternar modo */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleLink}>
                {mode === "login" ? "Regístrate" : "Inicia sesión"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={colors.textTertiary}
          />
          <Text style={styles.infoText}>
            Tus datos se guardan de forma segura en tu dispositivo
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
    },

    // Header
    header: {
      alignItems: "center",
      marginTop: spacing.xxl * 2,
      marginBottom: spacing.xxl,
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 25,
      backgroundColor: colors.accentLight,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },

    // Form
    form: {
      marginBottom: spacing.xl,
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      height: 52,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.separatorLight,
    },
    inputError: {
      borderColor: colors.danger,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    errorText: {
      fontSize: 12,
      color: colors.danger,
      marginTop: spacing.xs,
      marginLeft: spacing.xs,
    },

    // Submit button
    submitButton: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.md,
      height: 52,
      justifyContent: "center",
      alignItems: "center",
      marginTop: spacing.md,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.backgroundSecondary,
    },

    // Toggle
    toggleContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: spacing.xl,
      gap: spacing.xs,
    },
    toggleText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    toggleLink: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.accent,
    },

    // Info
    infoContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      marginTop: "auto",
      paddingTop: spacing.xl,
    },
    infoText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
  });

export default LoginScreen;
