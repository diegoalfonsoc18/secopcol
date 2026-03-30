// src/hooks/useNotificationSetup.ts
// Hook para inicializar notificaciones: permisos y push token.
// Las alertas se chequean solo desde el servidor (edge function + pg_cron).

import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import { requestNotificationPermissions } from "../services/notifications";

export function useNotificationSetup() {
  const { user, savePushToken } = useAuth();
  const initialized = useRef(false);

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
        try {
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId;

          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });

          if (tokenData.data) {
            await savePushToken(tokenData.data);
          } else if (__DEV__) {
            console.warn("Push token NOT saved — notifications will not work");
          }
        } catch (error) {
          if (__DEV__) { console.log("Could not get push token:", error); }
        }

        initialized.current = true;
      } catch (error) {
        if (__DEV__) { console.error("Notification setup error:", error); }
      }
    };

    setup();
  }, [user]);

  // Reset si el usuario cierra sesion
  useEffect(() => {
    if (!user) {
      initialized.current = false;
    }
  }, [user]);
}
