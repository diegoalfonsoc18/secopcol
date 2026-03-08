// src/services/supabase.ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Adapter seguro para almacenar tokens de auth con expo-secure-store
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper para obtener la URL de redirect
export const getRedirectUrl = () => {
  return Linking.createURL("/");
};

export { SUPABASE_URL, SUPABASE_ANON_KEY };
