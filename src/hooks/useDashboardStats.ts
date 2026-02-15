// src/hooks/useDashboardStats.ts
// Hook para computar estadisticas del dashboard

import { useMemo } from "react";
import { SecopProcess } from "../types/index";
import {
  CONTRACT_TYPES,
  ContractTypeConfig,
} from "../constants/contractTypes";
import { NearbyDepartamento } from "./useLocation";

const CLOSE_RADIUS_KM = 80;

const normalizeDepartamento = (dept: string): string => {
  return dept
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/DISTRITO CAPITAL DE BOGOTA/g, "BOGOTA")
    .replace(/BOGOTA D\.?C\.?/g, "BOGOTA")
    .trim();
};

export interface DashboardStats {
  todayCount: number;
  nearbyCount: number;
  favoriteTypesCount: number;
  todayProcesses: SecopProcess[];
  nearbyProcesses: SecopProcess[];
  favoriteTypeConfigs: ContractTypeConfig[];
}

export function useDashboardStats(
  processes: SecopProcess[],
  nearbyDepartamentos: NearbyDepartamento[],
  selectedContractTypes: string[]
): DashboardStats {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Procesos publicados hoy
    const todayProcesses = processes.filter((p) => {
      const dateStr =
        p.fecha_de_ultima_publicaci || p.fecha_de_publicacion_del;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= today;
    });

    // Departamentos cercanos (80km)
    const closeDepts = nearbyDepartamentos
      .filter((d) => d.distance <= CLOSE_RADIUS_KM)
      .map((d) => normalizeDepartamento(d.departamento));

    const nearbyProcesses =
      closeDepts.length > 0
        ? processes.filter((p) => {
            const dept = normalizeDepartamento(
              p.departamento_entidad || ""
            );
            return closeDepts.some(
              (cd) => dept.includes(cd) || cd.includes(dept)
            );
          })
        : [];

    // Procesos de tipos favoritos
    const favoriteSet = new Set(selectedContractTypes);
    const favoriteProcesses =
      favoriteSet.size > 0
        ? processes.filter((p) => favoriteSet.has(p.tipo_de_contrato || ""))
        : [];

    // Configs de tipos favoritos
    const favoriteTypeConfigs =
      selectedContractTypes.length > 0
        ? selectedContractTypes
            .map((id) => CONTRACT_TYPES.find((t) => t.id === id))
            .filter(Boolean) as ContractTypeConfig[]
        : CONTRACT_TYPES;

    return {
      todayCount: todayProcesses.length,
      nearbyCount: nearbyProcesses.length,
      favoriteTypesCount: favoriteProcesses.length,
      todayProcesses: todayProcesses.slice(0, 5),
      nearbyProcesses: nearbyProcesses.slice(0, 5),
      favoriteTypeConfigs,
    };
  }, [processes, nearbyDepartamentos, selectedContractTypes]);
}
