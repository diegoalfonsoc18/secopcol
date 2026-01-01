// src/services/authService.ts
// Servicio de autenticación con Supabase

import { supabase } from "./supabase";
import { Profile, Preferences } from "../types/database";

// ============================================
// REGISTRO
// ============================================
export const signUp = async (
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: any; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Crear preferencias iniciales
    if (data.user) {
      await createInitialPreferences(data.user.id);
    }

    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// ============================================
// LOGIN
// ============================================
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: any; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

// ============================================
// LOGIN CON MAGIC LINK
// ============================================
export const signInWithMagicLink = async (
  email: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// LOGOUT
// ============================================
export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// OBTENER SESIÓN ACTUAL
// ============================================
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
};

// ============================================
// OBTENER PERFIL
// ============================================
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
};

// ============================================
// ACTUALIZAR PERFIL
// ============================================
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// GUARDAR PUSH TOKEN
// ============================================
export const savePushToken = async (
  userId: string,
  pushToken: string
): Promise<{ error: string | null }> => {
  return updateProfile(userId, { push_token: pushToken });
};

// ============================================
// CREAR PREFERENCIAS INICIALES
// ============================================
const createInitialPreferences = async (userId: string): Promise<void> => {
  try {
    await supabase.from("preferences").insert({
      user_id: userId,
      theme: "system",
      notifications_enabled: true,
      onboarding_completed: false,
      favorite_contract_types: [],
    });
  } catch (error) {
    console.error("Error creating initial preferences:", error);
  }
};

// ============================================
// OBTENER PREFERENCIAS
// ============================================
export const getPreferences = async (
  userId: string
): Promise<Preferences | null> => {
  const { data, error } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching preferences:", error);
    return null;
  }
  return data;
};

// ============================================
// ACTUALIZAR PREFERENCIAS
// ============================================
export const updatePreferences = async (
  userId: string,
  updates: Partial<Preferences>
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("preferences")
      .update(updates)
      .eq("user_id", userId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// LISTENER DE CAMBIOS DE AUTH
// ============================================
export const onAuthStateChange = (
  callback: (event: string, session: any) => void
) => {
  return supabase.auth.onAuthStateChange(callback);
};

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = async (
  email: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};
