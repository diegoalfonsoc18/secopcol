import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecopProcess, getRecentProcesses, advancedSearch } from "../api/secop";
import {
  cacheRecentProcesses,
  getCachedRecentProcesses,
  cacheSearchResults,
  getCachedSearchResults,
  setLastSyncTime,
  getTimeSinceLastSync,
} from "../services/cacheService";

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

  // Estado offline
  isOffline: boolean;
  isFromCache: boolean;
  lastSync: string;

  // Filtros seleccionados
  selectedMunicipality: string;
  selectedStatus: string;

  // Acciones de procesos
  fetchRecentProcesses: (
    limit?: number,
    forceRefresh?: boolean
  ) => Promise<void>;
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
  setIsOffline: (isOffline: boolean) => void;
  updateLastSync: () => Promise<void>;

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
      isOffline: false,
      isFromCache: false,
      lastSync: "Nunca",
      selectedMunicipality: "",
      selectedStatus: "",
      _hasHydrated: false,

      // Cargar procesos recientes (con cache)
      fetchRecentProcesses: async (limit = 20, forceRefresh = false) => {
        set({ loading: true, error: null });

        // Intentar cargar desde cache primero si no forzamos refresh
        if (!forceRefresh) {
          const cached = await getCachedRecentProcesses();
          if (cached && cached.length > 0) {
            const lastSyncText = await getTimeSinceLastSync();
            set({
              processes: cached,
              loading: false,
              isFromCache: true,
              lastSync: lastSyncText,
            });
            // Continuar en background para actualizar
          }
        }

        try {
          const data = await getRecentProcesses(limit);

          // Guardar en cache
          await cacheRecentProcesses(data);
          await setLastSyncTime();
          const lastSyncText = await getTimeSinceLastSync();

          set({
            processes: data,
            loading: false,
            isFromCache: false,
            isOffline: false,
            lastSync: lastSyncText,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Error de conexión";

          // Si hay error, intentar cargar cache
          const cached = await getCachedRecentProcesses();
          if (cached && cached.length > 0) {
            const lastSyncText = await getTimeSinceLastSync();
            set({
              processes: cached,
              loading: false,
              isFromCache: true,
              isOffline: true,
              lastSync: lastSyncText,
              error: null,
            });
          } else {
            set({
              error: message,
              loading: false,
              isOffline: true,
            });
          }
          console.error("❌ Error cargando procesos:", message);
        }
      },

      // Buscar procesos con filtros (con cache)
      fetchProcesses: async (
        municipality?: string,
        status?: string,
        keyword?: string
      ) => {
        set({ loading: true, error: null });

        const searchQuery = {
          municipio: municipality,
          tipoContrato: status,
          keyword: keyword,
        };

        // Intentar cache primero
        const cached = await getCachedSearchResults(searchQuery);
        if (cached && cached.length > 0) {
          set({
            processes: cached,
            loading: false,
            isFromCache: true,
          });
        }

        try {
          const data = await advancedSearch({
            municipio: municipality,
            fase: status,
            keyword: keyword,
            limit: 50,
          });

          // Guardar en cache
          await cacheSearchResults(searchQuery, data);

          set({
            processes: data,
            loading: false,
            isFromCache: false,
            isOffline: false,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Error de conexión";

          // Si no hay cache previo, mostrar error
          if (!cached || cached.length === 0) {
            set({
              error: message,
              loading: false,
              isOffline: true,
            });
          } else {
            set({
              loading: false,
              isOffline: true,
            });
          }
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
        }
      },

      removeFavorite: (processId: string) => {
        const { favorites } = get();
        const newFavorites = favorites.filter(
          (f) => f.id_del_proceso !== processId
        );
        set({ favorites: newFavorites });
      },

      isFavorite: (processId: string) => {
        const { favorites } = get();
        return favorites.some((f) => f.id_del_proceso === processId);
      },

      clearFavorites: () => {
        set({ favorites: [] });
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

      setIsOffline: (isOffline: boolean) => {
        set({ isOffline });
      },

      updateLastSync: async () => {
        const lastSyncText = await getTimeSinceLastSync();
        set({ lastSync: lastSyncText });
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
      },
    }
  )
);

// Hook para verificar si el store está listo
export const useStoreHydration = () => {
  return useProcessesStore((state) => state._hasHydrated);
};

export default useProcessesStore;
