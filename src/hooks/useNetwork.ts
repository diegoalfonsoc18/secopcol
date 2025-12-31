// Hook para manejar estado de conexión y modo offline
import { useState, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  isOnline,
  formatLastSync,
  getCacheInfo,
  CacheInfo,
} from "../services/cacheService";

export interface NetworkState {
  isConnected: boolean;
  isChecking: boolean;
  lastSync: string;
  cacheInfo: CacheInfo | null;
}

export const useNetwork = () => {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isChecking: true,
    lastSync: "Verificando...",
    cacheInfo: null,
  });

  // Verificar conexión
  const checkConnection = useCallback(async () => {
    setState((prev) => ({ ...prev, isChecking: true }));

    const [online, lastSyncStr, cacheInfo] = await Promise.all([
      isOnline(),
      formatLastSync(),
      getCacheInfo(),
    ]);

    setState({
      isConnected: online,
      isChecking: false,
      lastSync: lastSyncStr,
      cacheInfo,
    });

    return online;
  }, []);

  // Verificar al montar y cuando la app vuelve a primer plano
  useEffect(() => {
    checkConnection();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkConnection();
        }
      }
    );

    // Verificar periódicamente cada 30 segundos
    const interval = setInterval(checkConnection, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkConnection]);

  return {
    ...state,
    checkConnection,
    refresh: checkConnection,
  };
};

export default useNetwork;
