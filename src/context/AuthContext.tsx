// src/context/AuthContext.tsx
// Contexto de autenticación con Supabase

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../services/supabase";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

// ============================================
// TIPOS
// ============================================
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  avatarUrl?: string;
}

interface UserPreferences {
  selectedContractTypes: string[];
  onboardingCompleted: boolean;
  notificationsEnabled: boolean;
  theme: "light" | "dark" | "system";
}

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithMagicLink: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  completeOnboarding: (contractTypes: string[]) => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  savePushToken: (token: string) => Promise<void>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  selectedContractTypes: [],
  onboardingCompleted: false,
  notificationsEnabled: true,
  theme: "system",
};

// ============================================
// CONTEXTO
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // ============================================
  // INICIALIZACIÓN
  // ============================================
  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "Auth event:",
        event,
        "Session:",
        !!session,
        "User:",
        !!session?.user
      );
      setSession(session);

      if (event === "SIGNED_IN" && session?.user) {
        console.log("Calling loadUserData...");
        await loadUserData(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setPreferences(DEFAULT_PREFERENCES);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // CARGAR DATOS DEL USUARIO (Corregido)
  // ============================================
  const loadUserData = async (supabaseUser: SupabaseUser) => {
    console.log("Cargando datos para:", supabaseUser.id);
    try {
      // Intentamos leer ambos al tiempo
      const [profileRes, prefsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", supabaseUser.id)
          .single(),
        supabase
          .from("preferences")
          .select("*")
          .eq("user_id", supabaseUser.id)
          .single(),
      ]);

      // Si no existen (porque el trigger falló o el usuario es antiguo)
      // podrías redirigir a un error, pero con el Trigger ya deberían estar ahí.

      if (profileRes.data) {
        setUser({
          id: supabaseUser.id,
          name: profileRes.data.full_name || "Usuario",
          email: supabaseUser.email || "",
          createdAt: supabaseUser.created_at,
          avatarUrl: profileRes.data.avatar_url,
        });
      }

      if (prefsRes.data) {
        setPreferences({
          selectedContractTypes: prefsRes.data.favorite_contract_types || [],
          onboardingCompleted: prefsRes.data.onboarding_completed || false,
          notificationsEnabled: prefsRes.data.notifications_enabled ?? true,
          theme: prefsRes.data.theme || "system",
        });
      }
    } catch (error) {
      console.error("Error en loadUserData:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // ============================================
  // LOGIN CON EMAIL/PASSWORD
  // ============================================
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: getErrorMessage(error.message) };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // REGISTRO
  // ============================================
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        return { success: false, error: getErrorMessage(error.message) };
      }

      // Actualizar nombre en perfil
      if (data.user) {
        await supabase
          .from("profiles")
          .update({ full_name: name })
          .eq("id", data.user.id);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // LOGIN CON MAGIC LINK
  // ============================================
  const loginWithMagicLink = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) {
        return { success: false, error: getErrorMessage(error.message) };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setPreferences(DEFAULT_PREFERENCES);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ============================================
  // ACTUALIZAR PREFERENCIAS
  // ============================================
  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    try {
      const newPrefs = { ...preferences, ...prefs };
      setPreferences(newPrefs);

      if (user) {
        await supabase
          .from("preferences")
          .update({
            theme: newPrefs.theme,
            notifications_enabled: newPrefs.notificationsEnabled,
            onboarding_completed: newPrefs.onboardingCompleted,
            favorite_contract_types: newPrefs.selectedContractTypes,
          })
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  // ============================================
  // COMPLETAR ONBOARDING
  // ============================================
  const completeOnboarding = async (contractTypes: string[]) => {
    await updatePreferences({
      selectedContractTypes: contractTypes,
      onboardingCompleted: true,
    });
  };

  // ============================================
  // ACTUALIZAR PERFIL
  // ============================================
  const updateProfile = async (updates: {
    name?: string;
    avatarUrl?: string;
  }) => {
    try {
      if (!user) return;

      const profileUpdates: any = {};
      if (updates.name) profileUpdates.full_name = updates.name;
      if (updates.avatarUrl) profileUpdates.avatar_url = updates.avatarUrl;

      await supabase.from("profiles").update(profileUpdates).eq("id", user.id);

      setUser({
        ...user,
        name: updates.name || user.name,
        avatarUrl: updates.avatarUrl || user.avatarUrl,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  // ============================================
  // GUARDAR PUSH TOKEN
  // ============================================
  const savePushToken = async (token: string) => {
    try {
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ push_token: token })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  };

  // ============================================
  // RESET PASSWORD
  // ============================================
  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: getErrorMessage(error.message) };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // ============================================
  // HELPER: TRADUCIR ERRORES
  // ============================================
  const getErrorMessage = (error: string): string => {
    const errorMap: Record<string, string> = {
      "Invalid login credentials": "Credenciales inválidas",
      "Email not confirmed": "Por favor confirma tu email",
      "User already registered": "Este email ya está registrado",
      "Password should be at least 6 characters":
        "La contraseña debe tener al menos 6 caracteres",
      "Unable to validate email address: invalid format":
        "Formato de email inválido",
      "Email rate limit exceeded": "Demasiados intentos, espera un momento",
    };

    return errorMap[error] || error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithMagicLink,
        logout,
        updatePreferences,
        completeOnboarding,
        updateProfile,
        savePushToken,
        resetPassword,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
