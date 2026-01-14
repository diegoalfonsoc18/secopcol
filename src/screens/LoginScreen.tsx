import React, { useState, useEffect } from "react";
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
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { spacing, borderRadius } from "../theme";
import { GoogleIcon, SecopcolLogo } from "../assets/icons";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS_CLIENT_ID =
  "1081648609668-btjn1qto01u9uqvr25m423b4ughplc6j.apps.googleusercontent.com";
const GOOGLE_WEB_CLIENT_ID =
  "1081648609668-isvpbhqkkpb79m1t8tpqn2jk6sj7d8s2.apps.googleusercontent.com";

type AuthMode = "login" | "register";

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { login, register, loginWithGoogle, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const styles = createStyles(colors);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    const handleGoogleLogin = async (idToken: string) => {
      try {
        const result = await loginWithGoogle(idToken);
        if (!result.success) {
          Alert.alert(
            "Error",
            result.error || "No se pudo iniciar sesión con Google"
          );
        }
      } catch {
        Alert.alert("Error", "Ocurrió un error inesperado");
      } finally {
        setGoogleLoading(false);
      }
    };

    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleLogin(id_token);
      } else {
        setGoogleLoading(false);
        Alert.alert("Error", "No se recibió el token de Google");
      }
    } else if (response?.type === "error") {
      setGoogleLoading(false);
      Alert.alert("Error", "No se pudo iniciar sesión con Google");
    } else if (response?.type === "dismiss") {
      setGoogleLoading(false);
    }
  }, [response, loginWithGoogle]);

  const onGooglePress = async () => {
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch {
      setGoogleLoading(false);
      Alert.alert("Error", "No se pudo iniciar el proceso de autenticación");
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Correo requerido",
        "Ingresa tu correo electrónico para restablecer tu contraseña"
      );
      return;
    }

    try {
      const result = await resetPassword(email);
      if (result.success) {
        Alert.alert(
          "Correo enviado",
          "Revisa tu bandeja de entrada para restablecer tu contraseña"
        );
      } else {
        Alert.alert("Error", result.error || "No se pudo enviar el correo");
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error inesperado");
    }
  };

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
          <SecopcolLogo size={80} color={colors.accent} />
          <Text style={styles.title}>Secopcol</Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Accede a contratos públicos de Colombia"
              : "Crea tu cuenta gratuita"}
          </Text>
        </View>

        {/* Botón de Google */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={onGooglePress}
          disabled={googleLoading || !request}
          activeOpacity={0.8}>
          {googleLoading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <GoogleIcon size={20} />
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o continúa con email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nombre (solo registro) */}
          {mode === "register" && (
            <View style={styles.inputGroup}>
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
                  placeholder="Nombre completo"
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
                placeholder="Correo electrónico"
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
                placeholder="Contraseña"
                placeholderTextColor={colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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

          {/* Olvidé mi contraseña (solo login) */}
          {mode === "login" && (
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          )}

          {/* Confirmar contraseña (solo registro) */}
          {mode === "register" && (
            <View style={styles.inputGroup}>
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
                  placeholder="Confirmar contraseña"
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
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
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
            size={14}
            color={colors.textTertiary}
          />
          <Text style={styles.infoText}>
            Tus datos están protegidos de forma segura
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
      marginTop: spacing.xxl,
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: 32,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: spacing.md,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      textAlign: "center",
    },

    // Google Button
    googleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      height: 52,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    googleButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    // Divider
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    dividerText: {
      marginHorizontal: spacing.md,
      fontSize: 13,
      color: colors.textTertiary,
    },

    // Form
    form: {
      marginBottom: spacing.lg,
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      height: 52,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.separator,
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
      marginLeft: spacing.sm,
    },

    // Forgot password
    forgotPassword: {
      alignSelf: "flex-end",
      marginBottom: spacing.md,
      marginTop: -spacing.xs,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: "500",
    },

    // Submit button
    submitButton: {
      backgroundColor: colors.accent,
      borderRadius: borderRadius.lg,
      height: 52,
      justifyContent: "center",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },

    // Toggle
    toggleContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: spacing.lg,
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
      gap: spacing.xs,
      marginTop: "auto",
      paddingTop: spacing.lg,
    },
    infoText: {
      fontSize: 12,
      color: colors.textTertiary,
    },
  });

export default LoginScreen;
