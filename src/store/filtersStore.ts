import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedFilter {
  id: string;
  name: string;
  createdAt: string;
  filters: {
    keyword?: string;
    departamento?: string;
    municipio?: string;
    modalidades: string[];
    tiposContrato: string[];
  };
}

interface FiltersState {
  savedFilters: SavedFilter[];
  addFilter: (filter: Omit<SavedFilter, "id" | "createdAt">) => void;
  removeFilter: (id: string) => void;
  updateFilter: (id: string, filter: Partial<SavedFilter>) => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      savedFilters: [],

      addFilter: (filter) => {
        const newFilter: SavedFilter = {
          ...filter,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          savedFilters: [newFilter, ...state.savedFilters].slice(0, 10), // Max 10 filtros
        }));
      },

      removeFilter: (id) => {
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.id !== id),
        }));
      },

      updateFilter: (id, updates) => {
        set((state) => ({
          savedFilters: state.savedFilters.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        }));
      },
    }),
    {
      name: "secop-filters-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
