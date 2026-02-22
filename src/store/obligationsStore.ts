// src/store/obligationsStore.ts
// Store Zustand para obligaciones tributarias

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ContractObligation, ObligationType } from "../types/database";
import * as obligationService from "../services/obligationService";

// ============================================
// TIPOS DEL STORE
// ============================================
interface ObligationsState {
  obligations: ContractObligation[];
  loading: boolean;
  error: string | null;

  // Acciones de datos
  fetchObligations: (userId: string) => Promise<void>;
  fetchByMonth: (userId: string, year: number, month: number) => Promise<void>;
  addObligation: (data: {
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
  }) => Promise<{ success: boolean; error?: string }>;
  updateObligation: (
    id: string,
    updates: Partial<ContractObligation>
  ) => Promise<{ success: boolean; error?: string }>;
  removeObligation: (id: string) => Promise<{ success: boolean; error?: string }>;
  markCompleted: (id: string) => Promise<{ success: boolean; error?: string }>;
  checkOverdue: (userId: string) => Promise<void>;

  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// ============================================
// STORE
// ============================================
export const useObligationsStore = create<ObligationsState>()(
  persist(
    (set, get) => ({
      obligations: [],
      loading: false,
      error: null,
      _hasHydrated: false,

      // Cargar todas las obligaciones del usuario
      fetchObligations: async (userId: string) => {
        set({ loading: true, error: null });
        try {
          const data = await obligationService.getObligations(userId);
          set({ obligations: data, loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error cargando obligaciones";
          set({ error: message, loading: false });
          console.error("Error fetching obligations:", message);
        }
      },

      // Cargar por mes
      fetchByMonth: async (userId: string, year: number, month: number) => {
        set({ loading: true, error: null });
        try {
          const data = await obligationService.getObligationsByMonth(userId, year, month);
          set({ obligations: data, loading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Error cargando obligaciones";
          set({ error: message, loading: false });
        }
      },

      // Crear nueva obligacion
      addObligation: async (data) => {
        try {
          const { obligation, error } = await obligationService.createObligation(data);
          if (error || !obligation) {
            return { success: false, error: error || "Error desconocido" };
          }
          const { obligations } = get();
          const updated = [...obligations, obligation].sort(
            (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
          set({ obligations: updated });
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      // Actualizar obligacion
      updateObligation: async (id, updates) => {
        try {
          // Convertir nulls a undefined para compatibilidad con el servicio
          const serviceUpdates: Parameters<typeof obligationService.updateObligation>[1] = {};
          if (updates.title !== undefined) serviceUpdates.title = updates.title;
          if (updates.description !== undefined) serviceUpdates.description = updates.description ?? undefined;
          if (updates.due_date !== undefined) serviceUpdates.due_date = updates.due_date;
          if (updates.estimated_amount !== undefined) serviceUpdates.estimated_amount = updates.estimated_amount;
          if (updates.obligation_type !== undefined) serviceUpdates.obligation_type = updates.obligation_type;
          if (updates.reminder_days !== undefined) serviceUpdates.reminder_days = updates.reminder_days;
          if (updates.notes !== undefined) serviceUpdates.notes = updates.notes ?? undefined;
          if (updates.status !== undefined) serviceUpdates.status = updates.status;

          const { error } = await obligationService.updateObligation(id, serviceUpdates);
          if (error) return { success: false, error };

          const { obligations } = get();
          set({
            obligations: obligations.map((o) =>
              o.id === id ? { ...o, ...updates } : o
            ),
          });
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      // Eliminar obligacion
      removeObligation: async (id) => {
        try {
          const { error } = await obligationService.deleteObligation(id);
          if (error) return { success: false, error };

          const { obligations } = get();
          set({ obligations: obligations.filter((o) => o.id !== id) });
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      // Marcar como completada
      markCompleted: async (id) => {
        try {
          const { error } = await obligationService.markCompleted(id);
          if (error) return { success: false, error };

          const { obligations } = get();
          set({
            obligations: obligations.map((o) =>
              o.id === id
                ? { ...o, status: "completed" as const, completed_at: new Date().toISOString() }
                : o
            ),
          });
          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      // Verificar vencidas
      checkOverdue: async (userId: string) => {
        const { updated } = await obligationService.checkOverdue(userId);
        if (updated > 0) {
          // Recargar para obtener estados actualizados
          const data = await obligationService.getObligations(userId);
          set({ obligations: data });
        }
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: "secop-obligations-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        obligations: state.obligations,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useObligationsStore;
