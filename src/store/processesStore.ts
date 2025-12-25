import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SecopProcess,
  getRecentProcesses,
  searchProcesses,
} from "../api/secop";

// ============================================
// TIPOS DEL STORE
// ============================================
interface ProcessesState {
  // Procesos cargados
  processes: SecopProcess[];
  loading: boolean;
  error: string | null;

  // Favoritos (persistidos)
  favorites: SecopProcess[];

  // Filtros seleccionados
  selectedMunicipality: string;
  selectedStatus: string;

  // Acciones de procesos
  fetchRecentProcesses: (limit?: number) => Promise<void>;
  fetchProcesses: (
    municipality?: string,
    status?: string,
    keyword?: string
  ) => Promise<void>;
  setProcesses: (processes: SecopProcess[]) => void;

  // Acciones de favoritos
  addFavorite: (process: SecopProcess) => void;
  removeFavorite: (processId: string) => void;
  isFavorite: (processId: string) => boolean;
  clearFavorites: () => void;

  // Acciones de filtros
  setSelectedMunicipality: (municipality: string) => void;
  setSelectedStatus: (status: string) => void;

  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// ============================================
// STORE CON PERSISTENCIA
// ============================================
export const useProcessesStore = create<ProcessesState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      processes: [],
      loading: false,
      error: null,
      favorites: [],
      selectedMunicipality: "",
      selectedStatus: "",
      _hasHydrated: false,

      // Cargar procesos recientes
      fetchRecentProcesses: async (limit = 20) => {
        set({ loading: true, error: null });
        console.log("📅 Cargando procesos recientes...");
        try {
          const data = await getRecentProcesses(limit);
          set({ processes: data, loading: false });
          console.log(`✅ Procesos recientes cargados: ${data.length}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Error de conexión";
          set({ error: message, loading: false });
          console.error("❌ Error cargando procesos:", message);
        }
      },

      // Buscar procesos con filtros
      fetchProcesses: async (
        municipality?: string,
        status?: string,
        keyword?: string
      ) => {
        set({ loading: true, error: null });
        console.log("🔍 Buscando procesos...", {
          municipality,
          status,
          keyword,
        });
        try {
          const data = await searchProcesses(municipality, status, keyword, 50);
          set({ processes: data, loading: false });
          console.log(`✅ Procesos encontrados: ${data.length}`);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Error de conexión";
          set({ error: message, loading: false });
          console.error("❌ Error buscando procesos:", message);
        }
      },

      setProcesses: (processes: SecopProcess[]) => {
        set({ processes });
      },

      // Acciones de favoritos
      addFavorite: (process: SecopProcess) => {
        const { favorites } = get();
        if (
          !favorites.some((f) => f.id_del_proceso === process.id_del_proceso)
        ) {
          const newFavorites = [process, ...favorites];
          set({ favorites: newFavorites });
          console.log(`❤️ Agregado a favoritos: ${process.id_del_proceso}`);
        }
      },

      removeFavorite: (processId: string) => {
        const { favorites } = get();
        const newFavorites = favorites.filter(
          (f) => f.id_del_proceso !== processId
        );
        set({ favorites: newFavorites });
        console.log(`💔 Eliminado de favoritos: ${processId}`);
      },

      isFavorite: (processId: string) => {
        const { favorites } = get();
        return favorites.some((f) => f.id_del_proceso === processId);
      },

      clearFavorites: () => {
        set({ favorites: [] });
        console.log("🗑️ Favoritos limpiados");
      },

      // Acciones de filtros
      setSelectedMunicipality: (municipality: string) => {
        set({ selectedMunicipality: municipality });
      },

      setSelectedStatus: (status: string) => {
        set({ selectedStatus: status });
      },

      // Acciones de estado
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      // Hydration
      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: "secop-favorites-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistir favoritos
      partialize: (state) => ({
        favorites: state.favorites,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        console.log("💾 Favoritos cargados desde almacenamiento");
      },
    }
  )
);

// Hook para verificar si el store está listo
export const useStoreHydration = () => {
  return useProcessesStore((state) => state._hasHydrated);
};

export default useProcessesStore;
