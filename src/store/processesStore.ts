import { create } from "zustand";
import {
  SecopProcess,
  getRecentProcesses,
  searchProcesses,
} from "../api/secop";

interface ProcessesStore {
  // Estado
  processes: SecopProcess[];
  favorites: SecopProcess[];
  loading: boolean;
  error: string | null;
  selectedMunicipality: string;
  selectedStatus: string;

  // Acciones
  setProcesses: (processes: SecopProcess[]) => void;
  addFavorite: (process: SecopProcess) => void;
  removeFavorite: (processId: string) => void;
  isFavorite: (processId: string) => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedMunicipality: (municipality: string) => void;
  setSelectedStatus: (status: string) => void;

  // Acciones async
  fetchProcesses: (
    municipality?: string,
    status?: string,
    keyword?: string
  ) => Promise<void>;
  fetchRecentProcesses: (days?: number) => Promise<void>;
  clearFilters: () => void;
}

export const useProcessesStore = create<ProcessesStore>((set, get) => ({
  // Estado inicial
  processes: [],
  favorites: [],
  loading: false,
  error: null,
  selectedMunicipality: "",
  selectedStatus: "",

  // Acciones síncronas
  setProcesses: (processes) => set({ processes }),

  addFavorite: (process) =>
    set((state) => ({
      favorites: [...state.favorites, process],
    })),

  removeFavorite: (processId) =>
    set((state) => ({
      favorites: state.favorites.filter((p) => p.id_proceso !== processId),
    })),

  isFavorite: (processId) => {
    const state = get();
    return state.favorites.some((p) => p.id_proceso === processId);
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setSelectedMunicipality: (municipality) =>
    set({ selectedMunicipality: municipality }),

  setSelectedStatus: (status) => set({ selectedStatus: status }),

  // Acciones asincrónicas
  fetchProcesses: async (
    municipality?: string,
    status?: string,
    keyword?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const data = await searchProcesses(municipality, status, keyword);
      set({ processes: data });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecentProcesses: async (days = 7) => {
    set({ loading: true, error: null });
    try {
      const data = await getRecentProcesses(days);
      set({ processes: data });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  clearFilters: () =>
    set({
      selectedMunicipality: "",
      selectedStatus: "",
      processes: [],
    }),
}));
