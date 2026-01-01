// src/services/syncService.ts
// Servicio de sincronización de favoritos y filtros con Supabase

import { supabase } from "./supabase";
import { Favorite, SavedFilter } from "../types/database";
import { SecopProcess } from "../types";

// ============================================
// FAVORITOS
// ============================================

// Obtener todos los favoritos del usuario
export const getFavorites = async (userId: string): Promise<Favorite[]> => {
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
  return data || [];
};

// Agregar favorito
export const addFavorite = async (
  userId: string,
  process: SecopProcess
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from("favorites").insert({
      user_id: userId,
      process_id: process.id_del_proceso,
      process_data: process,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    // Ignorar error de duplicado
    if (error.code === "23505") {
      return { error: null };
    }
    return { error: error.message };
  }
};

// Eliminar favorito
export const removeFavorite = async (
  userId: string,
  processId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("process_id", processId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Verificar si es favorito
export const isFavorite = async (
  userId: string,
  processId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("process_id", processId)
    .single();

  return !!data;
};

// Sincronizar favoritos locales con la nube
export const syncFavorites = async (
  userId: string,
  localFavorites: SecopProcess[]
): Promise<void> => {
  // Obtener favoritos de la nube
  const cloudFavorites = await getFavorites(userId);
  const cloudIds = new Set(cloudFavorites.map((f) => f.process_id));
  const localIds = new Set(localFavorites.map((p) => p.id_del_proceso));

  // Subir favoritos locales que no están en la nube
  for (const process of localFavorites) {
    if (!cloudIds.has(process.id_del_proceso)) {
      await addFavorite(userId, process);
    }
  }

  // Los favoritos de la nube que no están localmente se agregan al retornar
};

// ============================================
// FILTROS GUARDADOS
// ============================================

// Obtener filtros guardados
export const getSavedFilters = async (
  userId: string
): Promise<SavedFilter[]> => {
  const { data, error } = await supabase
    .from("saved_filters")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching saved filters:", error);
    return [];
  }
  return data || [];
};

// Guardar filtro
export const saveFilter = async (
  userId: string,
  name: string,
  filters: any
): Promise<{ id: string | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from("saved_filters")
      .insert({
        user_id: userId,
        name,
        filters,
      })
      .select("id")
      .single();

    if (error) throw error;
    return { id: data?.id || null, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

// Actualizar filtro
export const updateSavedFilter = async (
  filterId: string,
  updates: { name?: string; filters?: any }
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("saved_filters")
      .update(updates)
      .eq("id", filterId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Eliminar filtro
export const deleteSavedFilter = async (
  filterId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("saved_filters")
      .delete()
      .eq("id", filterId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Establecer filtro por defecto
export const setDefaultFilter = async (
  userId: string,
  filterId: string
): Promise<{ error: string | null }> => {
  try {
    // Quitar default de todos los filtros
    await supabase
      .from("saved_filters")
      .update({ is_default: false })
      .eq("user_id", userId);

    // Establecer el nuevo default
    const { error } = await supabase
      .from("saved_filters")
      .update({ is_default: true })
      .eq("id", filterId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};
