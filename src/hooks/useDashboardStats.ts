// src/hooks/useDashboardStats.ts
// Hook para computar estadisticas del dashboard

import { useMemo } from "react";
import { SecopProcess } from "../types/index";
import {
  CONTRACT_TYPES,
  ContractTypeConfig,
} from "../constants/contractTypes";

export interface DashboardStats {
  todayNearbyCount: number;
  openCount: number;
  noOffersCount: number;
  todayNearbyProcesses: SecopProcess[];
  openProcesses: SecopProcess[];
  noOffersProcesses: SecopProcess[];
  favoriteTypeConfigs: ContractTypeConfig[];
}

export function useDashboardStats(
  todayNearbyProcesses: SecopProcess[],
  openProcesses: SecopProcess[],
  noOffersProcesses: SecopProcess[],
  selectedContractTypes: string[]
): DashboardStats {
  return useMemo(() => {
    const MAX_DISPLAY = 20;

    // Filtro por tipos favoritos (aplica a todas las secciones)
    const favoriteSet = new Set(selectedContractTypes);
    const filterByFavorites = (list: SecopProcess[]) =>
      favoriteSet.size > 0
        ? list.filter((p) => favoriteSet.has(p.tipo_de_contrato || ""))
        : list;

    // Utilidad para obtener fecha de un proceso
    const getProcessDate = (p: SecopProcess): number =>
      new Date(
        p.fecha_de_ultima_publicaci || p.fecha_de_publicacion_del || 0
      ).getTime();

    const sortByDate = (list: SecopProcess[]) =>
      [...list].sort((a, b) => getProcessDate(b) - getProcessDate(a));

    const baseTodayNearby = sortByDate(filterByFavorites(todayNearbyProcesses));
    const baseOpen = sortByDate(filterByFavorites(openProcesses));
    const baseNoOffers = sortByDate(filterByFavorites(noOffersProcesses));

    // Configs de tipos favoritos
    const favoriteTypeConfigs =
      selectedContractTypes.length > 0
        ? selectedContractTypes
            .map((id) => CONTRACT_TYPES.find((t) => t.id === id))
            .filter(Boolean) as ContractTypeConfig[]
        : CONTRACT_TYPES;

    return {
      todayNearbyCount: baseTodayNearby.length,
      openCount: baseOpen.length,
      noOffersCount: baseNoOffers.length,
      todayNearbyProcesses: baseTodayNearby.slice(0, MAX_DISPLAY),
      openProcesses: baseOpen.slice(0, MAX_DISPLAY),
      noOffersProcesses: baseNoOffers.slice(0, MAX_DISPLAY),
      favoriteTypeConfigs,
    };
  }, [todayNearbyProcesses, openProcesses, noOffersProcesses, selectedContractTypes]);
}
