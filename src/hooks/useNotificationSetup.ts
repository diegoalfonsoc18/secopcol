// src/hooks/useNotificationSetup.ts
// Hook para inicializar notificaciones, permisos, push token y background task

import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import {
  requestNotificationPermissions,
  scheduleBackgroundCheck,
} from "../services/notifications";
import {
  saveUserIdForBackground,
  registerBackgroundAlertCheck,
  checkAlertsForUser,
} from "../services/alertBackgroundService";

export function useNotificationSetup() {
  const { user, savePushToken, preferences } = useAuth();
  const initialized = useRef(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user || initialized.current) return;

    const setup = async () => {
      try {
        // 1. Pedir permisos de notificacion
        const granted = await requestNotificationPermissions();
        if (!granted) {
          if (__DEV__) { console.log("Notification permissions not granted"); }
          return;
        }

        // 2. Obtener y guardar push token (siempre actualizar para mantener frescura)
        // IMPORTANTE: await completo antes de registrar background task
        // para que el cron job encuentre el token en la DB
        let tokenSaved = false;
        try {
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId;

          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });

          if (tokenData.data) {
            await savePushToken(tokenData.data);
            tokenSaved = true;
          }
        } catch (error) {
          // Push token puede fallar en desarrollo/simulador, no es critico
          if (__DEV__) { console.log("Could not get push token:", error); }
        }

        if (!tokenSaved && __DEV__) {
          console.warn("Push token NOT saved — notifications will not work");
        }

        // 3. Guardar userId en AsyncStorage para el background task
        await saveUserIdForBackground(user.id);

        // 4. Registrar background fetch (solo despues de guardar token)
        await registerBackgroundAlertCheck();

        // 5. Programar recordatorio diario como fallback (9:00 AM)
        await scheduleBackgroundCheck();

        // 6. Verificacion inmediata al abrir la app
        checkAlertsForUser(user.id).catch((error) => {
          if (__DEV__) { console.error("Initial alert check failed:", error); }
        });

        initialized.current = true;
      } catch (error) {
        if (__DEV__) { console.error("Notification setup error:", error); }
      }
    };

    setup();
  }, [user]);

  // Check alertas al volver a foreground (background → active)
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // La app volvio a foreground — verificar alertas inmediatamente
        checkAlertsForUser(user.id).catch((error) => {
          if (__DEV__) { console.error("Resume alert check failed:", error); }
        });
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [user]);

  // Reset si el usuario cierra sesion
  useEffect(() => {
    if (!user) {
      initialized.current = false;
    }
  }, [user]);
}
