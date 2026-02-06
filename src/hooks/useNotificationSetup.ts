// src/hooks/useNotificationSetup.ts
// Hook para inicializar notificaciones, permisos, push token y background task

import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import { requestNotificationPermissions } from "../services/notifications";
import {
  saveUserIdForBackground,
  registerBackgroundAlertCheck,
  checkAlertsForUser,
} from "../services/alertBackgroundService";

export function useNotificationSetup() {
  const { user, savePushToken, preferences } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (!user || initialized.current) return;

    const setup = async () => {
      try {
        // 1. Pedir permisos de notificacion
        const granted = await requestNotificationPermissions();
        if (!granted) {
          console.log("Notification permissions not granted");
          return;
        }

        // 2. Obtener y guardar push token
        try {
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId;

          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });

          if (tokenData.data) {
            await savePushToken(tokenData.data);
          }
        } catch (error) {
          // Push token puede fallar en desarrollo/simulador, no es critico
          console.log("Could not get push token:", error);
        }

        // 3. Guardar userId en AsyncStorage para el background task
        await saveUserIdForBackground(user.id);

        // 4. Registrar background fetch
        await registerBackgroundAlertCheck();

        // 5. Verificacion inmediata al abrir la app
        checkAlertsForUser(user.id).catch((error) =>
          console.error("Initial alert check failed:", error)
        );

        initialized.current = true;
      } catch (error) {
        console.error("Notification setup error:", error);
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
