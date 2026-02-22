// src/services/obligationService.ts
// Servicio CRUD para obligaciones tributarias de contratos

import { supabase } from "./supabase";
import { ContractObligation, ObligationType, ObligationStatus } from "../types/database";

// ============================================
// OBTENER OBLIGACIONES DEL USUARIO
// ============================================
export const getObligations = async (userId: string): Promise<ContractObligation[]> => {
  const { data, error } = await supabase
    .from("contract_obligations")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching obligations:", error);
    return [];
  }
  return data || [];
};

// ============================================
// OBTENER OBLIGACIONES POR PROCESO
// ============================================
export const getObligationsByProcess = async (
  userId: string,
  processId: string
): Promise<ContractObligation[]> => {
  const { data, error } = await supabase
    .from("contract_obligations")
    .select("*")
    .eq("user_id", userId)
    .eq("process_id", processId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching obligations by process:", error);
    return [];
  }
  return data || [];
};

// ============================================
// OBTENER PROXIMAS OBLIGACIONES
// ============================================
export const getUpcomingObligations = async (
  userId: string,
  days: number = 30
): Promise<ContractObligation[]> => {
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("contract_obligations")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "completed")
    .gte("due_date", today)
    .lte("due_date", futureDateStr)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming obligations:", error);
    return [];
  }
  return data || [];
};

// ============================================
// CREAR OBLIGACION
// ============================================
export const createObligation = async (
  data: {
    user_id: string;
    process_id: string;
    process_name?: string;
    obligation_type: ObligationType;
    title: string;
    description?: string;
    due_date: string;
    estimated_amount?: number;
    reminder_days?: number[];
    notes?: string;
  }
): Promise<{ obligation: ContractObligation | null; error: string | null }> => {
  try {
    const { data: result, error } = await supabase
      .from("contract_obligations")
      .insert({
        user_id: data.user_id,
        process_id: data.process_id,
        process_name: data.process_name || null,
        obligation_type: data.obligation_type,
        title: data.title,
        description: data.description || null,
        due_date: data.due_date,
        estimated_amount: data.estimated_amount || null,
        reminder_days: data.reminder_days || [7, 1],
        notes: data.notes || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return { obligation: result, error: null };
  } catch (error: any) {
    return { obligation: null, error: error.message };
  }
};

// ============================================
// ACTUALIZAR OBLIGACION
// ============================================
export const updateObligation = async (
  obligationId: string,
  updates: {
    title?: string;
    description?: string;
    due_date?: string;
    estimated_amount?: number | null;
    obligation_type?: ObligationType;
    reminder_days?: number[];
    notes?: string;
    status?: ObligationStatus;
  }
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("contract_obligations")
      .update(updates)
      .eq("id", obligationId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// ELIMINAR OBLIGACION
// ============================================
export const deleteObligation = async (
  obligationId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("contract_obligations")
      .delete()
      .eq("id", obligationId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// MARCAR COMO COMPLETADA
// ============================================
export const markCompleted = async (
  obligationId: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from("contract_obligations")
      .update({
        status: "completed" as ObligationStatus,
        completed_at: new Date().toISOString(),
      })
      .eq("id", obligationId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

// ============================================
// VERIFICAR Y ACTUALIZAR OBLIGACIONES VENCIDAS
// ============================================
export const checkOverdue = async (
  userId: string
): Promise<{ updated: number; error: string | null }> => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("contract_obligations")
      .update({ status: "overdue" as ObligationStatus })
      .eq("user_id", userId)
      .eq("status", "pending")
      .lt("due_date", today)
      .select();

    if (error) throw error;
    return { updated: data?.length || 0, error: null };
  } catch (error: any) {
    return { updated: 0, error: error.message };
  }
};

// ============================================
// OBTENER OBLIGACIONES POR MES
// ============================================
export const getObligationsByMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<ContractObligation[]> => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const { data, error } = await supabase
    .from("contract_obligations")
    .select("*")
    .eq("user_id", userId)
    .gte("due_date", startDate)
    .lte("due_date", endDate)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("Error fetching obligations by month:", error);
    return [];
  }
  return data || [];
};

// ============================================
// HELPERS
// ============================================
export const OBLIGATION_TYPE_CONFIG: Record<
  ObligationType,
  { label: string; icon: string; color: string }
> = {
  estampilla: { label: "Estampilla", icon: "receipt-outline", color: "#06923E" },
  retencion: { label: "Retención", icon: "cash-outline", color: "#FF9500" },
  seguridad_social: { label: "Seguridad Social", icon: "shield-checkmark-outline", color: "#5856D6" },
  informe: { label: "Informe", icon: "document-text-outline", color: "#007AFF" },
};

export const OBLIGATION_STATUS_CONFIG: Record<
  ObligationStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pendiente", color: "#FF9500" },
  completed: { label: "Completada", color: "#34C759" },
  overdue: { label: "Vencida", color: "#FF3B30" },
};
