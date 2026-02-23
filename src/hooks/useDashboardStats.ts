// src/hooks/useDashboardStats.ts
// Hook para computar estadisticas del dashboard

import { useMemo } from "react";
import { SecopProcess } from "../types/index";
import {
  CONTRACT_TYPES,
  ContractTypeConfig,
} from "../constants/contractTypes";

export interface DashboardStats {
  recentCount: number;
  nearbyCount: number;
  todayCount: number;
  recentProcesses: SecopProcess[];
  nearbyProcesses: SecopProcess[];
  favoriteTypeConfigs: ContractTypeConfig[];
}

export function useDashboardStats(
  processes: SecopProcess[],
  municipioProcesses: SecopProcess[],
  selectedContractTypes: string[]
): DashboardStats {
  return useMemo(() => {
    const MIN_RECENT = 20;
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    eightDaysAgo.setHours(0, 0, 0, 0);

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // Filtro por tipos favoritos (aplica a todas las secciones)
    const favoriteSet = new Set(selectedContractTypes);
    const filterByFavorites = (list: SecopProcess[]) =>
      favoriteSet.size > 0
        ? list.filter((p) => favoriteSet.has(p.tipo_de_contrato || ""))
        : list;

    const baseProcesses = filterByFavorites(processes);
    const baseNearby = filterByFavorites(municipioProcesses);

    // Utilidad para obtener fecha de un proceso
    const getProcessDate = (p: SecopProcess): number =>
      new Date(
        p.fecha_de_ultima_publicaci || p.fecha_de_publicacion_del || 0
      ).getTime();

    const sortedProcesses = [...baseProcesses].sort(
      (a, b) => getProcessDate(b) - getProcessDate(a)
    );

    // Procesos recientes (minimo 20, amplia rango si faltan)
    const recentFromLastDays = sortedProcesses.filter((p) => {
      const dateStr =
        p.fecha_de_ultima_publicaci || p.fecha_de_publicacion_del;
      if (!dateStr) return false;
      return new Date(dateStr) >= eightDaysAgo;
    });

    const recentProcesses =
      recentFromLastDays.length >= MIN_RECENT
        ? recentFromLastDays
        : sortedProcesses.slice(0, Math.max(MIN_RECENT, recentFromLastDays.length));

    // Procesos publicados hoy
    const todayProcesses = sortedProcesses.filter((p) => {
      const dateStr =
        p.fecha_de_ultima_publicaci || p.fecha_de_publicacion_del;
      if (!dateStr) return false;
      return new Date(dateStr) >= todayMidnight;
    });

    // Procesos del municipio del usuario (ya vienen de la API, solo ordenar)
    const nearbyProcesses = [...baseNearby].sort(
      (a, b) => getProcessDate(b) - getProcessDate(a)
    );

    // Configs de tipos favoritos
    const favoriteTypeConfigs =
      selectedContractTypes.length > 0
        ? selectedContractTypes
            .map((id) => CONTRACT_TYPES.find((t) => t.id === id))
            .filter(Boolean) as ContractTypeConfig[]
        : CONTRACT_TYPES;

    return {
      recentCount: recentProcesses.length,
      nearbyCount: nearbyProcesses.length,
      todayCount: todayProcesses.length,
      recentProcesses: recentProcesses.slice(0, MIN_RECENT),
      nearbyProcesses: nearbyProcesses.slice(0, MIN_RECENT),
      favoriteTypeConfigs,
    };
  }, [processes, municipioProcesses, selectedContractTypes]);
}
