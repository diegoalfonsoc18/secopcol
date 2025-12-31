// Servicio de Cache Offline
// Maneja almacenamiento local de datos para funcionamiento sin conexión

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SecopProcess } from "../types/index";

// ============================================
// CONFIGURACIÓN
// ============================================
const CACHE_KEYS = {
  RECENT_PROCESSES: "cache_recent_processes",
  SEARCH_RESULTS: "cache_search_results",
  FAVORITES: "cache_favorites",
  DEPARTMENTS: "cache_departments",
  MUNICIPALITIES: "cache_municipalities",
  LAST_SYNC: "cache_last_sync",
};

const CACHE_EXPIRY = {
  RECENT_PROCESSES: 30 * 60 * 1000, // 30 minutos
  SEARCH_RESULTS: 15 * 60 * 1000, // 15 minutos
  DEPARTMENTS: 24 * 60 * 60 * 1000, // 24 horas
  MUNICIPALITIES: 24 * 60 * 60 * 1000, // 24 horas
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface SearchCacheKey {
  keyword?: string;
  departamento?: string;
  municipio?: string;
  modalidad?: string;
  tipoContrato?: string;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Verifica si hay conexión a internet
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Genera una clave única para búsquedas
 */
const generateSearchKey = (params: SearchCacheKey): string => {
  const parts = [
    params.keyword || "",
    params.departamento || "",
    params.municipio || "",
    params.modalidad || "",
    params.tipoContrato || "",
  ];
  return `${CACHE_KEYS.SEARCH_RESULTS}_${parts.join("_").substring(0, 100)}`;
};

/**
 * Verifica si una entrada de cache ha expirado
 */
const isExpired = <T>(entry: CacheEntry<T>): boolean => {
  return Date.now() > entry.timestamp + entry.expiry;
};

// ============================================
// CACHE GENÉRICO
// ============================================

/**
 * Guarda datos en cache
 */
export const setCache = async <T>(
  key: string,
  data: T,
  expiryMs: number = CACHE_EXPIRY.RECENT_PROCESSES
): Promise<void> => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiryMs,
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error("Error saving to cache:", error);
  }
};

/**
 * Obtiene datos del cache
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);

    // Verificar expiración
    if (isExpired(entry)) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
};

/**
 * Elimina una entrada del cache
 */
export const removeCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from cache:", error);
  }
};

/**
 * Limpia todo el cache
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith("cache_"));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
};

// ============================================
// CACHE DE PROCESOS
// ============================================

/**
 * Guarda procesos recientes en cache
 */
export const cacheRecentProcesses = async (
  processes: SecopProcess[]
): Promise<void> => {
  await setCache(
    CACHE_KEYS.RECENT_PROCESSES,
    processes,
    CACHE_EXPIRY.RECENT_PROCESSES
  );
  await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
};

/**
 * Obtiene procesos recientes del cache
 */
export const getCachedRecentProcesses = async (): Promise<
  SecopProcess[] | null
> => {
  return getCache<SecopProcess[]>(CACHE_KEYS.RECENT_PROCESSES);
};

/**
 * Guarda resultados de búsqueda en cache
 */
export const cacheSearchResults = async (
  params: SearchCacheKey,
  results: SecopProcess[]
): Promise<void> => {
  const key = generateSearchKey(params);
  await setCache(key, results, CACHE_EXPIRY.SEARCH_RESULTS);
};

/**
 * Obtiene resultados de búsqueda del cache
 */
export const getCachedSearchResults = async (
  params: SearchCacheKey
): Promise<SecopProcess[] | null> => {
  const key = generateSearchKey(params);
  return getCache<SecopProcess[]>(key);
};

// ============================================
// CACHE DE DIVIPOLA
// ============================================

/**
 * Guarda departamentos en cache
 */
export const cacheDepartments = async (
  departments: string[]
): Promise<void> => {
  await setCache(CACHE_KEYS.DEPARTMENTS, departments, CACHE_EXPIRY.DEPARTMENTS);
};

/**
 * Obtiene departamentos del cache
 */
export const getCachedDepartments = async (): Promise<string[] | null> => {
  return getCache<string[]>(CACHE_KEYS.DEPARTMENTS);
};

/**
 * Guarda municipios de un departamento en cache
 */
export const cacheMunicipalities = async (
  departamento: string,
  municipalities: string[]
): Promise<void> => {
  const key = `${CACHE_KEYS.MUNICIPALITIES}_${departamento}`;
  await setCache(key, municipalities, CACHE_EXPIRY.MUNICIPALITIES);
};

/**
 * Obtiene municipios del cache
 */
export const getCachedMunicipalities = async (
  departamento: string
): Promise<string[] | null> => {
  const key = `${CACHE_KEYS.MUNICIPALITIES}_${departamento}`;
  return getCache<string[]>(key);
};

// ============================================
// INFORMACIÓN DEL CACHE
// ============================================

export interface CacheInfo {
  lastSync: string | null;
  isOnline: boolean;
  recentProcessesCount: number;
  cacheSize: string;
}

/**
 * Obtiene información sobre el estado del cache
 */
export const getCacheInfo = async (): Promise<CacheInfo> => {
  try {
    const [lastSync, online, recentProcesses, allKeys] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC),
      isOnline(),
      getCachedRecentProcesses(),
      AsyncStorage.getAllKeys(),
    ]);

    // Calcular tamaño aproximado
    const cacheKeys = allKeys.filter((k) => k.startsWith("cache_"));
    let totalSize = 0;
    for (const key of cacheKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) totalSize += value.length;
    }

    const sizeInKB = (totalSize / 1024).toFixed(1);

    return {
      lastSync,
      isOnline: online,
      recentProcessesCount: recentProcesses?.length || 0,
      cacheSize: `${sizeInKB} KB`,
    };
  } catch {
    return {
      lastSync: null,
      isOnline: false,
      recentProcessesCount: 0,
      cacheSize: "0 KB",
    };
  }
};

/**
 * Obtiene la fecha de la última sincronización
 */
export const getLastSyncDate = async (): Promise<Date | null> => {
  try {
    const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return lastSync ? new Date(lastSync) : null;
  } catch {
    return null;
  }
};

/**
 * Formatea la fecha de última sincronización
 */
export const formatLastSync = async (): Promise<string> => {
  const lastSync = await getLastSyncDate();
  if (!lastSync) return "Nunca sincronizado";

  const now = new Date();
  const diffMs = now.getTime() - lastSync.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Hace un momento";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;

  return lastSync.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Guarda el tiempo de última sincronización
 */
export const setLastSyncTime = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error("Error saving last sync time:", error);
  }
};

/**
 * Obtiene tiempo desde última sincronización (alias de formatLastSync)
 */
export const getTimeSinceLastSync = formatLastSync;

export default {
  isOnline,
  setCache,
  getCache,
  removeCache,
  clearAllCache,
  cacheRecentProcesses,
  getCachedRecentProcesses,
  cacheSearchResults,
  getCachedSearchResults,
  cacheDepartments,
  getCachedDepartments,
  cacheMunicipalities,
  getCachedMunicipalities,
  getCacheInfo,
  getLastSyncDate,
  formatLastSync,
  setLastSyncTime,
  getTimeSinceLastSync,
};
