// src/services/alertService.ts
// Servicio de alertas/alarmas de búsqueda

import { supabase } from "./supabase";
import { Alert, AlertFilters, AlertHistory } from "../types/database";

// ============================================
// OBTENER ALERTAS
// ============================================
export const getAlerts = async (userId: string): Promise<Alert[]> => {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
  return data || [];
};

// ============================================
// OBTENER UNA ALERTA
// ============================================
export const getAlert = async (alertId: string): Promise<Alert | null> => {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("id", alertId)
    .single();

  if (error) {
    console.error("Error fetching alert:", error);
    return null;
  }
  return data;
};

// ============================================
// CREAR ALERTA
// ============================================
export const createAlert = async (
  userId: string,
  name: string,
  filters: AlertFilters,
  frequencyHours: number = 6
): Promise<{ alert: Alert | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .insert({
        user_id: userId,
        name,
        filters,
        frequency_hours: frequencyHours,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return { alert: data, error: null };
  } catch (error: any) {
    return { alert: null, error: error.message };
  }
};

// ============================================
// ACTUALIZAR ALERTA
// ============================================
export const updateAlert = async (
  alertId: string,
  updates: {
    name?: string;
    filters?: AlertFilters;
    frequency_hours?: number;
    is_active?: boolean;
  }
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("alerts")
      .update(updates)
      .eq("id", alertId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// ELIMINAR ALERTA
// ============================================
export const deleteAlert = async (
  alertId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.from("alerts").delete().eq("id", alertId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// TOGGLE ALERTA ACTIVA/INACTIVA
// ============================================
export const toggleAlert = async (
  alertId: string,
  isActive: boolean
): Promise<{ error: string | null }> => {
  return updateAlert(alertId, { is_active: isActive });
};

// ============================================
// OBTENER HISTORIAL DE ALERTA
// ============================================
export const getAlertHistory = async (
  alertId: string,
  limit: number = 10
): Promise<AlertHistory[]> => {
  const { data, error } = await supabase
    .from("alert_history")
    .select("*")
    .eq("alert_id", alertId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching alert history:", error);
    return [];
  }
  return data || [];
};

// ============================================
// FRECUENCIAS DISPONIBLES
// ============================================
export const ALERT_FREQUENCIES = [
  { value: 1, label: "Cada hora" },
  { value: 3, label: "Cada 3 horas" },
  { value: 6, label: "Cada 6 horas" },
  { value: 12, label: "Cada 12 horas" },
  { value: 24, label: "Una vez al día" },
];

// ============================================
// FORMATEAR FILTROS PARA MOSTRAR
// ============================================
export const formatAlertFilters = (filters: AlertFilters): string => {
  const parts: string[] = [];

  if (filters.keyword) {
    parts.push(`"${filters.keyword}"`);
  }
  if (filters.departamento) {
    parts.push(filters.departamento);
  }
  if (filters.municipio) {
    parts.push(filters.municipio);
  }
  if (filters.tipo_contrato) {
    parts.push(filters.tipo_contrato);
  }
  if (filters.modalidad) {
    parts.push(filters.modalidad);
  }

  return parts.length > 0 ? parts.join(" • ") : "Todos los procesos";
};
